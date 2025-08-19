import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Connection, PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = createServer(app);
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
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    methods: ["GET", "POST"],
    credentials: true
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

// REVS token address (Token-2022 revshare token for testing)
const REVS_TOKEN_ADDRESS = '9VxExA1iRPbuLLdSJ2rB3nyBxsyLReT4aqzZBMaBaY1p';

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

// Function to check if transaction is an actual PURCHASE (not transfer/airdrop/burn)
const checkIfActualPurchase = (transaction) => {
  try {
    const txSignature = transaction.transaction.signatures[0];
    const preBalances = transaction.meta.preBalances || [];
    const postBalances = transaction.meta.postBalances || [];
    const accountKeys = transaction.transaction.message.accountKeys || [];
    const instructions = transaction.transaction.message.instructions || [];
    const preTokenBalances = transaction.meta.preTokenBalances || [];
    const postTokenBalances = transaction.meta.postTokenBalances || [];

    console.log(`🔍 Analyzing transaction: ${txSignature.slice(0, 8)}...`);

    // Check for BURN transactions (should be excluded)
    const tokenPreBalances = preTokenBalances.filter(balance => balance.mint === REVS_TOKEN_ADDRESS);
    const tokenPostBalances = postTokenBalances.filter(balance => balance.mint === REVS_TOKEN_ADDRESS);
    
    // If there are pre-balances but no post-balances for our token, it's likely a burn
    if (tokenPreBalances.length > 0 && tokenPostBalances.length === 0) {
      console.log(`🔥 BURN detected - EXCLUDING from timer reset`);
      console.log(`🔗 Transaction: https://solscan.io/tx/${txSignature}`);
      return false;
    }

    // Check for burn patterns in transaction instructions
    for (const instruction of instructions) {
      const programId = accountKeys[instruction.programIdIndex];
      if (programId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') {
        // Check if this is a burn instruction
        if (instruction.data && instruction.data.length > 0) {
          // Burn instruction typically has specific data pattern
          const data = Buffer.from(instruction.data, 'base64');
          if (data.length >= 1 && data[0] === 8) { // Burn instruction code
            console.log(`🔥 Token burn instruction detected - EXCLUDING from timer reset`);
            console.log(`🔗 Transaction: https://solscan.io/tx/${txSignature}`);
            return false;
          }
        }
      }
    }

    // Check if distributor/dev wallets are involved in token balance changes
    const excludedWallets = [
      '72hnXr9PsMjp8WsnFyZjmm5vzHhTqbfouqtHBgLYdDZE', // REVS Distributor wallet
    ];
    
    for (const balance of [...tokenPreBalances, ...tokenPostBalances]) {
      if (excludedWallets.includes(balance.owner)) {
        console.log(`🚫 Distributor/Dev wallet involved in transaction: ${balance.owner} - EXCLUDING from timer reset`);
        console.log(`🔗 Transaction: https://solscan.io/tx/${txSignature}`);
        return false;
      }
    }

    // Check for burn wallet patterns (common burn addresses)
    const burnWalletPatterns = [
      '11111111111111111111111111111111', // System Program (often used for burns)
      'Burn111111111111111111111111111111111111111', // Common burn address
    ];
    
    // Check for distributor/dev wallet patterns (should be excluded)
    const excludedWalletPatterns = [
      '72hnXr9PsMjp8WsnFyZjmm5vzHhTqbfouqtHBgLYdDZE', // REVS Distributor wallet
      // Add other known distributor/dev wallets here
    ];
    
    // LP pool wallets - we want to exclude SELLS (users sending REVS to LP) but allow BUYS (users receiving REVS from LP)
    const lpPoolWallets = [
      '8pN9qCiZg3KPg79R5cL4AF9xXVTWoJPxaVWf5ormvCwa', // Main REVS/SOL pool
      // 'GpMZbSM2GgvTKHJirzeGfMFoaZ8UR2X7F4v8vHTvxFbL', // This is actually a Raydium vault authority, not LP pool
      // Comment out other pools for testing
      // 'H3pnJpddNdcuuGnmVGhhWNeop8zgPwgnzKg9UPRxBKke', // REVS/RAY pool
      // 'DkQroLagNZhGC82aGkpdymZiv2UmSfsoppNJ6Ru6amun', // REVS/JUP pool
    ];
    
    // Raydium vault authority addresses (these are the actual addresses that appear in transfers)
    const raydiumVaultAuthorities = [
      '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium Vault Authority #1
      '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1', // Raydium Vault Authority #2
      '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', // Raydium Vault Authority #3
      'GpMZbSM2GgvTKHJirzeGfMFoaZ8UR2X7F4v8vHTvxFbL', // Raydium Vault Authority #4 (was incorrectly in lpPoolWallets)
    ];
    
    // Check if this is a SELL transaction (user sending REVS to LP pool)
    for (const balance of tokenPreBalances) {
      if (lpPoolWallets.includes(balance.owner)) {
        // User is sending REVS to LP pool (SELL) - exclude this
        console.log(`📉 SELL detected - user sending REVS to LP pool: ${balance.owner} - EXCLUDING from timer reset`);
        console.log(`🔗 Transaction: https://solscan.io/tx/${txSignature}`);
        return false;
      }
    }
    
    // Check for BUYS from Raydium vault authorities (users receiving REVS from LP)
    // When user buys, Raydium vault authority appears in tokenPreBalances as the source
    for (const balance of tokenPreBalances) {
      if (raydiumVaultAuthorities.includes(balance.owner)) {
        // Check if this is a BUY (user receiving tokens from vault)
        // Look for a corresponding post balance for a user wallet
        const userReceivedTokens = tokenPostBalances.some(postBalance => 
          !raydiumVaultAuthorities.includes(postBalance.owner) && 
          !excludedWalletPatterns.includes(postBalance.owner) &&
          postBalance.owner !== balance.owner
        );
        
        if (userReceivedTokens) {
          console.log(`✅ BUY detected - user receiving REVS from Raydium vault: ${balance.owner} - TRIGGERING timer reset`);
          console.log(`🔗 Transaction: https://solscan.io/tx/${txSignature}`);
          return true;
        }
      }
    }
    
    // Check for SELLS to Raydium vault authorities (users sending REVS to LP)
    for (const balance of tokenPostBalances) {
      if (raydiumVaultAuthorities.includes(balance.owner)) {
        // User is sending REVS to Raydium vault (SELL) - exclude this
        console.log(`📉 SELL detected - user sending REVS to Raydium vault: ${balance.owner} - EXCLUDING from timer reset`);
        console.log(`🔗 Transaction: https://solscan.io/tx/${txSignature}`);
        return false;
      }
    }

    for (const accountKey of accountKeys) {
      if (burnWalletPatterns.includes(accountKey)) {
        console.log(`🔥 Burn wallet detected: ${accountKey} - EXCLUDING from timer reset`);
        console.log(`🔗 Transaction: https://solscan.io/tx/${txSignature}`);
        return false;
      }
      
      if (excludedWalletPatterns.includes(accountKey)) {
        console.log(`🚫 Distributor/Dev wallet detected: ${accountKey} - EXCLUDING from timer reset`);
        console.log(`🔗 Transaction: https://solscan.io/tx/${txSignature}`);
        return false;
      }
    }

    // Check if transaction involves SOL payment (buyer spent SOL)
    for (let i = 0; i < postBalances.length; i++) {
      const preBalance = preBalances[i] || 0;
      const postBalance = postBalances[i] || 0;
      const solDecrease = preBalance - postBalance;

      // If someone spent SOL (more than just transaction fee), it's likely a purchase
      if (solDecrease > 0.01) { // More than 0.01 SOL (accounting for fees)
        console.log(`✅ SOL spent: ${solDecrease / 1e9} SOL - ACTUAL PURCHASE`);
        console.log(`🔗 Transaction: https://solscan.io/tx/${txSignature}`);
        return true;
      }
    }

    // Check for DEX program interactions (where purchases happen)
    for (const programId of knownDEXPrograms) {
      if (accountKeys.includes(programId)) {
        console.log(`✅ DEX program detected: ${programId} - ACTUAL PURCHASE`);
        console.log(`🔗 Transaction: https://solscan.io/tx/${txSignature}`);
        return true;
      }
    }

    // Check for swap instructions in transaction
    for (const instruction of instructions) {
      const programId = accountKeys[instruction.programIdIndex];
      if (knownDEXPrograms.includes(programId)) {
        console.log(`✅ Swap instruction detected - ACTUAL PURCHASE`);
        console.log(`🔗 Transaction: https://solscan.io/tx/${txSignature}`);
        return true;
      }
    }

    console.log(`❌ No purchase indicators found - likely a TRANSFER/AIRDROP/BURN`);
    console.log(`🔗 Transaction: https://solscan.io/tx/${txSignature}`);
    return false;
  } catch (err) {
    console.warn('Error checking if purchase:', err);
    // If we can't determine, assume it's NOT a purchase to be safe
    return false;
  }
};

// Monitor purchases with improved detection
const monitorPurchases = async () => {
  try {
    const tokenPublicKey = new PublicKey(REVS_TOKEN_ADDRESS);

    // Get recent transactions for the token
    const signatures = await connection.getSignaturesForAddress(
      tokenPublicKey,
      { limit: 50 }
    );

    console.log(`Found ${signatures.length} recent transactions for REVS`);

    // Filter out already checked transactions
    let newTransactions = signatures;
    if (globalTimer.lastCheckedSignature) {
      const lastCheckedIndex = signatures.findIndex(sig => sig.signature === globalTimer.lastCheckedSignature);
      if (lastCheckedIndex !== -1) {
        newTransactions = signatures.slice(0, lastCheckedIndex);
      }
    }

    console.log(`Checking ${newTransactions.length} new transactions`);

    // Update the last checked signature
    if (signatures.length > 0) {
      globalTimer.lastCheckedSignature = signatures[0].signature;
    }

    // Check each transaction for actual token purchases
    for (const sig of newTransactions) {
      try {
        // Get the full transaction data
        const transaction = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0,
        });

        if (!transaction || !transaction.meta) {
          console.log(`Transaction ${sig.signature.slice(0, 8)}... has no meta data`);
          continue;
        }

        // Check if this transaction involves token transfers
        const preTokenBalances = transaction.meta.preTokenBalances || [];
        const postTokenBalances = transaction.meta.postTokenBalances || [];

        // Look for our specific token in the balances
        const tokenPreBalances = preTokenBalances.filter(
          balance => balance.mint === REVS_TOKEN_ADDRESS
        );
        const tokenPostBalances = postTokenBalances.filter(
          balance => balance.mint === REVS_TOKEN_ADDRESS
        );

        // Check if there was a net increase in token balance (purchase)
        for (let i = 0; i < tokenPostBalances.length; i++) {
          const postBalance = tokenPostBalances[i];
          const preBalance = tokenPreBalances.find(
            pre => pre.owner === postBalance.owner
          );

          if (preBalance) {
            // Use raw amounts and convert manually to ensure correct decimal handling
            const preAmountRaw = parseInt(preBalance.uiTokenAmount.amount || '0');
            const postAmountRaw = parseInt(postBalance.uiTokenAmount.amount || '0');
            const decimals = preBalance.uiTokenAmount.decimals || 9; // REVS has 9 decimals
            
            const preAmount = preAmountRaw / Math.pow(10, decimals);
            const postAmount = postAmountRaw / Math.pow(10, decimals);
            const netIncrease = postAmount - preAmount;

            // Check if at least 1 token was purchased
            if (netIncrease >= 1) {
              // CRITICAL: Check if this is an actual purchase (not just a transfer)
              const isActualPurchase = checkIfActualPurchase(transaction);

              if (isActualPurchase) {
                console.log(`🎯 REVS PURCHASE DETECTED: ${netIncrease} tokens by ${postBalance.owner}`);

                // Log purchase details for verification
                const purchaseLog = {
                  timestamp: new Date().toISOString(),
                  signature: sig.signature,
                  buyerAddress: postBalance.owner,
                  amount: netIncrease,
                  solscanUrl: `https://solscan.io/tx/${sig.signature}`,
                  jupiterUrl: `https://jup.ag/swap/SOL-REVS`
                };
                purchaseLogs.push(purchaseLog);

                // Reset global timer
                globalTimer.timeLeft = 3600;
                globalTimer.isActive = true;
                globalTimer.lastPurchaseTime = new Date();
                globalTimer.lastBuyerAddress = postBalance.owner;
                globalTimer.lastPurchaseAmount = netIncrease;
                globalTimer.lastTxSignature = sig.signature;

                // Emit timer reset to all connected clients
                io.emit('timerReset', {
                  timeLeft: globalTimer.timeLeft,
                  lastPurchaseTime: globalTimer.lastPurchaseTime,
                  lastBuyerAddress: globalTimer.lastBuyerAddress,
                  lastPurchaseAmount: globalTimer.lastPurchaseAmount,
                  txSignature: globalTimer.lastTxSignature
                });

                console.log('🎉 Global timer reset - all clients notified');
                return; // Exit after finding first purchase
              } else {
                console.log(`🚫 Transfer/Airdrop ignored: ${netIncrease} tokens by ${postBalance.owner}`);
              }
            }
          } else {
            console.log(`🆕 New holder: ${postBalance.owner.slice(0, 8)}... with ${postBalance.uiTokenAmount.uiAmount} tokens`);
          }
        }
      } catch (txErr) {
        console.warn('Error parsing transaction:', txErr);
        continue;
      }
    }
  } catch (err) {
    console.error('Error monitoring purchases:', err);
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

// Push notification subscriptions
let pushSubscriptions = [];

// Root route
app.get('/', (req, res) => {
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
  console.log(`📡 Monitoring REVS token: ${REVS_TOKEN_ADDRESS}`);
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
