import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { VaultPagePreview } from './VaultPagePreview';

interface VaultDetailOverlayProps {
  vault: any;
  isOpen: boolean;
  onClose: () => void;
}

export function VaultDetailOverlay({ vault, isOpen, onClose }: VaultDetailOverlayProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !vault) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop - Blur only, no darkening */}
      <div 
        className="absolute inset-0 bg-black/0 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Overlay Content - Translucent card */}
      <div className="relative w-full h-full max-w-7xl max-h-[90vh] mx-4 my-8 overflow-hidden rounded-lg backdrop-blur-xl ring-1 ring-white/15">
        {/* Close Button - Top right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-7 h-7 text-white" />
        </button>
        
        {/* Vault Content */}
        <div className="w-full h-full overflow-y-auto">
          <VaultPagePreview vault={vault} status={vault.status} />
        </div>
      </div>
    </div>
  );
}
