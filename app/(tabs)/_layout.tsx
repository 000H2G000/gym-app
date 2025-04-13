import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable, View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, createContext, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User, getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { app } from '../../firebase/config';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import HapticTab from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { BlurView } from 'expo-blur';
import { 
  getUserChats
} from '../../services/chatService';

// Create AuthContext to provide user state throughout the app
export const AuthContext = createContext<any>(null);

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [storedLoginTime, setStoredLoginTime] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const auth = getAuth(app);
  
  // Check for cached auth state on load
  useEffect(() => {
    const checkPersistedAuth = async () => {
      try {
        const cachedUser = await AsyncStorage.getItem('cachedUser');
        const loginTime = await AsyncStorage.getItem('loginTime');
        
        if (loginTime) {
          setStoredLoginTime(parseInt(loginTime, 10));
        }
        
        if (cachedUser) {
          // Use cached user temporarily until Firebase auth check completes
          setUser(JSON.parse(cachedUser));
        }
      } catch (error) {
        console.error('Error checking cached auth:', error);
      }
    };
    
    checkPersistedAuth();
  }, []);
  
  // Listen for Firebase auth state changes
  useEffect(() => {
    console.log("Setting up auth state listener");
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        console.log('User signed in:', firebaseUser.uid);
        console.log('User email:', firebaseUser.email);
        setUser(firebaseUser);
        
        try {
          // Store user in AsyncStorage for persistence
          await AsyncStorage.setItem('cachedUser', JSON.stringify(firebaseUser));
          
          // If no login time is stored, set it now
          if (!storedLoginTime) {
            const now = Date.now();
            await AsyncStorage.setItem('loginTime', now.toString());
            setStoredLoginTime(now);
          }
          
          // Check if the user document exists in Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (!userDoc.exists()) {
            // Create a new user document if it doesn't exist
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              email: firebaseUser.email,
              fullName: firebaseUser.displayName || 'Gym User',
              photoURL: firebaseUser.photoURL,
              createdAt: new Date()
            });
          }
        } catch (error) {
          console.error('Error persisting auth state:', error);
        }
      } else {
        // User is signed out
        console.log('User signed out');
        setUser(null);
        
        try {
          // Clear cached auth data
          await AsyncStorage.removeItem('cachedUser');
          await AsyncStorage.removeItem('loginTime');
          setStoredLoginTime(null);
        } catch (error) {
          console.error('Error clearing cached auth:', error);
        }
      }
      
      setLoading(false);
    });
    
    return () => {
      console.log("Unsubscribing from auth state listener");
      unsubscribe();
    };
  }, [auth, storedLoginTime]);
  
  // Check for unread messages
  useEffect(() => {
    if (!user) return;
    
    const fetchUnreadMessages = async () => {
      try {
        const chats = await getUserChats(user.uid);
        const totalUnread = chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);
        setUnreadCount(totalUnread);
      } catch (error) {
        console.error('Error fetching unread messages count:', error);
      }
    };
    
    // Initial fetch
    fetchUnreadMessages();
    
    // Set up periodic check - every 30 seconds
    const intervalId = setInterval(fetchUnreadMessages, 30000);
    
    return () => clearInterval(intervalId);
  }, [user]);
  
  // Auth actions to expose through context
  const authActions = {
    login: async (email: string, password: string) => {
      try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        return result.user;
      } catch (error) {
        throw error;
      }
    },
    
    register: async (email: string, password: string, fullName: string) => {
      try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', result.user.uid), {
          email,
          fullName,
          createdAt: new Date()
        });
        
        return result.user;
      } catch (error) {
        throw error;
      }
    },
    
    logout: async () => {
      try {
        await signOut(auth);
      } catch (error) {
        throw error;
      }
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, ...authActions, storedLoginTime }}>
      <Tabs
        screenOptions={{ 
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].mutedText,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: {
            ...Platform.select({
              ios: {
                position: 'absolute',
              },
              default: {},
            }),
            height: 70,
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            borderTopWidth: 0,
            elevation: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            backgroundColor: Colors[colorScheme ?? 'light'].cardBackground,
            paddingBottom: 10,
            paddingTop: 5,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconContainer, focused && { backgroundColor: color + '20' }]}>
                <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
              </View>
            ),
            tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
          }}
        />
        <Tabs.Screen
          name="exercises"
          options={{
            title: 'Exercises',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconContainer, focused && { backgroundColor: color + '20' }]}>
                <Ionicons name={focused ? "barbell" : "barbell-outline"} size={24} color={color} />
              </View>
            ),
            tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
          }}
        />
        <Tabs.Screen
          name="workouts"
          options={{
            title: 'Workouts',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconContainer, focused && { backgroundColor: color + '20' }]}>
                <Ionicons name={focused ? "calendar" : "calendar-outline"} size={24} color={color} />
              </View>
            ),
            tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
            unmountOnBlur: true,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: '',
            tabBarButton: (props) => (
              <TouchableOpacity
                {...props}
                style={styles.centerTabButton}
                onPress={() => props.onPress?.()}
              >
                <View style={styles.tabBadgeContainer}>
                  <View style={[styles.centerTabButtonInner, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
                    <Ionicons name="chatbubbles" size={26} color="white" />
                  </View>
                  {unreadCount > 0 && (
                    <View style={styles.badgeContainer}>
                      <Text style={styles.badgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.centerTabLabel, { color: Colors[colorScheme ?? 'light'].text }]}>Chat</Text>
              </TouchableOpacity>
            ),
          }}
        />
        <Tabs.Screen
          name="progress"
          options={{
            title: 'Progress',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconContainer, focused && { backgroundColor: color + '20' }]}>
                <Ionicons name={focused ? "stats-chart" : "stats-chart-outline"} size={24} color={color} />
              </View>
            ),
            tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconContainer, focused && { backgroundColor: color + '20' }]}>
                <Ionicons name={focused ? "person" : "person-outline"} size={24} color={color} />
              </View>
            ),
            tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
          }}
        />
      </Tabs>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  centerTabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -25,
  },
  centerTabButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  centerTabLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 5,
  },
  tabBadgeContainer: {
    position: 'relative',
  },
  badgeContainer: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
