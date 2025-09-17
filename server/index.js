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

// Serve static files from the dist directory (built frontend)
app.use(express.static(path.join(__dirname, '../dist')));
// CORS allowlist using regex to support any Vercel preview for this project
const isAllowedOrigin = (origin) => {
  if (!origin) return true; // allow non-browser clients
  const allowed = [
    /^http:\/\/localhost:3000$/,
    /^https:\/\/fresh-project-ten\.vercel\.app$/,
    // Any preview like fresh-project-xxxxxxxx-booradleybtcs-projects.vercel.app
    /^https:\/\/fresh-project-[a-z0-9]+-booradleybtcs-projects\.vercel\.app$/
  ];
  return allowed.some((re) => re.test(origin));
};

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Solana connection with WebSocket support
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '466f06cf-0f8e-4f05-9c46-a95cb4a83f67';
const connection = new Connection(`https://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`, {
  wsEndpoint: `wss://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`
});

// BONK token address (high activity meme token)
const REVS_TOKEN_ADDRESS = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';

// Global timer state
let globalTimer = {
  timeLeft: 3600, // 1 hour in seconds
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

// Push notification subscriptions
let pushSubscriptions = [];

// Admin controls - only allow monitoring control in development
const isAdmin = (socket) => {
  // In production, only allow monitoring to be started once
  // In development, allow full control
  return process.env.NODE_ENV !== 'production' || socket.handshake.auth.adminKey === process.env.ADMIN_KEY;
};

// Known DEX programs (where actual purchases happen)
const knownDEXPrograms = [
  'JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJBk', // Jupiter
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',   // Orca
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', // Raydium v2
  'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',   // Serum
  'PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY',   // Phoenix
];

// LP Pool and Vault Authority Configuration
const lpPoolWallets = [
  // Add your future token LP pool addresses here
  // 'YOUR_FUTURE_TOKEN_LP_POOL_ADDRESS'
];

const raydiumVaultAuthorities = [
  'GpMZbSM2GgvTKHJirzeGfMFoaZ8UR2X7F4v8vHTvxFbL', // Current REVS Raydium Vault Authority
  // Add your future token vault authorities here
  // 'YOUR_FUTURE_TOKEN_VAULT_AUTHORITY'
];

// Excluded wallet patterns (burns, distributor, dev wallets)
const excludedWalletPatterns = [
  '11111111111111111111111111111111', // System Program
  'Burn111111111111111111111111111111111111111', // Burn wallet
  '72hnXr9PsMjp8WsnFyZjmm5vzHhTqbfouqtHBgLYdDZE', // REVS distributor/dev wallet
  // Add your future token excluded wallets here
  // 'YOUR_FUTURE_TOKEN_DISTRIBUTOR_WALLET'
];

// Enhanced function to check if transaction is a legitimate purchase
function checkIfActualPurchase(transaction) {
  try {
    console.log('🔍 Analyzing transaction for legitimate purchase...');
    
    // Check if transaction involves our token
    const tokenBalances = transaction.meta.preTokenBalances || [];
    const postTokenBalances = transaction.meta.postTokenBalances || [];
    
    if (!tokenBalances.length || !postTokenBalances.length) {
      console.log('❌ No token balances found in transaction');
      return false;
    }

    // Find our token in the balances
    const ourTokenPre = tokenBalances.find(balance => 
      balance.mint === REVS_TOKEN_ADDRESS
    );
    const ourTokenPost = postTokenBalances.find(balance => 
      balance.mint === REVS_TOKEN_ADDRESS
    );

    if (!ourTokenPre || !ourTokenPost) {
      console.log('❌ Our token not found in transaction balances');
      return false;
    }

    // Check for burns (decreasing balance)
    const preAmount = parseInt(ourTokenPre.uiTokenAmount.amount);
    const postAmount = parseInt(ourTokenPost.uiTokenAmount.amount);
    const decimals = ourTokenPre.uiTokenAmount.decimals;
    
    const actualPreAmount = preAmount / Math.pow(10, decimals);
    const actualPostAmount = postAmount / Math.pow(10, decimals);
    
    console.log(`💰 Token amounts - Pre: ${actualPreAmount}, Post: ${actualPostAmount}`);

    if (actualPostAmount < actualPreAmount) {
      console.log('❌ Transaction is a burn/sell (decreasing balance)');
      return false;
    }

    // Check if any excluded wallets are involved
    const allAccounts = transaction.transaction.message.accountKeys;
    const excludedWalletFound = allAccounts.some(account => 
      excludedWalletPatterns.includes(account.pubkey)
    );

    if (excludedWalletFound) {
      console.log('❌ Excluded wallet pattern found in transaction');
      return false;
    }

    // CRITICAL: Check if transaction involves our approved LP pool/vault authority
    const involvesApprovedLP = allAccounts.some(account => 
      raydiumVaultAuthorities.includes(account.pubkey)
    );

    if (!involvesApprovedLP) {
      console.log('❌ Transaction does not involve our approved LP pool/vault authority');
      console.log('🔍 Available accounts:', allAccounts.map(acc => acc.pubkey));
      console.log('✅ Approved authorities:', raydiumVaultAuthorities);
      return false;
    }

    // Check if this is a BUY (user receives tokens from vault authority)
    const isBuyFromVault = ourTokenPre.owner === raydiumVaultAuthorities[0] && 
                          ourTokenPost.owner !== raydiumVaultAuthorities[0];

    // Check if this is a SELL (user sends tokens to vault authority)
    const isSellToVault = ourTokenPre.owner !== raydiumVaultAuthorities[0] && 
                         ourTokenPost.owner === raydiumVaultAuthorities[0];

    console.log(`🔍 Transaction type analysis:`);
    console.log(`   Pre owner: ${ourTokenPre.owner}`);
    console.log(`   Post owner: ${ourTokenPost.owner}`);
    console.log(`   Vault authority: ${raydiumVaultAuthorities[0]}`);
    console.log(`   Is buy from vault: ${isBuyFromVault}`);
    console.log(`   Is sell to vault: ${isSellToVault}`);

    if (isSellToVault) {
      console.log('❌ Transaction is a sell to LP (not a buy)');
      return false;
    }

    if (!isBuyFromVault) {
      console.log('❌ Transaction is not a buy from our approved LP');
      return false;
    }

    // Additional validation: Check instruction data for burn operations
    const instructions = transaction.transaction.message.instructions;
    const isBurnInstruction = instructions.some(instruction => {
      if (instruction.programId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
        const data = instruction.data;
        if (data && data[0] === 8) { // Burn instruction
          console.log('❌ Burn instruction detected');
          return true;
        }
      }
      return false;
    });

    if (isBurnInstruction) {
      return false;
    }

    // Calculate the actual purchase amount
    const purchaseAmount = actualPostAmount - actualPreAmount;
    
    // Set minimum purchase amount (e.g., 1000 BONK tokens)
    const MINIMUM_PURCHASE_AMOUNT = 1000;
    
    if (purchaseAmount <= 0) {
      console.log('❌ No positive purchase amount detected');
      return false;
    }
    
    if (purchaseAmount < MINIMUM_PURCHASE_AMOUNT) {
      console.log(`❌ Purchase amount ${purchaseAmount} below minimum threshold ${MINIMUM_PURCHASE_AMOUNT}`);
      return false;
    }

    console.log(`✅ LEGITIMATE PURCHASE DETECTED!`);
    console.log(`   Amount: ${purchaseAmount} BONK`);
    console.log(`   Buyer: ${ourTokenPost.owner}`);
    console.log(`   LP Pool: ${raydiumVaultAuthorities[0]}`);
    
    return {
      isValid: true,
      amount: purchaseAmount,
      buyer: ourTokenPost.owner
    };

  } catch (error) {
    console.error('❌ Error analyzing transaction:', error);
    return false;
  }
}

// Monitor purchases with improved detection
const monitorPurchases = async () => {
  try {
    console.log('🔍 Monitoring for legitimate REVS purchases...');
    
    const signatures = await connection.getSignaturesForAddress(
      new web3.PublicKey(REVS_TOKEN_ADDRESS),
      { limit: 10 }
    );

    for (const sigInfo of signatures) {
      const signature = sigInfo.signature;
      
      // Skip if we've already processed this transaction
      if (processedSignatures.has(signature)) {
        continue;
      }

      try {
        const transaction = await connection.getTransaction(signature, {
          maxSupportedTransactionVersion: 0
        });

        if (!transaction) {
          console.log(`⚠️ Could not fetch transaction: ${signature}`);
          continue;
        }

        // Use enhanced validation function
        const purchaseValidation = checkIfActualPurchase(transaction);
        
        if (purchaseValidation && purchaseValidation.isValid) {
          console.log(`🎯 LEGITIMATE PURCHASE CONFIRMED!`);
          console.log(`   Amount: ${purchaseValidation.amount} REVS`);
          console.log(`   Buyer: ${purchaseValidation.buyer}`);
          console.log(`   Signature: ${signature}`);
          console.log(`   Solscan: https://solscan.io/tx/${signature}`);
          
          // Reset timer and update state
          globalTimer.timeLeft = 3600; // Reset to 1 hour
          globalTimer.lastBuyerAddress = purchaseValidation.buyer;
          globalTimer.lastPurchaseAmount = purchaseValidation.amount;
          globalTimer.lastTxSignature = signature;
          
          // Emit timer reset event
          io.emit('timerReset', {
            timeLeft: globalTimer.timeLeft,
            lastBuyerAddress: globalTimer.lastBuyerAddress,
            lastPurchaseAmount: globalTimer.lastPurchaseAmount,
            txSignature: signature
          });
          
          console.log(`⏰ Timer reset to ${globalTimer.timeLeft} seconds`);
          console.log(`👤 Last buyer: ${globalTimer.lastBuyerAddress}`);
          console.log(`💰 Last purchase: ${globalTimer.lastPurchaseAmount} REVS`);
        } else {
          console.log(`❌ Transaction ${signature.slice(0, 8)}... excluded from timer reset`);
        }

        // Mark as processed
        processedSignatures.add(signature);
        
        // Keep only last 1000 signatures to prevent memory issues
        if (processedSignatures.size > 1000) {
          const firstSignature = processedSignatures.values().next().value;
          processedSignatures.delete(firstSignature);
        }

      } catch (error) {
        console.error(`❌ Error processing transaction ${signature}:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Error monitoring purchases:', error);
  }
};

// WebSocket monitoring for real-time updates
const setupWebSocketMonitoring = () => {
  try {
    const tokenPublicKey = new PublicKey(REVS_TOKEN_ADDRESS);
    
    // Subscribe to account changes
    const subscriptionId = connection.onAccountChange(
      tokenPublicKey,
      (accountInfo, context) => {
        if (monitoringState.isMonitoring) {
          console.log('🔔 WebSocket: Account change detected!');
          // Trigger immediate purchase check
          monitorPurchases();
        }
      },
      'confirmed'
    );

    console.log(`🔌 WebSocket monitoring enabled for REVS token`);
    return subscriptionId;
  } catch (err) {
    console.error('Error setting up WebSocket monitoring:', err);
    return null;
  }
};

// Start monitoring
const startMonitoring = () => {
  if (monitoringState.isMonitoring) {
    console.log('⚠️ Monitoring already active');
    return;
  }

  console.log('🚀 Starting REVS purchase monitoring...');
  monitoringState.isMonitoring = true;

  // Start polling interval
  monitoringState.monitoringInterval = setInterval(() => {
    if (monitoringState.isMonitoring) {
      monitorPurchases();
    }
  }, 10000); // Check every 10 seconds

  // Setup WebSocket monitoring
  monitoringState.webSocketSubscription = setupWebSocketMonitoring();

  console.log('✅ Monitoring started - API usage active');
};

// Stop monitoring
const stopMonitoring = () => {
  if (!monitoringState.isMonitoring) {
    console.log('⚠️ Monitoring already stopped');
    return;
  }

  console.log('⏹️ Stopping REVS purchase monitoring...');
  monitoringState.isMonitoring = false;

  // Clear polling interval
  if (monitoringState.monitoringInterval) {
    clearInterval(monitoringState.monitoringInterval);
    monitoringState.monitoringInterval = null;
  }

  // Note: WebSocket subscription remains active but won't trigger purchases
  console.log('✅ Monitoring stopped - API usage paused');
};

// Timer countdown
setInterval(() => {
  if (globalTimer.isActive && globalTimer.timeLeft > 0) {
    globalTimer.timeLeft -= 1;

    // Check for notification triggers
    const minutes = Math.floor(globalTimer.timeLeft / 60);
    const seconds = globalTimer.timeLeft % 60;
    
    // Send push notifications at specific intervals
    if (minutes === 10 && seconds === 0) {
      console.log('🔔 Sending 10-minute warning push notifications');
      // In a real implementation, you would send push notifications here
      // For now, we'll just log it
    } else if (minutes === 5 && seconds === 0) {
      console.log('🔔 Sending 5-minute warning push notifications');
    } else if (minutes === 1 && seconds === 0) {
      console.log('🔔 Sending 1-minute warning push notifications');
    }

    // Emit timer update to all connected clients
    io.emit('timerUpdate', {
      timeLeft: globalTimer.timeLeft,
      isActive: globalTimer.isActive
    });
  } else if (globalTimer.timeLeft === 0) {
    globalTimer.isActive = false;

    // Emit timer expired to all connected clients
    io.emit('timerExpired');
  }
}, 1000);

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send current timer state to new client
  socket.emit('timerState', {
    timeLeft: globalTimer.timeLeft,
    isActive: globalTimer.isActive,
    lastPurchaseTime: globalTimer.lastPurchaseTime,
    lastBuyerAddress: globalTimer.lastBuyerAddress,
    lastPurchaseAmount: globalTimer.lastPurchaseAmount,
    txSignature: globalTimer.lastTxSignature,
    isMonitoring: monitoringState.isMonitoring
  });

  // Handle monitoring control
  socket.on('startMonitoring', () => {
    if (isAdmin(socket)) {
      startMonitoring();
      io.emit('monitoringState', { isMonitoring: monitoringState.isMonitoring });
    } else {
      socket.emit('error', 'Unauthorized to start monitoring.');
    }
  });

  socket.on('stopMonitoring', () => {
    if (isAdmin(socket)) {
      stopMonitoring();
      io.emit('monitoringState', { isMonitoring: monitoringState.isMonitoring });
    } else {
      socket.emit('error', 'Unauthorized to stop monitoring.');
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });

  // Handle push notification subscriptions
  socket.on('subscribeNotifications', (subscription) => {
    console.log('New push notification subscription:', subscription.endpoint);
    pushSubscriptions.push(subscription);
  });
});

// Purchase logs for verification
let purchaseLogs = [];

// Root route - serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// API route for backend status
app.get('/api/status', (req, res) => {
  res.json({ 
    message: 'Treasury Vault Timer Backend',
    status: 'running',
    timestamp: new Date().toISOString(),
    token: REVS_TOKEN_ADDRESS,
    isMonitoring: monitoringState.isMonitoring
  });
});

// API routes
app.get('/api/timer', (req, res) => {
  res.json({
    ...globalTimer,
    isMonitoring: monitoringState.isMonitoring
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    isMonitoring: monitoringState.isMonitoring
  });
});

app.get('/api/purchases', (req, res) => {
  res.json({
    purchases: purchaseLogs.slice(-50), // Last 50 purchases
    total: purchaseLogs.length,
    tokenAddress: REVS_TOKEN_ADDRESS
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Monitoring BONK token: ${REVS_TOKEN_ADDRESS}`);
  console.log(`⏰ Global timer started at ${globalTimer.timeLeft} seconds`);
  console.log(`🔌 WebSocket monitoring: DISABLED`);
  console.log(`🎯 Only detecting ACTUAL PURCHASES (not transfers/airdrops)`);
  
  // Auto-start monitoring in production
  if (process.env.NODE_ENV === 'production') {
    console.log(`🚀 PRODUCTION MODE: Auto-starting monitoring...`);
    startMonitoring();
  } else {
    console.log(`⏸️ DEVELOPMENT MODE: Monitoring is PAUSED - use frontend to start/stop`);
  }
});
