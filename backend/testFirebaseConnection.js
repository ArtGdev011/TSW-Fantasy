// Firebase Connection Test - Run this to diagnose issues
import { db, auth } from './config/firebase.js';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  connectFirestoreEmulator 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  connectAuthEmulator 
} from 'firebase/auth';

// Test Firebase Connection
export async function testFirebaseConnection() {
  console.log('🔍 Testing Firebase Connection...\n');
  
  // Test 1: Basic Firebase Config
  console.log('1️⃣ Testing Firebase Config:');
  console.log('✅ Firebase app initialized:', !!db && !!auth);
  console.log('✅ Firestore instance:', !!db);
  console.log('✅ Auth instance:', !!auth);
  
  try {
    // Test 2: Firestore Write Test
    console.log('\n2️⃣ Testing Firestore Write:');
    const testDoc = doc(db, 'test', 'connection-test');
    await setDoc(testDoc, {
      message: 'Firebase connection test',
      timestamp: new Date(),
      status: 'success'
    });
    console.log('✅ Firestore write successful');
    
    // Test 3: Firestore Read Test  
    console.log('\n3️⃣ Testing Firestore Read:');
    const docSnap = await getDoc(testDoc);
    if (docSnap.exists()) {
      console.log('✅ Firestore read successful:', docSnap.data());
    } else {
      console.log('❌ Document not found after write');
    }
    
    // Test 4: Collection Query Test
    console.log('\n4️⃣ Testing Collection Query:');
    const testCollection = collection(db, 'test');
    const querySnapshot = await getDocs(testCollection);
    console.log('✅ Collection query successful, docs found:', querySnapshot.size);
    
    // Test 5: Players Collection Test
    console.log('\n5️⃣ Testing Players Collection:');
    const playersCollection = collection(db, 'players');
    const playersSnapshot = await getDocs(playersCollection);
    console.log('✅ Players collection query successful, players found:', playersSnapshot.size);
    
    return {
      success: true,
      message: 'All Firebase tests passed! 🎉'
    };
    
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Detailed error analysis
    if (error.code === 'permission-denied') {
      console.log('\n🔐 SOLUTION: Firestore Rules Issue');
      console.log('- Go to Firebase Console → Firestore → Rules');
      console.log('- Temporarily set rules to allow all (for debugging):');
      console.log(`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}`);
    }
    
    if (error.code === 'unavailable' || error.message.includes('network')) {
      console.log('\n🌐 SOLUTION: Network Issue');
      console.log('- Check internet connection');
      console.log('- Verify Firebase project is active');
      console.log('- Check if using correct Firebase project ID');
    }
    
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
}

// Test Authentication
export async function testAuth() {
  console.log('\n🔐 Testing Authentication...');
  
  try {
    // Test with dummy credentials (this will fail but shows if auth is working)
    const testEmail = 'test@example.com';
    const testPassword = 'testpassword123';
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      console.log('✅ Auth test account created:', userCredential.user.uid);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log('ℹ️ Auth working - test email already exists');
        try {
          const signInCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
          console.log('✅ Auth sign-in successful:', signInCredential.user.uid);
        } catch (signInError) {
          console.log('ℹ️ Auth is configured but credentials invalid (expected)');
        }
      } else {
        throw error;
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Auth test failed:', error.code, error.message);
    
    if (error.code === 'auth/operation-not-allowed') {
      console.log('\n🔐 SOLUTION: Enable Email/Password Auth');
      console.log('- Go to Firebase Console → Authentication → Sign-in method');
      console.log('- Enable Email/Password provider');
    }
    
    return { success: false, error: error.message };
  }
}

// Run all tests
export async function runAllTests() {
  console.log('🚀 Starting Firebase Diagnostic Tests...\n');
  
  const connectionResult = await testFirebaseConnection();
  const authResult = await testAuth();
  
  console.log('\n📊 TEST RESULTS:');
  console.log('Firestore Connection:', connectionResult.success ? '✅ PASS' : '❌ FAIL');
  console.log('Authentication:', authResult.success ? '✅ PASS' : '❌ FAIL');
  
  if (connectionResult.success && authResult.success) {
    console.log('\n🎉 ALL TESTS PASSED! Firebase is properly connected.');
  } else {
    console.log('\n❌ SOME TESTS FAILED. Check the detailed output above for solutions.');
  }
  
  return {
    firestore: connectionResult,
    auth: authResult
  };
}

// Auto-run tests if this file is executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  runAllTests().catch(console.error);
}
