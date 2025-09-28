# Treasury Vault Timer

A real-time countdown timer that resets on Solana token purchases. Built with React, Socket.IO, and Solana Web3.js.

## Features

- **Real-time Purchase Detection**: Monitors Solana blockchain for actual token purchases (not transfers/airdrops)
- **Global Timer**: All users see the same timer state - persistent across sessions
- **Live Updates**: WebSocket connection for instant timer resets
- **Purchase Filtering**: Only detects genuine purchases (SOL spent or DEX interactions)
- **Start/Stop Monitoring**: Control API usage with monitoring controls

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + Socket.IO
- **Blockchain**: Solana Web3.js + Helius RPC
- **Real-time**: Socket.IO for bidirectional communication

## Quick Start

### Prerequisites

- Node.js 18+
- Helius API key (for Solana RPC)

### Local Development

1. **Clone and setup**:
   ```bash
   git clone <your-repo>
   cd fresh-project
   npm install
   cd server && npm install
   ```

2. **Start backend** (in server directory):
   ```bash
   cd server
   npm run dev
   ```

3. **Start frontend** (in root directory):
   ```bash
   npm run dev
   ```

4. **Access the app**:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001

## Deployment

### Backend Deployment (Render)

1. **Create Render account** at https://render.com

2. **Connect your GitHub repository**

3. **Create a new Web Service**:
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Environment Variables**:
     - `HELIUS_API_KEY`: Your Helius API key
     - `NODE_ENV`: `production`

4. **Deploy** and note your backend URL (e.g., `https://your-app.onrender.com`)

### Frontend Deployment (Vercel)

1. **Set environment variable**:
   - Create `.env` file in root directory:
   ```
   VITE_BACKEND_URL=https://your-backend-url.onrender.com
   ```

2. **Deploy to Vercel**:
   ```bash
   npx vercel --prod
   ```

3. **Set environment variable in Vercel**:
   - Go to your Vercel project settings
   - Add environment variable: `VITE_BACKEND_URL` = your backend URL

## Configuration

### Token Address

To change the monitored token, edit `server/index.js`:
```javascript
const REVS_TOKEN_ADDRESS = 'YOUR_TOKEN_ADDRESS_HERE';
```

### Helius API Key

Set your Helius API key in the backend environment variables or edit `server/index.js`:
```javascript
const HELIUS_API_KEY = process.env.HELIUS_API_KEY || 'YOUR_API_KEY';
```

## API Endpoints

- `GET /api/timer` - Get current timer state
- `GET /api/health` - Health check

## Socket.IO Events

- `timerState` - Initial timer state sent to new clients
- `timerUpdate` - Timer countdown updates
- `timerReset` - Timer reset due to purchase
- `timerExpired` - Timer has expired
- `monitoringState` - Monitoring start/stop status

## Environment Variables

### Frontend
- `VITE_BACKEND_URL` - Backend server URL

### Backend
- `HELIUS_API_KEY` - Helius RPC API key
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

## Troubleshooting

### Frontend not connecting to backend
- Check `VITE_BACKEND_URL` environment variable
- Ensure backend is running and accessible
- Check CORS settings in backend

### Timer not resetting
- Verify Helius API key is valid
- Check backend logs for purchase detection
- Ensure token address is correct

### Rate limiting
- Use start/stop monitoring to control API usage
- Consider upgrading Helius plan for higher limits

## License

MIT
# Production Deployment Trigger
# Vercel Redeploy Trigger
