
import React from 'react';
import { CountdownTimer } from './components/CountdownTimer';
import { JupiterBuyWidget } from './components/JupiterBuyWidget';

const REVS_TOKEN_ADDRESS = '9VxExA1iRPbuLLdSJ2rB3nyBxsyLReT4aqzZBMaBaY1p';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <div className="container mx-auto p-4">
        <CountdownTimer tokenContract={REVS_TOKEN_ADDRESS} />
        <div className="mt-6">
          <JupiterBuyWidget tokenAddress={REVS_TOKEN_ADDRESS} />
        </div>
      </div>
    </div>
  );
}

export default App;
