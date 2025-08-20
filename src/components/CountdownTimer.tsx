import React, { useState, useEffect } from 'react';
import { Trophy, Coins, TrendingUp, Gift, Target } from 'lucide-react';
import { io } from 'socket.io-client';
import { pushNotificationService } from '../services/pushNotifications';

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
      // Transaction signature logged in debug info
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
        `🎯 BID PLACED - VAULT RESET`,
        `💰 ${data.lastPurchaseAmount} tokens purchased`,
        `👤 Buyer: ${buyerShort}`,
        `🔗 Verify: https://solscan.io/tx/${data.txSignature}`
      ]);
    });

    newSocket.on('timerExpired', () => {
      console.log('Timer expired');
      setDebugInfo(prev => [...prev, 'Timer expired']);
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
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4 border border-white/30">
              <span className="text-white font-bold text-xl">₿</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">MicroScratchety</h1>
              <p className="text-white/80 text-sm">Treasury Vault Timer</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {notificationSupported && (
              <button
                onClick={handleNotificationToggle}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors backdrop-blur-sm border ${
                  isNotificationEnabled 
                    ? 'bg-white/20 text-white border-white/30' 
                    : 'bg-black/20 text-white/80 border-white/20 hover:bg-black/30'
                }`}
              >
                {isNotificationEnabled ? '🔔 On' : '🔕 Off'}
              </button>
            )}
            <div className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${
              isConnected ? 'bg-green-500/20 text-green-200 border-green-400/30' : 'bg-red-500/20 text-red-200 border-red-400/30'
            }`}>
              {isConnected ? '● LIVE' : '● OFFLINE'}
            </div>
          </div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-120px)]">
          {/* Main Timer - Large Card */}
          <div className="col-span-8 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="text-center h-full flex flex-col justify-center">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mr-4 border-2 border-white/30">
                  <span className="text-white font-bold text-2xl">₿</span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">SCRATCH</h2>
                  <p className="text-white/80 text-sm">Treasury Vault Timer</p>
                </div>
              </div>
              
              {/* Main Timer Display */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-6 border border-white/20">
                <div className="text-8xl font-mono font-bold text-white mb-2 tracking-wider">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-white/80 text-lg">1 Hour Countdown</div>
              </div>

              {/* Timer Stats Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-white/60 text-sm font-bold">TIMER ALIVE</div>
                  <div className="text-white font-bold text-lg">{demoData.timerAlive}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                  <div className="text-white/60 text-sm font-bold">ENDS IN</div>
                  <div className="text-white font-bold text-lg">{getTimeUntilEnd()}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Treasury Stats - Tall Card */}
          <div className="col-span-4 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-3">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white">TREASURY</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-white/60 text-sm font-bold">TREASURY VALUE</div>
                <div className="text-white font-bold text-lg">${demoData.treasuryValue.toLocaleString()}</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-white/60 text-sm font-bold">SCRATCHER POTENTIAL</div>
                <div className="text-white font-bold text-lg">${demoData.potentialWinnings.toLocaleString()}</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-white/60 text-sm font-bold">BID:WIN RATIO</div>
                <div className="text-white font-bold text-lg">{demoData.bidWinRatio}</div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-white/60 text-sm font-bold">TOKEN PRICE</div>
                <div className="text-white font-bold text-lg">${demoData.tokenPrice.toFixed(6)}</div>
              </div>
            </div>
          </div>

          {/* Last Bidder - Medium Card */}
          <div className="col-span-4 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center mb-4">
              <Target className="w-5 h-5 text-white mr-2" />
              <h3 className="text-lg font-bold text-white">LAST BIDDER</h3>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-bold">
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
                  className="text-white/60 hover:text-white text-sm"
                >
                  ↗
                </a>
              </div>
              <div className="text-white/80 text-sm">
                {lastPurchaseAmount ? `${lastPurchaseAmount.toFixed(6)} REVS` : 'N/A'}
              </div>
            </div>
          </div>

          {/* APY Calculator - Medium Card */}
          <div className="col-span-4 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-5 h-5 text-white mr-2" />
              <h3 className="text-lg font-bold text-white">APY</h3>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
              <div className="text-white/60 text-sm mb-2">Current APY</div>
              <div className="text-white font-bold text-3xl">{demoData.apy}%</div>
              <div className="text-white/60 text-xs mt-2">Based on treasury performance</div>
            </div>
          </div>

          {/* Airdrop Info - Medium Card */}
          <div className="col-span-4 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center mb-4">
              <Gift className="w-5 h-5 text-white mr-2" />
              <h3 className="text-lg font-bold text-white">AIRDROP</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="text-white/60 text-xs">Next Airdrop</div>
                <div className="text-white font-bold">{new Date(demoData.nextAirdrop).toLocaleDateString()}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="text-white/60 text-xs">Amount</div>
                <div className="text-white font-bold">{demoData.nextAirdropAmount} BTC</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                <div className="text-white/60 text-xs">Eligible Wallets</div>
                <div className="text-white font-bold">{demoData.eligibleWallets.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Activity Log - Wide Card */}
          <div className="col-span-8 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Coins className="w-5 h-5 text-white mr-2" />
                <h3 className="text-lg font-bold text-white">TREASURY ACTIVITY</h3>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${
                isMonitoring ? 'bg-green-500/20 text-green-200 border-green-400/30' : 'bg-red-500/20 text-red-200 border-red-400/30'
              }`}>
                {isMonitoring ? '● MONITORING' : '● PAUSED'}
              </div>
            </div>
            
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 h-32 overflow-y-auto border border-white/10">
              {debugInfo.length === 0 ? (
                <div className="text-white/60 text-sm">No activity yet...</div>
              ) : (
                debugInfo.slice(-6).map((info, index) => (
                  <div key={index} className="text-sm text-white/80 mb-2 font-mono">
                    {info}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
