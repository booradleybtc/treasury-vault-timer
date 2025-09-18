'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface JupiterWidgetProps {
  tokenAddress: string;
  tokenSymbol: string;
}

export default function JupiterWidget({ tokenAddress, tokenSymbol }: JupiterWidgetProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  const handleConnectWallet = () => {
    // Simulate wallet connection
    setIsConnected(true);
    setWalletAddress('7rhxnLV8C77o6d8oz26AgK8x8m5ePsdeRawjqvojbjnQ');
  };

  const handleBuy = () => {
    // Open Jupiter in new tab with pre-filled token
    const jupiterUrl = `https://jup.ag/swap/SOL-${tokenSymbol}?inputMint=So11111111111111111111111111111111111111112&outputMint=${tokenAddress}`;
    window.open(jupiterUrl, '_blank');
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trade {tokenSymbol}</h3>
        
        {!isConnected ? (
          <div className="space-y-4">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <p className="text-gray-600 mb-4">Connect your wallet to start trading</p>
            </div>
            
            <motion.button
              onClick={handleConnectWallet}
              className="w-full bg-black text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Connect Wallet
            </motion.button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Connected Wallet</span>
                <button 
                  onClick={() => setIsConnected(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Disconnect
                </button>
              </div>
              <p className="font-mono text-sm text-gray-900">
                {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">SOL</p>
                  <p className="text-xs text-gray-500">Balance: 1.25 SOL</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">1.0</p>
                </div>
              </div>

              <div className="flex items-center justify-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{tokenSymbol}</p>
                  <p className="text-xs text-gray-500">Estimated: 1,408 {tokenSymbol}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">1,408</p>
                </div>
              </div>
            </div>

            <motion.button
              onClick={handleBuy}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Swap on Jupiter
            </motion.button>

            <p className="text-xs text-gray-500 text-center">
              Powered by Jupiter DEX
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
