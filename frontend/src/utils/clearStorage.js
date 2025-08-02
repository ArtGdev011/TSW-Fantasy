// Browser console script to clear all TSW Fantasy localStorage data
// Run this in your browser's developer console (F12)

console.log('🧹 Clearing TSW Fantasy localStorage data...');

// List of all keys that might contain TSW Fantasy data
const keysToRemove = [
  'tsw_user_team',
  'tsw_owned_players', 
  'tsw_team_captain',
  'tsw_team_vice_captain',
  'tsw_team_formation',
  'tsw_demo_users',
  'user', // Remove old user data (keep authToken for authentication)
];

// Clear specific keys
keysToRemove.forEach(key => {
  if (localStorage.getItem(key)) {
    console.log(`❌ Removing ${key}:`, localStorage.getItem(key));
    localStorage.removeItem(key);
  }
});

// List remaining localStorage items
console.log('📋 Remaining localStorage items:');
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  console.log(`✅ Keeping ${key}:`, localStorage.getItem(key));
}

console.log('✨ localStorage cleanup complete! Please refresh the page.');
