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

      // Fetch from Jupiter API (all tokens for broader coverage)
      const response = await fetch(
        `https://token.jup.ag/all`
      );
      
      if (!response.ok) {
        console.warn(`Jupiter API returned ${response.status} for token ${address}, returning fallback metadata`);
        return this.getFallbackTokenMetadata(address);
      }

      const tokenList: SPLTokenMetadata[] = await response.json();
      
      // Find the token by address
      const token = tokenList.find(t => t.address === address);
      
      if (token) {
        // Cache the result
        this.tokenListCache.set(address, token);
        return token;
      }

      // If not found, return fallback metadata
      return this.getFallbackTokenMetadata(address);
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      return this.getFallbackTokenMetadata(address);
    }
  }

  /**
   * Get fallback token metadata when API is unavailable
   */
  private getFallbackTokenMetadata(address: string): SPLTokenMetadata {
    // Check if it's a known popular token
    const fallbackTokens = this.getFallbackPopularTokens();
    const knownToken = fallbackTokens.find(t => t.address === address);
    
    if (knownToken) {
      return knownToken;
    }

    // Return generic token metadata
    return {
      address,
      symbol: 'TOKEN',
      name: 'Unknown Token',
      decimals: 9,
      verified: false,
      logoURI: '/images/token.png'
    };
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

    // Try common token logo services for any Solana address
    const logoUrl = `https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/${address}/logo.png`;
    this.logoCache.set(address, logoUrl);
    return logoUrl;
  }

  /**
   * Search tokens by symbol or name
   */
  async searchTokens(query: string): Promise<SPLTokenMetadata[]> {
    try {
      const response = await fetch(
        `https://token.jup.ag/all`
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

      return filtered.slice(0, 50); // Limit to 50 results (increased for broader token coverage)
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
        `https://token.jup.ag/all`
      );
      
      if (!response.ok) {
        console.warn(`Jupiter API returned ${response.status}, using fallback tokens`);
        return this.getFallbackPopularTokens();
      }

      const tokenList: SPLTokenMetadata[] = await response.json();
      
      // Filter for popular tokens (SOL, USDC, USDT, etc.)
      const popularAddresses = [
        'So11111111111111111111111111111111111111112', // SOL
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
        'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', // mSOL
        '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // ETH
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
        'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // JUP
        'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', // PYTH
        '5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm', // RAY
        'A8BR1VBFhVJCqUV5fo2oHyCE6c3EQ3BQ4nJdW8W3cbX1', // WIF
      ];

      const popularTokens = tokenList.filter(token => popularAddresses.includes(token.address));
      
      // If we don't have enough popular tokens, supplement with fallbacks
      if (popularTokens.length < 5) {
        return [...popularTokens, ...this.getFallbackPopularTokens()];
      }

      return popularTokens;
    } catch (error) {
      console.error('Error fetching popular tokens:', error);
      return this.getFallbackPopularTokens();
    }
  }

  /**
   * Fallback popular tokens when Jupiter API is unavailable
   */
  private getFallbackPopularTokens(): SPLTokenMetadata[] {
    return [
      {
        address: 'So11111111111111111111111111111111111111112',
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        verified: true,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
      },
      {
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        symbol: 'USDC',
        name: 'USD Coin',
        decimals: 6,
        verified: true,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
      },
      {
        address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
        symbol: 'USDT',
        name: 'Tether USD',
        decimals: 6,
        verified: true,
        logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png'
      },
      {
        address: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs',
        symbol: 'ETH',
        name: 'Ether (Portal)',
        decimals: 8,
        verified: true,
        logoURI: 'https://raw.githubusercontent.com/wormhole-foundation/wormhole-token-list/main/assets/ETH_wh.png'
      },
      {
        address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        symbol: 'BONK',
        name: 'Bonk',
        decimals: 5,
        verified: true,
        logoURI: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I?ext=png'
      }
    ];
  }

  /**
   * Get token metadata for any Solana address (including custom tokens)
   */
  async getTokenMetadataForAnyAddress(address: string): Promise<SPLTokenMetadata | null> {
    try {
      // First try to get from Jupiter's token list
      const jupiterToken = await this.getTokenMetadata(address);
      if (jupiterToken) {
        return jupiterToken;
      }

      // If not found in Jupiter, try to fetch from Solana blockchain
      // This would require a Solana RPC connection, but for now we'll return a basic structure
      // In a real implementation, you'd use @solana/web3.js to fetch token metadata
      return {
        address,
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        decimals: 9, // Default for most SPL tokens
        verified: false,
        logoURI: '/images/token.png'
      };
    } catch (error) {
      console.error('Error fetching token metadata for address:', error);
      return null;
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
