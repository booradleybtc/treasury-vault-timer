# Solana Countdown Timer

A beautiful React-based countdown timer that automatically resets when purchases are made on a specified Solana token. Built with modern web technologies and Solana Web3.js integration.

## Features

- ⏰ **1-Hour Countdown Timer**: Visual countdown with progress ring
- 🔄 **Auto-Reset**: Automatically resets when token purchases are detected
- 🎨 **Beautiful UI**: Modern glassmorphism design with smooth animations
- 🔗 **Wallet Integration**: Connect with Phantom, Solflare, and other Solana wallets
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⚡ **Real-time Monitoring**: Checks for new transactions every 30 seconds
- 🎯 **Manual Reset**: Option to manually reset the timer

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Build Tool**: Vite
- **Blockchain**: Solana Web3.js
- **Wallet**: Solana Wallet Adapter
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- A Solana wallet (Phantom, Solflare, etc.)

### Installation

1. **Clone and install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Open your browser:**
   Navigate to `http://localhost:3000`

### Usage

1. **Enter Token Contract**: Input the Solana SPL token mint address you want to monitor
2. **Connect Wallet**: Click the wallet button to connect your Solana wallet
3. **Start Timer**: The timer will begin counting down from 1 hour
4. **Auto-Monitoring**: The app automatically checks for new purchases every 30 seconds
5. **Manual Reset**: Use the "Manual Reset" button to reset the timer manually

## How It Works

### Timer Logic
- Starts at 1 hour (3600 seconds)
- Counts down every second
- Shows visual progress with animated ring
- Displays time in HH:MM:SS format

### Purchase Detection
- Monitors the specified token contract address
- Checks for recent transactions every 30 seconds
- Resets timer when new transactions are detected
- Works on Solana devnet, testnet, and mainnet

### Wallet Integration
- Supports multiple Solana wallets
- Uses Solana Wallet Adapter for seamless integration
- Auto-connects to previously connected wallet

## Configuration

### Network Selection
The app currently uses Solana devnet by default. To change networks, modify the `network` variable in `src/components/WalletProvider.tsx`:

```typescript
const network = WalletAdapterNetwork.Mainnet; // or Devnet, Testnet
```

### Monitoring Interval
To change how often the app checks for purchases, modify the interval in `src/components/CountdownTimer.tsx`:

```typescript
const interval = setInterval(monitorPurchases, 30000); // 30 seconds
```

## Project Structure

```
src/
├── components/
│   ├── CountdownTimer.tsx    # Main timer component
│   └── WalletProvider.tsx    # Solana wallet integration
├── App.tsx                   # Main app component
├── main.tsx                  # React entry point
└── index.css                 # Global styles
```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - feel free to use this project for your own purposes.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Note**: This is a demonstration project. For production use, consider implementing more robust transaction parsing and error handling.
