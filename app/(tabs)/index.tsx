import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { AuthContext, NotificationContext } from '../_layout';
import { doc, getDoc, DocumentData } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Avatar, Button, Card, Text, TouchableRipple, Surface, Divider, Chip } from 'react-native-paper';
import { Notification } from '../../services/notificationService';

interface UserData {
  fullName?: string;
  photoURL?: string;
  email?: string;
}

interface User {
  uid: string;
  email?: string;
}

interface Notification {
  type: string;
  status: string;
  senderId: string;
  senderName?: string;
  updatedAt?: { seconds: number };
  createdAt?: { seconds: number };
}

export default function HomeScreen() {
  const { user } = useContext(AuthContext) as { user: User | null };
  const notificationCtx = useContext(NotificationContext);
  const { notifications } = notificationCtx || { notifications: [] };
  const [userData, setUserData] = useState<UserData | null>(null);
  const [partnerNotifications, setPartnerNotifications] = useState<Notification[]>([]);
  const colorScheme = useColorScheme();
  
  console.log("HomeScreen: NotificationContext value:", 
    notificationCtx ? "exists" : "undefined", 
    "Notifications:", notifications ? notifications.length : "undefined");
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        if (user?.uid) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user]);

  // Filter partner request notifications
  useEffect(() => {
    if (notifications && notifications.length > 0) {
      // Get recent partner request notifications, showing accepted ones first
      const partnerReqs = notifications
        .filter(n => n.type === 'partner_request')
        .sort((a, b) => {
          // First sort by status (accepted first, then pending, then others)
          if (a.status === 'accepted' && b.status !== 'accepted') return -1;
          if (b.status === 'accepted' && a.status !== 'accepted') return 1;
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (b.status === 'pending' && a.status !== 'pending') return 1;
          
          // Then sort by date (newest first)
          const aDate = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
          const bDate = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
          return bDate - aDate;
        })
        .slice(0, 3); // Show up to 3 notifications
      
      setPartnerNotifications(partnerReqs);
    } else {
      setPartnerNotifications([]);
    }
  }, [notifications]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const navigateTo = (route: any) => {
    router.push(route);
  };

  // Navigate to chat with a partner
  const navigateToChat = (notification: Notification) => {
    router.push({
      pathname: '/(chat)/conversation',
      params: {
        userId: notification.senderId,
        name: notification.senderName || 'Gym Partner'
      }
    });
  };

  const QuickAction = ({ icon, label, onPress, color }: { icon: any, label: string, onPress: () => void, color: string }) => (
    <TouchableRipple 
      style={[styles.quickAction, { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }]}
      onPress={onPress}
      borderless
      rippleColor="rgba(0, 0, 0, 0.1)"
    >
      <View style={styles.quickActionContent}>
        <Surface style={[styles.quickActionIcon, { backgroundColor: color }]}>
          <Ionicons name={icon as any} size={24} color="white" />
        </Surface>
        <Text style={[styles.quickActionLabel, { color: Colors[colorScheme ?? 'light'].text }]}>{label}</Text>
      </View>
    </TouchableRipple>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <View>
          <Text variant="bodyMedium" style={{ color: Colors[colorScheme ?? 'light'].mutedText }}>
            {getGreeting()}
          </Text>
          <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: Colors[colorScheme ?? 'light'].text }}>
            {userData?.fullName || 'User'}
          </Text>
        </View>
        
        <TouchableRipple onPress={() => navigateTo('/profile')} borderless>
          {userData?.photoURL ? (
            <Avatar.Image size={45} source={{ uri: userData.photoURL }} />
          ) : (
            <Avatar.Text 
              size={45} 
              label={(userData?.fullName?.charAt(0) || user?.email?.charAt(0) || '?').toUpperCase()} 
              style={{ backgroundColor: Colors[colorScheme ?? 'light'].tint }}
            />
          )}
        </TouchableRipple>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Partner request notifications */}
        {partnerNotifications.length > 0 && (
          <View style={styles.notificationSection}>
            <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 15, color: Colors[colorScheme ?? 'light'].text }}>
              Partner Requests
            </Text>
            {partnerNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                style={[styles.notificationCard, { 
                  backgroundColor: notification.status === 'accepted' 
                    ? 'rgba(76, 175, 80, 0.1)' 
                    : Colors[colorScheme ?? 'light'].cardBackground 
                }]}
                mode="outlined"
              >
                <Card.Content style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Avatar.Text 
                      size={40} 
                      label={notification.senderName?.substring(0, 2).toUpperCase() || 'GP'} 
                      style={{ backgroundColor: Colors[colorScheme ?? 'light'].tint, marginRight: 10 }}
                    />
                    
                    <View style={{ flex: 1 }}>
                      <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                        {notification.senderName || 'Gym Partner'}
                      </Text>
                      <Text variant="bodySmall" style={{ color: Colors[colorScheme ?? 'light'].mutedText }}>
                        {notification.workoutName} • {notification.day}
                      </Text>
                    </View>
                    
                    {notification.status === 'pending' && (
                      <Chip 
                        mode="flat" 
                        style={{ backgroundColor: '#FFC107' }}
                        textStyle={{ color: 'white', fontSize: 10 }}
                      >
                        Pending
                      </Chip>
                    )}
                    {notification.status === 'accepted' && (
                      <Chip 
                        mode="flat" 
                        style={{ backgroundColor: '#4CAF50' }}
                        textStyle={{ color: 'white', fontSize: 10 }}
                      >
                        Accepted
                      </Chip>
                    )}
                  </View>
                  
                  {notification.status === 'accepted' ? (
                    <Button 
                      mode="contained" 
                      icon="chat" 
                      onPress={() => navigateToChat(notification)}
                      style={styles.chatButton}
                    >
                      Chat Now
                    </Button>
                  ) : (
                    <Button 
                      mode="outlined" 
                      icon="information-outline" 
                      onPress={() => router.push('/notifications')}
                      style={styles.viewButton}
                    >
                      View Details
                    </Button>
                  )}
                </Card.Content>
              </Card>
            ))}
            
            <Button 
              mode="text" 
              onPress={() => router.push('/notifications')}
              style={{ alignSelf: 'flex-end', marginTop: 8 }}
            >
              View All
            </Button>
          </View>
        )}

        <Card style={styles.welcomeCard}>
          <LinearGradient
            colors={['#4A90E2', '#357ABD']}
            style={styles.welcomeGradient}
          >
            <View style={styles.welcomeContent}>
              <Text variant="headlineMedium" style={styles.welcomeTitle}>Ready to Workout?</Text>
              <Text variant="bodyMedium" style={styles.welcomeSubtitle}>Start your fitness journey today</Text>
              <Button 
                mode="contained" 
                buttonColor="rgba(255, 255, 255, 0.2)"
                icon="arrow-right"
                onPress={() => navigateTo('/exercises')}
                style={styles.startButton}
              >
                Get Started
              </Button>
            </View>
          </LinearGradient>
        </Card>

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
          <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 15, color: Colors[colorScheme ?? 'light'].text }}>
            Today's Progress
          </Text>
          <View style={styles.statsGrid}>
            <Card style={styles.statCard} mode="outlined">
              <Card.Content style={styles.statCardContent}>
                <Ionicons name="fitness-outline" size={24} color="#FF7043" />
                <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginVertical: 5 }}>
                  5
                </Text>
                <Text variant="bodySmall" style={{ color: Colors[colorScheme ?? 'light'].mutedText }}>
                  Workouts
                </Text>
              </Card.Content>
            </Card>
            <Card style={styles.statCard} mode="outlined">
              <Card.Content style={styles.statCardContent}>
                <Ionicons name="flame-outline" size={24} color="#FF7043" />
                <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginVertical: 5 }}>
                  1,850
                </Text>
                <Text variant="bodySmall" style={{ color: Colors[colorScheme ?? 'light'].mutedText }}>
                  Calories
                </Text>
              </Card.Content>
            </Card>
          </View>
        </View>

        <View style={styles.tipSection}>
          <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 15, color: Colors[colorScheme ?? 'light'].text }}>
            Daily Tip
          </Text>
          <Card style={styles.tipCard} mode="outlined">
            <Card.Content style={styles.tipCardContent}>
              <Ionicons name="bulb-outline" size={24} color="#FFC107" style={{ marginRight: 10 }} />
              <Text variant="bodyMedium">
                Stay hydrated! Drink at least 8 glasses of water daily for optimal performance.
              </Text>
            </Card.Content>
          </Card>
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
  scrollView: {
    flex: 1,
  },
  welcomeCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
  },
  welcomeGradient: {
    padding: 20,
  },
  welcomeContent: {
    alignItems: 'flex-start',
  },
  welcomeTitle: {
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  startButton: {
    borderRadius: 25,
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
  quickActionContent: {
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
  },
  quickActionLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
  },
  statCardContent: {
    alignItems: 'center',
    padding: 15,
  },
  tipSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tipCard: {
    borderRadius: 12,
  },
  tipCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  notificationSection: {
    marginTop: 10,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  notificationCard: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
  },
  notificationContent: {
    padding: 10,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  chatButton: {
    marginTop: 8,
    backgroundColor: '#4CAF50',
  },
  viewButton: {
    marginTop: 8,
  },
});
