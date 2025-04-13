import React, { useState, useContext, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from './_layout';
import { getAuth } from 'firebase/auth';
import { app } from '../../firebase/config';
import { 
  getAllUsers, 
  getUserChats, 
  ChatUser,
  markMessagesAsRead
} from '../../services/chatService';
import { router } from 'expo-router';
import { 
  Avatar, 
  Searchbar, 
  Chip, 
  Badge, 
  SegmentedButtons, 
  Divider 
} from 'react-native-paper';

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  // Get user from context
  const { user: contextUser } = useContext(AuthContext) || {};
  
  // Also get user directly from Firebase auth as a fallback
  const [firebaseUser, setFirebaseUser] = useState(null);
  const auth = getAuth(app);
  
  // Use either the context user or the Firebase user
  const user = contextUser || firebaseUser;
  
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('chats');

  // Get user from Firebase auth directly if not in context
  useEffect(() => {
    if (!contextUser && auth.currentUser) {
      console.log("Using Firebase auth directly in chat list:", auth.currentUser.uid);
      setFirebaseUser(auth.currentUser);
    }
  }, [contextUser, auth]);

  // Load users and existing chats
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    console.log("Fetching chat data for user:", user.uid);
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get all users
      const allUsers = await getAllUsers(user.uid);
      
      // Remove any duplicate users (by userId)
      const uniqueUsers = Array.from(
        new Map(allUsers.map(user => [user.userId, user])).values()
      );
      
      setUsers(uniqueUsers);
      
      // Get existing chats
      const userChats = await getUserChats(user.uid);
      setChats(userChats);
    } catch (error) {
      console.error('Error fetching chat data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleOpenChat = async (chatUser: ChatUser) => {
    router.push({
      pathname: '/(chat)/conversation',
      params: {
        userId: chatUser.userId,
        name: chatUser.fullName
      }
    });
  };

  const handleOpenExistingChat = async (chat: any) => {
    // First mark messages as read
    try {
      await markMessagesAsRead(user.uid, chat.otherUserId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }

    router.push({
      pathname: '/(chat)/conversation',
      params: {
        userId: chat.otherUserId,
        name: chat.fullName
      }
    });
  };
  
  // Filter users based on search query
  const filteredUsers = users.filter(
    chatUser => chatUser.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Filter chats based on search query
  const filteredChats = chats.filter(
    chat => chat.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUserItem = ({ item }: { item: ChatUser }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleOpenChat(item)}
    >
      <Avatar.Text 
        size={50} 
        label={item.fullName.substring(0, 2).toUpperCase()}
        color="white"
        style={{ 
          backgroundColor: Colors[colorScheme ?? 'light'].tint,
          marginRight: 16 
        }}
      />
      <View style={styles.userInfo}>
        <Text style={{ 
          fontSize: 16, 
          fontWeight: '600',
          color: Colors[colorScheme ?? 'light'].text
        }}>
          {item.fullName}
        </Text>
        <Text style={{ 
          color: Colors[colorScheme ?? 'light'].mutedText,
          fontSize: 13
        }}>
          Tap to start a conversation
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderChatItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleOpenExistingChat(item)}
    >
      <View style={{ position: 'relative' }}>
        <Avatar.Text 
          size={50} 
          label={item.fullName.substring(0, 2).toUpperCase()}
          color="white"
          style={{ 
            backgroundColor: Colors[colorScheme ?? 'light'].tint,
            marginRight: 16 
          }}
        />
        {item.unreadCount > 0 && (
          <Badge
            style={styles.badge}
            size={20}
          >
            {item.unreadCount}
          </Badge>
        )}
      </View>
      <View style={styles.userInfo}>
        <Text style={{ 
          fontSize: 16, 
          fontWeight: item.unreadCount > 0 ? '700' : '600',
          color: Colors[colorScheme ?? 'light'].text
        }}>
          {item.fullName}
        </Text>
        <Text 
          style={{ 
            color: item.unreadCount > 0 
              ? Colors[colorScheme ?? 'light'].text 
              : Colors[colorScheme ?? 'light'].mutedText,
            fontSize: 13,
            fontWeight: item.unreadCount > 0 ? '600' : 'normal',
          }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {item.isLastMessageFromMe ? 'You: ' : ''}{item.lastMessage || 'Start a conversation'}
        </Text>
      </View>
      {item.lastMessageTimestamp && (
        <Text style={{
          fontSize: 12,
          color: Colors[colorScheme ?? 'light'].mutedText,
        }}>
          {formatTime(item.lastMessageTimestamp)}
        </Text>
      )}
    </TouchableOpacity>
  );

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp.seconds * 1000);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this week, show day name
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.emptyContainer}>
          <Ionicons 
            name="log-in-outline" 
            size={64} 
            color={Colors[colorScheme ?? 'light'].mutedText}
          />
          <Text style={{ 
            marginTop: 16, 
            color: Colors[colorScheme ?? 'light'].text,
            fontSize: 18,
            textAlign: 'center'
          }}>
            Please log in
          </Text>
          <Text style={{ 
            marginTop: 8, 
            color: Colors[colorScheme ?? 'light'].mutedText,
            textAlign: 'center',
            paddingHorizontal: 40
          }}>
            You need to be logged in to view and send messages
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <Text style={{ marginTop: 16, color: Colors[colorScheme ?? 'light'].text }}>
            Loading chat data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <View style={styles.header}>
        <Text style={{ 
          fontSize: 24, 
          fontWeight: 'bold',
          color: Colors[colorScheme ?? 'light'].text
        }}>
          Messages
        </Text>
      </View>

      <Searchbar
        placeholder="Search users"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={[
          styles.searchBar,
          { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
        ]}
        inputStyle={{ color: Colors[colorScheme ?? 'light'].text }}
        iconColor={Colors[colorScheme ?? 'light'].mutedText}
        clearIcon="close-circle"
      />

      <SegmentedButtons
        value={activeTab}
        onValueChange={setActiveTab}
        buttons={[
          {
            value: 'chats',
            label: 'Conversations',
            icon: 'chat',
            checkedColor: Colors[colorScheme ?? 'light'].tint,
          },
          {
            value: 'users',
            label: 'All Users',
            icon: 'account-group',
            checkedColor: Colors[colorScheme ?? 'light'].tint,
          },
        ]}
        style={styles.tabs}
      />

      <Divider style={{ marginVertical: 8 }} />

      {activeTab === 'chats' ? (
        chats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="chatbubble-ellipses-outline" 
              size={64} 
              color={Colors[colorScheme ?? 'light'].mutedText}
            />
            <Text style={{ 
              marginTop: 16, 
              color: Colors[colorScheme ?? 'light'].text,
              fontSize: 18,
              textAlign: 'center'
            }}>
              No conversations yet
            </Text>
            <Text style={{ 
              marginTop: 8, 
              color: Colors[colorScheme ?? 'light'].mutedText,
              textAlign: 'center',
              paddingHorizontal: 40
            }}>
              Start chatting with other gym enthusiasts by switching to the "All Users" tab
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredChats}
            renderItem={renderChatItem}
            keyExtractor={(item) => item.chatId}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={handleRefresh}
                colors={[Colors[colorScheme ?? 'light'].tint]}
                tintColor={Colors[colorScheme ?? 'light'].tint}
              />
            }
          />
        )
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              colors={[Colors[colorScheme ?? 'light'].tint]}
              tintColor={Colors[colorScheme ?? 'light'].tint}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    elevation: 0,
  },
  tabs: {
    marginHorizontal: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: 12,
    backgroundColor: '#FF5252',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
}); 