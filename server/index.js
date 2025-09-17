import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Connection, PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';
import web3 from '@solana/web3.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Serve static frontend (built into dist/)
app.use(express.static(path.join(__dirname, '../dist')));

// Socket.IO (allow localhost + your Render URL)
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// CORS middleware for API
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Solana RPC (Helius)
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '';
const connection = new Connection(`https://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`, {
  wsEndpoint: `wss://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`
});

// RAY token address (moderate activity DEX token)
const REVS_TOKEN_ADDRESS = '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R';

// Token metadata and price data
let tokenData = {
  price: 0,
  marketCap: 0,
  volume24h: 0,
  lastUpdated: null
};

// Wallet addresses to track (add your specific wallets here)
const TRACKED_WALLETS = [
  'YOUR_WALLET_ADDRESS_1',
  'YOUR_WALLET_ADDRESS_2',
  // Add more wallet addresses as needed
];

// Wallet balances cache
let walletBalances = {};

// Global timer state
let globalTimer = {
  timeLeft: 3600,
  isActive: true,
  lastPurchaseTime: null,
  lastBuyerAddress: null,
  lastPurchaseAmount: null,
  lastCheckedSignature: null,
  lastTxSignature: null
};

// Monitoring control
let monitoringState = {
  isMonitoring: false,
  monitoringInterval: null,
  webSocketSubscription: null,
  isProductionMode: process.env.NODE_ENV === 'production'
};

// Track processed signatures to avoid duplicates
const processedSignatures = new Set();

// Fetch token price data from Jupiter API
async function fetchTokenPrice() {
  try {
    const response = await fetch(`https://price.jup.ag/v4/price?ids=${REVS_TOKEN_ADDRESS}`);
    const data = await response.json();
    
    if (data.data && data.data[REVS_TOKEN_ADDRESS]) {
      const priceInfo = data.data[REVS_TOKEN_ADDRESS];
      tokenData.price = priceInfo.price;
      tokenData.lastUpdated = new Date().toISOString();
      
      // Calculate market cap (you'll need to get total supply from token metadata)
      // For now, we'll use a placeholder calculation
      tokenData.marketCap = tokenData.price * 1000000000; // Assuming 1B supply
      
      console.log(`💰 Token price updated: $${tokenData.price}`);
    }
  } catch (error) {
    console.error('❌ Error fetching token price:', error);
  }
}

// Fetch wallet SOL balances
async function fetchWalletBalances() {
  try {
    for (const walletAddress of TRACKED_WALLETS) {
      if (walletAddress === 'YOUR_WALLET_ADDRESS_1' || walletAddress === 'YOUR_WALLET_ADDRESS_2') {
        continue; // Skip placeholder addresses
      }
      
      try {
        const publicKey = new PublicKey(walletAddress);
        const balance = await connection.getBalance(publicKey);
        const solBalance = balance / web3.LAMPORTS_PER_SOL;
        
        walletBalances[walletAddress] = {
          sol: solBalance,
          usd: solBalance * 100, // Assuming $100 SOL price, you can fetch this too
          lastUpdated: new Date().toISOString()
        };
      } catch (error) {
        console.error(`❌ Error fetching balance for ${walletAddress}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error fetching wallet balances:', error);
  }
}

// Update token data every 30 seconds
setInterval(() => {
  fetchTokenPrice();
  fetchWalletBalances();
}, 30000);

// Admin controls (dev only)
const isAdmin = (socket) => {
  return process.env.NODE_ENV !== 'production' || socket.handshake.auth.adminKey === process.env.ADMIN_KEY;
};

// Enhanced purchase check (v0-safe, positive delta only)
function checkIfActualPurchase(transaction) {
  try {
    console.log('🔍 Analyzing transaction for legitimate purchase...');

    // Token balance deltas (pre/post)
    const tokenBalances = transaction.meta?.preTokenBalances || [];
    const postTokenBalances = transaction.meta?.postTokenBalances || [];

    if (!tokenBalances.length || !postTokenBalances.length) {
      console.log('❌ No token balances found in transaction');
      return false;
    }

    const ourTokenPre = tokenBalances.find(b => b.mint === REVS_TOKEN_ADDRESS);
    const ourTokenPost = postTokenBalances.find(b => b.mint === REVS_TOKEN_ADDRESS);
    if (!ourTokenPre || !ourTokenPost) {
      console.log('❌ Our token not found in transaction balances');
      return false;
    }

    const preAmount = Number(ourTokenPre.uiTokenAmount.amount);
    const postAmount = Number(ourTokenPost.uiTokenAmount.amount);
    const decimals = ourTokenPost.uiTokenAmount.decimals || 0;

    const actualPreAmount = preAmount / 10 ** decimals;
    const actualPostAmount = postAmount / 10 ** decimals;
    console.log(`💰 Token amounts - Pre: ${actualPreAmount}, Post: ${actualPostAmount}`);

    if (actualPostAmount < actualPreAmount) {
      console.log('❌ Transaction is a burn/sell (decreasing balance)');
      return false;
    }

    // v0-safe: guard instructions
    const instructions = transaction.transaction?.message?.instructions || [];
    const isBurnInstruction = instructions.some(i => {
      if (i.programId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
        const data = i.data;
        return data && data[0] === 8; // burn
      }
      return false;
    });
    if (isBurnInstruction) return false;

    const purchaseAmount = actualPostAmount - actualPreAmount;

    // Threshold for RAY (tune as needed)
    const MINIMUM_PURCHASE_AMOUNT = 1;

    if (purchaseAmount <= 0) {
      console.log('❌ No positive purchase amount detected');
      return false;
    }
    if (purchaseAmount < MINIMUM_PURCHASE_AMOUNT) {
      console.log(`❌ Purchase amount ${purchaseAmount} below minimum threshold ${MINIMUM_PURCHASE_AMOUNT}`);
      return false;
    }

    console.log('✅ LEGITIMATE PURCHASE DETECTED!');
    console.log(`   Amount: ${purchaseAmount} RAY`);
    console.log(`   Buyer: ${ourTokenPost.owner}`);

    return {
      isValid: true,
      amount: purchaseAmount,
      buyer: ourTokenPost.owner
    };
  } catch (e) {
    console.error('❌ Error analyzing transaction:', e);
    return false;
  }
}

// Poll-based monitor (kept as fallback)
const monitorPurchases = async () => {
  try {
    console.log('🔍 Monitoring for legitimate RAY purchases...');

    const signatures = await connection.getSignaturesForAddress(
      new web3.PublicKey(REVS_TOKEN_ADDRESS),
      { limit: 10 }
    );

    for (const sigInfo of signatures) {
      const signature = sigInfo.signature;
      if (processedSignatures.has(signature)) continue;

      try {
        const transaction = await connection.getTransaction(signature, {
          maxSupportedTransactionVersion: 0
        });
        if (!transaction) {
          console.log(`⚠️ Could not fetch transaction: ${signature}`);
          continue;
        }

        const purchaseValidation = checkIfActualPurchase(transaction);
        if (purchaseValidation && purchaseValidation.isValid) {
          console.log('🎯 LEGITIMATE PURCHASE CONFIRMED!');
          console.log(`   Amount: ${purchaseValidation.amount} RAY`);
          console.log(`   Buyer: ${purchaseValidation.buyer}`);
          console.log(`   Signature: ${signature}`);
          console.log(`   Solscan: https://solscan.io/tx/${signature}`);

          // Reset timer and broadcast
          globalTimer.timeLeft = 3600;
          globalTimer.lastBuyerAddress = purchaseValidation.buyer;
          globalTimer.lastPurchaseAmount = purchaseValidation.amount;
          globalTimer.lastTxSignature = signature;

          io.emit('timerReset', {
            timeLeft: globalTimer.timeLeft,
            lastBuyerAddress: globalTimer.lastBuyerAddress,
            lastPurchaseAmount: globalTimer.lastPurchaseAmount,
            txSignature: signature
          });

          console.log(`⏰ Timer reset to ${globalTimer.timeLeft} seconds`);
        } else {
          console.log(`❌ Transaction ${signature.slice(0, 8)}... excluded from timer reset`);
        }

        processedSignatures.add(signature);
        if (processedSignatures.size > 1000) {
          const first = processedSignatures.values().next().value;
          processedSignatures.delete(first);
        }
      } catch (err) {
        console.error(`❌ Error processing transaction ${signature}:`, err);
      }
    }
  } catch (err) {
    console.error('❌ Error monitoring purchases:', err);
  }
};

// Countdown
setInterval(() => {
  if (globalTimer.isActive && globalTimer.timeLeft > 0) {
    globalTimer.timeLeft -= 1;
    io.emit('timerUpdate', { timeLeft: globalTimer.timeLeft, isActive: globalTimer.isActive });
  } else if (globalTimer.timeLeft === 0) {
    globalTimer.isActive = false;
    io.emit('timerExpired');
  }
}, 1000);

// Socket.IO
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.emit('timerState', {
    timeLeft: globalTimer.timeLeft,
    isActive: globalTimer.isActive,
    lastPurchaseTime: globalTimer.lastPurchaseTime,
    lastBuyerAddress: globalTimer.lastBuyerAddress,
    lastPurchaseAmount: globalTimer.lastPurchaseAmount,
    txSignature: globalTimer.lastTxSignature,
    isMonitoring: monitoringState.isMonitoring
  });

  socket.on('startMonitoring', () => {
    if (isAdmin(socket)) {
      startMonitoring();
      io.emit('monitoringState', { isMonitoring: monitoringState.isMonitoring });
    }
  });

  socket.on('stopMonitoring', () => {
    if (isAdmin(socket)) {
      stopMonitoring();
      io.emit('monitoringState', { isMonitoring: monitoringState.isMonitoring });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// API
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.get('/api/status', (req, res) => {
  res.json({
    message: 'Treasury Vault Timer Backend',
    status: 'running',
    timestamp: new Date().toISOString(),
    token: REVS_TOKEN_ADDRESS,
    isMonitoring: monitoringState.isMonitoring
  });
});

app.get('/api/timer', (req, res) => {
  res.json({ ...globalTimer, isMonitoring: monitoringState.isMonitoring });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), isMonitoring: monitoringState.isMonitoring });
});

// Token data endpoints
app.get('/api/token/price', (req, res) => {
  res.json({
    token: REVS_TOKEN_ADDRESS,
    price: tokenData.price,
    marketCap: tokenData.marketCap,
    volume24h: tokenData.volume24h,
    lastUpdated: tokenData.lastUpdated
  });
});

app.get('/api/token/data', (req, res) => {
  res.json({
    token: REVS_TOKEN_ADDRESS,
    price: tokenData.price,
    marketCap: tokenData.marketCap,
    volume24h: tokenData.volume24h,
    lastUpdated: tokenData.lastUpdated,
    timer: globalTimer
  });
});

// Wallet balances endpoint
app.get('/api/wallets', (req, res) => {
  res.json({
    wallets: walletBalances,
    totalSol: Object.values(walletBalances).reduce((sum, wallet) => sum + wallet.sol, 0),
    totalUsd: Object.values(walletBalances).reduce((sum, wallet) => sum + wallet.usd, 0),
    lastUpdated: new Date().toISOString()
  });
});

// Combined data endpoint
app.get('/api/dashboard', (req, res) => {
  res.json({
    timer: globalTimer,
    token: {
      address: REVS_TOKEN_ADDRESS,
      price: tokenData.price,
      marketCap: tokenData.marketCap,
      volume24h: tokenData.volume24h,
      lastUpdated: tokenData.lastUpdated
    },
    wallets: {
      balances: walletBalances,
      totalSol: Object.values(walletBalances).reduce((sum, wallet) => sum + wallet.sol, 0),
      totalUsd: Object.values(walletBalances).reduce((sum, wallet) => sum + wallet.usd, 0)
    },
    monitoring: {
      isMonitoring: monitoringState.isMonitoring,
      lastUpdated: new Date().toISOString()
    }
  });
});

// HTML Embed endpoints for Framer
app.get('/embed/timer', (req, res) => {
  const timeLeft = globalTimer.timeLeft;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          font-family: 'Courier New', monospace; 
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .timer { 
          font-size: 4rem; 
          font-weight: bold; 
          color: #f97316; 
          text-align: center;
          text-shadow: 0 0 20px rgba(249, 115, 22, 0.5);
        }
      </style>
    </head>
    <body>
      <div class="timer" id="timer">${timeString}</div>
      <script>
        // Auto-refresh every second
        setInterval(() => {
          fetch('/api/timer')
            .then(r => r.json())
            .then(data => {
              const timeLeft = data.timeLeft;
              const minutes = Math.floor(timeLeft / 60);
              const seconds = timeLeft % 60;
              const timeString = minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
              document.getElementById('timer').textContent = timeString;
            })
            .catch(() => {});
        }, 1000);
      </script>
    </body>
    </html>
  `);
});

app.get('/embed/price', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          font-family: 'Courier New', monospace; 
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .price { 
          font-size: 2.5rem; 
          font-weight: bold; 
          color: #10b981; 
          text-align: center;
        }
        .label {
          font-size: 1rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }
      </style>
    </head>
    <body>
      <div>
        <div class="label">RAY Price</div>
        <div class="price" id="price">$${tokenData.price.toFixed(6)}</div>
      </div>
      <script>
        // Auto-refresh every 30 seconds
        setInterval(() => {
          fetch('/api/token/price')
            .then(r => r.json())
            .then(data => {
              document.getElementById('price').textContent = '$' + data.price.toFixed(6);
            })
            .catch(() => {});
        }, 30000);
      </script>
    </body>
    </html>
  `);
});

app.get('/embed/marketcap', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          font-family: 'Courier New', monospace; 
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .marketcap { 
          font-size: 2rem; 
          font-weight: bold; 
          color: #3b82f6; 
          text-align: center;
        }
        .label {
          font-size: 1rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }
      </style>
    </head>
    <body>
      <div>
        <div class="label">Market Cap</div>
        <div class="marketcap" id="marketcap">$${(tokenData.marketCap / 1000000).toFixed(2)}M</div>
      </div>
      <script>
        // Auto-refresh every 30 seconds
        setInterval(() => {
          fetch('/api/token/price')
            .then(r => r.json())
            .then(data => {
              const marketCapM = (data.marketCap / 1000000).toFixed(2);
              document.getElementById('marketcap').textContent = '$' + marketCapM + 'M';
            })
            .catch(() => {});
        }, 30000);
      </script>
    </body>
    </html>
  `);
});

app.get('/embed/lastbuyer', (req, res) => {
  const buyer = globalTimer.lastBuyerAddress;
  const amount = globalTimer.lastPurchaseAmount;
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          font-family: 'Courier New', monospace; 
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .buyer { 
          font-size: 1.2rem; 
          font-weight: bold; 
          color: #10b981; 
          text-align: center;
          word-break: break-all;
        }
        .amount {
          font-size: 1.5rem;
          color: #f97316;
          margin-top: 0.5rem;
        }
        .label {
          font-size: 1rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }
      </style>
    </head>
    <body>
      <div>
        <div class="label">Last Buyer</div>
        <div class="buyer" id="buyer">${buyer ? buyer.slice(0, 8) + '...' + buyer.slice(-8) : 'Awaiting purchase...'}</div>
        ${amount ? `<div class="amount" id="amount">${amount.toFixed(2)} RAY</div>` : ''}
      </div>
      <script>
        // Auto-refresh every 5 seconds
        setInterval(() => {
          fetch('/api/timer')
            .then(r => r.json())
            .then(data => {
              const buyer = data.lastBuyerAddress;
              const amount = data.lastPurchaseAmount;
              document.getElementById('buyer').textContent = buyer ? 
                buyer.slice(0, 8) + '...' + buyer.slice(-8) : 'Awaiting purchase...';
              if (amount) {
                document.getElementById('amount').textContent = amount.toFixed(2) + ' RAY';
              }
            })
            .catch(() => {});
        }, 5000);
      </script>
    </body>
    </html>
  `);
});

app.get('/embed/wallets', (req, res) => {
  const totalSol = Object.values(walletBalances).reduce((sum, wallet) => sum + wallet.sol, 0);
  const totalUsd = Object.values(walletBalances).reduce((sum, wallet) => sum + wallet.usd, 0);
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          font-family: 'Courier New', monospace; 
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .wallet { 
          font-size: 1.5rem; 
          font-weight: bold; 
          color: #8b5cf6; 
          text-align: center;
        }
        .label {
          font-size: 1rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }
      </style>
    </head>
    <body>
      <div>
        <div class="label">Total Wallet Value</div>
        <div class="wallet" id="sol">${totalSol.toFixed(2)} SOL</div>
        <div class="wallet" id="usd">$${totalUsd.toFixed(2)}</div>
      </div>
      <script>
        // Auto-refresh every 30 seconds
        setInterval(() => {
          fetch('/api/wallets')
            .then(r => r.json())
            .then(data => {
              document.getElementById('sol').textContent = data.totalSol.toFixed(2) + ' SOL';
              document.getElementById('usd').textContent = '$' + data.totalUsd.toFixed(2);
            })
            .catch(() => {});
        }, 30000);
      </script>
    </body>
    </html>
  `);
});

// Helius webhook (highest-performance path)
app.post('/webhook/helius', (req, res) => {
  try {
    const configuredSecret = process.env.WEBHOOK_SECRET;
    if (configuredSecret) {
      const authHeader = req.headers['authorization'] || '';
      if (authHeader !== `Bearer ${configuredSecret}`) {
        return res.status(401).json({ ok: false });
      }
    }

    const events = Array.isArray(req.body) ? req.body : [req.body];
    for (const evt of events) {
      const signature = evt?.signature || evt?.transaction?.signature || '';
      const pre = evt?.events?.token?.preTokenBalances || evt?.meta?.preTokenBalances || [];
      const post = evt?.events?.token?.postTokenBalances || evt?.meta?.postTokenBalances || [];

      const preBal = pre.find(b => b.mint === REVS_TOKEN_ADDRESS);
      const postBal = post.find(b => b.mint === REVS_TOKEN_ADDRESS);
      if (!preBal || !postBal) continue;

      const decimals = postBal.uiTokenAmount?.decimals ?? 0;
      const preAmt = Number(preBal.uiTokenAmount?.amount || 0) / 10 ** decimals;
      const postAmt = Number(postBal.uiTokenAmount?.amount || 0) / 10 ** decimals;
      const delta = postAmt - preAmt;

      if (delta > 1) {
        globalTimer.timeLeft = 3600;
        globalTimer.lastBuyerAddress = postBal.owner;
        globalTimer.lastPurchaseAmount = delta;
        globalTimer.lastTxSignature = signature;

        io.emit('timerReset', {
          timeLeft: globalTimer.timeLeft,
          lastBuyerAddress: globalTimer.lastBuyerAddress,
          lastPurchaseAmount: globalTimer.lastPurchaseAmount,
          txSignature: globalTimer.lastTxSignature
        });
      }
    }
  } catch (e) {
    console.error('Webhook handling error', e);
  } finally {
    res.status(200).json({ ok: true });
  }
});

// Start/Stop
const startMonitoring = () => {
  if (monitoringState.isMonitoring) return;
  console.log('🚀 Starting RAY purchase monitoring...');
  monitoringState.isMonitoring = true;

  monitoringState.monitoringInterval = setInterval(() => {
    if (monitoringState.isMonitoring) {
      monitorPurchases();
    }
  }, 10000);
};

const stopMonitoring = () => {
  if (!monitoringState.isMonitoring) return;
  console.log('⏹️ Stopping RAY purchase monitoring...');
  monitoringState.isMonitoring = false;

  if (monitoringState.monitoringInterval) {
    clearInterval(monitoringState.monitoringInterval);
    monitoringState.monitoringInterval = null;
  }
};

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Monitoring RAY token: ${REVS_TOKEN_ADDRESS}`);
  console.log(`⏰ Global timer started at ${globalTimer.timeLeft} seconds`);
  console.log(`🌐 Frontend served from: ${path.join(__dirname, '../dist')}`);

  if (process.env.NODE_ENV === 'production') {
    console.log('🚀 PRODUCTION MODE: Auto-starting monitoring...');
    startMonitoring();
  } else {
    console.log('⏸️ DEVELOPMENT MODE: Monitoring is PAUSED');
  }
  
  // Initialize token data and wallet balances
  console.log('📊 Initializing token data and wallet balances...');
  fetchTokenPrice();
  fetchWalletBalances();
});
