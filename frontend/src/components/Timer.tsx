'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface TimerProps {
  className?: string
  showSeconds?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'orange' | 'green' | 'blue' | 'purple' | 'red'
}

export default function Timer({ 
  className, 
  showSeconds = true, 
  size = 'xl',
  color = 'orange'
}: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(0)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Fetch initial data
    fetch('https://treasury-vault-timer-backend.onrender.com/api/dashboard')
      .then(r => r.json())
      .then(data => {
        setTimeLeft(data.timer.timeLeft)
        setIsConnected(true)
      })
      .catch(() => setIsConnected(false))

    // Update every second
    const interval = setInterval(() => {
      fetch('https://treasury-vault-timer-backend.onrender.com/api/dashboard')
        .then(r => r.json())
        .then(data => {
          setTimeLeft(data.timer.timeLeft)
          setIsConnected(true)
        })
        .catch(() => setIsConnected(false))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    
    if (showSeconds) {
      return `${minutes}:${secs.toString().padStart(2, '0')}`
    }
    
    return `${minutes}m`
  }

  const sizeClasses = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl',
    xl: 'text-8xl'
  }

  const colorClasses = {
    orange: 'text-orange-500',
    green: 'text-green-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    red: 'text-red-500'
  }

  return (
    <div className={cn('text-center', className)}>
      <div className={cn(
        'font-mono font-bold',
        sizeClasses[size],
        colorClasses[color],
        'drop-shadow-lg'
      )}>
        {formatTime(timeLeft)}
      </div>
      {!isConnected && (
        <div className="text-sm text-red-500 mt-2">
          ⚠️ Connection lost
        </div>
      )}
    </div>
  )
}









