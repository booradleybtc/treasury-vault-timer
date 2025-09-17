import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export const SimpleTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
  const [isConnected, setIsConnected] = useState(false);
  const [lastBuyerAddress, setLastBuyerAddress] = useState<string | null>(null);
  const [lastPurchaseAmount, setLastPurchaseAmount] = useState<number | null>(null);

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
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      {/* Timer */}
      <div className="text-center mb-8">
        <div className="text-9xl font-mono font-bold text-orange-400 mb-4">
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Current Winner */}
      {lastBuyerAddress && (
        <div className="text-center">
          <div className="text-2xl font-mono text-green-400">
            {lastBuyerAddress.length > 20
              ? `${lastBuyerAddress.slice(0, 8)}...${lastBuyerAddress.slice(-8)}`
              : lastBuyerAddress}
          </div>
          {lastPurchaseAmount && (
            <div className="text-xl text-green-300 mt-2">
              {lastPurchaseAmount.toFixed(0)} BONK
            </div>
          )}
        </div>
      )}
    </div>
  );
};
