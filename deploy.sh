#!/bin/bash

# Firebase Deployment Script for TSW Fantasy League
# This script handles building and deploying your entire Firebase project

echo "🔥 Starting Firebase deployment for TSW Fantasy League..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "🔑 Please login to Firebase first:"
    firebase login
fi

# Build the frontend
echo "🏗️  Building React frontend..."
cd frontend
npm install
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi

cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install

if [ $? -ne 0 ]; then
    echo "❌ Backend dependency installation failed!"
    exit 1
fi

cd ..

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."

# Deploy Firestore rules and indexes
echo "📋 Deploying Firestore rules and indexes..."
firebase deploy --only firestore

# Deploy Storage rules
echo "💾 Deploying Storage rules..."
firebase deploy --only storage

# Deploy Functions (backend)
echo "⚡ Deploying Firebase Functions..."
firebase deploy --only functions

# Deploy Hosting (frontend)
echo "🌐 Deploying to Firebase Hosting..."
firebase deploy --only hosting

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🔗 Your TSW Fantasy League is now live at:"
firebase hosting:channel:list
echo ""
echo "📊 View your Firebase Console:"
echo "https://console.firebase.google.com/project/tsw-fantasy"
echo ""
echo "🎉 Happy fantasy managing!"
