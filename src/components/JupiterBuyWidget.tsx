import React, { useState, useEffect } from 'react';
import { Zap, ShoppingCart, X } from 'lucide-react';
import '@jup-ag/plugin/css';

interface JupiterBuyWidgetProps {
  tokenAddress: string;
  tokenSymbol: string;
}

export const JupiterBuyWidget: React.FC<JupiterBuyWidgetProps> = ({ tokenSymbol }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [priceData, setPriceData] = useState<{ price: number; inputMint: string } | null>(null);
  const [showWidget, setShowWidget] = useState(false);

  // REVS token address
  const REVS_TOKEN_ADDRESS = '9VxExA1iRPbuLLdSJ2rB3nyBxsyLReT4aqzZBMaBaY1p';
  
  // Calculate SOL amount needed for target tokens (accounting for 10% tax + fees)
  const calculateSolAmountNeeded = (targetTokens: number, currentPrice: number) => {
    // 10% tax means you need to buy 111.11% to get 100%
    const taxMultiplier = 1.111111111; // 1 / 0.9
    const baseTokens = targetTokens * taxMultiplier;
    
    // Add 5% for slippage and fees
    const slippageMultiplier = 1.05;
    const totalTokens = baseTokens * slippageMultiplier;
    
    // Convert to SOL amount
    return totalTokens * currentPrice;
  };

  // Get current price from Jupiter
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setIsLoading(true);
        // Try Jupiter price API first
        const response = await fetch(`https://price.jup.ag/v4/price?ids=${REVS_TOKEN_ADDRESS}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.data && data.data[REVS_TOKEN_ADDRESS]) {
            const price = data.data[REVS_TOKEN_ADDRESS].price;
            console.log('Jupiter price:', price);
            setPriceData({
              price: price,
              inputMint: 'So11111111111111111111111111111111111111112' // SOL
            });
            return;
          }
        }
        
        // Fallback: try Dexscreener
        const fallbackResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${REVS_TOKEN_ADDRESS}`);
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          if (fallbackData.pairs && fallbackData.pairs[0]) {
            const priceUsd = parseFloat(fallbackData.pairs[0].priceUsd);
            // Convert USD price to SOL price (approximate)
            const solPrice = priceUsd / 100; // Rough estimate
            console.log('Dexscreener price:', solPrice);
            setPriceData({
              price: solPrice,
              inputMint: 'So11111111111111111111111111111111111111112'
            });
            return;
          }
        }
        
        // Final fallback - use a very conservative price
        console.log('Using fallback price');
        setPriceData({
          price: 0.0001, // Very conservative fallback price
          inputMint: 'So11111111111111111111111111111111111111112'
        });
        
      } catch (error) {
        console.error('Error fetching price:', error);
        setPriceData({
          price: 0.0001,
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
    const solAmount = priceData ? calculateSolAmountNeeded(targetTokens, priceData.price) : 0.01;
    console.log(`Opening widget for ${targetTokens} tokens, SOL amount: ${solAmount}`);
    
    setShowWidget(true);
    
    // Initialize Jupiter plugin after modal opens
    setTimeout(() => {
      if (typeof window !== "undefined") {
        import("@jup-ag/plugin").then((mod) => {
          const init = mod.init;
          const config = {
            displayMode: "integrated",
            integratedTargetId: "jupiter-widget-container",
            formProps: {
              initialAmount: solAmount.toFixed(6),
              initialInputMint: "So11111111111111111111111111111111111111112",
              initialOutputMint: REVS_TOKEN_ADDRESS,
            },
            branding: {
              name: "Treasury Vault Timer",
              logoUri: "https://raw.githubusercontent.com/booradleybtc/treasury-vault-timer/main/public/icon-192x192.png"
            },
          };
          console.log('Jupiter config:', config);
          init(config);
        });
      }
    }, 300); // Increased delay to ensure modal is fully rendered
    
    setIsLoading(false);
  };

  // Calculate display amounts for buttons
  const solFor1Token = priceData ? calculateSolAmountNeeded(1, priceData.price) : 0;
  const solFor100Tokens = priceData ? calculateSolAmountNeeded(100, priceData.price) : 0;

  return (
    <div className="bg-gray-800 rounded-xl p-4 border-2 border-gray-600">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center mb-2">
          <ShoppingCart className="w-5 h-5 text-green-400 mr-2" />
          <h3 className="text-lg font-bold text-green-400 font-mono">BUY {tokenSymbol}</h3>
        </div>
        <p className="text-xs text-gray-400 font-mono">
          {priceData ? `Current Price: $${(priceData.price * 100).toFixed(6)}` : 'Loading price...'}
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
            ~{solFor1Token.toFixed(4)} SOL needed
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
            ~{solFor100Tokens.toFixed(4)} SOL needed
          </div>
        </button>
      </div>

      <div className="mt-3 text-xs text-gray-400 text-center font-mono">
        * Amounts include 10% tax + fees to ensure you receive the target amount
      </div>
      
      {/* Jupiter Widget Modal */}
      {showWidget && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl p-6 max-w-2xl w-full border-2 border-gray-600 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-green-400 font-mono">Buy REVS to Reset Timer</h3>
              <button
                onClick={() => setShowWidget(false)}
                className="text-gray-400 hover:text-white transition-colors p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div id="jupiter-widget-container" className="w-full h-[500px] rounded-lg overflow-hidden">
              {/* Jupiter plugin will render here */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
