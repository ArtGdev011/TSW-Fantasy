# Quick Start Guide - TSW Fantasy League Backend

## 🚀 Start in 30 seconds

1. **Install & Run**:
   ```bash
   cd backend
   npm install
   npm start
   ```

2. **Test the API**:
   ```bash
   # Health check
   curl http://localhost:4000/api/health
   
   # Register user
   curl -X POST http://localhost:4000/api/auth/signup \
        -H "Content-Type: application/json" \
        -d '{"username":"testuser","password":"password123"}'
   ```

3. **View Documentation**:
   - Open: http://localhost:4000/api/docs
   - Health: http://localhost:4000/api/health

## 🎯 Key Endpoints

```http
POST /api/auth/signup          # Create account
POST /api/auth/login           # Get JWT token
GET  /api/players/available    # Browse players
POST /api/team/create          # Create team
GET  /api/team/dashboard       # Team overview
```

## 🔑 Authentication

All protected endpoints require:
```
Authorization: Bearer <jwt_token>
```

## 🏆 Ready to build your fantasy league! 

**The backend is 100% complete and production-ready.**
