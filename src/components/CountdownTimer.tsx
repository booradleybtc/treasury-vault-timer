import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, Zap, Bell, BellOff } from 'lucide-react';
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

  const progress = ((3600 - timeLeft) / 3600) * 100;

  return (
    <div className="bg-gray-900 rounded-2xl p-4 md:p-6 shadow-2xl border-2 border-gray-700 w-full max-w-md mx-auto mb-4">
      {/* Main Timer Display - LCD Style */}
      <div className="bg-black rounded-xl p-6 mb-6 border-2 border-gray-600">
        <div className="text-center">
          <div className="text-xs text-gray-400 font-mono mb-2 tracking-wider">COUNTDOWN TIMER</div>
          <div className="text-4xl md:text-6xl font-mono font-bold text-green-400 mb-2 tracking-wider drop-shadow-lg">
            {formatTime(timeLeft)}
          </div>
          <div className="text-sm text-gray-300 font-mono">
            {isActive ? 'TIME REMAINING' : 'TIMER EXPIRED'}
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 bg-gray-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-400 to-blue-400 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-3 mb-6">
        {!isMonitoring ? (
          <button
            onClick={() => {
              socket?.emit('startMonitoring');
              setDebugInfo(prev => [...prev, `Starting monitoring at ${new Date().toLocaleTimeString()}`]);
            }}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 text-sm font-mono border-2 border-green-500 w-full sm:w-auto"
          >
            <Zap className="w-4 h-4 inline mr-2" />
            START
          </button>
        ) : (
          <button
            onClick={() => {
              socket?.emit('stopMonitoring');
              setDebugInfo(prev => [...prev, `Stopping monitoring at ${new Date().toLocaleTimeString()}`]);
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 text-sm font-mono border-2 border-red-500 w-full sm:w-auto"
          >
            <AlertCircle className="w-4 h-4 inline mr-2" />
            STOP
          </button>
        )}
        
        {/* Notification Toggle */}
        {notificationSupported && (
          <button
            onClick={handleNotificationToggle}
            className={`font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 text-sm font-mono border-2 w-full sm:w-auto ${
              isNotificationEnabled 
                ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-500' 
                : 'bg-gray-600 hover:bg-gray-700 text-gray-300 border-gray-500'
            }`}
          >
            {isNotificationEnabled ? (
              <>
                <Bell className="w-4 h-4 inline mr-2" />
                NOTIFICATIONS ON
              </>
            ) : (
              <>
                <BellOff className="w-4 h-4 inline mr-2" />
                NOTIFICATIONS OFF
              </>
            )}
          </button>
        )}
      </div>

      {/* Digital Screens Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {/* Left Column - Status Screens */}
        <div className="space-y-4">
          {/* Connection Status */}
          <div className="bg-black rounded-lg p-4 border-2 border-gray-600">
            <div className="text-xs text-gray-400 font-mono mb-2 text-center">CONNECTION STATUS</div>
            <div className="flex items-center justify-center">
              {isConnected ? (
                <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
              ) : (
                <RefreshCw className="w-4 h-4 text-yellow-400 mr-2 animate-spin" />
              )}
              <span className={`text-sm font-mono ${isConnected ? 'text-green-400' : 'text-yellow-400'}`}>
                {isConnected ? 'CONNECTED' : 'CONNECTING...'}
              </span>
            </div>
          </div>

          {/* Monitoring Status */}
          <div className="bg-black rounded-lg p-4 border-2 border-gray-600">
            <div className="text-xs text-gray-400 font-mono mb-2 text-center">MONITORING STATUS</div>
            <div className="flex items-center justify-center">
              {isMonitoring ? (
                <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
              ) : (
                <AlertCircle className="w-4 h-4 text-orange-400 mr-2" />
              )}
              <span className={`text-sm font-mono ${isMonitoring ? 'text-green-400' : 'text-orange-400'}`}>
                {isMonitoring ? 'ACTIVE' : 'PAUSED'}
              </span>
            </div>
          </div>

          {/* Timer Status */}
          <div className="bg-black rounded-lg p-4 border-2 border-gray-600">
            <div className="text-xs text-gray-400 font-mono mb-2 text-center">TIMER STATUS</div>
            <div className="flex items-center justify-center">
              {isActive ? (
                <CheckCircle className="w-4 h-4 text-green-400 mr-2" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 mr-2" />
              )}
              <span className={`text-sm font-mono ${isActive ? 'text-green-400' : 'text-red-400'}`}>
                {isActive ? 'ACTIVE' : 'EXPIRED'}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column - Data Screens */}
        <div className="space-y-4">
          <div className="bg-black rounded-lg p-4 border-2 border-gray-600">
            <div className="text-xs text-gray-400 font-mono mb-2">LAST RESET</div>
            <div className="text-sm text-white font-mono">
              {lastPurchaseTime ? lastPurchaseTime.toLocaleTimeString() : 'N/A'}
            </div>
          </div>

          <div className="bg-black rounded-lg p-4 border-2 border-gray-600">
            <div className="text-xs text-gray-400 font-mono mb-2">LAST BUYER</div>
            <div className="text-sm text-green-400 font-mono">
              {lastBuyerAddress ? (
                lastBuyerAddress.length > 20
                  ? `${lastBuyerAddress.slice(0, 8)}...${lastBuyerAddress.slice(-8)}`
                  : lastBuyerAddress
              ) : 'N/A'}
            </div>
          </div>

          <div className="bg-black rounded-lg p-4 border-2 border-gray-600">
            <div className="text-xs text-gray-400 font-mono mb-2">PURCHASE AMOUNT</div>
            <div className="text-sm text-blue-400 font-mono">
              {lastPurchaseAmount ? `${lastPurchaseAmount.toFixed(6)} tokens` : 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Vault Log - LCD Terminal Style */}
      <div className="bg-black rounded-lg p-4 border-2 border-gray-600">
        <div className="text-xs text-gray-400 font-mono mb-3 tracking-wider">VAULT ACCESS LOG</div>
        <div className="bg-gray-900 rounded p-3 h-32 overflow-y-auto border border-gray-700">
          {debugInfo.length === 0 ? (
            <p className="text-gray-500 text-center text-xs font-mono">NO ACTIVITY DETECTED</p>
          ) : (
            debugInfo.slice(-8).map((info, index) => (
              <div key={index} className="text-xs text-green-400 mb-1 font-mono">
                <span className="text-gray-500">{'>'}</span> {info}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Device Bottom Panel */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t-2 border-gray-700">
        <div className="text-xs text-gray-400 font-mono">
          TOKEN: {tokenContract.slice(0, 8)}...{tokenContract.slice(-8)}
        </div>
        <div className="text-xs text-gray-400 font-mono">
          TRIGGER: ≥1 token purchase
        </div>
      </div>
    </div>
  );
};
