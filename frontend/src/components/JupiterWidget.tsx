'use client';

import { useEffect, useRef } from 'react';

// Declare Jupiter global
declare global {
  interface Window {
    Jupiter: {
      init: (config: any) => void;
    };
  }
}

interface JupiterWidgetProps {
  tokenAddress: string;
  tokenSymbol: string;
}

export default function JupiterWidget({ tokenAddress, tokenSymbol }: JupiterWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Jupiter plugin script
    const script = document.createElement('script');
    script.src = 'https://plugin.jup.ag/plugin-v1.js';
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      // Initialize Jupiter plugin
      if (window.Jupiter) {
        window.Jupiter.init({
          displayMode: "integrated",
          integratedTargetId: "jupiter-widget-container",
          endpoint: "https://api.mainnet-beta.solana.com",
          platformFeeAndAccounts: {
            feeBps: 0,
            accounts: []
          },
          defaultExplorer: "Solscan",
          containerStyles: {
            background: "transparent"
          }
        });
      }
    };

    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trade {tokenSymbol}</h3>
        
        {/* Jupiter Widget Container */}
        <div 
          id="jupiter-widget-container"
          ref={containerRef}
          style={{ 
            width: '100%', 
            height: '400px',
            minHeight: '400px'
          }}
        />
        
        {/* Custom CSS for Jupiter widget colors */}
        <style jsx>{`
          :global(:root) {
            --jupiter-plugin-primary: 199, 242, 132;
            --jupiter-plugin-background: 255, 255, 255;
            --jupiter-plugin-primary-text: 0, 0, 0;
            --jupiter-plugin-warning: 251, 191, 36;
            --jupiter-plugin-interactive: 33, 42, 54;
            --jupiter-plugin-module: 248, 250, 252;
          }
        `}</style>
      </div>
    </div>
  );
}
