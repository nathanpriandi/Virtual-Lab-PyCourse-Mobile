import React, { useState, useEffect, useRef } from 'react';
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
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { WebView } from 'react-native-webview';
import RenderHtml from 'react-native-render-html';
import * as SecureStore from 'expo-secure-store';
import { Asset } from 'expo-asset';
import { Ionicons } from '@expo/vector-icons';

import { modules } from '../../constants/modules';
import API_BASE_URL from '../../constants/Api';
import Quiz from '../../components/Quiz';

const { width } = Dimensions.get('window');

export default function ModuleScreen() {
  const { id } = useLocalSearchParams();
  const [view, setView] = useState('materi'); // materi | code | quiz | result
  const [initialCode, setInitialCode] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<any>(null);
  const webViewRef = useRef<WebView>(null);
  const router = useRouter();

  // Find module data
  const moduleData = modules.find((m) => m.id === id);

  // Load editor asset
  const [editorUri, setEditorUri] = useState<string | null>(null);
  
  useEffect(() => {
    // Determine editor HTML URI
    if (Platform.OS === 'android') {
        // For Android, we use file:///android_asset if bundled, but Expo dev client serves from localhost
        // A simpler way for Expo Go is using require and Asset module
        const asset = Asset.fromModule(require('../../assets/editor.html'));
        setEditorUri(asset.uri);
    } else {
        const asset = Asset.fromModule(require('../../assets/editor.html'));
        setEditorUri(asset.uri);
    }
  }, []);

  useEffect(() => {
    if (!moduleData) return;

    const setupModule = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (!token) {
        setInitialCode(moduleData.defaultCode || "# Silakan login untuk menyimpan kodemu\nprint('Hello, World!')");
        return;
      }

      try {
        // Mark as started (optional, based on web logic)
        // await fetch(`${API_BASE_URL}/api/progress/complete-module`, ...); 

        const userRes = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { 'x-auth-token': token },
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          const progress = userData.progress.find((p: any) => p.moduleId === id);
          
          const savedCode = progress?.userCode;
          const defaultCode = moduleData.defaultCode || "# Tulis kodemu di sini\nprint('Hello, World!')";
          
          setInitialCode(savedCode ?? defaultCode);
        } else {
            setInitialCode(moduleData.defaultCode);
        }
      } catch (error) {
        console.error('Error setting up module:', error);
        setInitialCode(moduleData.defaultCode);
      }
    };

    setupModule();
  }, [id, moduleData]);

  const handleMessage = async (event: any) => {
    try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'ready') {
            // Inject initial code when editor is ready
            if (initialCode) {
                const injectCode = JSON.stringify({ type: 'setCode', code: initialCode });
                webViewRef.current?.postMessage(injectCode);
            }
        } else if (data.type === 'save') {
            // Save code to backend
            const token = await SecureStore.getItemAsync('token');
            if (token) {
                await fetch(`${API_BASE_URL}/api/progress/save-code`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-auth-token': token,
                    },
                    body: JSON.stringify({ moduleId: id, code: data.code }),
                });
            }
        }
    } catch (e) {
        console.log("Message error", e);
    }
  };

  const handleQuizComplete = async (answers: any[]) => {
    try {
      const token = await SecureStore.getItemAsync('token');
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
        setView('result');
      } else {
        Alert.alert('Error', 'Failed to submit quiz');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      Alert.alert('Error', 'Network error');
    }
  };

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
                    {editorUri ? (
                        <WebView
                            ref={webViewRef}
                            source={{ uri: editorUri }}
                            style={{ flex: 1, backgroundColor: '#1e1e1e' }}
                            onMessage={handleMessage}
                            javaScriptEnabled={true}
                            originWhitelist={['*']}
                            allowFileAccess={true}
                            scrollEnabled={true}
                            nestedScrollEnabled={true}
                        />
                    ) : (
                        <ActivityIndicator size="large" color="#4f46e5" style={{marginTop: 50}} />
                    )}
                </View>

                <View style={styles.consoleHint}>
                    <Ionicons name="terminal-outline" size={20} color="#6b7280" />
                    <Text style={styles.consoleHintText}>
                        Klik tombol "Run" di dalam editor untuk melihat hasil.
                    </Text>
                </View>
            </ScrollView>
        );
      case 'quiz':
        return moduleData.quiz ? (
          <Quiz quizData={moduleData.quiz} onQuizComplete={handleQuizComplete} />
        ) : (
          <View style={styles.center}><Text>No Quiz Available</Text></View>
        );
      case 'result':
        if (!quizResult || !quizResult.detailedResults) {
            return <ActivityIndicator />;
        }
        const correctAnswers = quizResult.detailedResults.filter((r: any) => r.correct).length;
        const totalQuestions = quizResult.detailedResults.length;
        
        return (
            <ScrollView contentContainerStyle={styles.resultContainer}>
                <Text style={styles.resultTitle}>Hasil Kuis</Text>
                <Text style={styles.scoreText}>Skor Anda:</Text>
                <Text style={styles.scoreValue}>{quizResult.score}%</Text>
                
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Benar</Text>
                        <Text style={[styles.summaryValue, {color: '#16a34a'}]}>{correctAnswers}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Salah</Text>
                        <Text style={[styles.summaryValue, {color: '#dc2626'}]}>{totalQuestions - correctAnswers}</Text>
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
            <Text style={styles.moduleTitle}>{moduleData.title}</Text>
            <RenderHtml
              contentWidth={width - 40}
              source={{ html: moduleData.materi }}
              tagsStyles={{
                p: { fontSize: 16, lineHeight: 24, color: '#374151', marginBottom: 10 },
                h3: { fontSize: 20, fontWeight: 'bold', color: '#1e1b4b', marginTop: 20, marginBottom: 10 },
                code: { backgroundColor: '#f3f4f6', fontFamily: 'monospace', padding: 2, borderRadius: 4, color: '#dc2626' },
                pre: { backgroundColor: '#1f2937', padding: 12, borderRadius: 8, overflow: 'hidden' },
                li: { fontSize: 16, marginBottom: 6 },
              }}
            />
            {moduleData.quiz && (
                <View style={styles.quizPrompt}>
                    <Text style={styles.quizPromptTitle}>Uji Pemahaman Anda</Text>
                    <Text style={styles.quizPromptText}>Selesaikan kuis singkat untuk menguji apa yang telah Anda pelajari.</Text>
                    <TouchableOpacity style={styles.primaryButton} onPress={() => setView('quiz')}> 
                        <Text style={styles.primaryButtonText}>Mulai Kuis</Text>
                    </TouchableOpacity>
                </View>
            )}
          </ScrollView>
        );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: moduleData.title }} />
      
      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
            style={[styles.tabButton, view === 'materi' && styles.activeTab]} 
            onPress={() => setView('materi')}
        >
            <Text style={[styles.tabText, view === 'materi' && styles.activeTabText]}>Materi</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.tabButton, view === 'code' && styles.activeTab]} 
            onPress={() => setView('code')}
        >
            <Text style={[styles.tabText, view === 'code' && styles.activeTabText]}>Lab Code</Text>
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.tabButton, (view === 'quiz' || view === 'result') && styles.activeTab]} 
            onPress={() => setView('quiz')}
        >
            <Text style={[styles.tabText, (view === 'quiz' || view === 'result') && styles.activeTabText]}>Quiz</Text>
        </TouchableOpacity>
      </View>

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
  moduleTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e1b4b',
    marginBottom: 20,
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
    gap: 8,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  consoleHintText: {
    fontSize: 13,
    color: '#6b7280',
    flex: 1,
  },
});
