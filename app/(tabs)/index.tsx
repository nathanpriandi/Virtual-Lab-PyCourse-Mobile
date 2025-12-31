import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  SafeAreaView,
  Platform
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';

import { modules } from '../../constants/modules';
import Typewriter from '../../components/Typewriter';
import API_BASE_URL from '../../constants/Api';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 40) / 2 - 10; // 2 columns with padding

export default function HomeScreen() {
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showScrollIndicator, setShowScrollIndicator] = useState(true);
  const router = useRouter();

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    if (offsetY > 20 && showScrollIndicator) {
      setShowScrollIndicator(false);
    } else if (offsetY <= 0 && !showScrollIndicator) {
        setShowScrollIndicator(true);
    }
  };

  const fetchUserData = async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { 'x-auth-token': token },
        });
        if (response.ok) {
          const userData = await response.json();
          const completedIds = userData.progress
            .filter((p: any) => p.completed)
            .map((p: any) => p.moduleId);
          setCompletedModules(completedIds);
        } else if (response.status === 401) {
            // Token invalid
            router.replace('/auth');
        }
      } else {
        router.replace('/auth');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserData();
    setRefreshing(false);
  }, []);

  const renderModuleCard = ({ item: module, index }: { item: any, index: number }) => {
    const isCompleted = completedModules.includes(module.id);
    
    return (
      <TouchableOpacity
        key={module.id}
        style={[styles.card, isCompleted && styles.cardCompleted]}
        onPress={() => router.push(`/module/${module.id}`)}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
            <Image source={module.imageUrl} style={styles.cardImage} contentFit="cover" transition={1000} />
        </View>
        
        <LinearGradient
            colors={isCompleted ? ['#22c55e', '#16a34a'] : ['#0C0F97', '#4f46e5']}
            style={styles.moduleNumberContainer}
        >
            <Text style={styles.moduleNumber}>{index + 1}</Text>
        </LinearGradient>
        
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>{module.title}</Text>
          {isCompleted && (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>Completed</Text>
              <Ionicons name="checkmark-circle" size={14} color="#166534" style={{marginLeft: 4}} />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => {
    let nextModuleIndex = 0;
    if (completedModules.length > 0) {
      // Find the highest index among completed modules
      const maxCompletedIndex = modules.reduce((max, module, index) => {
        return completedModules.includes(module.id) ? Math.max(max, index) : max;
      }, -1);
      nextModuleIndex = maxCompletedIndex + 1;
    }
    
    const nextModule = nextModuleIndex < modules.length ? modules[nextModuleIndex] : null;

    return (
      <>
          <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.headerContainer}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
          >
              <Image 
                source={require('../../assets/pycourse-logo.png')} 
                style={styles.logo} 
                contentFit="contain" 
              />
              <Text style={styles.headerTitle}>Selamat Datang di PyCourse!</Text>
              <View style={styles.codeBlock}>
                  <Typewriter
                      texts={[
                          "user = 'PyCourse'",
                          "print('Hello PyCourse')",
                          'for i in range(5): ',
                          'def greet(user): ',
                      ]}
                      style={styles.codeText}
                  />
              </View>
          </LinearGradient>

          {nextModule && (
            <View style={styles.continueSection}>
                <Text style={styles.sectionTitle}>Lanjutkan Belajar</Text>
                <TouchableOpacity 
                    style={styles.continueCard}
                    onPress={() => router.push(`/module/${nextModule.id}`)}
                >
                    <Image source={nextModule.imageUrl} style={styles.continueImage} contentFit="cover" transition={1000} />
                    <View style={styles.continueContent}>
                        <Text style={styles.continueLabel}>MODUL {nextModuleIndex + 1}</Text>
                        <Text style={styles.continueTitle}>{nextModule.title}</Text>
                        <View style={styles.progressBar}>
                            <View style={[styles.progressFill, { width: `${(completedModules.length / modules.length) * 100}%` }]} />
                        </View>
                    </View>
                    <Ionicons name="play-circle" size={40} color="#4f46e5" />
                </TouchableOpacity>
            </View>
          )}

          <Text style={styles.sectionTitle}>Daftar Modul</Text>
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={modules}
          renderItem={renderModuleCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.contentContainer}
          ListHeaderComponent={renderHeader}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />
          }
        />
        {showScrollIndicator && (
            <View pointerEvents="none" style={styles.scrollIndicator}>
                <Text style={styles.scrollIndicatorText}>Scroll for more</Text>
                <Ionicons name="chevron-down" size={20} color="#6b7280" />
            </View>
        )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  scrollIndicator: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: 'row',
    gap: 6,
  },
  scrollIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
  },
  logo: {
    width: 150,
    height: 50,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  codeBlock: {
    backgroundColor: '#1e293b', // Dark background for code
    padding: 12,
    borderRadius: 8,
    width: '100%',
    minHeight: 50,
    justifyContent: 'center',
  },
  codeText: {
    color: '#38bdf8', // Cyan like text
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e1b4b',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  continueSection: {
    marginBottom: 24,
  },
  continueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  continueImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  continueContent: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  continueLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: 0.5,
  },
  continueTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e1b4b',
    marginVertical: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
    marginTop: 4,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4f46e5',
    borderRadius: 2,
  },
  card: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'visible', // For the number badge to stick out
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardCompleted: {
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
  },
  cardHeader: {
    position: 'relative',
    height: 140,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  cardImage: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  moduleNumberContainer: {
    position: 'absolute',
    top: -10,
    left: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  moduleNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cardContent: {
    padding: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e1b4b',
    marginBottom: 4,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginTop: 4,
  },
  completedText: {
    color: '#166534',
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});