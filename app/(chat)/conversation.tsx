import React, { useState, useEffect, useContext, useRef, useCallback, useMemo } from 'react';
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
  ImageBackground,
  Alert,
  Pressable,
  Modal,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { AuthContext } from '../(tabs)/_layout';
import { getAuth } from 'firebase/auth';
import { app, db } from '../../firebase/config';
import { 
  sendMessage, 
  getMessages, 
  subscribeToMessages, 
  markMessagesAsRead,
  Message,
  addReactionToMessage,
  getChatId
} from '../../services/chatService';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Avatar, IconButton, Surface, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, getDoc } from 'firebase/firestore';

// Emoji reactions available
const REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '😡'];

export default function ConversationScreen() {
  const colorScheme = useColorScheme();
  // Get user from context
  const { user: contextUser } = useContext(AuthContext) || {};
  
  // Also get user directly from Firebase auth as a fallback
  const [firebaseUser, setFirebaseUser] = useState(null);
  const auth = getAuth(app);
  
  // Use either the context user or the Firebase user
  const user = contextUser || firebaseUser;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  
  // State for reaction UI
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showReactions, setShowReactions] = useState(false);
  const reactionAnimValue = useRef(new Animated.Value(0)).current;
  
  // Create a map to store animation values for each message's reaction
  const reactionAnimationsRef = useRef<{[key: string]: Animated.Value}>({});
  
  // Get the user ID and name from the URL params
  const { userId, name } = useLocalSearchParams<{ userId: string, name: string }>();
  
  const [isPartnerChat, setIsPartnerChat] = useState(false);
  const [partnerWorkout, setPartnerWorkout] = useState<{id: string, name: string} | null>(null);
  
  // Get user from Firebase auth directly if not in context
  useEffect(() => {
    if (!contextUser && auth.currentUser) {
      console.log("Using Firebase auth directly:", auth.currentUser.uid);
      setFirebaseUser(auth.currentUser);
    }
  }, [contextUser, auth]);
  
  useEffect(() => {
    // Debug log
    console.log("Context user:", contextUser?.uid);
    console.log("Firebase user:", firebaseUser?.uid);
    console.log("Final user being used:", user?.uid);
    console.log("Conversation with:", userId, name);
  }, [contextUser, firebaseUser, user, userId, name]);
  
  // Load messages and setup real-time updates
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    // If no user from context, try to get directly from auth
    if (!user) {
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log("Setting user from auth directly for subscription");
        setFirebaseUser(currentUser);
        
        // Continue with the subscription once we have the user
        setupSubscription(currentUser.uid, userId);
      } else {
        setLoading(false);
      }
      return;
    }
    
    // Setup the subscription with the user we have
    setupSubscription(user.uid, userId);
    
  }, [user, userId, auth]);
  
  // Function to setup message subscription
  const setupSubscription = (currentUserId, otherUserId) => {
    console.log(`Setting up subscription between ${currentUserId} and ${otherUserId}`);
    
    // Mark messages as read
    markMessagesAsRead(currentUserId, otherUserId).catch(error => {
      console.error("Error marking messages as read:", error);
    });
    
    // Setup subscription to new messages
    const unsubscribe = subscribeToMessages(
      currentUserId, 
      otherUserId, 
      (updatedMessages) => {
        // Make sure reaction data is included
        console.log("Received messages with reactions:", updatedMessages);
        setMessages(updatedMessages);
        setLoading(false);
      }
    );
    
    return () => {
      // Clean up subscription
      if (unsubscribe) {
        console.log("Unsubscribing from messages");
        unsubscribe();
      }
    };
  };
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [messages]);
  
  // Animation for emoji reaction panel
  useEffect(() => {
    Animated.timing(reactionAnimValue, {
      toValue: showReactions ? 1 : 0,
      duration: 200,
      useNativeDriver: true
    }).start();
  }, [showReactions]);
  
  // Get animation value for a message - create if it doesn't exist
  const getMessageAnimationValue = useCallback((messageId: string): Animated.Value => {
    if (!reactionAnimationsRef.current[messageId]) {
      reactionAnimationsRef.current[messageId] = new Animated.Value(0);
    }
    return reactionAnimationsRef.current[messageId];
  }, []);

  // Start animation for a message
  const animateReaction = useCallback((messageId: string) => {
    const animValue = getMessageAnimationValue(messageId);
    // Reset to 0 before animating
    animValue.setValue(0);
    Animated.spring(animValue, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true
    }).start();
  }, [getMessageAnimationValue]);

  // When messages change, check for new reactions that need animating
  useEffect(() => {
    messages.forEach(message => {
      if (message.reaction && message.id) {
        // Only animate if this is a newly added reaction
        const prevMessages = messagesRef.current || [];
        const prevMessage = prevMessages.find(m => m.id === message.id);
        
        if (!prevMessage?.reaction || prevMessage.reaction !== message.reaction) {
          animateReaction(message.id);
        }
      }
    });
    
    // Update ref for next comparison
    messagesRef.current = [...messages];
  }, [messages, animateReaction]);

  // Keep a reference to previous messages to detect changes
  const messagesRef = useRef<Message[]>([]);
  
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    console.log("Attempting to send message...");
    console.log("Current user:", user);
    console.log("Destination userId:", userId);
    console.log("Message text:", inputText.trim());
    
    if (!user || !userId) {
      console.error("Missing user or userId:", { user, userId });
      
      // Try to get current user from auth directly
      const currentUser = auth.currentUser;
      if (currentUser && userId) {
        console.log("Found user in auth directly:", currentUser.uid);
        
        try {
          setSending(true);
          console.log(`Sending message from ${currentUser.uid} to ${userId}`);
          await sendMessage(currentUser.uid, userId, inputText.trim());
          setInputText('');
          console.log("Message sent successfully");
          return;
        } catch (error) {
          console.error('Error sending message with direct auth:', error);
        } finally {
          setSending(false);
        }
      }
      
      Alert.alert("Error", "You need to be logged in to send messages");
      return;
    }
    
    try {
      setSending(true);
      console.log(`Sending message from ${user.uid} to ${userId}`);
      await sendMessage(user.uid, userId, inputText.trim());
      setInputText('');
      console.log("Message sent successfully");
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };
  
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const handleLongPressMessage = (message: Message) => {
    setSelectedMessage(message);
    setShowReactions(true);
  };
  
  const handleReaction = async (reaction: string) => {
    if (!selectedMessage || !user) return;
    
    try {
      await addReactionToMessage(selectedMessage.id, user.uid, reaction);
      console.log(`Added reaction ${reaction} to message ${selectedMessage.id}`);
    } catch (error) {
      console.error('Error adding reaction:', error);
    } finally {
      setShowReactions(false);
      setSelectedMessage(null);
    }
  };
  
  const renderMessageItem = useCallback(({ item: message }) => {
    const isCurrentUser = message.senderId === user?.uid;
    const formattedTimestamp = formatTime(message.timestamp);
    
    // Get the animation for this message
    const reactionAnimation = getMessageAnimationValue(message.id);
    
    return (
      <Pressable
        onLongPress={() => handleLongPressMessage(message)}
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.myMessageContainer : styles.theirMessageContainer
        ]}
      >
        <View>
          <View style={[
            styles.messageBubble,
            isCurrentUser
              ? styles.myMessageBubble
              : styles.theirMessageBubble
          ]}>
            {isCurrentUser ? (
              <LinearGradient
                colors={['#4568dc', '#3a6fd8']}
                style={[styles.gradientBubble, styles.myMessageBubble]}
              >
                <Text style={[
                  styles.messageText,
                  { color: 'white' }
                ]}>
                  {message.text}
                </Text>
                {message.timestamp && (
                  <Text style={[
                    styles.timeText,
                    { color: 'rgba(255,255,255,0.7)' }
                  ]}>
                    {formattedTimestamp}
                  </Text>
                )}
              </LinearGradient>
            ) : (
              <View style={[
                styles.plainBubble,
                { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
              ]}>
                <Text style={[
                  styles.messageText,
                  { color: Colors[colorScheme ?? 'light'].text }
                ]}>
                  {message.text}
                </Text>
                {message.timestamp && (
                  <Text style={[
                    styles.timeText,
                    { color: Colors[colorScheme ?? 'light'].mutedText }
                  ]}>
                    {formattedTimestamp}
                  </Text>
                )}
              </View>
            )}
          </View>
          
          {message.reaction && (
            <Animated.View
              style={[
                styles.reactionContainer,
                {
                  transform: [
                    {
                      scale: reactionAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 1]
                      })
                    }
                  ]
                }
              ]}
            >
              <Text style={styles.reactionText}>{message.reaction}</Text>
            </Animated.View>
          )}
        </View>
      </Pressable>
    );
  }, [user?.uid, getMessageAnimationValue]);
  
  const renderMessageSeparator = () => <View style={styles.messageSeparator} />;
  
  const renderReactionPanel = () => {
    const translateY = reactionAnimValue.interpolate({
      inputRange: [0, 1],
      outputRange: [100, 0]
    });
    
    return (
      <Modal
        transparent={true}
        visible={showReactions}
        animationType="none"
        onRequestClose={() => setShowReactions(false)}
      >
        <Pressable 
          style={styles.reactionOverlay}
          onPress={() => setShowReactions(false)}
        >
          <Animated.View
            style={[
              styles.reactionPanel,
              { 
                transform: [{ translateY }],
                backgroundColor: Colors[colorScheme ?? 'light'].cardBackground
              }
            ]}
          >
            <View style={[styles.reactionPanelHeader, { borderBottomColor: Colors[colorScheme ?? 'light'].border }]}>
              <Text style={[styles.reactionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                Add a reaction
              </Text>
            </View>
            <View style={styles.reactionPanelContent}>
              {REACTIONS.map((reaction) => (
                <TouchableOpacity
                  key={reaction}
                  style={styles.reactionButton}
                  onPress={() => handleReaction(reaction)}
                >
                  <Text style={styles.reactionEmoji}>{reaction}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    );
  };
  
  // Check if this is a partner chat
  useEffect(() => {
    const checkPartnerChat = async () => {
      if (!userId || !user) return;
      
      try {
        const chatId = getChatId(user.uid, userId);
        const chatRef = doc(db, 'chats', chatId);
        const chatSnap = await getDoc(chatRef);
        
        if (chatSnap.exists()) {
          const chatData = chatSnap.data();
          if (chatData.isPartnerChat) {
            setIsPartnerChat(true);
            if (chatData.workoutId) {
              // Get workout details
              const workoutRef = doc(db, 'workouts', chatData.workoutId);
              const workoutSnap = await getDoc(workoutRef);
              
              if (workoutSnap.exists()) {
                const workoutData = workoutSnap.data();
                setPartnerWorkout({
                  id: chatData.workoutId,
                  name: workoutData.name
                });
              }
            }
          }
        }
      } catch (error) {
        console.error('Error checking partner chat status:', error);
      }
    };
    
    checkPartnerChat();
  }, [userId, user]);
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <Stack.Screen 
        options={{
          headerShown: true,
          title: name || 'Conversation',
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
          headerRight: () => (
            <Avatar.Text 
              size={32} 
              label={(name || 'User').substring(0, 2).toUpperCase()}
              color="white"
              style={{ 
                backgroundColor: Colors[colorScheme ?? 'light'].tint,
                marginRight: 16 
              }}
            />
          )
        }}
      />
      
      {isPartnerChat && partnerWorkout && (
        <View style={{ 
          paddingHorizontal: 16, 
          paddingVertical: 8, 
          backgroundColor: Colors[colorScheme ?? 'light'].background,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(0,0,0,0.1)',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Chip
            icon="dumbbell"
            style={{ 
              backgroundColor: Colors[colorScheme ?? 'light'].tint + '20'
            }}
            onPress={() => {
              router.push({
                pathname: '/(tabs)/workouts',
                params: { selectedWorkoutId: partnerWorkout.id, refreshWorkouts: 'true' }
              });
            }}
          >
            Workout Partners: {partnerWorkout.name}
          </Chip>
        </View>
      )}
      
      {!user ? (
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
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <Text style={{ marginTop: 16, color: Colors[colorScheme ?? 'light'].text }}>
            Loading messages...
          </Text>
        </View>
      ) : (
        <View style={[
          styles.chatBackground,
          { 
            backgroundColor: colorScheme === 'dark' 
              ? 'rgba(18, 18, 18, 1)' 
              : 'rgba(248, 248, 250, 1)' 
          }
        ]}>
          {messages.length === 0 ? (
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
                No messages yet
              </Text>
              <Text style={{ 
                marginTop: 8, 
                color: Colors[colorScheme ?? 'light'].mutedText,
                textAlign: 'center',
                paddingHorizontal: 40
              }}>
                Send a message to start the conversation
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessageItem}
              keyExtractor={(item) => item.id || Math.random().toString()}
              contentContainerStyle={styles.messagesList}
              ItemSeparatorComponent={renderMessageSeparator}
            />
          )}

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
            <Surface style={[
              styles.inputContainer,
              { backgroundColor: Colors[colorScheme ?? 'light'].cardBackground }
            ]}>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: Colors[colorScheme === 'dark' ? 'dark' : 'light'].background,
                    color: Colors[colorScheme ?? 'light'].text
                  }
                ]}
                placeholder="Type a message..."
                placeholderTextColor={Colors[colorScheme ?? 'light'].mutedText}
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  { backgroundColor: Colors[colorScheme ?? 'light'].tint },
                  sending && { opacity: 0.7 }
                ]}
                onPress={handleSendMessage}
                disabled={sending || !inputText.trim()}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="send" size={18} color="white" />
                )}
              </TouchableOpacity>
            </Surface>
          </KeyboardAvoidingView>
        </View>
      )}
      
      {renderReactionPanel()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatBackground: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 16,
  },
  messageContainer: {
    marginVertical: 2,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  theirMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  gradientBubble: {
    borderRadius: 18,
    padding: 12,
    paddingBottom: 8,
  },
  plainBubble: {
    borderRadius: 18,
    padding: 12,
    paddingBottom: 8,
  },
  myMessageBubble: {
    borderTopRightRadius: 4,
  },
  theirMessageBubble: {
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timeText: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 2,
  },
  messageSeparator: {
    height: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    elevation: 4,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  reactionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  reactionPanel: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  reactionPanelHeader: {
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  reactionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  reactionPanelContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    paddingBottom: 32,
  },
  reactionButton: {
    padding: 12,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.05)',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionEmoji: {
    fontSize: 24,
  },
  reactionContainer: {
    backgroundColor: '#f0f2f5',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
    minWidth: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  reactionText: {
    fontSize: 20,
  },
}); 