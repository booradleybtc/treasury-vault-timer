
import { CountdownTimer } from './components/CountdownTimer';
import { JupiterBuyWidget } from './components/JupiterBuyWidget';

const REVS_TOKEN_ADDRESS = '9VxExA1iRPbuLLdSJ2rB3nyBxsyLReT4aqzZBMaBaY1p';

function App() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto p-4">
        {/* Main Timer Component */}
        <CountdownTimer tokenContract={REVS_TOKEN_ADDRESS} />
        
        {/* Buy Widget */}
        <div className="mt-8">
          <JupiterBuyWidget tokenAddress={REVS_TOKEN_ADDRESS} />
        </div>
      </div>
    </div>
  );
}

export default App;
