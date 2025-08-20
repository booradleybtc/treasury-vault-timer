import React, { useState, useEffect } from 'react';
import { Target, Trophy, Zap, Crown, Star, Rocket, TrendingUp, Activity } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const REVS_TOKEN_ADDRESS = '9VxExA1iRPbuLLdSJ2rB3nyBxsyLReT4aqzZBMaBaY1p';

interface JupiterBuyWidgetProps {
  tokenAddress: string;
}

export const JupiterBuyWidget: React.FC<JupiterBuyWidgetProps> = () => {
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

  const handleBuyClick = (targetTokens: number) => {
    setIsLoading(true);
    
    // Calculate SOL amount needed
    const solAmount = calculateSolAmountNeeded(targetTokens);
    
    // Format for Jupiter widget
    const formattedAmount = solAmount.toFixed(6);
    
    // Create Jupiter URL with pre-filled parameters
    const jupiterUrl = `https://jup.ag/swap/SOL-${REVS_TOKEN_ADDRESS}?amount=${formattedAmount}&inputMint=So11111111111111111111111111111111111111112&outputMint=${REVS_TOKEN_ADDRESS}`;
    
    // Open Jupiter in new tab
    window.open(jupiterUrl, '_blank');
    
    setIsLoading(false);
  };

  const solFor1Token = calculateSolAmountNeeded(1);
  const solFor100Tokens = calculateSolAmountNeeded(100);

  return (
    <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4 shadow-lg border border-blue-400/30">
              <Rocket className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-white">EXECUTE TRANSACTION</CardTitle>
              <p className="text-slate-300 text-sm">Protocol Interface</p>
            </div>
          </div>
          {currentPrice && (
            <div className="text-right">
              <div className="text-slate-300 text-sm font-bold">Current Price</div>
              <div className="text-blue-400 font-bold text-lg">${currentPrice.toFixed(6)}</div>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Info Block */}
        <Card className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-center mb-2">
              <Activity className="w-5 h-5 text-blue-400 mr-2" />
              <span className="text-blue-400 font-bold">PROTOCOL PARAMETERS</span>
            </div>
            <div className="text-slate-300 text-sm space-y-1">
              <div>• Minimum execution: 1 REVS to reset timer</div>
              <div>• High-frequency execution: 100+ REVS for premium rewards</div>
              <div>• Protocol tax: 10% applies to all transactions</div>
            </div>
          </CardContent>
        </Card>

        {/* Execution Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Standard Execution Button */}
          <Button
            onClick={() => handleBuyClick(1)}
            variant="default"
            size="xl"
            disabled={isLoading}
            className="h-16 text-lg font-bold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0 shadow-2xl hover:shadow-blue-500/25"
          >
            <div className="flex items-center justify-center w-full">
              <Target className="w-6 h-6 mr-3" />
              <div className="text-left">
                <div className="text-sm">STANDARD EXECUTION</div>
                <div className="text-lg">1 REVS</div>
                <div className="text-xs opacity-80">{solFor1Token.toFixed(4)} SOL</div>
              </div>
            </div>
          </Button>

          {/* High-Frequency Execution Button */}
          <Button
            onClick={() => handleBuyClick(100)}
            variant="default"
            size="xl"
            disabled={isLoading}
            className="h-16 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 border-0 shadow-2xl hover:shadow-green-500/25"
          >
            <div className="flex items-center justify-center w-full">
              <TrendingUp className="w-6 h-6 mr-3" />
              <div className="text-left">
                <div className="text-sm">HIGH-FREQUENCY</div>
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
              <span className="text-purple-400 font-bold">PREMIUM FEATURES</span>
            </div>
            <div className="text-slate-300 text-sm">
              High-frequency executors receive exclusive rewards, enhanced APY, and priority distribution access
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
              Initializing Protocol Interface...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
