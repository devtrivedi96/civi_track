import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { GamificationPanel } from "../components/GamificationPanel";
import { Leaderboard } from "../components/Leaderboard";
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
  Users,
  Calendar,
  Activity,
} from "lucide-react";

export function Gamification() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "progress" | "leaderboard" | "rewards"
  >("progress");

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Please log in to view gamification
            </h2>
            <p className="text-slate-400">
              You need to be logged in to see your progress and achievements
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                Gamification Center
              </h1>
              <p className="text-slate-400 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Track your progress, earn rewards, and compete with others
              </p>
            </div>
            <div className="flex items-center gap-4 mt-4 lg:mt-0">
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-400 font-medium capitalize">
                  {profile.role}
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-slate-800/50 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab("progress")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === "progress"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              My Progress
            </button>
            <button
              onClick={() => setActiveTab("leaderboard")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                activeTab === "leaderboard"
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              <Trophy className="w-4 h-4" />
              Leaderboard
            </button>
            <button
              onClick={() => setActiveTab("rewards")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
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
        {activeTab === "progress" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <GamificationPanel
                userId={user.uid}
                role={profile.role === "official" ? "official" : "user"}
              />
            </div>
            <div>
              <Leaderboard limit={5} showTitle={true} />
            </div>
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Leaderboard limit={10} showTitle={true} />
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Medal className="w-5 h-5 text-yellow-400" />
                  Achievement Stats
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Star className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-white font-medium">
                        Total Points
                      </span>
                    </div>
                    <span className="text-blue-400 font-bold">
                      Earned by activity
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <Badge className="w-4 h-4 text-green-400" />
                      </div>
                      <span className="text-white font-medium">
                        Achievements
                      </span>
                    </div>
                    <span className="text-green-400 font-bold">
                      Unlock by milestones
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Crown className="w-4 h-4 text-purple-400" />
                      </div>
                      <span className="text-white font-medium">
                        Level System
                      </span>
                    </div>
                    <span className="text-purple-400 font-bold">
                      10 levels to master
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                        <Zap className="w-4 h-4 text-orange-400" />
                      </div>
                      <span className="text-white font-medium">Streaks</span>
                    </div>
                    <span className="text-orange-400 font-bold">
                      Daily consistency
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "rewards" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gift Cards */}
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Gift className="w-5 h-5 text-green-400" />
                  Gift Cards
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-orange-400 font-bold text-sm">
                          A
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          Amazon Gift Cards
                        </div>
                        <div className="text-xs text-slate-400">
                          ₹100, ₹500, ₹1000
                        </div>
                      </div>
                    </div>
                    <span className="text-orange-400 font-bold">Available</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-blue-400 font-bold text-sm">
                          F
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          Flipkart Gift Cards
                        </div>
                        <div className="text-xs text-slate-400">₹250</div>
                      </div>
                    </div>
                    <span className="text-blue-400 font-bold">Available</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-purple-400 font-bold text-sm">
                          P
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          Paytm Gift Cards
                        </div>
                        <div className="text-xs text-slate-400">₹200</div>
                      </div>
                    </div>
                    <span className="text-purple-400 font-bold">Available</span>
                  </div>
                </div>
              </div>

              {/* Merchandise */}
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Shirt className="w-5 h-5 text-blue-400" />
                  Merchandise
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Shirt className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          CivicTrack T-Shirts
                        </div>
                        <div className="text-xs text-slate-400">
                          Official branded apparel
                        </div>
                      </div>
                    </div>
                    <span className="text-blue-400 font-bold">Available</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                        <Coffee className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          Coffee Mugs
                        </div>
                        <div className="text-xs text-slate-400">
                          CivicTrack branded mugs
                        </div>
                      </div>
                    </div>
                    <span className="text-amber-400 font-bold">Available</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <Badge className="w-4 h-4 text-green-400" />
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          Stickers & Badges
                        </div>
                        <div className="text-xs text-slate-400">
                          Collectible items
                        </div>
                      </div>
                    </div>
                    <span className="text-green-400 font-bold">Available</span>
                  </div>
                </div>
              </div>
            </div>

            {/* How to Earn */}
            <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-yellow-400" />
                How to Earn Rewards
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-800/30 rounded-lg">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3">
                    <Star className="w-5 h-5 text-blue-400" />
                  </div>
                  <h4 className="text-white font-medium mb-2">
                    Submit Reports
                  </h4>
                  <p className="text-sm text-slate-400">
                    Earn 10 points per report + bonuses
                  </p>
                </div>
                <div className="p-4 bg-slate-800/30 rounded-lg">
                  <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mb-3">
                    <Award className="w-5 h-5 text-green-400" />
                  </div>
                  <h4 className="text-white font-medium mb-2">
                    Resolve Issues
                  </h4>
                  <p className="text-sm text-slate-400">
                    Earn 25 points per resolution
                  </p>
                </div>
                <div className="p-4 bg-slate-800/30 rounded-lg">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center mb-3">
                    <Zap className="w-5 h-5 text-orange-400" />
                  </div>
                  <h4 className="text-white font-medium mb-2">
                    Quick Resolution
                  </h4>
                  <p className="text-sm text-slate-400">
                    Bonus 50 points for 24h resolution
                  </p>
                </div>
                <div className="p-4 bg-slate-800/30 rounded-lg">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mb-3">
                    <Crown className="w-5 h-5 text-purple-400" />
                  </div>
                  <h4 className="text-white font-medium mb-2">Achievements</h4>
                  <p className="text-sm text-slate-400">
                    Unlock rewards through milestones
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
