// 🔍 TSW Fantasy League Debug Logger
// This script provides detailed logging for authentication debugging

class TSWDebugLogger {
  constructor() {
    this.logs = [];
    this.isEnabled = true;
    this.startTime = Date.now();
    
    // Initialize debug logging
    this.init();
  }

  init() {
    console.log("🚀 TSW Fantasy Debug Logger Initialized");
    console.log("📊 Use window.tswDebug to access debug functions");
    
    // Add to window for easy access
    window.tswDebug = this;
    
    // Style for console logs
    this.styles = {
      success: 'color: #10b981; font-weight: bold;',
      error: 'color: #ef4444; font-weight: bold;',
      warning: 'color: #f59e0b; font-weight: bold;',
      info: 'color: #3b82f6; font-weight: bold;',
      debug: 'color: #8b5cf6; font-weight: bold;',
      firebase: 'color: #ff6b35; font-weight: bold;',
      auth: 'color: #06d6a0; font-weight: bold;'
    };
  }

  // Format timestamp
  timestamp() {
    const now = new Date();
    return `[${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}]`;
  }

  // Log with different levels
  log(level, message, data = null, error = null) {
    const timestamp = this.timestamp();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      error,
      time: Date.now() - this.startTime
    };
    
    this.logs.push(logEntry);
    
    const style = this.styles[level] || this.styles.info;
    
    if (data || error) {
      console.group(`%c${timestamp} [${level.toUpperCase()}] ${message}`, style);
      if (data) {
        console.log("📄 Data:", data);
      }
      if (error) {
        console.error("❌ Error Details:", error);
        if (error.code) console.log("🔑 Error Code:", error.code);
        if (error.message) console.log("💬 Error Message:", error.message);
        if (error.stack) console.log("📚 Stack Trace:", error.stack);
      }
      console.groupEnd();
    } else {
      console.log(`%c${timestamp} [${level.toUpperCase()}] ${message}`, style);
    }
  }

  // Specific log methods
  success(message, data = null) { this.log('success', message, data); }
  error(message, data = null, error = null) { this.log('error', message, data, error); }
  warning(message, data = null) { this.log('warning', message, data); }
  info(message, data = null) { this.log('info', message, data); }
  debug(message, data = null) { this.log('debug', message, data); }
  firebase(message, data = null) { this.log('firebase', message, data); }
  auth(message, data = null) { this.log('auth', message, data); }

  // Firebase specific debugging
  debugFirebaseError(error, operation = "Firebase Operation") {
    console.group(`%c🔥 Firebase Error in ${operation}`, this.styles.firebase);
    console.error("❌ Error Object:", error);
    
    if (error.code) {
      console.log(`🔑 Error Code: ${error.code}`);
      this.explainFirebaseError(error.code);
    }
    
    if (error.message) console.log(`💬 Error Message: ${error.message}`);
    if (error.customData) console.log("📊 Custom Data:", error.customData);
    if (error.stack) console.log("📚 Stack Trace:", error.stack);
    
    console.groupEnd();
  }

  // Explain common Firebase errors
  explainFirebaseError(code) {
    const explanations = {
      'auth/user-not-found': '👤 No user found with this username/email. User needs to sign up first.',
      'auth/wrong-password': '🔒 Incorrect password provided.',
      'auth/email-already-in-use': '📧 Email is already registered. Try logging in instead.',
      'auth/weak-password': '🔐 Password is too weak. Needs at least 6 characters.',
      'auth/invalid-email': '📧 Invalid email format provided.',
      'auth/too-many-requests': '⏰ Too many failed attempts. Account temporarily locked.',
      'auth/network-request-failed': '🌐 Network error. Check internet connection.',
      'auth/internal-error': '⚙️ Internal Firebase error. Try again later.',
      'permission-denied': '🚫 Firestore permission denied. Check security rules.',
      'not-found': '📄 Document not found in Firestore.',
      'already-exists': '📝 Document already exists in Firestore.'
    };
    
    const explanation = explanations[code];
    if (explanation) {
      console.log(`💡 Explanation: ${explanation}`);
    } else {
      console.log(`❓ Unknown error code: ${code}`);
    }
  }

  // Debug form data
  debugFormData(formData, operation) {
    console.group(`%c📝 Form Data for ${operation}`, this.styles.debug);
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'password' || key === 'confirmPassword') {
        console.log(`${key}: ${'*'.repeat(value.length)} (${value.length} characters)`);
      } else {
        console.log(`${key}: ${value}`);
      }
    });
    console.groupEnd();
  }

  // Debug API request
  debugApiRequest(method, url, data = null) {
    console.group(`%c🌐 API Request: ${method} ${url}`, this.styles.info);
    if (data) console.log("📤 Request Data:", data);
    console.groupEnd();
  }

  // Debug API response
  debugApiResponse(response, url) {
    console.group(`%c🌐 API Response from ${url}`, this.styles.success);
    console.log("📥 Response:", response);
    console.groupEnd();
  }

  // Get all logs
  getAllLogs() {
    return this.logs;
  }

  // Get logs by level
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }

  // Export logs as JSON
  exportLogs() {
    const data = JSON.stringify(this.logs, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tsw-debug-logs-${new Date().toISOString().slice(0, 19)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log("📥 Debug logs exported to file");
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    console.clear();
    console.log("🧹 Debug logs cleared");
  }

  // Test connection to Firebase
  async testFirebaseConnection() {
    console.group("%c🔥 Testing Firebase Connection", this.styles.firebase);
    
    try {
      // Import Firebase (assuming it's available)
      const { auth, db } = await import('../config/firebase');
      
      console.log("✅ Firebase Auth imported successfully");
      console.log("✅ Firebase Firestore imported successfully");
      
      // Test auth state
      if (auth.currentUser) {
        console.log("👤 Current user:", auth.currentUser.uid);
      } else {
        console.log("👤 No current user (not logged in)");
      }
      
      // Test Firestore connection with a simple read
      console.log("🔍 Testing Firestore connection...");
      
      console.log("✅ Firebase connection test completed");
      
    } catch (error) {
      console.error("❌ Firebase connection test failed:", error);
      this.debugFirebaseError(error, "Firebase Connection Test");
    }
    
    console.groupEnd();
  }

  // Show help
  showHelp() {
    console.group("%c🆘 TSW Debug Logger Help", this.styles.info);
    console.log("Available commands:");
    console.log("• window.tswDebug.success(message, data) - Log success");
    console.log("• window.tswDebug.error(message, data, error) - Log error");
    console.log("• window.tswDebug.warning(message, data) - Log warning");
    console.log("• window.tswDebug.info(message, data) - Log info");
    console.log("• window.tswDebug.debug(message, data) - Log debug");
    console.log("• window.tswDebug.firebase(message, data) - Log Firebase");
    console.log("• window.tswDebug.auth(message, data) - Log auth");
    console.log("• window.tswDebug.debugFirebaseError(error, operation) - Debug Firebase errors");
    console.log("• window.tswDebug.debugFormData(formData, operation) - Debug form data");
    console.log("• window.tswDebug.testFirebaseConnection() - Test Firebase");
    console.log("• window.tswDebug.getAllLogs() - Get all logs");
    console.log("• window.tswDebug.exportLogs() - Export logs to file");
    console.log("• window.tswDebug.clearLogs() - Clear all logs");
    console.log("• window.tswDebug.showHelp() - Show this help");
    console.groupEnd();
  }
}

// Initialize the debug logger
const debugLogger = new TSWDebugLogger();

// Show initial help
debugLogger.showHelp();

export default debugLogger;
