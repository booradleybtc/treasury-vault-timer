'use client';

import { useState, useEffect, useRef } from 'react';
import { splTokenService, SPLTokenMetadata } from '@/services/splTokenService';

interface TokenSelectorProps {
  value: string;
  onChange: (address: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
}

export function TokenSelector({ 
  value, 
  onChange, 
  placeholder = "Enter token address or search...",
  label,
  className = ""
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [tokens, setTokens] = useState<SPLTokenMetadata[]>([]);
  const [selectedToken, setSelectedToken] = useState<SPLTokenMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load popular tokens on mount
  useEffect(() => {
    const loadPopularTokens = async () => {
      setLoading(true);
      try {
        const popularTokens = await splTokenService.getPopularTokens();
        setTokens(popularTokens);
      } catch (err) {
        setError('Failed to load tokens');
      } finally {
        setLoading(false);
      }
    };

    loadPopularTokens();
  }, []);

  // Load selected token metadata when value changes
  useEffect(() => {
    if (value && value.length === 44) { // Valid Solana address length
      const loadTokenMetadata = async () => {
        const token = await splTokenService.getTokenMetadata(value);
        setSelectedToken(token);
      };
      loadTokenMetadata();
    } else {
      setSelectedToken(null);
    }
  }, [value]);

  // Search tokens when query changes
  useEffect(() => {
    if (searchQuery.length > 2) {
      const searchTokens = async () => {
        setLoading(true);
        try {
          const results = await splTokenService.searchTokens(searchQuery);
          setTokens(results);
        } catch (err) {
          setError('Failed to search tokens');
        } finally {
          setLoading(false);
        }
      };

      const timeoutId = setTimeout(searchTokens, 300); // Debounce
      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTokenSelect = (token: SPLTokenMetadata) => {
    onChange(token.address);
    setSelectedToken(token);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    
    // If it looks like an address, update the value directly
    if (newValue.length === 44) {
      onChange(newValue);
    }
  };

  const clearSelection = () => {
    onChange('');
    setSelectedToken(null);
    setSearchQuery('');
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-white/90 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery || value}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-[10px] ring-1 ring-white/10 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-cyan-400/50 focus:outline-none transition-all"
          />
          
          {/* Selected token display */}
          {selectedToken && !isOpen && (
            <div className="absolute inset-y-0 left-4 flex items-center gap-3 pointer-events-none">
              <img
                src={splTokenService.getTokenLogo(selectedToken.address)}
                alt={selectedToken.symbol}
                className="h-6 w-6 rounded-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/token.png';
                }}
              />
              <span className="text-white font-medium">{selectedToken.symbol}</span>
              <span className="text-white/60 text-sm">{selectedToken.name}</span>
            </div>
          )}

          {/* Clear button */}
          {(value || searchQuery) && (
            <button
              onClick={clearSelection}
              className="absolute inset-y-0 right-3 flex items-center text-white/50 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white/10 backdrop-blur-[10px] ring-1 ring-white/10 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-white/70">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mx-auto mb-2"></div>
                Loading tokens...
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-400">
                {error}
              </div>
            ) : tokens.length === 0 ? (
              <div className="p-4 text-center text-white/70">
                No tokens found
              </div>
            ) : (
              <div className="py-2">
                {tokens.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => handleTokenSelect(token)}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/5 transition-colors"
                  >
                    <img
                      src={splTokenService.getTokenLogo(token.address)}
                      alt={token.symbol}
                      className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/token.png';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{token.symbol}</span>
                        {token.verified && (
                          <span className="text-green-400 text-xs">✓</span>
                        )}
                      </div>
                      <div className="text-white/70 text-sm truncate">{token.name}</div>
                      <div className="text-white/50 text-xs font-mono truncate">
                        {token.address.slice(0, 8)}...{token.address.slice(-8)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Address validation feedback */}
      {value && value.length > 0 && value.length !== 44 && (
        <div className="mt-2 text-red-400 text-sm">
          Invalid token address (must be 44 characters)
        </div>
      )}
    </div>
  );
}
