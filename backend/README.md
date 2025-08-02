# TSW Fantasy League Backend API

A complete fantasy sports backend application built with Node.js, Express, and MongoDB. Features secure authentication, team management, player transfers, chips system, and comprehensive game mechanics.

## 🎯 Features

### Core Game Mechanics
- **Team Formation**: 5 starters (1 GK, 2 CDM, 1 LW, 1 RW) + 2 substitutes
- **Budget System**: €150M budget with dynamic player pricing
- **Transfer System**: 1 free transfer per gameweek, -4 points for extras
- **Captain System**: Double points for captain, 1.5x for both captains playing
- **Chips System**: Wildcard, Triple Captain, Bench Boost, Free Hit (once per season)

### Technical Features
- **Authentication**: JWT-based with bcrypt password hashing
- **Data Validation**: Comprehensive input validation with Joi
- **Rate Limiting**: Configurable request limiting
- **Game Lock**: Prevents changes 60 minutes before matches
- **Real-time Scoring**: Advanced scoring system with position-based points
- **Security**: Helmet.js, CORS, sanitization, and MongoDB injection protection

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone and install dependencies**:
```bash
cd backend
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start MongoDB** (if running locally):
```bash
mongod
```

4. **Run the application**:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:4000`

## 📋 Environment Configuration

```env
# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/tsw-fantasy-league

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Server Configuration
PORT=4000
NODE_ENV=development

# Game Settings
BUDGET_LIMIT=150
TRANSFER_COST_POINTS=4
GAME_LOCK_MINUTES=60

# Rate Limiting
MAX_REQUESTS_PER_MINUTE=100

# Security
BCRYPT_ROUNDS=12
```

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

## 📚 API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/signup
Content-Type: application/json

{
  "username": "johndoe",
  "password": "mypassword",
  "email": "john@example.com"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "mypassword"
}
```

### Team Management

#### Create Team
```http
POST /api/team/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Dream Team",
  "starters": ["playerId1", "playerId2", "playerId3", "playerId4", "playerId5"],
  "subs": ["playerId6", "playerId7"],
  "captain": "playerId1",
  "viceCaptain": "playerId2"
}
```

#### Get Team Dashboard
```http
GET /api/team/dashboard
Authorization: Bearer <token>
```

### Player Market

#### Get Players with Filters
```http
GET /api/players?position=GK&available=true&sortBy=overall&page=1&limit=20
Authorization: Bearer <token>
```

#### Search Players
```http
GET /api/players/search/messi?available=true&limit=5
Authorization: Bearer <token>
```

### Transfers

#### Buy Player
```http
POST /api/team/buy
Authorization: Bearer <token>
Content-Type: application/json

{
  "playerId": "newPlayerId",
  "replacementId": "oldPlayerId"
}
```

#### Sell Player
```http
POST /api/team/sell
Authorization: Bearer <token>
Content-Type: application/json

{
  "playerId": "playerToSellId"
}
```

### Chips System

#### Use Chip
```http
POST /api/chips/use
Authorization: Bearer <token>
Content-Type: application/json

{
  "chipType": "wildcard"
}
```

#### Get Available Chips
```http
GET /api/chips/available
Authorization: Bearer <token>
```

### Inbox & Notifications

#### Get Inbox Messages
```http
GET /api/inbox?type=pack&isRead=false&page=1&limit=10
Authorization: Bearer <token>
```

#### Claim Reward
```http
POST /api/inbox/{messageId}/claim-reward
Authorization: Bearer <token>
```

### Support Tickets

#### Create Ticket
```http
POST /api/tickets
Authorization: Bearer <token>
Content-Type: application/json

{
  "subject": "Login Issue",
  "description": "I cannot log into my account",
  "category": "technical",
  "priority": "high"
}
```

#### Reply to Ticket
```http
POST /api/tickets/{ticketId}/reply
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "Thank you for your help!"
}
```

## 🎮 Game Rules

### Team Composition
- **Starters**: 1 Goalkeeper (GK), 2 Central Defensive Midfielders (CDM), 1 Left Winger (LW), 1 Right Winger (RW)
- **Substitutes**: 1 Defender (GK or CDM), 1 Attacker (LW or RW)
- **Budget**: Maximum €150M for entire team

### Scoring System
| Action | GK/CDM Points | LW/RW Points |
|--------|---------------|--------------|
| Goal | 5 | 4 |
| Assist | 3 | 2 |
| Save | 0.5/1 | 1 |
| Clean Sheet | 5/4 | 0 |
| Own Goal | -2 | -2 |

### Captain Multipliers
- **Captain**: 2x points (3x with Triple Captain chip)
- **Vice-Captain**: 2x points if captain doesn't play, 1.5x if both play

### Transfer Rules
- **Free Transfers**: 1 per gameweek
- **Additional Transfers**: -4 points each
- **Game Lock**: No transfers 60 minutes before first match

### Chips (One per season)
- **Wildcard**: Unlimited transfers with no point deduction
- **Triple Captain**: Captain scores triple points
- **Bench Boost**: Bench players' points count
- **Free Hit**: Unlimited transfers, team reverts next gameweek

## 🧪 Example API Calls with curl

### Complete User Journey

1. **Register a new user**:
```bash
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123",
    "email": "test@example.com"
  }'
```

2. **Login and get token**:
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

3. **Get available players**:
```bash
curl -X GET "http://localhost:4000/api/players/available" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

4. **Create a team**:
```bash
curl -X POST http://localhost:4000/api/team/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Team",
    "starters": ["playerId1", "playerId2", "playerId3", "playerId4", "playerId5"],
    "subs": ["playerId6", "playerId7"],
    "captain": "playerId1",
    "viceCaptain": "playerId2"
  }'
```

5. **Get team dashboard**:
```bash
curl -X GET http://localhost:4000/api/team/dashboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

6. **Use a chip**:
```bash
curl -X POST http://localhost:4000/api/chips/use \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"chipType": "wildcard"}'
```

## 🗂️ Project Structure

```
backend/
├── models/              # Mongoose schemas
│   ├── User.js         # User accounts
│   ├── Player.js       # Player database
│   ├── Team.js         # User teams
│   ├── Inbox.js        # Notifications
│   └── Ticket.js       # Support tickets
├── routes/              # Express routes
│   ├── auth.js         # Authentication
│   ├── team.js         # Team management
│   ├── player.js       # Player market
│   ├── chips.js        # Chips system
│   ├── inbox.js        # Notifications
│   └── ticket.js       # Support system
├── middleware/          # Custom middleware
│   ├── auth.js         # JWT authentication
│   └── validate.js     # Input validation
├── utils/               # Utility functions
│   ├── seedPlayers.js  # Database seeding
│   ├── gameLock.js     # Game timing
│   └── scoring.js      # Points calculation
├── players.js           # Player database
├── app.js              # Main application
├── package.json        # Dependencies
└── .env.example        # Environment template
```

## 🔧 Database Schema

### User Collection
```javascript
{
  username: String (unique),
  password: String (hashed),
  email: String (optional),
  team: ObjectId (ref: Team),
  inbox: [ObjectId] (ref: Inbox),
  tickets: [ObjectId] (ref: Ticket),
  isActive: Boolean,
  lastActive: Date
}
```

### Player Collection
```javascript
{
  name: String,
  position: String (GK|CDM|LW|RW),
  region: String,
  price: Number,
  overall: Number (1-100),
  owner: ObjectId (ref: Team),
  weeklyStats: {
    goals: Number,
    assists: Number,
    saves: Number,
    cleanSheet: Boolean,
    ownGoals: Number,
    played: Boolean,
    points: Number
  },
  seasonStats: { /* season totals */ }
}
```

### Team Collection
```javascript
{
  user: ObjectId (ref: User),
  name: String,
  budget: Number,
  points: Number,
  players: [ObjectId] (ref: Player),
  starters: [ObjectId] (ref: Player),
  subs: [ObjectId] (ref: Player),
  captain: ObjectId (ref: Player),
  viceCaptain: ObjectId (ref: Player),
  chips: {
    wildcard: Boolean,
    tripleCaptain: Boolean,
    benchBoost: Boolean,
    freeHit: Boolean
  },
  transfers: {
    free: Number,
    made: Number,
    cost: Number
  }
}
```

## 🛡️ Security Features

- **Password Hashing**: bcrypt with configurable rounds
- **JWT Tokens**: Secure token-based authentication
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Joi schema validation
- **SQL Injection Protection**: MongoDB native protection
- **CORS Configuration**: Configurable cross-origin policies
- **Helmet.js**: Security headers
- **Error Handling**: Secure error messages

## 🚀 Deployment

### Production Checklist

1. **Set secure environment variables**:
   - Strong JWT_SECRET
   - Production MongoDB URI
   - Appropriate CORS origins

2. **Enable production optimizations**:
   ```bash
   NODE_ENV=production
   ```

3. **Set up MongoDB Atlas** (recommended for production)

4. **Configure reverse proxy** (nginx recommended)

5. **Set up SSL/TLS certificates**

6. **Enable MongoDB replica set** for production reliability

## 🧪 Testing

### Manual Testing
```bash
# Run the health check
curl http://localhost:4000/api/health

# Test authentication flow
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'
```

### Load Testing
Use tools like Apache Bench or Artillery for load testing:
```bash
# Example with Apache Bench
ab -n 1000 -c 10 http://localhost:4000/api/health
```

## 📊 Monitoring

### Health Checks
- **API Health**: `GET /api/health`
- **Database**: Connection status in health endpoint
- **Game State**: Current gameweek and lock status

### Logging
- Request logging with timestamps
- Error logging with stack traces
- Authentication attempts
- Transfer activities

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Important Notes

- **Security**: Change default JWT_SECRET in production
- **Database**: Use MongoDB Atlas or properly secured MongoDB instance
- **Rate Limiting**: Adjust limits based on your needs
- **Monitoring**: Set up proper logging and monitoring in production
- **Backups**: Implement regular database backups

---

## 🆘 Support

For technical support or questions:
1. Check the API documentation at `/api/docs`
2. Review the health check at `/api/health`
3. Create a support ticket through the API
4. Check the GitHub issues page

**Happy coding! 🎮⚽**
