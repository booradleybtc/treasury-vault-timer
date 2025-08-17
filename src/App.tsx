import React from 'react';
import { CountdownTimer } from './components/CountdownTimer';

function App() {
  // Hardcoded to JUP token (moderate activity for testing)
  const JUP_TOKEN_ADDRESS = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Device Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center bg-gray-800 rounded-t-2xl px-6 py-3 border-b-2 border-gray-600">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-3 animate-pulse"></div>
            <h1 className="text-2xl font-bold text-green-400 font-mono tracking-wider">
              TREASURY VAULT TIMER
            </h1>
            <div className="w-3 h-3 bg-green-500 rounded-full ml-3"></div>
          </div>
        </div>

        {/* Main Device Body */}
        <CountdownTimer tokenContract={JUP_TOKEN_ADDRESS} />

        {/* Device Footer */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center bg-gray-800 rounded-b-2xl px-6 py-3 border-t-2 border-gray-600">
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
