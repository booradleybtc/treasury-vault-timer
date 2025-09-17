import React, { useState, useEffect } from 'react';
import { Target, Star, Rocket, TrendingUp, Activity, X, Bitcoin } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import '@jup-ag/plugin/css';

const REVS_TOKEN_ADDRESS = '9VxExA1iRPbuLLdSJ2rB3nyBxsyLReT4aqzZBMaBaY1p';

interface JupiterBuyWidgetProps {
  tokenAddress: string;
}

export const JupiterBuyWidget: React.FC<JupiterBuyWidgetProps> = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate SOL amount needed for target REVS tokens
  const calculateSolAmountNeeded = (targetTokens: number) => {
    // Assuming SOL price is around $100 USD
    const solPriceUSD = 100;
    const revsPriceUSD = currentPrice || 0.0007128; // Use current price or fallback
    
    // Calculate USD value needed for target tokens
    const usdValueNeeded = targetTokens * revsPriceUSD;
    
    // Account for 10% token tax + 5% slippage/fees
    const totalMultiplier = 1.15; // 10% tax + 5% fees
    const adjustedUSDValue = usdValueNeeded * totalMultiplier;
    
    // Convert to SOL
    const solAmount = adjustedUSDValue / solPriceUSD;
    
    return Math.max(solAmount, 0.001); // Minimum 0.001 SOL
  };

  // Fetch current REVS price
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        // Try Dexscreener API first
        const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${REVS_TOKEN_ADDRESS}`);
        const data = await response.json();
        
        if (data.pairs && data.pairs.length > 0) {
          const price = parseFloat(data.pairs[0].priceUsd);
          if (price > 0) {
            setCurrentPrice(price);
            return;
          }
        }
        
        // Fallback to hardcoded price
        setCurrentPrice(0.0007128);
      } catch (error) {
        console.error('Error fetching price:', error);
        setCurrentPrice(0.0007128);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const openJupiterWidget = (targetTokens: number) => {
    setIsLoading(true);
    
    // Calculate SOL amount needed
    const solAmount = calculateSolAmountNeeded(targetTokens);
    console.log(`Opening widget for ${targetTokens} tokens, SOL amount: ${solAmount}`);
    
    setIsModalOpen(true);
    
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
              name: "MicroScratchety Protocol",
              logoUri: "https://raw.githubusercontent.com/booradleybtc/treasury-vault-timer/main/public/icon-192x192.png"
            },
            // STRICT ROUTE RESTRICTIONS
            onlyDirectRoutes: true, // Only direct swaps, no complex routing
            // Explicitly restrict to ONLY our specific LP pool
            poolFilter: (pool: any) => {
              // For testing with REVS, allow the current LP pool
              const allowedPools = [
                'GpMZbSM2GgvTKHJirzeGfMFoaZ8UR2X7F4v8vHTvxFbL', // Current REVS LP pool
                // Add your future token LP pool here when deployed
                // 'YOUR_FUTURE_TOKEN_LP_POOL_ADDRESS'
              ];
              
              const isAllowed = allowedPools.includes(pool.address);
              console.log(`Pool ${pool.address} allowed: ${isAllowed}`);
              return isAllowed;
            },
            // Additional route restrictions
            routeFilter: (route: any) => {
              // Only allow routes that go through our approved LP
              const allowedPools = [
                'GpMZbSM2GgvTKHJirzeGfMFoaZ8UR2X7F4v8vHTvxFbL'
              ];
              
              // Check if route uses our approved pool
              const usesApprovedPool = route.marketInfos.some((market: any) => 
                allowedPools.includes(market.amm.label)
              );
              
              console.log(`Route uses approved pool: ${usesApprovedPool}`);
              return usesApprovedPool;
            },
            // Force specific AMM
            ammLabel: "Raydium", // Force Raydium AMM
            // Disable other DEXes
            excludeDexes: ["Orca", "Serum", "Lifinity", "Meteora", "Crema", "Aldrin", "Stepn", "Sencha", "Saros", "Mercurial", "Cropper", "Raydium CLMM", "Invariant", "GooseFX", "DeltaFi", "Marinade", "Step", "Saber", "AldrinV1", "OrcaV1", "LifinityV1", "RaydiumV1", "CremaV1", "SenchaV1", "SarosV1", "MercurialV1", "CropperV1", "InvariantV1", "GooseFXV1", "DeltaFiV1", "MarinadeV1", "StepV1", "SaberV1"],
          };
          console.log('Jupiter config with strict route restrictions:', config);
          init(config);
        });
      }
    }, 500);
    
    setIsLoading(false);
  };

  const solFor1Token = calculateSolAmountNeeded(1);
  const solFor100Tokens = calculateSolAmountNeeded(100);

  return (
    <>
      <Card className="bg-black/40 backdrop-blur-xl border-orange-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-4 shadow-lg border border-orange-400/30">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-white">HUNT TREASURY VAULTS</CardTitle>
                <p className="text-orange-300 text-sm">Scratch-off Protocol Interface</p>
              </div>
            </div>
            {currentPrice && (
              <div className="text-right">
                <div className="text-orange-300 text-sm font-bold">Current Price</div>
                <div className="text-orange-400 font-bold text-lg">${currentPrice.toFixed(6)}</div>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Info Block */}
          <Card className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border-orange-500/30">
            <CardContent className="p-4">
              <div className="flex items-center mb-2">
                <Activity className="w-5 h-5 text-orange-400 mr-2" />
                <span className="text-orange-400 font-bold">SCRATCH PROTOCOL PARAMETERS</span>
              </div>
              <div className="text-orange-300 text-sm space-y-1">
                <div>• Minimum hunt: 1 REVS to reset vault timer</div>
                <div>• High-frequency farming: 100+ REVS for 83% APY</div>
                <div>• Protocol tax: 10% applies to all transactions</div>
              </div>
            </CardContent>
          </Card>

          {/* Execution Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Standard Hunt Button */}
            <Button
              onClick={() => openJupiterWidget(1)}
              variant="default"
              size="xl"
              disabled={isLoading}
              className="h-16 text-lg font-bold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 border-0 shadow-2xl hover:shadow-orange-500/25"
            >
              <div className="flex items-center justify-center w-full">
                <Target className="w-6 h-6 mr-3" />
                <div className="text-left">
                  <div className="text-sm">HUNT 48,948x</div>
                  <div className="text-lg">1 REVS</div>
                  <div className="text-xs opacity-80">{solFor1Token.toFixed(4)} SOL</div>
                </div>
              </div>
            </Button>

            {/* High-Frequency Farm Button */}
            <Button
              onClick={() => openJupiterWidget(100)}
              variant="default"
              size="xl"
              disabled={isLoading}
              className="h-16 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 border-0 shadow-2xl hover:shadow-green-500/25"
            >
              <div className="flex items-center justify-center w-full">
                <TrendingUp className="w-6 h-6 mr-3" />
                <div className="text-left">
                  <div className="text-sm">FARM 83% APY</div>
                  <div className="text-lg">100 REVS</div>
                  <div className="text-xs opacity-80">{solFor100Tokens.toFixed(4)} SOL</div>
                </div>
              </div>
            </Button>
          </div>

          {/* Premium Status */}
          <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="w-5 h-5 text-purple-400 mr-2" />
                <span className="text-purple-400 font-bold">SCRATCH REWARDS</span>
              </div>
              <div className="text-purple-300 text-sm">
                High-frequency farmers receive exclusive scratch rewards, enhanced APY, and priority distribution access
              </div>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 bg-orange-500/20 text-orange-400 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-400 mr-2"></div>
                Initializing Scratch Protocol...
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Jupiter Widget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className="bg-black/80 rounded-2xl p-6 max-w-4xl w-full border border-orange-500/30 shadow-2xl backdrop-blur-xl">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center mr-3">
                  <Rocket className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Scratch Protocol Interface</h3>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                }}
                className="text-orange-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-orange-500/20"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div id="jupiter-widget-container" className="w-full h-[600px] rounded-xl overflow-hidden border border-orange-500/30">
              {/* Jupiter plugin will render here */}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
