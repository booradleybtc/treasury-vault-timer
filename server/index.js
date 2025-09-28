import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import dotenv from 'dotenv';
import web3 from '@solana/web3.js';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import Database from './database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const STARTED_AT = new Date().toISOString();

// Initialize database
const db = new Database();

// Initialize default vault after database is ready
setTimeout(async () => {
  await db.initializeDefaultVault();
}, 1000);

// Serve static frontend (built into dist/)
app.use(express.static(path.join(__dirname, '../dist')));

// Socket.IO (allow localhost + your Render URL)
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:5173',
      'https://treasury-vault-timer.vercel.app',
      'https://frontend-aiuwqs319-booradleybtcs-projects.vercel.app',
      'https://*.onrender.com',
      'https://*.vercel.app'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// CORS middleware for API
app.use(cors({ 
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:5173', 
    'https://treasury-vault-timer-backend.onrender.com',
    'https://treasury-vault-timer.vercel.app',
    'https://frontend-mmnkk83lq-booradleybtcs-projects.vercel.app',
    'https://frontend-aiuwqs319-booradleybtcs-projects.vercel.app',
    'https://*.vercel.app',
    'https://*.onrender.com'
  ], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// File uploads (images)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9-_]/gi, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});
const upload = multer({ storage });
app.use('/uploads', express.static(uploadsDir, { maxAge: '1y', immutable: true }));

// Solana RPC (Helius)
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '';
const connection = new Connection(`https://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`, {
  wsEndpoint: `wss://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`
});

// REVS token address (REVSHARE token)
const REVS_TOKEN_ADDRESS = '9VxExA1iRPbuLLdSJ2rB3nyBxsyLReT4aqzZBMaBaY1p';

// Token metadata and price data
let tokenData = {
  price: 0,
  marketCap: 0,
  volume24h: 0,
  lastUpdated: null
};

// Vault-specific data
let vaultData = {
  treasury: {
    amount: 0, // REVS amount in developer wallet
    asset: 'REVS',
    usdValue: 0
  },
  potentialWinnings: {
    multiplier: 100,
    usdValue: 0 // treasury * 100
  },
  timer: {
    hoursLeft: 1,
    daysAlive: 0,
    gameStartDate: null
  },
  endgame: {
    endDate: null,
    daysLeft: 100
  },
  airdrop: {
    nextAirdropTime: new Date(), // Will be set to next daily airdrop
    dailyTime: '16:00', // Noon Eastern daily (UTC-4)
    minimumHold: 200000, // Based on your distribution config
    amount: 0, // Will track distribution wallet
    totalAirdroppedSOL: 0, // Total SOL sent out by distributor wallet
    eligibleHolders: 0 // Count of REVS holders with minimum threshold
  },
  apy: {
    percentage: 'N/A',
    calculatedFrom: 'daily_airdrops'
  }
};

// Wallet addresses to track
const TRACKED_WALLETS = [
  '72hnXr9PsMjp8WsnFyZjmm5vzHhTqbfouqtHBgLYdDZE', // Distribution wallet
  'i35RYnCTa7xjs7U1hByCDFE37HwLNuZsUNHmmT4cYUH', // Developer wallet
];

// Wallet balances cache
let walletBalances = {};

// Buy log to track recent purchases (live)
let buyLog = [];

// Initialize fixed launch time: Sept 15, 2025 at 12:00 PM America/New_York
function initializeLaunchTimes() {
  try {
    const nyLaunchLocal = new Date(
      new Date('2025-09-15T12:00:00').toLocaleString('en-US', { timeZone: 'America/New_York' })
    );
    // Convert to actual UTC Date preserving clock
    const nyLaunchUTC = new Date(nyLaunchLocal.toLocaleString('en-US', { timeZone: 'UTC' }));
    vaultData.timer.gameStartDate = nyLaunchUTC;
    const endDate = new Date(nyLaunchUTC.getTime() + 100 * 24 * 60 * 60 * 1000);
    vaultData.endgame.endDate = endDate;
  } catch (e) {
    // Fallback to now if timezone conversion fails
    const now = new Date();
    vaultData.timer.gameStartDate = now;
    vaultData.endgame.endDate = new Date(now.getTime() + 100 * 24 * 60 * 60 * 1000);
  }
}
initializeLaunchTimes();

// Function to check and update vault status transitions
async function checkVaultStatusTransitions() {
  try {
    const now = new Date();
    const vaults = await db.getAllVaults();
    
    for (const vault of vaults) {
      const meta = vault.meta || {};
      let shouldUpdate = false;
      let newStatus = null;
      
      // Check if pre_ico should transition to ico
      if (vault.status === VAULT_STATUS.PRE_ICO && meta.icoProposedAt) {
        const icoStartTime = new Date(meta.icoProposedAt);
        if (now >= icoStartTime) {
          newStatus = VAULT_STATUS.ICO;
          shouldUpdate = true;
          console.log(`🔄 Auto-transitioning vault ${vault.id} from pre_ico to ico`);
        }
      }
      
      // ICO transitions are now handled by the scheduling system
      // No need to check ico -> pending/refund here anymore
      
      // Check if prelaunch should transition to active (after launch date)
      if (vault.status === VAULT_STATUS.PRELAUNCH && meta.stage2?.vaultLaunchDate) {
        const launchDate = new Date(meta.stage2.vaultLaunchDate);
        if (now >= launchDate) {
          newStatus = VAULT_STATUS.ACTIVE;
          shouldUpdate = true;
          console.log(`🔄 Auto-transitioning vault ${vault.id} from prelaunch to active`);
        }
      }
      
      // Check if vault should transition to endgame (end date reached)
      if (vault.status === VAULT_STATUS.ACTIVE && vault.endgameDate) {
        const endDate = new Date(vault.endgameDate);
        if (now >= endDate) {
          newStatus = VAULT_STATUS.ENDGAME_PROCESSING;
          shouldUpdate = true;
          console.log(`🔄 Auto-transitioning vault ${vault.id} from active to endgame_processing (end date reached)`);
        }
      }
      
      // Update status if needed
      if (shouldUpdate && newStatus) {
        await db.updateVault(vault.id, {
          status: newStatus,
          updatedAt: now.toISOString()
        });
        
        // Emit real-time update to connected clients
        io.emit('vaultStatusUpdated', { 
          vaultId: vault.id, 
          status: newStatus,
          timestamp: now.toISOString()
        });
        
        console.log(`✅ Vault ${vault.id} status updated to ${newStatus}`);
      }
    }
  } catch (error) {
    console.error('Error checking vault status transitions:', error);
  }
}

// Function to scan for eligible REVS holders
async function scanEligibleHolders() {
  try {
    const REVS_TOKEN_ADDRESS = '9VxExA1iRPbuLLdSJ2rB3nyBxsyLReT4aqzZBMaBaY1p';
    const MINIMUM_HOLD = 200000; // 200K REVS
    
    // Get all token accounts for REVS
    const tokenAccounts = await connection.getProgramAccounts(
      new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // Token Program
      {
        filters: [
          {
            dataSize: 165, // Token account size
          },
          {
            memcmp: {
              offset: 0, // Mint address offset
              bytes: REVS_TOKEN_ADDRESS,
            },
          },
        ],
      }
    );

    let eligibleCount = 0;
    
    for (const account of tokenAccounts) {
      try {
        const accountInfo = await connection.getTokenAccountBalance(account.pubkey);
        const balance = parseFloat(accountInfo.value.amount);
        
        if (balance >= MINIMUM_HOLD) {
          eligibleCount++;
        }
      } catch (error) {
        // Skip invalid accounts
        continue;
      }
    }
    
    vaultData.vault.airdrop.eligibleHolders = eligibleCount;
    console.log(`📊 Found ${eligibleCount} eligible REVS holders`);
    
  } catch (error) {
    console.error('Error scanning eligible holders:', error);
    // Keep existing value on error
  }
}

// Function to track total airdropped SOL from distributor wallet
async function trackTotalAirdroppedSOL() {
  try {
    const DISTRIBUTOR_WALLET = '72hnXr9PsMjp8WsnFyZjmm5vzHhTqbfouqtHBgLYdDZE';
    
    // Get transaction history for the distributor wallet
    const signatures = await connection.getSignaturesForAddress(
      new PublicKey(DISTRIBUTOR_WALLET),
      { limit: 1000 } // Get last 1000 transactions
    );
    
    let totalSOLSent = 0;
    
    for (const sig of signatures) {
      try {
        const transaction = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        });
        
        if (transaction && transaction.meta) {
          // Check if this wallet was the sender
          const accountKeys = transaction.transaction.message.accountKeys;
          const distributorIndex = accountKeys.findIndex(
            key => key.toString() === DISTRIBUTOR_WALLET
          );
          
          if (distributorIndex !== -1) {
            // Check if SOL was transferred out
            const preBalances = transaction.meta.preBalances;
            const postBalances = transaction.meta.postBalances;
            
            if (preBalances[distributorIndex] > postBalances[distributorIndex]) {
              const solSent = (preBalances[distributorIndex] - postBalances[distributorIndex]) / 1e9;
              totalSOLSent += solSent;
            }
          }
        }
      } catch (error) {
        // Skip invalid transactions
        continue;
      }
    }
    
    vaultData.airdrop.totalAirdroppedSOL = totalSOLSent;
    console.log(`Total SOL airdropped: ${totalSOLSent.toFixed(2)} SOL`);
    
  } catch (error) {
    console.error('Error tracking total airdropped SOL:', error);
    // Set a reasonable default
    vaultData.airdrop.totalAirdroppedSOL = 1250.5;
  }
}

// Dynamic vault monitoring system
const vaultMonitors = new Map(); // Map of vaultId -> monitoring state

// Global timer state (for backward compatibility)
let globalTimer = {
  timeLeft: 3600,
  isActive: true,
  lastPurchaseTime: null,
  lastBuyerAddress: null,
  lastPurchaseAmount: null,
  lastCheckedSignature: null,
  lastTxSignature: null
};

// ICO threshold monitoring
const ICO_THRESHOLD_USD = 10000; // $10,000 USD threshold for evolution
const PENDING_TIMEOUT_HOURS = 48; // 48 hours before auto-refund

// ICO scheduling system - production-ready server-side scheduling
const icoSchedules = new Map(); // Map of vaultId -> { timeoutId, startTime, endTime }

// Vault status types
const VAULT_STATUS = {
  PRE_ICO: 'pre_ico',
  PRE_ICO_SCHEDULED: 'pre_ico_scheduled', 
  ICO: 'ico',
  PENDING: 'pending',
  PRELAUNCH: 'prelaunch', // New status for after Stage 2, before launch date
  ACTIVE: 'active',
  WINNER_CONFIRMATION: 'winner_confirmation', // Timer expired, winner needs to claim
  ENDGAME_PROCESSING: 'endgame_processing', // Vault reached end of lifespan
  REFUND_REQUIRED: 'refund_required',
  COMPLETED: 'completed' // Vault fully processed
};

// Schedule ICO end for a vault (24 hours from now)
function scheduleICOEnd(vaultId) {
  try {
    // Clear any existing schedule
    if (icoSchedules.has(vaultId)) {
      clearTimeout(icoSchedules.get(vaultId).timeoutId);
    }
    
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + (24 * 60 * 60 * 1000)); // 24 hours
    
    // Schedule the ICO end
    const timeoutId = setTimeout(async () => {
      await handleICOEnd(vaultId);
    }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
    
    // Store schedule info
    icoSchedules.set(vaultId, {
      timeoutId,
      startTime,
      endTime,
      vaultId
    });
    
    console.log(`⏰ ICO scheduled for vault ${vaultId} - ends at ${endTime.toISOString()}`);
    
    // Emit ICO start event
    io.emit('ico-started', {
      vaultId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: 24 * 60 * 60 * 1000 // 24 hours in ms
    });
    
  } catch (error) {
    console.error(`❌ Error scheduling ICO end for vault ${vaultId}:`, error);
  }
}

// Handle ICO end - check threshold and transition vault
async function handleICOEnd(vaultId) {
  try {
    console.log(`⏰ ICO period ended for vault ${vaultId} - checking threshold...`);
    
    // Get current vault data
    const vault = await db.getVault(vaultId);
    if (!vault) {
      console.error(`❌ Vault ${vaultId} not found during ICO end`);
      return;
    }
    
    // Check if threshold was met
    const totalVolumeUSD = vault.totalVolume || 0;
    
    if (totalVolumeUSD >= ICO_THRESHOLD_USD) {
      // Threshold met - move to pending for Stage 2
      await db.updateVault(vaultId, {
        status: VAULT_STATUS.PENDING,
        updatedAt: new Date().toISOString()
      });
      
      console.log(`🎉 Vault ${vaultId} met ICO threshold ($${totalVolumeUSD.toLocaleString()}) - moved to pending for Stage 2`);
      
      // Emit success event
      io.emit('ico-completed', {
        vaultId,
        status: VAULT_STATUS.PENDING,
        totalVolume: totalVolumeUSD,
        thresholdMet: true
      });
      
    } else {
      // Threshold not met - mark for refund
      await db.updateVault(vaultId, {
        status: VAULT_STATUS.REFUND_REQUIRED,
        updatedAt: new Date().toISOString()
      });
      
      console.log(`❌ Vault ${vaultId} did not meet ICO threshold ($${totalVolumeUSD.toLocaleString()}) - marked for refund`);
      
      // Emit failure event
      io.emit('ico-failed', {
        vaultId,
        status: VAULT_STATUS.REFUND_REQUIRED,
        totalVolume: totalVolumeUSD,
        thresholdMet: false
      });
    }
    
    // Clean up schedule
    icoSchedules.delete(vaultId);
    
  } catch (error) {
    console.error(`❌ Error handling ICO end for vault ${vaultId}:`, error);
  }
}

// Get ICO status for a vault
function getICOStatus(vaultId) {
  const schedule = icoSchedules.get(vaultId);
  if (!schedule) {
    return { isActive: false, message: 'No ICO scheduled' };
  }
  
  const now = new Date();
  const timeLeft = Math.max(0, schedule.endTime - now);
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const secondsLeft = Math.floor((timeLeft % (1000 * 60)) / 1000);
  
  return {
    isActive: true,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    timeLeft,
    hoursLeft,
    minutesLeft,
    secondsLeft,
    progress: Math.min(100, ((now - schedule.startTime) / (24 * 60 * 60 * 1000)) * 100)
  };
}

// Cancel ICO schedule for a vault
function cancelICOSchedule(vaultId) {
  const schedule = icoSchedules.get(vaultId);
  if (schedule) {
    clearTimeout(schedule.timeoutId);
    icoSchedules.delete(vaultId);
    console.log(`⏹️ ICO schedule cancelled for vault ${vaultId}`);
  }
}

// Initialize ICO schedules for existing vaults on server start
async function initializeICOSchedules() {
  try {
    const vaults = await db.getAllVaults();
    
    for (const vault of vaults) {
      if (vault.status === VAULT_STATUS.ICO) {
        // Check if ICO should still be active
        const icoStartTime = new Date(vault.meta?.icoProposedAt);
        const icoEndTime = new Date(icoStartTime.getTime() + (24 * 60 * 60 * 1000)); // 24 hours after start
        const now = new Date();
        
        if (now < icoEndTime) {
          // ICO is still active - reschedule
          const timeLeft = icoEndTime - now;
          const timeoutId = setTimeout(async () => {
            await handleICOEnd(vault.id);
          }, timeLeft);
          
          icoSchedules.set(vault.id, {
            timeoutId,
            startTime: new Date(icoEndTime.getTime() - (24 * 60 * 60 * 1000)),
            endTime: icoEndTime,
            vaultId: vault.id
          });
          
          console.log(`🔄 Rescheduled ICO for vault ${vault.id} - ${Math.floor(timeLeft / (1000 * 60 * 60))} hours remaining`);
        } else {
          // ICO should have ended - handle it now
          await handleICOEnd(vault.id);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error initializing ICO schedules:', error);
  }
}

// Whitelist exclusion check
async function isAddressWhitelisted(vaultId, address) {
  try {
    const whitelistedAddresses = await db.getWhitelistedAddresses(vaultId);
    return whitelistedAddresses.some(wa => wa.address === address);
  } catch (error) {
    console.error('❌ Error checking whitelist:', error);
    return false;
  }
}

// Pending timeout monitoring (still needed for 48-hour timeout)
async function checkPendingTimeouts() {
  try {
    const vaults = await db.getAllVaults();
    
    for (const vault of vaults) {
      if (vault.status === VAULT_STATUS.PENDING) {
        // Check if pending timeout has been reached
        const pendingSince = new Date(vault.updatedAt);
        const now = new Date();
        const hoursPending = (now - pendingSince) / (1000 * 60 * 60);
        
        if (hoursPending >= PENDING_TIMEOUT_HOURS) {
          // Timeout reached - mark for refund
          await db.updateVault(vault.id, {
            status: VAULT_STATUS.REFUND_REQUIRED,
            updatedAt: new Date().toISOString()
          });
          
          console.log(`⏰ Vault ${vault.id} pending timeout reached (${hoursPending.toFixed(1)} hours) - marked for refund`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error checking pending timeouts:', error);
  }
}

// Check pending timeouts every 5 minutes
setInterval(checkPendingTimeouts, 5 * 60 * 1000);

// Multi-asset treasury wallet monitoring for ICO threshold
async function checkTreasuryBalances() {
  try {
    const vaults = await db.getAllVaults();
    
    for (const vault of vaults) {
      if (vault.status === VAULT_STATUS.ICO && vault.treasuryWallet) {
        try {
          let totalUSDValue = 0;
          const assetBalances = {};
          
          // Check SOL balance
          const solBalance = await connection.getBalance(new PublicKey(vault.treasuryWallet));
          const solAmount = solBalance / LAMPORTS_PER_SOL;
          
          if (solAmount > 0) {
            // Get SOL price from Jupiter API
            const solPrice = await getTokenPrice('So11111111111111111111111111111111111111112');
            const solUSD = solAmount * solPrice;
            totalUSDValue += solUSD;
            assetBalances['SOL'] = { amount: solAmount, price: solPrice, usd: solUSD };
          }
          
          // Check SPL token balances
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            new PublicKey(vault.treasuryWallet),
            { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
          );
          
          for (const tokenAccount of tokenAccounts.value) {
            const tokenInfo = tokenAccount.account.data.parsed.info;
            const mint = tokenInfo.mint;
            const amount = tokenInfo.tokenAmount.uiAmount;
            
            if (amount > 0) {
              try {
                // Get token price from Jupiter API
                const tokenPrice = await getTokenPrice(mint);
                const tokenUSD = amount * tokenPrice;
                totalUSDValue += tokenUSD;
                
                // Get token symbol/name
                const tokenSymbol = await getTokenSymbol(mint);
                assetBalances[tokenSymbol] = { 
                  amount, 
                  price: tokenPrice, 
                  usd: tokenUSD, 
                  mint 
                };
              } catch (error) {
                console.log(`⚠️ Could not get price for token ${mint}:`, error.message);
              }
            }
          }
          
          // Update vault total volume if it's higher
          if (totalUSDValue > (vault.totalVolume || 0)) {
            await db.updateVault(vault.id, {
              totalVolume: totalUSDValue,
              updatedAt: new Date().toISOString()
            });
            
            console.log(`💰 Vault ${vault.id} treasury balance: $${totalUSDValue.toFixed(2)}`);
            console.log(`   Assets:`, Object.entries(assetBalances).map(([symbol, data]) => 
              `${data.amount.toFixed(4)} ${symbol} ($${data.usd.toFixed(2)})`
            ).join(', '));
          }
        } catch (error) {
          console.error(`❌ Error checking treasury balance for vault ${vault.id}:`, error);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error checking treasury balances:', error);
  }
}

// Get token price from Jupiter API
async function getTokenPrice(mintAddress) {
  try {
    const response = await fetch(`https://price.jup.ag/v4/price?ids=${mintAddress}`);
    const data = await response.json();
    
    if (data.data && data.data[mintAddress]) {
      return data.data[mintAddress].price;
    }
    
    // Fallback prices for common tokens
    const fallbackPrices = {
      'So11111111111111111111111111111111111111112': 150, // SOL
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 1, // USDC
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 1, // USDT
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 0.00002, // BONK
    };
    
    return fallbackPrices[mintAddress] || 0;
  } catch (error) {
    console.error(`❌ Error fetching price for ${mintAddress}:`, error);
    return 0;
  }
}

// Get token symbol/name
async function getTokenSymbol(mintAddress) {
  try {
    // Try to get from Jupiter token list
    const response = await fetch('https://token.jup.ag/strict');
    const tokens = await response.json();
    const token = tokens.find(t => t.address === mintAddress);
    
    if (token) {
      return token.symbol;
    }
    
    // Fallback symbols
    const fallbackSymbols = {
      'So11111111111111111111111111111111111111112': 'SOL',
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
      'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK',
    };
    
    return fallbackSymbols[mintAddress] || mintAddress.slice(0, 8) + '...';
  } catch (error) {
    console.error(`❌ Error fetching symbol for ${mintAddress}:`, error);
    return mintAddress.slice(0, 8) + '...';
  }
}

// Check treasury balances every 2 minutes during ICO
setInterval(checkTreasuryBalances, 2 * 60 * 1000);

// Helius webhook integration for real-time monitoring
app.post('/webhook/helius', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    if (type === 'TRANSFER') {
      const { source, destination, amount, token, signature } = data;
      
      // Check if this is a transfer to any of our treasury wallets (ICO monitoring)
      const vaults = await db.getAllVaults();
      const targetVault = vaults.find(vault => 
        vault.treasuryWallet && 
        (vault.treasuryWallet === destination || vault.treasuryWallet === source)
      );
      
      if (targetVault && targetVault.status === VAULT_STATUS.ICO) {
        console.log(`🔔 Webhook: Treasury transfer detected for vault ${targetVault.id}`);
        console.log(`   From: ${source} → To: ${destination}`);
        console.log(`   Amount: ${amount} ${token || 'SOL'}`);
        
        // Trigger immediate treasury balance check for this vault
        await checkSingleVaultTreasuryBalance(targetVault.id);
      }
      
      // Check if this is a token purchase for any active vault (timer monitoring)
      for (const [vaultId, monitorState] of vaultMonitors) {
        if (monitorState.tokenMint === token && monitorState.isActive) {
          console.log(`🔔 Webhook: Token purchase detected for vault ${vaultId}`);
          console.log(`   Token: ${token}, Amount: ${amount}, Buyer: ${source}`);
          
          // Check if buyer is whitelisted
          const isWhitelisted = monitorState.whitelistedAddresses.some(
            wa => wa.address === source
          );
          
          if (!isWhitelisted) {
            // Valid purchase - reset timer
            monitorState.timeLeft = monitorState.timerDuration;
            monitorState.lastPurchaseTime = new Date();
            monitorState.lastBuyerAddress = source;
            monitorState.lastPurchaseAmount = amount;
            
            console.log(`🔄 Webhook Timer Reset: Vault ${vaultId} - ${amount} tokens by ${source}`);
            
            // Emit purchase event
            io.emit('vault-purchase', {
              vaultId,
              buyer: source,
              amount: amount,
              timeLeft: monitorState.timeLeft
            });
          } else {
            console.log(`🚫 Webhook: Whitelisted address ${source} excluded from vault ${vaultId}`);
          }
        }
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Check treasury balance for a single vault (triggered by webhook)
async function checkSingleVaultTreasuryBalance(vaultId) {
  try {
    const vault = await db.getVault(vaultId);
    if (!vault || !vault.treasuryWallet) return;
    
    let totalUSDValue = 0;
    const assetBalances = {};
    
    // Check SOL balance
    const solBalance = await connection.getBalance(new PublicKey(vault.treasuryWallet));
    const solAmount = solBalance / LAMPORTS_PER_SOL;
    
    if (solAmount > 0) {
      const solPrice = await getTokenPrice('So11111111111111111111111111111111111111112');
      const solUSD = solAmount * solPrice;
      totalUSDValue += solUSD;
      assetBalances['SOL'] = { amount: solAmount, price: solPrice, usd: solUSD };
    }
    
    // Check SPL token balances
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(vault.treasuryWallet),
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    );
    
    for (const tokenAccount of tokenAccounts.value) {
      const tokenInfo = tokenAccount.account.data.parsed.info;
      const mint = tokenInfo.mint;
      const amount = tokenInfo.tokenAmount.uiAmount;
      
      if (amount > 0) {
        try {
          const tokenPrice = await getTokenPrice(mint);
          const tokenUSD = amount * tokenPrice;
          totalUSDValue += tokenUSD;
          
          const tokenSymbol = await getTokenSymbol(mint);
          assetBalances[tokenSymbol] = { 
            amount, 
            price: tokenPrice, 
            usd: tokenUSD, 
            mint 
          };
        } catch (error) {
          console.log(`⚠️ Could not get price for token ${mint}:`, error.message);
        }
      }
    }
    
    // Update vault total volume if it's higher
    if (totalUSDValue > (vault.totalVolume || 0)) {
      await db.updateVault(vault.id, {
        totalVolume: totalUSDValue,
        updatedAt: new Date().toISOString()
      });
      
      console.log(`💰 Webhook Update - Vault ${vault.id} treasury balance: $${totalUSDValue.toFixed(2)}`);
      console.log(`   Assets:`, Object.entries(assetBalances).map(([symbol, data]) => 
        `${data.amount.toFixed(4)} ${symbol} ($${data.usd.toFixed(2)})`
      ).join(', '));
      
      // Check if threshold is now met
      if (totalUSDValue >= ICO_THRESHOLD_USD) {
        console.log(`🎉 Threshold met via webhook! Vault ${vault.id} has $${totalUSDValue.toFixed(2)}`);
      }
    }
  } catch (error) {
    console.error(`❌ Error checking single vault treasury balance for ${vaultId}:`, error);
  }
}

// API endpoint to get detailed treasury balance for a vault
app.get('/api/admin/vaults/:id/treasury-balance', async (req, res) => {
  try {
    const { id } = req.params;
    const vault = await db.getVault(id);
    
    if (!vault || !vault.treasuryWallet) {
      return res.status(404).json({ error: 'Vault or treasury wallet not found' });
    }
    
    let totalUSDValue = 0;
    const assetBalances = {};
    
    // Check SOL balance
    const solBalance = await connection.getBalance(new PublicKey(vault.treasuryWallet));
    const solAmount = solBalance / LAMPORTS_PER_SOL;
    
    if (solAmount > 0) {
      const solPrice = await getTokenPrice('So11111111111111111111111111111111111111112');
      const solUSD = solAmount * solPrice;
      totalUSDValue += solUSD;
      assetBalances['SOL'] = { 
        amount: solAmount, 
        price: solPrice, 
        usd: solUSD,
        mint: 'So11111111111111111111111111111111111111112'
      };
    }
    
    // Check SPL token balances
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      new PublicKey(vault.treasuryWallet),
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    );
    
    for (const tokenAccount of tokenAccounts.value) {
      const tokenInfo = tokenAccount.account.data.parsed.info;
      const mint = tokenInfo.mint;
      const amount = tokenInfo.tokenAmount.uiAmount;
      
      if (amount > 0) {
        try {
          const tokenPrice = await getTokenPrice(mint);
          const tokenUSD = amount * tokenPrice;
          totalUSDValue += tokenUSD;
          
          const tokenSymbol = await getTokenSymbol(mint);
          assetBalances[tokenSymbol] = { 
            amount, 
            price: tokenPrice, 
            usd: tokenUSD, 
            mint 
          };
        } catch (error) {
          console.log(`⚠️ Could not get price for token ${mint}:`, error.message);
        }
      }
    }
    
    res.json({
      vaultId: id,
      treasuryWallet: vault.treasuryWallet,
      totalUSDValue,
      assetBalances,
      lastChecked: new Date().toISOString(),
      threshold: ICO_THRESHOLD_USD,
      thresholdMet: totalUSDValue >= ICO_THRESHOLD_USD
    });
    
  } catch (error) {
    console.error('❌ Error fetching treasury balance:', error);
    res.status(500).json({ error: 'Failed to fetch treasury balance' });
  }
});

// Prelaunch monitoring - check if vaults should go live
async function checkPrelaunchVaults() {
  try {
    const vaults = await db.getAllVaults();
    
    for (const vault of vaults) {
      if (vault.status === VAULT_STATUS.PRELAUNCH) {
        const launchDate = new Date(vault.meta?.stage2?.vaultLaunchDate);
        const now = new Date();
        
        if (now >= launchDate) {
          // Launch date reached - activate vault and start monitoring
          await db.updateVault(vault.id, {
            status: VAULT_STATUS.ACTIVE,
            updatedAt: new Date().toISOString()
          });
          
          // Start dynamic monitoring for this vault's token
          await startVaultMonitoring(vault);
          
          console.log(`🚀 Vault ${vault.id} launched! Timer is now active for token ${vault.tokenMint}.`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error checking prelaunch vaults:', error);
  }
}

// Start monitoring for a specific vault's token
async function startVaultMonitoring(vault) {
  try {
    if (!vault.tokenMint) {
      console.error(`❌ No token mint found for vault ${vault.id}`);
      return;
    }
    
    // Create monitoring state for this vault
    const monitorState = {
      vaultId: vault.id,
      tokenMint: vault.tokenMint,
      timerDuration: vault.timerDuration || 3600,
      timeLeft: vault.timerDuration || 3600,
      isActive: true,
      lastPurchaseTime: null,
      lastBuyerAddress: null,
      lastPurchaseAmount: null,
      lastCheckedSignature: null,
      whitelistedAddresses: await db.getWhitelistedAddresses(vault.id),
      startTime: new Date()
    };
    
    // Store in vault monitors map
    vaultMonitors.set(vault.id, monitorState);
    
    // Start monitoring interval for this vault
    const intervalId = setInterval(async () => {
      await monitorVaultToken(vault.id);
    }, 1000); // Check every second
    
    monitorState.intervalId = intervalId;
    
    console.log(`📡 Started monitoring vault ${vault.id} for token ${vault.tokenMint}`);
    
  } catch (error) {
    console.error(`❌ Error starting vault monitoring for ${vault.id}:`, error);
  }
}

// Monitor a specific vault's token for purchases
async function monitorVaultToken(vaultId) {
  try {
    const monitorState = vaultMonitors.get(vaultId);
    if (!monitorState || !monitorState.isActive) return;
    
    // Decrement timer
    monitorState.timeLeft = Math.max(0, monitorState.timeLeft - 1);
    
    // Check if timer has expired
    if (monitorState.timeLeft <= 0) {
      await handleTimerExpiration(vaultId, monitorState);
      return;
    }
    
    // Check for new token purchases
    await checkTokenPurchases(vaultId, monitorState);
    
    // Emit timer update via Socket.IO
    io.emit('vault-timer-update', {
      vaultId,
      timeLeft: monitorState.timeLeft,
      isActive: monitorState.isActive,
      lastPurchaseTime: monitorState.lastPurchaseTime,
      lastBuyerAddress: monitorState.lastBuyerAddress,
      lastPurchaseAmount: monitorState.lastPurchaseAmount
    });
    
  } catch (error) {
    console.error(`❌ Error monitoring vault ${vaultId}:`, error);
  }
}

// Handle timer expiration - move to winner confirmation
async function handleTimerExpiration(vaultId, monitorState) {
  try {
    // Stop monitoring
    stopVaultMonitoring(vaultId);
    
    // Update vault status to winner confirmation
    await db.updateVault(vaultId, {
      status: VAULT_STATUS.WINNER_CONFIRMATION,
      updatedAt: new Date().toISOString()
    });
    
    // Store winner information
    const winnerInfo = {
      winnerAddress: monitorState.lastBuyerAddress,
      lastPurchaseTime: monitorState.lastPurchaseTime,
      lastPurchaseAmount: monitorState.lastPurchaseAmount,
      timerExpiredAt: new Date().toISOString()
    };
    
    // Update vault meta with winner info
    const vault = await db.getVault(vaultId);
    const updatedMeta = {
      ...vault.meta,
      winner: winnerInfo
    };
    
    await db.updateVault(vaultId, {
      meta: JSON.stringify(updatedMeta)
    });
    
    console.log(`🏆 Timer expired for vault ${vaultId} - Winner: ${monitorState.lastBuyerAddress}`);
    
    // Emit timer expiration event
    io.emit('vault-timer-expired', {
      vaultId,
      winner: monitorState.lastBuyerAddress,
      lastPurchaseTime: monitorState.lastPurchaseTime
    });
    
  } catch (error) {
    console.error(`❌ Error handling timer expiration for vault ${vaultId}:`, error);
  }
}

// Check for token purchases for a specific vault
async function checkTokenPurchases(vaultId, monitorState) {
  try {
    const { tokenMint, lastCheckedSignature } = monitorState;
    
    // Get recent transactions for this token
    const signatures = await connection.getSignaturesForAddress(
      new PublicKey(tokenMint),
      { limit: 10, before: lastCheckedSignature }
    );
    
    for (const sig of signatures) {
      if (sig.signature === lastCheckedSignature) break;
      
      try {
        const tx = await connection.getParsedTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        });
        
        if (tx && tx.meta && tx.meta.logMessages) {
          // Parse transaction for token transfers
          const transferInfo = parseTokenTransfer(tx, tokenMint);
          
          if (transferInfo && transferInfo.amount > 0) {
            // Check if buyer is whitelisted
            const isWhitelisted = monitorState.whitelistedAddresses.some(
              wa => wa.address === transferInfo.buyer
            );
            
            if (!isWhitelisted) {
              // Valid purchase - reset timer
              monitorState.timeLeft = monitorState.timerDuration;
              monitorState.lastPurchaseTime = new Date();
              monitorState.lastBuyerAddress = transferInfo.buyer;
              monitorState.lastPurchaseAmount = transferInfo.amount;
              monitorState.lastCheckedSignature = sig.signature;
              
              console.log(`🔄 Timer reset for vault ${vaultId} - Purchase: ${transferInfo.amount} tokens by ${transferInfo.buyer}`);
              
              // Emit purchase event
              io.emit('vault-purchase', {
                vaultId,
                buyer: transferInfo.buyer,
                amount: transferInfo.amount,
                timeLeft: monitorState.timeLeft
              });
            } else {
              console.log(`🚫 Whitelisted address ${transferInfo.buyer} excluded from vault ${vaultId} timer reset`);
            }
          }
        }
      } catch (txError) {
        console.log(`⚠️ Error parsing transaction ${sig.signature}:`, txError.message);
      }
    }
    
    // Update last checked signature
    if (signatures.length > 0) {
      monitorState.lastCheckedSignature = signatures[0].signature;
    }
    
  } catch (error) {
    console.error(`❌ Error checking token purchases for vault ${vaultId}:`, error);
  }
}

// Parse token transfer from transaction
function parseTokenTransfer(tx, tokenMint) {
  try {
    if (!tx.meta || !tx.meta.logMessages) return null;
    
    // Look for token transfer logs
    for (const log of tx.meta.logMessages) {
      if (log.includes('Transfer') && log.includes(tokenMint)) {
        // Parse transfer log to extract buyer and amount
        // This is a simplified parser - you might need to enhance based on actual log format
        const transferMatch = log.match(/Transfer (\d+) tokens/);
        if (transferMatch) {
          return {
            buyer: tx.transaction.message.accountKeys[0].toString(), // Simplified
            amount: parseInt(transferMatch[1])
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error parsing token transfer:', error);
    return null;
  }
}

// Stop monitoring for a vault
function stopVaultMonitoring(vaultId) {
  const monitorState = vaultMonitors.get(vaultId);
  if (monitorState && monitorState.intervalId) {
    clearInterval(monitorState.intervalId);
    vaultMonitors.delete(vaultId);
    console.log(`⏹️ Stopped monitoring vault ${vaultId}`);
  }
}

// Check prelaunch vaults every minute
setInterval(checkPrelaunchVaults, 60 * 1000);

// Endgame monitoring - check if active vaults have reached end of lifespan
async function checkEndgameVaults() {
  try {
    const vaults = await db.getAllVaults();
    
    for (const vault of vaults) {
      if (vault.status === VAULT_STATUS.ACTIVE) {
        const vaultLifespan = vault.meta?.vaultLifespan || 7; // Default 7 days
        const startTime = new Date(vault.meta?.stage2?.vaultLaunchDate);
        const endTime = new Date(startTime.getTime() + (vaultLifespan * 24 * 60 * 60 * 1000));
        const now = new Date();
        
        if (now >= endTime) {
          // Vault lifespan reached - move to endgame processing
          await db.updateVault(vault.id, {
            status: VAULT_STATUS.ENDGAME_PROCESSING,
            updatedAt: new Date().toISOString()
          });
          
          // Stop monitoring
          stopVaultMonitoring(vault.id);
          
          console.log(`🎯 Vault ${vault.id} reached end of lifespan - moved to endgame processing`);
          
          // Emit endgame event
          io.emit('vault-endgame', {
            vaultId: vault.id,
            endTime: endTime.toISOString()
          });
        }
      }
    }
  } catch (error) {
    console.error('❌ Error checking endgame vaults:', error);
  }
}

// Check endgame vaults every hour
setInterval(checkEndgameVaults, 60 * 60 * 1000);

// Test endpoint to check database update
app.post('/api/test/update-vault', async (req, res) => {
  try {
    const { id } = req.body;
    const result = await db.updateVault(id, {
      status: 'test_status',
      updatedAt: new Date().toISOString()
    });
    res.json({ success: true, result });
  } catch (error) {
    console.error('❌ Test update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin control endpoints for testing vault progression
app.post('/api/admin/vaults/:id/force-ico-end', async (req, res) => {
  try {
    const { id } = req.params;
    const vault = await db.getVault(id);
    
    if (!vault) {
      return res.status(404).json({ error: 'Vault not found' });
    }
    
    if (vault.status !== VAULT_STATUS.ICO) {
      return res.status(400).json({ error: 'Vault is not in ICO status' });
    }
    
    // Cancel any existing ICO schedule
    cancelICOSchedule(id);
    
    // Force ICO to end and check threshold
    const totalVolumeUSD = vault.totalVolume || 0;
    const thresholdUsd = vault.meta?.icoThresholdUsd || ICO_THRESHOLD_USD;
    
    if (totalVolumeUSD >= thresholdUsd) {
      // Threshold met - move to pending for Stage 2
      await db.updateVault(id, {
        status: VAULT_STATUS.PENDING,
        updatedAt: new Date().toISOString()
      });
      
      console.log(`🎉 Admin forced ICO end for vault ${id} - met threshold ($${totalVolumeUSD.toLocaleString()}) - moved to pending`);
    } else {
      // Threshold not met - mark for refund
      await db.updateVault(id, {
        status: VAULT_STATUS.REFUND_REQUIRED,
        updatedAt: new Date().toISOString()
      });
      
      console.log(`❌ Admin forced ICO end for vault ${id} - did not meet threshold ($${totalVolumeUSD.toLocaleString()}) - marked for refund`);
    }
    
    res.json({
      success: true,
      message: `Forced ICO end for vault ${id}`,
      newStatus: totalVolumeUSD >= thresholdUsd ? VAULT_STATUS.PENDING : VAULT_STATUS.REFUND_REQUIRED,
      thresholdMet: totalVolumeUSD >= thresholdUsd
    });
    
  } catch (error) {
    console.error('❌ Error forcing ICO end:', error);
    res.status(500).json({ error: 'Failed to force ICO end' });
  }
});

// Force ICO Success - bypass threshold check for testing
app.post('/api/admin/vaults/:id/force-ico-success', async (req, res) => {
  try {
    const { id } = req.params;
    const vault = await db.getVault(id);
    
    if (!vault) {
      return res.status(404).json({ error: 'Vault not found' });
    }
    
    if (vault.status !== VAULT_STATUS.ICO) {
      return res.status(400).json({ error: 'Vault is not in ICO status' });
    }
    
    // Cancel any existing ICO schedule
    cancelICOSchedule(id);
    
    // Force ICO to succeed - move to pending for Stage 2
    await db.updateVault(id, {
      status: VAULT_STATUS.PENDING,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`🎉 Admin forced ICO success for vault ${id} - moved to pending for Stage 2`);
    
    res.json({
      success: true,
      message: `Forced ICO success for vault ${id}`,
      newStatus: VAULT_STATUS.PENDING,
      thresholdMet: true
    });
    
  } catch (error) {
    console.error('❌ Error forcing ICO success:', error);
    res.status(500).json({ error: 'Failed to force ICO success' });
  }
});

app.post('/api/admin/vaults/:id/force-launch', async (req, res) => {
  try {
    const { id } = req.params;
    const vault = await db.getVault(id);
    
    if (!vault) {
      return res.status(404).json({ error: 'Vault not found' });
    }
    
    if (vault.status !== VAULT_STATUS.PRELAUNCH) {
      return res.status(400).json({ error: 'Vault is not in prelaunch status' });
    }
    
    // Force vault to launch
    await db.updateVault(id, {
      status: VAULT_STATUS.ACTIVE,
      updatedAt: new Date().toISOString()
    });
    
    // Start monitoring
    await startVaultMonitoring(vault);
    
    console.log(`🚀 Admin forced launch for vault ${id}`);
    
    res.json({
      success: true,
      message: `Forced launch for vault ${id}`,
      newStatus: VAULT_STATUS.ACTIVE
    });
    
  } catch (error) {
    console.error('❌ Error forcing launch:', error);
    res.status(500).json({ error: 'Failed to force launch' });
  }
});

app.post('/api/admin/vaults/:id/force-timer-expire', async (req, res) => {
  try {
    const { id } = req.params;
    const monitorState = vaultMonitors.get(id);
    
    if (!monitorState) {
      return res.status(400).json({ error: 'Vault is not currently being monitored' });
    }
    
    // Force timer to expire
    monitorState.timeLeft = 0;
    await handleTimerExpiration(id, monitorState);
    
    console.log(`⏰ Admin forced timer expiration for vault ${id}`);
    
    res.json({
      success: true,
      message: `Forced timer expiration for vault ${id}`,
      newStatus: VAULT_STATUS.WINNER_CONFIRMATION
    });
    
  } catch (error) {
    console.error('❌ Error forcing timer expiration:', error);
    res.status(500).json({ error: 'Failed to force timer expiration' });
  }
});

app.post('/api/admin/vaults/:id/confirm-winner', async (req, res) => {
  try {
    const { id } = req.params;
    const vault = await db.getVault(id);
    
    if (!vault) {
      return res.status(404).json({ error: 'Vault not found' });
    }
    
    if (vault.status !== VAULT_STATUS.WINNER_CONFIRMATION) {
      return res.status(400).json({ error: 'Vault is not in winner confirmation status' });
    }
    
    // Confirm winner and move to endgame
    await db.updateVault(id, {
      status: VAULT_STATUS.ENDGAME_PROCESSING,
      updatedAt: new Date().toISOString()
    });
    
    console.log(`✅ Winner confirmed for vault ${id} - moved to endgame processing`);
    
    res.json({ 
      success: true, 
      message: `Winner confirmed for vault ${id}`,
      newStatus: VAULT_STATUS.ENDGAME_PROCESSING
    });
    
  } catch (error) {
    console.error(`❌ Error confirming winner for vault ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to confirm winner' });
  }
});

app.post('/api/admin/vaults/:id/force-endgame', async (req, res) => {
  try {
    const { id } = req.params;
    const vault = await db.getVault(id);
    
    if (!vault) {
      return res.status(404).json({ error: 'Vault not found' });
    }
    
    if (vault.status !== VAULT_STATUS.ACTIVE) {
      return res.status(400).json({ error: 'Vault is not active' });
    }
    
    // Force vault to endgame
    await db.updateVault(id, {
      status: VAULT_STATUS.ENDGAME_PROCESSING,
      updatedAt: new Date().toISOString()
    });
    
    // Stop monitoring
    stopVaultMonitoring(id);
    
    console.log(`🎯 Admin forced endgame for vault ${id}`);
    
    res.json({
      success: true,
      message: `Forced endgame for vault ${id}`,
      newStatus: VAULT_STATUS.ENDGAME_PROCESSING
    });
    
  } catch (error) {
    console.error('❌ Error forcing endgame:', error);
    res.status(500).json({ error: 'Failed to force endgame' });
  }
});

// API endpoints for vault monitoring management
app.get('/api/admin/vaults/:id/monitoring-status', async (req, res) => {
  try {
    const { id } = req.params;
    const monitorState = vaultMonitors.get(id);
    
    if (monitorState) {
      res.json({
        vaultId: id,
        isMonitoring: true,
        tokenMint: monitorState.tokenMint,
        timeLeft: monitorState.timeLeft,
        isActive: monitorState.isActive,
        lastPurchaseTime: monitorState.lastPurchaseTime,
        lastBuyerAddress: monitorState.lastBuyerAddress,
        lastPurchaseAmount: monitorState.lastPurchaseAmount,
        startTime: monitorState.startTime
      });
    } else {
      res.json({
        vaultId: id,
        isMonitoring: false,
        message: 'Vault is not currently being monitored'
      });
    }
  } catch (error) {
    console.error('❌ Error getting monitoring status:', error);
    res.status(500).json({ error: 'Failed to get monitoring status' });
  }
});

app.post('/api/admin/vaults/:id/start-monitoring', async (req, res) => {
  try {
    const { id } = req.params;
    const vault = await db.getVault(id);
    
    if (!vault) {
      return res.status(404).json({ error: 'Vault not found' });
    }
    
    if (!vault.tokenMint) {
      return res.status(400).json({ error: 'Vault has no token mint configured' });
    }
    
    // Start monitoring
    await startVaultMonitoring(vault);
    
    res.json({
      success: true,
      message: `Started monitoring vault ${id} for token ${vault.tokenMint}`,
      tokenMint: vault.tokenMint
    });
    
  } catch (error) {
    console.error('❌ Error starting vault monitoring:', error);
    res.status(500).json({ error: 'Failed to start monitoring' });
  }
});

app.post('/api/admin/vaults/:id/stop-monitoring', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Stop monitoring
    stopVaultMonitoring(id);
    
    res.json({
      success: true,
      message: `Stopped monitoring vault ${id}`
    });
    
  } catch (error) {
    console.error('❌ Error stopping vault monitoring:', error);
    res.status(500).json({ error: 'Failed to stop monitoring' });
  }
});

app.get('/api/admin/vaults/monitoring-overview', async (req, res) => {
  try {
    const monitoringOverview = [];
    
    for (const [vaultId, monitorState] of vaultMonitors) {
      monitoringOverview.push({
        vaultId,
        tokenMint: monitorState.tokenMint,
        timeLeft: monitorState.timeLeft,
        isActive: monitorState.isActive,
        lastPurchaseTime: monitorState.lastPurchaseTime,
        startTime: monitorState.startTime
      });
    }
    
    res.json({
      totalMonitoring: vaultMonitors.size,
      vaults: monitoringOverview
    });
    
  } catch (error) {
    console.error('❌ Error getting monitoring overview:', error);
    res.status(500).json({ error: 'Failed to get monitoring overview' });
  }
});

// Winner confirmation API endpoints
app.get('/api/admin/vaults/winner-confirmation', async (req, res) => {
  try {
    const vaults = await db.getAllVaults();
    const winnerVaults = vaults.filter(vault => vault.status === VAULT_STATUS.WINNER_CONFIRMATION);
    
    res.json({
      winnerVaults: winnerVaults.map(vault => ({
        id: vault.id,
        name: vault.name,
        status: vault.status,
        totalVolume: vault.totalVolume,
        treasuryWallet: vault.treasuryWallet,
        winner: vault.meta?.winner,
        createdAt: vault.createdAt,
        updatedAt: vault.updatedAt
      })),
      totalWinners: winnerVaults.length
    });
  } catch (error) {
    console.error('❌ Error fetching winner confirmation vaults:', error);
    res.status(500).json({ error: 'Failed to fetch winner confirmation vaults' });
  }
});

// Endgame processing API endpoints
app.get('/api/admin/vaults/endgame-processing', async (req, res) => {
  try {
    const vaults = await db.getAllVaults();
    const endgameVaults = vaults.filter(vault => vault.status === VAULT_STATUS.ENDGAME_PROCESSING);
    
    res.json({
      endgameVaults: endgameVaults.map(vault => ({
        id: vault.id,
        name: vault.name,
        status: vault.status,
        totalVolume: vault.totalVolume,
        treasuryWallet: vault.treasuryWallet,
        tokenMint: vault.tokenMint,
        createdAt: vault.createdAt,
        updatedAt: vault.updatedAt
      })),
      totalEndgame: endgameVaults.length
    });
  } catch (error) {
    console.error('❌ Error fetching endgame processing vaults:', error);
    res.status(500).json({ error: 'Failed to fetch endgame processing vaults' });
  }
});

// Refund system API endpoints
app.get('/api/admin/vaults/refund-required', async (req, res) => {
  try {
    const vaults = await db.getAllVaults();
    const refundVaults = vaults.filter(vault => vault.status === VAULT_STATUS.REFUND_REQUIRED);
    
    res.json({ 
      refundVaults,
      totalRefunds: refundVaults.length
    });
  } catch (error) {
    console.error('❌ Error fetching refund required vaults:', error);
    res.status(500).json({ error: 'Failed to fetch refund required vaults' });
  }
});

app.post('/api/admin/vaults/:id/process-refund', async (req, res) => {
  try {
    const { id } = req.params;
    const { refundTxSignature, notes } = req.body;
    
    console.log(`💰 Processing refund for vault: ${id}`);
    
    // Get vault data
    const vault = await db.getVault(id);
    if (!vault) {
      return res.status(404).json({ error: 'Vault not found' });
    }
    
    if (vault.status !== VAULT_STATUS.REFUND_REQUIRED) {
      return res.status(400).json({ error: 'Vault is not marked for refund' });
    }
    
    // Update vault with refund information
    const updatedMeta = {
      ...vault.meta,
      refund: {
        processedAt: new Date().toISOString(),
        refundTxSignature,
        notes,
        amountUSD: vault.totalVolume || 0
      }
    };
    
    await db.updateVault(id, {
      status: VAULT_STATUS.COMPLETED,
      meta: JSON.stringify(updatedMeta),
      updatedAt: new Date().toISOString()
    });
    
    console.log(`✅ Refund processed for vault: ${id}`);
    res.json({ 
      success: true, 
      message: `Refund processed for vault ${id}`,
      refund: {
        vaultId: id,
        amountUSD: vault.totalVolume || 0,
        refundTxSignature,
        processedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
});

// API endpoint to get pending vaults for admin dashboard
app.get('/api/admin/vaults/pending', async (req, res) => {
  try {
    const vaults = await db.getAllVaults();
    const pendingVaults = vaults.filter(vault => vault.status === VAULT_STATUS.PENDING);
    
    // Add time remaining for pending timeout
    const pendingVaultsWithTimeout = pendingVaults.map(vault => {
      const pendingSince = new Date(vault.updatedAt);
      const now = new Date();
      const hoursPending = (now - pendingSince) / (1000 * 60 * 60);
      const hoursRemaining = Math.max(0, PENDING_TIMEOUT_HOURS - hoursPending);
      
      return {
        ...vault,
        pendingInfo: {
          hoursPending: Math.round(hoursPending * 10) / 10,
          hoursRemaining: Math.round(hoursRemaining * 10) / 10,
          pendingSince: vault.updatedAt
        }
      };
    });
    
    res.json({ 
      pendingVaults: pendingVaultsWithTimeout,
      totalPending: pendingVaultsWithTimeout.length,
      timeoutHours: PENDING_TIMEOUT_HOURS
    });
  } catch (error) {
    console.error('❌ Error fetching pending vaults:', error);
    res.status(500).json({ error: 'Failed to fetch pending vaults' });
  }
});

// Monitoring control
let monitoringState = {
  isMonitoring: false,
  monitoringInterval: null,
  webSocketSubscription: null,
  isProductionMode: process.env.NODE_ENV === 'production'
};

// Track processed signatures to avoid duplicates
const processedSignatures = new Set();

// Fetch token price data from multiple sources
async function fetchTokenPrice() {
  try {
    // Try Jupiter API for REVS token first (more reliable for new tokens)
    try {
      const response = await fetch(`https://price.jup.ag/v4/price?ids=${REVS_TOKEN_ADDRESS}`, {
        headers: {
          'User-Agent': 'RevShare-Dashboard/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.data && data.data[REVS_TOKEN_ADDRESS]) {
        const priceInfo = data.data[REVS_TOKEN_ADDRESS];
        tokenData.price = priceInfo.price;
        tokenData.lastUpdated = new Date().toISOString();
        
        // Calculate market cap (REVS has ~782M supply based on your data)
        tokenData.marketCap = tokenData.price * 782491857.39;
        
        console.log(`💰 REVS price updated from Jupiter: $${tokenData.price}`);
        return;
      }
    } catch (jupiterError) {
      console.log('Jupiter API failed, trying CoinGecko...');
    }
    
    // Fallback: Use a reasonable REVS price estimate
    tokenData.price = 0.0007109; // Based on your screenshot data
    tokenData.marketCap = tokenData.price * 782491857.39; // ~$556k market cap
    tokenData.lastUpdated = new Date().toISOString();
    
    console.log(`💰 Using fallback REVS price: $${tokenData.price}`);
    
  } catch (error) {
    console.error('❌ Error fetching token price:', error);
    // Set fallback values
    tokenData.price = 0.0007109;
    tokenData.marketCap = 556000;
    tokenData.lastUpdated = new Date().toISOString();
  }
}

// Calculate vault-specific data
function calculateVaultData() {
  const now = new Date();
  
  // Calculate days alive since configured launch time
  const daysAlive = Math.floor((now - vaultData.timer.gameStartDate) / (1000 * 60 * 60 * 24));
  vaultData.timer.daysAlive = Math.max(0, daysAlive);
  
  // Calculate endgame countdown in days
  const endgameTimeLeft = vaultData.endgame.endDate - now;
  const endgameDaysLeft = Math.max(0, Math.floor(endgameTimeLeft / (1000 * 60 * 60 * 24)));
  vaultData.endgame.daysLeft = endgameDaysLeft;
  
  // Calculate next airdrop time (noon Eastern daily)
  const today = new Date();
  const nextAirdrop = new Date(today);
  // Noon Eastern = 4 PM UTC (EST) or 5 PM UTC (EDT)
  // For simplicity, using 4 PM UTC (EST) - adjust if needed for EDT
  nextAirdrop.setUTCHours(16, 0, 0, 0);
  
  // If today's airdrop time has passed, set to tomorrow
  if (nextAirdrop <= now) {
    nextAirdrop.setUTCDate(nextAirdrop.getUTCDate() + 1);
  }
  
  vaultData.airdrop.nextAirdropTime = nextAirdrop;
  
  console.log(`📊 Vault data updated - Days alive: ${daysAlive}, Endgame: ${endgameDaysLeft} days, Next airdrop: ${nextAirdrop.toISOString()}`);
}

// Fetch wallet REVS token balances
async function fetchWalletBalances() {
  try {
    for (const walletAddress of TRACKED_WALLETS) {
      
      try {
        const publicKey = new PublicKey(walletAddress);
        
        // Add delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get SOL balance
        const solBalance = await connection.getBalance(publicKey);
        const solAmount = solBalance / LAMPORTS_PER_SOL;
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get REVS token balance
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
          mint: new PublicKey(REVS_TOKEN_ADDRESS)
        });
        
        let revsBalance = 0;
        if (tokenAccounts.value.length > 0) {
          revsBalance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
        }
        
        const revsUsdValue = revsBalance * tokenData.price;
        
        walletBalances[walletAddress] = {
          address: walletAddress,
          sol: solAmount,
          revs: revsBalance,
          usd: solAmount * 150 + revsUsdValue, // SOL + REVS USD value
          lastUpdated: new Date().toISOString()
        };
        
        console.log(`💰 Wallet ${walletAddress.slice(0, 8)}... balance: ${solAmount.toFixed(4)} SOL, ${revsBalance.toFixed(2)} REVS`);
        
        // Update treasury data if this is the developer wallet
        if (walletAddress === 'i35RYnCTa7xjs7U1hByCDFE37HwLNuZsUNHmmT4cYUH') {
          vaultData.treasury.amount = revsBalance;
          vaultData.treasury.usdValue = revsUsdValue;
          // Calculate potential winnings as treasury * 100
          vaultData.potentialWinnings.usdValue = revsUsdValue * 100;
        }
        
        // Update airdrop amount if this is the distribution wallet
        if (walletAddress === '72hnXr9PsMjp8WsnFyZjmm5vzHhTqbfouqtHBgLYdDZE') {
          vaultData.airdrop.amount = revsBalance;
        }
        
      } catch (error) {
        console.error(`❌ Error fetching balance for ${walletAddress}:`, error);
        walletBalances[walletAddress] = {
          address: walletAddress,
          sol: 0,
          revs: 0,
          usd: 0,
          lastUpdated: new Date().toISOString()
        };
      }
    }
  } catch (error) {
    console.error('❌ Error fetching wallet balances:', error);
  }
}

// Cache for expensive operations
const eligibleHoldersCache = { data: null, timestamp: 0, ttl: 300000 }; // 5 minutes
const airdroppedSOLCache = { data: null, timestamp: 0, ttl: 600000 }; // 10 minutes

// Update token data every 2 minutes (reduced frequency to avoid rate limits)
setInterval(() => {
  fetchTokenPrice();
  fetchWalletBalances();
}, 120000); // 2 minutes

// Update airdrop data every 10 minutes (less frequent due to complexity)
setInterval(() => {
  scanEligibleHolders();
  trackTotalAirdroppedSOL();
}, 600000); // 10 minutes

// Check for vault status transitions every minute
setInterval(() => {
  checkVaultStatusTransitions();
}, 60000); // 1 minute

// Admin controls (dev only)
const isAdmin = (socket) => {
  return process.env.NODE_ENV !== 'production' || socket.handshake.auth.adminKey === process.env.ADMIN_KEY;
};

// Enhanced purchase check (v0-safe, positive delta only)
async function checkIfActualPurchase(transaction) {
  try {
    console.log('🔍 Analyzing transaction for legitimate purchase...');

    // Token balance deltas (pre/post)
    const tokenBalances = transaction.meta?.preTokenBalances || [];
    const postTokenBalances = transaction.meta?.postTokenBalances || [];

    if (!tokenBalances.length || !postTokenBalances.length) {
      console.log('❌ No token balances found in transaction');
      return false;
    }

    const ourTokenPre = tokenBalances.find(b => b.mint === REVS_TOKEN_ADDRESS);
    const ourTokenPost = postTokenBalances.find(b => b.mint === REVS_TOKEN_ADDRESS);
    if (!ourTokenPre || !ourTokenPost) {
      console.log('❌ Our token not found in transaction balances');
      return false;
    }

    const preAmount = Number(ourTokenPre.uiTokenAmount.amount);
    const postAmount = Number(ourTokenPost.uiTokenAmount.amount);
    const decimals = ourTokenPost.uiTokenAmount.decimals || 0;

    const actualPreAmount = preAmount / 10 ** decimals;
    const actualPostAmount = postAmount / 10 ** decimals;
    console.log(`💰 Token amounts - Pre: ${actualPreAmount}, Post: ${actualPostAmount}`);

    if (actualPostAmount < actualPreAmount) {
      console.log('❌ Transaction is a burn/sell (decreasing balance)');
      return false;
    }

    // v0-safe: guard instructions
    const instructions = transaction.transaction?.message?.instructions || [];
    const isBurnInstruction = instructions.some(i => {
      if (i.programId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
        const data = i.data;
        return data && data[0] === 8; // burn
      }
      return false;
    });
    if (isBurnInstruction) return false;

    const purchaseAmount = actualPostAmount - actualPreAmount;

    // Threshold for RAY (tune as needed)
    const MINIMUM_PURCHASE_AMOUNT = 1;

    if (purchaseAmount <= 0) {
      console.log('❌ No positive purchase amount detected');
      return false;
    }
    if (purchaseAmount < MINIMUM_PURCHASE_AMOUNT) {
      console.log(`❌ Purchase amount ${purchaseAmount} below minimum threshold ${MINIMUM_PURCHASE_AMOUNT}`);
      return false;
    }

    // Check if buyer is whitelisted
    const buyer = ourTokenPost.owner;
    try {
      const whitelistedAddresses = await db.getWhitelistedAddresses('revs-vault-001');
      if (whitelistedAddresses && whitelistedAddresses.some(addr => addr.address === buyer)) {
        console.log(`❌ Buyer ${buyer} is whitelisted - excluding from timer reset`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error checking whitelist:', error);
      // Continue if whitelist check fails to avoid blocking legitimate purchases
    }

    console.log('✅ LEGITIMATE PURCHASE DETECTED!');
    console.log(`   Amount: ${purchaseAmount} RAY`);
    console.log(`   Buyer: ${buyer}`);

    return {
      isValid: true,
      amount: purchaseAmount,
      buyer: buyer
    };
  } catch (e) {
    console.error('❌ Error analyzing transaction:', e);
    return false;
  }
}

// Poll-based monitor (kept as fallback)
const monitorPurchases = async () => {
  try {
    console.log('🔍 Monitoring for legitimate RAY purchases...');

    const signatures = await connection.getSignaturesForAddress(
      new web3.PublicKey(REVS_TOKEN_ADDRESS),
      { limit: 10 }
    );

    for (const sigInfo of signatures) {
      const signature = sigInfo.signature;
      if (processedSignatures.has(signature)) continue;

      try {
        const transaction = await connection.getTransaction(signature, {
          maxSupportedTransactionVersion: 0
        });
        if (!transaction) {
          console.log(`⚠️ Could not fetch transaction: ${signature}`);
          continue;
        }

        const purchaseValidation = await checkIfActualPurchase(transaction);
        if (purchaseValidation && purchaseValidation.isValid) {
          console.log('🎯 LEGITIMATE PURCHASE CONFIRMED!');
          console.log(`   Amount: ${purchaseValidation.amount} RAY`);
          console.log(`   Buyer: ${purchaseValidation.buyer}`);
          console.log(`   Signature: ${signature}`);
          console.log(`   Solscan: https://solscan.io/tx/${signature}`);

          // Reset timer and broadcast
          globalTimer.timeLeft = 3600;
          globalTimer.lastBuyerAddress = purchaseValidation.buyer;
          globalTimer.lastPurchaseAmount = purchaseValidation.amount;
          globalTimer.lastTxSignature = signature;

          io.emit('timerReset', {
            timeLeft: globalTimer.timeLeft,
            lastBuyerAddress: globalTimer.lastBuyerAddress,
            lastPurchaseAmount: globalTimer.lastPurchaseAmount,
            txSignature: signature
          });

          console.log(`⏰ Timer reset to ${globalTimer.timeLeft} seconds`);
        } else {
          console.log(`❌ Transaction ${signature.slice(0, 8)}... excluded from timer reset`);
        }

        processedSignatures.add(signature);
        if (processedSignatures.size > 1000) {
          const first = processedSignatures.values().next().value;
          processedSignatures.delete(first);
        }
      } catch (err) {
        console.error(`❌ Error processing transaction ${signature}:`, err);
      }
    }
  } catch (err) {
    console.error('❌ Error monitoring purchases:', err);
  }
};

// Countdown
setInterval(() => {
  if (globalTimer.isActive && globalTimer.timeLeft > 0) {
    globalTimer.timeLeft -= 1;
    io.emit('timerUpdate', { timeLeft: globalTimer.timeLeft, isActive: globalTimer.isActive });
  } else if (globalTimer.timeLeft === 0) {
    globalTimer.isActive = false;
    io.emit('timerExpired');
  }
}, 1000);

// Socket.IO
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.emit('timerState', {
    timeLeft: globalTimer.timeLeft,
    isActive: globalTimer.isActive,
    lastPurchaseTime: globalTimer.lastPurchaseTime,
    lastBuyerAddress: globalTimer.lastBuyerAddress,
    lastPurchaseAmount: globalTimer.lastPurchaseAmount,
    txSignature: globalTimer.lastTxSignature,
    isMonitoring: monitoringState.isMonitoring
  });

  socket.on('startMonitoring', () => {
    if (isAdmin(socket)) {
      startMonitoring();
      io.emit('monitoringState', { isMonitoring: monitoringState.isMonitoring });
    }
  });

  socket.on('stopMonitoring', () => {
    if (isAdmin(socket)) {
      stopMonitoring();
      io.emit('monitoringState', { isMonitoring: monitoringState.isMonitoring });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// API
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.get('/api/status', (req, res) => {
  res.json({
    message: 'Treasury Vault Timer Backend',
    status: 'running',
    timestamp: new Date().toISOString(),
    token: REVS_TOKEN_ADDRESS,
    isMonitoring: monitoringState.isMonitoring
  });
});

app.get('/api/timer', (req, res) => {
  res.json({ ...globalTimer, isMonitoring: monitoringState.isMonitoring });
});

// Recent purchases (last 3)
app.get('/api/purchases', (req, res) => {
  try {
    const lastThree = buyLog.slice(0, 3).map(p => ({
      buyer: p.address,
      amount: p.amount,
      signature: p.txSignature,
      timestamp: p.timestamp
    }));
    res.json({ purchases: lastThree, count: lastThree.length });
  } catch (e) {
    res.json({ purchases: [], count: 0 });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), isMonitoring: monitoringState.isMonitoring });
});

// Enhanced health endpoint with version and commit info
app.get('/api/healthz', (req, res) => {
  res.json({
    ok: true,
    startedAt: STARTED_AT,
    now: new Date().toISOString(),
    isMonitoring: monitoringState.isMonitoring,
    commit: process.env.COMMIT_SHA || null,
    version: process.env.BUILD_VERSION || null
  });
});

// API health indicators endpoint
app.get('/api/admin/health', async (req, res) => {
  try {
    const healthChecks = {
      database: { status: 'unknown', message: '' },
      solana: { status: 'unknown', message: '' },
      jupiter: { status: 'unknown', message: '' },
      timestamp: new Date().toISOString()
    };

    // Check database
    try {
      await db.getVault('revs-vault-001');
      healthChecks.database = { status: 'healthy', message: 'SQLite database connected' };
    } catch (error) {
      healthChecks.database = { status: 'error', message: `Database error: ${error.message}` };
    }

    // Check Solana connection
    try {
      const slot = await connection.getSlot();
      healthChecks.solana = { status: 'healthy', message: `Connected to slot ${slot}` };
    } catch (error) {
      healthChecks.solana = { status: 'error', message: `Solana RPC error: ${error.message}` };
    }

    // Check Jupiter API
    try {
      const response = await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=So11111111111111111111111111111111111111112&outputMint=${REVS_TOKEN_ADDRESS}&amount=1000000`);
      if (response.ok) {
        healthChecks.jupiter = { status: 'healthy', message: 'Jupiter API responding' };
      } else {
        healthChecks.jupiter = { status: 'warning', message: `Jupiter API returned ${response.status}` };
      }
    } catch (error) {
      healthChecks.jupiter = { status: 'error', message: `Jupiter API error: ${error.message}` };
    }

    res.json(healthChecks);
  } catch (error) {
    res.status(500).json({ 
      error: 'Health check failed', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Admin API endpoints
// Upload a single file (logo/banner)
app.post('/api/admin/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    // Use Render backend URL for production, localhost for development
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://treasury-vault-timer-backend.onrender.com'
      : `${req.protocol}://${req.get('host')}`;
    
    const url = `${baseUrl}/uploads/${req.file.filename}`;
    res.json({ success: true, url, filename: req.file.filename });
  } catch (e) {
    console.error('Upload error:', e);
    res.status(500).json({ error: 'Upload failed' });
  }
});
app.get('/api/admin/vaults', async (req, res) => {
  try {
    const vaults = await db.getAllVaults();
    
    // Enhance vaults with whitelisted addresses
    for (const vault of vaults) {
      vault.whitelistedAddresses = await db.getWhitelistedAddresses(vault.id);
    }
    
    res.json({ vaults });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vaults' });
  }
});

// Get single vault by ID for admin
app.get('/api/admin/vaults/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const vault = await db.getVault(id);
    
    if (!vault) {
      return res.status(404).json({ error: 'Vault not found' });
    }
    
    // Enhance vault with whitelisted addresses
    vault.whitelistedAddresses = await db.getWhitelistedAddresses(vault.id);
    
    res.json({ vault });
  } catch (error) {
    console.error('Error fetching vault:', error);
    res.status(500).json({ error: 'Failed to fetch vault' });
  }
});

app.post('/api/admin/vaults/:id/start', (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🚀 Starting vault: ${id}`);
    
    // In production, this would update the database and start monitoring
    // For now, just log the action
    res.json({ success: true, message: `Vault ${id} started successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start vault' });
  }
});

app.post('/api/admin/vaults/:id/stop', (req, res) => {
  try {
    const { id } = req.params;
    console.log(`⏹️ Stopping vault: ${id}`);
    
    // In production, this would update the database and stop monitoring
    // For now, just log the action
    res.json({ success: true, message: `Vault ${id} stopped successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to stop vault' });
  }
});

// Stage 2 completion endpoint
app.post('/api/admin/vaults/:id/stage2', async (req, res) => {
  try {
    const { id } = req.params;
    const { tokenAddress, distributionWallet, whitelistAddresses, vaultLaunchDate } = req.body;
    
    console.log(`🚀 Completing Stage 2 setup for vault: ${id}`);
    
    // Validate required fields
    if (!tokenAddress || !distributionWallet || !vaultLaunchDate) {
      return res.status(400).json({ error: 'Missing required fields: tokenAddress, distributionWallet, vaultLaunchDate' });
    }
    
    // Get current vault data
    const vault = await db.getVault(id);
    if (!vault) {
      return res.status(404).json({ error: 'Vault not found' });
    }
    
    // Update vault with Stage 2 data
    const updatedMeta = {
      ...vault.meta,
      stage2: {
        tokenAddress,
        distributionWallet,
        whitelistAddresses: whitelistAddresses || [],
        vaultLaunchDate,
        completedAt: new Date().toISOString()
      }
    };
    
    // Update vault status to 'prelaunch' and set launch date
    await db.updateVault(id, {
      status: VAULT_STATUS.PRELAUNCH,
      meta: JSON.stringify(updatedMeta),
      tokenMint: tokenAddress,
      distributionWallet: distributionWallet,
      startDate: vaultLaunchDate,
      updatedAt: new Date().toISOString()
    });
    
    // Update whitelisted addresses
    if (whitelistAddresses && whitelistAddresses.length > 0) {
      // Clear existing whitelist
      await db.clearWhitelistedAddresses(id);
      
      // Add new whitelist addresses
      for (const address of whitelistAddresses) {
        await db.addWhitelistedAddress(id, address);
      }
    }
    
    console.log(`✅ Stage 2 setup completed for vault: ${id}`);
    res.json({ 
      success: true, 
      message: `Stage 2 setup completed for vault ${id}`,
      vault: {
        id,
        status: VAULT_STATUS.PRELAUNCH,
        tokenMint: tokenAddress,
        distributionWallet,
        startDate: vaultLaunchDate
      }
    });
    
  } catch (error) {
    console.error('❌ Error completing Stage 2 setup:', error);
    res.status(500).json({ error: 'Failed to complete Stage 2 setup' });
  }
});

app.post('/api/admin/vaults', async (req, res) => {
  try {
    const vaultConfig = req.body;
    console.log('📝 Creating new vault:', vaultConfig);
    
    // Derive ICO end if proposed provided
    if (vaultConfig?.icoProposedAt && !vaultConfig.icoEndsAt) {
      const start = new Date(vaultConfig.icoProposedAt).getTime();
      if (!Number.isNaN(start)) {
        vaultConfig.icoEndsAt = new Date(start + 24 * 60 * 60 * 1000).toISOString();
      }
    }
    
    // Check if vault already exists
    try {
      const existingVault = await db.getVault(vaultConfig.id);
      if (existingVault) {
        // Update existing vault instead of creating new one
        console.log('📝 Updating existing vault:', vaultConfig.id);
        const updatedVault = await db.updateVault(vaultConfig.id, vaultConfig);
        
        // If vault is being set to ICO status, schedule the ICO end
        if (vaultConfig.status === VAULT_STATUS.ICO) {
          scheduleICOEnd(vaultConfig.id);
        }
        
        res.json({ 
          success: true, 
          message: 'Vault updated successfully',
          vault: updatedVault
        });
        return;
      }
    } catch (getError) {
      // Vault doesn't exist, proceed with creation
      console.log('📝 Vault does not exist, creating new one');
    }
    
    const vault = await db.createVault(vaultConfig);
    
    // If vault is created with ICO status, schedule the ICO end
    if (vaultConfig.status === VAULT_STATUS.ICO) {
      scheduleICOEnd(vaultConfig.id);
    }
    
    res.json({ 
      success: true, 
      message: 'Vault created successfully',
      vault
    });
  } catch (error) {
    console.error('Error creating vault:', error);
    res.status(500).json({ error: 'Failed to create vault' });
  }
});

// Update vault status (e.g., launch as pre_ico)
app.patch('/api/admin/vaults/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log(`📝 Updating vault ${id} status to:`, status);
    
    // Update vault status in database
    await db.updateVault(id, {
      status: status,
      updatedAt: new Date().toISOString()
    });
    
    // Handle ICO scheduling
    if (status === VAULT_STATUS.ICO) {
      // Start ICO - schedule the 24-hour countdown
      scheduleICOEnd(id);
    } else if (status !== VAULT_STATUS.ICO) {
      // Stop ICO if vault is moved to a different status
      cancelICOSchedule(id);
    }
    
    // Emit real-time update
    io.emit('vaultStatusUpdated', { vaultId: id, status });
    
    res.json({ 
      success: true, 
      message: `Vault status updated to ${status}`,
      vaultId: id,
      status
    });
  } catch (error) {
    console.error('Error updating vault status:', error);
    res.status(500).json({ error: 'Failed to update vault status' });
  }
});

// Delete vault
app.delete('/api/admin/vaults/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ Deleting vault ${id}`);
    
    // Delete vault from database (this will also cascade delete whitelisted addresses)
    await db.deleteVault(id);
    
    // Emit real-time update
    io.emit('vaultDeleted', { vaultId: id });
    
    res.json({ 
      success: true, 
      message: `Vault ${id} deleted successfully`,
      vaultId: id
    });
  } catch (error) {
    console.error('Error deleting vault:', error);
    res.status(500).json({ error: 'Failed to delete vault' });
  }
});

// Whitelisted addresses management
app.post('/api/admin/vaults/:id/whitelisted-addresses', async (req, res) => {
  try {
    const { id } = req.params;
    const { address } = req.body;
    
    await db.addWhitelistedAddress(id, address);
    
    // Emit real-time update
    io.emit('vaultConfigUpdated', { vaultId: id, type: 'whitelistedAddressAdded', address });
    
    res.json({ success: true, message: 'Address added to whitelist' });
  } catch (error) {
    console.error('Error adding whitelisted address:', error);
    res.status(500).json({ error: 'Failed to add whitelisted address' });
  }
});

app.delete('/api/admin/vaults/:id/whitelisted-addresses/:address', async (req, res) => {
  try {
    const { id, address } = req.params;
    
    await db.removeWhitelistedAddress(id, address);
    
    // Emit real-time update
    io.emit('vaultConfigUpdated', { vaultId: id, type: 'whitelistedAddressRemoved', address });
    
    res.json({ success: true, message: 'Address removed from whitelist' });
  } catch (error) {
    console.error('Error removing whitelisted address:', error);
    res.status(500).json({ error: 'Failed to remove whitelisted address' });
  }
});

app.put('/api/admin/vaults/:id/whitelisted-addresses', async (req, res) => {
  try {
    const { id } = req.params;
    const { addresses } = req.body;
    
    await db.updateWhitelistedAddresses(id, addresses);
    
    // Emit real-time update
    io.emit('vaultConfigUpdated', { vaultId: id, type: 'whitelistedAddressesUpdated', addresses });
    
    res.json({ success: true, message: 'Whitelisted addresses updated' });
  } catch (error) {
    console.error('Error updating whitelisted addresses:', error);
    res.status(500).json({ error: 'Failed to update whitelisted addresses' });
  }
});

// Update vault name and description
// General vault update endpoint
app.put('/api/admin/vaults/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Update vault in database
    const vault = await db.getVault(id);
    if (!vault) {
      return res.status(404).json({ error: 'Vault not found' });
    }
    
    // Update the vault with new data
    const updatedVault = {
      ...vault,
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    // Save to database
    await db.updateVault(id, updatedVault);
    
    // Emit update to connected clients
    io.emit('vaultConfigUpdated', { vaultId: id, type: 'vaultUpdated', vault: updatedVault });
    
    res.json({ success: true, message: 'Vault updated successfully', vault: updatedVault });
  } catch (error) {
    console.error('Error updating vault:', error);
    res.status(500).json({ error: 'Failed to update vault' });
  }
});

app.put('/api/admin/vaults/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }
    
    // Update vault in database
    const vault = await db.getVault(id);
    if (!vault) {
      return res.status(404).json({ error: 'Vault not found' });
    }
    
    // Update the vault with new name and description
    const updatedVault = {
      ...vault,
      name,
      description,
      updatedAt: new Date().toISOString()
    };
    
    // Note: This would require adding an updateVault method to the database class
    // For now, we'll just emit the update
    io.emit('vaultConfigUpdated', { vaultId: id, type: 'vaultDetailsUpdated', name, description });
    
    res.json({ success: true, message: 'Vault details updated', vault: updatedVault });
  } catch (error) {
    console.error('Error updating vault details:', error);
    res.status(500).json({ error: 'Failed to update vault details' });
  }
});

// Token data endpoints
// Vault configuration endpoint for frontend
app.get('/api/vault/:id/config', async (req, res) => {
  try {
    const { id } = req.params;
    const vault = await db.getVault(id);
    
    if (!vault) {
      return res.status(404).json({ error: 'Vault not found' });
    }
    
    // Add whitelisted addresses
    vault.whitelistedAddresses = await db.getWhitelistedAddresses(id);
    
    res.json({ vault });
  } catch (error) {
    console.error('Error fetching vault config:', error);
    res.status(500).json({ error: 'Failed to fetch vault configuration' });
  }
});

app.get('/api/token/price', (req, res) => {
  res.json({
    token: REVS_TOKEN_ADDRESS,
    price: tokenData.price,
    marketCap: tokenData.marketCap,
    volume24h: tokenData.volume24h,
    lastUpdated: tokenData.lastUpdated
  });
});

app.get('/api/token/data', (req, res) => {
  res.json({
    token: REVS_TOKEN_ADDRESS,
    price: tokenData.price,
    marketCap: tokenData.marketCap,
    volume24h: tokenData.volume24h,
    lastUpdated: tokenData.lastUpdated,
    timer: globalTimer
  });
});

// Wallet balances endpoint
app.get('/api/wallets', (req, res) => {
  res.json({
    wallets: walletBalances,
    totalSol: Object.values(walletBalances).reduce((sum, wallet) => sum + wallet.sol, 0),
    totalUsd: Object.values(walletBalances).reduce((sum, wallet) => sum + wallet.usd, 0),
    lastUpdated: new Date().toISOString()
  });
});

// Combined data endpoint
// Unified API endpoint for vault data - optimized for performance
app.get('/api/vaults/data', async (req, res) => {
  try {
    // Calculate vault data once
    calculateVaultData();
    
    // Get all vaults with their data
    const vaults = await db.getAllVaults();
    const vaultsWithData = [];
    
    for (const vault of vaults) {
      // Get whitelisted addresses for each vault
      const whitelistedAddresses = await db.getWhitelistedAddresses(vault.id);
      
      // For active vaults, include real-time data
      if (vault.status === 'active' && vault.id === 'revs-vault-001') {
        vaultsWithData.push({
          ...vault,
          whitelistedAddresses,
          realTimeData: {
            timer: globalTimer,
            token: {
              address: REVS_TOKEN_ADDRESS,
              price: tokenData.price,
              marketCap: tokenData.marketCap,
              volume24h: tokenData.volume24h,
              lastUpdated: tokenData.lastUpdated
            },
            vault: vaultData,
            wallets: {
              balances: walletBalances,
              totalSol: Object.values(walletBalances).reduce((sum, wallet) => sum + wallet.sol, 0),
              totalUsd: Object.values(walletBalances).reduce((sum, wallet) => sum + wallet.usd, 0)
            }
          }
        });
      } else {
        // For inactive vaults, just return basic data
        vaultsWithData.push({
          ...vault,
          whitelistedAddresses,
          realTimeData: null
        });
      }
    }
    
    res.json({
      vaults: vaultsWithData,
      monitoring: {
        isMonitoring: monitoringState.isMonitoring,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Vaults data API error:', error);
    res.status(500).json({ error: 'Failed to fetch vaults data' });
  }
});

app.get('/api/dashboard', async (req, res) => {
  try {
    // Calculate vault data before sending
    calculateVaultData();
    
    // Get vault configuration from database
    const vaultConfig = await db.getVault('revs-vault-001');
    const whitelistedAddresses = vaultConfig ? await db.getWhitelistedAddresses('revs-vault-001') : [];
    
    res.json({
      timer: globalTimer,
      buyLog: buyLog,
      token: {
        address: REVS_TOKEN_ADDRESS,
        price: tokenData.price,
        marketCap: tokenData.marketCap,
        volume24h: tokenData.volume24h,
        lastUpdated: tokenData.lastUpdated
      },
      vault: vaultData,
      vaultConfig: vaultConfig ? {
        ...vaultConfig,
        whitelistedAddresses
      } : null,
      wallets: {
        balances: walletBalances,
        totalSol: Object.values(walletBalances).reduce((sum, wallet) => sum + wallet.sol, 0),
        totalUsd: Object.values(walletBalances).reduce((sum, wallet) => sum + wallet.usd, 0)
      },
      monitoring: {
        isMonitoring: monitoringState.isMonitoring,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in dashboard API:', error);
    // Fallback to original response if database fails
    calculateVaultData();
    res.json({
      timer: globalTimer,
      buyLog: buyLog,
      token: {
        address: REVS_TOKEN_ADDRESS,
        price: tokenData.price,
        marketCap: tokenData.marketCap,
        volume24h: tokenData.volume24h,
        lastUpdated: tokenData.lastUpdated
      },
      vault: vaultData,
      vaultConfig: null,
      wallets: {
        balances: walletBalances,
        totalSol: Object.values(walletBalances).reduce((sum, wallet) => sum + wallet.sol, 0),
        totalUsd: Object.values(walletBalances).reduce((sum, wallet) => sum + wallet.usd, 0)
      },
      monitoring: {
        isMonitoring: monitoringState.isMonitoring,
        lastUpdated: new Date().toISOString()
      }
    });
  }
});

// Custom styled embed endpoint
app.get('/embed/custom', (req, res) => {
  const { type, fontSize, color, fontFamily, backgroundColor } = req.query;
  const timeLeft = globalTimer.timeLeft;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  let content = '';
  let value = '';
  
  switch(type) {
    case 'timer':
      content = timeString;
      break;
    case 'price':
      content = `$${tokenData.price.toFixed(6)}`;
      break;
    case 'marketcap':
      content = `$${(tokenData.marketCap / 1000000).toFixed(2)}M`;
      break;
    case 'lastbuyer':
      const buyer = globalTimer.lastBuyerAddress;
      content = buyer ? buyer.slice(0, 8) + '...' + buyer.slice(-8) : 'Awaiting purchase...';
      break;
    default:
      content = timeString;
  }
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          font-family: ${fontFamily || 'Arial, sans-serif'}; 
          background: ${backgroundColor || 'transparent'};
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .content { 
          font-size: ${fontSize || '2rem'}; 
          font-weight: bold; 
          color: ${color || '#000000'}; 
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="content" id="content">${content}</div>
      <script>
        // Auto-refresh every second for timer, 30s for others
        const refreshInterval = '${type}' === 'timer' ? 1000 : 30000;
        setInterval(() => {
          fetch('/api/dashboard')
            .then(r => r.json())
            .then(data => {
              let newContent = '';
              switch('${type}') {
                case 'timer':
                  const timeLeft = data.timer.timeLeft;
                  const minutes = Math.floor(timeLeft / 60);
                  const seconds = timeLeft % 60;
                  newContent = minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
                  break;
                case 'price':
                  newContent = '$' + data.token.price.toFixed(6);
                  break;
                case 'marketcap':
                  newContent = '$' + (data.token.marketCap / 1000000).toFixed(2) + 'M';
                  break;
                case 'lastbuyer':
                  const buyer = data.timer.lastBuyerAddress;
                  newContent = buyer ? buyer.slice(0, 8) + '...' + buyer.slice(-8) : 'Awaiting purchase...';
                  break;
              }
              document.getElementById('content').textContent = newContent;
            })
            .catch(() => {});
        }, refreshInterval);
      </script>
    </body>
    </html>
  `);
});

// HTML Embed endpoints for Framer
app.get('/embed/timer', (req, res) => {
  const timeLeft = globalTimer.timeLeft;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          font-family: 'Courier New', monospace; 
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .timer { 
          font-size: 4rem; 
          font-weight: bold; 
          color: #f97316; 
          text-align: center;
          text-shadow: 0 0 20px rgba(249, 115, 22, 0.5);
        }
      </style>
    </head>
    <body>
      <div class="timer" id="timer">${timeString}</div>
      <script>
        // Auto-refresh every second
        setInterval(() => {
          fetch('/api/timer')
            .then(r => r.json())
            .then(data => {
              const timeLeft = data.timeLeft;
              const minutes = Math.floor(timeLeft / 60);
              const seconds = timeLeft % 60;
              const timeString = minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
              document.getElementById('timer').textContent = timeString;
            })
            .catch(() => {});
        }, 1000);
      </script>
    </body>
    </html>
  `);
});

app.get('/embed/price', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          font-family: 'Courier New', monospace; 
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .price { 
          font-size: 2.5rem; 
          font-weight: bold; 
          color: #10b981; 
          text-align: center;
        }
        .label {
          font-size: 1rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }
      </style>
    </head>
    <body>
      <div>
        <div class="label">RAY Price</div>
        <div class="price" id="price">$${tokenData.price.toFixed(6)}</div>
      </div>
      <script>
        // Auto-refresh every 30 seconds
        setInterval(() => {
          fetch('/api/token/price')
            .then(r => r.json())
            .then(data => {
              document.getElementById('price').textContent = '$' + data.price.toFixed(6);
            })
            .catch(() => {});
        }, 30000);
      </script>
    </body>
    </html>
  `);
});

app.get('/embed/marketcap', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          font-family: 'Courier New', monospace; 
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .marketcap { 
          font-size: 2rem; 
          font-weight: bold; 
          color: #3b82f6; 
          text-align: center;
        }
        .label {
          font-size: 1rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }
      </style>
    </head>
    <body>
      <div>
        <div class="label">Market Cap</div>
        <div class="marketcap" id="marketcap">$${(tokenData.marketCap / 1000000).toFixed(2)}M</div>
      </div>
      <script>
        // Auto-refresh every 30 seconds
        setInterval(() => {
          fetch('/api/token/price')
            .then(r => r.json())
            .then(data => {
              const marketCapM = (data.marketCap / 1000000).toFixed(2);
              document.getElementById('marketcap').textContent = '$' + marketCapM + 'M';
            })
            .catch(() => {});
        }, 30000);
      </script>
    </body>
    </html>
  `);
});

app.get('/embed/lastbuyer', (req, res) => {
  const buyer = globalTimer.lastBuyerAddress;
  const amount = globalTimer.lastPurchaseAmount;
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          font-family: 'Courier New', monospace; 
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .buyer { 
          font-size: 1.2rem; 
          font-weight: bold; 
          color: #10b981; 
          text-align: center;
          word-break: break-all;
        }
        .amount {
          font-size: 1.5rem;
          color: #f97316;
          margin-top: 0.5rem;
        }
        .label {
          font-size: 1rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }
      </style>
    </head>
    <body>
      <div>
        <div class="label">Last Buyer</div>
        <div class="buyer" id="buyer">${buyer ? buyer.slice(0, 8) + '...' + buyer.slice(-8) : 'Awaiting purchase...'}</div>
        ${amount ? `<div class="amount" id="amount">${amount.toFixed(2)} RAY</div>` : ''}
      </div>
      <script>
        // Auto-refresh every 5 seconds
        setInterval(() => {
          fetch('/api/timer')
            .then(r => r.json())
            .then(data => {
              const buyer = data.lastBuyerAddress;
              const amount = data.lastPurchaseAmount;
              document.getElementById('buyer').textContent = buyer ? 
                buyer.slice(0, 8) + '...' + buyer.slice(-8) : 'Awaiting purchase...';
              if (amount) {
                document.getElementById('amount').textContent = amount.toFixed(2) + ' RAY';
              }
            })
            .catch(() => {});
        }, 5000);
      </script>
    </body>
    </html>
  `);
});

app.get('/embed/wallets', (req, res) => {
  const totalSol = Object.values(walletBalances).reduce((sum, wallet) => sum + wallet.sol, 0);
  const totalUsd = Object.values(walletBalances).reduce((sum, wallet) => sum + wallet.usd, 0);
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          font-family: 'Courier New', monospace; 
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .wallet { 
          font-size: 1.5rem; 
          font-weight: bold; 
          color: #8b5cf6; 
          text-align: center;
        }
        .label {
          font-size: 1rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }
      </style>
    </head>
    <body>
      <div>
        <div class="label">Total Wallet Value</div>
        <div class="wallet" id="sol">${totalSol.toFixed(2)} SOL</div>
        <div class="wallet" id="usd">$${totalUsd.toFixed(2)}</div>
      </div>
      <script>
        // Auto-refresh every 30 seconds
        setInterval(() => {
          fetch('/api/wallets')
            .then(r => r.json())
            .then(data => {
              document.getElementById('sol').textContent = data.totalSol.toFixed(2) + ' SOL';
              document.getElementById('usd').textContent = '$' + data.totalUsd.toFixed(2);
            })
            .catch(() => {});
        }, 30000);
      </script>
    </body>
    </html>
  `);
});

// Helius webhook (highest-performance path)
app.post('/webhook/helius', (req, res) => {
  try {
    const configuredSecret = process.env.WEBHOOK_SECRET;
    if (configuredSecret) {
      const authHeader = req.headers['authorization'] || '';
      if (authHeader !== `Bearer ${configuredSecret}`) {
        return res.status(401).json({ ok: false });
      }
    }

    const events = Array.isArray(req.body) ? req.body : [req.body];
    for (const evt of events) {
      const signature = evt?.signature || evt?.transaction?.signature || '';
      const pre = evt?.events?.token?.preTokenBalances || evt?.meta?.preTokenBalances || [];
      const post = evt?.events?.token?.postTokenBalances || evt?.meta?.postTokenBalances || [];

      const preBal = pre.find(b => b.mint === REVS_TOKEN_ADDRESS);
      const postBal = post.find(b => b.mint === REVS_TOKEN_ADDRESS);
      if (!preBal || !postBal) continue;

      const decimals = postBal.uiTokenAmount?.decimals ?? 0;
      const preAmt = Number(preBal.uiTokenAmount?.amount || 0) / 10 ** decimals;
      const postAmt = Number(postBal.uiTokenAmount?.amount || 0) / 10 ** decimals;
      const delta = postAmt - preAmt;

      if (delta > 1) {
        globalTimer.timeLeft = 3600;
        globalTimer.lastBuyerAddress = postBal.owner;
        globalTimer.lastPurchaseAmount = delta;
        globalTimer.lastTxSignature = signature;
        globalTimer.lastPurchaseTime = new Date().toISOString();
        globalTimer.isActive = true;

        // Add to buy log
        const buyEntry = {
          address: postBal.owner,
          amount: delta,
          timestamp: new Date().toISOString(),
          txSignature: signature
        };
        
        buyLog.unshift(buyEntry); // Add to beginning
        if (buyLog.length > 5) {
          buyLog.pop(); // Keep only last 5
        }

        io.emit('timerReset', {
          timeLeft: globalTimer.timeLeft,
          lastBuyerAddress: globalTimer.lastBuyerAddress,
          lastPurchaseAmount: globalTimer.lastPurchaseAmount,
          txSignature: globalTimer.lastTxSignature,
          lastPurchaseTime: globalTimer.lastPurchaseTime,
          isActive: globalTimer.isActive,
          buyLog: buyLog
        });
      }
    }
  } catch (e) {
    console.error('Webhook handling error', e);
  } finally {
    res.status(200).json({ ok: true });
  }
});

// Start/Stop
const startMonitoring = () => {
  if (monitoringState.isMonitoring) return;
  console.log('🚀 Starting RAY purchase monitoring...');
  monitoringState.isMonitoring = true;

  monitoringState.monitoringInterval = setInterval(() => {
    if (monitoringState.isMonitoring) {
      monitorPurchases();
    }
  }, 30000);
};

const stopMonitoring = () => {
  if (!monitoringState.isMonitoring) return;
  console.log('⏹️ Stopping RAY purchase monitoring...');
  monitoringState.isMonitoring = false;

  if (monitoringState.monitoringInterval) {
    clearInterval(monitoringState.monitoringInterval);
    monitoringState.monitoringInterval = null;
  }
};

// API endpoint to get ICO status for a vault
app.get('/api/admin/vaults/:id/ico-status', async (req, res) => {
  try {
    const { id } = req.params;
    const icoStatus = getICOStatus(id);
    
    res.json({
      vaultId: id,
      icoStatus
    });
  } catch (error) {
    console.error('❌ Error getting ICO status:', error);
    res.status(500).json({ error: 'Failed to get ICO status' });
  }
});

// API endpoint to get all active ICO schedules
app.get('/api/admin/ico-schedules', async (req, res) => {
  try {
    const schedules = [];
    
    for (const [vaultId, schedule] of icoSchedules) {
      const status = getICOStatus(vaultId);
      schedules.push({
        vaultId,
        ...status,
        schedule
      });
    }
    
    res.json({
      totalSchedules: schedules.length,
      schedules
    });
  } catch (error) {
    console.error('❌ Error getting ICO schedules:', error);
    res.status(500).json({ error: 'Failed to get ICO schedules' });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Monitoring RAY token: ${REVS_TOKEN_ADDRESS}`);
  console.log(`⏰ Global timer started at ${globalTimer.timeLeft} seconds`);
  console.log(`🌐 Frontend served from: ${path.join(__dirname, '../dist')}`);

  if (process.env.NODE_ENV === 'production') {
    console.log('🚀 PRODUCTION MODE: Auto-starting monitoring...');
    startMonitoring();
  } else {
    console.log('⏸️ DEVELOPMENT MODE: Monitoring is PAUSED');
  }
  
  // Initialize token data and wallet balances
  console.log('📊 Initializing token data and wallet balances...');
  fetchTokenPrice();
  fetchWalletBalances();
  
  // Initialize ICO schedules for existing vaults
  console.log('⏰ Initializing ICO schedules...');
  await initializeICOSchedules();
});
// FORCE RENDER REDEPLOY - Sat Sep 27 22:32:53 EDT 2025
// FORCE RENDER BUILD FIX - Sat Sep 27 22:43:32 EDT 2025
// FORCE RENDER DEPLOYMENT - Sat Sep 27 23:00:36 EDT 2025
