import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  ScrollView,
  Platform,
  Alert
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack, useNavigation } from 'expo-router';
import RenderHtml from 'react-native-render-html';
import { Ionicons } from '@expo/vector-icons';

import { getToken } from '@/utils/storage';
import { modules } from '../../constants/modules';
import API_BASE_URL from '../../constants/Api';
import Quiz from '../../components/Quiz';
import CodeEditor from '../../components/CodeEditor';

const { width } = Dimensions.get('window');

export default function ModuleScreen() {
  const { id } = useLocalSearchParams();
  const [view, setView] = useState('materi'); // materi | code | quiz | result
  const [initialCode, setInitialCode] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const navigation = useNavigation();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      if (view === 'quiz' || view === 'result') {
        e.preventDefault();
        setView('materi');
      }
    });

    return unsubscribe;
  }, [navigation, view]);

  // Find module data
  const moduleData = modules.find((m) => m.id === id);

  useEffect(() => {
    if (!moduleData || !isMounted) return;

    const setupModule = async () => {
      const token = await getToken('token');
      if (!token) {
        setInitialCode(moduleData.defaultCode || "# Silakan login untuk menyimpan kodemu\nprint('Hello, World!')");
        return;
      }

      try {
        const userRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { 'x-auth-token': token },
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          const progress = userData.progress.find((p: any) => p.moduleId === id);
          
          if (progress) {
            setInitialCode(progress.userCode ?? moduleData.defaultCode);
            setIsCompleted(progress.completed);
            setBestScore(progress.quizScore);
          } else {
             setInitialCode(moduleData.defaultCode || "# Tulis kodemu di sini\nprint('Hello, World!')");
          }
        } else {
            setInitialCode(moduleData.defaultCode);
        }
      } catch (error) {
        console.error('Error setting up module:', error);
        setInitialCode(moduleData.defaultCode);
      }
    };

    setupModule();
  }, [id, moduleData, isMounted]);

  const handleSaveCode = async (code: string) => {
    try {
        const token = await getToken('token');
        if (token) {
            await fetch(`${API_BASE_URL}/api/progress/save-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': token,
                },
                body: JSON.stringify({ moduleId: id, code: code }),
            });
        }
    } catch (e) {
        console.log("Save error", e);
    }
  };

  const handleQuizComplete = async (answers: any[]) => {
    try {
      const token = await getToken('token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/progress/submit-quiz`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
        body: JSON.stringify({ moduleId: id, answers }),
      });

      if (response.ok) {
        const result = await response.json();
        setQuizResult(result);
        if (result.score === 100) setIsCompleted(true);
        if (result.score > (bestScore || 0)) setBestScore(result.score);
        setView('result'); 
      } else {
        Alert.alert('Error', 'Failed to submit quiz');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      Alert.alert('Error', 'Network error');
    }
  };

  if (!isMounted) return null;

  if (!moduleData) {
    return (
      <View style={styles.center}>
        <Text>Module not found</Text>
      </View>
    );
  }

  const renderContent = () => {
    switch (view) {
      case 'code':
        return (
            <ScrollView contentContainerStyle={styles.codeContainer}>
                <Text style={styles.codeHeader}>Virtual Lab Editor</Text>
                <Text style={styles.codeInstruction}>
                    Tulis kodemu di bawah ini. Editor ini mendukung syntax highlighting Python.
                </Text>

                <View style={styles.editorWrapper}>
                    <CodeEditor 
                        initialCode={initialCode} 
                        onSave={handleSaveCode} 
                    />
                </View>

                <View style={styles.consoleHint}>
                    <Ionicons name="play-circle-outline" size={24} color="#4f46e5" />
                    <Text style={styles.consoleHintText}>
                        Tekan tombol "Run" di pojok kanan atas editor untuk menjalankan kodemu.
                    </Text>
                </View>
            </ScrollView>
        );
      case 'quiz':
        return moduleData.quiz ? (
          <ScrollView contentContainerStyle={styles.contentContainer}>
            <Quiz 
                quizData={moduleData.quiz} 
                onQuizComplete={handleQuizComplete} 
            />
          </ScrollView>
        ) : null;
      case 'result':
         if (!quizResult || !quizResult.detailedResults) {
            return <ActivityIndicator />;
         }
         return (
            <ScrollView contentContainerStyle={styles.resultContainer}>
                <Text style={styles.resultTitle}>Hasil Kuis</Text>
                <Text style={styles.scoreText}>Skor Anda:</Text>
                <Text style={styles.scoreValue}>{quizResult.score}%</Text>
                
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Benar</Text>
                        <Text style={[styles.summaryValue, {color: '#16a34a'}]}>
                            {quizResult.detailedResults.filter((r: any) => r.correct).length}
                        </Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Salah</Text>
                        <Text style={[styles.summaryValue, {color: '#dc2626'}]}>
                            {quizResult.detailedResults.length - quizResult.detailedResults.filter((r: any) => r.correct).length}
                        </Text>
                    </View>
                </View>

                {quizResult.score === 100 && (
                    <Text style={styles.congratsMessage}>Kerja bagus! Modul ini telah ditandai selesai.</Text>
                )}
                
                <TouchableOpacity style={styles.primaryButton} onPress={() => setView('materi')}> 
                    <Text style={styles.primaryButtonText}>Kembali ke Materi</Text>
                </TouchableOpacity>
            </ScrollView>
         );
      case 'materi':
      default:
        return (
          <ScrollView contentContainerStyle={styles.contentContainer}>
            <View style={styles.headerRow}>
                <Text style={styles.moduleTitle}>{moduleData.title}</Text>
                {isCompleted && (
                    <View style={styles.completedBadgeHeader}>
                        <Ionicons name="checkmark-circle" size={16} color="#166534" />
                        <Text style={styles.completedTextHeader}>Selesai</Text>
                    </View>
                )}
            </View>
            <RenderHtml
              contentWidth={width - 40}
              source={{ html: moduleData.materi }}
              tagsStyles={{
                p: { fontSize: 16, lineHeight: 24, color: '#374151', marginBottom: 10 },
                h3: { fontSize: 20, fontWeight: 'bold', color: '#1e1b4b', marginTop: 20, marginBottom: 10 },
                code: { backgroundColor: '#f1f5f9', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', padding: 4, borderRadius: 4, color: '#0891b2' },
                pre: { backgroundColor: '#1e293b', color: '#f8fafc', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', padding: 12, borderRadius: 8, overflow: 'hidden' },
                li: { fontSize: 16, marginBottom: 6 },
              }}
            />
            
            {moduleData.quiz && (
                <View style={styles.quizPrompt}>
                    <Text style={styles.quizPromptTitle}>
                        {isCompleted ? 'Modul Selesai' : 'Uji Pemahaman Anda'}
                    </Text>
                    <Text style={styles.quizPromptText}>
                        {isCompleted 
                            ? `Anda telah menyelesaikan modul ini dengan skor ${bestScore}%.` 
                            : 'Selesaikan kuis singkat untuk menguji apa yang telah Anda pelajari.'}
                    </Text>
                    <TouchableOpacity style={styles.primaryButton} onPress={() => setView('quiz')}> 
                        <Text style={styles.primaryButtonText}>{isCompleted ? 'Ulangi Kuis' : 'Mulai Kuis'}</Text>
                    </TouchableOpacity>
                </View>
            )}
          </ScrollView>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen 
        options={{ 
            title: moduleData.title,
        }} 
      />
      
      {/* Tab Navigation - Only show in Materi or Code view */}
      {(view === 'materi' || view === 'code') && (
        <View style={styles.tabContainer}>
            <TouchableOpacity 
                style={[styles.tabButton, view === 'materi' && styles.activeTab]} 
                onPress={() => setView('materi')}
            >
                <Text style={[styles.tabText, view === 'materi' && styles.activeTabText]}>Belajar</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                style={[styles.tabButton, view === 'code' && styles.activeTab]} 
                onPress={() => setView('code')}
            >
                <Text style={[styles.tabText, view === 'code' && styles.activeTabText]}>Kode</Text>
            </TouchableOpacity>
        </View>
      )}

      <View style={styles.contentArea}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4f46e5',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#4f46e5',
    fontWeight: '700',
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 10,
  },
  moduleTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e1b4b',
    flex: 1,
  },
  completedBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 4,
    marginTop: 4,
  },
  completedTextHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#166534',
  },
  primaryButton: {
    backgroundColor: '#4f46e5',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  quizPrompt: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#e0e7ff',
    borderRadius: 16,
    alignItems: 'center',
  },
  quizPromptTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e1b4b',
    marginBottom: 8,
  },
  quizPromptText: {
    textAlign: 'center',
    color: '#4b5563',
    marginBottom: 16,
  },
  resultContainer: {
    padding: 30,
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e1b4b',
    marginBottom: 20,
  },
  scoreText: {
    fontSize: 16,
    color: '#6b7280',
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '800',
    color: '#4f46e5',
    marginBottom: 30,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 30,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  congratsMessage: {
    textAlign: 'center',
    color: '#16a34a',
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#dcfce7',
    padding: 10,
    borderRadius: 8,
  },
  codeContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  codeHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e1b4b',
    marginBottom: 8,
  },
  codeInstruction: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 16,
    lineHeight: 20,
  },
  editorWrapper: {
    height: 400,
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#1e1e1e',
    marginBottom: 16,
  },
  consoleHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#c7d2fe',
  },
  consoleHintText: {
    fontSize: 14,
    color: '#4338ca',
    fontWeight: '500',
    flex: 1,
    lineHeight: 20,
  },
});
