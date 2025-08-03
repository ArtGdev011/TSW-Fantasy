// Simple Firebase Connection Test
import { db, auth } from './config/firebase.js';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';

console.log('🚀 Starting Simple Firebase Test...\n');

// Test basic connection
console.log('1️⃣ Firebase instances:');
console.log('- DB instance:', !!db ? '✅ Connected' : '❌ Missing');
console.log('- Auth instance:', !!auth ? '✅ Connected' : '❌ Missing');

// Test Firestore write/read
try {
  console.log('\n2️⃣ Testing Firestore operations...');
  
  // Write test
  const testRef = doc(db, 'test', 'simple-test');
  await setDoc(testRef, {
    message: 'Hello Firebase!',
    timestamp: new Date().toISOString(),
    test: true
  });
  console.log('✅ Write successful');
  
  // Read test
  const docSnap = await getDoc(testRef);
  if (docSnap.exists()) {
    console.log('✅ Read successful:', docSnap.data().message);
  } else {
    console.log('❌ Read failed - document not found');
  }
  
  console.log('\n🎉 Firebase is working perfectly!');
  process.exit(0);
  
} catch (error) {
  console.error('\n❌ Firebase test failed:');
  console.error('Code:', error.code);
  console.error('Message:', error.message);
  
  // Specific error handling
  if (error.code === 'permission-denied') {
    console.log('\n🔧 SOLUTION: Firestore Rules Issue');
    console.log('Deploy debug rules: firebase deploy --only firestore:rules');
  }
  
  if (error.code === 'unavailable') {
    console.log('\n🔧 SOLUTION: Network/Project Issue');
    console.log('Check internet connection and Firebase project status');
  }
  
  process.exit(1);
}
