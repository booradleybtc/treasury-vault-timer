# Production Monitoring & Alerting Setup

## 🚨 Critical Monitoring Requirements

### 1. Uptime Monitoring
**Service**: UptimeRobot, Pingdom, or StatusCake
**Endpoints to Monitor**:
- `https://treasury-vault-timer-backend.onrender.com/api/health`
- `https://treasury-vault-timer.vercel.app`

**Alert Thresholds**:
- Response time > 5 seconds
- Downtime > 1 minute
- HTTP status != 200

### 2. Error Tracking
**Service**: Sentry
**Setup**:
1. Create Sentry project
2. Get DSN from project settings
3. Add to environment variables

### 3. Performance Monitoring
**Service**: New Relic, DataDog, or Render's built-in monitoring
**Metrics to Track**:
- Response times
- Database query performance
- Memory usage
- CPU usage

### 4. Log Aggregation
**Service**: LogRocket, Papertrail, or Render's log aggregation
**Log Levels**:
- ERROR: System errors, failed requests
- WARN: Performance issues, rate limiting
- INFO: Successful operations, user actions
- DEBUG: Detailed debugging (development only)

## 📊 Monitoring Dashboard

### Key Metrics to Track:

#### Backend (Render)
- **Uptime**: 99.9% target
- **Response Time**: < 500ms average
- **Error Rate**: < 1%
- **Database Connections**: < 80% of pool
- **Memory Usage**: < 80% of allocated
- **CPU Usage**: < 70% of allocated

#### Frontend (Vercel)
- **Page Load Time**: < 2 seconds
- **Core Web Vitals**: All green
- **Error Rate**: < 0.1%
- **Bundle Size**: < 1MB

#### Business Metrics
- **Active Vaults**: Number of active vaults
- **Timer Resets**: Frequency of timer resets
- **User Engagement**: Page views, session duration
- **API Usage**: Requests per minute

## 🔔 Alert Configuration

### Critical Alerts (Immediate Response)
- **Service Down**: Any service unavailable
- **High Error Rate**: > 5% error rate
- **Database Issues**: Connection failures
- **Security Issues**: Failed admin attempts

### Warning Alerts (Within 1 Hour)
- **High Response Time**: > 2 seconds average
- **High Memory Usage**: > 80% utilization
- **Rate Limiting**: High rate limit hits
- **Disk Space**: > 80% full

### Info Alerts (Daily Summary)
- **Daily Stats**: Request counts, user activity
- **Performance Trends**: Weekly performance reports
- **Security Summary**: Failed login attempts

## 🛠️ Implementation Steps

### 1. Set Up Sentry (Error Tracking)
```bash
# Install Sentry
npm install @sentry/node @sentry/integrations

# Add to server/index.js
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 2. Set Up Uptime Monitoring
1. Create account with monitoring service
2. Add endpoints to monitor
3. Configure alert channels (email, Slack, SMS)
4. Set up escalation policies

### 3. Configure Render Monitoring
1. Enable Render's built-in monitoring
2. Set up log aggregation
3. Configure alert thresholds
4. Set up notification channels

### 4. Set Up Vercel Analytics
1. Enable Vercel Analytics
2. Configure performance monitoring
3. Set up error tracking
4. Configure alert notifications

## 📱 Notification Channels

### Email Alerts
- **Critical**: Immediate notification
- **Warning**: Within 1 hour
- **Info**: Daily digest

### Slack Integration
- **Channel**: #alerts-production
- **Critical**: @here notification
- **Warning**: Regular message
- **Info**: Daily summary

### SMS Alerts
- **Critical Only**: Service down, security issues
- **Escalation**: If no response within 15 minutes

## 🔧 Monitoring Tools Setup

### 1. Sentry Configuration
```javascript
// server/monitoring/sentry.js
import * as Sentry from '@sentry/node';

export const initSentry = () => {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
    ],
  });
};

export const captureException = (error, context = {}) => {
  Sentry.captureException(error, {
    tags: context.tags,
    extra: context.extra,
    user: context.user,
  });
};
```

### 2. Health Check Enhancement
```javascript
// Enhanced health check with monitoring
app.get('/api/health/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.BUILD_VERSION,
    environment: process.env.NODE_ENV,
    checks: {}
  };
  
  // Database check
  try {
    await db.getVaults();
    health.checks.database = 'healthy';
  } catch (error) {
    health.checks.database = 'unhealthy';
    health.status = 'unhealthy';
  }
  
  // Solana connection check
  try {
    await connection.getSlot();
    health.checks.solana = 'healthy';
  } catch (error) {
    health.checks.solana = 'unhealthy';
    health.status = 'unhealthy';
  }
  
  // Memory check
  const memUsage = process.memoryUsage();
  health.checks.memory = {
    used: Math.round(memUsage.heapUsed / 1024 / 1024),
    total: Math.round(memUsage.heapTotal / 1024 / 1024),
    external: Math.round(memUsage.external / 1024 / 1024)
  };
  
  res.status(health.status === 'healthy' ? 200 : 503).json(health);
});
```

## 📈 Performance Optimization

### 1. Database Optimization
- Add indexes on frequently queried fields
- Implement connection pooling
- Set up query monitoring
- Configure automatic backups

### 2. API Optimization
- Implement response caching
- Add request compression
- Optimize database queries
- Set up CDN for static assets

### 3. Frontend Optimization
- Implement code splitting
- Add service worker for caching
- Optimize bundle size
- Set up performance monitoring

## 🚀 Next Steps

1. **Immediate (Today)**:
   - Set up Sentry error tracking
   - Configure basic uptime monitoring
   - Set up email alerts

2. **This Week**:
   - Implement detailed health checks
   - Set up performance monitoring
   - Configure Slack notifications

3. **Next Week**:
   - Set up log aggregation
   - Implement custom metrics
   - Create monitoring dashboard

## 🔗 Useful Links

- [Sentry Documentation](https://docs.sentry.io/)
- [UptimeRobot](https://uptimerobot.com/)
- [Render Monitoring](https://render.com/docs/monitoring)
- [Vercel Analytics](https://vercel.com/analytics)
