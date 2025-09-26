'use client';

import React from 'react';
import { StatusAwareVaultCard } from '@/components/darwin/StatusAwareVaultCard';

interface VaultCardPreviewProps {
  vault: any;
  variant: 'featured' | 'tall' | 'row';
  className?: string;
}

export function VaultCardPreview({ vault, variant, className = "" }: VaultCardPreviewProps) {
  if (!vault) {
    return (
      <div className={`vault-card-preview ${className}`}>
        <div className="text-white/60 text-center py-8">
          No vault data available
        </div>
      </div>
    );
  }

  return (
    <div className={`vault-card-preview ${className}`}>
      <div className="scale-75 origin-top-left transform-gpu">
        <StatusAwareVaultCard
          vault={vault}
          variant={variant}
          onTrade={() => {}}
          onClickTitle={() => {}}
        />
      </div>
    </div>
  );
}

interface VaultCardPreviewGridProps {
  vaults: any[];
  selectedStatus: string;
}

export function VaultCardPreviewGrid({ vaults, selectedStatus }: VaultCardPreviewGridProps) {
  const filteredVaults = vaults.filter(v => 
    selectedStatus === 'all' || (v.status || '').toLowerCase() === selectedStatus
  ).slice(0, 3);

  if (filteredVaults.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-white/60">No vaults found for status: {selectedStatus}</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {filteredVaults.map(vault => (
        <div key={vault.id} className="space-y-4">
          <div className="text-center">
            <h3 className="text-white font-semibold mb-2">{vault.name}</h3>
            <span className={`text-xs px-2 py-1 rounded ${
              vault.status === 'active' ? 'bg-green-500/20 text-green-300' :
              vault.status === 'pre_ico' ? 'bg-cyan-500/20 text-cyan-300' :
              vault.status === 'ico' ? 'bg-blue-500/20 text-blue-300' :
              vault.status === 'prelaunch' ? 'bg-purple-500/20 text-purple-300' :
              vault.status === 'pending' ? 'bg-orange-500/20 text-orange-300' :
              vault.status === 'winner_confirmation' ? 'bg-purple-500/20 text-purple-300' :
              vault.status === 'endgame_processing' ? 'bg-orange-500/20 text-orange-300' :
              vault.status === 'extinct' ? 'bg-red-500/20 text-red-300' :
              'bg-gray-500/20 text-gray-300'
            }`}>
              {(vault.status || 'draft').toUpperCase()}
            </span>
          </div>
          
          {/* Featured Card Preview */}
          <div className="bg-white/5 p-3 rounded">
            <h4 className="text-white/80 text-sm font-medium mb-2">Featured Card</h4>
            <VaultCardPreview vault={vault} variant="featured" />
          </div>
          
          {/* Tall Card Preview */}
          <div className="bg-white/5 p-3 rounded">
            <h4 className="text-white/80 text-sm font-medium mb-2">Tall Card</h4>
            <VaultCardPreview vault={vault} variant="tall" />
          </div>
          
          {/* List Card Preview */}
          <div className="bg-white/5 p-3 rounded">
            <h4 className="text-white/80 text-sm font-medium mb-2">List Card</h4>
            <VaultCardPreview vault={vault} variant="row" />
          </div>
        </div>
      ))}
    </div>
  );
}
