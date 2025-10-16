import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Report } from '@/types/report';
import { useAuth } from '@/services/auth/authContext';
import { reportsService } from '@/services/api/reports';
import { ReportCard } from '@/components/reports/ReportCard';
import { Loading } from '@/components/common/Loading';
import { STATUS_LABELS } from '@/utils/constants/categories';

export default function MyReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      loadMyReports();
    }
  }, [user, selectedStatus]);

  const loadMyReports = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await reportsService.getReports({
        userId: user.id,
        status: selectedStatus as any,
      });
      setReports(data);
    } catch (error) {
      console.error('Error loading my reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadMyReports();
  };

  const handleReportPress = (reportId: string) => {
    router.push(`/Report/${reportId}`);
  };

  const getStatusCounts = () => {
    return {
      total: reports.length,
      submitted: reports.filter(r => r.status === 'submitted').length,
      in_progress: reports.filter(r => r.status === 'in_progress').length,
      resolved: reports.filter(r => r.status === 'resolved').length,
    };
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Reports</Text>
        <Text style={styles.headerSubtitle}>
          {statusCounts.total} reports submitted
        </Text>
      </View>

      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={[
            styles.statCard,
            !selectedStatus && styles.statCardActive
          ]}
          onPress={() => setSelectedStatus(null)}
        >
          <Text style={[
            styles.statValue,
            !selectedStatus && styles.statValueActive
          ]}>
            {statusCounts.total}
          </Text>
          <Text style={[
            styles.statLabel,
            !selectedStatus && styles.statLabelActive
          ]}>
            Total
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statCard,
            selectedStatus === 'submitted' && styles.statCardActive
          ]}
          onPress={() => setSelectedStatus(selectedStatus === 'submitted' ? null : 'submitted')}
        >
          <Text style={[
            styles.statValue,
            selectedStatus === 'submitted' && styles.statValueActive
          ]}>
            {statusCounts.submitted}
          </Text>
          <Text style={[
            styles.statLabel,
            selectedStatus === 'submitted' && styles.statLabelActive
          ]}>
            Pending
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statCard,
            selectedStatus === 'in_progress' && styles.statCardActive
          ]}
          onPress={() => setSelectedStatus(selectedStatus === 'in_progress' ? null : 'in_progress')}
        >
          <Text style={[
            styles.statValue,
            selectedStatus === 'in_progress' && styles.statValueActive
          ]}>
            {statusCounts.in_progress}
          </Text>
          <Text style={[
            styles.statLabel,
            selectedStatus === 'in_progress' && styles.statLabelActive
          ]}>
            In Progress
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statCard,
            selectedStatus === 'resolved' && styles.statCardActive
          ]}
          onPress={() => setSelectedStatus(selectedStatus === 'resolved' ? null : 'resolved')}
        >
          <Text style={[
            styles.statValue,
            selectedStatus === 'resolved' && styles.statValueActive
          ]}>
            {statusCounts.resolved}
          </Text>
          <Text style={[
            styles.statLabel,
            selectedStatus === 'resolved' && styles.statLabelActive
          ]}>
            Resolved
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ReportCard
            report={item}
            onPress={() => handleReportPress(item.id)}
            showUser={false}
          />
        )}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No Reports Found</Text>
            <Text style={styles.emptySubtitle}>
              {selectedStatus 
                ? `You have no ${STATUS_LABELS[selectedStatus as keyof typeof STATUS_LABELS]?.label.toLowerCase()} reports`
                : 'You haven\'t submitted any reports yet'
              }
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/Report/create')}
            >
              <Text style={styles.createButtonText}>Submit First Report</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginHorizontal: 4,
    backgroundColor: '#F8FAFC',
  },
  statCardActive: {
    backgroundColor: '#2563EB',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statValueActive: {
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statLabelActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    paddingTop: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});