'use client'

import React, { useState, useEffect } from 'react';
import { Trophy, Gift, Activity, Clock, Target, BarChart3, Bitcoin } from 'lucide-react';
import { io } from 'socket.io-client';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Progress } from './ui/progress';

interface CountdownTimerProps {
  tokenContract?: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = () => {
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
  const [isConnected, setIsConnected] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastBuyerAddress, setLastBuyerAddress] = useState<string | null>(null);
  const [lastPurchaseAmount, setLastPurchaseAmount] = useState<number | null>(null);
  const [notificationSupported, setNotificationSupported] = useState(false);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Connect to server via Socket.IO
  useEffect(() => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    const newSocket = io(backendUrl);

    newSocket.on('connect', () => {
      setIsConnected(true);
      setDebugInfo(prev => [...prev, '✅ Connected to backend server']);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setIsMonitoring(false);
      setDebugInfo(prev => [...prev, '❌ Disconnected from backend server']);
    });

    newSocket.on('timerUpdate', (data: { timeLeft: number; isMonitoring: boolean; lastBuyerAddress: string | null; lastPurchaseAmount: number | null; }) => {
      setTimeLeft(data.timeLeft);
      setLastBuyerAddress(data.lastBuyerAddress);
      setLastPurchaseAmount(data.lastPurchaseAmount);
      setIsMonitoring(data.isMonitoring || false);
      setDebugInfo(prev => [...prev, `Timer state received: ${data.timeLeft}s remaining`]);
    });

    newSocket.on('timerReset', (data: { txSignature: string; lastBuyerAddress: string; lastPurchaseAmount: number; }) => {
      setTimeLeft(3600); // Reset to 1 hour
      setLastBuyerAddress(data.lastBuyerAddress);
      setLastPurchaseAmount(data.lastPurchaseAmount);
      const buyerShort = data.lastBuyerAddress.length > 12 ? `${data.lastBuyerAddress.slice(0, 6)}...${data.lastBuyerAddress.slice(-6)}` : data.lastBuyerAddress;
      setDebugInfo(prev => [
        ...prev, 
        `⚡ BID PLACED - VAULT RESET`,
        `💰 ${data.lastPurchaseAmount} tokens purchased`,
        `👤 Buyer: ${buyerShort}`,
        `🔗 Verify: https://solscan.io/tx/${data.txSignature}`
      ]);
    });

    newSocket.on('timerExpired', () => {
      console.log('Timer expired');
      setDebugInfo(prev => [...prev, '⏰ Timer expired']);
    });

    newSocket.on('debugLog', (message: string) => {
      setDebugInfo(prev => [...prev, message]);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Countdown logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft > 0 && isMonitoring) {
      timer = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timeLeft, isMonitoring]);

  // Push notification logic
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setNotificationSupported(true);
      // Check if notifications are enabled
      setIsNotificationEnabled(false);
    }
  }, []);

  useEffect(() => {
    if (isNotificationEnabled && timeLeft === 58 * 60) { // 58 minutes remaining
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification('MicroScratchety Protocol', {
            body: 'Timer has 58 minutes remaining! Test notification!',
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
          });
        });
      }
    }
  }, [timeLeft, isNotificationEnabled]);

  const handleNotificationToggle = async () => {
    if (isNotificationEnabled) {
      setIsNotificationEnabled(false);
      setDebugInfo(prev => [...prev, '🔕 Notifications disabled']);
    } else {
      // Simple notification request
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setIsNotificationEnabled(true);
          setDebugInfo(prev => [...prev, '🔔 Notifications enabled']);
        } else {
          setDebugInfo(prev => [...prev, '⚠️ Failed to enable notifications']);
        }
      }
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = ((3600 - timeLeft) / 3600) * 100;

  // Demo data for treasury features
  const demoData = {
    treasuryValue: 5.293, // Bitcoin
    potentialWinnings: 48384283234, // USD
    bidWinRatio: "1:48,948",
    tokenPrice: 0.0007128, // USD
    nextAirdrop: "2024-07-01T00:00:00Z",
    nextAirdropAmount: 0.05, // BTC
    eligibleWallets: 12345,
    totalSatsAwarded: 1.25, // BTC
    pastAirdrops: [
      { date: "2024-06-01", amount: 0.02 },
      { date: "2024-05-01", amount: 0.03 },
    ],
    apy: 83,
    timerAlive: "12h 34m",
    endDate: "2025-12-31T00:00:00Z"
  };

  const getTimeUntilEnd = () => {
    const now = new Date();
    const end = new Date(demoData.endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
      return "Ended";
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Pixel Jungle Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-green-800 to-blue-900">
        {/* Pixel art pattern overlay */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.1)_1px,transparent_0)] bg-[length:4px_4px]"></div>
        
        {/* Misty atmosphere */}
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 via-transparent to-green-900/20"></div>
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-1 h-1 bg-green-400 rounded-full animate-ping"></div>
          <div className="absolute top-40 right-40 w-1 h-1 bg-blue-400 rounded-full animate-ping delay-1000"></div>
          <div className="absolute bottom-40 left-1/3 w-1 h-1 bg-yellow-400 rounded-full animate-ping delay-2000"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mr-6 shadow-2xl border border-orange-400/30">
                <Bitcoin className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">
                MicroScratchety
              </h1>
              <p className="text-orange-300 text-lg font-medium">Treasury Vault Protocol</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {notificationSupported && (
              <Button
                onClick={handleNotificationToggle}
                variant={isNotificationEnabled ? "default" : "outline"}
                size="lg"
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-0"
              >
                {isNotificationEnabled ? '🔔 Active' : '🔕 Inactive'}
              </Button>
            )}
            <div className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${
              isConnected 
                ? 'bg-green-500/20 text-green-400 border-green-400' 
                : 'bg-red-500/20 text-red-400 border-red-400'
            }`}>
              {isConnected ? '● VAULT ONLINE' : '● VAULT OFFLINE'}
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
          {/* Main Vault Card - Large */}
          <div className="col-span-8">
            <Card className="bg-black/40 backdrop-blur-xl border-orange-500/30 h-full relative overflow-hidden">
              {/* Vault Door Background */}
              <div className="absolute inset-0 bg-gradient-to-r from-gray-800/50 to-orange-900/30"></div>
              
              <CardHeader className="text-center pb-4 relative z-10">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-4">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white">TREASURY VAULT TIMER</CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="text-center h-full flex flex-col justify-center relative z-10">
                {/* Main Timer Display */}
                <div className="bg-gradient-to-r from-black/50 to-gray-800/50 rounded-3xl p-12 mb-8 border border-orange-500/30 shadow-2xl">
                  <div className="text-8xl font-mono font-bold text-orange-400 mb-4 tracking-wider">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-orange-300 text-xl font-medium">Vault Countdown</div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <Progress value={progress} className="h-3 bg-gray-700 border border-orange-500/30" />
                  <div className="text-center mt-2 text-orange-300 font-semibold">
                    {Math.round(progress)}% Complete
                  </div>
                </div>

                {/* Treasury Stats */}
                <div className="grid grid-cols-2 gap-6">
                  <Card className="bg-black/40 border-orange-500/30">
                    <CardContent className="p-4 text-center">
                      <div className="text-orange-300 text-sm font-bold mb-1">TREASURY VAULT</div>
                      <div className="flex items-center justify-center">
                        <Bitcoin className="w-5 h-5 text-orange-400 mr-2" />
                        <span className="text-orange-400 font-bold text-xl">{demoData.treasuryValue}</span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-black/40 border-orange-500/30">
                    <CardContent className="p-4 text-center">
                      <div className="text-orange-300 text-sm font-bold mb-1">SCRATCHER POTENTIAL</div>
                      <div className="text-orange-400 font-bold text-xl">${demoData.potentialWinnings.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Treasury Stats - Tall Card */}
          <div className="col-span-4">
            <Card className="bg-black/40 backdrop-blur-xl border-orange-500/30 h-full">
              <CardHeader>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-3">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-white">VAULT ANALYTICS</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Card className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30">
                  <CardContent className="p-4">
                    <div className="text-orange-300 text-sm font-bold mb-1">END GAME</div>
                    <div className="text-orange-400 font-bold text-2xl">{getTimeUntilEnd()}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30">
                  <CardContent className="p-4">
                    <div className="text-green-300 text-sm font-bold mb-1">HUNT MULTIPLIER</div>
                    <div className="text-green-400 font-bold text-2xl">{demoData.bidWinRatio}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
                  <CardContent className="p-4">
                    <div className="text-purple-300 text-sm font-bold mb-1">FARM APY</div>
                    <div className="text-purple-400 font-bold text-2xl">{demoData.apy}%</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30">
                  <CardContent className="p-4">
                    <div className="text-blue-300 text-sm font-bold mb-1">TOKEN PRICE</div>
                    <div className="text-blue-400 font-bold text-xl">${demoData.tokenPrice.toFixed(6)}</div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>

          {/* Last Bidder - Medium Card */}
          <div className="col-span-4">
            <Card className="bg-black/40 backdrop-blur-xl border-orange-500/30">
              <CardHeader>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-3">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle className="text-lg font-bold text-white">LAST BIDDER</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Card className="bg-gradient-to-r from-black/50 to-gray-800/50 border-orange-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-bold font-mono">
                        {lastBuyerAddress ? (
                          lastBuyerAddress.length > 20
                            ? `${lastBuyerAddress.slice(0, 8)}...${lastBuyerAddress.slice(-8)}`
                            : lastBuyerAddress
                        ) : 'N/A'}
                      </span>
                      <a 
                        href={lastBuyerAddress ? `https://solscan.io/account/${lastBuyerAddress}` : '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-400 hover:text-red-400 text-sm"
                      >
                        ↗
                      </a>
                    </div>
                    <div className="text-orange-300 text-sm font-mono">
                      {lastPurchaseAmount ? `${lastPurchaseAmount.toFixed(6)} REVS` : 'N/A'}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>

          {/* APY Calculator - Medium Card */}
          <div className="col-span-4">
            <Card className="bg-black/40 backdrop-blur-xl border-orange-500/30">
              <CardHeader>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle className="text-lg font-bold text-white">FARM YIELD</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 text-center">
                  <CardContent className="p-6">
                    <div className="text-green-300 text-sm mb-2">Current APY</div>
                    <div className="text-green-400 font-bold text-4xl mb-2">{demoData.apy}%</div>
                    <div className="text-green-400 text-xs">Protocol performance</div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>

          {/* Airdrop Info - Medium Card */}
          <div className="col-span-4">
            <Card className="bg-black/40 backdrop-blur-xl border-orange-500/30">
              <CardHeader>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                    <Gift className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle className="text-lg font-bold text-white">SCRATCH REWARDS</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
                  <CardContent className="p-3">
                    <div className="text-purple-300 text-xs">Next Distribution</div>
                    <div className="text-purple-400 font-bold">{new Date(demoData.nextAirdrop).toLocaleDateString()}</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30">
                  <CardContent className="p-3">
                    <div className="text-orange-300 text-xs">Amount</div>
                    <div className="text-orange-400 font-bold">{demoData.nextAirdropAmount} BTC</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30">
                  <CardContent className="p-3">
                    <div className="text-blue-300 text-xs">Eligible Wallets</div>
                    <div className="text-blue-400 font-bold">{demoData.eligibleWallets.toLocaleString()}</div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>

          {/* Activity Log - Wide Card */}
          <div className="col-span-8">
            <Card className="bg-black/40 backdrop-blur-xl border-orange-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-3">
                      <Activity className="w-4 h-4 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold text-white">VAULT ACCESS LOG</CardTitle>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${
                    isMonitoring 
                      ? 'bg-green-500/20 text-green-400 border-green-400' 
                      : 'bg-red-500/20 text-red-400 border-red-400'
                  }`}>
                    {isMonitoring ? '● MONITORING' : '● PAUSED'}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-black/50 rounded-xl p-4 h-32 overflow-y-auto border border-orange-500/30">
                  {debugInfo.length === 0 ? (
                    <div className="text-orange-300 text-sm text-center">Awaiting vault transactions...</div>
                  ) : (
                    debugInfo.slice(-6).map((info, index) => (
                      <div key={index} className="text-sm text-orange-300 mb-2 font-mono">
                        {info}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
