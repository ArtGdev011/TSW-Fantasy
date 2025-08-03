// Firebase Console Rules Update Instructions

## 🔧 MANUAL FIRESTORE RULES UPDATE REQUIRED

Since the Firebase CLI deployment isn't working for rules, please follow these steps:

### 1. Open Firebase Console
- Go to: https://console.firebase.google.com/project/tsw-fantasy/firestore/rules
- Login with your Firebase account

### 2. Replace Current Rules
Replace ALL the existing rules with this content:

```javascript
// TEMPORARY DEBUG RULES - ALLOW ALL ACCESS
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### 3. Publish Rules
- Click "Publish" in the Firebase console
- Wait for deployment to complete

### 4. Test Again
After updating rules, run this test:
```bash
node backend/simpleTest.js
```

## 🔑 AUTHENTICATION TEST

Once the basic connection works, test with authentication:

### Enable Email/Password Auth:
1. Go to: https://console.firebase.google.com/project/tsw-fantasy/authentication/providers
2. Click "Email/Password"
3. Toggle "Enable"
4. Click "Save"

## 📊 EXPECTED RESULTS

After fixing rules, you should see:
```
✅ Write successful
✅ Read successful: Hello Firebase!
🎉 Firebase is working perfectly!
```

## ⚠️ SECURITY WARNING

Remember to replace debug rules with secure ones after testing!

The secure rules should be in: `firestore.rules.backup` (if you created a backup)
