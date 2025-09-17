# Framer Embed Endpoints

Your backend now provides multiple embed endpoints that you can use directly in Framer. Each endpoint returns a self-contained HTML page with auto-refreshing data.

## Available Embed Endpoints

### 1. Timer Embed
**URL:** `https://treasury-vault-timer-backend.onrender.com/embed/timer`
- Shows the countdown timer (MM:SS format)
- Auto-refreshes every second
- Orange color with glow effect

### 2. Token Price Embed
**URL:** `https://treasury-vault-timer-backend.onrender.com/embed/price`
- Shows current RAY token price
- Auto-refreshes every 30 seconds
- Green color

### 3. Market Cap Embed
**URL:** `https://treasury-vault-timer-backend.onrender.com/embed/marketcap`
- Shows market cap in millions
- Auto-refreshes every 30 seconds
- Blue color

### 4. Last Buyer Embed
**URL:** `https://treasury-vault-timer-backend.onrender.com/embed/lastbuyer`
- Shows last buyer address (shortened)
- Shows purchase amount
- Auto-refreshes every 5 seconds
- Green/orange colors

### 5. Wallet Balances Embed
**URL:** `https://treasury-vault-timer-backend.onrender.com/embed/wallets`
- Shows total SOL and USD value of tracked wallets
- Auto-refreshes every 30 seconds
- Purple color

## API Endpoints (for custom integrations)

### Timer Data
- `GET /api/timer` - Current timer state
- `GET /api/dashboard` - All data combined

### Token Data
- `GET /api/token/price` - Token price and market cap
- `GET /api/token/data` - Token data + timer

### Wallet Data
- `GET /api/wallets` - All wallet balances

## How to Use in Framer

1. **Add an Embed component** in Framer
2. **Set the URL** to one of the embed endpoints above
3. **Configure the size** - each embed is responsive and will fill its container
4. **Set background to transparent** if you want the embed to blend with your design

## Configuration

### Adding Wallet Addresses
Edit the `TRACKED_WALLETS` array in `server/index.js`:
```javascript
const TRACKED_WALLETS = [
  'YOUR_ACTUAL_WALLET_ADDRESS_1',
  'YOUR_ACTUAL_WALLET_ADDRESS_2',
  // Add more wallet addresses
];
```

### Customizing Token
Change the `REVS_TOKEN_ADDRESS` in `server/index.js` to monitor a different token.

## Styling Notes

- All embeds have transparent backgrounds
- Font is Courier New (monospace)
- Colors are optimized for dark backgrounds
- Each embed is self-contained with its own refresh logic
- Responsive design that scales to container size

## Deployment

After making changes to the server code:
1. Commit and push to your GitHub repo
2. Render will automatically redeploy
3. Your Framer embeds will update automatically

## Example Framer Setup

1. Create a new Frame in Framer
2. Add an "Embed" component
3. Set the embed URL to: `https://treasury-vault-timer-backend.onrender.com/embed/timer`
4. Resize the frame to your desired dimensions
5. The timer will appear and update in real-time
