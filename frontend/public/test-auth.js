// 🧪 TSW Fantasy League Auth Testing Script
// Paste this into browser console for quick auth testing

console.log("%c🧪 TSW Fantasy Auth Test Script Loaded", "color: #00ff00; font-size: 16px; font-weight: bold;");

// Test functions
window.tswTest = {
  // Test Firebase connection
  async testFirebase() {
    console.group("%c🔥 Testing Firebase Connection", "color: #ff6b35; font-weight: bold;");
    
    try {
      // Check if Firebase is loaded
      if (typeof window.firebase === 'undefined') {
        console.error("❌ Firebase is not loaded");
        return false;
      }
      
      console.log("✅ Firebase SDK is loaded");
      
      // Test auth
      if (window.firebase.auth && window.firebase.auth()) {
        console.log("✅ Firebase Auth is initialized");
        console.log("👤 Current user:", window.firebase.auth().currentUser?.uid || "Not logged in");
      } else {
        console.error("❌ Firebase Auth is not initialized");
      }
      
      // Test Firestore
      if (window.firebase.firestore) {
        console.log("✅ Firebase Firestore is available");
      } else {
        console.error("❌ Firebase Firestore is not available");
      }
      
      return true;
      
    } catch (error) {
      console.error("❌ Firebase test failed:", error);
      return false;
    } finally {
      console.groupEnd();
    }
  },

  // Test login with specific credentials
  async testLogin(username, password) {
    console.group(`%c🔐 Testing Login: ${username}`, "color: #3b82f6; font-weight: bold;");
    
    try {
      // Try to import authService
      const { loginWithUsername } = await import('/src/services/authService.ts');
      
      console.log("📝 Attempting login...");
      const result = await loginWithUsername(username, password);
      
      console.log("✅ Login successful!");
      console.log("User data:", result);
      return result;
      
    } catch (error) {
      console.error("❌ Login failed:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      return null;
    } finally {
      console.groupEnd();
    }
  },

  // Test signup with specific credentials
  async testSignup(username, email, password) {
    console.group(`%c📝 Testing Signup: ${username}`, "color: #10b981; font-weight: bold;");
    
    try {
      // Try to import authService
      const { signupWithUsername } = await import('/src/services/authService.ts');
      
      console.log("📝 Attempting signup...");
      const result = await signupWithUsername(username, email, password);
      
      console.log("✅ Signup successful!");
      console.log("User data:", result);
      return result;
      
    } catch (error) {
      console.error("❌ Signup failed:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      return null;
    } finally {
      console.groupEnd();
    }
  },

  // Monitor network requests
  monitorNetwork() {
    console.log("%c🌐 Starting Network Monitor", "color: #f59e0b; font-weight: bold;");
    
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = function(url, options) {
      console.group(`%c🌐 FETCH: ${url}`, "color: #8b5cf6; font-weight: bold;");
      console.log("Method:", options?.method || 'GET');
      if (options?.body) console.log("Body:", options.body);
      console.groupEnd();
      
      return originalFetch.apply(this, arguments)
        .then(response => {
          console.log(`%c📥 Response: ${response.status} ${url}`, 
            response.ok ? "color: #10b981;" : "color: #ef4444;");
          return response;
        })
        .catch(error => {
          console.error(`%c❌ Fetch Error: ${url}`, "color: #ef4444;", error);
          throw error;
        });
    };
    
    console.log("✅ Network monitoring enabled");
  },

  // Show current user state
  showUserState() {
    console.group("%c👤 Current User State", "color: #06d6a0; font-weight: bold;");
    
    // Check localStorage
    const localStorageKeys = Object.keys(localStorage).filter(key => 
      key.includes('firebase') || key.includes('auth') || key.includes('user')
    );
    
    console.log("📱 LocalStorage keys:", localStorageKeys);
    localStorageKeys.forEach(key => {
      console.log(`  ${key}:`, localStorage.getItem(key));
    });
    
    // Check sessionStorage
    const sessionStorageKeys = Object.keys(sessionStorage).filter(key => 
      key.includes('firebase') || key.includes('auth') || key.includes('user')
    );
    
    console.log("📱 SessionStorage keys:", sessionStorageKeys);
    sessionStorageKeys.forEach(key => {
      console.log(`  ${key}:`, sessionStorage.getItem(key));
    });
    
    console.groupEnd();
  },

  // Show help
  help() {
    console.group("%c🆘 TSW Test Commands", "color: #3b82f6; font-weight: bold;");
    console.log("Available commands:");
    console.log("• window.tswTest.testFirebase() - Test Firebase connection");
    console.log("• window.tswTest.testLogin('username', 'password') - Test login");
    console.log("• window.tswTest.testSignup('username', 'email', 'password') - Test signup");
    console.log("• window.tswTest.monitorNetwork() - Monitor network requests");
    console.log("• window.tswTest.showUserState() - Show current user state");
    console.log("• window.tswTest.help() - Show this help");
    console.groupEnd();
  }
};

// Show help on load
window.tswTest.help();

console.log("%c🎯 Ready! Use window.tswTest.help() to see available commands", "color: #00ff00; font-weight: bold;");
