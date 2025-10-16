import firestore from "@react-native-firebase/firestore";
import {
  Achievement,
  AchievementType,
  LeaderboardEntry,
  Reward,
  RewardType,
  UserProgress,
} from "@/types/gamification";
import { ReportStatus } from "@/types/report";

export class GamificationService {
  private readonly config = {
    pointsPerReport: 10,
    pointsPerResolution: 25,
    bonusPoints: {
      quickResolution: 15,
      highQuality: 20,
      firstReport: 30,
      streakBonus: 5,
    },
    levelThresholds: [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000],
    streakDays: 1, // Days to maintain streak
  };

  private calculateLevel(points: number): number {
    for (let i = this.config.levelThresholds.length - 1; i >= 0; i--) {
      if (points >= this.config.levelThresholds[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  private getNextLevelPoints(points: number): number {
    const currentLevel = this.calculateLevel(points);
    const nextLevel =
      currentLevel < this.config.levelThresholds.length
        ? currentLevel
        : this.config.levelThresholds.length - 1;
    return this.config.levelThresholds[nextLevel];
  }

  async getUserProgress(userId: string): Promise<UserProgress> {
    try {
      const userDoc = await firestore().collection("users").doc(userId).get();

      if (!userDoc.exists) {
        throw new Error("User not found");
      }

      const data = userDoc.data() || {};

      return {
        userId: userDoc.id,
        totalPoints: data.points || 0,
        level: this.calculateLevel(data.points || 0),
        currentStreak: data.streak || 0,
        longestStreak: data.longestStreak || 0,
        reportsSubmitted: data.reportCount || 0,
        reportsResolved: data.resolutionCount || 0,
        qualityScore: data.qualityScore || 0,
        rank: data.rank || 0,
        nextLevelPoints: this.getNextLevelPoints(data.points || 0),
      };
    } catch (error) {
      console.error("Error getting user progress:", error);
      throw error;
    }
  }

  async getLeaderboard(maxEntries: number = 10): Promise<LeaderboardEntry[]> {
    try {
      const snapshot = await firestore()
        .collection("users")
        .orderBy("points", "desc")
        .limit(maxEntries)
        .get();

      return snapshot.docs.map((doc, index) => {
        const data = doc.data();
        return {
          userId: doc.id,
          userName: data.displayName || "Anonymous",
          profileImage: data.photoURL || null,
          points: data.points || 0,
          level: this.calculateLevel(data.points || 0),
          rank: index + 1,
          reportsCount: data.reportCount || 0,
        };
      });
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      throw error;
    }
  }

  async updateUserProgress(
    userId: string,
    update: Partial<{
      points: number;
      reportCount: number;
      resolutionCount: number;
      streak: number;
      longestStreak: number;
      lastReportDate: Date;
      qualityScore: number;
    }>
  ): Promise<void> {
    try {
      const userRef = firestore().collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new Error("User not found");
      }

      const currentData = userDoc.data() || {};

      if (update.points !== undefined) {
        const newLevel = this.calculateLevel(update.points);
        const currentLevel = this.calculateLevel(currentData.points || 0);

        if (newLevel > currentLevel) {
          const reward: Reward = {
            id: `level_${newLevel}`,
            title: `Level ${newLevel} Badge`,
            description: `Reached level ${newLevel}`,
            pointsCost: 0,
            type: RewardType.BADGE,
            value: newLevel,
            isAvailable: true,
            image: "🎖️",
            expiresAt: undefined,
          };

          await userRef.update({
            rewards: firestore.FieldValue.arrayUnion(reward),
          });
        }
      }

      await userRef.update({
        ...update,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating user progress:", error);
      throw error;
    }
  }

  async handleReportSubmission(
    userId: string,
    reportQuality?: number
  ): Promise<void> {
    try {
      const userRef = firestore().collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new Error("User not found");
      }

      const data = userDoc.data() || {};
      const isFirstReport = !data.reportCount;
      let pointsToAdd = this.config.pointsPerReport;
      let streak = data.streak || 0;
      let longestStreak = data.longestStreak || 0;
      let qualityScore = data.qualityScore || 0;

      // Add bonus points for first report
      if (isFirstReport) {
        pointsToAdd += this.config.bonusPoints.firstReport;
      }

      // Handle report quality
      if (reportQuality !== undefined) {
        if (reportQuality >= 0.8) {
          pointsToAdd += this.config.bonusPoints.highQuality;
        }
        // Update quality score (rolling average)
        const totalReports = data.reportCount || 0;
        qualityScore =
          (qualityScore * totalReports + reportQuality) / (totalReports + 1);
      }

      // Check and update streak
      const lastReportDate = data.lastReportDate?.toDate();
      const now = new Date();

      if (lastReportDate) {
        const daysSinceLastReport = Math.floor(
          (now.getTime() - lastReportDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastReport <= this.config.streakDays) {
          streak += 1;
          longestStreak = Math.max(streak, longestStreak);
          pointsToAdd += this.config.bonusPoints.streakBonus;
        } else {
          streak = 1;
        }
      } else {
        streak = 1;
      }

      await this.updateUserProgress(userId, {
        reportCount: (data.reportCount || 0) + 1,
        lastReportDate: now,
        streak,
        longestStreak,
        points: (data.points || 0) + pointsToAdd,
        qualityScore,
      });
    } catch (error) {
      console.error("Error handling report submission:", error);
      throw error;
    }
  }

  async handleReportResolution(
    userId: string,
    reportCreatedAt: Date
  ): Promise<void> {
    try {
      const userRef = firestore().collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        throw new Error("User not found");
      }

      const data = userDoc.data() || {};
      let pointsToAdd = this.config.pointsPerResolution;

      // Add bonus points for quick resolution
      const now = new Date();
      const hoursToResolve =
        (now.getTime() - reportCreatedAt.getTime()) / (1000 * 60 * 60);

      if (hoursToResolve <= 24) {
        pointsToAdd += this.config.bonusPoints.quickResolution;
      }

      await this.updateUserProgress(userId, {
        resolutionCount: (data.resolutionCount || 0) + 1,
        points: (data.points || 0) + pointsToAdd,
      });
    } catch (error) {
      console.error("Error handling report resolution:", error);
      throw error;
    }
  }
}

export const gamificationService = new GamificationService();
