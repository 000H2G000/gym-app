import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Image, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { createUserWithEmailAndPassword, AuthError } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import Spinner from 'react-native-loading-spinner-overlay';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { auth, db } from '../../firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const colorScheme = useColorScheme();

  const handleSignup = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get the authentication token
      const idToken = await user.getIdToken();
      
      // Save token in AsyncStorage for session persistence
      await AsyncStorage.setItem('authToken', idToken);
      await AsyncStorage.setItem('userEmail', email);
      
      // Store additional user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        fullName,
        email,
        gymPoints: 0,
        createdAt: new Date(),
        photoURL: null,
        lastLogin: new Date()
      });
      
      console.log('Account created successfully, session token stored');

      // Navigation will happen via _layout.tsx auth check
    } catch (error: unknown) {
      console.error('Signup error:', error);
      
      const authError = error as AuthError;
      if (authError.code === 'auth/email-already-in-use') {
        setError('Email is already in use. Please use a different email or login.');
      } else if (authError.code === 'auth/invalid-email') {
        setError('The email address is invalid. Please enter a valid email.');
      } else if (authError.code === 'auth/weak-password') {
        setError('Password is too weak. Choose a stronger password.');
      } else {
        setError('Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateToLogin = () => {
    router.push('/auth/login');
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
              Create Account
            </Text>
            
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                Full Name
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
                placeholder="Enter your full name"
                placeholderTextColor={Colors[colorScheme ?? 'light'].placeholderText}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

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
                placeholder="Create a password"
                placeholderTextColor={Colors[colorScheme ?? 'light'].placeholderText}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                Confirm Password
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
                placeholder="Confirm your password"
                placeholderTextColor={Colors[colorScheme ?? 'light'].placeholderText}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.signupButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
              onPress={handleSignup}
            >
              <Text style={styles.signupButtonText}>
                Create Account
              </Text>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                Already have an account?
              </Text>
              <TouchableOpacity onPress={navigateToLogin}>
                <Text style={[styles.loginLink, { color: Colors[colorScheme ?? 'light'].tint }]}>
                  {' Login'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Spinner visible={loading} textContent={'Creating account...'} textStyle={{ color: '#FFF' }} />
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
  signupButton: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 