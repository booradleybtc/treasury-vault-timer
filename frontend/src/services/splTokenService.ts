/**
 * SPL Token Service
 * Handles fetching token metadata from Solana blockchain
 */

export interface SPLTokenMetadata {
  address: string;
  symbol: string;
  name: string;
  logoURI?: string;
  decimals: number;
  verified: boolean;
}

export interface TokenListResponse {
  tokens: SPLTokenMetadata[];
}

class SPLTokenService {
  private tokenListCache: Map<string, SPLTokenMetadata> = new Map();
  private logoCache: Map<string, string> = new Map();

  /**
   * Fetch token metadata from Jupiter Token List API
   */
  async getTokenMetadata(address: string): Promise<SPLTokenMetadata | null> {
    try {
      // Check cache first
      if (this.tokenListCache.has(address)) {
        return this.tokenListCache.get(address)!;
      }

      // Fetch from Jupiter API
      const response = await fetch(
        `https://token.jup.ag/strict`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const tokenList: SPLTokenMetadata[] = await response.json();
      
      // Find the token by address
      const token = tokenList.find(t => t.address === address);
      
      if (token) {
        // Cache the result
        this.tokenListCache.set(address, token);
        return token;
      }

      return null;
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      return null;
    }
  }

  /**
   * Get token logo URL with fallback
   */
  getTokenLogo(address: string): string {
    // Check logo cache first
    if (this.logoCache.has(address)) {
      return this.logoCache.get(address)!;
    }

    // Try to get from token metadata
    const token = this.tokenListCache.get(address);
    if (token?.logoURI) {
      this.logoCache.set(address, token.logoURI);
      return token.logoURI;
    }

    // Fallback to generic token image
    return '/images/token.png';
  }

  /**
   * Search tokens by symbol or name
   */
  async searchTokens(query: string): Promise<SPLTokenMetadata[]> {
    try {
      const response = await fetch(
        `https://token.jup.ag/strict`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const tokenList: SPLTokenMetadata[] = await response.json();
      
      // Filter tokens by query (case insensitive)
      const filtered = tokenList.filter(token => 
        token.symbol.toLowerCase().includes(query.toLowerCase()) ||
        token.name.toLowerCase().includes(query.toLowerCase())
      );

      return filtered.slice(0, 20); // Limit to 20 results
    } catch (error) {
      console.error('Error searching tokens:', error);
      return [];
    }
  }

  /**
   * Get popular tokens for quick selection
   */
  async getPopularTokens(): Promise<SPLTokenMetadata[]> {
    try {
      const response = await fetch(
        `https://token.jup.ag/strict`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const tokenList: SPLTokenMetadata[] = await response.json();
      
      // Filter for popular tokens (SOL, USDC, USDT, etc.)
      const popularAddresses = [
        'So11111111111111111111111111111111111111112', // SOL
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
        'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', // mSOL
        '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // ETH
      ];

      return tokenList.filter(token => popularAddresses.includes(token.address));
    } catch (error) {
      console.error('Error fetching popular tokens:', error);
      return [];
    }
  }

  /**
   * Validate if an address is a valid SPL token
   */
  async validateTokenAddress(address: string): Promise<boolean> {
    try {
      const token = await this.getTokenMetadata(address);
      return token !== null;
    } catch (error) {
      console.error('Error validating token address:', error);
      return false;
    }
  }
}

export const splTokenService = new SPLTokenService();
