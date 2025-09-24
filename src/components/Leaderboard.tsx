import { useState, useEffect } from "react";
import {
  Trophy,
  Medal,
  Crown,
  Star,
  Users,
  TrendingUp,
  Award,
} from "lucide-react";
import { LeaderboardEntry } from "../types/gamification";
import { gamificationService } from "../services/gamificationService";

interface LeaderboardProps {
  limit?: number;
  showTitle?: boolean;
}

export function Leaderboard({
  limit = 10,
  showTitle = true,
}: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, [limit]);

  const loadLeaderboard = async () => {
    try {
      const data = await gamificationService.getLeaderboard(limit);
      setLeaderboard(data);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-slate-400 font-bold">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 border-yellow-500/30";
      case 2:
        return "bg-gradient-to-r from-gray-400/20 to-gray-500/20 border-gray-400/30";
      case 3:
        return "bg-gradient-to-r from-amber-500/20 to-amber-600/20 border-amber-500/30";
      default:
        return "bg-slate-800/30 border-slate-700";
    }
  };

  const getRoleIcon = (role: string) => {
    return role === "official" ? (
      <div className="w-6 h-6 bg-blue-500/20 rounded-full flex items-center justify-center">
        <Users className="w-3 h-3 text-blue-400" />
      </div>
    ) : (
      <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center">
        <Star className="w-3 h-3 text-green-400" />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          {showTitle && <div className="h-6 bg-slate-800 rounded w-1/3"></div>}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-8 h-8 bg-slate-800 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                <div className="h-3 bg-slate-800 rounded w-1/3"></div>
              </div>
              <div className="h-6 bg-slate-800 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden">
      {showTitle && (
        <div className="px-6 py-4 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Leaderboard
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Top performers this month
          </p>
        </div>
      )}

      <div className="p-6">
        {leaderboard.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-400">No data available yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Be the first to make a report!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.userId}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 hover:scale-[1.02] ${getRankColor(
                  entry.rank
                )}`}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(entry.rank)}
                </div>

                {/* Avatar & Role */}
                <div className="flex items-center gap-3">
                  {getRoleIcon(entry.role)}
                  <div>
                    <div className="text-sm font-medium text-white">
                      {entry.displayName}
                    </div>
                    <div className="text-xs text-slate-400 capitalize">
                      {entry.role}
                      {entry.department && ` • ${entry.department}`}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex-1 flex items-center justify-end gap-6">
                  <div className="text-center">
                    <div className="text-sm font-bold text-white">
                      {entry.points}
                    </div>
                    <div className="text-xs text-slate-400">Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-white">
                      Lv.{entry.level}
                    </div>
                    <div className="text-xs text-slate-400">Level</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-white">
                      {entry.achievements}
                    </div>
                    <div className="text-xs text-slate-400">Badges</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Updated every hour</span>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>Live ranking</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
