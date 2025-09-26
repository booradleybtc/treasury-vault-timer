"use client";

import React, { useState, useEffect } from 'react';

interface ICOTimerProps {
  vaultId: string;
  className?: string;
}

interface ICOStatus {
  isActive: boolean;
  startTime?: string;
  endTime?: string;
  timeLeft?: number;
  hoursLeft?: number;
  minutesLeft?: number;
  secondsLeft?: number;
  progress?: number;
  message?: string;
}

export const ICOTimer: React.FC<ICOTimerProps> = ({ vaultId, className = "" }) => {
  const [icoStatus, setIcoStatus] = useState<ICOStatus>({ isActive: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://treasury-vault-timer-backend.onrender.com';

  // Fetch ICO status from server
  const fetchICOStatus = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/admin/vaults/${vaultId}/ico-status`);
      if (response.ok) {
        const data = await response.json();
        setIcoStatus(data.icoStatus);
        setError(null);
      } else {
        setError('Failed to fetch ICO status');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchICOStatus();
  }, [vaultId]);

  // Update timer display every second (client-side only for display)
  useEffect(() => {
    if (!icoStatus.isActive || !icoStatus.timeLeft) return;

    const interval = setInterval(() => {
      setIcoStatus(prev => {
        if (!prev.timeLeft || prev.timeLeft <= 0) {
          return { ...prev, isActive: false, timeLeft: 0 };
        }
        
        const newTimeLeft = prev.timeLeft - 1000; // Subtract 1 second in milliseconds
        const hoursLeft = Math.floor(newTimeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor((newTimeLeft % (1000 * 60 * 60)) / (1000 * 60));
        const secondsLeft = Math.floor((newTimeLeft % (1000 * 60)) / 1000);
        
        return {
          ...prev,
          timeLeft: newTimeLeft,
          hoursLeft,
          minutesLeft,
          secondsLeft
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [icoStatus.isActive, icoStatus.timeLeft]);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="animate-pulse bg-white/20 h-4 w-16 rounded"></div>
        <span className="text-white/60 text-sm">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-red-400 text-sm">Error</span>
      </div>
    );
  }

  if (!icoStatus.isActive) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-white/60 text-sm">No ICO active</span>
      </div>
    );
  }

  const { hoursLeft = 0, minutesLeft = 0, secondsLeft = 0, progress = 0 } = icoStatus;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {/* Timer Display */}
      <div className="flex items-center gap-1">
        <div className="text-lg font-mono font-bold text-white">
          {hoursLeft > 0 && (
            <>
              {hoursLeft.toString().padStart(2, '0')}:
            </>
          )}
          {minutesLeft.toString().padStart(2, '0')}:
          {secondsLeft.toString().padStart(2, '0')}
        </div>
        <span className="text-white/60 text-sm">left</span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-white/10 rounded-full h-1.5">
        <div 
          className="bg-gradient-to-r from-green-500 to-emerald-400 h-1.5 rounded-full transition-all duration-1000"
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      </div>
      
      {/* Status Text */}
      <div className="text-xs text-white/60">
        ICO in progress
      </div>
    </div>
  );
};
