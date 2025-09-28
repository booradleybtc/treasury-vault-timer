'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { VaultCardPreview } from '@/components/admin/VaultCardPreview';

export default function AdminIndex() {
  const router = useRouter();
  const [vaults, setVaults] = useState<any[]>([]);
  const [pendingVaults, setPendingVaults] = useState<any[]>([]);
  const [winnerVaults, setWinnerVaults] = useState<any[]>([]);
  const [endgameVaults, setEndgameVaults] = useState<any[]>([]);
  const [refundVaults, setRefundVaults] = useState<any[]>([]);
  const [monitoringVaults, setMonitoringVaults] = useState<any[]>([]);
  const [stage, setStage] = useState<'all'|'pre_ico'|'ico'|'countdown'|'active'|'extinct'>('all');
  const [deletingVault, setDeletingVault] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // Helper function to get the correct page URL based on vault status
  const getVaultPageUrl = (vault: any) => {
    switch (vault.status) {
      case 'pre_ico_scheduled':
      case 'pre_ico':
        return `/admin/ico/${vault.id}`;
      case 'ico':
        return `/admin/ico/${vault.id}`;
      case 'pending':
        return `/admin/pending/${vault.id}`;
      case 'prelaunch':
        return `/admin/prelaunch/${vault.id}`;
      case 'active':
        return `/admin/active/${vault.id}`;
      case 'winner_confirmation':
        return `/admin/winner/${vault.id}`;
      case 'endgame_processing':
        return `/admin/endgame/${vault.id}`;
      case 'refund_required':
        return `/admin/refund/${vault.id}`;
      default:
        return `/admin/details/${vault.id}`;
    }
  };

  // Helper function to get the correct button text based on vault status
  const getVaultButtonText = (vault: any) => {
    switch (vault.status) {
      case 'pre_ico_scheduled':
      case 'pre_ico':
        return 'View ICO';
      case 'ico':
        return 'View ICO';
      case 'pending':
        return 'Complete Stage 2';
      case 'prelaunch':
        return 'View Prelaunch';
      case 'active':
        return 'View Active Vault';
      case 'winner_confirmation':
        return 'Process Claim';
      case 'endgame_processing':
        return 'Process Airdrops';
      case 'refund_required':
        return 'Process Refund';
      default:
        return 'View Details';
    }
  };
  const BACKEND = (process.env.NEXT_PUBLIC_BACKEND_URL || 'https://treasury-vault-timer-backend.onrender.com').replace(/\/$/, '');

  useEffect(() => {
    const loadAllData = async () => {
      try {
        // Load all data in parallel instead of sequential calls
        const [vaultsRes, pendingRes, winnersRes, endgameRes, refundsRes, monitoringRes] = await Promise.allSettled([
          fetch(`${BACKEND}/api/admin/vaults`),
          fetch(`${BACKEND}/api/admin/vaults/pending`),
          fetch(`${BACKEND}/api/admin/vaults/winner-confirmation`),
          fetch(`${BACKEND}/api/admin/vaults/endgame-processing`),
          fetch(`${BACKEND}/api/admin/vaults/refund-required`),
          fetch(`${BACKEND}/api/admin/vaults/monitoring-overview`)
        ]);

        // Process results
        if (vaultsRes.status === 'fulfilled') {
          const js = await vaultsRes.value.json();
          setVaults(js.vaults || []);
        }
        
        if (pendingRes.status === 'fulfilled') {
          const js = await pendingRes.value.json();
          setPendingVaults(js.pendingVaults || []);
        }
        
        if (winnersRes.status === 'fulfilled') {
          const js = await winnersRes.value.json();
          setWinnerVaults(js.winnerVaults || []);
        }
        
        if (endgameRes.status === 'fulfilled') {
          const js = await endgameRes.value.json();
          setEndgameVaults(js.endgameVaults || []);
        }
        
        if (refundsRes.status === 'fulfilled') {
          const js = await refundsRes.value.json();
          setRefundVaults(js.refundVaults || []);
        }
        
        if (monitoringRes.status === 'fulfilled') {
          const js = await monitoringRes.value.json();
          setMonitoringVaults(js.vaults || []);
        }
      } catch (error) {
        console.error('Error loading admin data:', error);
      }
    };
    
    loadAllData();
  }, [BACKEND]);

  // Reset delete state after 5 seconds of inactivity
  useEffect(() => {
    if (deletingVault) {
      const timer = setTimeout(() => {
        setDeletingVault(null);
        setConfirmDelete(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [deletingVault]);

  const checkTreasuryBalance = async (vaultId: string) => {
    try {
      const response = await fetch(`${BACKEND}/api/admin/vaults/${vaultId}/treasury-balance`);
      const data = await response.json();
      
      if (response.ok) {
        const assets = Object.entries(data.assetBalances).map(([symbol, info]: [string, any]) => 
          `${info.amount.toFixed(4)} ${symbol} ($${info.usd.toFixed(2)})`
        ).join(', ');
        
        alert(`Treasury Balance for ${vaultId}:\nTotal: $${data.totalUSDValue.toFixed(2)}\nAssets: ${assets}\nThreshold Met: ${data.thresholdMet ? 'Yes' : 'No'}`);
      } else {
        alert('Failed to fetch treasury balance');
      }
    } catch (error) {
      console.error('Error checking treasury balance:', error);
      alert('Error checking treasury balance');
    }
  };

  const checkMonitoringStatus = async (vaultId: string) => {
    try {
      const response = await fetch(`${BACKEND}/api/admin/vaults/${vaultId}/monitoring-status`);
      const data = await response.json();
      
      if (response.ok) {
        if (data.isMonitoring) {
          alert(`Monitoring Status for ${vaultId}:\nToken: ${data.tokenMint}\nTime Left: ${Math.floor(data.timeLeft / 60)}m ${data.timeLeft % 60}s\nStatus: ${data.isActive ? 'Active' : 'Inactive'}\nLast Purchase: ${data.lastPurchaseTime ? new Date(data.lastPurchaseTime).toLocaleString() : 'None'}`);
        } else {
          alert(`Vault ${vaultId} is not currently being monitored.`);
        }
      } else {
        alert('Failed to fetch monitoring status');
      }
    } catch (error) {
      console.error('Error checking monitoring status:', error);
      alert('Error checking monitoring status');
    }
  };

  // Admin control functions for testing progression
  const forceICOEnd = async (vaultId: string) => {
    if (!confirm(`Force ICO to end for vault ${vaultId}?`)) return;
    
    try {
      const response = await fetch(`${BACKEND}/api/admin/vaults/${vaultId}/force-ico-end`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        alert(`ICO ended for vault ${vaultId}\nNew Status: ${data.newStatus}\nThreshold Met: ${data.thresholdMet ? 'Yes' : 'No'}`);
        // Reload data
        window.location.reload();
      } else {
        alert('Failed to force ICO end');
      }
    } catch (error) {
      console.error('Error forcing ICO end:', error);
      alert('Error forcing ICO end');
    }
  };

  const forceICOSuccess = async (vaultId: string) => {
    if (!confirm(`Force ICO success for vault ${vaultId}? This will bypass threshold check and move to Stage 2.`)) return;
    
    try {
      const response = await fetch(`${BACKEND}/api/admin/vaults/${vaultId}/force-ico-success`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        alert(`ICO success forced for vault ${vaultId}\nMoved to pending for Stage 2 setup.`);
        // Reload data
        window.location.reload();
      } else {
        alert('Failed to force ICO success');
      }
    } catch (error) {
      console.error('Error forcing ICO success:', error);
      alert('Error forcing ICO success');
    }
  };

  const forceLaunch = async (vaultId: string) => {
    if (!confirm(`Force launch for vault ${vaultId}?`)) return;
    
    try {
      const response = await fetch(`${BACKEND}/api/admin/vaults/${vaultId}/force-launch`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        alert(`Vault ${vaultId} launched successfully!`);
        // Reload data
        window.location.reload();
      } else {
        alert('Failed to force launch');
      }
    } catch (error) {
      console.error('Error forcing launch:', error);
      alert('Error forcing launch');
    }
  };

  const forceTimerExpire = async (vaultId: string) => {
    if (!confirm(`Force timer to expire for vault ${vaultId}?`)) return;
    
    try {
      const response = await fetch(`${BACKEND}/api/admin/vaults/${vaultId}/force-timer-expire`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        alert(`Timer expired for vault ${vaultId}\nNew Status: ${data.newStatus}`);
        // Reload data
        window.location.reload();
      } else {
        alert('Failed to force timer expiration');
      }
    } catch (error) {
      console.error('Error forcing timer expiration:', error);
      alert('Error forcing timer expiration');
    }
  };

  const forceEndgame = async (vaultId: string) => {
    if (!confirm(`Force endgame for vault ${vaultId}?`)) return;
    
    try {
      const response = await fetch(`${BACKEND}/api/admin/vaults/${vaultId}/force-endgame`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        alert(`Endgame triggered for vault ${vaultId}\nNew Status: ${data.newStatus}`);
        // Reload data
        window.location.reload();
      } else {
        alert('Failed to force endgame');
      }
    } catch (error) {
      console.error('Error forcing endgame:', error);
      alert('Error forcing endgame');
    }
  };

  const handleDeleteVault = async (vaultId: string) => {
    if (deletingVault !== vaultId) {
      // First confirmation
      setDeletingVault(vaultId);
      return;
    }
    
    if (confirmDelete !== vaultId) {
      // Second confirmation
      setConfirmDelete(vaultId);
      return;
    }

    try {
      const res = await fetch(`${BACKEND}/api/admin/vaults/${vaultId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok) {
        // Remove vault from local state
        setVaults(vaults.filter(v => v.id !== vaultId));
        alert('Vault deleted successfully');
      } else {
        alert('Failed to delete vault');
      }
    } catch (error) {
      console.error('Error deleting vault:', error);
      alert('Error deleting vault');
    } finally {
      setDeletingVault(null);
      setConfirmDelete(null);
    }
  };

  return (
    <div className="min-h-screen w-full" style={{
      background: "linear-gradient(180deg, rgba(8,12,24,.55) 0%, rgba(8,12,20,.65) 45%, rgba(6,10,16,.85) 100%), url('/images/upscaled_lofi_rainforest.png') center 70% / cover fixed",
    }}>
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/admin')}
            className="text-white/70 hover:text-white flex items-center gap-2"
          >
            ← Back to Admin Dashboard
          </button>
        </div>
        <h1 className="text-2xl font-bold text-white mb-6">Vault Management</h1>
        
        {/* Pending Stage 2 Vaults Section */}
        {pendingVaults.length > 0 && (
          <div className="mb-8">
            <div className="bg-yellow-500/10 ring-1 ring-yellow-500/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-yellow-300 font-semibold flex items-center gap-2">
                  ⚠️ Stage 2 Setup Required ({pendingVaults.length} vault{pendingVaults.length !== 1 ? 's' : ''})
                </div>
                <div className="text-yellow-400 text-sm">
                  48-hour timeout before auto-refund
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {pendingVaults.map(v => (
                  <div key={v.id} className="flex items-center justify-between bg-yellow-500/5 ring-1 ring-yellow-500/20 p-4">
                    <div className="text-white flex-1">
                      <div className="font-semibold text-lg">{v.name}</div>
                      <div className="text-xs text-white/60 mb-1">{v.id}</div>
                      <div className="text-sm text-white/80">
                        <span className="mr-4">Raised: ${(v.totalVolume || 0).toLocaleString()}</span>
                        <span className="mr-4">Pending: {v.pendingInfo?.hoursPending || 0}h</span>
                        <span className="text-yellow-400">
                          Time remaining: {v.pendingInfo?.hoursRemaining || 0}h
                        </span>
                      </div>
                      <div className="text-xs text-white/60 mt-1">
                        Treasury: {v.treasuryWallet}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-300">
                        PENDING
                      </span>
                      <button 
                        onClick={() => checkTreasuryBalance(v.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs"
                      >
                        Check Balance
                      </button>
                      <button 
                        onClick={() => router.push(`/admin/stage2/${v.id}`)}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 text-sm font-semibold"
                      >
                        Complete Stage 2
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Refund Required Section */}
        {refundVaults.length > 0 && (
          <div className="mb-8">
            <div className="bg-red-500/10 ring-1 ring-red-500/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-red-300 font-semibold flex items-center gap-2">
                  💰 Refunds Required ({refundVaults.length} vault{refundVaults.length !== 1 ? 's' : ''})
                </div>
                <div className="text-red-400 text-sm">
                  Manual refund processing required
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {refundVaults.map(v => (
                  <div key={v.id} className="flex items-center justify-between bg-red-500/5 ring-1 ring-red-500/20 p-4">
                    <div className="text-white flex-1">
                      <div className="font-semibold text-lg">{v.name}</div>
                      <div className="text-xs text-white/60 mb-1">{v.id}</div>
                      <div className="text-sm text-white/80">
                        <span className="mr-4">Amount: ${(v.totalVolume || 0).toLocaleString()}</span>
                        <span className="mr-4">Treasury: {v.treasuryWallet}</span>
                        <span className="text-red-400">
                          Status: {v.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-300">
                        REFUND REQUIRED
                      </span>
                      <button 
                        onClick={() => router.push(`/admin/refund/${v.id}`)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-semibold"
                      >
                        Process Refund
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Winner Confirmation Section */}
        {winnerVaults.length > 0 && (
          <div className="mb-8">
            <div className="bg-purple-500/10 ring-1 ring-purple-500/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-purple-300 font-semibold flex items-center gap-2">
                  🏆 Winner Confirmation ({winnerVaults.length} vault{winnerVaults.length !== 1 ? 's' : ''})
                </div>
                <div className="text-purple-400 text-sm">
                  Timer expired - winners need to claim
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {winnerVaults.map(v => (
                  <div key={v.id} className="flex items-center justify-between bg-purple-500/5 ring-1 ring-purple-500/20 p-4">
                    <div className="text-white flex-1">
                      <div className="font-semibold text-lg">{v.name}</div>
                      <div className="text-xs text-white/60 mb-1">{v.id}</div>
                      <div className="text-sm text-white/80">
                        <span className="mr-4">Winner: {v.winner?.winnerAddress || 'Unknown'}</span>
                        <span className="mr-4">Treasury: ${(v.totalVolume || 0).toLocaleString()}</span>
                        {v.winner?.lastPurchaseTime && (
                          <span className="text-purple-400">
                            Last Purchase: {new Date(v.winner.lastPurchaseTime).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-300">
                        WINNER
                      </span>
                      <button 
                        onClick={() => router.push(`/admin/winner/${v.id}`)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 text-sm font-semibold"
                      >
                        Process Claim
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Endgame Processing Section */}
        {endgameVaults.length > 0 && (
          <div className="mb-8">
            <div className="bg-orange-500/10 ring-1 ring-orange-500/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-orange-300 font-semibold flex items-center gap-2">
                  🎯 Endgame Processing ({endgameVaults.length} vault{endgameVaults.length !== 1 ? 's' : ''})
                </div>
                <div className="text-orange-400 text-sm">
                  Vault lifespan reached - process airdrops
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {endgameVaults.map(v => (
                  <div key={v.id} className="flex items-center justify-between bg-orange-500/5 ring-1 ring-orange-500/20 p-4">
                    <div className="text-white flex-1">
                      <div className="font-semibold text-lg">{v.name}</div>
                      <div className="text-xs text-white/60 mb-1">{v.id}</div>
                      <div className="text-sm text-white/80">
                        <span className="mr-4">Token: {v.tokenMint}</span>
                        <span className="mr-4">Treasury: ${(v.totalVolume || 0).toLocaleString()}</span>
                        <span className="text-orange-400">
                          Endgame: {new Date(v.updatedAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-300">
                        ENDGAME
                      </span>
                      <button 
                        onClick={() => router.push(`/admin/endgame/${v.id}`)}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 text-sm font-semibold"
                      >
                        Process Airdrops
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Active Vault Monitoring Section */}
        {monitoringVaults.length > 0 && (
          <div className="mb-8">
            <div className="bg-green-500/10 ring-1 ring-green-500/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-green-300 font-semibold flex items-center gap-2">
                  📡 Active Vault Monitoring ({monitoringVaults.length} vault{monitoringVaults.length !== 1 ? 's' : ''})
                </div>
                <div className="text-green-400 text-sm">
                  Real-time token purchase monitoring
                </div>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {monitoringVaults.map(v => (
                  <div key={v.vaultId} className="flex items-center justify-between bg-green-500/5 ring-1 ring-green-500/20 p-4">
                    <div className="text-white flex-1">
                      <div className="font-semibold text-lg">{v.vaultId}</div>
                      <div className="text-xs text-white/60 mb-1">Token: {v.tokenMint}</div>
                      <div className="text-sm text-white/80">
                        <span className="mr-4">Time Left: {Math.floor(v.timeLeft / 60)}m {v.timeLeft % 60}s</span>
                        <span className="mr-4">Status: {v.isActive ? 'Active' : 'Inactive'}</span>
                        {v.lastPurchaseTime && (
                          <span className="text-green-400">
                            Last Purchase: {new Date(v.lastPurchaseTime).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-1 rounded ${
                        v.isActive ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
                      }`}>
                        {v.isActive ? 'MONITORING' : 'INACTIVE'}
                      </span>
                      <button 
                        onClick={() => checkMonitoringStatus(v.vaultId)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs"
                      >
                        Status
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-8">
          <div className="bg-white/5 ring-1 ring-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-white font-semibold">View Vaults on Platform</div>
              <select className="bg-white/10 text-white px-3 py-1" value={stage} onChange={(e)=>setStage(e.target.value as any)}>
                <option value="all">All</option>
                <option value="pre_ico">Pre‑ICO</option>
                <option value="ico">ICO Now</option>
                <option value="pending">Pending</option>
                <option value="prelaunch">Pre-Launch</option>
                <option value="active">Live</option>
                <option value="winner_confirmation">Winner</option>
                <option value="endgame_processing">Endgame</option>
                <option value="extinct">Extinct</option>
              </select>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {vaults.filter(v => stage==='all' || (v.status||'').toLowerCase()===stage).map(v => (
                <div key={v.id} className="flex items-center justify-between bg-white/5 ring-1 ring-white/10 p-4">
                  <div className="text-white flex-1">
                    <div className="font-semibold text-lg">{v.name}</div>
                    <div className="text-xs text-white/60 mb-1">{v.id}</div>
                    <div className="text-sm text-white/80">
                      {v.meta?.ticker && <span className="mr-4">Ticker: {v.meta.ticker}</span>}
                      {v.meta?.vaultAsset && <span className="mr-4">Asset: {v.meta.vaultAsset}</span>}
                      {v.createdAt && <span>Created: {new Date(v.createdAt).toLocaleDateString()}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded ${
                      v.status === 'active' ? 'bg-green-500/20 text-green-300' :
                      v.status === 'pre_ico' ? 'bg-cyan-500/20 text-cyan-300' :
                      v.status === 'ico' ? 'bg-blue-500/20 text-blue-300' :
                      v.status === 'prelaunch' ? 'bg-purple-500/20 text-purple-300' :
                      v.status === 'pending' ? 'bg-orange-500/20 text-orange-300' :
                      v.status === 'winner_confirmation' ? 'bg-purple-500/20 text-purple-300' :
                      v.status === 'endgame_processing' ? 'bg-orange-500/20 text-orange-300' :
                      v.status === 'extinct' ? 'bg-red-500/20 text-red-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {(v.status||'draft').toUpperCase()}
                    </span>
                    
                    {/* Admin Control Buttons for Testing */}
                    {v.status === 'ico' && (
                      <>
                        <button 
                          onClick={() => forceICOEnd(v.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 text-xs"
                          title="Force ICO to end (for testing)"
                        >
                          End ICO
                        </button>
                        <button 
                          onClick={() => forceICOSuccess(v.id)}
                          className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs"
                          title="Force ICO success - bypass threshold (for testing)"
                        >
                          Force Success
                        </button>
                      </>
                    )}
                    
                    {v.status === 'prelaunch' && (
                      <button 
                        onClick={() => forceLaunch(v.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 text-xs"
                        title="Force vault to launch (for testing)"
                      >
                        Launch
                      </button>
                    )}
                    
                    {v.status === 'active' && (
                      <>
                        <button 
                          onClick={() => forceTimerExpire(v.id)}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 text-xs"
                          title="Force timer to expire (for testing)"
                        >
                          Expire Timer
                        </button>
                        <button 
                          onClick={() => forceEndgame(v.id)}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-2 py-1 text-xs"
                          title="Force endgame (for testing)"
                        >
                          Endgame
                        </button>
                      </>
                    )}
                    
                    <button 
                      onClick={() => router.push(getVaultPageUrl(v))} 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs"
                    >
                      {getVaultButtonText(v)}
                    </button>
                    <button onClick={()=>router.push(`/vault/${v.id}`)} className="bg-white/10 ring-1 ring-white/20 text-white px-3 py-1 text-xs hover:bg-white/20">View</button>
                    {deletingVault === v.id ? (
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleDeleteVault(v.id)}
                          className={`px-3 py-1 text-xs transition-colors ${
                            confirmDelete === v.id
                              ? 'bg-red-600 text-white hover:bg-red-700'
                              : 'bg-orange-500/20 text-orange-300 hover:bg-orange-500/30'
                          }`}
                        >
                          {confirmDelete === v.id ? 'Confirm Delete' : 'Click Again'}
                        </button>
                        <button 
                          onClick={() => {
                            setDeletingVault(null);
                            setConfirmDelete(null);
                          }}
                          className="bg-gray-500/20 text-gray-300 hover:bg-gray-500/30 px-3 py-1 text-xs transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleDeleteVault(v.id)}
                        className="bg-red-500/20 text-red-300 hover:bg-red-500/30 px-3 py-1 text-xs transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {vaults.length===0 && <div className="text-white/60">No vaults yet.</div>}
            </div>
          </div>
        </div>

        {/* Vault Card Preview Section */}
        <div className="mb-8">
          <div className="bg-white/5 ring-1 ring-white/10 p-4">
            <div className="flex items-center justify-between mb-6">
              <div className="text-white font-semibold text-xl">Vault Card Preview & Design</div>
              <div className="flex items-center gap-4">
                <select className="bg-white/10 text-white px-4 py-2 rounded" value={stage} onChange={(e)=>setStage(e.target.value as any)}>
                  <option value="pre_ico">Pre‑ICO</option>
                  <option value="ico">ICO Live</option>
                  <option value="pending">Pending</option>
                  <option value="prelaunch">Pre-Launch</option>
                  <option value="active">Live</option>
                  <option value="winner_confirmation">Winner Confirmation</option>
                  <option value="endgame_processing">Endgame Processing</option>
                  <option value="extinct">Extinct</option>
                </select>
                <button 
                  onClick={() => router.push('/admin/card-preview')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded"
                >
                  Full Card Preview
                </button>
              </div>
            </div>
            
            {/* Single Card Previews - Clean Layout */}
            <div className="space-y-8">
              {/* Featured Card Preview */}
              <div>
                <h3 className="text-white font-semibold mb-4 text-lg">Featured Card</h3>
                <div className="max-w-4xl">
                  {vaults.length > 0 ? (
                    <VaultCardPreview 
                      vault={vaults.find(v => v.status === stage) || vaults[0]} 
                      variant="featured" 
                      className="scale-90 origin-top-left"
                    />
                  ) : (
                    <div className="text-white/60 text-center py-8">
                      No vaults available for preview
                    </div>
                  )}
                </div>
              </div>
              
              {/* Tall Card Preview */}
              <div>
                <h3 className="text-white font-semibold mb-4 text-lg">Tall Card</h3>
                <div className="max-w-md">
                  {vaults.length > 0 ? (
                    <VaultCardPreview 
                      vault={vaults.find(v => v.status === stage) || vaults[0]} 
                      variant="tall" 
                      className="scale-75 origin-top-left"
                    />
                  ) : (
                    <div className="text-white/60 text-center py-8">
                      No vaults available for preview
                    </div>
                  )}
                </div>
              </div>
              
              {/* List Card Preview */}
              <div>
                <h3 className="text-white font-semibold mb-4 text-lg">List Card</h3>
                <div className="max-w-2xl">
                  {vaults.length > 0 ? (
                    <VaultCardPreview 
                      vault={vaults.find(v => v.status === stage) || vaults[0]} 
                      variant="row" 
                      className="scale-90 origin-top-left"
                    />
                  ) : (
                    <div className="text-white/60 text-center py-8">
                      No vaults available for preview
                    </div>
                  )}
                </div>
              </div>
              
              {/* Dedicated Page Preview */}
              <div>
                <h3 className="text-white font-semibold mb-4 text-lg">Dedicated Page</h3>
                <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                  <div className="text-white/80 text-center py-8">
                    <div className="text-lg font-semibold mb-2">Dedicated Vault Page</div>
                    <div className="text-sm text-white/60 mb-4">
                      Full vault details, trading interface, and real-time data
                    </div>
                    <button 
                      onClick={() => {
                        const vault = vaults.find(v => v.status === stage) || vaults[0];
                        if (vault) router.push(`/vault/${vault.id}`);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
                      disabled={vaults.length === 0}
                    >
                      {vaults.length > 0 ? 'View Dedicated Page' : 'No Vaults Available'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


