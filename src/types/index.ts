export type ShopCategory = 'emoji' | 'colorScheme' | 'nameAnimation' | 'profileTitle' | 'profileBorder';

export type EquippedItems = Partial<Record<ShopCategory, string>>;

export interface PlayerRecord {
  username: string;
  pinHash: string;
  balance: number;
  embarrassingThings: string[];
  bankRequestCount: number;
  lastBankRequest: number | null;
  createdAt: number;
  inventory: string[];
  equippedItems: EquippedItems;
}

export interface PlayerPublic {
  username: string;
  balance: number;
  embarrassingThings: string[];
  bankRequestCount: number;
  createdAt: number;
  inventory: string[];
  equippedItems: EquippedItems;
}

export interface BetOption {
  label: string;
  totalWagered: number;
}

export type BetStatus = 'open' | 'closed' | 'nulled';
export type BetType = 'standard' | 'over-under';

export interface BetRecord {
  id: string;
  creator: string;
  description: string;
  minimumBet: number;
  options: BetOption[];
  status: BetStatus;
  winningOptionIndex: number | null;
  totalPool: number;
  createdAt: number;
  closedAt: number | null;
  nulledAt: number | null;
  betType: BetType;
  overUnderLine: number | null;
}

export interface WagerRecord {
  player: string;
  optionIndex: number;
  amount: number;
  placedAt: number;
}

export interface GlobalAnalytics {
  totalBetsCreated: number;
  totalShekelsWagered: number;
}

export interface PlayerAnalytics {
  username: string;
  totalBetsPlaced: number;
  totalShekelsWagered: number;
  wins: number;
  losses: number;
  winRate: number;
  netProfitLoss: number;
}

export interface Session {
  username: string;
  token: string;
  balance: number;
}
