import React, { useState, useEffect } from 'react';
import { Clock, Trophy, Coins, TrendingUp, Gift, Target } from 'lucide-react';
import { io } from 'socket.io-client';
import { pushNotificationService } from '../services/pushNotifications';

interface CountdownTimerProps {
  tokenContract: string;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ tokenContract }) => {
  // Socket.IO connection to server
  const [socket, setSocket] = useState<any>(null);

  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
  const [isActive, setIsActive] = useState(true);
  const [lastPurchaseTime, setLastPurchaseTime] = useState<Date | null>(null);
  const [lastBuyerAddress, setLastBuyerAddress] = useState<string | null>(null);
  const [lastPurchaseAmount, setLastPurchaseAmount] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(false);
  const [notificationSupported, setNotificationSupported] = useState(false);
  // Removed unused lastTxSignature state

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
      setIsActive(data.isActive);
      setLastPurchaseTime(data.lastPurchaseTime ? new Date(data.lastPurchaseTime) : null);
      setLastBuyerAddress(data.lastBuyerAddress);
      setLastPurchaseAmount(data.lastPurchaseAmount);
      // Transaction signature logged in debug info
      setIsMonitoring(data.isMonitoring || false);
      setDebugInfo(prev => [...prev, `Timer state received: ${data.timeLeft}s remaining`]);
    });

    newSocket.on('timerUpdate', (data) => {
      setTimeLeft(data.timeLeft);
      setIsActive(data.isActive);
    });

    newSocket.on('timerReset', (data) => {
      console.log('Timer reset:', data);
      setTimeLeft(data.timeLeft);
      setIsActive(true);
      setLastPurchaseTime(new Date(data.lastPurchaseTime));
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
      setIsActive(false);
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

  const formatAddress = (address: string) => {
    if (!address || address === 'N/A') return 'N/A';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getSolscanUrl = (address: string) => {
    if (!address || address === 'N/A') return '#';
    return `https://solscan.io/account/${address}`;
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
    <div className="min-h-screen bg-black text-white p-4">
      {/* Header */}
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-orange-500">Treasury Vault</h1>
            <p className="text-gray-400 text-sm">On-chain Treasury Timer</p>
          </div>
          <div className="flex items-center space-x-4">
            {notificationSupported && (
              <button
                onClick={handleNotificationToggle}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isNotificationEnabled 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {isNotificationEnabled ? '🔔 On' : '🔕 Off'}
              </button>
            )}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              isConnected ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}>
              {isConnected ? '● LIVE' : '● OFFLINE'}
            </div>
          </div>
        </div>

        {/* Main Timer Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Timer Card */}
          <div className="lg:col-span-2 bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-orange-500 mr-3" />
                <h2 className="text-2xl font-bold text-white">Treasury Timer</h2>
              </div>
              
              {/* Main Timer Display */}
              <div className="bg-black rounded-xl p-8 mb-6 border-2 border-orange-500">
                <div className="text-6xl font-mono font-bold text-orange-500 mb-2">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-gray-400 text-lg">1 Hour Countdown</div>
              </div>

              {/* Timer Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm">Timer Alive</div>
                  <div className="text-white font-semibold">{demoData.timerAlive}</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="text-gray-400 text-sm">Ends In</div>
                  <div className="text-white font-semibold">{getTimeUntilEnd()}</div>
                </div>
              </div>

              {/* Last Transaction */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm mb-2">Last Bid</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Target className="w-4 h-4 text-orange-500 mr-2" />
                    <span className="text-white font-medium">
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
                      className="ml-2 text-orange-500 hover:text-orange-400 text-sm"
                    >
                      ↗
                    </a>
                  </div>
                  <div className="text-orange-500 font-semibold">
                    {lastPurchaseAmount ? `${lastPurchaseAmount.toFixed(6)} REVS` : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Treasury Stats */}
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
            <div className="flex items-center mb-4">
              <Trophy className="w-6 h-6 text-orange-500 mr-2" />
              <h3 className="text-xl font-bold text-white">Treasury Stats</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Treasury Value</div>
                <div className="text-white font-bold text-lg">${demoData.treasuryValue.toLocaleString()}</div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Potential Winnings</div>
                <div className="text-orange-500 font-bold text-lg">${demoData.potentialWinnings.toLocaleString()}</div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm">BID:WIN Ratio</div>
                <div className="text-white font-bold text-lg">{demoData.bidWinRatio}</div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-gray-400 text-sm">Token Price</div>
                <div className="text-white font-bold text-lg">${demoData.tokenPrice.toFixed(6)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Airdrop Section */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-8">
          <div className="flex items-center mb-6">
            <Gift className="w-6 h-6 text-orange-500 mr-2" />
            <h3 className="text-xl font-bold text-white">Airdrop System</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Next Airdrop</div>
              <div className="text-white font-semibold">
                {new Date(demoData.nextAirdrop).toLocaleDateString()}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Next Amount</div>
              <div className="text-orange-500 font-semibold">{demoData.nextAirdropAmount} BTC</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Eligible Wallets</div>
              <div className="text-white font-semibold">{demoData.eligibleWallets.toLocaleString()}</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-gray-400 text-sm">Total Awarded</div>
              <div className="text-white font-semibold">{demoData.totalSatsAwarded} BTC</div>
            </div>
          </div>

          {/* Past Airdrops */}
          <div>
            <h4 className="text-white font-semibold mb-3">Past Airdrops</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {demoData.pastAirdrops.map((airdrop, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-3">
                  <div className="text-gray-400 text-xs">{airdrop.date}</div>
                  <div className="text-white font-medium">{airdrop.amount} BTC</div>
                  <div className="text-gray-400 text-xs">{airdrop.participants} participants</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* APY Calculator */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-8">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-6 h-6 text-orange-500 mr-2" />
            <h3 className="text-xl font-bold text-white">APY Calculator</h3>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-center">
              <div className="text-gray-400 text-sm mb-2">Current APY</div>
              <div className="text-orange-500 font-bold text-3xl">{demoData.apy}%</div>
              <div className="text-gray-400 text-sm mt-2">Based on current treasury performance</div>
            </div>
          </div>
        </div>

        {/* Treasury Log */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Coins className="w-6 h-6 text-orange-500 mr-2" />
              <h3 className="text-xl font-bold text-white">Treasury Activity</h3>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              isMonitoring ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
            }`}>
              {isMonitoring ? '● MONITORING' : '● PAUSED'}
            </div>
          </div>
          
          <div className="bg-black rounded-lg p-4 h-48 overflow-y-auto">
            {debugInfo.length === 0 ? (
              <div className="text-gray-500 text-sm">No activity yet...</div>
            ) : (
              debugInfo.slice(-8).map((info, index) => (
                <div key={index} className="text-sm text-gray-300 mb-2 font-mono">
                  {info}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
