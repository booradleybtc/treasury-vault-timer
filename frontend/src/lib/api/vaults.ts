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

const API = process.env.NEXT_PUBLIC_API_URL || "";

export async function getVault(id: string): Promise<Vault> {
  // TODO: Replace with real endpoint (e.g., `${API}/vaults/${id}`)
  // For now return a shaped mock so UI works immediately.
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
