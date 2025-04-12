import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { AuthContext } from '../_layout';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const [userData, setUserData] = useState(null);
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
      }
    };

    fetchUserData();
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const navigateTo = (route: string) => {
    router.push(route);
  };

  const QuickAction = ({ icon, label, onPress, color }: { icon: string, label: string, onPress: () => void, color: string }) => (
    <TouchableOpacity 
      style={[styles.quickAction, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}
      onPress={onPress}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="white" />
      </View>
      <Text style={[styles.quickActionLabel, { color: Colors[colorScheme ?? 'light'].text }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
            {getGreeting()}
          </Text>
          <Text style={[styles.userName, { color: Colors[colorScheme ?? 'light'].text }]}>
            {userData?.fullName || 'User'}
          </Text>
        </View>
        
        <TouchableOpacity onPress={() => navigateTo('/profile')}>
          {userData?.photoURL ? (
            <Image source={{ uri: userData.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
              <Text style={styles.avatarInitial}>
                {userData?.fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeCard}>
          <LinearGradient
            colors={['#4A90E2', '#357ABD']}
            style={styles.welcomeGradient}
          >
            <View style={styles.welcomeContent}>
              <Text style={styles.welcomeTitle}>Ready to Workout?</Text>
              <Text style={styles.welcomeSubtitle}>Start your fitness journey today</Text>
              <TouchableOpacity 
                style={styles.startButton}
                onPress={() => navigateTo('/exercises')}
              >
                <Text style={styles.startButtonText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.quickActions}>
          <QuickAction 
            icon="barbell-outline" 
            label="Exercises" 
            onPress={() => navigateTo('/exercises')} 
            color="#FF7043" 
          />
          <QuickAction 
            icon="restaurant-outline" 
            label="Nutrition" 
            onPress={() => navigateTo('/nutrition')} 
            color="#4CAF50" 
          />
          <QuickAction 
            icon="people-outline" 
            label="Partners" 
            onPress={() => navigateTo('/partners')} 
            color="#2196F3" 
          />
          <QuickAction 
            icon="person-outline" 
            label="Profile" 
            onPress={() => navigateTo('/profile')} 
            color="#9C27B0" 
          />
        </View>

        <View style={styles.statsSection}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Today's Progress
          </Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
              <Ionicons name="fitness-outline" size={24} color="#FF7043" />
              <Text style={[styles.statValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                5
              </Text>
              <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                Workouts
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
              <Ionicons name="flame-outline" size={24} color="#FF7043" />
              <Text style={[styles.statValue, { color: Colors[colorScheme ?? 'light'].text }]}>
                1,850
              </Text>
              <Text style={[styles.statLabel, { color: Colors[colorScheme ?? 'light'].mutedText }]}>
                Calories
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.tipSection}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Daily Tip
          </Text>
          <View style={[styles.tipCard, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}>
            <Ionicons name="bulb-outline" size={24} color="#FFC107" />
            <Text style={[styles.tipText, { color: Colors[colorScheme ?? 'light'].text }]}>
              Stay hydrated! Drink at least 8 glasses of water daily for optimal performance.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  greeting: {
    fontSize: 14,
    opacity: 0.8,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
  avatarPlaceholder: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  scrollView: {
    flex: 1,
  },
  welcomeCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  welcomeGradient: {
    padding: 20,
  },
  welcomeContent: {
    alignItems: 'flex-start',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickAction: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    width: '22%',
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  statLabel: {
    fontSize: 12,
  },
  tipSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
  },
  tipText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
  },
});
