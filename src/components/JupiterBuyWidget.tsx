import React, { useState, useEffect } from 'react';
import { Zap, X, Target, Trophy } from 'lucide-react';
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
    
    // Calculate USD value needed
    const usdValue = baseTokens * currentPrice;
    
    // Add 5% buffer for slippage and fees
    const totalUsdValue = usdValue * 1.05;
    
    // Convert to SOL (assuming SOL is ~$100)
    const solPriceUsd = 100;
    const solAmount = totalUsdValue / solPriceUsd;
    
    return solAmount;
  };

  // Get current price from multiple sources
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setIsLoading(true);
        
        // Try Dexscreener first (most reliable for REVS)
        const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${REVS_TOKEN_ADDRESS}`);
        if (dexResponse.ok) {
          const dexData = await dexResponse.json();
          if (dexData.pairs && dexData.pairs[0]) {
            const priceUsd = parseFloat(dexData.pairs[0].priceUsd);
            console.log('Dexscreener price USD:', priceUsd);
            setPriceData({
              price: priceUsd,
              inputMint: 'So11111111111111111111111111111111111111112'
            });
            return;
          }
        }
        
        // Fallback: try Jupiter price API
        const jupResponse = await fetch(`https://price.jup.ag/v4/price?ids=${REVS_TOKEN_ADDRESS}`);
        if (jupResponse.ok) {
          const jupData = await jupResponse.json();
          if (jupData.data && jupData.data[REVS_TOKEN_ADDRESS]) {
            const price = jupData.data[REVS_TOKEN_ADDRESS].price;
            // Convert to USD (assuming SOL is ~$100)
            const priceUsd = price * 100;
            console.log('Jupiter price USD:', priceUsd);
            setPriceData({
              price: priceUsd,
              inputMint: 'So11111111111111111111111111111111111111112'
            });
            return;
          }
        }
        
        // Final fallback - use Solscan price
        console.log('Using Solscan fallback price');
        setPriceData({
          price: 0.0007128, // From Solscan
          inputMint: 'So11111111111111111111111111111111111111112'
        });
        
      } catch (error) {
        console.error('Error fetching price:', error);
        setPriceData({
          price: 0.0007128, // From Solscan as fallback
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
            displayMode: "integrated" as const,
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
            // Route restrictions for future token deployment
            onlyDirectRoutes: true,
            // Explicitly restrict to our specific LP pool
            poolFilter: (pool: any) => {
              // For testing with REVS, allow the current LP pool
              const allowedPools = [
                'GpMZbSM2GgvTKHJirzeGfMFoaZ8UR2X7F4v8vHTvxFbL', // Current REVS LP pool
                // Add your future token LP pool here when deployed
                // 'YOUR_FUTURE_TOKEN_LP_POOL_ADDRESS'
              ];
              return allowedPools.includes(pool.address);
            },
            // Alternative approach - restrict to specific pool addresses
            // allowedPools: ['GpMZbSM2GgvTKHJirzeGfMFoaZ8UR2X7F4v8vHTvxFbL']
          };
          console.log('Jupiter config with route restrictions:', config);
          init(config);
        });
      }
    }, 500); // Increased delay to ensure modal is fully rendered
    
    setIsLoading(false);
  };

  // Calculate display amounts for buttons
  const solFor1Token = priceData ? calculateSolAmountNeeded(1, priceData.price) : 0;
  const solFor100Tokens = priceData ? calculateSolAmountNeeded(100, priceData.price) : 0;

  return (
    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-3">
          <Zap className="w-6 h-6 text-orange-500 mr-2" />
          <h3 className="text-xl font-bold text-orange-500 font-mono">PLACE YOUR BID</h3>
        </div>
        <p className="text-gray-400 text-sm font-mono">
          {priceData ? `Current Price: $${priceData.price.toFixed(6)}` : 'Loading price...'}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Buy 1 Token Button */}
        <button
          onClick={() => openJupiterWidget(1)}
          disabled={isLoading || !priceData}
          className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:from-gray-700 disabled:to-gray-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 text-sm font-mono border-2 border-orange-500 disabled:border-gray-600 shadow-lg"
        >
          <Target className="w-5 h-5 inline mr-2" />
          BID 1 REVS
          <div className="text-xs text-orange-200 mt-2 font-medium">
            ~{solFor1Token.toFixed(4)} SOL
          </div>
        </button>

        {/* Buy 100 Tokens Button */}
        <button
          onClick={() => openJupiterWidget(100)}
          disabled={isLoading || !priceData}
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-gray-700 disabled:to-gray-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 text-sm font-mono border-2 border-orange-400 disabled:border-gray-600 shadow-lg"
        >
          <Trophy className="w-5 h-5 inline mr-2" />
          BID 100 REVS
          <div className="text-xs text-orange-200 mt-2 font-medium">
            ~{solFor100Tokens.toFixed(4)} SOL
          </div>
        </button>
      </div>

      <div className="text-center">
        <div className="bg-gray-800 rounded-lg p-3 mb-4">
          <div className="text-xs text-gray-400 font-mono mb-1">BID TO RESET TIMER</div>
          <div className="text-sm text-orange-400 font-mono">Minimum 1 REVS to trigger countdown</div>
        </div>
        
        <div className="text-xs text-gray-500 font-mono">
          * Amounts include 10% tax + fees to ensure you receive the target amount
        </div>
      </div>
      
      {/* Jupiter Widget Modal */}
      {showWidget && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-3xl w-full border-2 border-orange-500 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <Zap className="w-6 h-6 text-orange-500 mr-3" />
                <h3 className="text-xl font-bold text-orange-500 font-mono">Place Your Bid</h3>
              </div>
              <button
                onClick={() => setShowWidget(false)}
                className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div id="jupiter-widget-container" className="w-full h-[600px] rounded-xl overflow-hidden border border-gray-700">
              {/* Jupiter plugin will render here */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
