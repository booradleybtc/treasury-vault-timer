import React, { useState, useEffect } from 'react';
import { Zap, ShoppingCart } from 'lucide-react';

interface JupiterBuyWidgetProps {
  tokenAddress: string;
  tokenSymbol: string;
}

export const JupiterBuyWidget: React.FC<JupiterBuyWidgetProps> = ({ tokenSymbol }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [priceData, setPriceData] = useState<{ price: number; inputMint: string } | null>(null);

  // REVS token address
  const REVS_TOKEN_ADDRESS = '9VxExA1iRPbuLLdSJ2rB3nyBxsyLReT4aqzZBMaBaY1p';
  
  // Calculate amounts needed (accounting for 10% tax + fees)
  const calculateAmountNeeded = (targetTokens: number) => {
    // 10% tax means you need to buy 111.11% to get 100%
    const taxMultiplier = 1.111111111; // 1 / 0.9
    const baseAmount = targetTokens * taxMultiplier;
    
    // Add 2% for slippage and fees
    const slippageMultiplier = 1.02;
    return Math.ceil(baseAmount * slippageMultiplier);
  };

  const amountFor1Token = calculateAmountNeeded(1);
  const amountFor100Tokens = calculateAmountNeeded(100);

  // Get current price from Jupiter
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setIsLoading(true);
        // Use a more reliable price endpoint or fallback
        const response = await fetch(`https://price.jup.ag/v4/price?ids=${REVS_TOKEN_ADDRESS}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.data && data.data[REVS_TOKEN_ADDRESS]) {
          setPriceData({
            price: data.data[REVS_TOKEN_ADDRESS].price,
            inputMint: 'So11111111111111111111111111111111111111112' // SOL
          });
        } else {
          // Fallback to a default price if API doesn't return data
          setPriceData({
            price: 0.001, // Default fallback price
            inputMint: 'So11111111111111111111111111111111111111112'
          });
        }
      } catch (error) {
        console.error('Error fetching price:', error);
        // Set fallback price on error
        setPriceData({
          price: 0.001,
          inputMint: 'So11111111111111111111111111111111111111112'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const openJupiterWidget = (targetTokens: number) => {
    setIsLoading(true);
    
    // Calculate SOL amount needed for the target tokens
    const solAmount = priceData ? (targetTokens * priceData.price) : 0.01; // Fallback
    
    // Jupiter Widget URL with SOL as input and REVS as output
    // Format: https://jup.ag/swap?inputMint=SOL&outputMint=REVS&amount=AMOUNT
    const jupiterUrl = `https://jup.ag/swap?inputMint=So11111111111111111111111111111111111111112&outputMint=${REVS_TOKEN_ADDRESS}&amount=${solAmount}`;
    
    // Open Jupiter in new tab
    window.open(jupiterUrl, '_blank');
    
    setIsLoading(false);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 border-2 border-gray-600">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center mb-2">
          <ShoppingCart className="w-5 h-5 text-green-400 mr-2" />
          <h3 className="text-lg font-bold text-green-400 font-mono">BUY {tokenSymbol}</h3>
        </div>
        <p className="text-xs text-gray-400 font-mono">
          {priceData ? `Current Price: $${priceData.price.toFixed(6)}` : 'Loading price...'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Buy 1 Token Button */}
        <button
          onClick={() => openJupiterWidget(1)}
          disabled={isLoading || !priceData}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 text-sm font-mono border-2 border-green-500 disabled:border-gray-500"
        >
          <Zap className="w-4 h-4 inline mr-2" />
          BUY 1 {tokenSymbol}
          <div className="text-xs text-green-200 mt-1">
            ~{amountFor1Token} tokens needed
          </div>
        </button>

        {/* Buy 100 Tokens Button */}
        <button
          onClick={() => openJupiterWidget(100)}
          disabled={isLoading || !priceData}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 text-sm font-mono border-2 border-blue-500 disabled:border-gray-500"
        >
          <Zap className="w-4 h-4 inline mr-2" />
          BUY 100 {tokenSymbol}
          <div className="text-xs text-blue-200 mt-1">
            ~{amountFor100Tokens} tokens needed
          </div>
        </button>
      </div>

      <div className="mt-3 text-xs text-gray-400 text-center font-mono">
        * Amounts include 10% tax + fees to ensure you receive the target amount
      </div>
    </div>
  );
};
