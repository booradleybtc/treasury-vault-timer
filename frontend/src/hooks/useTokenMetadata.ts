import { useState, useEffect } from 'react';
import { splTokenService } from '@/services/splTokenService';

interface TokenMetadata {
  symbol?: string;
  name?: string;
  logoURI?: string;
  decimals?: number;
}

interface UseTokenMetadataReturn {
  metadata: TokenMetadata | null;
  loading: boolean;
  error: string | null;
}

export const useTokenMetadata = (mintAddress: string): UseTokenMetadataReturn => {
  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mintAddress) {
      setMetadata(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchMetadata = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const result = await splTokenService.getTokenMetadata(mintAddress);
        setMetadata(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch token metadata');
        setMetadata(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [mintAddress]);

  return { metadata, loading, error };
};

