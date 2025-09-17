import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export const EmbedTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(3600); // seconds (for server sync)
  const [deadlineMs, setDeadlineMs] = useState<number>(Date.now() + 3600 * 1000);
  const [isConnected, setIsConnected] = useState(false);
  const [lastBuyerAddress, setLastBuyerAddress] = useState<string | null>(null);
  const [lastPurchaseAmount, setLastPurchaseAmount] = useState<number | null>(null);
  const [lastTxSignature, setLastTxSignature] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<Array<{
    buyer: string;
    amount: number;
    signature: string;
  }>>([]);

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

    newSocket.on('timerState', (data: { timeLeft: number; isActive: boolean; lastBuyerAddress: string | null; lastPurchaseAmount: number | null; txSignature: string | null; }) => {
      setTimeLeft(data.timeLeft);
      setDeadlineMs(Date.now() + data.timeLeft * 1000);
      setLastBuyerAddress(data.lastBuyerAddress);
      setLastPurchaseAmount(data.lastPurchaseAmount);
      setLastTxSignature(data.txSignature);
      console.log('Initial timer state received:', data);
    });

    newSocket.on('timerUpdate', (data: { timeLeft: number; isMonitoring: boolean; lastBuyerAddress: string | null; lastPurchaseAmount: number | null; }) => {
      // Only adjust time; do not clear last buyer info on streaming updates
      setTimeLeft(data.timeLeft);
      setDeadlineMs(Date.now() + data.timeLeft * 1000);
    });

    newSocket.on('timerReset', (data: { txSignature: string; lastBuyerAddress: string; lastPurchaseAmount: number; }) => {
      setTimeLeft(3600); // Reset to 1 hour
      setDeadlineMs(Date.now() + 3600 * 1000);
      setLastBuyerAddress(data.lastBuyerAddress);
      setLastPurchaseAmount(data.lastPurchaseAmount);
      setLastTxSignature(data.txSignature);
      setPurchases(prev => [{ buyer: data.lastBuyerAddress, amount: data.lastPurchaseAmount, signature: data.txSignature }, ...prev].slice(0, 5));
      console.log('⚡ Timer reset!', data);
    });

    newSocket.on('timerExpired', () => {
      console.log('⏰ Timer expired');
    });

    return () => {
      try {
        newSocket.disconnect();
      } catch {}
    };
  }, []);

  // Seed last 5 purchases from API on mount
  useEffect(() => {
    const base = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    fetch(`${base}/api/purchases`).then(async (r) => {
      try {
        const json = await r.json();
        const list = (json?.purchases || []).map((p: any) => ({
          buyer: p.buyer || p.lastBuyerAddress || '',
          amount: Number(p.amount || p.lastPurchaseAmount || 0),
          signature: p.signature || p.txSignature || ''
        }));
        setPurchases(list.slice(-5).reverse());
      } catch {}
    }).catch(() => {});
  }, []);

  // Millisecond countdown (hundredths) based on deadline
  useEffect(() => {
    const id = setInterval(() => {
      const remainingMs = Math.max(0, deadlineMs - Date.now());
      setTimeLeft(Math.ceil(remainingMs / 1000));
    }, 100);
    return () => clearInterval(id);
  }, [deadlineMs]);

  const formatTimeMs = () => {
    const remainingMs = Math.max(0, deadlineMs - Date.now());
    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((remainingMs % 1000) / 10); // hundredths
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      {/* Timer */}
      <div className="text-center mb-12">
        <div className="text-8xl font-mono font-bold text-orange-400 mb-2">
          {formatTimeMs()}
        </div>
        <div className="text-sm text-gray-500 mb-2">current winner</div>
        <div className="text-2xl text-gray-300">Treasury Vault Timer</div>
      </div>

      {/* Last Buyer Info */}
      <div className="text-center space-y-4">
        {lastBuyerAddress ? (
          <>
            <div className="text-xl text-gray-300">Last Buyer</div>
            <div className="text-2xl font-mono text-green-400">
              {lastBuyerAddress.length > 20
                ? `${lastBuyerAddress.slice(0, 8)}...${lastBuyerAddress.slice(-8)}`
                : lastBuyerAddress}
            </div>
            {lastPurchaseAmount && (
              <div className="text-xl text-green-300">
                {lastPurchaseAmount.toFixed(2)} RAY
              </div>
            )}
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
          </>
        ) : (
          <div className="text-lg text-gray-500">
            Awaiting first purchase...
          </div>
        )}
      </div>

      {/* Recent Purchases Log */}
      <div className="mt-12 w-full max-w-2xl">
        <div className="text-left text-gray-300 mb-2">Recent buys</div>
        <div className="space-y-2">
          {purchases.length === 0 && (
            <div className="text-gray-500">No purchases yet</div>
          )}
          {purchases.map((p, idx) => (
            <div key={idx} className="flex items-center justify-between bg-zinc-900 rounded px-4 py-3">
              <div className="font-mono text-sm text-green-400">
                {p.buyer.length > 16 ? `${p.buyer.slice(0, 6)}...${p.buyer.slice(-6)}` : p.buyer}
              </div>
              <div className="text-sm text-green-300 mr-4">{p.amount.toFixed(2)} RAY</div>
              <a
                href={`https://solscan.io/tx/${p.signature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Solscan ↗
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Connection Status (small indicator) */}
      <div className="absolute top-4 right-4">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      </div>
    </div>
  );
};
