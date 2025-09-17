'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface TokenPriceProps {
  className?: string
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'green' | 'blue' | 'purple' | 'red' | 'orange'
}

export default function TokenPrice({ 
  className, 
  showLabel = true,
  size = 'lg',
  color = 'green'
}: TokenPriceProps) {
  const [price, setPrice] = useState(0)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const fetchPrice = () => {
      fetch('https://treasury-vault-timer-backend.onrender.com/api/dashboard')
        .then(r => r.json())
        .then(data => {
          setPrice(data.token.price)
          setIsConnected(true)
        })
        .catch(() => setIsConnected(false))
    }

    fetchPrice()
    const interval = setInterval(fetchPrice, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl'
  }

  const colorClasses = {
    green: 'text-green-500',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
    red: 'text-red-500',
    orange: 'text-orange-500'
  }

  return (
    <div className={cn('text-center', className)}>
      {showLabel && (
        <div className="text-sm text-gray-500 mb-2">RAY Price</div>
      )}
      <div className={cn(
        'font-bold',
        sizeClasses[size],
        colorClasses[color],
        'drop-shadow-sm'
      )}>
        ${price.toFixed(6)}
      </div>
      {!isConnected && (
        <div className="text-xs text-red-500 mt-1">
          ⚠️ Connection lost
        </div>
      )}
    </div>
  )
}









