export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  type: AchievementType;
  condition: AchievementCondition;
  isUnlocked: boolean;
  unlockedAt?: Date;
}

export enum AchievementType {
  REPORTER = 'reporter',
  RESOLVER = 'resolver',
  COMMUNITY = 'community',
  STREAK = 'streak',
  QUALITY = 'quality'
}

export interface AchievementCondition {
  type: string;
  value: number;
  timeframe?: string;
}

export interface UserProgress {
  userId: string;
  totalPoints: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  reportsSubmitted: number;
  reportsResolved: number;
  qualityScore: number;
  rank: number;
  nextLevelPoints: number;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  type: RewardType;
  value: number;
  isAvailable: boolean;
  expiresAt?: Date;
  image: string;
}

export enum RewardType {
  GIFT_CARD = 'gift_card',
  MERCHANDISE = 'merchandise',
  DISCOUNT = 'discount',
  BADGE = 'badge'
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  profileImage?: string;
  points: number;
  level: number;
  rank: number;
  reportsCount: number;
}