// Thin adapter — wire these to our existing endpoints only here.
export type Vault = {
  id: string;
  name: string;
  ticker?: string;
  verified?: boolean;
  addressShort: string;
  pfpUrl?: string;
  heroImageUrl?: string;
  timer: string;               // "54:24"
  endgameDays: number;         // 95
  lastBuyerShort?: string;     // "58gB...Zv56"
  // Stats (top/right on hero in home; here shown in cards)
  price?: string;              // "$0.0007"
  marketCap?: string;          // "$1.2M"
  // Treasury summary (Vault card)
  treasuryAmount: string;      // "17,204,455.31"
  treasuryAsset: string;       // "REVS"
  bidWin: string;              // "100×"
  // Airdrops panel
  airdrop: {
    nextIn: string;            // "14:15:38" (HH:MM:SS)
    pool: string;              // "$42,560"
    holdRequired: string;      // "200,000"
    totalAirdropped: string;   // "$1.23M"
    apy?: string;              // "164%"
    winnersPerDay?: string;    // "50 winners/day"
  };
  // Info panel
  info: Array<{ k: string; v: string }>;
  // Chart
  priceSeries?: number[];      // normalized or raw; UI will normalize
};

const API = process.env.NEXT_PUBLIC_BACKEND_URL || "https://treasury-vault-timer-backend.onrender.com";

export async function getVault(id: string): Promise<Vault> {
  try {
    // Fetch real data from Render backend
    const response = await fetch(`${API}/api/vault/${id}/config`);
    if (!response.ok) {
      throw new Error(`Failed to fetch vault: ${response.status}`);
    }
    
    const data = await response.json();
    const vault = data.vault;
    
    // Transform backend data to frontend format
    return {
      id: vault.id,
      name: vault.name,
      ticker: vault.meta?.ticker || "REVS",
      verified: vault.status === 'active' || vault.status === 'vault_live',
      addressShort: vault.tokenMint ? `${vault.tokenMint.slice(0,3)}...${vault.tokenMint.slice(-4)}` : "N/A",
      pfpUrl: vault.meta?.logoUrl || "https://images.unsplash.com/photo-1542219550-37153d387c37?q=80&w=512&auto=format&fit=crop",
      heroImageUrl: vault.meta?.bannerUrl || "https://images.unsplash.com/photo-1482192505345-5655af888cc4?q=80&w=1600&auto=format&fit=crop",
      timer: "54:24", // TODO: Get from timer API
      endgameDays: vault.endgameDate ? Math.ceil((new Date(vault.endgameDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0,
      lastBuyerShort: "58gB...Zv56", // TODO: Get from timer API
      price: "$0.0007", // TODO: Get from token API
      marketCap: "$1.2M", // TODO: Get from token API
      treasuryAmount: "17,204,455.31", // TODO: Get from dashboard API
      treasuryAsset: vault.vaultAsset || "SOL",
      bidWin: "100×", // TODO: Get from vault meta
      airdrop: {
        nextIn: "14:15:38", // TODO: Get from dashboard API
        pool: "$42,560", // TODO: Get from dashboard API
        holdRequired: vault.minHoldAmount?.toString() || "200,000",
        totalAirdropped: "$1.23M", // TODO: Get from dashboard API
        apy: "164%", // TODO: Get from dashboard API
        winnersPerDay: "50 winners/day", // TODO: Get from dashboard API
      },
      info: [
        { k: "Vault Asset", v: vault.vaultAsset || "SOL" },
        { k: "Airdrop Asset", v: vault.airdropAsset || "REVS" },
        { k: "Min Hold Amount", v: vault.minHoldAmount?.toString() || "200,000" },
        { k: "Timer Duration", v: `${Math.floor((vault.timerDuration || 3600) / 60)}min` },
        { k: "Start Date", v: vault.startDate ? new Date(vault.startDate).toLocaleDateString() : "N/A" },
        { k: "Endgame Date", v: vault.endgameDate ? new Date(vault.endgameDate).toLocaleDateString() : "N/A" },
        { k: "Distribution Interval", v: `${Math.floor((vault.distributionInterval || 300) / 60)}min` },
        { k: "Status", v: vault.status },
      ],
      priceSeries: [1,1.1,1.2,0.95,1.05,1.3,1.25,1.5,1.45,1.6,1.55,1.7], // TODO: Get real price data
    };
  } catch (error) {
    console.error('Error fetching vault:', error);
    // Return fallback data if API fails
    return {
      id,
      name: "Scratcher Vault",
      ticker: "REVS",
      verified: true,
      addressShort: "9xk...C3Zp",
      pfpUrl: "https://images.unsplash.com/photo-1542219550-37153d387c37?q=80&w=512&auto=format&fit=crop",
      heroImageUrl: "https://images.unsplash.com/photo-1482192505345-5655af888cc4?q=80&w=1600&auto=format&fit=crop",
      timer: "54:24",
      endgameDays: 95,
      lastBuyerShort: "58gB...Zv56",
      price: "$0.0007",
      marketCap: "$1.2M",
      treasuryAmount: "17,204,455.31",
      treasuryAsset: "REVS",
      bidWin: "100×",
      airdrop: {
        nextIn: "14:15:38",
        pool: "$42,560",
        holdRequired: "200,000",
        totalAirdropped: "$1.23M",
        apy: "164%",
        winnersPerDay: "50 winners/day",
      },
      info: [
        { k: "Vault Asset", v: "SOL" },
        { k: "Airdrop Asset", v: "REVS" },
        { k: "Min Hold Amount", v: "200,000" },
        { k: "Timer Duration", v: "1h" },
        { k: "Start Date", v: "9/15/2025" },
        { k: "Endgame Date", v: "12/24/2025" },
        { k: "Distribution Interval", v: "5min" },
      ],
      priceSeries: [1,1.1,1.2,0.95,1.05,1.3,1.25,1.5,1.45,1.6,1.55,1.7],
    };
  }
}
