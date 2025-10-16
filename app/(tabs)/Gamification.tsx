import React from "react";
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  UserProgress,
  Achievement,
  LeaderboardEntry,
} from "@/types/gamification";
import { Loading } from "@/components/common/Loading";
import { useAuth } from "@/services/auth/authContext";
import { gamificationService } from "@/services/api/gamification";

export default function GamificationScreen() {
  const [progress, setProgress] = React.useState<UserProgress | null>(null);
  const [leaderboard, setLeaderboard] = React.useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { user } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      if (!user) return;

      const [userProgress, leaderboardData] = await Promise.all([
        gamificationService.getUserProgress(user.id),
        gamificationService.getLeaderboard(),
      ]);

      setProgress(userProgress);
      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error("Error loading gamification data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (!progress) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load gamification data</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          <View style={styles.progressContainer}>
            <View style={styles.levelContainer}>
              <Text style={styles.level}>Level {progress.level}</Text>
              <Text style={styles.points}>{progress.totalPoints} Points</Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${
                        (progress.totalPoints / progress.nextLevelPoints) * 100
                      }%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.nextLevel}>
                {progress.nextLevelPoints - progress.totalPoints} points to next
                level
              </Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{progress.reportsSubmitted}</Text>
              <Text style={styles.statLabel}>Reports</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{progress.reportsResolved}</Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{progress.currentStreak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{progress.rank}</Text>
              <Text style={styles.statLabel}>Rank</Text>
            </View>
          </View>
        </View>

        {/* Leaderboard Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leaderboard</Text>
          <View style={styles.leaderboardContainer}>
            {leaderboard.map((entry, index) => (
              <View key={entry.userId} style={styles.leaderboardRow}>
                <View style={styles.rankContainer}>
                  {index < 3 ? (
                    <Text style={[styles.rankEmoji, { fontSize: 24 }]}>
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                    </Text>
                  ) : (
                    <Text style={styles.rank}>#{index + 1}</Text>
                  )}
                </View>
                <View style={styles.userInfo}>
                  {entry.profileImage ? (
                    <Image
                      source={{ uri: entry.profileImage }}
                      style={styles.userImage}
                    />
                  ) : (
                    <View style={styles.userImagePlaceholder}>
                      <Text style={styles.userInitial}>
                        {entry.userName.charAt(0)}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.userName}>{entry.userName}</Text>
                </View>
                <View style={styles.pointsContainer}>
                  <Text style={styles.leaderboardPoints}>{entry.points}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollView: {
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 16,
  },
  progressContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  levelContainer: {
    alignItems: "center",
  },
  level: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
  },
  points: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 4,
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    marginTop: 16,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3B82F6",
    borderRadius: 4,
  },
  nextLevel: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1E293B",
  },
  statLabel: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },
  leaderboardContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  rankContainer: {
    width: 40,
    alignItems: "center",
  },
  rankEmoji: {
    fontSize: 20,
  },
  rank: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
  userInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 12,
  },
  userImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userImagePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  userInitial: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748B",
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1E293B",
    marginLeft: 8,
  },
  pointsContainer: {
    marginLeft: "auto",
  },
  leaderboardPoints: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3B82F6",
  },
});
