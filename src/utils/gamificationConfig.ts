import { Achievement, Reward, GamificationConfig } from "../types/gamification";

export const GAMIFICATION_CONFIG: GamificationConfig = {
  pointsPerReport: 10,
  pointsPerResolution: 25,
  bonusPoints: {
    quickResolution: 50, // Resolved within 24 hours
    highQuality: 20, // High quality report
    firstReport: 100, // First report ever
    streakBonus: 5, // Daily streak bonus
  },
  levelThresholds: [
    0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000, 15000, 25000, 50000,
  ],
  rewards: [
    // Gift Cards
    {
      id: "amazon_100",
      name: "Amazon Gift Card ₹100",
      description: "Redeem for ₹100 Amazon gift card",
      type: "gift_card",
      value: 100,
      cost: 1000,
      category: "amazon_card",
      available: true,
      requirements: { minLevel: 2 },
    },
    {
      id: "amazon_500",
      name: "Amazon Gift Card ₹500",
      description: "Redeem for ₹500 Amazon gift card",
      type: "gift_card",
      value: 500,
      cost: 5000,
      category: "amazon_card",
      available: true,
      requirements: { minLevel: 5 },
    },
    {
      id: "flipkart_250",
      name: "Flipkart Gift Card ₹250",
      description: "Redeem for ₹250 Flipkart gift card",
      type: "gift_card",
      value: 250,
      cost: 2500,
      category: "flipkart_card",
      available: true,
      requirements: { minLevel: 3 },
    },
    {
      id: "paytm_200",
      name: "Paytm Gift Card ₹200",
      description: "Redeem for ₹200 Paytm gift card",
      type: "gift_card",
      value: 200,
      cost: 2000,
      category: "paytm_card",
      available: true,
      requirements: { minLevel: 2 },
    },
    // Merchandise
    {
      id: "civic_tshirt",
      name: "CivicTrack T-Shirt",
      description: "Official CivicTrack branded t-shirt",
      type: "merchandise",
      value: "CivicTrack T-Shirt",
      cost: 3000,
      category: "t_shirt",
      available: true,
      stock: 50,
      requirements: { minLevel: 4 },
    },
    {
      id: "civic_mug",
      name: "CivicTrack Coffee Mug",
      description: "Official CivicTrack branded coffee mug",
      type: "merchandise",
      value: "CivicTrack Coffee Mug",
      cost: 1500,
      category: "mug",
      available: true,
      stock: 100,
      requirements: { minLevel: 2 },
    },
    {
      id: "civic_sticker",
      name: "CivicTrack Sticker Pack",
      description: "Set of 5 CivicTrack branded stickers",
      type: "merchandise",
      value: "CivicTrack Sticker Pack",
      cost: 500,
      category: "sticker",
      available: true,
      stock: 200,
      requirements: { minLevel: 1 },
    },
    {
      id: "civic_badge",
      name: "CivicTrack Badge",
      description: "Official CivicTrack achievement badge",
      type: "merchandise",
      value: "CivicTrack Badge",
      cost: 800,
      category: "badge",
      available: true,
      stock: 150,
      requirements: { minLevel: 2 },
    },
  ],
  achievements: [
    // User Achievements
    {
      id: "first_report",
      title: "First Steps",
      description: "Submit your first civic issue report",
      icon: "🎯",
      category: "user",
      type: "milestone",
      requirement: { metric: "reportsSubmitted", target: 1 },
      reward: { type: "points", value: 100, description: "100 bonus points" },
      rarity: "common",
      unlocked: false,
    },
    {
      id: "reporter_5",
      title: "Active Reporter",
      description: "Submit 5 civic issue reports",
      icon: "📝",
      category: "user",
      type: "milestone",
      requirement: { metric: "reportsSubmitted", target: 5 },
      reward: {
        type: "badge",
        value: "Active Reporter",
        description: "Active Reporter Badge",
      },
      rarity: "common",
      unlocked: false,
    },
    {
      id: "reporter_25",
      title: "Community Champion",
      description: "Submit 25 civic issue reports",
      icon: "🏆",
      category: "user",
      type: "milestone",
      requirement: { metric: "reportsSubmitted", target: 25 },
      reward: {
        type: "gift_card",
        value: "Amazon ₹100",
        description: "Amazon Gift Card ₹100",
      },
      rarity: "rare",
      unlocked: false,
    },
    {
      id: "reporter_50",
      title: "Civic Hero",
      description: "Submit 50 civic issue reports",
      icon: "🦸",
      category: "user",
      type: "milestone",
      requirement: { metric: "reportsSubmitted", target: 50 },
      reward: {
        type: "merchandise",
        value: "CivicTrack T-Shirt",
        description: "Official T-Shirt",
      },
      rarity: "epic",
      unlocked: false,
    },
    {
      id: "streak_7",
      title: "Week Warrior",
      description: "Submit reports for 7 consecutive days",
      icon: "🔥",
      category: "user",
      type: "streak",
      requirement: { metric: "streakDays", target: 7 },
      reward: { type: "points", value: 200, description: "200 bonus points" },
      rarity: "rare",
      unlocked: false,
    },
    {
      id: "streak_30",
      title: "Monthly Master",
      description: "Submit reports for 30 consecutive days",
      icon: "💪",
      category: "user",
      type: "streak",
      requirement: { metric: "streakDays", target: 30 },
      reward: {
        type: "gift_card",
        value: "Amazon ₹500",
        description: "Amazon Gift Card ₹500",
      },
      rarity: "legendary",
      unlocked: false,
    },
    // Official Achievements
    {
      id: "first_resolution",
      title: "Problem Solver",
      description: "Resolve your first civic issue",
      icon: "✅",
      category: "official",
      type: "milestone",
      requirement: { metric: "reportsResolved", target: 1 },
      reward: { type: "points", value: 50, description: "50 bonus points" },
      rarity: "common",
      unlocked: false,
    },
    {
      id: "resolver_10",
      title: "Efficient Official",
      description: "Resolve 10 civic issues",
      icon: "⚡",
      category: "official",
      type: "milestone",
      requirement: { metric: "reportsResolved", target: 10 },
      reward: {
        type: "badge",
        value: "Efficient Official",
        description: "Efficient Official Badge",
      },
      rarity: "common",
      unlocked: false,
    },
    {
      id: "resolver_50",
      title: "Resolution Master",
      description: "Resolve 50 civic issues",
      icon: "🎖️",
      category: "official",
      type: "milestone",
      requirement: { metric: "reportsResolved", target: 50 },
      reward: {
        type: "gift_card",
        value: "Amazon ₹250",
        description: "Amazon Gift Card ₹250",
      },
      rarity: "rare",
      unlocked: false,
    },
    {
      id: "resolver_100",
      title: "Civic Guardian",
      description: "Resolve 100 civic issues",
      icon: "🛡️",
      category: "official",
      type: "milestone",
      requirement: { metric: "reportsResolved", target: 100 },
      reward: {
        type: "merchandise",
        value: "CivicTrack T-Shirt",
        description: "Official T-Shirt",
      },
      rarity: "epic",
      unlocked: false,
    },
    {
      id: "quick_resolver",
      title: "Speed Demon",
      description: "Resolve 10 issues within 24 hours",
      icon: "⚡",
      category: "official",
      type: "speed",
      requirement: { metric: "quickResolutions", target: 10 },
      reward: { type: "points", value: 300, description: "300 bonus points" },
      rarity: "rare",
      unlocked: false,
    },
    {
      id: "quality_master",
      title: "Quality Master",
      description: "Maintain 95%+ quality score for 30 days",
      icon: "⭐",
      category: "official",
      type: "quality",
      requirement: { metric: "qualityScore", target: 95 },
      reward: {
        type: "gift_card",
        value: "Amazon ₹500",
        description: "Amazon Gift Card ₹500",
      },
      rarity: "legendary",
      unlocked: false,
    },
    // Shared Achievements
    {
      id: "level_5",
      title: "Rising Star",
      description: "Reach level 5",
      icon: "⭐",
      category: "both",
      type: "milestone",
      requirement: { metric: "level", target: 5 },
      reward: {
        type: "merchandise",
        value: "CivicTrack Mug",
        description: "Official Coffee Mug",
      },
      rarity: "rare",
      unlocked: false,
    },
    {
      id: "level_10",
      title: "Civic Legend",
      description: "Reach level 10",
      icon: "👑",
      category: "both",
      type: "milestone",
      requirement: { metric: "level", target: 10 },
      reward: {
        type: "gift_card",
        value: "Amazon ₹1000",
        description: "Amazon Gift Card ₹1000",
      },
      rarity: "legendary",
      unlocked: false,
    },
  ],
};

export function calculateLevel(experience: number): number {
  const thresholds = GAMIFICATION_CONFIG.levelThresholds;
  for (let i = thresholds.length - 1; i >= 0; i--) {
    if (experience >= thresholds[i]) {
      return i;
    }
  }
  return 0;
}

export function getNextLevelExp(currentLevel: number): number {
  const thresholds = GAMIFICATION_CONFIG.levelThresholds;
  return thresholds[currentLevel + 1] || thresholds[thresholds.length - 1];
}

export function getProgressToNextLevel(experience: number): {
  current: number;
  next: number;
  progress: number;
} {
  const currentLevel = calculateLevel(experience);
  const currentLevelExp = GAMIFICATION_CONFIG.levelThresholds[currentLevel];
  const nextLevelExp = getNextLevelExp(currentLevel);
  const progress =
    ((experience - currentLevelExp) / (nextLevelExp - currentLevelExp)) * 100;

  return {
    current: experience - currentLevelExp,
    next: nextLevelExp - currentLevelExp,
    progress: Math.min(100, Math.max(0, progress)),
  };
}
