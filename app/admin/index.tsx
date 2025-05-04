import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert
} from 'react-native';
import { Text, Card, Button, IconButton, Divider, Portal, Dialog, RadioButton } from 'react-native-paper';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { 
  getAllUsers, 
  getAllPayments, 
  calculateRevenue, 
  FinancialPeriod,
  updateUserRole,
  saveUser
} from '@/services/userService';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/firebase/config';

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [currentMonthRevenue, setCurrentMonthRevenue] = useState<FinancialPeriod | null>(null);
  const [previousMonthRevenue, setPreviousMonthRevenue] = useState<FinancialPeriod | null>(null);
  
  // Admin user creation states
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [adminMode, setAdminMode] = useState<'create'|'promote'>('create');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [existingUsers, setExistingUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);
  
  const colorScheme = useColorScheme();
  const router = useRouter();
  
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Get total user count (limited to 100 for performance)
      const users = await getAllUsers(null, 100);
      setUserCount(users.length);
      
      // Get recent payments
      const payments = await getAllPayments(null, 5);
      setRecentPayments(payments);
      
      // Calculate current month revenue
      const today = new Date();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      
      const startOfMonth = new Date(currentYear, currentMonth, 1);
      const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
      
      const currentMonthData = await calculateRevenue(startOfMonth, endOfMonth);
      setCurrentMonthRevenue(currentMonthData);
      
      // Calculate previous month revenue
      const startOfPrevMonth = new Date(currentYear, currentMonth - 1, 1);
      const endOfPrevMonth = new Date(currentYear, currentMonth, 0);
      
      const prevMonthData = await calculateRevenue(startOfPrevMonth, endOfPrevMonth);
      setPreviousMonthRevenue(prevMonthData);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    loadDashboardData();
  }, []);
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };
  
  // Calculate revenue change percentage
  const revenueChangePercent = React.useMemo(() => {
    if (!previousMonthRevenue || previousMonthRevenue.totalRevenue === 0) {
      return null;
    }
    
    if (!currentMonthRevenue) {
      return null;
    }
    
    const change = ((currentMonthRevenue.totalRevenue - previousMonthRevenue.totalRevenue) / 
                    previousMonthRevenue.totalRevenue) * 100;
    
    return change.toFixed(1);
  }, [currentMonthRevenue, previousMonthRevenue]);

  const handleCreateAdmin = async () => {
    try {
      setIsCreatingAdmin(true);
      if (adminMode === 'create') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = {
          uid: userCredential.user.uid,
          email,
          displayName,
          role: 'admin',
        };
        await saveUser(newUser);
        Alert.alert('Success', 'Admin user created successfully.');
      } else if (adminMode === 'promote') {
        await updateUserRole(selectedUserId, 'admin');
        Alert.alert('Success', 'User promoted to admin successfully.');
      }
      setAdminModalVisible(false);
      loadDashboardData();
    } catch (error) {
      console.error('Error creating admin:', error);
      Alert.alert('Error', 'Failed to create admin. Please try again.');
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const openAdminModal = async () => {
    if (adminMode === 'promote') {
      const users = await getAllUsers(null, 100);
      setExistingUsers(users);
    }
    setAdminModalVisible(true);
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: Colors[colorScheme || 'light'].background }]}>
        <ActivityIndicator size="large" color={Colors[colorScheme || 'light'].tint} />
        <Text style={{ marginTop: 16, color: Colors[colorScheme || 'light'].text }}>
          Loading dashboard...
        </Text>
      </View>
    );
  }
  
  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: Colors[colorScheme || 'light'].background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: Colors[colorScheme || 'light'].text }]}>
          Admin Dashboard
        </Text>
        <Text style={[styles.headerSubtitle, { color: Colors[colorScheme || 'light'].mutedText }]}>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
      </View>
      
      <View style={styles.statsGrid}>
        <Card style={[styles.statsCard, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}>
          <Card.Content>
            <View style={styles.statIconContainer}>
              <Ionicons name="people" size={24} color={Colors[colorScheme || 'light'].tint} />
            </View>
            <Text style={[styles.statValue, { color: Colors[colorScheme || 'light'].text }]}>
              {userCount}
            </Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme || 'light'].mutedText }]}>
              Total Users
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button 
              mode="text" 
              onPress={() => router.push('/admin/users')}
              contentStyle={styles.cardActionButton}
            >
              View all
            </Button>
          </Card.Actions>
        </Card>
        
        <Card style={[styles.statsCard, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}>
          <Card.Content>
            <View style={styles.statIconContainer}>
              <Ionicons name="cash" size={24} color="#4CAF50" />
            </View>
            <Text style={[styles.statValue, { color: Colors[colorScheme || 'light'].text }]}>
              ${currentMonthRevenue?.totalRevenue.toFixed(2)}
            </Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme || 'light'].mutedText }]}>
              Monthly Revenue
            </Text>
            {revenueChangePercent && (
              <View style={styles.changeIndicator}>
                <Ionicons 
                  name={parseFloat(revenueChangePercent) >= 0 ? "arrow-up" : "arrow-down"} 
                  size={14} 
                  color={parseFloat(revenueChangePercent) >= 0 ? "#4CAF50" : "#F44336"} 
                />
                <Text style={{ 
                  color: parseFloat(revenueChangePercent) >= 0 ? "#4CAF50" : "#F44336",
                  marginLeft: 4,
                  fontSize: 12,
                }}>
                  {Math.abs(parseFloat(revenueChangePercent))}%
                </Text>
              </View>
            )}
          </Card.Content>
          <Card.Actions>
            <Button 
              mode="text" 
              onPress={() => router.push('/admin/financials')}
              contentStyle={styles.cardActionButton}
            >
              Details
            </Button>
          </Card.Actions>
        </Card>
        
        <Card style={[styles.statsCard, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}>
          <Card.Content>
            <View style={styles.statIconContainer}>
              <Ionicons name="person-add" size={24} color="#2196F3" />
            </View>
            <Text style={[styles.statValue, { color: Colors[colorScheme || 'light'].text }]}>
              {currentMonthRevenue?.newSubscriptions || 0}
            </Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme || 'light'].mutedText }]}>
              New Subscriptions
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button 
              mode="text" 
              onPress={() => router.push('/admin/subscriptions')}
              contentStyle={styles.cardActionButton}
            >
              Manage
            </Button>
          </Card.Actions>
        </Card>
        
        <Card style={[styles.statsCard, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}>
          <Card.Content>
            <View style={styles.statIconContainer}>
              <Ionicons name="refresh-circle" size={24} color="#FF9800" />
            </View>
            <Text style={[styles.statValue, { color: Colors[colorScheme || 'light'].text }]}>
              {currentMonthRevenue?.renewals || 0}
            </Text>
            <Text style={[styles.statLabel, { color: Colors[colorScheme || 'light'].mutedText }]}>
              Renewals
            </Text>
          </Card.Content>
          <Card.Actions>
            <Button 
              mode="text" 
              onPress={() => router.push('/admin/renewals')}
              contentStyle={styles.cardActionButton}
            >
              View
            </Button>
          </Card.Actions>
        </Card>
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme || 'light'].text }]}>
            Recent Payments
          </Text>
          <Link href="/admin/payments" asChild>
            <Button mode="text">View All</Button>
          </Link>
        </View>
        
        {recentPayments.length > 0 ? (
          <Card style={{ backgroundColor: Colors[colorScheme || 'light'].cardBackground }}>
            <Card.Content>
              {recentPayments.map((payment, index) => (
                <React.Fragment key={payment.id}>
                  <View style={styles.paymentItem}>
                    <View style={styles.paymentInfo}>
                      <Text style={{ 
                        fontWeight: '500', 
                        color: Colors[colorScheme || 'light'].text 
                      }}>
                        {payment.userId}
                      </Text>
                      <Text style={{ 
                        fontSize: 12, 
                        color: Colors[colorScheme || 'light'].mutedText,
                        marginTop: 4, 
                      }}>
                        {payment.createdAt instanceof Date 
                          ? payment.createdAt.toLocaleDateString() 
                          : new Date(payment.createdAt.seconds * 1000).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.paymentAmount}>
                      <Text style={{ 
                        fontWeight: 'bold', 
                        color: payment.status === 'completed' ? '#4CAF50' : 
                               payment.status === 'failed' ? '#F44336' : 
                               Colors[colorScheme || 'light'].text 
                      }}>
                        ${payment.amount.toFixed(2)}
                      </Text>
                      <Text style={{
                        fontSize: 12,
                        color: Colors[colorScheme || 'light'].mutedText,
                        textTransform: 'capitalize',
                      }}>
                        {payment.status}
                      </Text>
                    </View>
                  </View>
                  {index < recentPayments.length - 1 && <Divider style={styles.divider} />}
                </React.Fragment>
              ))}
            </Card.Content>
          </Card>
        ) : (
          <Card style={{ backgroundColor: Colors[colorScheme || 'light'].cardBackground }}>
            <Card.Content style={styles.emptyState}>
              <Text style={{ color: Colors[colorScheme || 'light'].mutedText }}>
                No recent payments found
              </Text>
            </Card.Content>
          </Card>
        )}
      </View>
      
      <View style={styles.adminActions}>
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: Colors[colorScheme || 'light'].adminPrimary || '#1a237e' }]}
          onPress={() => router.push('/admin/users')}
        >
          <Ionicons name="people" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Manage Users</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: Colors[colorScheme || 'light'].adminSecondary || '#0d47a1' }]}
          onPress={() => router.push('/admin/payments')}
        >
          <Ionicons name="cash" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Payments</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: Colors[colorScheme || 'light'].adminAccent || '#283593' }]}
          onPress={() => router.push('/admin/financials')}
        >
          <Ionicons name="bar-chart" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Financial Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: Colors[colorScheme || 'light'].adminPrimary || '#1a237e' }]}
          onPress={openAdminModal}
        >
          <Ionicons name="person-add" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>Add Admin</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={adminModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAdminModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}>
            <Text style={[styles.modalTitle, { color: Colors[colorScheme || 'light'].text }]}>
              {adminMode === 'create' ? 'Create Admin' : 'Promote to Admin'}
            </Text>
            <RadioButton.Group
              onValueChange={value => setAdminMode(value as 'create' | 'promote')}
              value={adminMode}
            >
              <View style={styles.radioButtonRow}>
                <RadioButton value="create" />
                <Text style={{ color: Colors[colorScheme || 'light'].text }}>Create New Admin</Text>
              </View>
              <View style={styles.radioButtonRow}>
                <RadioButton value="promote" />
                <Text style={{ color: Colors[colorScheme || 'light'].text }}>Promote Existing User</Text>
              </View>
            </RadioButton.Group>
            {adminMode === 'create' ? (
              <>
                <TextInput
                  placeholder="Email"
                  value={email}
                  onChangeText={setEmail}
                  style={[styles.input, { backgroundColor: Colors[colorScheme || 'light'].inputBackground }]}
                />
                <TextInput
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  style={[styles.input, { backgroundColor: Colors[colorScheme || 'light'].inputBackground }]}
                />
                <TextInput
                  placeholder="Display Name"
                  value={displayName}
                  onChangeText={setDisplayName}
                  style={[styles.input, { backgroundColor: Colors[colorScheme || 'light'].inputBackground }]}
                />
              </>
            ) : (
              <>
                <Text style={{ color: Colors[colorScheme || 'light'].text, marginBottom: 8 }}>Select User:</Text>
                {existingUsers.map(user => (
                  <TouchableOpacity
                    key={user.uid}
                    onPress={() => setSelectedUserId(user.uid)}
                    style={[
                      styles.userItem,
                      selectedUserId === user.uid && { backgroundColor: Colors[colorScheme || 'light'].tint }
                    ]}
                  >
                    <Text style={{ color: Colors[colorScheme || 'light'].text }}>{user.email}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
            <View style={styles.modalActions}>
              <Button onPress={() => setAdminModalVisible(false)}>Cancel</Button>
              <Button loading={isCreatingAdmin} onPress={handleCreateAdmin}>
                {adminMode === 'create' ? 'Create' : 'Promote'}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
    paddingTop: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  statsCard: {
    width: '47%',
    margin: 6,
    elevation: 2,
  },
  statIconContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
  },
  changeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 16,
    alignItems: 'center',
  },
  paymentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentAmount: {
    alignItems: 'flex-end',
  },
  divider: {
    height: 1,
  },
  adminActions: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    margin: 4,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '500',
    marginTop: 8,
  },
  cardActionButton: {
    height: 30,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    padding: 16,
    borderRadius: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
    padding: 8,
    borderRadius: 4,
  },
  radioButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userItem: {
    padding: 8,
    borderRadius: 4,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
});