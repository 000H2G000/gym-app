import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl 
} from 'react-native';
import { 
  Text, 
  Searchbar, 
  Card, 
  Avatar, 
  Menu, 
  Divider, 
  Button, 
  Dialog, 
  Portal,
  RadioButton,
  IconButton
} from 'react-native-paper';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { 
  getAllUsers, 
  User, 
  updateUserRole, 
  UserRole, 
  searchUsers 
} from '@/services/userService';

export default function UsersManagementScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [roleDialogVisible, setRoleDialogVisible] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [lastUser, setLastUser] = useState<User | null>(null);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  
  const colorScheme = useColorScheme();
  const router = useRouter();
  
  const loadUsers = async (refresh = false) => {
    try {
      setIsLoading(true);
      
      if (refresh) {
        setLastUser(null);
      }
      
      const fetchedUsers = await getAllUsers(refresh ? null : lastUser);
      
      if (fetchedUsers.length < 20) {
        setHasMoreUsers(false);
      }
      
      if (refresh || !lastUser) {
        setUsers(fetchedUsers);
      } else {
        setUsers([...users, ...fetchedUsers]);
      }
      
      setLastUser(fetchedUsers[fetchedUsers.length - 1] || null);
      
      // Apply current search filter
      if (searchQuery) {
        filterUsers(searchQuery, fetchedUsers);
      } else {
        setFilteredUsers(refresh ? fetchedUsers : [...filteredUsers, ...fetchedUsers]);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  useEffect(() => {
    loadUsers();
  }, []);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadUsers(true);
  };
  
  const handleLoadMore = async () => {
    if (hasMoreUsers && !isLoading && !searchQuery) {
      loadUsers();
    }
  };
  
  const filterUsers = async (query: string, usersList = users) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredUsers(usersList);
      return;
    }
    
    // If query length >= 3, do a server-side search
    if (query.length >= 3) {
      try {
        const results = await searchUsers(query);
        setFilteredUsers(results);
      } catch (error) {
        console.error('Error searching users:', error);
        
        // Fallback to client-side filtering
        const filtered = usersList.filter(user => 
          user.email.toLowerCase().includes(query.toLowerCase()) ||
          user.displayName?.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredUsers(filtered);
      }
    } else {
      // Simple client-side filtering for short queries
      const filtered = usersList.filter(user => 
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        user.displayName?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };
  
  const handleUserPress = (user: User) => {
    router.push(`/admin/user-detail?id=${user.uid}`);
  };
  
  const handleOpenMenu = (userId: string) => {
    setMenuVisible(userId);
  };
  
  const handleCloseMenu = () => {
    setMenuVisible(null);
  };
  
  const handleOpenRoleDialog = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role || 'user');
    setRoleDialogVisible(true);
    handleCloseMenu();
  };
  
  const handleRoleChange = async () => {
    if (!selectedUser) return;
    
    try {
      await updateUserRole(selectedUser.uid, newRole);
      
      // Update local data
      const updatedUsers = users.map(user => {
        if (user.uid === selectedUser.uid) {
          return { ...user, role: newRole };
        }
        return user;
      });
      
      setUsers(updatedUsers);
      setFilteredUsers(filteredUsers.map(user => {
        if (user.uid === selectedUser.uid) {
          return { ...user, role: newRole };
        }
        return user;
      }));
      
      setRoleDialogVisible(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };
  
  const sortUsers = (type: 'name' | 'date') => {
    setSortBy(type);
    setSortMenuVisible(false);
    
    const sorted = [...filteredUsers];
    
    if (type === 'name') {
      sorted.sort((a, b) => {
        return a.displayName?.localeCompare(b.displayName || '') || 0;
      });
    } else {
      sorted.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? 
          a.createdAt.getTime() : 
          new Date(a.createdAt.seconds * 1000).getTime();
          
        const dateB = b.createdAt instanceof Date ? 
          b.createdAt.getTime() : 
          new Date(b.createdAt.seconds * 1000).getTime();
          
        return dateB - dateA;
      });
    }
    
    setFilteredUsers(sorted);
  };
  
  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return '#f44336';
      case 'trainer':
        return '#2196f3';
      default:
        return '#757575';
    }
  };
  
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    
    const date = timestamp instanceof Date ? 
      timestamp : 
      new Date(timestamp.seconds * 1000);
      
    return date.toLocaleDateString();
  };
  
  const renderUserItem = ({ item }: { item: User }) => (
    <Card 
      style={[styles.userCard, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}
      onPress={() => handleUserPress(item)}
    >
      <Card.Content style={styles.userCardContent}>
        <View style={styles.userInfo}>
          <Avatar.Image 
            size={50} 
            source={{ uri: item.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.displayName || 'User') }} 
          />
          <View style={styles.userDetails}>
            <Text style={[styles.userName, { color: Colors[colorScheme || 'light'].text }]}>
              {item.displayName || 'No Name'}
            </Text>
            <Text style={[styles.userEmail, { color: Colors[colorScheme || 'light'].mutedText }]}>
              {item.email}
            </Text>
            <View style={styles.badgeRow}>
              <View 
                style={[
                  styles.roleBadge, 
                  { backgroundColor: getRoleBadgeColor(item.role) }
                ]}
              >
                <Text style={styles.roleBadgeText}>{item.role}</Text>
              </View>
              {item.subscription && (
                <View 
                  style={[
                    styles.subscriptionBadge,
                    { 
                      backgroundColor: item.subscription.status === 'active' ? 
                        '#4caf50' : item.subscription.status === 'trial' ? 
                        '#ff9800' : '#9e9e9e'
                    }
                  ]}
                >
                  <Text style={styles.roleBadgeText}>{item.subscription.plan}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        <View style={styles.userActions}>
          <Text style={[styles.joinDate, { color: Colors[colorScheme || 'light'].mutedText }]}>
            Joined: {formatDate(item.createdAt)}
          </Text>
          
          <Menu
            visible={menuVisible === item.uid}
            onDismiss={handleCloseMenu}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={20}
                onPress={() => handleOpenMenu(item.uid)}
              />
            }
          >
            <Menu.Item 
              onPress={() => {
                handleOpenRoleDialog(item);
              }} 
              title="Change Role" 
              leadingIcon="shield-account"
            />
            <Menu.Item 
              onPress={() => {
                handleCloseMenu();
                router.push(`/admin/user-detail?id=${item.uid}`);
              }} 
              title="View Details" 
              leadingIcon="account-details"
            />
            <Divider />
            <Menu.Item 
              onPress={() => {
                handleCloseMenu();
                router.push(`/admin/user-payments?id=${item.uid}`);
              }} 
              title="Payment History" 
              leadingIcon="credit-card"
            />
          </Menu>
        </View>
      </Card.Content>
    </Card>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme || 'light'].background }]}>
      <Stack.Screen 
        options={{ 
          title: 'User Management',
          headerRight: () => (
            <Menu
              visible={sortMenuVisible}
              onDismiss={() => setSortMenuVisible(false)}
              anchor={
                <IconButton
                  icon="sort"
                  onPress={() => setSortMenuVisible(true)}
                />
              }
            >
              <Menu.Item 
                onPress={() => sortUsers('name')} 
                title="Sort by Name"
                leadingIcon={sortBy === 'name' ? 'check' : undefined}
              />
              <Menu.Item 
                onPress={() => sortUsers('date')} 
                title="Sort by Date" 
                leadingIcon={sortBy === 'date' ? 'check' : undefined}
              />
            </Menu>
          )
        }} 
      />
      
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search users..."
          onChangeText={filterUsers}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: Colors[colorScheme || 'light'].cardBackground }]}
          iconColor={Colors[colorScheme || 'light'].tint}
          inputStyle={{ color: Colors[colorScheme || 'light'].text }}
        />
      </View>
      
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={item => item.uid}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
        ListFooterComponent={
          isLoading && !isRefreshing ? (
            <ActivityIndicator 
              style={styles.loadingIndicator} 
              color={Colors[colorScheme || 'light'].tint} 
              size="small"
            />
          ) : null
        }
        ListEmptyComponent={
          !isLoading && !isRefreshing ? (
            <View style={styles.emptyContainer}>
              <Ionicons 
                name="people" 
                size={64} 
                color={Colors[colorScheme || 'light'].mutedText} 
              />
              <Text style={[styles.emptyText, { color: Colors[colorScheme || 'light'].mutedText }]}>
                {searchQuery ? 'No users found matching your search' : 'No users found'}
              </Text>
            </View>
          ) : null
        }
      />
      
      {/* Role Change Dialog */}
      <Portal>
        <Dialog 
          visible={roleDialogVisible} 
          onDismiss={() => setRoleDialogVisible(false)}
          style={{ backgroundColor: Colors[colorScheme || 'light'].cardBackground }}
        >
          <Dialog.Title style={{ color: Colors[colorScheme || 'light'].text }}>
            Change User Role
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ marginBottom: 16, color: Colors[colorScheme || 'light'].mutedText }}>
              Select a new role for {selectedUser?.displayName || 'this user'}
            </Text>
            <RadioButton.Group onValueChange={(value) => setNewRole(value as UserRole)} value={newRole}>
              <RadioButton.Item 
                label="User" 
                value="user"
                labelStyle={{ color: Colors[colorScheme || 'light'].text }} 
              />
              <RadioButton.Item 
                label="Admin" 
                value="admin" 
                labelStyle={{ color: Colors[colorScheme || 'light'].text }}
              />
              <RadioButton.Item 
                label="Trainer" 
                value="trainer" 
                labelStyle={{ color: Colors[colorScheme || 'light'].text }}
              />
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRoleDialogVisible(false)}>Cancel</Button>
            <Button onPress={handleRoleChange}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      
      <Button
        mode="contained"
        icon="plus"
        onPress={() => router.push('/admin/add-user')}
        style={styles.addButton}
      >
        Add New User
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchBar: {
    elevation: 2,
    borderRadius: 8,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  userCard: {
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
  },
  userCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 6,
  },
  roleBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  subscriptionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  userActions: {
    alignItems: 'flex-end',
  },
  joinDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  loadingIndicator: {
    paddingVertical: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    borderRadius: 28,
  },
});