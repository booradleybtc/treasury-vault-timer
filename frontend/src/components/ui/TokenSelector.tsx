'use client';

import { useState, useEffect, useRef } from 'react';
import { splTokenService, SPLTokenMetadata } from '@/services/splTokenService';

interface TokenSelectorProps {
  value: string;
  onChange: (address: string, tokenData?: SPLTokenMetadata) => void;
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
  const [showCustomEntry, setShowCustomEntry] = useState(false);
  const [customToken, setCustomToken] = useState({
    symbol: '',
    name: '',
    address: '',
    logoUrl: ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
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
    if (value && value.length >= 32 && value.length <= 44) { // Valid Solana address length range
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
    onChange(token.address, token);
    setSelectedToken(token);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchQuery(newValue);
    
    // If it looks like an address, update the value directly
    if (newValue.length >= 32 && newValue.length <= 44) {
      onChange(newValue);
    }
  };


  const clearSelection = () => {
    onChange('');
    setSelectedToken(null);
    setSearchQuery('');
    setShowCustomEntry(false);
    setCustomToken({ symbol: '', name: '', address: '', logoUrl: '' });
    setLogoFile(null);
    inputRef.current?.focus();
  };

  const handleCustomTokenSubmit = async () => {
    if (customToken.address && customToken.symbol) {
      let logoUrl = customToken.logoUrl || '/images/token.png';
      
      // Upload file to server if provided
      if (logoFile) {
        try {
          const data = new FormData();
          data.append('file', logoFile);
          const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://treasury-vault-timer-backend.onrender.com'}/api/admin/upload`, {
            method: 'POST',
            body: data,
          });
          if (res.ok) {
            const json = await res.json();
            logoUrl = json.url;
          }
        } catch (error) {
          console.error('Failed to upload logo:', error);
          // Fall back to blob URL if upload fails
          logoUrl = URL.createObjectURL(logoFile);
        }
      }
      
      const token: SPLTokenMetadata = {
        address: customToken.address,
        symbol: customToken.symbol,
        name: customToken.name || customToken.symbol,
        decimals: 9,
        verified: false,
        logoURI: logoUrl
      };
      
      // Store the custom token data in a way that can be accessed by the form
      // We'll pass both the address and the token metadata
      onChange(customToken.address, token);
      setSelectedToken(token);
      setIsOpen(false);
      setShowCustomEntry(false);
      setSearchQuery('');
      
      // Store custom token data in a global way that the form can access
      // This is a temporary solution - in a real app you'd use proper state management
      (window as any).lastCustomToken = {
        address: customToken.address,
        symbol: customToken.symbol,
        name: customToken.name || customToken.symbol,
        logoURI: logoUrl
      };
    }
  };

  return (
    <div className={`relative z-50 ${className}`}>
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
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-[999999] max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-600">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto mb-2"></div>
                Loading tokens...
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-500">
                {error}
              </div>
            ) : tokens.length === 0 ? (
              <div className="p-4 text-center text-gray-600">
                No tokens found
              </div>
            ) : (
              <div className="py-2">
                {/* Custom Token Entry Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowCustomEntry(!showCustomEntry);
                  }}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100"
                >
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-600 text-sm">+</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-900 font-medium">Add Custom Token</div>
                    <div className="text-gray-600 text-sm">Enter token details manually</div>
                  </div>
                </button>

                {/* Custom Token Entry Form */}
                {showCustomEntry && (
                  <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Token Symbol *</label>
                        <input
                          type="text"
                          value={customToken.symbol}
                          onChange={(e) => setCustomToken(prev => ({ ...prev, symbol: e.target.value }))}
                          placeholder="e.g., BTC"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Token Name</label>
                        <input
                          type="text"
                          value={customToken.name}
                          onChange={(e) => setCustomToken(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Bitcoin"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Contract Address *</label>
                        <input
                          type="text"
                          value={customToken.address}
                          onChange={(e) => setCustomToken(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="44-character Solana address"
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Token Logo</label>
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                          />
                          <div className="text-xs text-gray-500">OR</div>
                          <input
                            type="url"
                            value={customToken.logoUrl}
                            onChange={(e) => setCustomToken(prev => ({ ...prev, logoUrl: e.target.value }))}
                            placeholder="https://example.com/logo.png"
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCustomTokenSubmit();
                          }}
                          disabled={!customToken.address || !customToken.symbol}
                          className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Token
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowCustomEntry(false);
                          }}
                          className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {tokens.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => handleTokenSelect(token)}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
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
                        <span className="text-gray-900 font-medium">{token.symbol}</span>
                        {token.verified && (
                          <span className="text-green-500 text-xs">✓</span>
                        )}
                      </div>
                      <div className="text-gray-600 text-sm truncate">{token.name}</div>
                      <div className="text-gray-400 text-xs font-mono truncate">
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
      {value && value.length > 0 && (value.length < 32 || value.length > 44) && (
        <div className="mt-2 text-red-400 text-sm">
          Invalid token address (must be 32-44 characters)
        </div>
      )}
    </div>
  );
}
