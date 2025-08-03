#!/usr/bin/env node

/**
 * TSW Fantasy League Development CLI - Firebase Edition
 * 
 * Helpful commands for development and testing
 * Usage: node dev-tools.js <command> [options]
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { db } from './config/firebase.js';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const error = (message) => log(`❌ ${message}`, 'red');
const success = (message) => log(`✅ ${message}`, 'green');
const info = (message) => log(`ℹ️ ${message}`, 'blue');
const warning = (message) => log(`⚠️ ${message}`, 'yellow');

// Available commands
const commands = {
  start: {
    description: 'Start the development server with auto-reload',
    action: startDev
  },
  test: {
    description: 'Run the comprehensive API test suite',
    action: runTests
  },
  seed: {
    description: 'Seed the database with initial data',
    action: seedDatabase
  },
  'db:reset': {
    description: 'Reset the database (WARNING: Destroys all data)',
    action: resetDatabase
  },
  'db:backup': {
    description: 'Create a backup of the current database',
    action: backupDatabase
  },
  'db:restore': {
    description: 'Restore database from backup',
    action: restoreDatabase
  },
  'users:list': {
    description: 'List all users in the database',
    action: listUsers
  },
  'users:create': {
    description: 'Create a new test user',
    action: createTestUser
  },
  'teams:list': {
    description: 'List all teams with basic info',
    action: listTeams
  },
  'players:stats': {
    description: 'Show player statistics and distribution',
    action: showPlayerStats
  },
  'logs:clear': {
    description: 'Clear application logs',
    action: clearLogs
  },
  'env:check': {
    description: 'Check environment configuration',
    action: checkEnvironment
  },
  help: {
    description: 'Show this help message',
    action: showHelp
  }
};

// Command implementations
async function startDev() {
  info('Starting development server with nodemon...');
  
  // Check if nodemon is installed
  try {
    require.resolve('nodemon');
  } catch (e) {
    warning('nodemon not found. Installing...');
    await runCommand('npm', ['install', '--save-dev', 'nodemon']);
  }
  
  const nodemon = spawn('npx', ['nodemon', 'app.js'], {
    stdio: 'inherit',
    shell: true
  });
  
  nodemon.on('error', (err) => {
    error(`Failed to start nodemon: ${err.message}`);
  });
}

async function runTests() {
  info('Running comprehensive API test suite...');
  
  // Check if server is running
  const axios = require('axios');
  try {
    await axios.get('http://localhost:4000/api/health', { timeout: 2000 });
    success('Server is running, starting tests...');
  } catch (e) {
    error('Server is not running. Please start the server first with: npm start');
    return;
  }
  
  const testProcess = spawn('node', ['test-api.js'], {
    stdio: 'inherit',
    shell: true
  });
  
  testProcess.on('exit', (code) => {
    if (code === 0) {
      success('All tests passed!');
    } else {
      error('Some tests failed.');
    }
  });
}

async function seedDatabase() {
  info('Seeding Firebase database with initial data...');
  
  try {
    const { Player } = await import('./models/PlayerFirebase.js');
    
    // Create sample players in Firebase
    const samplePlayers = [
      { name: 'Lionel Messi', position: 'RW', rating: 95, price: 40, team: 'Inter Miami' },
      { name: 'Cristiano Ronaldo', position: 'LW', rating: 93, price: 38, team: 'Al Nassr' },
      { name: 'Kylian Mbappe', position: 'LW', rating: 91, price: 35, team: 'PSG' },
      { name: 'Erling Haaland', position: 'CDM', rating: 90, price: 32, team: 'Man City' },
      { name: 'Jan Oblak', position: 'GK', rating: 89, price: 25, team: 'Atletico Madrid' }
    ];
    
    for (const playerData of samplePlayers) {
      await Player.create(playerData);
      success(`Created player: ${playerData.name}`);
    }
    
    success('Firebase database seeded successfully!');
  } catch (err) {
    error(`Seeding failed: ${err.message}`);
  }
}

async function resetDatabase() {
  warning('⚠️ This will DELETE ALL DATA in Firebase!');
  
  // Simple confirmation (in a real CLI, you'd use a proper prompt library)
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question('Type "CONFIRM" to proceed: ', async (answer) => {
      rl.close();
      
      if (answer !== 'CONFIRM') {
        info('Firebase reset cancelled.');
        return resolve();
      }
      
      try {
        // Delete all collections in Firebase
        const collections = ['users', 'players', 'teams', 'leagues', 'gameweeks', 'transfers'];
        
        for (const collectionName of collections) {
          const collectionRef = collection(db, collectionName);
          const snapshot = await getDocs(collectionRef);
          
          let deletedCount = 0;
          for (const docSnapshot of snapshot.docs) {
            await deleteDoc(doc(db, collectionName, docSnapshot.id));
            deletedCount++;
          }
          
          if (deletedCount > 0) {
            info(`Deleted ${deletedCount} documents from ${collectionName}`);
          }
        }
        
        success('Firebase database reset complete!');
        info('Run "node dev-tools.js seed" to add initial data.');
      } catch (err) {
        error(`Reset failed: ${err.message}`);
      }
      
      resolve();
    });
  });
}

async function backupDatabase() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  const backupFile = path.join(backupDir, `firebase-backup-${timestamp}.json`);
  
  info('Creating Firebase database backup...');
  
  try {
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    const collections = ['users', 'players', 'teams', 'leagues', 'gameweeks', 'transfers'];
    const backup = {};
    
    for (const collectionName of collections) {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(collectionRef);
      const documents = [];
      
      snapshot.docs.forEach(doc => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      backup[collectionName] = documents;
      info(`Backed up ${documents.length} documents from ${collectionName}`);
    }
    
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    success(`Firebase backup created: ${backupFile}`);
    
  } catch (err) {
    error(`Backup failed: ${err.message}`);
  }
}

async function restoreDatabase() {
  const backupDir = path.join(process.cwd(), 'backups');
  
  if (!fs.existsSync(backupDir)) {
    error('No backups directory found. Create a backup first.');
    return;
  }
  
  const backups = fs.readdirSync(backupDir).filter(f => f.endsWith('.json'));
  
  if (backups.length === 0) {
    error('No backup files found.');
    return;
  }
  
  info('Available backups:');
  backups.forEach((backup, index) => {
    log(`${index + 1}. ${backup}`, 'cyan');
  });
  
  // In a real implementation, you'd use a proper prompt
  const latestBackup = backups[backups.length - 1];
  const backupFile = path.join(backupDir, latestBackup);
  
  info(`Restoring from: ${latestBackup}`);
  
  try {
    const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
    
    for (const [collectionName, documents] of Object.entries(backup)) {
      if (documents.length > 0) {
        for (const docData of documents) {
          const { id, ...data } = docData;
          await setDoc(doc(db, collectionName, id), data);
        }
        info(`Restored ${documents.length} documents to ${collectionName}`);
      }
    }
    
    success('Firebase database restored successfully!');
  } catch (err) {
    error(`Restore failed: ${err.message}`);
  }
}

async function listUsers() {
  info('Fetching users from Firebase...');
  
  try {
    const { User } = await import('./models/User.js');
    
    const users = await User.findAll();
    
    if (users.length === 0) {
      info('No users found.');
      return;
    }
    
    log('\n📋 Users:', 'bright');
    users.forEach(user => {
      log(`• ${user.username} (${user.email || 'no email'}) - Role: ${user.role || 'user'} - Created: ${new Date(user.createdAt).toLocaleDateString()}`, 'cyan');
    });
    
    success(`Total: ${users.length} users`);
  } catch (err) {
    error(`Failed to list users: ${err.message}`);
  }
}

async function createTestUser() {
  const username = `testuser_${Date.now()}`;
  const password = 'password123';
  const email = `${username}@test.com`;
  
  info(`Creating test user: ${username}`);
  
  try {
    const { User } = await import('./models/User.js');
    
    const userData = {
      username,
      email,
      password, // User model will handle hashing
      role: 'user',
      isActive: true
    };
    
    const user = await User.create(userData);
    
    success(`Test user created:`);
    log(`Username: ${username}`, 'cyan');
    log(`Password: ${password}`, 'cyan');
    log(`Email: ${email}`, 'cyan');
    log(`Firebase ID: ${user.id}`, 'cyan');
    
  } catch (err) {
    error(`Failed to create test user: ${err.message}`);
  }
}

async function listTeams() {
  info('Fetching teams from Firebase...');
  
  try {
    const teamsRef = collection(db, 'teams');
    const q = query(teamsRef, orderBy('totalPoints', 'desc'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      info('No teams found.');
      return;
    }
    
    log('\n🏆 Teams (sorted by points):', 'bright');
    const teams = [];
    snapshot.docs.forEach((doc, index) => {
      const team = { id: doc.id, ...doc.data() };
      teams.push(team);
      log(`${index + 1}. ${team.name} - ${team.username || 'Unknown'} - €${team.budget || 0}M - ${team.totalPoints || 0} pts`, 'cyan');
    });
    
    success(`Total: ${teams.length} teams`);
  } catch (err) {
    error(`Failed to list teams: ${err.message}`);
  }
}

async function showPlayerStats() {
  info('Analyzing player statistics from Firebase...');
  
  try {
    const { Player } = await import('./models/PlayerFirebase.js');
    
    const players = await Player.findAll();
    const stats = {
      total: players.length,
      byPosition: {},
      byOwnership: { owned: 0, available: 0 },
      priceRanges: { '0-20': 0, '21-40': 0, '41+': 0 },
      topScorers: []
    };
    
    players.forEach(player => {
      // Position distribution
      stats.byPosition[player.position] = (stats.byPosition[player.position] || 0) + 1;
      
      // Ownership
      if (player.isAvailable === false) {
        stats.byOwnership.owned++;
      } else {
        stats.byOwnership.available++;
      }
      
      // Price ranges
      if (player.price <= 20) stats.priceRanges['0-20']++;
      else if (player.price <= 40) stats.priceRanges['21-40']++;
      else stats.priceRanges['41+']++;
    });
    
    // Top scorers
    stats.topScorers = players
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 5)
      .map(p => ({ name: p.name, position: p.position, points: p.points || 0 }));
    
    log('\n📊 Player Statistics:', 'bright');
    log(`Total Players: ${stats.total}`, 'cyan');
    
    log('\nBy Position:', 'yellow');
    Object.entries(stats.byPosition).forEach(([pos, count]) => {
      log(`  ${pos}: ${count}`, 'cyan');
    });
    
    log('\nOwnership:', 'yellow');
    log(`  Owned: ${stats.byOwnership.owned}`, 'cyan');
    log(`  Available: ${stats.byOwnership.available}`, 'cyan');
    
    log('\nPrice Distribution (€M):', 'yellow');
    Object.entries(stats.priceRanges).forEach(([range, count]) => {
      log(`  ${range}: ${count}`, 'cyan');
    });
    
    log('\nTop Scorers:', 'yellow');
    stats.topScorers.forEach((player, index) => {
      log(`  ${index + 1}. ${player.name} (${player.position}) - ${player.points} pts`, 'cyan');
    });
    
  } catch (err) {
    error(`Failed to analyze players: ${err.message}`);
  }
}

async function clearLogs() {
  const logDir = path.join(process.cwd(), 'logs');
  
  if (!fs.existsSync(logDir)) {
    info('No logs directory found.');
    return;
  }
  
  try {
    const logFiles = fs.readdirSync(logDir);
    
    for (const file of logFiles) {
      fs.unlinkSync(path.join(logDir, file));
    }
    
    success(`Cleared ${logFiles.length} log files.`);
  } catch (err) {
    error(`Failed to clear logs: ${err.message}`);
  }
}

async function checkEnvironment() {
  info('Checking Firebase environment configuration...');
  
  const requiredEnvVars = [
    'JWT_SECRET',
    'PORT'
  ];
  
  const optionalEnvVars = [
    'NODE_ENV',
    'MAX_REQUESTS_PER_MINUTE',
    'CORS_ORIGINS'
  ];
  
  log('\n🔧 Environment Variables:', 'bright');
  
  // Check required variables
  log('\nRequired:', 'yellow');
  requiredEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      log(`  ✅ ${varName}: ${varName === 'JWT_SECRET' ? '[HIDDEN]' : value}`, 'green');
    } else {
      log(`  ❌ ${varName}: Not set`, 'red');
    }
  });
  
  // Check optional variables
  log('\nOptional:', 'yellow');
  optionalEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      log(`  ✅ ${varName}: ${value}`, 'green');
    } else {
      log(`  ⚪ ${varName}: Using default`, 'cyan');
    }
  });
  
  // Check Firebase config
  try {
    const { db, auth } = await import('./config/firebase.js');
    if (db && auth) {
      success('\n✅ Firebase configuration loaded successfully');
      log('  - Firestore: ✅ Connected', 'green');
      log('  - Authentication: ✅ Connected', 'green');
    } else {
      warning('\n⚠️ Firebase configuration issue detected');
    }
  } catch (err) {
    error(`\n❌ Firebase configuration error: ${err.message}`);
  }
  
  // Check .env file
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    success('\n✅ .env file found');
  } else {
    warning('\n⚠️ .env file not found. Copy .env.example to .env');
  }
  
  // Check package.json
  const packagePath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packagePath)) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    success(`\n✅ Package: ${pkg.name} v${pkg.version}`);
    log(`  - Type: ${pkg.type || 'commonjs'} (should be "module" for Firebase)`, pkg.type === 'module' ? 'green' : 'yellow');
  }
}

function showHelp() {
  log('\n� TSW Fantasy League Development Tools - Firebase Edition', 'bright');
  log('\nAvailable commands:', 'yellow');
  
  Object.entries(commands).forEach(([cmd, info]) => {
    log(`  ${cmd.padEnd(15)} - ${info.description}`, 'cyan');
  });
  
  log('\nUsage: node dev-tools.js <command>', 'bright');
  log('Example: node dev-tools.js start', 'cyan');
  log('\n🔥 Now powered by Firebase instead of MongoDB!', 'green');
}

// Utility functions
async function runCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { stdio: 'inherit', shell: true });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    process.on('error', reject);
  });
}

// Main execution
async function main() {
  const command = process.argv[2];
  
  if (!command || command === 'help') {
    showHelp();
    return;
  }
  
  if (!commands[command]) {
    error(`Unknown command: ${command}`);
    log('Run "node dev-tools.js help" to see available commands.', 'cyan');
    return;
  }
  
  try {
    await commands[command].action();
  } catch (err) {
    error(`Command failed: ${err.message}`);
    process.exit(1);
  }
}

// Use ES6 import.meta instead of require.main
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
