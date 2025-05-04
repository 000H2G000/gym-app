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
import { Notification, subscribeToNotifications } from '../services/notificationService';
import { isUserAdmin } from '../services/userService';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

// Define AuthState type
interface AuthState {
  signedIn: boolean;
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
}

// Define AuthContext type
interface AuthContextType {
  signedIn: boolean;
  user: User | null;
  isAdmin: boolean;
  logout: () => Promise<void>;
}

// Define NotificationContext type
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
}

// Create authentication context
export const AuthContext = React.createContext<AuthContextType>({
  signedIn: false,
  user: null,
  isAdmin: false,
  logout: async () => {}
});

// Create notification context
export const NotificationContext = React.createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  refreshNotifications: async () => {}
});

// Define our auth provider component
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    signedIn: false,
    user: null,
    isLoading: true,
    isAdmin: false,
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
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user ? "User signed in" : "User signed out");
      
      let adminStatus = false;
      
      // Handle user sign-out
      if (!user) {
        console.log("User is signed out, clearing session data");
        
        // Clear all session data
        await AsyncStorage.multiRemove(['authToken', 'userEmail', 'isAdmin'])
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
      } else {
        // Check if user is admin
        try {
          adminStatus = await isUserAdmin(user.uid);
          await AsyncStorage.setItem('isAdmin', adminStatus ? 'true' : 'false');
          console.log("User admin status:", adminStatus);
        } catch (error) {
          console.error("Error checking admin status:", error);
        }
      }
      
      setAuthState({
        signedIn: !!user,
        user,
        isLoading: false,
        isAdmin: adminStatus,
      });
    });

    return unsubscribe;
  }, [router, segments]);

  // Handle routing based on authentication state
  useEffect(() => {
    if (authState.isLoading) return;
    console.log("Auth state updated, handling navigation...");
    console.log("Signed in:", authState.signedIn);
    console.log("Is admin:", authState.isAdmin);
    console.log("Current route segment:", segments[0]);

    const inAuthGroup = segments[0] === 'auth';
    const inAdminGroup = segments[0] === 'admin';
    
    if (!authState.signedIn && !inAuthGroup) {
      // Redirect to the login page if not signed in
      console.log("Not signed in and not in auth group, redirecting to login...");
      router.replace('/auth/login');
    } else if (authState.signedIn) {
      if (inAuthGroup) {
        // Direct admin to admin dashboard, regular users to tabs
        if (authState.isAdmin) {
          console.log("Admin signed in, redirecting to admin dashboard...");
          router.replace('/admin');
        } else {
          console.log("User signed in, redirecting to home...");
          router.replace('/');
        }
      } else if (authState.isAdmin && !inAdminGroup) {
        // Redirect admin to admin dashboard if they try to access user tabs
        console.log("Admin trying to access user area, redirecting to admin dashboard...");
        router.replace('/admin');
      } else if (!authState.isAdmin && inAdminGroup) {
        // Redirect non-admin away from admin area
        console.log("Non-admin trying to access admin area, redirecting to home...");
        router.replace('/');
      }
    }
  }, [authState.signedIn, authState.isAdmin, authState.isLoading, segments]);

  // Custom logout function
  const logout = async () => {
    try {
      console.log("Executing custom logout function");
      
      // 1. Clear all session data first
      await AsyncStorage.multiRemove(['authToken', 'userEmail', 'isAdmin']);
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
      isAdmin: authState.isAdmin,
      logout
    }}>
      {authState.isLoading ? (
        <SplashScreenComponent /> 
      ) : (
        <NotificationProvider user={authState.user}>
          {children}
        </NotificationProvider>
      )}
    </AuthContext.Provider>
  );
}

// Define notification provider component
function NotificationProvider({ children, user }: { children: React.ReactNode, user: User | null }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Function to manually refresh notifications
  const refreshNotifications = async () => {
    if (!user || !user.uid) return;
    
    try {
      console.log("Manually refreshing notifications for user:", user.uid);
      // We can use the same function that the subscription uses,
      // but call it manually and wait for the result
      const notificationService = await import('../services/notificationService');
      const userNotifications = await notificationService.getUserNotifications(user.uid);
      
      setNotifications(userNotifications);
      
      // Calculate unread count
      const unread = userNotifications.filter(n => 
        n.status === 'pending' || 
        (n.type === 'message' && n.status !== 'read')
      ).length;
      
      setUnreadCount(unread);
    } catch (error) {
      console.error("Error refreshing notifications:", error);
    }
  };

  // Subscribe to notifications when user is logged in
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (user && user.uid) {
      console.log("Setting up notification subscription for user:", user.uid);
      
      unsubscribe = subscribeToNotifications(user.uid, (newNotifications) => {
        setNotifications(newNotifications);
        
        // Calculate unread count
        const unread = newNotifications.filter(n => 
          n.status === 'pending' || 
          (n.type === 'message' && n.status !== 'read')
        ).length;
        
        setUnreadCount(unread);
      });
    } else {
      // Reset notifications when logged out
      setNotifications([]);
      setUnreadCount(0);
    }

    // Cleanup subscription on unmount or when user changes
    return () => {
      if (unsubscribe) {
        console.log("Cleaning up notification subscription");
        unsubscribe();
      }
    };
  }, [user]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, refreshNotifications }}>
      {children}
    </NotificationContext.Provider>
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
  
  // Hide splash screen once app is ready
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);
  
  // The NotificationProvider is now inside the AuthProvider component
  // and receives the user information directly
  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          <Stack.Screen name="auth/login" options={{ gestureEnabled: false }} />
          <Stack.Screen name="auth/signup" options={{ gestureEnabled: false }} />
          <Stack.Screen name="auth/reset-password" options={{ gestureEnabled: false }} />
          <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
          <Stack.Screen name="admin" options={{ gestureEnabled: false }} />
          <Stack.Screen name="profile" />
          <Stack.Screen name="partners" />
          <Stack.Screen name="nutrition" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="(chat)/conversation" />
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
