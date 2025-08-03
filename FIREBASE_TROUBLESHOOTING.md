# 🔥 Firebase Connection Troubleshooting Guide

## 🚨 CRITICAL FIXES APPLIED:

### ✅ **FIXED: Mixed Module Systems**
- **Issue**: Backend used `require()` while models used `import`
- **Solution**: Updated `backend/config/firebase.js` to use ES6 modules consistently

### ✅ **FIXED: Import/Export Mismatch**
- **Issue**: Config file mixed CommonJS and ES6 exports
- **Solution**: Updated to proper ES6 exports

### ✅ **FIXED: Missing Import**
- **Issue**: `enableNetwork` was used but not imported
- **Solution**: Added proper import

## 🔍 DEBUGGING STEPS:

### 1. **Test Firebase Connection**
```bash
cd backend
node testFirebaseConnection.js
```

### 2. **Check Firestore Rules (Temporary Debug)**
If you get permission errors, temporarily replace `firestore.rules` with:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

Then deploy rules:
```bash
firebase deploy --only firestore:rules
```

### 3. **Verify Firebase Console Settings**

#### Firestore Database:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `tsw-fantasy`
3. Navigate to **Firestore Database**
4. If not initialized, click **Create database**
5. Choose **Start in test mode** (for now)

#### Authentication:
1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password** provider
3. Save changes

### 4. **Test Player Model**
```javascript
import { Player } from './models/PlayerFirebase.js';

// Test creating a player
const testPlayer = await Player.create({
  name: 'Test Player',
  position: 'CDM',
  rating: 85,
  price: 12,
  team: 'Test Team'
});

// Test getting all players
const allPlayers = await Player.findAll();
console.log('Players found:', allPlayers.length);
```

## 🔧 COMMON ISSUES & SOLUTIONS:

### Issue: "Permission denied"
- **Cause**: Restrictive Firestore rules
- **Solution**: Use debug rules above temporarily

### Issue: "Firebase not initialized"
- **Cause**: initializeApp() not called properly
- **Solution**: Check firebase.js config file

### Issue: "Module not found"
- **Cause**: Import path issues
- **Solution**: Use relative paths: `../config/firebase.js`

### Issue: "Network error"
- **Cause**: Offline or wrong project
- **Solution**: Check internet and project ID

## 📊 PROJECT STATUS:

### Current Configuration:
- **Project ID**: `tsw-fantasy`
- **Region**: Default (us-central1)
- **Auth Domain**: `tsw-fantasy.firebaseapp.com`
- **API Key**: `AIzaSyBkpza15mv5CswxyrknUX7hIUKmTLuX0D0`

### Files Updated:
- ✅ `backend/config/firebase.js` - Fixed module system
- ✅ `backend/models/PlayerFirebase.js` - Added error handling
- ✅ `backend/testFirebaseConnection.js` - Created diagnostic tool
- ✅ `firestore.rules.debug` - Created permissive debug rules

## 🎯 NEXT STEPS:

1. **Run Connection Test**: `node backend/testFirebaseConnection.js`
2. **If Permissions Error**: Deploy debug rules temporarily
3. **Test Player Operations**: Create/read players via model
4. **Restore Security**: Replace debug rules with proper ones
5. **Monitor Console**: Check Firebase Console for any issues

## 🆘 EMERGENCY DEBUG:

If nothing works, copy this command:
```bash
# Quick Firebase reset
firebase use tsw-fantasy
firebase deploy --only firestore:rules
firebase deploy --only hosting
```
