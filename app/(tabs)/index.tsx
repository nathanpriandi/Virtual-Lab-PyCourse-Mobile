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
  const router = useRouter();

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
            <Image source={module.imageUrl} style={styles.cardImage} contentFit="cover" />
            <LinearGradient
                colors={isCompleted ? ['#22c55e', '#16a34a'] : ['#0C0F97', '#4f46e5']}
                style={styles.moduleNumberContainer}
            >
                <Text style={styles.moduleNumber}>{index + 1}</Text>
            </LinearGradient>
        </View>
        
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

  const renderHeader = () => (
    <>
        <LinearGradient
            colors={['#f0f4ff', '#e0e7ff']}
            style={styles.headerContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
        >
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

        <Text style={styles.sectionDescription}>
            Silakan pilih modul di bawah ini untuk memulai perjalanan belajar Python Anda.
        </Text>
        
        <Text style={styles.sectionTitle}>Daftar Modul</Text>
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
        <FlatList
          data={modules}
          renderItem={renderModuleCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.contentContainer}
          ListHeaderComponent={renderHeader}
          refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4f46e5" />
          }
        />
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
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e1b4b',
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
  sectionDescription: {
    fontSize: 15,
    color: '#4b5563',
    marginBottom: 16,
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e1b4b',
    marginBottom: 16,
    paddingHorizontal: 4,
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
    height: 100,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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