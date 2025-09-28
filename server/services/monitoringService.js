import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MonitoringService {
  constructor() {
    this.logsDir = path.join(__dirname, '../logs');
    this.ensureLogsDirectory();
    
    this.metrics = {
      requests: 0,
      errors: 0,
      vaultTransitions: 0,
      timerResets: 0,
      startTime: new Date().toISOString(),
      lastError: null,
      uptime: 0
    };
    
    this.startUptimeTracking();
  }

  ensureLogsDirectory() {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  startUptimeTracking() {
    setInterval(() => {
      this.metrics.uptime = Date.now() - new Date(this.metrics.startTime).getTime();
    }, 1000);
  }

  // Log levels: error, warn, info, debug
  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      pid: process.pid
    };

    // Console output with colors
    const colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m',  // Yellow
      info: '\x1b[36m',  // Cyan
      debug: '\x1b[90m'  // Gray
    };
    
    const reset = '\x1b[0m';
    const color = colors[level] || '';
    
    console.log(`${color}[${timestamp}] ${level.toUpperCase()}: ${message}${reset}`);
    
    if (data) {
      console.log(`${color}  Data:`, JSON.stringify(data, null, 2), reset);
    }

    // Write to log file
    this.writeToLogFile(logEntry);
    
    // Update metrics
    if (level === 'error') {
      this.metrics.errors++;
      this.metrics.lastError = logEntry;
    }
  }

  writeToLogFile(logEntry) {
    try {
      const date = new Date().toISOString().split('T')[0];
      const logFile = path.join(this.logsDir, `app-${date}.log`);
      
      const logLine = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  // Request monitoring
  logRequest(req, res, responseTime) {
    this.metrics.requests++;
    
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    };

    if (res.statusCode >= 400) {
      this.log('warn', `HTTP ${res.statusCode}`, logData);
    } else {
      this.log('info', `HTTP ${res.statusCode}`, logData);
    }
  }

  // Error monitoring
  logError(error, context = {}) {
    this.metrics.errors++;
    this.metrics.lastError = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      context
    };

    this.log('error', error.message, {
      stack: error.stack,
      context
    });
  }

  // Vault lifecycle monitoring
  logVaultTransition(vaultId, fromStatus, toStatus, reason = '') {
    this.metrics.vaultTransitions++;
    
    this.log('info', `Vault transition: ${vaultId}`, {
      from: fromStatus,
      to: toStatus,
      reason
    });
  }

  // Timer monitoring
  logTimerReset(vaultId, signature, amount) {
    this.metrics.timerResets++;
    
    this.log('info', `Timer reset: ${vaultId}`, {
      signature,
      amount
    });
  }

  // Performance monitoring
  logPerformance(operation, duration, details = {}) {
    this.log('info', `Performance: ${operation}`, {
      duration: `${duration}ms`,
      ...details
    });
  }

  // Health check
  getHealthStatus() {
    const uptimeSeconds = Math.floor(this.metrics.uptime / 1000);
    const uptimeMinutes = Math.floor(uptimeSeconds / 60);
    const uptimeHours = Math.floor(uptimeMinutes / 60);
    
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptimeSeconds,
        minutes: uptimeMinutes,
        hours: uptimeHours,
        human: `${uptimeHours}h ${uptimeMinutes % 60}m ${uptimeSeconds % 60}s`
      },
      metrics: {
        ...this.metrics,
        errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2) + '%' : '0%'
      },
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };

    // Determine health status
    if (this.metrics.errors > 100) {
      health.status = 'unhealthy';
    } else if (this.metrics.errors > 50) {
      health.status = 'degraded';
    }

    return health;
  }

  // Get metrics
  getMetrics() {
    return {
      ...this.metrics,
      errorRate: this.metrics.requests > 0 ? (this.metrics.errors / this.metrics.requests * 100).toFixed(2) + '%' : '0%',
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };
  }

  // Clear old log files (keep last 7 days)
  cleanupOldLogs() {
    try {
      const files = fs.readdirSync(this.logsDir);
      const now = Date.now();
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

      files.forEach(file => {
        if (file.startsWith('app-') && file.endsWith('.log')) {
          const filePath = path.join(this.logsDir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.mtime.getTime() < sevenDaysAgo) {
            fs.unlinkSync(filePath);
            this.log('info', `Cleaned up old log file: ${file}`);
          }
        }
      });
    } catch (error) {
      this.log('error', 'Failed to cleanup old logs', { error: error.message });
    }
  }

  // Start cleanup interval (daily)
  startCleanup() {
    setInterval(() => {
      this.cleanupOldLogs();
    }, 24 * 60 * 60 * 1000); // 24 hours
  }

  // Express middleware for request monitoring
  requestMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      res.on('finish', () => {
        const responseTime = Date.now() - startTime;
        this.logRequest(req, res, responseTime);
      });
      
      next();
    };
  }

  // Error handler middleware
  errorMiddleware() {
    return (error, req, res, next) => {
      this.logError(error, {
        method: req.method,
        url: req.url,
        body: req.body,
        query: req.query,
        params: req.params
      });

      // Don't expose internal errors in production
      const isDevelopment = process.env.NODE_ENV !== 'production';
      
      res.status(error.status || 500).json({
        error: isDevelopment ? error.message : 'Internal server error',
        timestamp: new Date().toISOString(),
        requestId: req.id || 'unknown'
      });
    };
  }

  // Database monitoring
  logDatabaseOperation(operation, table, duration, success = true) {
    this.log(success ? 'info' : 'error', `Database ${operation}`, {
      table,
      duration: `${duration}ms`,
      success
    });
  }

  // Socket.IO monitoring
  logSocketEvent(event, data = {}) {
    this.log('info', `Socket event: ${event}`, data);
  }

  // External API monitoring
  logExternalAPI(service, endpoint, duration, success = true, error = null) {
    this.log(success ? 'info' : 'error', `External API: ${service}`, {
      endpoint,
      duration: `${duration}ms`,
      success,
      error: error ? error.message : null
    });
  }
}

export default MonitoringService;
