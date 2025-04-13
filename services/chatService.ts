import { db } from '../firebase/config';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc,
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  onSnapshot,
  updateDoc,
  arrayUnion,
  writeBatch,
  setDoc
} from 'firebase/firestore';

export interface Message {
  id?: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: any;
  read: boolean;
  reaction?: string;
  reactedBy?: string;
}

export interface ChatUser {
  userId: string;
  fullName: string;
  photoURL?: string | null;
  lastActive?: any;
  lastMessage?: string;
  unreadCount?: number;
}

// Helper function to generate a unique chat ID between two users
export const getChatId = (userId1: string, userId2: string): string => {
  // Sort the IDs alphabetically to ensure consistency
  const sortedIds = [userId1, userId2].sort();
  return `${sortedIds[0]}_${sortedIds[1]}`;
};

// Get a list of all users who are using the app
export const getAllUsers = async (currentUserId: string): Promise<ChatUser[]> => {
  console.log("Getting all users for:", currentUserId);
  if (!currentUserId) {
    console.log("No current user ID provided");
    return [];
  }
  
  try {
    // Query all users from the users collection
    const usersQuery = query(collection(db, 'users'));
    const querySnapshot = await getDocs(usersQuery);
    
    const usersMap = new Map<string, ChatUser>();
    
    querySnapshot.forEach(doc => {
      const userData = doc.data();
      const userId = doc.id;
      
      console.log("Found user:", userId, userData.fullName);
      
      // Don't include the current user
      if (userId !== currentUserId) {
        usersMap.set(userId, {
          userId: userId,
          fullName: userData.fullName || 'Anonymous User',
          photoURL: userData.photoURL || null,
          lastActive: userData.lastActive || null
        });
      }
    });
    
    // Convert map to array and sort by name
    const users = Array.from(usersMap.values());
    users.sort((a, b) => a.fullName.localeCompare(b.fullName));
    
    console.log(`Found ${users.length} users for ${currentUserId}`);
    return users;
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

// Send a message from one user to another
export const sendMessage = async (
  senderId: string, 
  receiverId: string, 
  text: string
): Promise<Message> => {
  console.log(`Sending message from ${senderId} to ${receiverId}: ${text}`);
  if (!senderId) {
    console.error("No sender ID provided");
    throw new Error("Sender ID is required");
  }
  
  if (!receiverId) {
    console.error("No receiver ID provided");
    throw new Error("Receiver ID is required");
  }
  
  try {
    const chatId = getChatId(senderId, receiverId);
    const messagesCollection = collection(db, 'chats', chatId, 'messages');
    
    const messageData: Message = {
      senderId,
      receiverId,
      text,
      timestamp: serverTimestamp(),
      read: false
    };
    
    // Add the message to the chat
    const docRef = await addDoc(messagesCollection, messageData);
    console.log(`Message added with ID: ${docRef.id}`);
    
    // Update the last message in the chat metadata
    const chatRef = doc(db, 'chats', chatId);
    const chatDocSnap = await getDoc(chatRef);
    
    if (chatDocSnap.exists()) {
      // Chat already exists, update it
      await updateDoc(chatRef, {
        lastMessage: text,
        lastMessageTimestamp: serverTimestamp(),
        lastMessageSenderId: senderId,
        [`unreadCount_${receiverId}`]: (chatDocSnap.data()[`unreadCount_${receiverId}`] || 0) + 1
      });
    } else {
      // Create a new chat document
      const setDocRef = doc(db, 'chats', chatId);
      await setDoc(setDocRef, {
        participants: [senderId, receiverId],
        lastMessage: text,
        lastMessageTimestamp: serverTimestamp(),
        lastMessageSenderId: senderId,
        [`unreadCount_${receiverId}`]: 1,
        [`unreadCount_${senderId}`]: 0
      });
    }
    
    console.log(`Chat ${chatId} updated with new message`);
    return { ...messageData, id: docRef.id };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Get all messages between two users
export const getMessages = async (userId1: string, userId2: string): Promise<Message[]> => {
  console.log(`Getting messages between ${userId1} and ${userId2}`);
  if (!userId1 || !userId2) {
    console.error("Both user IDs are required");
    return [];
  }
  
  try {
    const chatId = getChatId(userId1, userId2);
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    
    const querySnapshot = await getDocs(messagesQuery);
    
    const messages: Message[] = [];
    querySnapshot.forEach((doc) => {
      const messageData = doc.data();
      
      messages.push({
        id: doc.id,
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        text: messageData.text,
        timestamp: messageData.timestamp,
        read: messageData.read
      });
    });
    
    console.log(`Found ${messages.length} messages between ${userId1} and ${userId2}`);
    return messages;
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
};

// Subscribe to messages between two users
export const subscribeToMessages = (
  userId1: string,
  userId2: string,
  callback: (messages: Message[]) => void
) => {
  console.log(`Subscribing to messages between ${userId1} and ${userId2}`);
  if (!userId1 || !userId2) {
    console.error("Both user IDs are required");
    callback([]);
    return () => {};
  }
  
  const chatId = getChatId(userId1, userId2);
  const messagesQuery = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('timestamp', 'asc')
  );
  
  return onSnapshot(messagesQuery, (snapshot) => {
    const messages: Message[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      messages.push({
        id: doc.id,
        senderId: data.senderId,
        receiverId: data.receiverId,
        text: data.text,
        timestamp: data.timestamp,
        read: data.read,
        reaction: data.reaction || null,
        reactedBy: data.reactedBy || null
      });
    });
    
    console.log(`Received ${messages.length} messages in subscription`);
    callback(messages);
  });
};

// Mark messages as read
export const markMessagesAsRead = async (userId1: string, userId2: string): Promise<void> => {
  console.log(`Marking messages as read for ${userId1} from ${userId2}`);
  if (!userId1 || !userId2) {
    console.error("Both user IDs are required");
    return;
  }
  
  try {
    const currentUserId = userId1;
    const chatId = getChatId(userId1, userId2);
    
    // Get unread messages sent TO the current user
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      where('receiverId', '==', currentUserId),
      where('read', '==', false)
    );
    
    const querySnapshot = await getDocs(messagesQuery);
    console.log(`Found ${querySnapshot.size} unread messages to mark as read`);
    
    // Mark each message as read
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });
    
    // Reset unread count for the current user
    const chatRef = doc(db, 'chats', chatId);
    batch.update(chatRef, {
      [`unreadCount_${currentUserId}`]: 0
    });
    
    await batch.commit();
    console.log("Messages marked as read successfully");
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};

// Get all chats for a user
export const getUserChats = async (userId: string): Promise<any[]> => {
  console.log(`Getting chats for user: ${userId}`);
  if (!userId) {
    console.error("User ID is required");
    return [];
  }
  
  try {
    // Query chats where the user is a participant
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId)
    );
    
    const querySnapshot = await getDocs(chatsQuery);
    console.log(`Found ${querySnapshot.size} chats for user ${userId}`);
    
    const chats: any[] = [];
    
    for (const chatDoc of querySnapshot.docs) {
      const chatData = chatDoc.data();
      const otherUserId = chatData.participants.find((id: string) => id !== userId);
      
      // Get the other user's details
      const userDoc = await getDoc(doc(db, 'users', otherUserId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        chats.push({
          chatId: chatDoc.id,
          otherUserId,
          fullName: userData.fullName || 'Anonymous User',
          photoURL: userData.photoURL,
          lastMessage: chatData.lastMessage,
          lastMessageTimestamp: chatData.lastMessageTimestamp,
          unreadCount: chatData[`unreadCount_${userId}`] || 0,
          isLastMessageFromMe: chatData.lastMessageSenderId === userId
        });
        
        console.log(`Added chat with ${userData.fullName}, unread: ${chatData[`unreadCount_${userId}`] || 0}`);
      } else {
        console.log(`User ${otherUserId} not found`);
      }
    }
    
    // Sort by last message timestamp (most recent first)
    chats.sort((a, b) => {
      if (!a.lastMessageTimestamp) return 1;
      if (!b.lastMessageTimestamp) return -1;
      
      const timeA = a.lastMessageTimestamp.seconds || 0;
      const timeB = b.lastMessageTimestamp.seconds || 0;
      
      return timeB - timeA;
    });
    
    return chats;
  } catch (error) {
    console.error('Error getting user chats:', error);
    return [];
  }
};

// Add a reaction to a message
export const addReactionToMessage = async (
  messageId: string,
  userId: string,
  reaction: string
): Promise<void> => {
  console.log(`Adding reaction ${reaction} to message ${messageId} by user ${userId}`);
  
  try {
    // First, find the chat that contains this message
    // We need to query all chats to find the one with this message
    const chatsRef = collection(db, 'chats');
    const chatsSnapshot = await getDocs(chatsRef);
    
    for (const chatDoc of chatsSnapshot.docs) {
      const chatId = chatDoc.id;
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      
      // Try to get the message doc
      const messageSnap = await getDoc(messageRef);
      
      // If this message exists in this chat
      if (messageSnap.exists()) {
        console.log(`Found message ${messageId} in chat ${chatId}`);
        
        // Update the message with the reaction
        await updateDoc(messageRef, {
          reaction: reaction,
          reactedBy: userId
        });
        
        console.log(`Added reaction successfully`);
        return;
      }
    }
    
    console.error(`Message ${messageId} not found in any chat`);
  } catch (error) {
    console.error('Error adding reaction:', error);
    throw error;
  }
}; 