import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
  ActivityIndicator,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

import { getToken, removeToken } from '@/utils/storage';
import { modules } from '../../constants/modules';
import API_BASE_URL from '../../constants/Api';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isProgressExpanded, setIsProgressExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchUserData = async () => {
    try {
      const token = await getToken('token');
      if (!token) {
        router.replace('/auth');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'x-auth-token': token },
      });

      if (response.ok) {
        setUser(await response.json());
      } else {
        await removeToken('token');
        router.replace('/auth');
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      // Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isMounted) {
      fetchUserData();
    }
  }, [isMounted]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  }, []);

  const handleLogout = async () => {
    await removeToken('token');
    await removeToken('user');
    router.replace('/auth');
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    setUploading(true);
    try {
      const token = await getToken('token');
      if (!token) return;

      const formData = new FormData();
      
      // Extract file name and type
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename || '');
      const type = match ? `image/${match[1]}` : `image`;

      // @ts-ignore
      formData.append('avatar', { uri, name: filename, type });

      const response = await fetch(`${API_BASE_URL}/api/auth/me/avatar/upload`, {
        method: 'POST',
        headers: {
          'x-auth-token': token,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        Alert.alert('Success', 'Avatar updated!');
      } else {
        Alert.alert('Error', 'Failed to upload avatar');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Network error during upload');
    } finally {
      setUploading(false);
    }
  };

  const progressStats = useMemo(() => {
    if (!user) return { completedCount: 0, totalModules: 0, percentage: 0, completedIds: new Set() };

    const completedIds = new Set(user.progress.filter((p: any) => p.completed).map((p: any) => p.moduleId));
    const totalModules = modules.length;
    const completedCount = completedIds.size;
    const percentage = totalModules > 0 ? (completedCount / totalModules) * 100 : 0;

    return { completedCount, totalModules, percentage, completedIds };
  }, [user]);

  const getAvatarUri = () => {
    if (user?.avatar) {
        // Handle relative path from backend if needed, assuming backend returns full URL or relative
        if (user.avatar.startsWith('http')) return user.avatar;
        return `${API_BASE_URL}${user.avatar}`;
    }
    return `https://ui-avatars.com/api/?name=${user?.username || 'User'}&background=random`;
  };

  if (!isMounted) return null;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        <View style={styles.card}>
          <View style={styles.avatarContainer}>
            <Image
                source={{ uri: getAvatarUri() }}
                style={styles.avatar}
            />
            <TouchableOpacity style={styles.editAvatarButton} onPress={pickImage} disabled={uploading}>
                {uploading ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Ionicons name="camera" size={20} color="#fff" />
                )}
            </TouchableOpacity>
          </View>

          <Text style={styles.username}>{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Pencapaian Modul</Text>
                <Text style={styles.progressCount}>
                    {progressStats.completedCount} dari {progressStats.totalModules} modul
                </Text>
            </View>
            <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${progressStats.percentage}%` }]} />
            </View>
            
            <TouchableOpacity 
                style={styles.expandButton} 
                onPress={() => setIsProgressExpanded(!isProgressExpanded)}
            >
                <Text style={styles.expandButtonText}>
                    {isProgressExpanded ? 'Sembunyikan Detail' : 'Lihat Detail'}
                </Text>
            </TouchableOpacity>

            {isProgressExpanded && (
                <View style={styles.moduleList}>
                    {modules.map((module) => {
                        const isCompleted = progressStats.completedIds.has(module.id);
                        const moduleProgress = user?.progress?.find((p: any) => p.moduleId === module.id);
                        return (
                            <View key={module.id} style={styles.moduleItem}>
                                <Text style={styles.moduleTitle}>{module.title}</Text>
                                <View style={styles.moduleRight}>
                                    {moduleProgress && moduleProgress.quizScore !== undefined && (
                                        <Text style={styles.scoreBadge}>Skor: {moduleProgress.quizScore}%</Text>
                                    )}
                                    <Ionicons 
                                        name={isCompleted ? "checkmark-circle" : "ellipse-outline"} 
                                        size={24} 
                                        color={isCompleted ? "#22c55e" : "#d1d5db"} 
                                    />
                                </View>
                            </View>
                        );
                    })}
                </View>
            )}
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
    minHeight: '100%',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: '#e0e7ff',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4f46e5',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 30,
  },
  progressSection: {
    width: '100%',
    backgroundColor: '#f9fafb',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressLabel: {
    fontWeight: '600',
    color: '#374151',
  },
  progressCount: {
    color: '#6b7280',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#e5e7eb',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 15,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4f46e5',
    borderRadius: 5,
  },
  expandButton: {
    alignSelf: 'center',
    padding: 5,
  },
  expandButtonText: {
    color: '#4f46e5',
    fontWeight: '600',
  },
  moduleList: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  moduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  moduleTitle: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    marginRight: 10,
  },
  moduleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scoreBadge: {
    fontSize: 12,
    color: '#4f46e5',
    backgroundColor: '#eef2ff',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    fontWeight: '600',
  },
  logoutButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
    backgroundColor: '#fee2e2',
  },
  logoutText: {
    color: '#b91c1c',
    fontWeight: '600',
    fontSize: 16,
  },
});
