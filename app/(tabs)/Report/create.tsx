import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { ReportCategory, ReportSeverity } from '@/types/report';
import { REPORT_CATEGORIES, SEVERITY_LEVELS } from '@/utils/constants/categories';
import { reportsService } from '@/services/api/reports';
import { useAuth } from '@/services/auth/authContext';
import { Button } from '@/components/common/Button';
import { Loading } from '@/components/common/Loading';

export default function CreateReportScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [severity, setSeverity] = useState<ReportSeverity>(ReportSeverity.MEDIUM);
  const [images, setImages] = useState<string[]>([]);
  const [location, setLocation] = useState<any>(null);
  const [address, setAddress] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Permission to access location was denied');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const place = reverseGeocode[0];
        const addressString = `${place.name || ''} ${place.street || ''} ${place.city || ''} ${place.region || ''}`.trim();
        setAddress(addressString);
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setLocationLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => asset.uri);
      setImages(prev => [...prev, ...newImages].slice(0, 5)); // Max 5 images
    }
  };

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]) {
      setImages(prev => [...prev, result.assets[0].uri].slice(0, 5));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !category || !location) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      
      const reportData = {
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        location: {
          ...location,
          address: address.trim(),
        },
        images,
        isAnonymous,
        userId: user?.id || '',
      };

      await reportsService.createReport(reportData);
      Alert.alert('Success', 'Report submitted successfully!');
      router.back();
    } catch (error) {
      console.error('Error creating report:', error);
      Alert.alert('Error', 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message="Submitting your report..." />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Submit Report</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Report Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Brief title for your report"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Detailed description of the issue"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoriesRow}>
              {Object.entries(REPORT_CATEGORIES).map(([key, cat]) => (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.categoryCard,
                    category === key && { backgroundColor: cat.color, transform: [{ scale: 0.95 }] }
                  ]}
                  onPress={() => setCategory(key as ReportCategory)}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={24}
                    color={category === key ? '#FFFFFF' : cat.color}
                  />
                  <Text style={[
                    styles.categoryLabel,
                    category === key && { color: '#FFFFFF' }
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Severity</Text>
          <View style={styles.severityRow}>
            {Object.entries(SEVERITY_LEVELS).map(([key, level]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.severityChip,
                  severity === key && { backgroundColor: level.color }
                ]}
                onPress={() => setSeverity(key as ReportSeverity)}
              >
                <Text style={[
                  styles.severityText,
                  severity === key && { color: '#FFFFFF' }
                ]}>
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <View style={styles.imageActions}>
            <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
              <Ionicons name="camera" size={20} color="#2563EB" />
              <Text style={styles.imageButtonText}>Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Ionicons name="image" size={20} color="#2563EB" />
              <Text style={styles.imageButtonText}>Gallery</Text>
            </TouchableOpacity>
          </View>
          
          {images.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.imagesRow}>
                {images.map((uri, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          {locationLoading ? (
            <View style={styles.locationLoading}>
              <Loading message="Getting current location..." />
            </View>
          ) : (
            <View style={styles.locationCard}>
              <Ionicons name="location" size={20} color="#10B981" />
              <Text style={styles.locationText}>
                {address || 'Location not available'}
              </Text>
              <TouchableOpacity onPress={getCurrentLocation}>
                <Ionicons name="refresh" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.anonymousToggle}
            onPress={() => setIsAnonymous(!isAnonymous)}
          >
            <View style={styles.anonymousInfo}>
              <Ionicons name="eye-off" size={20} color="#6B7280" />
              <Text style={styles.anonymousText}>Submit anonymously</Text>
            </View>
            <View style={[styles.toggle, isAnonymous && styles.toggleActive]}>
              <View style={[styles.toggleHandle, isAnonymous && styles.toggleHandleActive]} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Submit Report"
          onPress={handleSubmit}
          loading={loading}
          disabled={!title.trim() || !description.trim() || !category || !location}
          style={styles.submitButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  categoriesRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  categoryCard: {
    alignItems: 'center',
    padding: 16,
    marginRight: 12,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 90,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
    marginTop: 6,
    textAlign: 'center',
  },
  severityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  severityChip: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  severityText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  imageActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  imageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  imageButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
    marginLeft: 8,
  },
  imagesRow: {
    flexDirection: 'row',
    paddingVertical: 8,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  locationLoading: {
    paddingVertical: 20,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#166534',
    marginLeft: 8,
  },
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  anonymousInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  anonymousText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#D1D5DB',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#2563EB',
  },
  toggleHandle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  toggleHandleActive: {
    marginLeft: 'auto',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  submitButton: {
    backgroundColor: '#2563EB',
  },
});