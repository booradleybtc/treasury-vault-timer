# Treasury Vault Timer - Render Deployment Guide

## Overview
This guide will help you deploy your Treasury Vault Timer backend to Render with persistent storage for long-running vaults.

## Current Status
✅ Backend server with comprehensive APIs  
✅ SQLite database with 8 vaults already configured  
✅ Real-time timer management with Solana integration  
✅ File upload support for vault assets  
✅ Admin panel for vault management  

## Deployment Steps

### 1. Prerequisites
- GitHub repository with latest code
- Render account
- Helius API key (already configured)

### 2. Render Configuration

#### Service Configuration:
- **Service Type**: Web Service
- **Environment**: Node
- **Plan**: Starter (recommended for production)
- **Build Command**: `npm ci`
- **Start Command**: `npm start`
- **Root Directory**: `server`

#### Persistent Storage:
- **Disk Name**: `vault-data`
- **Mount Path**: `/opt/render/project/server/data`
- **Size**: 1GB (expandable)

#### Environment Variables:
```bash
NODE_ENV=production
HELIUS_API_KEY=466f06cf-0f8e-4f05-9c46-a95cb4a83f67
FRONTEND_URL=https://treasury-vault-timer.vercel.app
WEBHOOK_SECRET=<your-secure-webhook-secret>
ADMIN_KEY=<your-secure-admin-key>
DATABASE_PATH=/opt/render/project/server/data/vaults.db
```

### 3. Database Migration
The system automatically:
- Creates persistent storage directory
- Migrates existing SQLite database
- Handles schema updates
- Maintains vault data across deployments

### 4. API Endpoints

#### Core APIs:
- `GET /api/dashboard` - Complete vault dashboard data
- `GET /api/timer` - Timer state and monitoring status
- `GET /api/token/price` - Token price data
- `GET /api/wallets` - Wallet balance information

#### Admin APIs:
- `GET /api/admin/vaults` - List all vaults
- `POST /api/admin/vaults` - Create new vault
- `PUT /api/admin/vaults/:id` - Update vault configuration
- `PATCH /api/admin/vaults/:id/status` - Update vault status
- `DELETE /api/admin/vaults/:id` - Delete vault

#### Webhook APIs:
- `POST /webhook/helius` - Helius transaction webhook

### 5. Vault Lifecycle Management

#### Status Flow:
1. `pre_ico` - Vault created, awaiting ICO start
2. `ico` - ICO active, accepting purchases
3. `prelaunch` - ICO met $10k threshold, in prelaunch phase
4. `vault_live` - Vault fully operational with live timer
5. `extinction` - Vault ended (timer expired or end date reached)

#### Automated Transitions:
- Pre-ICO → ICO (based on `icoProposedAt` timestamp)
- ICO → Prelaunch (if meets $10k threshold when ICO ends)
- ICO → Extinction (if doesn't meet $10k threshold when ICO ends)
- Prelaunch → Vault Live (after prelaunch period)
- Vault Live → Extinction (when end date reached)
- Timer resets on legitimate purchases
- Persistent state across server restarts

### 6. Monitoring & Maintenance

#### Health Checks:
- `GET /api/health` - Basic health check
- `GET /api/healthz` - Detailed health status
- `GET /api/admin/health` - Comprehensive system health

#### Real-time Updates:
- WebSocket connections for live timer updates
- Socket.IO for vault status changes
- Automatic reconnection handling

### 7. Performance Considerations

#### For Thousands of Vaults:
- SQLite can handle thousands of records efficiently
- Consider PostgreSQL migration for >10,000 vaults
- Implement database indexing on frequently queried fields
- Add connection pooling for high-traffic scenarios

#### Scaling Strategy:
1. **Current**: SQLite with persistent storage
2. **Medium Scale**: PostgreSQL with connection pooling
3. **Large Scale**: Distributed database with read replicas

### 8. Security Features

#### Access Control:
- Admin key authentication for sensitive operations
- Webhook secret validation
- CORS configuration for frontend domains
- Whitelisted addresses for vault management

#### Data Protection:
- Persistent storage with automatic backups
- Database migration system for schema updates
- Error handling and logging

### 9. Frontend Integration

#### Configuration:
Update your frontend to point to the Render backend:
```javascript
const BACKEND_URL = 'https://treasury-vault-timer-backend.onrender.com';
```

#### WebSocket Connection:
```javascript
const socket = io(BACKEND_URL, {
  transports: ['websocket', 'polling']
});
```

### 10. Deployment Checklist

- [ ] Code committed to GitHub
- [ ] Render service configured
- [ ] Environment variables set
- [ ] Persistent storage mounted
- [ ] Health checks passing
- [ ] Frontend configured for production backend
- [ ] Webhook endpoints tested
- [ ] Admin panel accessible

### 11. Troubleshooting

#### Common Issues:
1. **Database not persisting**: Check mount path and permissions
2. **WebSocket connections failing**: Verify CORS configuration
3. **Timer not updating**: Check Helius webhook configuration
4. **Admin panel not working**: Verify ADMIN_KEY environment variable

#### Logs:
Access Render logs through the dashboard or CLI:
```bash
render logs --service treasury-vault-timer-backend
```

### 12. Next Steps

After successful deployment:
1. Test all vault operations
2. Configure monitoring alerts
3. Set up automated backups
4. Plan for PostgreSQL migration if needed
5. Implement additional security measures

## Support
For deployment issues, check:
- Render documentation
- Application logs
- Database connectivity
- Environment variable configuration
