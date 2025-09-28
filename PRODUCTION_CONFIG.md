# Production Configuration Guide

## 🔐 Critical Security Setup

### 1. Environment Variables

#### Backend (Render) Environment Variables:
```bash
# Core Configuration
NODE_ENV=production
PORT=3001
DATABASE_PATH=/opt/render/project/server/data/vaults.db

# External Services
HELIUS_API_KEY=466f06cf-0f8e-4f05-9c46-a95cb4a83f67

# Security (CRITICAL - Generate secure values)
ADMIN_KEY=your_secure_admin_key_here
WEBHOOK_SECRET=your_secure_webhook_secret_here

# Frontend URL
FRONTEND_URL=https://treasury-vault-timer.vercel.app

# Optional Monitoring
SENTRY_DSN=your_sentry_dsn_here
LOG_LEVEL=info
```

#### Frontend (Vercel) Environment Variables:
```bash
# Backend URL
NEXT_PUBLIC_BACKEND_URL=https://treasury-vault-timer-backend.onrender.com

# Optional Features
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_vapid_public_key_here
NEXT_PUBLIC_GA_ID=your_google_analytics_id_here
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
```

### 2. Generate Secure Keys

Run these commands to generate secure keys:

```bash
# Generate Admin Key (32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Generate Webhook Secret (32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## 🚨 Security Issues to Fix

### 1. Hardcoded API Key
**Issue**: Helius API key is hardcoded in multiple files
**Fix**: Move to environment variables only

### 2. Missing Admin Authentication
**Issue**: Admin panel lacks proper authentication
**Fix**: Implement secure admin key validation

### 3. CORS Configuration
**Issue**: Overly permissive CORS settings
**Fix**: Restrict to specific production domains

### 4. Missing Rate Limiting
**Issue**: No API rate limiting implemented
**Fix**: Add rate limiting middleware

## 📊 Production Checklist

### ✅ Infrastructure
- [x] Pro Vercel account
- [x] Pro Render account with persistent storage
- [x] Domain configuration
- [x] SSL certificates (automatic with Vercel/Render)

### 🔧 Backend (Render)
- [ ] Set all environment variables
- [ ] Configure persistent storage mount
- [ ] Set up health monitoring
- [ ] Configure log aggregation
- [ ] Set up automated backups

### 🎨 Frontend (Vercel)
- [ ] Set environment variables
- [ ] Configure custom domain
- [ ] Set up analytics
- [ ] Configure error tracking
- [ ] Set up performance monitoring

### 🔐 Security
- [ ] Generate secure admin keys
- [ ] Configure webhook secrets
- [ ] Set up rate limiting
- [ ] Implement input validation
- [ ] Configure CORS properly
- [ ] Set up monitoring alerts

### 📈 Monitoring
- [ ] Set up uptime monitoring
- [ ] Configure error tracking
- [ ] Set up performance monitoring
- [ ] Configure log aggregation
- [ ] Set up alert notifications

## 🚀 Next Steps

1. **Immediate (Today)**:
   - Generate secure admin and webhook keys
   - Update Render environment variables
   - Update Vercel environment variables
   - Test production deployment

2. **This Week**:
   - Implement rate limiting
   - Set up monitoring and alerts
   - Configure error tracking
   - Set up automated backups

3. **Next Week**:
   - Performance optimization
   - Load testing
   - Documentation updates
   - User acceptance testing

## 🔗 Useful Links

- [Render Dashboard](https://dashboard.render.com)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Helius Dashboard](https://dashboard.helius.xyz)
- [Sentry Error Tracking](https://sentry.io)
