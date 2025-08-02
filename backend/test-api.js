/**
 * TSW Fantasy League API Test Suite
 * 
 * Comprehensive testing for all API endpoints
 * Run with: node test-api.js
 */

const axios = require('axios');
const assert = require('assert');

// Configuration
const BASE_URL = 'http://localhost:4000/api';
const TEST_USER = {
  username: `test${Math.random().toString(36).substr(2, 8)}`,
  password: 'testpass123',
  email: `test${Math.random().toString(36).substr(2, 8)}@example.com`
};

let authToken = '';
let teamId = '';
let ticketId = '';
let playerId = '';

// Test utilities
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const emoji = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  console.log(`${timestamp} ${emoji} ${message}`);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// API client with error handling
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  validateStatus: () => true // Don't throw on HTTP errors
});

// Test runner
class APITester {
  constructor() {
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  async test(name, testFn) {
    this.totalTests++;
    try {
      log(`Running: ${name}`);
      await testFn();
      this.passedTests++;
      log(`✅ PASSED: ${name}`, 'success');
    } catch (error) {
      this.failedTests++;
      log(`❌ FAILED: ${name} - ${error.message}`, 'error');
      console.error(error.stack);
    }
  }

  printResults() {
    log(`\n📊 Test Results:`);
    log(`Total Tests: ${this.totalTests}`);
    log(`Passed: ${this.passedTests}`, 'success');
    log(`Failed: ${this.failedTests}`, this.failedTests > 0 ? 'error' : 'success');
    log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
  }
}

const tester = new APITester();

// Test functions
async function testHealthCheck() {
  const response = await api.get('/health');
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.data.status, 'healthy');
  assert(response.data.gameweek > 0);
}

async function testGameInfo() {
  const response = await api.get('/game-info');
  assert.strictEqual(response.status, 200);
  assert(typeof response.data.gameweek === 'number');
  assert(typeof response.data.isLocked === 'boolean');
  assert.strictEqual(response.data.season, '2024-25');
}

async function testPublicLeaderboard() {
  const response = await api.get('/leaderboard');
  assert.strictEqual(response.status, 200);
  assert(Array.isArray(response.data.teams));
  assert(response.data.teams.length >= 0);
}

async function testUserRegistration() {
  const response = await api.post('/auth/signup', TEST_USER);
  
  // Debug: log response if not successful
  if (response.status !== 201) {
    console.log('Registration failed:', response.status, response.data);
  }
  
  assert.strictEqual(response.status, 201);
  assert(response.data.token);
  assert.strictEqual(response.data.user.username, TEST_USER.username);
  authToken = response.data.token;
}

async function testUserLogin() {
  const response = await api.post('/auth/login', {
    username: TEST_USER.username,
    password: TEST_USER.password
  });
  assert.strictEqual(response.status, 200);
  assert(response.data.token);
  authToken = response.data.token;
}

async function testTokenVerification() {
  const response = await api.post('/auth/verify', {}, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.strictEqual(response.status, 200);
  assert(response.data.valid);
  assert.strictEqual(response.data.user.username, TEST_USER.username);
}

async function testGetAvailablePlayers() {
  const response = await api.get('/players/available', {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.strictEqual(response.status, 200);
  assert(response.data.players);
  assert(response.data.players.GK.length > 0);
  assert(response.data.players.CDM.length > 0);
  assert(response.data.players.LW.length > 0);
  assert(response.data.players.RW.length > 0);
  
  // Store a player ID for later tests
  playerId = response.data.players.GK[0]._id;
}

async function testPlayerSearch() {
  const response = await api.get('/players/search/messi', {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.strictEqual(response.status, 200);
  assert(Array.isArray(response.data.players));
}

async function testPlayersByPosition() {
  const response = await api.get('/players/position/GK', {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.strictEqual(response.status, 200);
  assert(Array.isArray(response.data.players));
  assert(response.data.players.every(p => p.position === 'GK'));
}

async function testPlayerDetails() {
  if (!playerId) throw new Error('No player ID available');
  
  const response = await api.get(`/players/${playerId}`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.data.player._id, playerId);
  assert(response.data.player.name);
  assert(response.data.player.position);
}

async function testCreateTeam() {
  // First get available players
  const playersResponse = await api.get('/players/available', {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  const players = playersResponse.data.players;
  
  const teamData = {
    name: 'Test Team',
    starters: [
      players.GK[0]._id,
      players.CDM[0]._id,
      players.CDM[1]._id,
      players.LW[0]._id,
      players.RW[0]._id
    ],
    subs: [
      players.GK[1]._id,
      players.LW[1]._id
    ],
    captain: players.LW[0]._id,
    viceCaptain: players.RW[0]._id
  };
  
  const response = await api.post('/team/create', teamData, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  assert.strictEqual(response.status, 201);
  assert(response.data.team);
  assert.strictEqual(response.data.team.name, 'Test Team');
  teamId = response.data.team._id;
}

async function testTeamDashboard() {
  const response = await api.get('/team/dashboard', {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.strictEqual(response.status, 200);
  assert(response.data.team);
  assert(response.data.team.starters.length === 5);
  assert(response.data.team.subs.length === 2);
}

async function testAvailableChips() {
  const response = await api.get('/chips/available', {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.strictEqual(response.status, 200);
  assert(Array.isArray(response.data.chips));
  assert.strictEqual(response.data.chips.length, 4);
  assert(response.data.chips.every(chip => !chip.used));
}

async function testCreateTicket() {
  const ticketData = {
    subject: 'Test Support Request',
    message: 'This is a test support ticket',
    category: 'technical'
  };
  
  const response = await api.post('/tickets', ticketData, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  
  assert.strictEqual(response.status, 201);
  assert(response.data.ticket);
  assert.strictEqual(response.data.ticket.subject, ticketData.subject);
  ticketId = response.data.ticket.ticketId;
}

async function testGetTickets() {
  const response = await api.get('/tickets', {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.strictEqual(response.status, 200);
  assert(Array.isArray(response.data.tickets));
  assert(response.data.tickets.length >= 1);
}

async function testTicketDetails() {
  if (!ticketId) throw new Error('No ticket ID available');
  
  const response = await api.get(`/tickets/lookup/${ticketId}`, {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.strictEqual(response.status, 200);
  assert(response.data.ticket);
  assert.strictEqual(response.data.ticket.ticketId, ticketId);
}

async function testInboxMessages() {
  const response = await api.get('/inbox', {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.strictEqual(response.status, 200);
  assert(Array.isArray(response.data.messages));
}

async function testUnreadCount() {
  const response = await api.get('/inbox/unread', {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.strictEqual(response.status, 200);
  assert(typeof response.data.count === 'number');
}

async function testFullLeaderboard() {
  const response = await api.get('/leaderboard/full', {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.strictEqual(response.status, 200);
  assert(Array.isArray(response.data.teams));
}

async function testAPIDocumentation() {
  const response = await api.get('/docs');
  assert.strictEqual(response.status, 200);
  assert(response.data.title);
  assert(response.data.endpoints);
}

async function testInvalidEndpoint() {
  const response = await api.get('/invalid-endpoint');
  assert.strictEqual(response.status, 404);
  assert(response.data.error);
}

async function testUnauthorizedAccess() {
  const response = await api.get('/team/dashboard');
  assert.strictEqual(response.status, 401);
  assert(response.data.error);
}

// Rate limiting test
async function testRateLimiting() {
  log('Testing rate limiting (this may take a moment)...');
  
  const requests = Array(105).fill().map(() => 
    api.get('/health').catch(err => err.response)
  );
  
  const responses = await Promise.all(requests);
  const rateLimitedResponses = responses.filter(r => r.status === 429);
  
  assert(rateLimitedResponses.length > 0, 'Rate limiting should trigger after 100 requests');
}

// Main test execution
async function runAllTests() {
  log('🚀 Starting TSW Fantasy League API Test Suite\n');
  
  // Public endpoints (no auth required)
  await tester.test('Health Check', testHealthCheck);
  await tester.test('Game Info', testGameInfo);
  await tester.test('Public Leaderboard', testPublicLeaderboard);
  await tester.test('API Documentation', testAPIDocumentation);
  await tester.test('Invalid Endpoint', testInvalidEndpoint);
  await tester.test('Unauthorized Access', testUnauthorizedAccess);
  
  // Authentication flow
  await tester.test('User Registration', testUserRegistration);
  await tester.test('User Login', testUserLogin);
  await tester.test('Token Verification', testTokenVerification);
  
  // Player market
  await tester.test('Get Available Players', testGetAvailablePlayers);
  await tester.test('Player Search', testPlayerSearch);
  await tester.test('Players by Position', testPlayersByPosition);
  await tester.test('Player Details', testPlayerDetails);
  
  // Team management
  await tester.test('Create Team', testCreateTeam);
  await tester.test('Team Dashboard', testTeamDashboard);
  
  // Chips system
  await tester.test('Available Chips', testAvailableChips);
  
  // Support system
  await tester.test('Create Ticket', testCreateTicket);
  await tester.test('Get Tickets', testGetTickets);
  await tester.test('Ticket Details', testTicketDetails);
  
  // Inbox system
  await tester.test('Inbox Messages', testInboxMessages);
  await tester.test('Unread Count', testUnreadCount);
  
  // Authenticated endpoints
  await tester.test('Full Leaderboard', testFullLeaderboard);
  
  // Performance and security
  await tester.test('Rate Limiting', testRateLimiting);
  
  // Print final results
  tester.printResults();
  
  if (tester.failedTests === 0) {
    log('\n🎉 All tests passed! The API is working perfectly.', 'success');
  } else {
    log(`\n⚠️ ${tester.failedTests} test(s) failed. Please check the errors above.`, 'error');
    process.exit(1);
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'error');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`, 'error');
  console.error(error.stack);
  process.exit(1);
});

// Check if server is running before starting tests
async function checkServerHealth() {
  try {
    const response = await api.get('/health');
    if (response.status !== 200) {
      throw new Error(`Server returned status ${response.status}`);
    }
    log('✅ Server is running and healthy');
  } catch (error) {
    log('❌ Cannot connect to server. Please make sure the API server is running on http://localhost:4000', 'error');
    log('Run: npm start or node app.js', 'error');
    process.exit(1);
  }
}

// Start testing
(async () => {
  await checkServerHealth();
  await sleep(1000); // Give server a moment
  await runAllTests();
})();
