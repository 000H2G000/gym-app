import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import * as SplashScreen from 'expo-splash-screen';
import { auth } from '../firebase/config';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Create authentication context
export const AuthContext = React.createContext({
  signedIn: false,
  user: null,
});

// Define our auth provider component
function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    signedIn: false,
    user: null,
    isLoading: true,
  });
  
  const segments = useSegments();
  const router = useRouter();

  // Listen for authentication state to change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthState({
        signedIn: !!user,
        user,
        isLoading: false,
      });
    });

    return unsubscribe;
  }, []);

  // Handle routing based on authentication state
  useEffect(() => {
    if (authState.isLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    
    if (!authState.signedIn && !inAuthGroup) {
      // Redirect to the login page if not signed in
      router.replace('/auth/login');
    } else if (authState.signedIn && inAuthGroup) {
      // Redirect to the home page if signed in
      router.replace('/');
    }
  }, [authState.signedIn, authState.isLoading, segments]);

  return (
    <AuthContext.Provider value={{ signedIn: authState.signedIn, user: authState.user }}>
      {authState.isLoading ? <SplashScreenComponent /> : children}
    </AuthContext.Provider>
  );
}

// Define splash screen component
function SplashScreenComponent() {
  const colorScheme = useColorScheme();
  
  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
      <Image 
        source={{ uri: 'https://img.icons8.com/ios-filled/100/FFFFFF/dumbbell.png' }} 
        style={styles.logo}
      />
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" />
      </Stack>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    tintColor: 'white',
  },
});
