// MongoDB initialization script for Docker
// This script runs when the MongoDB container starts for the first time

db = db.getSiblingDB('tsw-fantasy-league');

// Create application user with limited permissions
db.createUser({
  user: 'tswapp',
  pwd: 'tswapp123',
  roles: [
    {
      role: 'readWrite',
      db: 'tsw-fantasy-league'
    }
  ]
});

// Create indexes for better performance
db.users.createIndex({ username: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { sparse: true });

db.players.createIndex({ position: 1 });
db.players.createIndex({ name: 1 });
db.players.createIndex({ owner: 1 });
db.players.createIndex({ price: 1 });

db.teams.createIndex({ user: 1 }, { unique: true });
db.teams.createIndex({ totalPoints: -1 });
db.teams.createIndex({ name: 1 });

db.tickets.createIndex({ user: 1 });
db.tickets.createIndex({ ticketId: 1 }, { unique: true });
db.tickets.createIndex({ status: 1 });
db.tickets.createIndex({ category: 1 });
db.tickets.createIndex({ createdAt: -1 });

db.inboxes.createIndex({ user: 1 });
db.inboxes.createIndex({ read: 1 });
db.inboxes.createIndex({ createdAt: -1 });

print('✅ TSW Fantasy League database initialized successfully');
print('✅ Created indexes for optimal performance');
print('✅ Created application user with restricted permissions');
