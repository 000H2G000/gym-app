import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput as RNTextInput, Pressable, Modal, FlatList, Animated } from 'react-native';
import { 
  Text, 
  Card, 
  Avatar, 
  Button, 
  Divider, 
  List, 
  ActivityIndicator,
  IconButton,
  Dialog,
  Portal,
  Menu,
  Switch,
  TextInput
} from 'react-native-paper';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons, AntDesign, Entypo } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { 
  getUserById, 
  User,
  updateUserSubscription, 
  SubscriptionStatus,
  getUserPayments,
  Payment
} from '@/services/userService';
import { processPayment } from '@/services/paymentService';

const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    name: 'Basic Plan',
    price: 9.99,
    interval: 'month',
    features: ['Access to basic workouts', 'Nutrition tracking']
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    price: 19.99,
    interval: 'month',
    features: ['All basic features', 'Custom workout plans', 'Trainer support']
  },
  {
    id: 'elite',
    name: 'Elite Plan',
    price: 29.99,
    interval: 'month',
    features: ['All premium features', 'Nutrition coaching', 'Priority support']
  }
];

interface WorkoutStats {
  totalWorkouts: number;
  workoutsThisMonth: number;
  averageDuration?: number;
  favoriteExercise?: string;
  totalSessions?: number;
}

interface ExtendedUser extends User {
  notificationsEnabled?: boolean;
}

const getUserWorkoutStats = async (userId: string): Promise<WorkoutStats> => {
  return {
    totalWorkouts: 24,
    workoutsThisMonth: 6,
    averageDuration: 45,
    favoriteExercise: 'Bench Press',
    totalSessions: 42
  };
};

const deleteUser = async (userId: string): Promise<void> => {
  console.log('Deleting user:', userId);
  return new Promise((resolve) => setTimeout(resolve, 1000));
};

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [subscriptionDialogVisible, setSubscriptionDialogVisible] = useState(false);
  const [newSubscriptionStatus, setNewSubscriptionStatus] = useState<SubscriptionStatus>('active');
  const [subscriptionMenuVisible, setSubscriptionMenuVisible] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState({ x: 0, y: 0 });
  const [menuVisible, setMenuVisible] = useState(false);
  const [suspendDialogVisible, setSuspendDialogVisible] = useState(false);
  const [paymentDialogVisible, setPaymentDialogVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [notesDialogVisible, setNotesDialogVisible] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const iconRef = React.useRef<View>(null);
  const confirmationAnimation = useRef(new Animated.Value(0)).current;
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [fullScreenSuccess, setFullScreenSuccess] = useState(false);
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const fullScreenOpacity = useRef(new Animated.Value(0)).current;
  const fullScreenScale = useRef(new Animated.Value(0.8)).current;

  const openMenu = () => {
    if (iconRef.current) {
      iconRef.current.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
        setMenuAnchorEl({ x: pageX, y: pageY });
        setMenuVisible(true);
      });
    }
  };
  
  const closeMenu = () => setMenuVisible(false);
  
  const handleMenuAction = (action: string) => {
    closeMenu();
    if (action === 'suspend') {
      Alert.alert(
        'Suspend User',
        'Are you sure you want to suspend this user?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Suspend', 
            style: 'destructive',
            onPress: () => {
              Alert.alert('User suspended successfully');
            } 
          }
        ]
      );
    } else if (action === 'delete') {
      Alert.alert(
        'Delete User',
        'This action cannot be undone. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Delete', 
            style: 'destructive',
            onPress: () => {
              Alert.alert('User deleted successfully');
              router.back();
            } 
          }
        ]
      );
    }
  };
  
  const colorScheme = useColorScheme() || 'light';
  const router = useRouter();
  
  useEffect(() => {
    if (!id) return;
    
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const userData = await getUserById(id as string);
        
        if (userData) {
          const extendedUserData = userData as ExtendedUser;
          setUser(extendedUserData);
          setNotificationsEnabled(extendedUserData.notificationsEnabled !== false);
          
          const userPayments = await getUserPayments(id as string);
          setPayments(userPayments);
          
          const stats = await getUserWorkoutStats(id as string);
          setWorkoutStats(stats);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [id]);
  
  const resetAnimationValues = () => {
    successOpacity.setValue(0);
    successScale.setValue(0);
    fullScreenOpacity.setValue(0);
    fullScreenScale.setValue(0.8);
  };

  const animateSuccess = (showFullScreen = false) => {
    setShowSuccessAnimation(true);
    Animated.parallel([
      Animated.timing(successOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(successScale, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (showFullScreen) {
        setTimeout(() => {
          setFullScreenSuccess(true);
          Animated.parallel([
            Animated.timing(fullScreenOpacity, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.spring(fullScreenScale, {
              toValue: 1,
              friction: 6,
              tension: 40,
              useNativeDriver: true,
            }),
          ]).start();
        }, 500);
      }
    });
  };

  const handleDeleteUser = async () => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      await deleteUser(user.uid);
      setConfirmDeleteVisible(false);
      Alert.alert('Success', 'User deleted successfully');
      router.back();
    } catch (error) {
      console.error('Error deleting user:', error);
      Alert.alert('Error', 'Failed to delete user');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleUpdateSubscription = async () => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      
      const subscriptionData = user.subscription || {
        plan: 'basic',
        status: 'trial',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        autoRenew: false,
        price: 9.99
      };
      
      await updateUserSubscription(user.uid, {
        ...subscriptionData,
        status: newSubscriptionStatus,
      });
      
      setUser({
        ...user,
        subscription: {
          ...subscriptionData,
          status: newSubscriptionStatus,
        },
      });
      
      setSubscriptionDialogVisible(false);
      Alert.alert('Success', 'Subscription updated successfully');
    } catch (error) {
      console.error('Error updating subscription:', error);
      Alert.alert('Error', 'Failed to update subscription');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleToggleNotifications = async () => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      
      setNotificationsEnabled(!notificationsEnabled);
      
      setUser({
        ...user,
        notificationsEnabled: !notificationsEnabled,
      });
      
      setIsUpdating(false);
    } catch (error) {
      console.error('Error updating notifications:', error);
      Alert.alert('Error', 'Failed to update notification preferences');
      setIsUpdating(false);
    }
  };

  const handleEditUser = () => {
    router.push({
      pathname: "/admin/edit-user",
      params: { id: user?.uid }
    });
  };
  
  const handleViewAllPayments = () => {
    router.push({
      pathname: "/admin/user-payments",
      params: { id: user?.uid }
    });
  };
  
  const handleAddPayment = async () => {
    if (!user || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid payment amount');
      return;
    }
    
    try {
      setProcessingPayment(true);
      
      const newPayment = {
        userId: user.uid,
        amount: parseFloat(paymentAmount),
        date: new Date(),
        status: 'completed' as const,
        method: 'manual' as const,
        description: paymentDescription || 'Manual payment entry'
      };
      
      const result = await processPayment(newPayment);
      
      if (user.uid) {
        const updatedPayments = await getUserPayments(user.uid);
        setPayments(updatedPayments);
      }
      
      // Only show the dialog animation, not the full screen one
      animateSuccess(false);
      
      setTimeout(() => {
        setPaymentDialogVisible(false);
        setPaymentAmount('');
        setPaymentDescription('');
        setShowSuccessAnimation(false); // Reset animation state when done
        resetAnimationValues(); // Reset animation values
      }, 2000);
      
    } catch (error) {
      console.error('Error recording payment:', error);
      Alert.alert('Error', 'Failed to record payment');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleToggleUserStatus = async () => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      
      const updatedUser = {
        ...user,
        isActive: !user.isActive
      };
      
      setUser(updatedUser);
      
      Alert.alert(
        'Success', 
        `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`
      );
      
    } catch (error) {
      console.error('Error toggling user status:', error);
      Alert.alert('Error', 'Failed to update user status');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleSuspendAccount = async () => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      
      setUser({
        ...user,
        isActive: false,
        suspensionReason: suspensionReason,
        suspendedAt: new Date()
      });
      
      setSuspendDialogVisible(false);
      setSuspensionReason('');
      
      Alert.alert('Success', 'User account suspended successfully');
    } catch (error) {
      console.error('Error suspending user account:', error);
      Alert.alert('Error', 'Failed to suspend user account');
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleDeletePaymentMethod = async (methodId: string) => {
    try {
      setProcessingPayment(true);
      
      setPaymentMethods(paymentMethods.filter(method => method.id !== methodId));
      
      Alert.alert('Success', 'Payment method removed successfully');
    } catch (error) {
      console.error('Error removing payment method:', error);
      Alert.alert('Error', 'Failed to remove payment method');
    } finally {
      setProcessingPayment(false);
    }
  };
  
  const handleSaveNotes = async () => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      
      setUser({
        ...user,
        adminNotes: adminNotes
      });
      
      setNotesDialogVisible(false);
      Alert.alert('Success', 'Notes saved successfully');
    } catch (error) {
      console.error('Error saving notes:', error);
      Alert.alert('Error', 'Failed to save notes');
    } finally {
      setIsUpdating(false);
    }
  };

  const renderPaymentMethods = () => {
    return (
      <View style={styles.paymentSection}>
        <Button
          mode="contained"
          onPress={() => setPaymentDialogVisible(true)}
          style={[styles.addPaymentButton, { backgroundColor: Colors[colorScheme].tint }]}
        >
          Add Payment
        </Button>

        {paymentMethods.length > 0 ? (
          paymentMethods.map(method => (
            <View 
              key={method.id} 
              style={[styles.paymentMethod, { backgroundColor: Colors[colorScheme].cardBackground }]}
            >
              <View style={styles.paymentMethodInfo}>
                <Text style={[styles.paymentMethodType, { color: Colors[colorScheme].text }]}>
                  {method.type}
                </Text>
                <Text style={[styles.paymentMethodDetails, { color: Colors[colorScheme].text }]}>
                  {method.details}
                </Text>
              </View>
              <Pressable
                style={[styles.deleteButton, { backgroundColor: '#FF3B30' }]}
                onPress={() => handleDeletePaymentMethod(method.id)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={[styles.noPayments, { color: Colors[colorScheme].mutedText }]}>
            No payment methods found
          </Text>
        )}
      </View>
    );
  };

  const renderSubscriptionStatus = () => {
    return (
      <View style={styles.subscriptionSection}>
        <Text style={[styles.sectionTitle, { color: Colors[colorScheme].text }]}>
          Subscription Status
        </Text>
        <View style={[
          styles.subscriptionStatus, 
          { 
            backgroundColor: Colors[colorScheme].cardBackground,
            borderColor: user?.subscription?.status === 'active' ? Colors[colorScheme].tint : '#FF3B30' 
          }
        ]}>
          <Text style={[styles.subscriptionText, { color: Colors[colorScheme].text }]}>
            Status: {user?.subscription?.status === 'active' ? 'Active' : 'Inactive'}
          </Text>
          <Text style={[styles.subscriptionText, { color: Colors[colorScheme].text }]}>
            Plan: {user?.subscription?.plan || 'None'}
          </Text>
          {user?.subscription?.endDate && (
            <Text style={[styles.subscriptionText, { color: Colors[colorScheme].text }]}>
              Ends: {new Date(user.subscription.endDate).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderPaymentHistory = () => {
    if (isLoading) {
      return <ActivityIndicator size="large" color={Colors[colorScheme].tint} />;
    }

    // Log detailed payment information when rendering
    if (payments && payments.length > 0) {
      console.log(`Rendering payment history for user ${user?.uid}:`, 
        payments.map(payment => ({
          id: payment.id,
          date: payment.createdAt instanceof Date ? payment.createdAt.toLocaleDateString() : 'Unknown date',
          amount: `${payment.currency || 'USD'} ${payment.amount.toFixed(2)}`,
          status: payment.status,
          type: payment.type,
          paymentMethod: payment.paymentMethod?.type || 'Unknown'
        }))
      );
    }

    if (!payments || payments.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <MaterialCommunityIcons name="cash-remove" size={48} color={Colors[colorScheme].mutedText} />
          <Text style={[styles.noPayments, { color: Colors[colorScheme].mutedText }]}>
            No payment history found
          </Text>
          <Button 
            mode="outlined" 
            onPress={() => setPaymentDialogVisible(true)}
            style={{ marginTop: 12 }}
          >
            Add First Payment
          </Button>
        </View>
      );
    }

    return (
      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.paymentItem, { backgroundColor: Colors[colorScheme].cardBackground }]}>
            <View style={styles.paymentHeader}>
              <Text style={[styles.paymentAmount, { color: Colors[colorScheme].text }]}>
                ${item.amount.toFixed(2)}
              </Text>
              <Text 
                style={[
                  styles.paymentStatus, 
                  { 
                    color: item.status === 'succeeded' || item.status === 'completed'
                      ? Colors[colorScheme || 'light'].success || "#4CAF50" 
                      : item.status === 'pending' 
                        ? Colors[colorScheme || 'light'].warning || "#FFC107" 
                        : Colors[colorScheme || 'light'].error || "#f44336"
                  }
                ]}
              >
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </Text>
            </View>
            <Text style={[styles.paymentDate, { color: Colors[colorScheme].mutedText }]}>
              {new Date(item.created ? item.created * 1000 : item.date).toLocaleDateString()}
            </Text>
            <Text style={[styles.paymentDescription, { color: Colors[colorScheme].text }]}>
              {item.description || 'Subscription payment'}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.paymentsList}
        showsVerticalScrollIndicator={false}
        style={{ maxHeight: 300 }}
      />
    );
  };

  const renderSubscriptionModal = () => {
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSubscriptionModal}
        onRequestClose={() => {
          setShowSubscriptionModal(false);
        }}
      >
        <View style={styles.centeredView}>
          <View style={[styles.modalView, { backgroundColor: Colors[colorScheme].cardBackground }]}>
            <Text style={[styles.modalTitle, { color: Colors[colorScheme].text }]}>
              Manage Subscription
            </Text>
            <View style={styles.subscriptionOptions}>
              {SUBSCRIPTION_PLANS.map((plan) => (
                <Pressable
                  key={plan.id}
                  style={[
                    styles.planOption,
                    {
                      backgroundColor: selectedPlan === plan.id
                        ? Colors[colorScheme].tint
                        : Colors[colorScheme].background
                    }
                  ]}
                  onPress={() => setSelectedPlan(plan.id)}
                >
                  <Text
                    style={[
                      styles.planName,
                      {
                        color: selectedPlan === plan.id
                          ? '#FFFFFF'
                          : Colors[colorScheme].text
                      }
                    ]}
                  >
                    {plan.name}
                  </Text>
                  <Text
                    style={[
                      styles.planPrice,
                      {
                        color: selectedPlan === plan.id
                          ? '#FFFFFF'
                          : Colors[colorScheme].text
                      }
                    ]}
                  >
                    ${plan.price.toFixed(2)}/{plan.interval}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.modalActions}>
              <Pressable
                style={[
                  styles.button,
                  styles.buttonCancel,
                  { backgroundColor: '#FF3B30' }
                ]}
                onPress={() => setShowSubscriptionModal(false)}
              >
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.button,
                  { backgroundColor: Colors[colorScheme].tint }
                ]}
                onPress={handleUpdateSubscription}
                disabled={!selectedPlan || isLoading}
              >
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                  {isLoading ? 'Processing...' : 'Update Subscription'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const renderPaymentDialog = () => (
    <Portal>
      <Dialog
        visible={paymentDialogVisible}
        onDismiss={() => {
          if (!processingPayment && !showSuccessAnimation) {
            setPaymentDialogVisible(false);
          }
        }}
        style={{ backgroundColor: Colors[colorScheme].cardBackground }}
      >
        <Dialog.Title style={{ color: Colors[colorScheme].text }}>
          {showSuccessAnimation ? 'Payment Successful!' : 'Add Manual Payment'}
        </Dialog.Title>
        <Dialog.Content>
          {showSuccessAnimation ? (
            <View style={styles.dialogSuccessContainer}>
              <Animated.View style={[
                styles.successBackground,
                { opacity: successOpacity }
              ]}>
                <Animated.View style={[
                  styles.checkmarkContainer,
                  { 
                    transform: [{ scale: successScale }] 
                  }
                ]}>
                  <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
                </Animated.View>
              </Animated.View>
              <Text style={styles.dialogSuccessText}>Payment has been recorded successfully!</Text>
              {user && <Text style={styles.dialogSuccessSubText}>Receipt #{user.uid?.slice(-4)}</Text>}
            </View>
          ) : (
            <>
              <TextInput
                label="Amount"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                keyboardType="numeric"
                style={{ marginBottom: 16 }}
                mode="outlined"
              />
              <TextInput
                label="Description (optional)"
                value={paymentDescription}
                onChangeText={setPaymentDescription}
                style={{ marginBottom: 16 }}
                mode="outlined"
              />
            </>
          )}
        </Dialog.Content>
        {!showSuccessAnimation && (
          <Dialog.Actions>
            <Button onPress={() => setPaymentDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleAddPayment}
              loading={processingPayment}
              disabled={processingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}
              mode="contained"
            >
              Record Payment
            </Button>
          </Dialog.Actions>
        )}
      </Dialog>
    </Portal>
  );

  const renderActionButtons = () => {
    return (
      <View style={styles.actionButtons}>
        <Pressable
          style={[
            styles.actionButton,
            { backgroundColor: Colors[colorScheme]?.tint || '#007AFF' }
          ]}
          onPress={() => {
            router.push({
              pathname: "/admin/edit-user",
              params: { id: user?.uid }
            });
          }}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Edit User</Text>
        </Pressable>
        <Pressable
          style={[
            styles.actionButton,
            { backgroundColor: user?.isActive ? Colors[colorScheme]?.error || '#FF3B30' : Colors[colorScheme]?.tint || '#007AFF' }
          ]}
          onPress={handleToggleUserStatus}
        >
          <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
            {user?.isActive ? 'Deactivate User' : 'Activate User'}
          </Text>
        </Pressable>
      </View>
    );
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    const date = timestamp instanceof Date ? 
      timestamp : 
      new Date(timestamp.seconds * 1000);
      
    return date.toLocaleDateString();
  };
  
  const getSubscriptionStatusColor = (status?: SubscriptionStatus) => {
    switch (status) {
      case 'active':
        return Colors[colorScheme || 'light'].success || '#4caf50';
      case 'trial':
        return Colors[colorScheme || 'light'].warning || '#ff9800';
      case 'expired':
        return Colors[colorScheme || 'light'].error || '#f44336';
      case 'canceled':
        return Colors[colorScheme || 'light'].mutedText || '#9e9e9e';
      default:
        return Colors[colorScheme || 'light'].mutedText || '#9e9e9e';
    }
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme || 'light'].tint} />
      </ThemedView>
    );
  }
  
  if (!user) {
    return (
      <ThemedView style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={Colors[colorScheme || 'light'].error || "#f44336"} />
        <ThemedText style={styles.errorText}>
          User not found
        </ThemedText>
        <Button 
          mode="contained" 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          Go Back
        </Button>
      </ThemedView>
    );
  }
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: Colors[colorScheme || 'light'].background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <Stack.Screen 
        options={{ 
          title: 'User Details',
          headerRight: () => (
            <View style={{ flexDirection: 'row' }}>
              <IconButton 
                icon="pencil" 
                onPress={handleEditUser}
              />
              <IconButton 
                icon="delete" 
                onPress={() => setConfirmDeleteVisible(true)} 
                iconColor={Colors[colorScheme || 'light'].error || "#f44336"}
              />
            </View>
          )
        }} 
      />
    
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <TouchableOpacity onPress={() => router.back()}>
            <AntDesign name="arrowleft" size={24} color={Colors[colorScheme].text} />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>User Details</ThemedText>
          <IconButton
            icon="dots-vertical"
            ref={iconRef}
            onPress={openMenu}
            iconColor={Colors[colorScheme || 'light'].text}
          />
        </View>
        <Menu
          visible={menuVisible}
          onDismiss={closeMenu}
          anchor={menuAnchorEl}
        >
          <Menu.Item
            onPress={() => {
              closeMenu();
              handleEditUser();
            }}
            title="Edit User"
            leadingIcon="account-edit"
          />
          <Menu.Item
            onPress={() => {
              closeMenu();
              handleViewAllPayments();
            }}
            title="View All Payments"
            leadingIcon="credit-card"
          />
          <Divider />
          <Menu.Item
            onPress={() => {
              closeMenu();
              setSuspendDialogVisible(true);
            }}
            title="Suspend Account"
            leadingIcon="account-off"
            titleStyle={{ color: Colors[colorScheme || 'light'].error || "#f44336" }}
          />
        </Menu>
      </View>

      <Card style={[styles.profileCard, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}>
        <Card.Content style={styles.profileCardContent}>
          <Avatar.Image 
            size={80} 
            source={{ uri: user.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.displayName || 'User') }} 
          />
          <View style={styles.profileInfo}>
            <ThemedText style={styles.userName}>
              {user.displayName || 'No Name'}
            </ThemedText>
            <ThemedText style={styles.userEmail}>
              {user.email}
            </ThemedText>
            <View style={styles.badgeContainer}>
              <View style={[
                styles.badge, 
                { 
                  backgroundColor: user.isActive 
                    ? Colors[colorScheme || 'light'].success || '#4CAF50' 
                    : Colors[colorScheme || 'light'].error || '#f44336' 
                }
              ]}>
                <Text style={styles.badgeText}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
              {user.subscription && (
                <View style={[
                  styles.badge, 
                  { 
                    backgroundColor: getSubscriptionStatusColor(user.subscription.status) 
                  }
                ]}>
                  <Text style={styles.badgeText}>
                    {user.subscription.status?.charAt(0).toUpperCase() + user.subscription.status?.slice(1) || 'No Subscription'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>

      {renderActionButtons()}
      
      {/* Account details */}
      <Card style={[styles.card, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}>
        <Card.Title 
          title="Account Details" 
          titleStyle={[styles.cardTitle, { color: Colors[colorScheme || 'light'].text }]} 
        />
        <Card.Content>
          <ThemedText style={styles.detailLabel}>User ID:</ThemedText>
          <ThemedText style={styles.detailValue}>{user.uid}</ThemedText>
          
          <ThemedText style={styles.detailLabel}>Joined:</ThemedText>
          <ThemedText style={styles.detailValue}>
            {user.createdAt ? formatDate(user.createdAt) : 'Not available'}
          </ThemedText>
          
          <ThemedText style={styles.detailLabel}>Last Active:</ThemedText>
          <ThemedText style={styles.detailValue}>
            {user.lastLogin ? formatDate(user.lastLogin) : 'Not available'}
          </ThemedText>
          
          <View style={styles.toggleContainer}>
            <ThemedText style={styles.toggleLabel}>Notifications:</ThemedText>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              disabled={isUpdating}
              color={Colors[colorScheme].tint}
            />
          </View>
          
          <View style={styles.toggleContainer}>
            <ThemedText style={styles.toggleLabel}>Account Status:</ThemedText>
            <View style={[
              styles.badge, 
              { 
                backgroundColor: user.isActive 
                  ? Colors[colorScheme || 'light'].success || '#4CAF50' 
                  : Colors[colorScheme || 'light'].error || '#f44336',
                marginTop: 0
              }
            ]}>
              <Text style={styles.badgeText}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          
          {user.suspendedAt && (
            <>
              <ThemedText style={styles.detailLabel}>Suspended Date:</ThemedText>
              <ThemedText style={styles.detailValue}>
                {formatDate(user.suspendedAt)}
              </ThemedText>
              
              <ThemedText style={styles.detailLabel}>Suspension Reason:</ThemedText>
              <ThemedText style={styles.detailValue}>
                {user.suspensionReason || 'No reason provided'}
              </ThemedText>
            </>
          )}
        </Card.Content>
      </Card>
      
      {renderSubscriptionStatus()}
      
      {/* Payment History Section */}
      <Card style={[styles.card, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}>
        <Card.Title 
          title="Payment History" 
          titleStyle={[styles.cardTitle, { color: Colors[colorScheme || 'light'].text }]} 
          right={(props) => (
            <View style={{ flexDirection: 'row' }}>
              <IconButton 
                {...props} 
                icon="cash-plus" 
                onPress={() => setPaymentDialogVisible(true)}
                iconColor={Colors[colorScheme || 'light'].tint}
              />
              <Button 
                {...props} 
                onPress={handleViewAllPayments}
                mode="text"
              >
                View All
              </Button>
            </View>
          )}
        />
        <Card.Content style={styles.paymentHistoryContent}>
          {renderPaymentHistory()}
        </Card.Content>
      </Card>

      {workoutStats && (
        <Card style={[styles.card, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}>
          <Card.Title 
            title="Workout Stats" 
            titleStyle={[styles.cardTitle, { color: Colors[colorScheme || 'light'].text }]} 
          />
          <Card.Content>
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>{workoutStats.totalWorkouts}</ThemedText>
                <ThemedText style={styles.statLabel}>Total Workouts</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>{workoutStats.workoutsThisMonth}</ThemedText>
                <ThemedText style={styles.statLabel}>This Month</ThemedText>
              </View>
            </View>
            
            <View style={styles.statRow}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>{workoutStats.averageDuration}m</ThemedText>
                <ThemedText style={styles.statLabel}>Avg. Duration</ThemedText>
              </View>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>{workoutStats.totalSessions}</ThemedText>
                <ThemedText style={styles.statLabel}>Total Sessions</ThemedText>
              </View>
            </View>
            
            {workoutStats.favoriteExercise && (
              <View style={styles.favoriteExercise}>
                <ThemedText style={styles.detailLabel}>Favorite Exercise:</ThemedText>
                <ThemedText style={styles.detailValue}>{workoutStats.favoriteExercise}</ThemedText>
              </View>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Notes section */}
      <Card style={[styles.card, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}>
        <Card.Title 
          title="Admin Notes" 
          titleStyle={[styles.cardTitle, { color: Colors[colorScheme || 'light'].text }]} 
          right={(props) => (
            <IconButton 
              {...props} 
              icon="pencil" 
              onPress={() => {
                setAdminNotes(user.adminNotes || '');
                setNotesDialogVisible(true);
              }} 
            />
          )}
        />
        <Card.Content>
          <ThemedText style={styles.notes}>
            {user.adminNotes || 'No notes available for this user.'}
          </ThemedText>
        </Card.Content>
      </Card>
      
      {renderPaymentDialog()}
      
      {/* Subscription Dialog */}
      <Portal>
        <Dialog
          visible={subscriptionDialogVisible}
          onDismiss={() => setSubscriptionDialogVisible(false)}
          style={{ backgroundColor: Colors[colorScheme || 'light'].cardBackground }}
        >
          <Dialog.Title style={{ color: Colors[colorScheme || 'light'].text }}>
            Update Subscription Status
          </Dialog.Title>
          <Dialog.Content>
            <List.Section>
              <List.Item
                title="Active"
                description="Full access to subscription benefits"
                onPress={() => setNewSubscriptionStatus('active')}
                left={props => (
                  <List.Icon
                    {...props}
                    icon={newSubscriptionStatus === 'active' ? 'radiobox-marked' : 'radiobox-blank'}
                    color={Colors[colorScheme || 'light'].tint}
                  />
                )}
              />
              <List.Item
                title="Trial"
                description="Limited time access to subscription benefits"
                onPress={() => setNewSubscriptionStatus('trial')}
                left={props => (
                  <List.Icon
                    {...props}
                    icon={newSubscriptionStatus === 'trial' ? 'radiobox-marked' : 'radiobox-blank'}
                    color={Colors[colorScheme || 'light'].tint}
                  />
                )}
              />
              <List.Item
                title="Expired"
                description="No longer has access to subscription benefits"
                onPress={() => setNewSubscriptionStatus('expired')}
                left={props => (
                  <List.Icon
                    {...props}
                    icon={newSubscriptionStatus === 'expired' ? 'radiobox-marked' : 'radiobox-blank'}
                    color={Colors[colorScheme || 'light'].tint}
                  />
                )}
              />
              <List.Item
                title="Canceled"
                description="Subscription manually canceled"
                onPress={() => setNewSubscriptionStatus('canceled')}
                left={props => (
                  <List.Icon
                    {...props}
                    icon={newSubscriptionStatus === 'canceled' ? 'radiobox-marked' : 'radiobox-blank'}
                    color={Colors[colorScheme || 'light'].tint}
                  />
                )}
              />
            </List.Section>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSubscriptionDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleUpdateSubscription}
              loading={isUpdating}
              disabled={isUpdating}
              mode="contained"
            >
              Update
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Suspend Account Dialog */}
      <Portal>
        <Dialog
          visible={suspendDialogVisible}
          onDismiss={() => setSuspendDialogVisible(false)}
          style={{ backgroundColor: Colors[colorScheme || 'light'].cardBackground }}
        >
          <Dialog.Title style={{ color: Colors[colorScheme || 'light'].text }}>
            Suspend User Account
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Reason for suspension"
              value={suspensionReason}
              onChangeText={setSuspensionReason}
              multiline
              numberOfLines={3}
              style={{ marginBottom: 16 }}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSuspendDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleSuspendAccount}
              loading={isUpdating}
              disabled={isUpdating || !suspensionReason.trim()}
              mode="contained"
              buttonColor="#FF3B30"
            >
              Suspend
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Delete Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={confirmDeleteVisible}
          onDismiss={() => setConfirmDeleteVisible(false)}
          style={{ backgroundColor: Colors[colorScheme || 'light'].cardBackground }}
        >
          <Dialog.Title style={{ color: Colors[colorScheme || 'light'].text }}>
            Delete User
          </Dialog.Title>
          <Dialog.Content>
            <ThemedText>
              Are you sure you want to permanently delete this user? This action cannot be undone.
            </ThemedText>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDeleteVisible(false)}>Cancel</Button>
            <Button
              onPress={handleDeleteUser}
              loading={isDeleting}
              disabled={isDeleting}
              mode="contained"
              buttonColor="#FF3B30"
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {/* Admin Notes Dialog */}
      <Portal>
        <Dialog
          visible={notesDialogVisible}
          onDismiss={() => setNotesDialogVisible(false)}
          style={{ backgroundColor: Colors[colorScheme || 'light'].cardBackground }}
        >
          <Dialog.Title style={{ color: Colors[colorScheme || 'light'].text }}>
            Edit Admin Notes
          </Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Notes"
              value={adminNotes}
              onChangeText={setAdminNotes}
              multiline
              numberOfLines={5}
              style={{ marginBottom: 16 }}
              mode="outlined"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setNotesDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleSaveNotes}
              loading={isUpdating}
              disabled={isUpdating}
              mode="contained"
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      {renderSubscriptionModal()}

      {fullScreenSuccess && (
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            opacity: fullScreenOpacity,
            transform: [{ scale: fullScreenScale }],
          }}
        >
          <Animated.View
            style={{
              backgroundColor: '#4CAF50',
              borderRadius: 20,
              padding: 30,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Animated.View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: 'white',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
            </Animated.View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 10 }}>
              Payment Successful!
            </Text>
            <Text style={{ fontSize: 16, color: 'white', textAlign: 'center', marginBottom: 20 }}>
              The payment has been processed successfully.
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: 'white',
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 8,
              }}
              onPress={() => {
                Animated.parallel([
                  Animated.timing(fullScreenOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                  }),
                ]).start(() => {
                  setFullScreenSuccess(false);
                  setShowSuccessAnimation(false);
                  resetAnimationValues();
                });
              }}
            >
              <Text style={{ color: '#4CAF50', fontWeight: 'bold' }}>Done</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginTop: 10,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileCard: {
    marginBottom: 20,
    elevation: 4,
  },
  profileCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: 15,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  userEmail: {
    opacity: 0.7,
    marginBottom: 5,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginTop: 5,
  },
  badge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 8,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  divider: {
    marginVertical: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 10,
    flex: 1,
  },
  switch: {
    margin: 0,
  },
  statsCard: {
    marginBottom: 20,
    elevation: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subscriptionSection: {
    marginBottom: 20,
  },
  subscriptionStatus: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
  },
  subscriptionText: {
    marginBottom: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  paymentSection: {
    marginTop: 20,
  },
  input: {
    marginBottom: 16,
  },
  addPaymentButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  paymentMethod: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodType: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  paymentMethodDetails: {
    marginBottom: 4,
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  noPayments: {
    textAlign: 'center',
    marginVertical: 20,
    fontStyle: 'italic',
  },
  paymentItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.tint,
  },
  paymentsList: {
    paddingVertical: 8,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  paymentStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  paymentDate: {
    fontSize: 14,
    marginBottom: 4,
  },
  paymentDescription: {
    fontSize: 14,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  paymentHistoryContent: {
    minHeight: 100,
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalView: {
    width: '90%',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subscriptionOptions: {
    marginBottom: 20,
  },
  planOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  planName: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonCancel: {
    marginRight: 10,
  },
  dialogSuccessContainer: {
    alignItems: 'center',
    padding: 20,
  },
  successBackground: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 50,
    padding: 15,
    marginBottom: 20,
  },
  checkmarkContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogSuccessText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  dialogSuccessSubText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  favoriteExercise: {
    marginTop: 10,
  },
  detailLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailValue: {
    marginBottom: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  toggleLabel: {
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 20,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  notes: {
    fontStyle: 'italic',
  },
});