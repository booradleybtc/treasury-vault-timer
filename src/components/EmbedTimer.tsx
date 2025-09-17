import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export const EmbedTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
  const [isConnected, setIsConnected] = useState(false);
  const [lastBuyerAddress, setLastBuyerAddress] = useState<string | null>(null);
  const [lastPurchaseAmount, setLastPurchaseAmount] = useState<number | null>(null);
  const [lastTxSignature, setLastTxSignature] = useState<string | null>(null);

  // Connect to server via Socket.IO
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001');

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('✅ Connected to backend server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('❌ Disconnected from backend server');
    });

    newSocket.on('timerUpdate', (data: { timeLeft: number; isMonitoring: boolean; lastBuyerAddress: string | null; lastPurchaseAmount: number | null; }) => {
      setTimeLeft(data.timeLeft);
      setLastBuyerAddress(data.lastBuyerAddress);
      setLastPurchaseAmount(data.lastPurchaseAmount);
    });

    newSocket.on('timerReset', (data: { txSignature: string; lastBuyerAddress: string; lastPurchaseAmount: number; }) => {
      setTimeLeft(3600); // Reset to 1 hour
      setLastBuyerAddress(data.lastBuyerAddress);
      setLastPurchaseAmount(data.lastPurchaseAmount);
      setLastTxSignature(data.txSignature);
      console.log('⚡ Timer reset!', data);
    });

    newSocket.on('timerExpired', () => {
      console.log('⏰ Timer expired');
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Countdown logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      {/* Timer */}
      <div className="text-center mb-12">
        <div className="text-8xl font-mono font-bold text-orange-400 mb-4">
          {formatTime(timeLeft)}
        </div>
        <div className="text-2xl text-gray-300">Treasury Vault Timer</div>
      </div>

      {/* Last Buyer Info */}
      {lastBuyerAddress && (
        <div className="text-center space-y-4">
          <div className="text-xl text-gray-300">Last Buyer</div>
          
          {/* Buyer Address */}
          <div className="text-2xl font-mono text-green-400">
            {lastBuyerAddress.length > 20
              ? `${lastBuyerAddress.slice(0, 8)}...${lastBuyerAddress.slice(-8)}`
              : lastBuyerAddress}
          </div>
          
          {/* Purchase Amount */}
          {lastPurchaseAmount && (
            <div className="text-xl text-green-300">
              {lastPurchaseAmount.toFixed(6)} REVS
            </div>
          )}
          
          {/* Solscan Link */}
          {lastTxSignature && (
            <div className="mt-6">
              <a 
                href={`https://solscan.io/tx/${lastTxSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                🔗 Verify on Solscan
              </a>
            </div>
          )}
        </div>
      )}

      {/* Connection Status (small indicator) */}
      <div className="absolute top-4 right-4">
        <div className={`w-3 h-3 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}></div>
      </div>
    </div>
  );
};
