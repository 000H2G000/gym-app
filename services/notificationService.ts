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
  updateDoc,
  deleteDoc,
  onSnapshot,
  setDoc
} from 'firebase/firestore';
import { getChatId } from './chatService';

export interface Notification {
  id?: string;
  type: 'partner_request' | 'message' | 'system';
  senderId: string;
  senderName?: string;
  recipientId: string;
  status: 'pending' | 'accepted' | 'declined' | 'read';
  createdAt: any;
  updatedAt: any;
  workoutId?: string;
  workoutName?: string;
  day?: string;
  message?: string;
}

// Create a new notification
export const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const notificationData = {
      ...notification,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'notifications'), notificationData);
    console.log(`Created notification with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Send a partner request notification
export const sendPartnerRequest = async (
  senderId: string,
  recipientId: string,
  workoutId: string,
  workoutName: string,
  day: string
): Promise<string> => {
  try {
    // Get sender user data for display name
    const senderDoc = await getDoc(doc(db, 'users', senderId));
    const senderName = senderDoc.exists() ? senderDoc.data().fullName || 'Gym User' : 'Gym User';
    
    // Check if request already exists
    const existingQuery = query(
      collection(db, 'notifications'),
      where('type', '==', 'partner_request'),
      where('senderId', '==', senderId),
      where('recipientId', '==', recipientId),
      where('workoutId', '==', workoutId),
      where('status', '==', 'pending')
    );
    
    const querySnapshot = await getDocs(existingQuery);
    
    // If request already exists, return its ID
    if (!querySnapshot.empty) {
      console.log('Partner request already exists');
      return querySnapshot.docs[0].id;
    }
    
    // Create a new partner request notification
    const notificationId = await createNotification({
      type: 'partner_request',
      senderId,
      senderName,
      recipientId,
      status: 'pending',
      workoutId,
      workoutName,
      day,
      message: 'Would like to be your gym partner for this workout'
    });
    
    return notificationId;
  } catch (error) {
    console.error('Error sending partner request:', error);
    throw error;
  }
};

// Get notifications for a user
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(notificationsQuery);
    
    const notifications: Notification[] = [];
    querySnapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() } as Notification);
    });
    
    return notifications;
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

// Subscribe to user notifications
export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
) => {
  if (!userId) {
    console.error("User ID is required for notification subscription");
    callback([]);
    return () => {};
  }
  
  const notificationsQuery = query(
    collection(db, 'notifications'),
    where('recipientId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(notificationsQuery, (snapshot) => {
    const notifications: Notification[] = [];
    snapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() } as Notification);
    });
    
    console.log(`Received ${notifications.length} notifications in subscription`);
    callback(notifications);
  });
};

// Update notification status
export const updateNotificationStatus = async (notificationId: string, status: 'accepted' | 'declined' | 'read'): Promise<void> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      status,
      updatedAt: serverTimestamp()
    });
    
    console.log(`Updated notification ${notificationId} status to ${status}`);
  } catch (error) {
    console.error('Error updating notification status:', error);
    throw error;
  }
};

// Accept a partner request and start a chat
export const acceptPartnerRequest = async (notificationId: string): Promise<void> => {
  try {
    // Get notification details
    const notificationRef = doc(db, 'notifications', notificationId);
    const notificationSnap = await getDoc(notificationRef);
    
    if (!notificationSnap.exists()) {
      throw new Error('Notification not found');
    }
    
    const notification = notificationSnap.data() as Notification;
    
    if (notification.type !== 'partner_request') {
      throw new Error('Notification is not a partner request');
    }
    
    // Update notification status
    await updateNotificationStatus(notificationId, 'accepted');
    
    // Create or update chat document to show connection
    const chatId = getChatId(notification.senderId, notification.recipientId);
    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    
    if (!chatSnap.exists()) {
      // Initialize chat document between the two users
      await setDoc(chatRef, {
        participants: [notification.senderId, notification.recipientId],
        lastMessage: `Partner request for "${notification.workoutName}" accepted!`,
        lastMessageTimestamp: serverTimestamp(),
        lastMessageSenderId: 'system',
        isPartnerChat: true,
        workoutId: notification.workoutId,
        [`unreadCount_${notification.senderId}`]: 1,
        [`unreadCount_${notification.recipientId}`]: 0
      });
    }
  } catch (error) {
    console.error('Error accepting partner request:', error);
    throw error;
  }
};

// Delete a notification
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
    console.log(`Deleted notification ${notificationId}`);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

// Get unread notification count
export const getUnreadNotificationCount = async (userId: string): Promise<number> => {
  try {
    const unreadQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      where('status', 'in', ['pending'])
    );
    
    const querySnapshot = await getDocs(unreadQuery);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    throw error;
  }
}; 