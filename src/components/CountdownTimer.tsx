import React, { useState, useEffect } from 'react';
import { Trophy, Gift, Zap, Activity, Clock, Target, BarChart3 } from 'lucide-react';
import { io } from 'socket.io-client';
import { pushNotificationService } from '../services/pushNotifications';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';

interface CountdownTimerProps {
  tokenContract: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = () => {
  // Socket.IO connection to server
  const [socket, setSocket] = useState<any>(null);

  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
  const [lastBuyerAddress, setLastBuyerAddress] = useState<string | null>(null);
  const [lastPurchaseAmount, setLastPurchaseAmount] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [notificationSupported, setNotificationSupported] = useState(false);

  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Connect to server via Socket.IO
  useEffect(() => {
    // Use environment variable for backend URL, fallback to localhost for development
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    const newSocket = io(backendUrl);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      setDebugInfo(prev => [...prev, 'Connected to server']);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
      setDebugInfo(prev => [...prev, 'Disconnected from server']);
    });

    newSocket.on('timerState', (data) => {
      console.log('Received timer state:', data);
      setTimeLeft(data.timeLeft);
      setLastBuyerAddress(data.lastBuyerAddress);
      setLastPurchaseAmount(data.lastPurchaseAmount);
      setIsMonitoring(data.isMonitoring || false);
      setDebugInfo(prev => [...prev, `Timer state received: ${data.timeLeft}s remaining`]);
    });

    newSocket.on('timerUpdate', (data) => {
      setTimeLeft(data.timeLeft);
    });

    newSocket.on('timerReset', (data) => {
      console.log('Timer reset:', data);
      setTimeLeft(data.timeLeft);
      setLastBuyerAddress(data.lastBuyerAddress);
      setLastPurchaseAmount(data.lastPurchaseAmount);
      
      // Add detailed bid information to vault log
      const buyerShort = data.lastBuyerAddress ? 
        `${data.lastBuyerAddress.slice(0, 8)}...${data.lastBuyerAddress.slice(-8)}` : 
        'Unknown';
      
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

    newSocket.on('monitoringState', (data) => {
      setIsMonitoring(data.isMonitoring);
      setDebugInfo(prev => [...prev, `Monitoring ${data.isMonitoring ? 'started' : 'stopped'}`]);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Initialize push notifications
  useEffect(() => {
    const initNotifications = async () => {
      try {
        console.log('Initializing push notifications...');
        const supported = await pushNotificationService.initialize();
        console.log('Push notifications supported:', supported);
        setNotificationSupported(supported);
        
        if (supported) {
          const isSubscribed = await pushNotificationService.isSubscribed();
          console.log('Already subscribed:', isSubscribed);
          setIsNotificationEnabled(isSubscribed);
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
        setNotificationSupported(false);
      }
    };

    initNotifications();
  }, []);

  // Handle push notification subscription
  const handleNotificationToggle = async () => {
    if (!notificationSupported) return;

    if (isNotificationEnabled) {
      await pushNotificationService.unsubscribe();
      setIsNotificationEnabled(false);
    } else {
      const permissionGranted = await pushNotificationService.requestPermission();
      if (permissionGranted) {
        const subscription = await pushNotificationService.subscribe();
        if (subscription) {
          setIsNotificationEnabled(true);
          // Send subscription to backend
          socket?.emit('subscribeNotifications', subscription);
        }
      }
    }
  };

  // Check for notification triggers
  useEffect(() => {
    if (isNotificationEnabled && timeLeft <= 3480 && timeLeft > 0) { // Under 58 minutes (for testing)
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      
      if (minutes === 58 && seconds === 0) { // 58 minutes remaining (for quick testing)
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          navigator.serviceWorker.ready.then(registration => {
            registration.showNotification('Treasury Vault Timer', {
              body: 'Timer has 58 minutes remaining! Test notification!',
              icon: '/icon-192x192.png',
              badge: '/badge-72x72.png',
              requireInteraction: true
            });
          });
        }
      }
    }
  }, [timeLeft, isNotificationEnabled]);

  // Format time helper function
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((3600 - timeLeft) / 3600) * 100;

  // Demo data for treasury features
  const demoData = {
    treasuryValue: 125000, // USD
    potentialWinnings: 45000, // USD
    bidWinRatio: "3.2:1",
    tokenPrice: 0.0007128, // USD
    nextAirdrop: "2024-01-15T18:00:00Z",
    nextAirdropAmount: 0.85, // BTC
    eligibleWallets: 1247,
    totalSatsAwarded: 2.45, // BTC
    pastAirdrops: [
      { date: "2024-01-08", amount: 0.75, participants: 892 },
      { date: "2024-01-01", amount: 0.68, participants: 756 },
      { date: "2023-12-25", amount: 0.82, participants: 1034 }
    ],
    apy: 156.8, // %
    timerAlive: "2h 34m 12s",
    endDate: "2024-02-15T00:00:00Z"
  };

  const getTimeUntilEnd = () => {
    const endDate = new Date(demoData.endDate);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    
    if (diff <= 0) return '00:00:00';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse"></div>
      
      {/* Floating particles */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
        <div className="absolute top-40 right-40 w-1 h-1 bg-cyan-400 rounded-full animate-ping delay-1000"></div>
        <div className="absolute bottom-40 left-1/3 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping delay-2000"></div>
        <div className="absolute bottom-20 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-ping delay-1500"></div>
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mr-6 shadow-2xl border border-blue-400/30">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                MicroScratchety
              </h1>
              <p className="text-slate-300 text-lg font-medium">Next-Gen Treasury Protocol</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {notificationSupported && (
              <Button
                onClick={handleNotificationToggle}
                variant={isNotificationEnabled ? "default" : "outline"}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0"
              >
                {isNotificationEnabled ? '🔔 Active' : '🔕 Inactive'}
              </Button>
            )}
            <div className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${
              isConnected 
                ? 'bg-green-500/20 text-green-400 border-green-400' 
                : 'bg-red-500/20 text-red-400 border-red-400'
            }`}>
              {isConnected ? '● SYSTEM ONLINE' : '● SYSTEM OFFLINE'}
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-140px)]">
          {/* Main Timer - Large Card */}
          <div className="col-span-8">
            <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 h-full">
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white">QUANTUM TIMER</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-center h-full flex flex-col justify-center">
                {/* Main Timer Display */}
                <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-3xl p-12 mb-8 border border-slate-600/50 shadow-2xl">
                  <div className="text-8xl font-mono font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-4 tracking-wider">
                    {formatTime(timeLeft)}
                  </div>
                  <div className="text-slate-300 text-xl font-medium">Protocol Countdown</div>
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <Progress value={progress} className="h-3 bg-slate-700 border border-slate-600" />
                  <div className="text-center mt-2 text-slate-300 font-semibold">
                    {Math.round(progress)}% Complete
                  </div>
                </div>

                {/* Timer Stats */}
                <div className="grid grid-cols-2 gap-6">
                  <Card className="bg-slate-700/50 border-slate-600/50">
                    <CardContent className="p-4 text-center">
                      <div className="text-slate-400 text-sm font-bold mb-1">UPTIME</div>
                      <div className="text-blue-400 font-bold text-xl">{demoData.timerAlive}</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-700/50 border-slate-600/50">
                    <CardContent className="p-4 text-center">
                      <div className="text-slate-400 text-sm font-bold mb-1">EXPIRES</div>
                      <div className="text-cyan-400 font-bold text-xl">{getTimeUntilEnd()}</div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Treasury Stats - Tall Card */}
          <div className="col-span-4">
            <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50 h-full">
              <CardHeader>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
                    <Trophy className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-white">TREASURY ANALYTICS</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Card className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30">
                  <CardContent className="p-4">
                    <div className="text-slate-300 text-sm font-bold mb-1">TOTAL VALUE LOCKED</div>
                    <div className="text-blue-400 font-bold text-2xl">${demoData.treasuryValue.toLocaleString()}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30">
                  <CardContent className="p-4">
                    <div className="text-slate-300 text-sm font-bold mb-1">POTENTIAL YIELD</div>
                    <div className="text-green-400 font-bold text-2xl">${demoData.potentialWinnings.toLocaleString()}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
                  <CardContent className="p-4">
                    <div className="text-slate-300 text-sm font-bold mb-1">RISK RATIO</div>
                    <div className="text-purple-400 font-bold text-2xl">{demoData.bidWinRatio}</div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-r from-indigo-500/20 to-blue-500/20 border-indigo-500/30">
                  <CardContent className="p-4">
                    <div className="text-slate-300 text-sm font-bold mb-1">TOKEN PRICE</div>
                    <div className="text-indigo-400 font-bold text-xl">${demoData.tokenPrice.toFixed(6)}</div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>

          {/* Last Bidder - Medium Card */}
          <div className="col-span-4">
            <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
              <CardHeader>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle className="text-lg font-bold text-white">LAST EXECUTOR</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Card className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 border-slate-600/50">
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
                        className="text-blue-400 hover:text-cyan-400 text-sm"
                      >
                        ↗
                      </a>
                    </div>
                    <div className="text-slate-300 text-sm font-mono">
                      {lastPurchaseAmount ? `${lastPurchaseAmount.toFixed(6)} REVS` : 'N/A'}
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>

          {/* APY Calculator - Medium Card */}
          <div className="col-span-4">
            <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
              <CardHeader>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle className="text-lg font-bold text-white">YIELD METRICS</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Card className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-500/30 text-center">
                  <CardContent className="p-6">
                    <div className="text-slate-300 text-sm mb-2">Current APY</div>
                    <div className="text-green-400 font-bold text-4xl mb-2">{demoData.apy}%</div>
                    <div className="text-slate-400 text-xs">Protocol performance</div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>

          {/* Airdrop Info - Medium Card */}
          <div className="col-span-4">
            <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
              <CardHeader>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                    <Gift className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle className="text-lg font-bold text-white">DISTRIBUTION</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
                  <CardContent className="p-3">
                    <div className="text-slate-300 text-xs">Next Distribution</div>
                    <div className="text-purple-400 font-bold">{new Date(demoData.nextAirdrop).toLocaleDateString()}</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30">
                  <CardContent className="p-3">
                    <div className="text-slate-300 text-xs">Amount</div>
                    <div className="text-blue-400 font-bold">{demoData.nextAirdropAmount} BTC</div>
                  </CardContent>
                </Card>
                <Card className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-500/30">
                  <CardContent className="p-3">
                    <div className="text-slate-300 text-xs">Eligible Wallets</div>
                    <div className="text-indigo-400 font-bold">{demoData.eligibleWallets.toLocaleString()}</div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>

          {/* Activity Log - Wide Card */}
          <div className="col-span-8">
            <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
                      <Activity className="w-4 h-4 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold text-white">SYSTEM LOGS</CardTitle>
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
                <div className="bg-slate-900/50 rounded-xl p-4 h-32 overflow-y-auto border border-slate-600/50">
                  {debugInfo.length === 0 ? (
                    <div className="text-slate-400 text-sm text-center">Awaiting transactions...</div>
                  ) : (
                    debugInfo.slice(-6).map((info, index) => (
                      <div key={index} className="text-sm text-slate-300 mb-2 font-mono">
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
