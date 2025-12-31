import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import API_BASE_URL from '../constants/Api';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const router = useRouter();

  const handleSubmit = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    const path = isLogin ? '/api/auth/login' : '/api/auth/register';
    const url = `${API_BASE_URL}${path}`;
    const body = isLogin ? { email, password } : { username, email, password };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const contentType = response.headers.get('content-type');
      let data;
      if (contentType && contentType.indexOf('application/json') !== -1) {
        data = await response.json();
      } else {
        const text = await response.text();
        // Sometimes backend might send text error
        if (!response.ok) throw new Error(text || 'An error occurred');
      }

      if (response.ok) {
        if (isLogin) {
          if (data && data.token) {
            await SecureStore.setItemAsync('token', data.token);
            // Also store user info if needed, or fetch it later
            if (data.user) {
                await SecureStore.setItemAsync('user', JSON.stringify(data.user));
            }
            router.replace('/(tabs)');
          } else {
             setError('Login failed: No token received.');
          }
        } else {
          setIsLogin(true);
          setSuccess('Registration successful! Please log in.');
          setUsername('');
          setEmail('');
          setPassword('');
          Alert.alert('Success', 'Registration successful! Please log in.');
        }
      } else {
        setError(data?.msg || data?.message || 'An error occurred. Please try again.');
      }
    } catch (err: any) {
      setError('Failed to connect to the server. Please check your connection.');
      console.error('Error during authentication:', err);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setUsername('');
    setEmail('');
    setPassword('');
  };

  return (
    <LinearGradient
      colors={['#667eea', '#764ba2']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={{ flex: 1, width: '100%' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1, justifyContent: 'center', width: '100%' }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.authContainer}>
            <Text style={styles.title}>{isLogin ? 'Login' : 'Register'}</Text>

            {error ? <Text style={styles.errorMessage}>{error}</Text> : null}
            {success ? <Text style={styles.successMessage}>{success}</Text> : null}

            <View style={styles.form}>
              {!isLogin && (
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor="#9ca3af"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              )}
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isLogin ? 'Login' : 'Register'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>
                {isLogin ? "Don't have an account?" : 'Already have an account?'}
              </Text>
              <TouchableOpacity onPress={switchMode}>
                <Text style={styles.switchButtonText}>
                  {isLogin ? 'Register' : 'Login'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  authContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 30,
    borderRadius: 20,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    marginBottom: 30,
    fontSize: 32,
    color: '#667eea',
    fontWeight: '700',
    textAlign: 'center',
  },
  form: {
    gap: 20,
    marginTop: 10,
  },
  input: {
    padding: 15,
    borderWidth: 2,
    borderColor: '#e0e7ff',
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#667eea', // Fallback
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 5,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  switchContainer: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  switchText: {
    color: '#6b7280',
    fontSize: 15,
  },
  switchButtonText: {
    color: '#667eea',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 5,
  },
  errorMessage: {
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    padding: 15,
    marginBottom: 15,
    borderRadius: 12,
    fontSize: 14,
  },
  successMessage: {
    color: '#16a34a',
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    padding: 15,
    marginBottom: 15,
    borderRadius: 12,
    fontSize: 14,
  },
});
