export interface TimerData {
  timeLeft: number
  isActive: boolean
  lastPurchaseTime: string | null
  lastBuyerAddress: string | null
  lastPurchaseAmount: number | null
  lastCheckedSignature: string | null
  lastTxSignature: string | null
}

export interface TokenData {
  address: string
  price: number
  marketCap: number
  volume24h: number
  lastUpdated: string | null
}

export interface WalletData {
  balances: Record<string, {
    sol: number
    usd: number
    lastUpdated: string
  }>
  totalSol: number
  totalUsd: number
}

export interface DashboardData {
  timer: TimerData
  token: TokenData
  wallets: WalletData
  monitoring: {
    isMonitoring: boolean
    lastUpdated: string
  }
}









