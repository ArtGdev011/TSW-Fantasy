#!/bin/bash

# TSW Fantasy League Production Deployment Script
# Run this script to deploy the application

set -e

echo "🚀 Starting TSW Fantasy League deployment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if MongoDB is running
if ! command -v mongosh &> /dev/null && ! command -v mongo &> /dev/null; then
    echo "⚠️ MongoDB CLI not found. Make sure MongoDB is installed and running."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production

# Create necessary directories
mkdir -p logs backups

# Check environment file
if [ ! -f .env ]; then
    echo "⚠️ .env file not found. Copying from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✏️ Please edit .env file with your configuration before running the server."
    else
        echo "❌ No .env.example found. Please create .env file manually."
        exit 1
    fi
fi

# Start the application
echo "🎯 Starting TSW Fantasy League API..."

if [ "$NODE_ENV" = "production" ]; then
    # Production mode with PM2 (if available)
    if command -v pm2 &> /dev/null; then
        pm2 start app.js --name "tsw-fantasy-api"
        echo "✅ Application started with PM2"
    else
        echo "🔄 Starting in production mode..."
        NODE_ENV=production node app.js
    fi
else
    # Development mode
    npm start
fi

echo "✅ TSW Fantasy League API is running!"
echo "📖 Visit http://localhost:4000/api/docs for API documentation"
