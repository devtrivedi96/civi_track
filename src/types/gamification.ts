export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: "user" | "official" | "both";
  type: "milestone" | "streak" | "quality" | "speed" | "community";
  requirement: {
    metric: string;
    target: number;
    timeframe?: "daily" | "weekly" | "monthly" | "all-time";
  };
  reward: {
    type: "points" | "badge" | "gift_card" | "merchandise" | "recognition";
    value: number | string;
    description: string;
  };
  rarity: "common" | "rare" | "epic" | "legendary";
  unlocked: boolean;
  unlockedAt?: Date;
  progress?: number;
}

export interface UserProgress {
  userId: string;
  email?: string;
  role: "user" | "official";
  totalPoints: number;
  level: number;
  experience: number;
  nextLevelExp: number;
  achievements: string[]; // Achievement IDs
  stats: {
    reportsSubmitted: number;
    reportsResolved: number;
    averageResolutionTime: number; // in hours
    streakDays: number;
    lastActivityDate: Date;
    qualityScore: number; // 0-100
  };
  rewards: {
    giftCards: Array<{
      id: string;
      type: "amazon" | "flipkart" | "paytm";
      amount: number;
      code?: string;
      claimed: boolean;
      claimedAt?: Date;
    }>;
    merchandise: Array<{
      id: string;
      type: "t_shirt" | "mug" | "sticker" | "badge";
      claimed: boolean;
      claimedAt?: Date;
      shippingAddress?: string;
    }>;
  };
  lastUpdated: Date;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  type: "gift_card" | "merchandise" | "points";
  value: number | string;
  cost: number; // Points required
  category:
    | "amazon_card"
    | "flipkart_card"
    | "paytm_card"
    | "t_shirt"
    | "mug"
    | "sticker"
    | "badge";
  image?: string;
  available: boolean;
  stock?: number;
  requirements?: {
    minLevel?: number;
    minPoints?: number;
    role?: "user" | "official" | "both";
  };
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  email: string;
  displayName: string;
  role: string;
  points: number;
  level: number;
  department?: string;
  achievements: number;
}

export interface GamificationConfig {
  pointsPerReport: number;
  pointsPerResolution: number;
  bonusPoints: {
    quickResolution: number; // Resolved within 24 hours
    highQuality: number; // High quality report
    firstReport: number; // First report ever
    streakBonus: number; // Daily streak bonus
  };
  levelThresholds: number[]; // XP required for each level
  rewards: Reward[];
  achievements: Achievement[];
}
