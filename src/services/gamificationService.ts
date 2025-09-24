import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import {
  UserProgress,
  Achievement,
  LeaderboardEntry,
} from "../types/gamification";
import {
  GAMIFICATION_CONFIG,
  calculateLevel,
  getNextLevelExp,
} from "../utils/gamificationConfig";

export class GamificationService {
  private static instance: GamificationService;

  public static getInstance(): GamificationService {
    if (!GamificationService.instance) {
      GamificationService.instance = new GamificationService();
    }
    return GamificationService.instance;
  }

  // Initialize user progress
  async initializeUserProgress(
    userId: string,
    role: "user" | "official"
  ): Promise<UserProgress> {
    const progress: UserProgress = {
      userId,
      role,
      totalPoints: 0,
      level: 0,
      experience: 0,
      nextLevelExp: 100,
      achievements: [],
      stats: {
        reportsSubmitted: 0,
        reportsResolved: 0,
        averageResolutionTime: 0,
        streakDays: 0,
        lastActivityDate: new Date(),
        qualityScore: 100,
      },
      rewards: {
        giftCards: [],
        merchandise: [],
      },
      lastUpdated: new Date(),
    };

    await setDoc(doc(db, "user_progress", userId), progress);
    return progress;
  }

  // Get user progress with profile data
  async getUserProgress(userId: string): Promise<UserProgress | null> {
    const docRef = doc(db, "user_progress", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      // Get user profile to get email
      const profileRef = doc(db, "profiles", userId);
      const profileSnap = await getDoc(profileRef);
      const userData = docSnap.data() as UserProgress;

      if (profileSnap.exists()) {
        userData.email = profileSnap.data().email;
      }

      return userData;
    }
    return null;
  }

  // Calculate points from reports
  private async calculatePointsFromReports(userId: string): Promise<number> {
    const reportsQuery = query(
      collection(db, "reports"),
      where("userId", "==", userId)
    );
    const reportsSnap = await getDocs(reportsQuery);

    let totalPoints = 0;
    reportsSnap.forEach((doc) => {
      const report = doc.data();
      // Base points for each report
      totalPoints += GAMIFICATION_CONFIG.pointsPerReport;

      // Bonus for resolved reports
      if (report.status === "resolved") {
        totalPoints += GAMIFICATION_CONFIG.pointsPerResolution;
      }
    });

    return totalPoints;
  }

  // Award points for report submission
  async awardReportSubmission(
    userId: string,
    isFirstReport: boolean = false
  ): Promise<UserProgress> {
    const progress = await this.getUserProgress(userId);
    if (!progress) {
      throw new Error("User progress not found");
    }

    let pointsToAward = GAMIFICATION_CONFIG.pointsPerReport;

    if (isFirstReport) {
      pointsToAward += GAMIFICATION_CONFIG.bonusPoints.firstReport;
    }

    // Update progress
    progress.totalPoints += pointsToAward;
    progress.experience += pointsToAward;
    progress.stats.reportsSubmitted += 1;
    progress.stats.lastActivityDate = new Date();
    progress.lastUpdated = new Date();

    // Update level
    const newLevel = calculateLevel(progress.experience);
    if (newLevel > progress.level) {
      progress.level = newLevel;
      progress.nextLevelExp = getNextLevelExp(newLevel);
    }

    // Check for achievements
    await this.checkAchievements(progress);

    // Save to database
    await updateDoc(doc(db, "user_progress", userId), { ...progress });
    return progress;
  }

  // Award points for report resolution
  async awardReportResolution(
    userId: string,
    resolutionTimeHours: number,
    isQuickResolution: boolean = false
  ): Promise<UserProgress> {
    const progress = await this.getUserProgress(userId);
    if (!progress) {
      throw new Error("User progress not found");
    }

    let pointsToAward = GAMIFICATION_CONFIG.pointsPerResolution;

    if (isQuickResolution) {
      pointsToAward += GAMIFICATION_CONFIG.bonusPoints.quickResolution;
    }

    // Update progress
    progress.totalPoints += pointsToAward;
    progress.experience += pointsToAward;
    progress.stats.reportsResolved += 1;
    progress.stats.lastActivityDate = new Date();
    progress.lastUpdated = new Date();

    // Update average resolution time
    const totalTime =
      progress.stats.averageResolutionTime *
        (progress.stats.reportsResolved - 1) +
      resolutionTimeHours;
    progress.stats.averageResolutionTime =
      totalTime / progress.stats.reportsResolved;

    // Update level
    const newLevel = calculateLevel(progress.experience);
    if (newLevel > progress.level) {
      progress.level = newLevel;
      progress.nextLevelExp = getNextLevelExp(newLevel);
    }

    // Check for achievements
    await this.checkAchievements(progress);

    // Save to database
    await updateDoc(doc(db, "user_progress", userId), { ...progress });
    return progress;
  }

  // Check and unlock achievements
  async checkAchievements(progress: UserProgress): Promise<Achievement[]> {
    const newAchievements: Achievement[] = [];

    for (const achievement of GAMIFICATION_CONFIG.achievements) {
      // Skip if already unlocked
      if (progress.achievements.includes(achievement.id)) {
        continue;
      }

      // Check if user qualifies for this achievement
      if (
        achievement.category !== "both" &&
        achievement.category !== progress.role
      ) {
        continue;
      }

      let unlocked = false;

      switch (achievement.requirement.metric) {
        case "reportsSubmitted":
          unlocked =
            progress.stats.reportsSubmitted >= achievement.requirement.target;
          break;
        case "reportsResolved":
          unlocked =
            progress.stats.reportsResolved >= achievement.requirement.target;
          break;
        case "level":
          unlocked = progress.level >= achievement.requirement.target;
          break;
        case "streakDays":
          unlocked =
            progress.stats.streakDays >= achievement.requirement.target;
          break;
        case "qualityScore":
          unlocked =
            progress.stats.qualityScore >= achievement.requirement.target;
          break;
      }

      if (unlocked) {
        // Award achievement
        const unlockedAchievement = {
          ...achievement,
          unlocked: true,
          unlockedAt: new Date(),
        };
        newAchievements.push(unlockedAchievement);
        progress.achievements.push(achievement.id);

        // Award achievement reward
        await this.awardAchievementReward(progress, achievement);
      }
    }

    return newAchievements;
  }

  // Award achievement rewards
  private async awardAchievementReward(
    progress: UserProgress,
    achievement: Achievement
  ): Promise<void> {
    switch (achievement.reward.type) {
      case "points":
        progress.totalPoints += achievement.reward.value as number;
        progress.experience += achievement.reward.value as number;
        break;
      case "gift_card":
        progress.rewards.giftCards.push({
          id: `${achievement.id}_${Date.now()}`,
          type: "amazon",
          amount: 100, // Default amount, should be configurable
          claimed: false,
        });
        break;
      case "merchandise":
        progress.rewards.merchandise.push({
          id: `${achievement.id}_${Date.now()}`,
          type: "t_shirt",
          claimed: false,
        });
        break;
    }
  }

  // Get leaderboard with email IDs
  async getLeaderboard(limitCount: number = 10): Promise<LeaderboardEntry[]> {
    const q = query(
      collection(db, "user_progress"),
      orderBy("totalPoints", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const entries: LeaderboardEntry[] = [];

    for (const [index, userDoc] of Array.from(querySnapshot.docs).entries()) {
      const userData = userDoc.data();

      // Get user profile for email and display name
      const profileRef = doc(db, "profiles", userDoc.id);
      const profileSnap = await getDoc(profileRef);
      const profileData = profileSnap.exists() ? profileSnap.data() : null;

      // Get points from reports
      const reportPoints = await this.calculatePointsFromReports(userDoc.id);
      const totalPoints = reportPoints + userData.totalPoints;

      entries.push({
        rank: index + 1,
        userId: userDoc.id,
        email: profileData?.email || "Unknown User",
        displayName:
          profileData?.fullName ||
          profileData?.email?.split("@")[0] ||
          "Unknown User",
        role: userData.role,
        department: profileData?.department,
        points: totalPoints,
        level: userData.level,
        achievements: userData.achievements?.length || 0,
      });
    }

    // Sort by total points (including report points)
    entries.sort((a, b) => b.points - a.points);
    entries.forEach((entry, index) => (entry.rank = index + 1));

    return entries;
  }

  // Get user achievements
  async getUserAchievements(userId: string): Promise<Achievement[]> {
    const progress = await this.getUserProgress(userId);
    if (!progress) {
      return [];
    }

    return GAMIFICATION_CONFIG.achievements.map((achievement) => ({
      ...achievement,
      unlocked: progress.achievements.includes(achievement.id),
      progress: this.calculateAchievementProgress(achievement, progress),
    }));
  }

  // Calculate achievement progress
  private calculateAchievementProgress(
    achievement: Achievement,
    progress: UserProgress
  ): number {
    let current = 0;
    const target = achievement.requirement.target;

    switch (achievement.requirement.metric) {
      case "reportsSubmitted":
        current = progress.stats.reportsSubmitted;
        break;
      case "reportsResolved":
        current = progress.stats.reportsResolved;
        break;
      case "level":
        current = progress.level;
        break;
      case "streakDays":
        current = progress.stats.streakDays;
        break;
      case "qualityScore":
        current = progress.stats.qualityScore;
        break;
    }

    return Math.min(100, (current / target) * 100);
  }

  // Claim reward
  async claimReward(
    userId: string,
    rewardId: string,
    type: "gift_card" | "merchandise"
  ): Promise<boolean> {
    const progress = await this.getUserProgress(userId);
    if (!progress) {
      return false;
    }

    if (type === "gift_card") {
      const giftCard = progress.rewards.giftCards.find(
        (gc) => gc.id === rewardId
      );
      if (giftCard && !giftCard.claimed) {
        giftCard.claimed = true;
        giftCard.claimedAt = new Date();
        await updateDoc(doc(db, "user_progress", userId), { ...progress });
        return true;
      }
    } else if (type === "merchandise") {
      const merchandise = progress.rewards.merchandise.find(
        (m) => m.id === rewardId
      );
      if (merchandise && !merchandise.claimed) {
        merchandise.claimed = true;
        merchandise.claimedAt = new Date();
        await updateDoc(doc(db, "user_progress", userId), { ...progress });
        return true;
      }
    }

    return false;
  }
}

export const gamificationService = GamificationService.getInstance();
