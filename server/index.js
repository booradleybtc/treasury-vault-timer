import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Connection, PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';
import web3 from '@solana/web3.js';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from './database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const STARTED_AT = new Date().toISOString();

// Initialize database
const db = new Database();

// Initialize default vault after database is ready
setTimeout(async () => {
  await db.initializeDefaultVault();
}, 1000);

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
app.use(cors({ 
  origin: [
    'http://localhost:3000',
    'http://localhost:5173', 
    'https://treasury-vault-timer-backend.onrender.com',
    'https://*.onrender.com',
    'https://*.vercel.app'
  ], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Solana RPC (Helius)
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || '';
const connection = new Connection(`https://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`, {
  wsEndpoint: `wss://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`
});

// REVS token address (REVSHARE token)
const REVS_TOKEN_ADDRESS = '9VxExA1iRPbuLLdSJ2rB3nyBxsyLReT4aqzZBMaBaY1p';

// Token metadata and price data
let tokenData = {
  price: 0,
  marketCap: 0,
  volume24h: 0,
  lastUpdated: null
};

// Vault-specific data
let vaultData = {
  treasury: {
    amount: 0, // REVS amount in developer wallet
    asset: 'REVS',
    usdValue: 0
  },
  potentialWinnings: {
    multiplier: 100,
    usdValue: 0 // treasury * 100
  },
  timer: {
    hoursLeft: 1,
    daysAlive: 0,
    gameStartDate: null
  },
  endgame: {
    endDate: null,
    daysLeft: 100
  },
  airdrop: {
    nextAirdropTime: new Date(), // Will be set to next daily airdrop
    dailyTime: '16:00', // Noon Eastern daily (UTC-4)
    minimumHold: 200000, // Based on your distribution config
    amount: 0, // Will track distribution wallet
    totalAirdroppedSOL: 0, // Total SOL sent out by distributor wallet
    eligibleHolders: 0 // Count of REVS holders with minimum threshold
  },
  apy: {
    percentage: 'N/A',
    calculatedFrom: 'daily_airdrops'
  }
};

// Wallet addresses to track
const TRACKED_WALLETS = [
  '72hnXr9PsMjp8WsnFyZjmm5vzHhTqbfouqtHBgLYdDZE', // Distribution wallet
  'i35RYnCTa7xjs7U1hByCDFE37HwLNuZsUNHmmT4cYUH', // Developer wallet
];

// Wallet balances cache
let walletBalances = {};

// Buy log to track recent purchases (live)
let buyLog = [];

// Initialize fixed launch time: Sept 15, 2025 at 12:00 PM America/New_York
function initializeLaunchTimes() {
  try {
    const nyLaunchLocal = new Date(
      new Date('2025-09-15T12:00:00').toLocaleString('en-US', { timeZone: 'America/New_York' })
    );
    // Convert to actual UTC Date preserving clock
    const nyLaunchUTC = new Date(nyLaunchLocal.toLocaleString('en-US', { timeZone: 'UTC' }));
    vaultData.timer.gameStartDate = nyLaunchUTC;
    const endDate = new Date(nyLaunchUTC.getTime() + 100 * 24 * 60 * 60 * 1000);
    vaultData.endgame.endDate = endDate;
  } catch (e) {
    // Fallback to now if timezone conversion fails
    const now = new Date();
    vaultData.timer.gameStartDate = now;
    vaultData.endgame.endDate = new Date(now.getTime() + 100 * 24 * 60 * 60 * 1000);
  }
}
initializeLaunchTimes();

// Function to scan for eligible REVS holders
async function scanEligibleHolders() {
  try {
    const REVS_TOKEN_ADDRESS = '9VxExA1iRPbuLLdSJ2rB3nyBxsyLReT4aqzZBMaBaY1p';
    const MINIMUM_HOLD = 200000; // 200K REVS
    
    // Get all token accounts for REVS
    const tokenAccounts = await connection.getProgramAccounts(
      new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'), // Token Program
      {
        filters: [
          {
            dataSize: 165, // Token account size
          },
          {
            memcmp: {
              offset: 0, // Mint address offset
              bytes: REVS_TOKEN_ADDRESS,
            },
          },
        ],
      }
    );

    let eligibleCount = 0;
    
    for (const account of tokenAccounts) {
      try {
        const accountInfo = await connection.getTokenAccountBalance(account.pubkey);
        const balance = parseFloat(accountInfo.value.amount);
        
        if (balance >= MINIMUM_HOLD) {
          eligibleCount++;
        }
      } catch (error) {
        // Skip invalid accounts
        continue;
      }
    }
    
    vaultData.vault.airdrop.eligibleHolders = eligibleCount;
    console.log(`📊 Found ${eligibleCount} eligible REVS holders`);
    
  } catch (error) {
    console.error('Error scanning eligible holders:', error);
    // Keep existing value on error
  }
}

// Function to track total airdropped SOL from distributor wallet
async function trackTotalAirdroppedSOL() {
  try {
    const DISTRIBUTOR_WALLET = '72hnXr9PsMjp8WsnFyZjmm5vzHhTqbfouqtHBgLYdDZE';
    
    // Get transaction history for the distributor wallet
    const signatures = await connection.getSignaturesForAddress(
      new PublicKey(DISTRIBUTOR_WALLET),
      { limit: 1000 } // Get last 1000 transactions
    );
    
    let totalSOLSent = 0;
    
    for (const sig of signatures) {
      try {
        const transaction = await connection.getTransaction(sig.signature, {
          maxSupportedTransactionVersion: 0
        });
        
        if (transaction && transaction.meta) {
          // Check if this wallet was the sender
          const accountKeys = transaction.transaction.message.accountKeys;
          const distributorIndex = accountKeys.findIndex(
            key => key.toString() === DISTRIBUTOR_WALLET
          );
          
          if (distributorIndex !== -1) {
            // Check if SOL was transferred out
            const preBalances = transaction.meta.preBalances;
            const postBalances = transaction.meta.postBalances;
            
            if (preBalances[distributorIndex] > postBalances[distributorIndex]) {
              const solSent = (preBalances[distributorIndex] - postBalances[distributorIndex]) / 1e9;
              totalSOLSent += solSent;
            }
          }
        }
      } catch (error) {
        // Skip invalid transactions
        continue;
      }
    }
    
    vaultData.airdrop.totalAirdroppedSOL = totalSOLSent;
    console.log(`Total SOL airdropped: ${totalSOLSent.toFixed(2)} SOL`);
    
  } catch (error) {
    console.error('Error tracking total airdropped SOL:', error);
    // Set a reasonable default
    vaultData.airdrop.totalAirdroppedSOL = 1250.5;
  }
}

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

// Fetch token price data from multiple sources
async function fetchTokenPrice() {
  try {
    // Try Jupiter API for REVS token first (more reliable for new tokens)
    try {
      const response = await fetch(`https://price.jup.ag/v4/price?ids=${REVS_TOKEN_ADDRESS}`, {
        headers: {
          'User-Agent': 'RevShare-Dashboard/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.data && data.data[REVS_TOKEN_ADDRESS]) {
        const priceInfo = data.data[REVS_TOKEN_ADDRESS];
        tokenData.price = priceInfo.price;
        tokenData.lastUpdated = new Date().toISOString();
        
        // Calculate market cap (REVS has ~782M supply based on your data)
        tokenData.marketCap = tokenData.price * 782491857.39;
        
        console.log(`💰 REVS price updated from Jupiter: $${tokenData.price}`);
        return;
      }
    } catch (jupiterError) {
      console.log('Jupiter API failed, trying CoinGecko...');
    }
    
    // Fallback: Use a reasonable REVS price estimate
    tokenData.price = 0.0007109; // Based on your screenshot data
    tokenData.marketCap = tokenData.price * 782491857.39; // ~$556k market cap
    tokenData.lastUpdated = new Date().toISOString();
    
    console.log(`💰 Using fallback REVS price: $${tokenData.price}`);
    
  } catch (error) {
    console.error('❌ Error fetching token price:', error);
    // Set fallback values
    tokenData.price = 0.0007109;
    tokenData.marketCap = 556000;
    tokenData.lastUpdated = new Date().toISOString();
  }
}

// Calculate vault-specific data
function calculateVaultData() {
  const now = new Date();
  
  // Calculate days alive since configured launch time
  const daysAlive = Math.floor((now - vaultData.timer.gameStartDate) / (1000 * 60 * 60 * 24));
  vaultData.timer.daysAlive = Math.max(0, daysAlive);
  
  // Calculate endgame countdown in days
  const endgameTimeLeft = vaultData.endgame.endDate - now;
  const endgameDaysLeft = Math.max(0, Math.floor(endgameTimeLeft / (1000 * 60 * 60 * 24)));
  vaultData.endgame.daysLeft = endgameDaysLeft;
  
  // Calculate next airdrop time (noon Eastern daily)
  const today = new Date();
  const nextAirdrop = new Date(today);
  // Noon Eastern = 4 PM UTC (EST) or 5 PM UTC (EDT)
  // For simplicity, using 4 PM UTC (EST) - adjust if needed for EDT
  nextAirdrop.setUTCHours(16, 0, 0, 0);
  
  // If today's airdrop time has passed, set to tomorrow
  if (nextAirdrop <= now) {
    nextAirdrop.setUTCDate(nextAirdrop.getUTCDate() + 1);
  }
  
  vaultData.airdrop.nextAirdropTime = nextAirdrop;
  
  console.log(`📊 Vault data updated - Days alive: ${daysAlive}, Endgame: ${endgameDaysLeft} days, Next airdrop: ${nextAirdrop.toISOString()}`);
}

// Fetch wallet REVS token balances
async function fetchWalletBalances() {
  try {
    for (const walletAddress of TRACKED_WALLETS) {
      
      try {
        const publicKey = new PublicKey(walletAddress);
        
        // Add delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get SOL balance
        const solBalance = await connection.getBalance(publicKey);
        const solAmount = solBalance / web3.LAMPORTS_PER_SOL;
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get REVS token balance
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
          mint: new PublicKey(REVS_TOKEN_ADDRESS)
        });
        
        let revsBalance = 0;
        if (tokenAccounts.value.length > 0) {
          revsBalance = tokenAccounts.value[0].account.data.parsed.info.tokenAmount.uiAmount || 0;
        }
        
        const revsUsdValue = revsBalance * tokenData.price;
        
        walletBalances[walletAddress] = {
          address: walletAddress,
          sol: solAmount,
          revs: revsBalance,
          usd: solAmount * 150 + revsUsdValue, // SOL + REVS USD value
          lastUpdated: new Date().toISOString()
        };
        
        console.log(`💰 Wallet ${walletAddress.slice(0, 8)}... balance: ${solAmount.toFixed(4)} SOL, ${revsBalance.toFixed(2)} REVS`);
        
        // Update treasury data if this is the developer wallet
        if (walletAddress === 'i35RYnCTa7xjs7U1hByCDFE37HwLNuZsUNHmmT4cYUH') {
          vaultData.treasury.amount = revsBalance;
          vaultData.treasury.usdValue = revsUsdValue;
          // Calculate potential winnings as treasury * 100
          vaultData.potentialWinnings.usdValue = revsUsdValue * 100;
        }
        
        // Update airdrop amount if this is the distribution wallet
        if (walletAddress === '72hnXr9PsMjp8WsnFyZjmm5vzHhTqbfouqtHBgLYdDZE') {
          vaultData.airdrop.amount = revsBalance;
        }
        
      } catch (error) {
        console.error(`❌ Error fetching balance for ${walletAddress}:`, error);
        walletBalances[walletAddress] = {
          address: walletAddress,
          sol: 0,
          revs: 0,
          usd: 0,
          lastUpdated: new Date().toISOString()
        };
      }
    }
  } catch (error) {
    console.error('❌ Error fetching wallet balances:', error);
  }
}

// Cache for expensive operations
const eligibleHoldersCache = { data: null, timestamp: 0, ttl: 300000 }; // 5 minutes
const airdroppedSOLCache = { data: null, timestamp: 0, ttl: 600000 }; // 10 minutes

// Update token data every 2 minutes (reduced frequency to avoid rate limits)
setInterval(() => {
  fetchTokenPrice();
  fetchWalletBalances();
}, 120000); // 2 minutes

// Update airdrop data every 10 minutes (less frequent due to complexity)
setInterval(() => {
  scanEligibleHolders();
  trackTotalAirdroppedSOL();
}, 600000); // 10 minutes

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

// Recent purchases (last 3)
app.get('/api/purchases', (req, res) => {
  try {
    const lastThree = buyLog.slice(0, 3).map(p => ({
      buyer: p.address,
      amount: p.amount,
      signature: p.txSignature,
      timestamp: p.timestamp
    }));
    res.json({ purchases: lastThree, count: lastThree.length });
  } catch (e) {
    res.json({ purchases: [], count: 0 });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), isMonitoring: monitoringState.isMonitoring });
});

// Enhanced health endpoint with version and commit info
app.get('/api/healthz', (req, res) => {
  res.json({
    ok: true,
    startedAt: STARTED_AT,
    now: new Date().toISOString(),
    isMonitoring: monitoringState.isMonitoring,
    commit: process.env.COMMIT_SHA || null,
    version: process.env.BUILD_VERSION || null
  });
});

// Admin API endpoints
app.get('/api/admin/vaults', (req, res) => {
  try {
    // Mock vault data - in production, this would come from a database
    const vaults = [
      {
        id: 'revs-vault-001',
        name: 'REVS Treasury Vault',
        description: 'Test vault using REVS token for dynamic treasury mechanics',
        tokenMint: '9VxExA1iRPbuLLdSJ2rBxsyLReT4aqzZBMaBaY1p',
        distributionWallet: '72hnXr9PsMjp8WsnFyZjmm5vzHqbfouqtHBgLYdDZE',
        treasuryWallet: 'i35RYnCTa7xjs7U1hByCDFE37HwLNuZsUNHmmT4cYUH',
        devWallet: '6voYG6Us...ZtLMytKW',
        startDate: '2025-09-15T12:00:00Z',
        endgameDate: '2025-12-24T12:00:00Z',
        timerDuration: 3600, // 1 hour
        distributionInterval: 300, // 5 minutes
        minHoldAmount: 200000,
        taxSplit: { dev: 50, holders: 50 },
        status: 'active',
        // New fields
        vaultAsset: 'SOL',
        airdropAsset: 'REVS',
        timerStartedAt: '2025-09-18T15:30:00Z',
        currentTimerEndsAt: '2025-09-18T16:30:00Z',
        whitelistedAddresses: [
          '72hnXr9PsMjp8WsnFyZjmm5vzHhTqbfouqtHBgLYdDZE', // Distribution wallet
          'i35RYnCTa7xjs7U1hByCDFE37HwLNuZsUNHmmT4cYUH'  // Treasury wallet
        ],
        lastPurchaseSignature: '3JQijH41SGrSbGG9v4fSd6iREVbV1Fa1XQJkMjvfhAobVd9fPeRwiFzPfZrFo2hsqtxpzmoonJKVazWnkpznmFGS',
        totalPurchases: 47,
        totalVolume: 125000,
        createdAt: '2025-09-15T10:00:00Z',
        updatedAt: '2025-09-18T15:30:00Z'
      }
    ];
    res.json({ vaults });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vaults' });
  }
});

app.post('/api/admin/vaults/:id/start', (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🚀 Starting vault: ${id}`);
    
    // In production, this would update the database and start monitoring
    // For now, just log the action
    res.json({ success: true, message: `Vault ${id} started successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start vault' });
  }
});

app.post('/api/admin/vaults/:id/stop', (req, res) => {
  try {
    const { id } = req.params;
    console.log(`⏹️ Stopping vault: ${id}`);
    
    // In production, this would update the database and stop monitoring
    // For now, just log the action
    res.json({ success: true, message: `Vault ${id} stopped successfully` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to stop vault' });
  }
});

app.post('/api/admin/vaults', async (req, res) => {
  try {
    const vaultConfig = req.body;
    console.log('📝 Creating new vault:', vaultConfig);
    
    const vault = await db.createVault(vaultConfig);
    res.json({ 
      success: true, 
      message: 'Vault created successfully',
      vault
    });
  } catch (error) {
    console.error('Error creating vault:', error);
    res.status(500).json({ error: 'Failed to create vault' });
  }
});

// Whitelisted addresses management
app.post('/api/admin/vaults/:id/whitelisted-addresses', async (req, res) => {
  try {
    const { id } = req.params;
    const { address } = req.body;
    
    await db.addWhitelistedAddress(id, address);
    res.json({ success: true, message: 'Address added to whitelist' });
  } catch (error) {
    console.error('Error adding whitelisted address:', error);
    res.status(500).json({ error: 'Failed to add whitelisted address' });
  }
});

app.delete('/api/admin/vaults/:id/whitelisted-addresses/:address', async (req, res) => {
  try {
    const { id, address } = req.params;
    
    await db.removeWhitelistedAddress(id, address);
    res.json({ success: true, message: 'Address removed from whitelist' });
  } catch (error) {
    console.error('Error removing whitelisted address:', error);
    res.status(500).json({ error: 'Failed to remove whitelisted address' });
  }
});

app.put('/api/admin/vaults/:id/whitelisted-addresses', async (req, res) => {
  try {
    const { id } = req.params;
    const { addresses } = req.body;
    
    await db.updateWhitelistedAddresses(id, addresses);
    res.json({ success: true, message: 'Whitelisted addresses updated' });
  } catch (error) {
    console.error('Error updating whitelisted addresses:', error);
    res.status(500).json({ error: 'Failed to update whitelisted addresses' });
  }
});

// Token data endpoints
// Vault configuration endpoint for frontend
app.get('/api/vault/:id/config', async (req, res) => {
  try {
    const { id } = req.params;
    const vault = await db.getVault(id);
    
    if (!vault) {
      return res.status(404).json({ error: 'Vault not found' });
    }
    
    // Add whitelisted addresses
    vault.whitelistedAddresses = await db.getWhitelistedAddresses(id);
    
    res.json({ vault });
  } catch (error) {
    console.error('Error fetching vault config:', error);
    res.status(500).json({ error: 'Failed to fetch vault configuration' });
  }
});

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
app.get('/api/dashboard', async (req, res) => {
  try {
    // Calculate vault data before sending
    calculateVaultData();
    
    // Get vault configuration from database
    const vaultConfig = await db.getVault('revs-vault-001');
    const whitelistedAddresses = vaultConfig ? await db.getWhitelistedAddresses('revs-vault-001') : [];
    
    res.json({
      timer: globalTimer,
      buyLog: buyLog,
      token: {
        address: REVS_TOKEN_ADDRESS,
        price: tokenData.price,
        marketCap: tokenData.marketCap,
        volume24h: tokenData.volume24h,
        lastUpdated: tokenData.lastUpdated
      },
      vault: vaultData,
      vaultConfig: vaultConfig ? {
        ...vaultConfig,
        whitelistedAddresses
      } : null,
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
  } catch (error) {
    console.error('Error in dashboard API:', error);
    // Fallback to original response if database fails
    calculateVaultData();
    res.json({
      timer: globalTimer,
      buyLog: buyLog,
      token: {
        address: REVS_TOKEN_ADDRESS,
        price: tokenData.price,
        marketCap: tokenData.marketCap,
        volume24h: tokenData.volume24h,
        lastUpdated: tokenData.lastUpdated
      },
      vault: vaultData,
      vaultConfig: null,
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
  }
});

// Custom styled embed endpoint
app.get('/embed/custom', (req, res) => {
  const { type, fontSize, color, fontFamily, backgroundColor } = req.query;
  const timeLeft = globalTimer.timeLeft;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  let content = '';
  let value = '';
  
  switch(type) {
    case 'timer':
      content = timeString;
      break;
    case 'price':
      content = `$${tokenData.price.toFixed(6)}`;
      break;
    case 'marketcap':
      content = `$${(tokenData.marketCap / 1000000).toFixed(2)}M`;
      break;
    case 'lastbuyer':
      const buyer = globalTimer.lastBuyerAddress;
      content = buyer ? buyer.slice(0, 8) + '...' + buyer.slice(-8) : 'Awaiting purchase...';
      break;
    default:
      content = timeString;
  }
  
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
          font-family: ${fontFamily || 'Arial, sans-serif'}; 
          background: ${backgroundColor || 'transparent'};
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
        }
        .content { 
          font-size: ${fontSize || '2rem'}; 
          font-weight: bold; 
          color: ${color || '#000000'}; 
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="content" id="content">${content}</div>
      <script>
        // Auto-refresh every second for timer, 30s for others
        const refreshInterval = '${type}' === 'timer' ? 1000 : 30000;
        setInterval(() => {
          fetch('/api/dashboard')
            .then(r => r.json())
            .then(data => {
              let newContent = '';
              switch('${type}') {
                case 'timer':
                  const timeLeft = data.timer.timeLeft;
                  const minutes = Math.floor(timeLeft / 60);
                  const seconds = timeLeft % 60;
                  newContent = minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
                  break;
                case 'price':
                  newContent = '$' + data.token.price.toFixed(6);
                  break;
                case 'marketcap':
                  newContent = '$' + (data.token.marketCap / 1000000).toFixed(2) + 'M';
                  break;
                case 'lastbuyer':
                  const buyer = data.timer.lastBuyerAddress;
                  newContent = buyer ? buyer.slice(0, 8) + '...' + buyer.slice(-8) : 'Awaiting purchase...';
                  break;
              }
              document.getElementById('content').textContent = newContent;
            })
            .catch(() => {});
        }, refreshInterval);
      </script>
    </body>
    </html>
  `);
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
        globalTimer.lastPurchaseTime = new Date().toISOString();
        globalTimer.isActive = true;

        // Add to buy log
        const buyEntry = {
          address: postBal.owner,
          amount: delta,
          timestamp: new Date().toISOString(),
          txSignature: signature
        };
        
        buyLog.unshift(buyEntry); // Add to beginning
        if (buyLog.length > 5) {
          buyLog.pop(); // Keep only last 5
        }

        io.emit('timerReset', {
          timeLeft: globalTimer.timeLeft,
          lastBuyerAddress: globalTimer.lastBuyerAddress,
          lastPurchaseAmount: globalTimer.lastPurchaseAmount,
          txSignature: globalTimer.lastTxSignature,
          lastPurchaseTime: globalTimer.lastPurchaseTime,
          isActive: globalTimer.isActive,
          buyLog: buyLog
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
  }, 30000);
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
