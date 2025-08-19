
import { CountdownTimer } from './components/CountdownTimer';
import { JupiterBuyWidget } from './components/JupiterBuyWidget';

function App() {
  // Hardcoded to REVS token (Token-2022 revshare token for testing)
  const REVS_TOKEN_ADDRESS = '9VxExA1iRPbuLLdSJ2rB3nyBxsyLReT4aqzZBMaBaY1p';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl px-2 py-4">
        {/* Device Header */}
        <div className="text-center mb-4 sm:mb-8">
          <div className="inline-flex items-center bg-gray-800 rounded-t-2xl px-4 sm:px-6 py-2 sm:py-3 border-b-2 border-gray-600">
            <div className="w-2 sm:w-3 h-2 sm:h-3 bg-red-500 rounded-full mr-2 sm:mr-3 animate-pulse"></div>
            <h1 className="text-lg sm:text-2xl font-bold text-green-400 font-mono tracking-wider">
              TREASURY VAULT TIMER
            </h1>
            <div className="w-2 sm:w-3 h-2 sm:h-3 bg-green-500 rounded-full ml-2 sm:ml-3"></div>
          </div>
        </div>

        {/* Main Device Body */}
        <CountdownTimer tokenContract={REVS_TOKEN_ADDRESS} />

        {/* Jupiter Buy Widget */}
        <div className="mt-6">
          <JupiterBuyWidget tokenAddress={REVS_TOKEN_ADDRESS} tokenSymbol="REVS" />
        </div>

        {/* Device Footer */}
        <div className="text-center mt-4 sm:mt-8">
          <div className="inline-flex items-center bg-gray-800 rounded-b-2xl px-4 sm:px-6 py-2 sm:py-3 border-t-2 border-gray-600">
            <span className="text-xs text-gray-400 font-mono">
              SOLANA BLOCKCHAIN MONITOR v1.0
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
