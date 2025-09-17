'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'

interface LastBuyerProps {
  className?: string
  showLabel?: boolean
  showAmount?: boolean
  showTransaction?: boolean
}

export default function LastBuyer({ 
  className, 
  showLabel = true,
  showAmount = true,
  showTransaction = true
}: LastBuyerProps) {
  const [buyer, setBuyer] = useState<string | null>(null)
  const [amount, setAmount] = useState<number | null>(null)
  const [txSignature, setTxSignature] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const fetchLastBuyer = () => {
      fetch('https://treasury-vault-timer-backend.onrender.com/api/dashboard')
        .then(r => r.json())
        .then(data => {
          setBuyer(data.timer.lastBuyerAddress)
          setAmount(data.timer.lastPurchaseAmount)
          setTxSignature(data.timer.lastTxSignature)
          setIsConnected(true)
        })
        .catch(() => setIsConnected(false))
    }

    fetchLastBuyer()
    const interval = setInterval(fetchLastBuyer, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  const formatAddress = (address: string) => {
    if (address.length > 20) {
      return `${address.slice(0, 8)}...${address.slice(-8)}`
    }
    return address
  }

  return (
    <div className={cn('text-center', className)}>
      {showLabel && (
        <div className="text-sm text-gray-500 mb-2">Last Buyer</div>
      )}
      
      {buyer ? (
        <div className="space-y-2">
          <div className="text-xl font-mono text-green-500 break-all">
            {formatAddress(buyer)}
          </div>
          
          {showAmount && amount && (
            <div className="text-lg text-green-400">
              {amount.toFixed(2)} RAY
            </div>
          )}
          
          {showTransaction && txSignature && (
            <a 
              href={`https://solscan.io/tx/${txSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Transaction
            </a>
          )}
        </div>
      ) : (
        <div className="text-lg text-gray-500">
          Awaiting first purchase...
        </div>
      )}
      
      {!isConnected && (
        <div className="text-xs text-red-500 mt-2">
          ⚠️ Connection lost
        </div>
      )}
    </div>
  )
}









