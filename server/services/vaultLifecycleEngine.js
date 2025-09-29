import Database from '../database.js';

class VaultLifecycleEngine {
  constructor(database, io, monitoring = null, onTransition = null) {
    this.db = database;
    this.io = io;
    this.monitoring = monitoring;
    this.onTransition = onTransition; // Callback for post-transition actions
    this.isRunning = false;
    this.checkInterval = null;
    
    // Vault status constants
    this.VAULT_STATUS = {
      DRAFT: 'draft',
      PRE_ICO: 'pre_ico',
      PRE_ICO_SCHEDULED: 'pre_ico_scheduled', 
      ICO: 'ico',
      PENDING: 'pending',
      PRELAUNCH: 'prelaunch',
      ACTIVE: 'active',
      WINNER_CONFIRMATION: 'winner_confirmation',
      ENDGAME_PROCESSING: 'endgame_processing',
      REFUND_REQUIRED: 'refund_required',
      COMPLETED: 'completed',
      EXTINCT: 'extinct'
    };
    
    // Status transition rules
    this.TRANSITION_RULES = {
      [this.VAULT_STATUS.DRAFT]: {
        to: [this.VAULT_STATUS.PRE_ICO],
        trigger: 'manual', // Admin action
        conditions: ['hasBasicInfo', 'hasTokenMint']
      },
      [this.VAULT_STATUS.PRE_ICO]: {
        to: [this.VAULT_STATUS.ICO],
        trigger: 'time', // ICO start date reached
        conditions: ['icoProposedAt', 'icoStartTimeReached']
      },
      [this.VAULT_STATUS.ICO]: {
        to: [this.VAULT_STATUS.PENDING, this.VAULT_STATUS.REFUND_REQUIRED],
        trigger: 'time', // ICO end date reached
        conditions: ['icoEndTimeReached'],
        logic: 'checkICOThreshold'
      },
      [this.VAULT_STATUS.PENDING]: {
        to: [this.VAULT_STATUS.PRELAUNCH],
        trigger: 'manual', // Admin launches Stage 2
        conditions: ['stage2Completed']
      },
      [this.VAULT_STATUS.PRELAUNCH]: {
        to: [this.VAULT_STATUS.ACTIVE],
        trigger: 'time', // Launch date reached
        conditions: ['vaultLaunchDateReached']
      },
      [this.VAULT_STATUS.ACTIVE]: {
        to: [this.VAULT_STATUS.WINNER_CONFIRMATION, this.VAULT_STATUS.ENDGAME_PROCESSING],
        trigger: 'time', // Timer expires or end date reached
        conditions: ['timerExpired', 'endgameDateReached'],
        logic: 'checkTimerStatus'
      },
      [this.VAULT_STATUS.WINNER_CONFIRMATION]: {
        to: [this.VAULT_STATUS.ENDGAME_PROCESSING],
        trigger: 'time', // Winner claim period expires
        conditions: ['winnerClaimPeriodExpired']
      },
      [this.VAULT_STATUS.ENDGAME_PROCESSING]: {
        to: [this.VAULT_STATUS.COMPLETED, this.VAULT_STATUS.EXTINCT],
        trigger: 'manual', // Admin processes endgame
        conditions: ['endgameProcessed'],
        logic: 'processEndgame'
      },
      [this.VAULT_STATUS.REFUND_REQUIRED]: {
        to: [this.VAULT_STATUS.COMPLETED],
        trigger: 'manual', // Admin processes refunds
        conditions: ['refundsProcessed']
      },
      [this.VAULT_STATUS.COMPLETED]: {
        to: [this.VAULT_STATUS.EXTINCT],
        trigger: 'time', // Cleanup period
        conditions: ['cleanupPeriodExpired']
      }
    };
  }

  // Start the lifecycle engine
  start() {
    if (this.isRunning) {
      if (this.monitoring) {
        this.monitoring.log('warn', 'Vault lifecycle engine is already running');
      } else {
        console.log('⚠️ Vault lifecycle engine is already running');
      }
      return;
    }

    if (this.monitoring) {
      this.monitoring.log('info', 'Starting vault lifecycle engine');
    } else {
      console.log('🚀 Starting vault lifecycle engine...');
    }
    this.isRunning = true;
    
    // Check every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkAllVaults();
    }, 30000);
    
    // Initial check
    this.checkAllVaults();
  }

  // Stop the lifecycle engine
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Vault lifecycle engine is not running');
      return;
    }

    console.log('🛑 Stopping vault lifecycle engine...');
    this.isRunning = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Check all vaults for status transitions
  async checkAllVaults() {
    try {
      const vaults = await this.db.getAllVaults();
      console.log(`🔍 Checking ${vaults.length} vaults for status transitions...`);
      
      for (const vault of vaults) {
        await this.checkVaultTransitions(vault);
      }
    } catch (error) {
      console.error('❌ Error checking vault transitions:', error);
    }
  }

  // Check a single vault for possible transitions
  async checkVaultTransitions(vault) {
    try {
      const currentStatus = vault.status;
      const rules = this.TRANSITION_RULES[currentStatus];
      
      if (!rules) {
        console.log(`⚠️ No transition rules found for status: ${currentStatus}`);
        return;
      }

      // Check each possible transition
      for (const targetStatus of rules.to) {
        const canTransition = await this.canTransition(vault, currentStatus, targetStatus, rules);
        
        if (canTransition) {
          await this.transitionVault(vault, targetStatus, rules);
          break; // Only transition to one status at a time
        }
      }
    } catch (error) {
      console.error(`❌ Error checking transitions for vault ${vault.id}:`, error);
    }
  }

  // Check if a vault can transition to a new status
  async canTransition(vault, currentStatus, targetStatus, rules) {
    const now = new Date();
    const meta = vault.meta || {};

    // Check basic conditions
    for (const condition of rules.conditions) {
      const conditionMet = await this.checkCondition(vault, condition, now, meta);
      if (!conditionMet) {
        return false;
      }
    }

    // Check custom logic if defined
    if (rules.logic) {
      const logicResult = await this.executeLogic(vault, rules.logic, targetStatus);
      if (!logicResult) {
        return false;
      }
    }

    return true;
  }

  // Check individual conditions
  async checkCondition(vault, condition, now, meta) {
    switch (condition) {
      case 'hasBasicInfo':
        return vault.name && vault.description && vault.tokenMint;
      
      case 'hasTokenMint':
        return vault.tokenMint && vault.tokenMint.length > 0;
      
      case 'icoProposedAt':
        return meta.icoProposedAt;
      
      case 'icoStartTimeReached':
        return meta.icoProposedAt && now >= new Date(meta.icoProposedAt);
      
      case 'icoEndTimeReached':
        return meta.icoEndTime && now >= new Date(meta.icoEndTime);
      
      case 'stage2Completed':
        return meta.stage2 && meta.stage2.completed;
      
      case 'vaultLaunchDateReached':
        const launchDate = meta.stage2?.vaultLaunchDate || vault.startDate;
        return launchDate && now >= new Date(launchDate);
      
      case 'timerExpired':
        return vault.currentTimerEndsAt && now >= new Date(vault.currentTimerEndsAt);
      
      case 'endgameDateReached':
        return vault.endgameDate && now >= new Date(vault.endgameDate);
      
      case 'winnerClaimPeriodExpired':
        const claimPeriod = meta.winnerClaimPeriod || 7 * 24 * 60 * 60 * 1000; // 7 days default
        const winnerDeclaredAt = meta.winnerDeclaredAt;
        return winnerDeclaredAt && now >= new Date(new Date(winnerDeclaredAt).getTime() + claimPeriod);
      
      case 'endgameProcessed':
        return meta.endgameProcessed;
      
      case 'refundsProcessed':
        return meta.refundsProcessed;
      
      case 'cleanupPeriodExpired':
        const cleanupPeriod = meta.cleanupPeriod || 30 * 24 * 60 * 60 * 1000; // 30 days default
        const completedAt = meta.completedAt;
        return completedAt && now >= new Date(new Date(completedAt).getTime() + cleanupPeriod);
      
      default:
        console.log(`⚠️ Unknown condition: ${condition}`);
        return false;
    }
  }

  // Execute custom logic for transitions
  async executeLogic(vault, logic, targetStatus) {
    switch (logic) {
      case 'checkICOThreshold':
        return await this.checkICOThreshold(vault, targetStatus);
      
      case 'checkTimerStatus':
        return await this.checkTimerStatus(vault, targetStatus);
      
      case 'processEndgame':
        return await this.processEndgame(vault, targetStatus);
      
      default:
        console.log(`⚠️ Unknown logic: ${logic}`);
        return false;
    }
  }

  // Check if ICO met threshold requirements
  async checkICOThreshold(vault, targetStatus) {
    const meta = vault.meta || {};
    const thresholdUsd = meta.icoThresholdUsd || 10000; // Default $10k threshold
    
    if (targetStatus === this.VAULT_STATUS.PENDING) {
      // Check if threshold was met
      return (vault.totalVolume || 0) >= thresholdUsd;
    } else if (targetStatus === this.VAULT_STATUS.REFUND_REQUIRED) {
      // Threshold not met, refund required
      return (vault.totalVolume || 0) < thresholdUsd;
    }
    
    return false;
  }

  // Check timer status for active vaults
  async checkTimerStatus(vault, targetStatus) {
    const now = new Date();
    
    if (targetStatus === this.VAULT_STATUS.WINNER_CONFIRMATION) {
      // Timer expired, check if there was a winner
      return vault.currentTimerEndsAt && now >= new Date(vault.currentTimerEndsAt);
    } else if (targetStatus === this.VAULT_STATUS.ENDGAME_PROCESSING) {
      // End date reached regardless of timer
      return vault.endgameDate && now >= new Date(vault.endgameDate);
    }
    
    return false;
  }

  // Process endgame logic
  async processEndgame(vault, targetStatus) {
    const meta = vault.meta || {};
    
    if (targetStatus === this.VAULT_STATUS.COMPLETED) {
      // Check if there was a winner and they claimed
      return meta.winnerDeclared && meta.winnerClaimed;
    } else if (targetStatus === this.VAULT_STATUS.EXTINCT) {
      // No winner or winner didn't claim
      return !meta.winnerDeclared || !meta.winnerClaimed;
    }
    
    return false;
  }

  // Transition a vault to a new status
  async transitionVault(vault, newStatus, rules) {
    try {
      const now = new Date();
      const meta = vault.meta || {};
      
      if (this.monitoring) {
        this.monitoring.logVaultTransition(vault.id, vault.status, newStatus);
      } else {
        console.log(`🔄 Transitioning vault ${vault.id} from ${vault.status} to ${newStatus}`);
      }
      
      // Prepare update data
      const updateData = {
        status: newStatus,
        updatedAt: now.toISOString()
      };
      
      // Add status-specific metadata
      switch (newStatus) {
        case this.VAULT_STATUS.ICO:
          updateData.meta = {
            ...meta,
            icoStartedAt: now.toISOString(),
            icoEndTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
          };
          break;
          
        case this.VAULT_STATUS.PENDING:
          updateData.meta = {
            ...meta,
            icoCompletedAt: now.toISOString(),
            thresholdMet: true
          };
          break;
          
        case this.VAULT_STATUS.REFUND_REQUIRED:
          updateData.meta = {
            ...meta,
            icoCompletedAt: now.toISOString(),
            thresholdMet: false,
            refundRequired: true
          };
          break;
          
        case this.VAULT_STATUS.ACTIVE:
          updateData.meta = {
            ...meta,
            vaultLaunchedAt: now.toISOString(),
            timerStartedAt: now.toISOString(),
            currentTimerEndsAt: new Date(now.getTime() + (vault.timerDuration || 3600) * 1000).toISOString()
          };
          break;
          
        case this.VAULT_STATUS.WINNER_CONFIRMATION:
          updateData.meta = {
            ...meta,
            timerExpiredAt: now.toISOString(),
            winnerDeclaredAt: now.toISOString(),
            winnerAddress: vault.lastPurchaseSignature ? await this.getLastBuyerAddress(vault) : null
          };
          break;
          
        case this.VAULT_STATUS.ENDGAME_PROCESSING:
          updateData.meta = {
            ...meta,
            endgameStartedAt: now.toISOString()
          };
          break;
          
        case this.VAULT_STATUS.COMPLETED:
          updateData.meta = {
            ...meta,
            completedAt: now.toISOString(),
            endgameProcessed: true
          };
          break;
          
        case this.VAULT_STATUS.EXTINCT:
          updateData.meta = {
            ...meta,
            extinctAt: now.toISOString(),
            endgameProcessed: true
          };
          break;
      }
      
      // Update the vault
      await this.db.updateVault(vault.id, updateData);
      
      // Emit real-time update
      this.io.emit('vaultStatusUpdated', {
        vaultId: vault.id,
        status: newStatus,
        timestamp: now.toISOString(),
        meta: updateData.meta
      });
      
      console.log(`✅ Vault ${vault.id} successfully transitioned to ${newStatus}`);
      
      // Call post-transition callback if provided
      if (this.onTransition) {
        try {
          await this.onTransition(vault.id, vault.status, newStatus, updateData.meta);
        } catch (error) {
          console.error(`❌ Error in post-transition callback for vault ${vault.id}:`, error);
        }
      }
      
      // Log the transition
      await this.logTransition(vault.id, vault.status, newStatus, updateData.meta);
      
    } catch (error) {
      console.error(`❌ Error transitioning vault ${vault.id}:`, error);
    }
  }

  // Get the last buyer address from transaction signature
  async getLastBuyerAddress(vault) {
    // This would need to be implemented based on your transaction parsing logic
    // For now, return null
    return null;
  }

  // Log vault transitions for audit trail
  async logTransition(vaultId, fromStatus, toStatus, meta) {
    console.log(`📝 Vault ${vaultId} transition: ${fromStatus} → ${toStatus}`, {
      timestamp: new Date().toISOString(),
      meta: meta
    });
    
    // In a production system, you'd want to store this in a separate audit table
    // For now, we'll just log it
  }

  // Manual transition method for admin use
  async manualTransition(vaultId, newStatus, reason = 'Manual admin transition') {
    try {
      const vault = await this.db.getVault(vaultId);
      if (!vault) {
        throw new Error(`Vault ${vaultId} not found`);
      }

      const rules = this.TRANSITION_RULES[vault.status];
      if (!rules || !rules.to.includes(newStatus)) {
        throw new Error(`Invalid transition from ${vault.status} to ${newStatus}`);
      }

      console.log(`🔧 Manual transition: ${vaultId} from ${vault.status} to ${newStatus} - ${reason}`);
      
      await this.transitionVault(vault, newStatus, rules);
      
      return { success: true, message: `Vault ${vaultId} transitioned to ${newStatus}` };
    } catch (error) {
      console.error(`❌ Manual transition failed:`, error);
      return { success: false, error: error.message };
    }
  }

  // Get vault lifecycle status
  getVaultLifecycleStatus(vault) {
    const meta = vault.meta || {};
    const now = new Date();
    
    return {
      currentStatus: vault.status,
      nextPossibleTransitions: this.TRANSITION_RULES[vault.status]?.to || [],
      timeUntilNextTransition: this.getTimeUntilNextTransition(vault, meta, now),
      isTransitionPending: this.isTransitionPending(vault, meta, now),
      lifecycleProgress: this.getLifecycleProgress(vault.status)
    };
  }

  // Get time until next possible transition
  getTimeUntilNextTransition(vault, meta, now) {
    const rules = this.TRANSITION_RULES[vault.status];
    if (!rules || rules.trigger !== 'time') {
      return null;
    }

    // Check time-based conditions
    if (vault.status === this.VAULT_STATUS.PRE_ICO && meta.icoProposedAt) {
      return new Date(meta.icoProposedAt) - now;
    }
    
    if (vault.status === this.VAULT_STATUS.ICO && meta.icoEndTime) {
      return new Date(meta.icoEndTime) - now;
    }
    
    if (vault.status === this.VAULT_STATUS.PRELAUNCH && meta.stage2?.vaultLaunchDate) {
      return new Date(meta.stage2.vaultLaunchDate) - now;
    }
    
    if (vault.status === this.VAULT_STATUS.ACTIVE && vault.currentTimerEndsAt) {
      return new Date(vault.currentTimerEndsAt) - now;
    }
    
    if (vault.status === this.VAULT_STATUS.ACTIVE && vault.endgameDate) {
      return new Date(vault.endgameDate) - now;
    }

    return null;
  }

  // Check if a transition is pending
  isTransitionPending(vault, meta, now) {
    const timeUntil = this.getTimeUntilNextTransition(vault, meta, now);
    return timeUntil !== null && timeUntil <= 0;
  }

  // Get lifecycle progress percentage
  getLifecycleProgress(status) {
    const statusOrder = [
      this.VAULT_STATUS.DRAFT,
      this.VAULT_STATUS.PRE_ICO,
      this.VAULT_STATUS.ICO,
      this.VAULT_STATUS.PENDING,
      this.VAULT_STATUS.PRELAUNCH,
      this.VAULT_STATUS.ACTIVE,
      this.VAULT_STATUS.WINNER_CONFIRMATION,
      this.VAULT_STATUS.ENDGAME_PROCESSING,
      this.VAULT_STATUS.COMPLETED,
      this.VAULT_STATUS.EXTINCT
    ];
    
    const index = statusOrder.indexOf(status);
    return index >= 0 ? Math.round((index / (statusOrder.length - 1)) * 100) : 0;
  }
}

export default VaultLifecycleEngine;
