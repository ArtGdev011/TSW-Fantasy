# TSW Fantasy League

A full-stack fantasy league application for The Secret World (TSW) built with React frontend and Node.js/Express backend with MongoDB.

## 🚀 Features

- **User Authentication**: Session-based authentication with MongoDB
- **Team Management**: Create and manage fantasy teams
- **Player Database**: Comprehensive TSW player statistics and data
- **Real-time Updates**: Live player stats and team performance
- **Responsive Design**: Premium dark theme optimized for all devices
- **MongoDB Integration**: Complete data persistence with no localStorage dependencies

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Axios** for API calls
- **React Router** for navigation
- **React Hot Toast** for notifications

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Express Session** for authentication
- **bcrypt** for password hashing
- **CORS** enabled for cross-origin requests

## 📁 Project Structure

```
myriad-frontend/
├── backend/                 # Node.js/Express backend
│   ├── middleware/         # Authentication middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   ├── app.js             # Main server file
│   └── package.json       # Backend dependencies
├── frontend/              # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API services
│   │   ├── styles/        # CSS and styling
│   │   └── App.tsx        # Main app component
│   └── package.json       # Frontend dependencies
├── package.json           # Root package.json
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ArtGdev011/TSW-Fantasy.git
   cd TSW-Fantasy
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # In backend directory
   cp .env.example .env
   # Edit .env with your MongoDB connection string and other config
   ```

4. **Start the application**
   ```bash
   # Start backend (from backend directory)
   npm start
   # Backend runs on http://localhost:4000
   
   # Start frontend (from frontend directory, in new terminal)
   npm start
   # Frontend runs on http://localhost:3000
   ```

## 🔧 Configuration

### Environment Variables (Backend)

Create a `.env` file in the backend directory:

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/tsw-fantasy
SESSION_SECRET=your-secret-key-here
NODE_ENV=development
```

### Database Setup

The application uses MongoDB. Make sure MongoDB is running and accessible via the connection string in your `.env` file.

## 📋 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify session

### Teams
- `GET /api/teams` - Get user teams
- `POST /api/teams` - Create new team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

### Players
- `GET /api/players` - Get all players
- `GET /api/players/available` - Get available players

## 🎨 UI Features

- **Dark Theme**: Premium dark theme throughout the application
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Interactive Components**: Hover effects, animations, and transitions
- **Form Validation**: Client and server-side validation
- **Loading States**: Proper loading indicators and error handling

## 🔐 Security Features

- **Session-based Authentication**: Secure HTTP-only cookies
- **Password Hashing**: bcrypt for secure password storage
- **CORS Protection**: Configured for secure cross-origin requests
- **Input Validation**: Server-side validation for all inputs
- **Environment Variables**: Sensitive data stored in environment variables

## 🚀 Deployment

### Development
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm start
```

### Production
```bash
# Build frontend
cd frontend && npm run build

# Start production server
cd backend && npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**ArtGdev011**
- GitHub: [@ArtGdev011](https://github.com/ArtGdev011)

## 🙏 Acknowledgments

- The Secret World community
- React and Node.js communities
- MongoDB team for excellent documentation
- Tailwind CSS for the styling framework

---

**Note**: This is a fantasy league application for The Secret World game. Make sure you have the necessary permissions and follow the game's terms of service when using player data.
