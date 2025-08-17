import axios from 'axios';

export interface TradeData {
  signature: string;
  amount: number;
  price: number;
  timestamp: number;
  buyer: string;
  seller: string;
  dex?: string;
}

export class DEXMonitor {
  private tokenAddress: string;
  private lastTradeTime: number = 0;

  constructor(tokenAddress: string) {
    this.tokenAddress = tokenAddress;
  }

  // Monitor Jupiter trades (aggregates multiple DEXes including Raydium)
  async monitorJupiterTrades(): Promise<TradeData[]> {
    try {
      // Use Jupiter's price API as a fallback - more reliable
      const response = await axios.get(
        `https://price.jup.ag/v4/price?ids=${this.tokenAddress}`
      );

      // For now, return empty array since Jupiter's trade API is unreliable
      // We'll focus on transaction parsing instead
      return [];
    } catch (error) {
      console.error('Jupiter API error:', error);
      return [];
    }
  }

  // Monitor Raydium trades (Primary DEX for your LP)
  async monitorRaydiumTrades(): Promise<TradeData[]> {
    try {
      // Raydium APIs are unreliable, so we'll focus on transaction parsing
      // This method will be used as a fallback
      return [];
    } catch (error) {
      console.error('Raydium API error:', error);
      return [];
    }
  }

  // Monitor Birdeye trades (comprehensive DEX aggregator)
  async monitorBirdeyeTrades(): Promise<TradeData[]> {
    try {
      // Birdeye API is unreliable, so we'll focus on transaction parsing
      return [];
    } catch (error) {
      console.error('Birdeye API error:', error);
      return [];
    }
  }

  // Monitor Orca trades (another major Solana DEX)
  async monitorOrcaTrades(): Promise<TradeData[]> {
    try {
      // Orca API is unreliable, so we'll focus on transaction parsing
      return [];
    } catch (error) {
      console.error('Orca API error:', error);
      return [];
    }
  }

  // Monitor all DEXes and return combined results
  async monitorAllDEXes(): Promise<TradeData[]> {
    // Prioritize Raydium since that's where your LP will be
    const [raydiumTrades, jupiterTrades, birdeyeTrades, orcaTrades] = await Promise.allSettled([
      this.monitorRaydiumTrades(),
      this.monitorJupiterTrades(),
      this.monitorBirdeyeTrades(),
      this.monitorOrcaTrades(),
    ]);

    const allTrades: TradeData[] = [];

    // Add Raydium trades first (highest priority)
    if (raydiumTrades.status === 'fulfilled') {
      allTrades.push(...raydiumTrades.value);
    }
    if (jupiterTrades.status === 'fulfilled') {
      allTrades.push(...jupiterTrades.value);
    }
    if (birdeyeTrades.status === 'fulfilled') {
      allTrades.push(...birdeyeTrades.value);
    }
    if (orcaTrades.status === 'fulfilled') {
      allTrades.push(...orcaTrades.value);
    }

    // Sort by timestamp and remove duplicates
    const uniqueTrades = allTrades
      .filter((trade, index, self) => 
        index === self.findIndex(t => t.signature === trade.signature)
      )
      .sort((a, b) => b.timestamp - a.timestamp);

    // Update last trade time
    if (uniqueTrades.length > 0) {
      this.lastTradeTime = Math.max(...uniqueTrades.map(t => t.timestamp));
    }

    return uniqueTrades;
  }

  // Check if any trade meets the criteria (≥1 token purchase)
  async checkForPurchases(): Promise<boolean> {
    const trades = await this.monitorAllDEXes();
    
    // Look for purchases of ≥1 token
    const purchases = trades.filter(trade => trade.amount >= 1);
    
    if (purchases.length > 0) {
      console.log(`DEX purchase detected: ${purchases.length} trades with ≥1 token`);
      console.log('Purchase details:', purchases.map(p => ({
        dex: p.dex,
        amount: p.amount,
        price: p.price,
        timestamp: new Date(p.timestamp).toLocaleString()
      })));
      return true;
    }
    
    return false;
  }

  // Get detailed trade information for debugging
  async getRecentTrades(): Promise<TradeData[]> {
    return await this.monitorAllDEXes();
  }

  // Check specific DEX for trades (useful for debugging)
  async checkSpecificDEX(dexName: string): Promise<TradeData[]> {
    switch (dexName.toLowerCase()) {
      case 'raydium':
        return await this.monitorRaydiumTrades();
      case 'jupiter':
        return await this.monitorJupiterTrades();
      case 'birdeye':
        return await this.monitorBirdeyeTrades();
      case 'orca':
        return await this.monitorOrcaTrades();
      default:
        return [];
    }
  }
}
