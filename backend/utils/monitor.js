/**
 * Performance Monitor & Logger
 * 
 * Tracks API performance, errors, and usage statistics
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byEndpoint: {},
        byMethod: {},
        averageResponseTime: 0
      },
      errors: {
        total: 0,
        byType: {},
        recent: []
      },
      system: {
        startTime: Date.now(),
        peakMemoryUsage: 0,
        totalRequests: 0
      }
    };
    
    this._responseTimes = [];
    this._startTime = Date.now();
    
    // Create logs directory if it doesn't exist
    this.logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir);
    }
    
    // Start system monitoring
    this.startSystemMonitoring();
  }

  /**
   * Middleware to track request performance
   */
  trackRequest() {
    return (req, res, next) => {
      const startTime = Date.now();
      const originalEnd = res.end;
      
      // Track request start
      this.metrics.requests.total++;
      this.metrics.system.totalRequests++;
      
      // Track by endpoint
      const endpoint = `${req.method} ${req.route?.path || req.path}`;
      this.metrics.requests.byEndpoint[endpoint] = (this.metrics.requests.byEndpoint[endpoint] || 0) + 1;
      
      // Track by method
      this.metrics.requests.byMethod[req.method] = (this.metrics.requests.byMethod[req.method] || 0) + 1;
      
      // Override res.end to capture response time and status
      res.end = function(chunk, encoding) {
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        // Track response time
        monitor._responseTimes.push(responseTime);
        if (monitor._responseTimes.length > 1000) {
          monitor._responseTimes = monitor._responseTimes.slice(500); // Keep last 500
        }
        
        // Update average response time
        monitor.metrics.requests.averageResponseTime = 
          monitor._responseTimes.reduce((a, b) => a + b, 0) / monitor._responseTimes.length;
        
        // Track success/failure
        if (res.statusCode < 400) {
          monitor.metrics.requests.successful++;
        } else {
          monitor.metrics.requests.failed++;
        }
        
        // Log slow requests
        if (responseTime > 1000) {
          monitor.logSlowRequest(req, res, responseTime);
        }
        
        // Log API access
        monitor.logRequest(req, res, responseTime);
        
        // Call original end
        originalEnd.call(this, chunk, encoding);
      };
      
      next();
    };
  }

  /**
   * Track application errors
   */
  trackError(error, req = null) {
    this.metrics.errors.total++;
    
    const errorType = error.name || 'UnknownError';
    this.metrics.errors.byType[errorType] = (this.metrics.errors.byType[errorType] || 0) + 1;
    
    const errorLog = {
      timestamp: new Date().toISOString(),
      type: errorType,
      message: error.message,
      stack: error.stack,
      endpoint: req ? `${req.method} ${req.path}` : null,
      userAgent: req ? req.get('User-Agent') : null,
      ip: req ? req.ip : null
    };
    
    this.metrics.errors.recent.unshift(errorLog);
    if (this.metrics.errors.recent.length > 100) {
      this.metrics.errors.recent = this.metrics.errors.recent.slice(0, 50);
    }
    
    this.logError(errorLog);
  }

  /**
   * Get current performance metrics
   */
  getMetrics() {
    const memUsage = process.memoryUsage();
    const systemStats = {
      uptime: Date.now() - this._startTime,
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memUsage.external / 1024 / 1024), // MB
        rss: Math.round(memUsage.rss / 1024 / 1024) // MB
      },
      cpu: {
        loadAverage: os.loadavg(),
        cpuCount: os.cpus().length
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        freeMemory: Math.round(os.freemem() / 1024 / 1024), // MB
        totalMemory: Math.round(os.totalmem() / 1024 / 1024) // MB
      }
    };
    
    // Update peak memory usage
    if (memUsage.heapUsed > this.metrics.system.peakMemoryUsage) {
      this.metrics.system.peakMemoryUsage = memUsage.heapUsed;
    }
    
    return {
      ...this.metrics,
      system: {
        ...this.metrics.system,
        ...systemStats,
        peakMemoryUsageMB: Math.round(this.metrics.system.peakMemoryUsage / 1024 / 1024)
      },
      performance: {
        averageResponseTime: Math.round(this.metrics.requests.averageResponseTime),
        successRate: this.metrics.requests.total > 0 
          ? Math.round((this.metrics.requests.successful / this.metrics.requests.total) * 100)
          : 0,
        requestsPerMinute: this.calculateRequestsPerMinute(),
        slowestEndpoints: this.getSlowestEndpoints()
      }
    };
  }

  /**
   * Calculate requests per minute over the last hour
   */
  calculateRequestsPerMinute() {
    const uptimeMinutes = (Date.now() - this._startTime) / 60000;
    return uptimeMinutes > 0 ? Math.round(this.metrics.requests.total / uptimeMinutes) : 0;
  }

  /**
   * Get slowest endpoints
   */
  getSlowestEndpoints() {
    // This is a simplified version - in production you'd track response times per endpoint
    return Object.entries(this.metrics.requests.byEndpoint)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([endpoint, count]) => ({ endpoint, requests: count }));
  }

  /**
   * Start system monitoring
   */
  startSystemMonitoring() {
    setInterval(() => {
      const metrics = this.getMetrics();
      
      // Log system stats every 5 minutes
      this.logSystemStats(metrics.system);
      
      // Check for high memory usage
      if (metrics.system.memory.used > 500) { // 500MB threshold
        console.warn(`⚠️ High memory usage: ${metrics.system.memory.used}MB`);
      }
      
      // Check for high error rate
      const errorRate = metrics.requests.total > 0 
        ? (metrics.errors.total / metrics.requests.total) * 100 
        : 0;
      
      if (errorRate > 5) { // 5% error rate threshold
        console.warn(`⚠️ High error rate: ${errorRate.toFixed(1)}%`);
      }
      
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Log request details
   */
  logRequest(req, res, responseTime) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentLength: res.get('Content-Length') || 0
    };
    
    this.writeToLogFile('access.log', JSON.stringify(logEntry));
  }

  /**
   * Log slow requests
   */
  logSlowRequest(req, res, responseTime) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'SLOW_REQUEST',
      method: req.method,
      url: req.originalUrl,
      responseTime: `${responseTime}ms`,
      status: res.statusCode,
      ip: req.ip,
      query: req.query,
      body: req.method === 'POST' ? req.body : undefined
    };
    
    console.warn(`🐌 Slow request: ${req.method} ${req.originalUrl} - ${responseTime}ms`);
    this.writeToLogFile('slow-requests.log', JSON.stringify(logEntry));
  }

  /**
   * Log errors
   */
  logError(errorLog) {
    console.error(`❌ Error: ${errorLog.type} - ${errorLog.message}`);
    this.writeToLogFile('errors.log', JSON.stringify(errorLog));
  }

  /**
   * Log system statistics
   */
  logSystemStats(stats) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'SYSTEM_STATS',
      ...stats
    };
    
    this.writeToLogFile('system.log', JSON.stringify(logEntry));
  }

  /**
   * Write to log file
   */
  writeToLogFile(filename, data) {
    const logFile = path.join(this.logsDir, filename);
    const logLine = `${data}\n`;
    
    fs.appendFile(logFile, logLine, (err) => {
      if (err) {
        console.error(`Failed to write to log file ${filename}:`, err);
      }
    });
  }

  /**
   * Generate performance report
   */
  generateReport() {
    const metrics = this.getMetrics();
    const report = {
      generatedAt: new Date().toISOString(),
      summary: {
        uptime: `${Math.round(metrics.system.uptime / 1000 / 60)} minutes`,
        totalRequests: metrics.requests.total,
        successRate: `${metrics.performance.successRate}%`,
        averageResponseTime: `${metrics.performance.averageResponseTime}ms`,
        memoryUsage: `${metrics.system.memory.used}MB`,
        errorRate: `${(metrics.errors.total / Math.max(metrics.requests.total, 1) * 100).toFixed(1)}%`
      },
      requests: {
        total: metrics.requests.total,
        successful: metrics.requests.successful,
        failed: metrics.requests.failed,
        byMethod: metrics.requests.byMethod,
        topEndpoints: Object.entries(metrics.requests.byEndpoint)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([endpoint, count]) => ({ endpoint, requests: count }))
      },
      errors: {
        total: metrics.errors.total,
        byType: metrics.errors.byType,
        recentErrors: metrics.errors.recent.slice(0, 5)
      },
      system: metrics.system
    };
    
    return report;
  }

  /**
   * Save performance report to file
   */
  saveReport() {
    const report = this.generateReport();
    const filename = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(this.logsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`📊 Performance report saved: ${filename}`);
    
    return report;
  }

  /**
   * Reset metrics (useful for testing)
   */
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        byEndpoint: {},
        byMethod: {},
        averageResponseTime: 0
      },
      errors: {
        total: 0,
        byType: {},
        recent: []
      },
      system: {
        startTime: Date.now(),
        peakMemoryUsage: 0,
        totalRequests: 0
      }
    };
    
    this._responseTimes = [];
    this._startTime = Date.now();
  }
}

// Create singleton instance
const monitor = new PerformanceMonitor();

// Export middleware and monitor
module.exports = {
  monitor,
  trackRequest: () => monitor.trackRequest(),
  trackError: (error, req) => monitor.trackError(error, req),
  getMetrics: () => monitor.getMetrics(),
  generateReport: () => monitor.generateReport(),
  saveReport: () => monitor.saveReport()
};
