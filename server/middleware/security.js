/**
 * Security middleware for production deployment
 */

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';

// Rate limiting configuration
export const createRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/api/health' || req.path === '/api/healthz';
    }
  });
};

// API rate limiting (more restrictive)
export const apiRateLimit = createRateLimit(15 * 60 * 1000, 50);

// Admin rate limiting (very restrictive)
export const adminRateLimit = createRateLimit(15 * 60 * 1000, 10);

// File upload rate limiting
export const uploadRateLimit = createRateLimit(60 * 1000, 5);

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "https:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Input validation middleware
export const validateInput = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array()
      });
    }
    
    next();
  };
};

// Common validation rules
export const commonValidations = {
  // Vault ID validation
  vaultId: body('id').isUUID().withMessage('Invalid vault ID format'),
  
  // Token address validation
  tokenAddress: body('tokenMint').matches(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/).withMessage('Invalid Solana token address'),
  
  // Wallet address validation
  walletAddress: body('address').matches(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/).withMessage('Invalid Solana wallet address'),
  
  // Numeric validation
  positiveNumber: body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  
  // String validation
  nonEmptyString: body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  
  // URL validation
  validUrl: body('url').isURL().withMessage('Invalid URL format'),
  
  // Email validation
  validEmail: body('email').isEmail().withMessage('Invalid email format')
};

// Admin authentication middleware
export const requireAdmin = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'] || req.body.adminKey;
  const expectedKey = process.env.ADMIN_KEY;
  
  if (!expectedKey) {
    return res.status(500).json({ error: 'Admin authentication not configured' });
  }
  
  if (!adminKey || adminKey !== expectedKey) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
  
  next();
};

// Webhook signature validation
export const validateWebhookSignature = (req, res, next) => {
  const signature = req.headers['x-webhook-signature'];
  const expectedSecret = process.env.WEBHOOK_SECRET;
  
  if (!expectedSecret) {
    return res.status(500).json({ error: 'Webhook validation not configured' });
  }
  
  if (!signature) {
    return res.status(401).json({ error: 'Missing webhook signature' });
  }
  
  // Simple signature validation (in production, use proper HMAC)
  if (signature !== expectedSecret) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }
  
  next();
};

// CORS configuration for production
export const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://treasury-vault-timer.vercel.app',
      'https://treasury-vault-timer-backend.onrender.com',
      // Add your custom domains here
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Admin-Key', 'X-Webhook-Signature'],
  maxAge: 86400 // 24 hours
};

// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
  
  res.status(500).json({
    error: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });
};

// Request logging middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };
    
    if (res.statusCode >= 400) {
      console.error('Request Error:', logData);
    } else {
      console.log('Request:', logData);
    }
  });
  
  next();
};
