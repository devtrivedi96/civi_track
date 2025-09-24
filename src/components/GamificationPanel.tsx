import { useState, useEffect } from "react";
import {
  Trophy,
  Star,
  Gift,
  TrendingUp,
  Award,
  Target,
  Zap,
  Crown,
  Medal,
  Badge,
  Coffee,
  Shirt,
} from "lucide-react";
import { UserProgress, Achievement } from "../types/gamification";
import { gamificationService } from "../services/gamificationService";
import { getProgressToNextLevel } from "../utils/gamificationConfig";

interface GamificationPanelProps {
  userId: string;
  role: "user" | "official";
}

export function GamificationPanel({ userId, role }: GamificationPanelProps) {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "progress" | "achievements" | "rewards"
  >("progress");

  useEffect(() => {
    loadGamificationData();
  }, [userId]);

  const loadGamificationData = async () => {
    try {
      const [userProgress, userAchievements] = await Promise.all([
        gamificationService.getUserProgress(userId),
        gamificationService.getUserAchievements(userId),
      ]);

      if (!userProgress) {
        // Initialize progress if it doesn't exist
        const newProgress = await gamificationService.initializeUserProgress(
          userId,
          role
        );
        setProgress(newProgress);
      } else {
        setProgress(userProgress);
      }

      setAchievements(userAchievements);
    } catch (error) {
      console.error("Error loading gamification data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common":
        return "text-gray-400 border-gray-400";
      case "rare":
        return "text-blue-400 border-blue-400";
      case "epic":
        return "text-purple-400 border-purple-400";
      case "legendary":
        return "text-yellow-400 border-yellow-400";
      default:
        return "text-gray-400 border-gray-400";
    }
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case "gift_card":
        return <Gift className="w-4 h-4" />;
      case "merchandise":
        return <Shirt className="w-4 h-4" />;
      case "badge":
        return <Badge className="w-4 h-4" />;
      case "points":
        return <Star className="w-4 h-4" />;
      default:
        return <Award className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-800 rounded w-1/3"></div>
          <div className="h-4 bg-slate-800 rounded w-2/3"></div>
          <div className="h-20 bg-slate-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  const levelProgress = getProgressToNextLevel(progress.experience);
  const unlockedAchievements = achievements.filter((a) => a.unlocked);
  const availableRewards = [
    ...progress.rewards.giftCards,
    ...progress.rewards.merchandise,
  ].filter((r) => !r.claimed);

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Gamification
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">
              Level {progress.level}
            </span>
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
              <Crown className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="px-6 py-3 border-b border-slate-800">
        <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("progress")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === "progress"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Progress
          </button>
          <button
            onClick={() => setActiveTab("achievements")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === "achievements"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            <Medal className="w-4 h-4" />
            Achievements
          </button>
          <button
            onClick={() => setActiveTab("rewards")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === "rewards"
                ? "bg-blue-600 text-white shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-slate-700/50"
            }`}
          >
            <Gift className="w-4 h-4" />
            Rewards
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === "progress" && (
          <div className="space-y-6">
            {/* Level Progress */}
            <div className="bg-slate-800/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-white">
                  Level Progress
                </h4>
                <span className="text-sm text-slate-400">
                  {levelProgress.current} / {levelProgress.next} XP
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${levelProgress.progress}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                <span>Level {progress.level}</span>
                <span>Level {progress.level + 1}</span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {progress.totalPoints}
                </div>
                <div className="text-xs text-slate-400">Total Points</div>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {unlockedAchievements.length}
                </div>
                <div className="text-xs text-slate-400">Achievements</div>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {progress.stats.reportsSubmitted}
                </div>
                <div className="text-xs text-slate-400">Reports Submitted</div>
              </div>
              <div className="bg-slate-800/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">
                  {progress.stats.reportsResolved}
                </div>
                <div className="text-xs text-slate-400">Reports Resolved</div>
              </div>
            </div>

            {/* Streak */}
            {progress.stats.streakDays > 0 && (
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-orange-400" />
                  <span className="text-white font-medium">
                    Streak: {progress.stats.streakDays} days
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "achievements" && (
          <div className="space-y-4">
            <div className="text-sm text-slate-400 mb-4">
              {unlockedAchievements.length} of {achievements.length}{" "}
              achievements unlocked
            </div>
            <div className="grid gap-3">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`border rounded-lg p-4 transition-all duration-200 ${
                    achievement.unlocked
                      ? "border-green-500/50 bg-green-500/10"
                      : "border-slate-700 bg-slate-800/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5
                          className={`font-medium ${
                            achievement.unlocked
                              ? "text-white"
                              : "text-slate-400"
                          }`}
                        >
                          {achievement.title}
                        </h5>
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${getRarityColor(
                            achievement.rarity
                          )}`}
                        >
                          {achievement.rarity}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mb-2">
                        {achievement.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        {getRewardIcon(achievement.reward.type)}
                        <span className="text-slate-300">
                          {achievement.reward.description}
                        </span>
                      </div>
                      {!achievement.unlocked &&
                        achievement.progress !== undefined && (
                          <div className="mt-2">
                            <div className="w-full bg-slate-700 rounded-full h-1">
                              <div
                                className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${achievement.progress}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              {Math.round(achievement.progress)}% complete
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "rewards" && (
          <div className="space-y-4">
            <div className="text-sm text-slate-400 mb-4">
              {availableRewards.length} rewards available
            </div>
            {availableRewards.length === 0 ? (
              <div className="text-center py-8">
                <Gift className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-400">No rewards available yet</p>
                <p className="text-xs text-slate-500 mt-1">
                  Complete achievements to earn rewards!
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {availableRewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="border border-slate-700 bg-slate-800/30 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getRewardIcon("gift_card")}
                        <div>
                          <h5 className="text-white font-medium">
                            {"amount" in reward
                              ? `₹${reward.amount} Gift Card`
                              : reward.type}
                          </h5>
                          <p className="text-sm text-slate-400">
                            {"amount" in reward
                              ? "Amazon Gift Card"
                              : "CivicTrack Merchandise"}
                          </p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
                        Claim
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
