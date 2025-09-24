'use client';

import * as React from 'react';
const { useEffect, useRef, useState } = React;

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
  // Safety check to prevent useRef errors and ensure client-side only
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return (
      <div className="w-full">
        <div className="bg-transparent p-6">
          <div className="flex items-center justify-center h-96 bg-transparent">
            <p className="text-white/70">Loading trading widget...</p>
          </div>
        </div>
      </div>
    );
  }

  // Ensure React hooks are available
  if (!useRef || !useState || !useEffect) {
    return (
      <div className="w-full">
        <div className="bg-transparent p-6">
          <div className="flex items-center justify-center h-96 bg-transparent">
            <p className="text-white/70">Widget temporarily unavailable</p>
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

    // Wallet standard polyfill to avoid "window.navigator.wallets is not an array"
    try {
      const navAny: any = window.navigator as any;
      if (!Array.isArray(navAny.wallets)) {
        navAny.wallets = [];
      }
    } catch {}

    // Load Jupiter plugin script
    const ensureScript = (): Promise<void> => new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-jupiter-plugin]') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve());
        if ((window as any).Jupiter) return resolve();
        return; // wait for load
      }
      const s = document.createElement('script');
      s.src = 'https://plugin.jup.ag/plugin-v1.js';
      s.async = true;
      s.setAttribute('data-jupiter-plugin', 'true');
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load Jupiter plugin script'));
      document.head.appendChild(s);
    });

    ensureScript().then(() => {
      // Wait a bit for the script to fully load
      setTimeout(() => {
        const w: any = window as any;
        if (w.__JUP_INITED) {
          setIsLoaded(true);
          return;
        }
        if (w.Jupiter && containerRef.current) {
          try {
            w.Jupiter.init({
              displayMode: "integrated",
              integratedTargetId: "jupiter-widget-container",
              formProps: {
                initialInputMint: "So11111111111111111111111111111111111111112",
                initialOutputMint: "9VxExA1iRPbuLLdSJ2rB3nyBxsyLReT4aqzZBMaBaY1p",
                swapMode: "ExactInOrOut",
                fixedMint: "",
              },
              branding: {
                logoUri: "/images/78.png",
                name: "Darwin",
              },
            });
            w.__JUP_INITED = true;
            setIsLoaded(true);
          } catch (error) {
            console.error('Error initializing Jupiter widget:', error);
          }
        }
      }, 1000);
    }).catch(() => {
      console.error('Failed to load Jupiter plugin script');
    });

    return () => {
      // Cleanup
      // Keep script cached; just hide container on unmount
    };
  }, []);

  return (
    <div className="w-full">
      <div className="bg-transparent p-6">
        {/* Jupiter Widget Container */}
        {!isLoaded && (
          <div className="flex items-center justify-center h-96 bg-transparent">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
              <p className="text-white/70">Loading Jupiter widget...</p>
            </div>
          </div>
        )}
        <div 
          id="jupiter-widget-container"
          ref={containerRef}
          style={{ 
            width: '100%',
            height: '640px',
            minHeight: '640px',
            display: isLoaded ? 'block' : 'none'
          }}
        />
        
        {/* Jupiter plugin theme - light blue / white preset */}
        <style jsx>{`
          :global(:root) {
            --jupiter-plugin-primary: 105, 192, 255;
            --jupiter-plugin-background: 255, 255, 255;
            --jupiter-plugin-primary-text: 0, 0, 0;
            --jupiter-plugin-warning: 251, 191, 36;
            --jupiter-plugin-interactive: 255, 255, 255;
            --jupiter-plugin-module: 255, 255, 255;
          }
          /* Let Jupiter render its own UI using the variables above */
        `}</style>
      </div>
    </div>
  );
}
