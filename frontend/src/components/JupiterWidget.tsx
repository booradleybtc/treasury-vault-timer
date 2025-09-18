'use client';

import { useEffect, useRef, useState } from 'react';

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
  // Safety check to prevent useRef errors
  if (typeof window === 'undefined') {
    return (
      <div className="w-full">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trade {tokenSymbol}</h3>
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <p className="text-gray-600">Loading trading widget...</p>
          </div>
        </div>
      </div>
    );
  }

  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Only load if we have a valid container
    if (!containerRef.current) return;

    // Load Jupiter plugin script
    const script = document.createElement('script');
    script.src = 'https://plugin.jup.ag/plugin-v1.js';
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      // Wait a bit for the script to fully load
      setTimeout(() => {
        if (window.Jupiter && containerRef.current) {
          try {
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
              },
              onSuccess: ({ txid }) => {
                console.log('Swap successful:', txid);
              },
              onSwapError: ({ error }) => {
                console.error('Swap error:', error);
              }
            });
            setIsLoaded(true);
          } catch (error) {
            console.error('Error initializing Jupiter widget:', error);
          }
        }
      }, 1000);
    };

    script.onerror = () => {
      console.error('Failed to load Jupiter plugin script');
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
        {!isLoaded && (
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading Jupiter widget...</p>
            </div>
          </div>
        )}
        <div 
          id="jupiter-widget-container"
          ref={containerRef}
          style={{ 
            width: '100%', 
            height: '400px',
            minHeight: '400px',
            display: isLoaded ? 'block' : 'none'
          }}
        />
        
        {/* Custom CSS for Jupiter widget colors */}
        <style jsx>{`
          :global(:root) {
            --jupiter-plugin-primary: 34, 197, 94;
            --jupiter-plugin-background: 255, 255, 255;
            --jupiter-plugin-primary-text: 0, 0, 0;
            --jupiter-plugin-warning: 251, 191, 36;
            --jupiter-plugin-interactive: 255, 255, 255;
            --jupiter-plugin-module: 248, 250, 252;
            --jupiter-plugin-text: 0, 0, 0;
            --jupiter-plugin-text-secondary: 107, 114, 128;
            --jupiter-plugin-border: 229, 231, 235;
          }
          
          :global(#jupiter-widget-container) {
            background: white !important;
            color: black !important;
          }
          
          :global(#jupiter-widget-container *) {
            color: black !important;
          }
          
          :global(#jupiter-widget-container button) {
            background: white !important;
            color: black !important;
            border: 1px solid #e5e7eb !important;
          }
          
          :global(#jupiter-widget-container input) {
            background: white !important;
            color: black !important;
            border: 1px solid #e5e7eb !important;
          }
        `}</style>
      </div>
    </div>
  );
}
