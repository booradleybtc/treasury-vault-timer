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
});
