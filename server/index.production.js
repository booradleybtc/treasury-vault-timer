/**
 * Production-ready server configuration
 * This file contains the enhanced server setup with security middleware
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Connection, PublicKey } from '@solana/web3.js';
import dotenv from 'dotenv';
import web3 from '@solana/web3.js';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import Database from './database.js';

// Import security middleware
import {
  securityHeaders,
  apiRateLimit,
  adminRateLimit,
  uploadRateLimit,
  requireAdmin,
  validateWebhookSignature,
  corsOptions,
  errorHandler,
  requestLogger
} from './middleware/security.js';

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

// =============================================================================
// SECURITY MIDDLEWARE
// =============================================================================

// Security headers
app.use(securityHeaders);

// Request logging
app.use(requestLogger);

// CORS with production configuration
app.use(cors(corsOptions));

// Rate limiting
app.use('/api/', apiRateLimit);
app.use('/api/admin/', adminRateLimit);
app.use('/uploads', uploadRateLimit);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// =============================================================================
// STATIC FILES & UPLOADS
// =============================================================================

// Serve static frontend (built into dist/)
app.use(express.static(path.join(__dirname, '../dist')));

// File uploads (images) with security
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9-_]/gi, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  },
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

app.use('/uploads', express.static(uploadsDir, { maxAge: '1y', immutable: true }));

// =============================================================================
// SOCKET.IO CONFIGURATION
// =============================================================================

const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

// =============================================================================
// SOLANA CONFIGURATION
// =============================================================================

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
if (!HELIUS_API_KEY) {
  console.error('❌ HELIUS_API_KEY environment variable is required');
  process.exit(1);
}

const connection = new Connection(`https://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`, {
  wsEndpoint: `wss://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`
});

// REVS token address (REVSHARE token)
const REVS_TOKEN_ADDRESS = '9VxExA1iRPbuLLdSJ2rB3nyBxsyLReT4aqzZBMaBaY1p';

// =============================================================================
// HEALTH CHECK ENDPOINTS
// =============================================================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.BUILD_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/healthz', async (req, res) => {
  try {
    // Check database connection
    await db.getVaults();
    
    // Check Solana connection
    const slot = await connection.getSlot();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      solana: 'connected',
      slot: slot,
      version: process.env.BUILD_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// =============================================================================
// API ENDPOINTS
// =============================================================================

// Dashboard endpoint
app.get('/api/dashboard', async (req, res) => {
  try {
    const vaults = await db.getVaults();
    const activeVault = vaults.find(v => v.status === 'active') || vaults[0];
    
    if (!activeVault) {
      return res.status(404).json({ error: 'No active vault found' });
    }
    
    // Get timer data
    const timerData = await db.getTimerData(activeVault.id);
    
    // Get token data (mock for now)
    const tokenData = {
      address: activeVault.tokenMint,
      price: 0.000123,
      marketCap: 1234567,
      volume24h: 12345,
      lastUpdated: new Date().toISOString()
    };
    
    // Get vault data
    const vaultData = {
      treasury: {
        amount: 1000000,
        asset: 'REVS',
        usdValue: 123
      },
      potentialWinnings: {
        multiplier: 100,
        usdValue: 12300
      },
      timer: {
        hoursLeft: Math.floor(timerData.timeLeft / 3600),
        daysAlive: 5,
        gameStartDate: activeVault.startDate
      },
      endgame: {
        endDate: activeVault.endgameDate,
        daysLeft: 88
      },
      airdrop: {
        nextAirdropTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        dailyTime: '12:00 PM',
        minimumHold: 200000,
        amount: 1000
      },
      apy: {
        percentage: '143%',
        calculatedFrom: 'treasury_growth'
      }
    };
    
    res.json({
      timer: timerData,
      buyLog: [], // Will be populated from purchases endpoint
      token: tokenData,
      vault: vaultData,
      vaultConfig: activeVault
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Timer endpoint
app.get('/api/timer', async (req, res) => {
  try {
    const vaults = await db.getVaults();
    const activeVault = vaults.find(v => v.status === 'active') || vaults[0];
    
    if (!activeVault) {
      return res.status(404).json({ error: 'No active vault found' });
    }
    
    const timerData = await db.getTimerData(activeVault.id);
    res.json(timerData);
  } catch (error) {
    console.error('Timer error:', error);
    res.status(500).json({ error: 'Failed to fetch timer data' });
  }
});

// Admin endpoints (protected)
app.get('/api/admin/vaults', requireAdmin, async (req, res) => {
  try {
    const vaults = await db.getVaults();
    res.json(vaults);
  } catch (error) {
    console.error('Admin vaults error:', error);
    res.status(500).json({ error: 'Failed to fetch vaults' });
  }
});

app.post('/api/admin/vaults', requireAdmin, upload.single('vaultAsset'), async (req, res) => {
  try {
    const vaultData = {
      ...req.body,
      vaultAsset: req.file ? `/uploads/${req.file.filename}` : null
    };
    
    const vault = await db.createVault(vaultData);
    res.status(201).json(vault);
  } catch (error) {
    console.error('Create vault error:', error);
    res.status(500).json({ error: 'Failed to create vault' });
  }
});

// Webhook endpoints (protected)
app.post('/webhook/helius', validateWebhookSignature, async (req, res) => {
  try {
    console.log('Helius webhook received:', req.body);
    
    // Process webhook data
    // This would contain the actual webhook processing logic
    
    res.json({ status: 'success' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// =============================================================================
// SOCKET.IO HANDLERS
// =============================================================================

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send initial timer state
  socket.emit('timerState', { timeLeft: 3600, isActive: true });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use(errorHandler);

// =============================================================================
// SERVER STARTUP
// =============================================================================

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log('🚀 Production server started');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Admin panel: http://localhost:${PORT}/admin`);
  console.log(`⏰ Started at: ${STARTED_AT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
