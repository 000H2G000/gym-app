import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { AuthContext } from '../_layout';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '../../firebase/config';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user?.uid) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout", 
          onPress: async () => {
            try {
              await signOut(auth);
              // Navigation will be handled by our authentication flow in _layout.tsx
            } catch (error) {
              console.error("Error signing out:", error);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <ScrollView>
        <View style={styles.header}>
          <Text style={[styles.title, { color: Colors[colorScheme ?? 'light'].text }]}>
            Profile
          </Text>
          <TouchableOpacity 
            style={[styles.logoutButton, { borderColor: Colors[colorScheme ?? 'light'].border }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors[colorScheme ?? 'light'].text} />
            <Text style={[styles.logoutText, { color: Colors[colorScheme ?? 'light'].text }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {userData?.photoURL ? (
              <Image source={{ uri: userData.photoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
                <Text style={styles.avatarInitial}>
                  {userData?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
                </Text>
              </View>
            )}
            <TouchableOpacity style={[styles.editAvatarButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
              <Ionicons name="camera-outline" size={16} color="white" />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.userName, { color: Colors[colorScheme ?? 'light'].text }]}>
            {userData?.fullName || 'User'}
          </Text>
          <Text style={[styles.userEmail, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
            {user?.email}
          </Text>
        </View>

        <View style={[styles.gymPointsCard, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
          <View style={styles.gymPointsContent}>
            <Text style={[styles.gymPointsLabel, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
              Gym Points
            </Text>
            <Text style={[styles.gymPointsValue, { color: Colors[colorScheme ?? 'light'].text }]}>
              {userData?.gymPoints || 0}
            </Text>
          </View>
          <View style={[styles.gymPointsBadge, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }]}>
            <Text style={[styles.gymPointsRank, { color: Colors[colorScheme ?? 'light'].tint }]}>
              {userData?.gymPoints >= 100 ? 'Gold' : userData?.gymPoints >= 50 ? 'Silver' : 'Bronze'}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
            <Text style={[styles.statValue, { color: Colors[colorScheme ?? 'light'].tint }]}>5</Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].mutedText }]}>Workouts</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
            <Text style={[styles.statValue, { color: Colors[colorScheme ?? 'light'].tint }]}>3</Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].mutedText }]}>Partners</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
            <Text style={[styles.statValue, { color: Colors[colorScheme ?? 'light'].tint }]}>12</Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].mutedText }]}>Exercises</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Settings
          </Text>
          
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
            <Ionicons name="person-outline" size={22} color={Colors[colorScheme ?? 'light'].text} />
            <Text style={[styles.menuItemText, { color: Colors[colorScheme ?? 'light'].text }]}>
              Edit Profile
            </Text>
            <Ionicons name="chevron-forward" size={20} color={Colors[colorScheme ?? 'light'].mutedText} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
            <Ionicons name="notifications-outline" size={22} color={Colors[colorScheme ?? 'light'].text} />
            <Text style={[styles.menuItemText, { color: Colors[colorScheme ?? 'light'].text }]}>
              Notifications
            </Text>
            <Ionicons name="chevron-forward" size={20} color={Colors[colorScheme ?? 'light'].mutedText} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
            <Ionicons name="lock-closed-outline" size={22} color={Colors[colorScheme ?? 'light'].text} />
            <Text style={[styles.menuItemText, { color: Colors[colorScheme ?? 'light'].text }]}>
              Privacy
            </Text>
            <Ionicons name="chevron-forward" size={20} color={Colors[colorScheme ?? 'light'].mutedText} />
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
            <Ionicons name="help-circle-outline" size={22} color={Colors[colorScheme ?? 'light'].text} />
            <Text style={[styles.menuItemText, { color: Colors[colorScheme ?? 'light'].text }]}>
              Help & Support
            </Text>
            <Ionicons name="chevron-forward" size={20} color={Colors[colorScheme ?? 'light'].mutedText} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  logoutText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 40,
    fontWeight: 'bold',
    color: 'white',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  gymPointsCard: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gymPointsContent: {
    flex: 1,
  },
  gymPointsLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  gymPointsValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  gymPointsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  gymPointsRank: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
  },
  menuSection: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuItemText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
}); 