#!/bin/bash

echo "🚀 Building frontend and backend..."

# Go to root directory
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Build frontend
echo "🔨 Building frontend..."
npm run build

# Go back to server directory
cd server

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

echo "✅ Build complete!"
