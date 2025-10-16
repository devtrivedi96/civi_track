import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Report } from '@/types/report';
import { REPORT_CATEGORIES, STATUS_LABELS } from '@/utils/constants/categories';

interface ReportCardProps {
  report: Report;
  onPress: () => void;
  showUser?: boolean;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  report,
  onPress,
  showUser = true,
}) => {
  const category = REPORT_CATEGORIES[report.category];
  const status = STATUS_LABELS[report.status];

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.categoryContainer}>
          <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
            <Ionicons name={category.icon as any} size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.categoryText}>{category.label}</Text>
        </View>
        
        <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
          <Text style={styles.statusText}>{status.label}</Text>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {report.title}
      </Text>

      <Text style={styles.description} numberOfLines={3}>
        {report.description}
      </Text>

      {report.images.length > 0 && (
        <Image
          source={{ uri: report.images[0] }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      <View style={styles.footer}>
        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={14} color="#6B7280" />
          <Text style={styles.locationText} numberOfLines={1}>
            {report.location.address}
          </Text>
        </View>
        
        <View style={styles.meta}>
          <View style={styles.engagement}>
            <View style={styles.engagementItem}>
              <Ionicons name="arrow-up" size={14} color="#10B981" />
              <Text style={styles.engagementText}>{report.upvotes}</Text>
            </View>
            <View style={styles.engagementItem}>
              <Ionicons name="chatbubble-outline" size={14} color="#6B7280" />
              <Text style={styles.engagementText}>{report.commentsCount}</Text>
            </View>
          </View>
          
          <Text style={styles.timeText}>
            {formatTimeAgo(report.createdAt)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  },
  footer: {
    gap: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    flex: 1,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  engagement: {
    flexDirection: 'row',
    gap: 16,
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  engagementText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
  },
});