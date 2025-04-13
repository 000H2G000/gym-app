import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  browserSessionPersistence, 
  browserLocalPersistence, 
  setPersistence, 
  AuthError 
} from 'firebase/auth';
import Spinner from 'react-native-loading-spinner-overlay';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { auth } from '../../firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const colorScheme = useColorScheme();

  // Check for saved credentials on component mount
  useEffect(() => {
    const loadSavedCredentials = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('userEmail');
        if (savedEmail) {
          setEmail(savedEmail);
          setRememberMe(true);
        }
      } catch (error) {
        console.error('Error loading saved credentials:', error);
      }
    };

    loadSavedCredentials();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Set persistence type based on "Remember Me" option
      if (Platform.OS === 'web') {
        const persistenceType = rememberMe 
          ? browserLocalPersistence 
          : browserSessionPersistence;
        
        await setPersistence(auth, persistenceType);
      }
      
      // Sign in user
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Get the ID token
      const idToken = await userCredential.user.getIdToken();
      
      // Save authentication token and email if "Remember Me" is checked
      if (rememberMe) {
        await AsyncStorage.setItem('userEmail', email);
        await AsyncStorage.setItem('authToken', idToken);
      } else {
        // Clear saved credentials if "Remember Me" is unchecked
        await AsyncStorage.removeItem('userEmail');
        await AsyncStorage.removeItem('authToken');
      }
      
      console.log('Login successful, session token stored');
      
      // Successful login will navigate to main app via _layout.tsx auth check
    } catch (error: unknown) {
      console.error('Login error:', error);
      let errorMessage = 'Invalid email or password. Please try again.';
      
      const authError = error as AuthError;
      if (authError.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please sign up.';
      } else if (authError.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again.';
      } else if (authError.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed login attempts. Please try again later.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      alert('Password reset email sent. Check your inbox.');
    } catch (error) {
      setError('Failed to send password reset email. Please try again.');
      console.log('Reset password error:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToSignup = () => {
    router.push('/auth/signup');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: 'https://img.icons8.com/ios-filled/100/FFFFFF/dumbbell.png' }} 
              style={[styles.logo, { tintColor: Colors[colorScheme ?? 'light'].tint }]} 
            />
            <Text style={[styles.appName, { color: Colors[colorScheme ?? 'light'].text }]}>
              Fitness Buddy
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
              Login
            </Text>
            
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                Email Address
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: Colors[colorScheme ?? 'light'].cardBackground,
                    color: Colors[colorScheme ?? 'light'].text,
                    borderColor: Colors[colorScheme ?? 'light'].border 
                  }
                ]}
                placeholder="Enter your email"
                placeholderTextColor={Colors[colorScheme ?? 'light'].placeholderText}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                Password
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: Colors[colorScheme ?? 'light'].cardBackground,
                    color: Colors[colorScheme ?? 'light'].text,
                    borderColor: Colors[colorScheme ?? 'light'].border 
                  }
                ]}
                placeholder="Enter your password"
                placeholderTextColor={Colors[colorScheme ?? 'light'].placeholderText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={styles.forgotPasswordContainer}
              onPress={handleForgotPassword}
            >
              <Text style={[styles.forgotPasswordText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Remember Me checkbox */}
            <TouchableOpacity 
              style={styles.rememberMeContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[
                styles.checkbox, 
                { 
                  borderColor: Colors[colorScheme ?? 'light'].tint,
                  backgroundColor: rememberMe ? Colors[colorScheme ?? 'light'].tint : 'transparent' 
                }
              ]}>
                {rememberMe && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={[styles.rememberMeText, { color: Colors[colorScheme ?? 'light'].text }]}>
                Remember me
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>
                Login
              </Text>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={[styles.signupText, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                Don't have an account?
              </Text>
              <TouchableOpacity onPress={navigateToSignup}>
                <Text style={[styles.signupLink, { color: Colors[colorScheme ?? 'light'].tint }]}>
                  {' Sign up'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Spinner visible={loading} textContent={'Loading...'} textStyle={{ color: '#FFF' }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
  },
  loginButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    fontSize: 14,
  },
  signupLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rememberMeText: {
    fontSize: 14,
  },
}); 