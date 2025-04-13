import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { onAuthStateChanged, User } from 'firebase/auth';
import * as SplashScreen from 'expo-splash-screen';
import { auth } from '../firebase/config';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Define AuthState type
interface AuthState {
  signedIn: boolean;
  user: User | null;
  isLoading: boolean;
}

// Define AuthContext type
interface AuthContextType {
  signedIn: boolean;
  user: User | null;
  logout: () => Promise<void>;
}

// Create authentication context
export const AuthContext = React.createContext<AuthContextType>({
  signedIn: false,
  user: null,
  logout: async () => {}
});

// Define our auth provider component
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    signedIn: false,
    user: null,
    isLoading: true,
  });
  
  const segments = useSegments();
  const router = useRouter();

  // Check for stored auth token on app start
  useEffect(() => {
    const checkStoredToken = async () => {
      try {
        // Check if we have a stored auth token
        const storedToken = await AsyncStorage.getItem('authToken');
        console.log("Checking for stored auth token on app start:", !!storedToken);
        
        // If there's no auth token, we can skip this and rely on onAuthStateChanged
        if (!storedToken) return;
        
        // If there is a stored token but no auth state, we should try to validate
        // Note: Firebase will handle validation via onAuthStateChanged
        // This check is mostly informational for logging
        if (!auth.currentUser) {
          console.log("Found stored token, but waiting for Firebase auth state to validate");
        }
      } catch (error) {
        console.error("Error checking stored auth token:", error);
      }
    };
    
    checkStoredToken();
  }, []);

  // Listen for authentication state to change
  useEffect(() => {
    console.log("Setting up auth state change listener...");
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth state changed:", user ? "User signed in" : "User signed out");
      
      // Handle user sign-out
      if (!user) {
        console.log("User is signed out, clearing session data");
        
        // Clear all session data
        AsyncStorage.multiRemove(['authToken', 'userEmail'])
          .then(() => {
            console.log("Session data cleared");
            
            // Force navigation to login page if not already there
            const currentSegment = segments[0];
            if (currentSegment !== 'auth') {
              console.log("Forcing navigation to login page");
              router.replace('/auth/login');
            }
          })
          .catch(err => console.error("Error clearing session data:", err));
      }
      
      setAuthState({
        signedIn: !!user,
        user,
        isLoading: false,
      });
    });

    return unsubscribe;
  }, [router, segments]);

  // Handle routing based on authentication state
  useEffect(() => {
    if (authState.isLoading) return;
    console.log("Auth state updated, handling navigation...");
    console.log("Signed in:", authState.signedIn);
    console.log("Current route segment:", segments[0]);

    const inAuthGroup = segments[0] === 'auth';
    
    if (!authState.signedIn && !inAuthGroup) {
      // Redirect to the login page if not signed in
      console.log("Not signed in and not in auth group, redirecting to login...");
      router.replace('/auth/login');
    } else if (authState.signedIn && inAuthGroup) {
      // Redirect to the home page if signed in
      console.log("Signed in but in auth group, redirecting to home...");
      router.replace('/');
    }
  }, [authState.signedIn, authState.isLoading, segments]);

  // Custom logout function
  const logout = async () => {
    try {
      console.log("Executing custom logout function");
      
      // 1. Clear all session data first
      await AsyncStorage.multiRemove(['authToken', 'userEmail']);
      console.log("Session storage cleared");
      
      // 2. Sign out from Firebase using auth.signOut() directly
      await auth.signOut();
      console.log("Firebase signOut completed");
      
      // 3. Force navigation to login screen
      router.replace('/auth/login');
      
      return Promise.resolve();
    } catch (error) {
      console.error("Error during logout:", error);
      return Promise.reject(error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      signedIn: authState.signedIn, 
      user: authState.user,
      logout
    }}>
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
  const colorScheme = useColorScheme();
  
  // Create custom theme based on app colors
  const theme = colorScheme === 'dark' 
    ? {
        ...MD3DarkTheme,
        colors: {
          ...MD3DarkTheme.colors,
          primary: Colors.dark.tint,
          background: Colors.dark.background,
          surface: Colors.dark.cardBackground,
          error: '#EF4444',
        },
      }
    : {
        ...MD3LightTheme,
        colors: {
          ...MD3LightTheme.colors,
          primary: Colors.light.tint,
          background: Colors.light.background,
          surface: Colors.light.cardBackground,
          error: '#EF4444',
        },
      };
  
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth" />
        </Stack>
      </AuthProvider>
    </PaperProvider>
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
