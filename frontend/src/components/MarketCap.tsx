'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface MarketCapProps {
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'blue' | 'green' | 'purple' | 'red' | 'orange'
}

export default function MarketCap({ 
  className, 
  showLabel = true,
  size = 'lg',
  color = 'blue'
}: MarketCapProps) {
  const [marketCap, setMarketCap] = useState(0)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const fetchMarketCap = () => {
      fetch('https://treasury-vault-timer-backend.onrender.com/api/dashboard')
        .then(r => r.json())
        .then(data => {
          setMarketCap(data.token.marketCap)
          setIsConnected(true)
        })
        .catch(() => setIsConnected(false))
    }

    fetchMarketCap()
    const interval = setInterval(fetchMarketCap, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const formatMarketCap = (cap: number) => {
    if (cap >= 1000000000) {
      return `$${(cap / 1000000000).toFixed(2)}B`
    } else if (cap >= 1000000) {
      return `$${(cap / 1000000).toFixed(2)}M`
    } else if (cap >= 1000) {
      return `$${(cap / 1000).toFixed(2)}K`
    }
    return `$${cap.toFixed(2)}`
  }

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl'
  }

  const colorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    purple: 'text-purple-500',
    red: 'text-red-500',
    orange: 'text-orange-500'
  }

  return (
    <div className={cn('text-center', className)}>
      {showLabel && (
        <div className="text-sm text-gray-500 mb-2">Market Cap</div>
      )}
      <div className={cn(
        'font-bold',
        sizeClasses[size],
        colorClasses[color],
        'drop-shadow-sm'
      )}>
        {formatMarketCap(marketCap)}
      </div>
      {!isConnected && (
        <div className="text-xs text-red-500 mt-1">
          ⚠️ Connection lost
        </div>
      )}
    </div>
  )
}









