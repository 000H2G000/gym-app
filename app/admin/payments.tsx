import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Text, Card, Button, Divider, Chip, Searchbar, Dialog, Portal, TextInput } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { getAllPayments, processPayment } from '@/services/paymentService';
import { getUserById } from '@/services/userService';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useToast } from 'native-base'; // Add toast import

export default function PaymentsScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // New state variables for manual payment creation
  const [paymentDialogVisible, setPaymentDialogVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Animation state values
  const [isSuccess, setIsSuccess] = useState(false);
  const [fullScreenSuccess, setFullScreenSuccess] = useState(false);
  const successOpacity = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const fullScreenOpacity = useRef(new Animated.Value(0)).current;
  const fullScreenScale = useRef(new Animated.Value(0.8)).current;

  const toast = useToast(); // Initialize toast

  // Reset animation values to initial state
  const resetAnimationValues = () => {
    successOpacity.setValue(0);
    successScale.setValue(0);
    fullScreenOpacity.setValue(0);
    fullScreenScale.setValue(0.8);
  };

  // Animate the success checkmark in the dialog
  const animateSuccess = (showFullScreen = false) => {
    setIsSuccess(true);
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
      // After dialog animation completes, show full screen if requested
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

  const colorScheme = useColorScheme();
  const router = useRouter();

  const loadPaymentsData = async () => {
    try {
      setIsLoading(true);

      // Get all payments
      const paymentsData = await getAllPayments();
      setPayments(paymentsData);
      setFilteredPayments(paymentsData);

    } catch (error) {
      console.error('Error loading payments data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPaymentsData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPaymentsData();
  };

  const filterPayments = () => {
    let filtered = [...payments];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(payment =>
        payment.userId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    setFilteredPayments(filtered);
  };

  useEffect(() => {
    filterPayments();
  }, [searchQuery, statusFilter, payments]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';

    const date = timestamp instanceof Date
      ? timestamp
      : new Date(timestamp.seconds * 1000);

    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'failed': return '#F44336';
      case 'pending': return '#FFC107';
      default: return Colors[colorScheme || 'light'].text;
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'manual': return 'Manual Entry';
      case 'credit_card': return 'Credit Card';
      case 'paypal': return 'PayPal';
      case 'bank_transfer': return 'Bank Transfer';
      default: return method?.charAt(0).toUpperCase() + method?.slice(1) || 'Unknown';
    }
  };

  // Create payment function with enhanced confirmation
  const handleCreatePayment = async () => {
    if (!selectedUser || !amount || parseFloat(amount) <= 0) {
      toast.show({ title: "Please select a user and enter a valid amount" });
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment in Firestore
      const newPayment = {
        userId: selectedUser.id,
        amount: parseFloat(amount),
        status: "completed",
        date: new Date().toISOString(),
        description: description || "Monthly membership fee",
      };

      await addDoc(collection(db, "payments"), newPayment);

      // Show success animations
      setIsSuccess(true);
      animateSuccess();
      
      // Clear form
      setAmount("");
      setDescription("");
      
      // Refresh payment list
      loadPaymentsData();
      
      // Show full screen confirmation after a short delay
      setTimeout(() => {
        setPaymentDialogVisible(false);
        animateSuccess(true);
      }, 1200);

    } catch (error) {
      console.error("Error creating payment:", error);
      toast.show({ title: "Failed to process payment", description: "Please try again later" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors[colorScheme || 'light'].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme || 'light'].tint} />
        <Text style={{ marginTop: 16, color: Colors[colorScheme || 'light'].text }}>
          Loading payments...
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Payment Management' }} />
      <ScrollView
        style={[styles.container, { backgroundColor: Colors[colorScheme || 'light'].background }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Button
            mode="contained"
            onPress={() => setPaymentDialogVisible(true)}
            style={styles.createButton}
            icon="plus"
          >
            Create Manual Payment
          </Button>
        </View>

        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search by user ID or payment ID"
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[styles.searchBar, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}
          />
        </View>

        <View style={styles.filterContainer}>
          <Text style={[styles.filterLabel, { color: Colors[colorScheme || 'light'].text }]}>
            Status:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
            <Chip
              selected={statusFilter === null}
              onPress={() => setStatusFilter(null)}
              style={styles.filterChip}
              mode="outlined"
            >
              All
            </Chip>
            <Chip
              selected={statusFilter === 'completed'}
              onPress={() => setStatusFilter('completed')}
              style={[styles.filterChip, statusFilter === 'completed' && { backgroundColor: '#E8F5E9' }]}
              mode="outlined"
            >
              Completed
            </Chip>
            <Chip
              selected={statusFilter === 'pending'}
              onPress={() => setStatusFilter('pending')}
              style={[styles.filterChip, statusFilter === 'pending' && { backgroundColor: '#FFF8E1' }]}
              mode="outlined"
            >
              Pending
            </Chip>
            <Chip
              selected={statusFilter === 'failed'}
              onPress={() => setStatusFilter('failed')}
              style={[styles.filterChip, statusFilter === 'failed' && { backgroundColor: '#FFEBEE' }]}
              mode="outlined"
            >
              Failed
            </Chip>
          </ScrollView>
        </View>

        <View style={styles.paymentsContainer}>
          {filteredPayments.length > 0 ? (
            filteredPayments.map((payment, index) => (
              <Card
                key={payment.id}
                style={[styles.paymentCard, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}
              >
                <Card.Content>
                  <View style={styles.paymentHeader}>
                    <View>
                      <Text style={[styles.paymentId, { color: Colors[colorScheme || 'light'].mutedText }]}>
                        ID: {payment.id}
                      </Text>
                      <Text style={[styles.paymentDate, { color: Colors[colorScheme || 'light'].mutedText }]}>
                        {formatDate(payment.createdAt)}
                      </Text>
                    </View>
                    <Chip style={{ backgroundColor: getStatusColor(payment.status) + '20' }}>
                      <Text style={{ color: getStatusColor(payment.status) }}>
                        {payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1)}
                      </Text>
                    </Chip>
                  </View>

                  <Divider style={styles.divider} />

                  <View style={styles.paymentDetails}>
                    <View style={styles.detailRow}>
                      <Text style={{ color: Colors[colorScheme || 'light'].mutedText }}>User ID:</Text>
                      <TouchableOpacity onPress={() => router.push(`/admin/user-detail?userId=${payment.userId}`)}>
                        <Text style={{ color: Colors[colorScheme || 'light'].tint, textDecorationLine: 'underline' }}>
                          {payment.userId}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={{ color: Colors[colorScheme || 'light'].mutedText }}>Amount:</Text>
                      <Text style={[styles.paymentAmount, { color: Colors[colorScheme || 'light'].text }]}>
                        ${payment.amount?.toFixed(2)}
                      </Text>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={{ color: Colors[colorScheme || 'light'].mutedText }}>Method:</Text>
                      <Text style={{ color: Colors[colorScheme || 'light'].text }}>
                        {getPaymentMethodLabel(payment.method)}
                      </Text>
                    </View>

                    {payment.description && (
                      <View style={styles.detailRow}>
                        <Text style={{ color: Colors[colorScheme || 'light'].mutedText }}>Description:</Text>
                        <Text style={{ color: Colors[colorScheme || 'light'].text, flex: 1, textAlign: 'right' }}>
                          {payment.description}
                        </Text>
                      </View>
                    )}
                  </View>
                </Card.Content>
                <Card.Actions>
                  <Button
                    icon="information"
                    onPress={() => { /* View details action */ }}
                  >
                    Details
                  </Button>
                  {payment.status === 'failed' && (
                    <Button
                      icon="refresh"
                      mode="contained"
                      buttonColor="#F44336"
                      textColor="white"
                      onPress={() => { /* Retry payment action */ }}
                    >
                      Retry
                    </Button>
                  )}
                  {payment.status === 'pending' && (
                    <Button
                      icon="check"
                      mode="contained"
                      buttonColor="#4CAF50"
                      textColor="white"
                      onPress={() => { /* Mark as complete action */ }}
                    >
                      Mark Complete
                    </Button>
                  )}
                </Card.Actions>
              </Card>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cash-outline" size={64} color={Colors[colorScheme || 'light'].mutedText} />
              <Text style={[styles.emptyStateText, { color: Colors[colorScheme || 'light'].text }]}>
                No payments found
              </Text>
              <Text style={{ color: Colors[colorScheme || 'light'].mutedText, textAlign: 'center' }}>
                {searchQuery || statusFilter ? 'Try adjusting your filters' : 'Payments will appear here once processed'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Payment creation dialog */}
      <Portal>
        <Dialog
          visible={paymentDialogVisible}
          onDismiss={() => {
            if (!isProcessing && !isSuccess) {
              setPaymentDialogVisible(false);
            }
          }}
          style={{ backgroundColor: Colors[colorScheme || 'light'].cardBackground }}
        >
          <Dialog.Title style={{ color: Colors[colorScheme || 'light'].text }}>
            {isSuccess ? 'Payment Successful!' : 'Create Manual Payment'}
          </Dialog.Title>
          <Dialog.Content>
            {isSuccess ? (
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
                <Text style={styles.dialogSuccessSubText}>Receipt #{selectedUser?.id?.slice(-4)}</Text>
              </View>
            ) : (
              <>
                <TextInput
                  label="User ID"
                  value={selectedUser?.id || ''}
                  onChangeText={(text) => setSelectedUser({ id: text })}
                  style={{ marginBottom: 8 }}
                  mode="outlined"
                />

                <TextInput
                  label="Amount"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                  style={{ marginBottom: 16 }}
                  mode="outlined"
                />

                <TextInput
                  label="Description (optional)"
                  value={description}
                  onChangeText={setDescription}
                  style={{ marginBottom: 16 }}
                  mode="outlined"
                />
              </>
            )}
          </Dialog.Content>
          {!isSuccess && (
            <Dialog.Actions>
              <Button 
                onPress={() => setPaymentDialogVisible(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onPress={handleCreatePayment}
                loading={isProcessing}
                disabled={isProcessing || !selectedUser || !amount || parseFloat(amount) <= 0}
                mode="contained"
              >
                Create Payment
              </Button>
            </Dialog.Actions>
          )}
        </Dialog>
      </Portal>

      {/* Success animation */}
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
                  resetAnimationValues();
                });
              }}
            >
              <Text style={{ color: '#4CAF50', fontWeight: 'bold' }}>Done</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      )}
    </>
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
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  createButton: {
    marginBottom: 8,
  },
  searchContainer: {
    padding: 16,
    paddingTop: 0,
  },
  searchBar: {
    elevation: 2,
    marginVertical: 8,
  },
  filterContainer: {
    padding: 16,
    paddingTop: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    marginRight: 10,
  },
  chipContainer: {
    flexDirection: 'row',
  },
  filterChip: {
    marginRight: 8,
  },
  paymentsContainer: {
    padding: 16,
    paddingTop: 0,
  },
  paymentCard: {
    marginBottom: 12,
    elevation: 2,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  paymentId: {
    fontSize: 12,
  },
  paymentDate: {
    fontSize: 12,
    marginTop: 4,
  },
  divider: {
    marginVertical: 12,
  },
  paymentDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentAmount: {
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  successContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  // Add new styles for in-dialog success
  dialogSuccessContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  dialogSuccessText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  dialogSuccessSubText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    color: '#757575',
  },
  checkmarkContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successBackground: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});