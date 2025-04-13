import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { router, Stack } from 'expo-router';
import { Divider, Surface, Text, Avatar, IconButton, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext, NotificationContext } from './_layout';
import { 
  Notification, 
  acceptPartnerRequest, 
  updateNotificationStatus, 
  deleteNotification 
} from '../services/notificationService';

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const { user } = useContext(AuthContext);
  const { notifications, unreadCount, refreshNotifications } = useContext(NotificationContext);
  const [loading, setLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState<string[]>([]);

  // Log notification information
  useEffect(() => {
    console.log(`NotificationsScreen: User ${user?.uid}, Notification count: ${notifications.length}`);
    notifications.forEach((notification, index) => {
      console.log(`Notification ${index + 1}: type=${notification.type}, status=${notification.status}, sender=${notification.senderName}`);
    });
  }, [user, notifications]);

  // If user is not logged in, redirect to login screen
  useEffect(() => {
    if (!user && !loading) {
      console.log("User not logged in, redirecting to login");
      router.replace('/login');
    }
  }, [user, loading]);

  // Initial load
  useEffect(() => {
    if (user) {
      setLoading(true);
      console.log("Manually refreshing notifications");
      refreshNotifications().then(() => {
        setLoading(false);
        console.log("Notification refresh complete");
      }).catch(error => {
        console.error("Error refreshing notifications:", error);
        setLoading(false);
      });
    }
  }, [user, refreshNotifications]);

  const handleAcceptPartnerRequest = async (notification: Notification) => {
    if (processingIds.includes(notification.id!)) return;
    
    try {
      setProcessingIds([...processingIds, notification.id!]);
      
      await acceptPartnerRequest(notification.id!);
      await refreshNotifications();
      
      // Navigate to the conversation screen
      router.push({
        pathname: '/(chat)/conversation',
        params: {
          userId: notification.senderId,
          name: notification.senderName || 'Gym Partner'
        }
      });
    } catch (error) {
      console.error('Error accepting partner request:', error);
      Alert.alert('Error', 'Failed to accept partner request. Please try again.');
    } finally {
      setProcessingIds(processingIds.filter(id => id !== notification.id));
    }
  };

  const handleDeclinePartnerRequest = async (notification: Notification) => {
    if (processingIds.includes(notification.id!)) return;
    
    try {
      setProcessingIds([...processingIds, notification.id!]);
      
      await updateNotificationStatus(notification.id!, 'declined');
      await refreshNotifications();
    } catch (error) {
      console.error('Error declining partner request:', error);
      Alert.alert('Error', 'Failed to decline partner request. Please try again.');
    } finally {
      setProcessingIds(processingIds.filter(id => id !== notification.id));
    }
  };

  const handleDismissNotification = async (notification: Notification) => {
    if (processingIds.includes(notification.id!)) return;
    
    try {
      setProcessingIds([...processingIds, notification.id!]);
      
      await updateNotificationStatus(notification.id!, 'read');
      await refreshNotifications();
    } catch (error) {
      console.error('Error dismissing notification:', error);
      Alert.alert('Error', 'Failed to dismiss notification. Please try again.');
    } finally {
      setProcessingIds(processingIds.filter(id => id !== notification.id));
    }
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => {
    const isProcessing = processingIds.includes(item.id!);
    
    // Partner request notification
    if (item.type === 'partner_request') {
      return (
        <Surface style={[
          styles.notificationCard,
          { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
        ]}>
          <View style={styles.notificationHeader}>
            <View style={styles.userInfoContainer}>
              <Avatar.Text 
                size={40} 
                label={item.senderName?.substring(0, 2).toUpperCase() || 'GP'}
                color="white"
                style={{ 
                  backgroundColor: Colors[colorScheme ?? 'light'].tint,
                  marginRight: 12 
                }}
              />
              <View>
                <Text style={{ 
                  fontWeight: 'bold',
                  color: Colors[colorScheme ?? 'light'].text 
                }}>
                  {item.senderName || 'Gym Partner'}
                </Text>
                <Text style={{ 
                  color: Colors[colorScheme ?? 'light'].mutedText
                }}>
                  Would like to be your gym partner
                </Text>
              </View>
            </View>
            
            {item.status === 'pending' && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>New</Text>
              </View>
            )}
          </View>
          
          {item.workoutName && (
            <View style={styles.workoutInfoContainer}>
              <Ionicons 
                name="barbell-outline" 
                size={16} 
                color={Colors[colorScheme ?? 'light'].tint}
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>
                {item.workoutName} - {item.day}
              </Text>
            </View>
          )}
          
          {item.status === 'pending' ? (
            <View style={styles.actionButtons}>
              <Button 
                mode="contained" 
                onPress={() => handleAcceptPartnerRequest(item)}
                style={[styles.actionButton, styles.acceptButton]}
                loading={isProcessing}
                disabled={isProcessing}
              >
                Accept
              </Button>
              <Button 
                mode="outlined" 
                onPress={() => handleDeclinePartnerRequest(item)}
                style={styles.actionButton}
                loading={isProcessing}
                disabled={isProcessing}
              >
                Decline
              </Button>
            </View>
          ) : item.status === 'accepted' ? (
            <View style={styles.statusContainer}>
              <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
              <Text style={{ marginLeft: 8, color: '#4CAF50' }}>Accepted</Text>
            </View>
          ) : (
            <View style={styles.statusContainer}>
              <Ionicons name="close-circle" size={20} color="#F44336" />
              <Text style={{ marginLeft: 8, color: '#F44336' }}>Declined</Text>
            </View>
          )}
        </Surface>
      );
    }
    
    // Other notification types
    return (
      <Surface style={[
        styles.notificationCard,
        { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
      ]}>
        <View style={styles.notificationHeader}>
          <View style={styles.userInfoContainer}>
            <Ionicons 
              name={item.type === 'message' ? "chatbox-outline" : "notifications-outline"}
              size={24}
              color={Colors[colorScheme ?? 'light'].tint}
              style={{ marginRight: 12 }}
            />
            <View>
              <Text style={{ 
                fontWeight: 'bold',
                color: Colors[colorScheme ?? 'light'].text 
              }}>
                {item.type === 'message' ? 'New Message' : 'Notification'}
              </Text>
              <Text style={{ 
                color: Colors[colorScheme ?? 'light'].mutedText
              }}>
                {item.message || 'You have a new notification'}
              </Text>
            </View>
          </View>
          
          {item.status === 'pending' && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>New</Text>
            </View>
          )}
        </View>
        
        {item.status === 'pending' && (
          <View style={styles.actionButtons}>
            <Button 
              mode="text" 
              onPress={() => handleDismissNotification(item)}
              style={styles.dismissButton}
              loading={isProcessing}
              disabled={isProcessing}
            >
              Dismiss
            </Button>
          </View>
        )}
      </Surface>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons 
        name="notifications-off-outline" 
        size={64} 
        color={Colors[colorScheme ?? 'light'].mutedText} 
      />
      <Text style={{ 
        marginTop: 16, 
        color: Colors[colorScheme ?? 'light'].text,
        fontSize: 18,
        textAlign: 'center'
      }}>
        No notifications
      </Text>
      <Text style={{ 
        marginTop: 8, 
        color: Colors[colorScheme ?? 'light'].mutedText,
        textAlign: 'center',
        paddingHorizontal: 40
      }}>
        You'll see notifications for partner requests and important updates here
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <Stack.Screen 
        options={{
          title: 'Notifications',
          headerTitleStyle: { color: Colors[colorScheme ?? 'light'].text },
          headerStyle: { backgroundColor: Colors[colorScheme ?? 'light'].background },
          headerShadowVisible: false,
          headerLeft: () => (
            <IconButton
              icon="arrow-left"
              iconColor={Colors[colorScheme ?? 'light'].text}
              size={24}
              onPress={() => router.back()}
              style={{ marginLeft: -8 }}
            />
          ),
        }}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <Text style={{ marginTop: 16, color: Colors[colorScheme ?? 'light'].text }}>
            Loading notifications...
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <Divider style={{ marginVertical: 8 }} />}
          ListEmptyComponent={renderEmptyState}
        />
      )}
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
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  notificationCard: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  workoutInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  actionButton: {
    marginLeft: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  dismissButton: {
    alignSelf: 'flex-end',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  badge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
}); 