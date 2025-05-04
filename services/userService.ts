import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  updateDoc, 
  where, 
  setDoc, 
  addDoc,
  deleteDoc,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';

// User roles types
export type UserRole = 'user' | 'admin' | 'trainer';

// User subscription status
export type SubscriptionStatus = 'active' | 'expired' | 'trial' | 'canceled';

// User subscription plan
export type SubscriptionPlan = 'basic' | 'premium' | 'pro' | 'none';

// User interface
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  subscription?: {
    plan: SubscriptionPlan;
    status: SubscriptionStatus;
    startDate: Timestamp | Date;
    endDate: Timestamp | Date;
    autoRenew: boolean;
    price: number;
  };
  profile?: {
    age?: number;
    height?: number;
    weight?: number;
    gender?: string;
    location?: string;
    bio?: string;
  };
  paymentMethods?: {
    id: string;
    type: string;
    last4?: string;
    isDefault: boolean;
  }[];
}

// Payment interface
export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string; // 'USD', 'EUR', etc.
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  type: 'subscription' | 'one-time' | 'refund';
  plan?: SubscriptionPlan;
  createdAt: Timestamp | Date;
  paymentMethod: {
    id: string;
    type: string;
    last4?: string;
  };
  metadata?: Record<string, any>;
}

// Financial period for revenue calculations
export interface FinancialPeriod {
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  newSubscriptions: number;
  renewals: number;
  cancellations: number;
  refunds: number;
  netGrowth: number;
}

/**
 * Create or update a user in Firestore
 */
export const saveUser = async (user: Partial<User> & { uid: string }): Promise<void> => {
  const userRef = doc(db, 'users', user.uid);
  const userSnapshot = await getDoc(userRef);
  
  if (!userSnapshot.exists()) {
    // Create new user
    await setDoc(userRef, {
      ...user,
      role: user.role || 'user',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } else {
    // Update existing user
    await updateDoc(userRef, {
      ...user,
      updatedAt: serverTimestamp()
    });
  }
};

/**
 * Get a user by ID
 */
export const getUserById = async (uid: string): Promise<User | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnapshot = await getDoc(userRef);
    
    if (userSnapshot.exists()) {
      return { uid, ...userSnapshot.data() } as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting user:', error);
    throw error;
  }
};

/**
 * Check if a user is an admin
 */
export const isUserAdmin = async (uid: string): Promise<boolean> => {
  const user = await getUserById(uid);
  return user?.role === 'admin';
};

/**
 * Get all users (admin only)
 */
export const getAllUsers = async (
  lastUser: User | null = null, 
  limitCount: number = 20
): Promise<User[]> => {
  try {
    let usersQuery;
    
    if (lastUser) {
      usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        startAfter(lastUser.createdAt),
        limit(limitCount)
      );
    } else {
      usersQuery = query(
        collection(db, 'users'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }
    
    const usersSnapshot = await getDocs(usersQuery);
    const users: User[] = [];
    
    usersSnapshot.forEach((doc) => {
      users.push({ uid: doc.id, ...doc.data() } as User);
    });
    
    return users;
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
};

/**
 * Update user role (admin only)
 */
export const updateUserRole = async (uid: string, role: UserRole): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      role,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};

/**
 * Update user subscription
 */
export const updateUserSubscription = async (
  uid: string, 
  subscription: User['subscription']
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      subscription,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
};

/**
 * Add a payment
 */
export const addPayment = async (payment: Omit<Payment, 'id'>): Promise<string> => {
  try {
    const paymentRef = await addDoc(collection(db, 'payments'), {
      ...payment,
      createdAt: serverTimestamp()
    });
    return paymentRef.id;
  } catch (error) {
    console.error('Error adding payment:', error);
    throw error;
  }
};

/**
 * Get payments for a user
 */
export const getUserPayments = async (userId: string): Promise<Payment[]> => {
  try {
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const paymentsSnapshot = await getDocs(paymentsQuery);
    const payments: Payment[] = [];
    
    paymentsSnapshot.forEach((doc) => {
      const data = doc.data();
      // Handle both type and method fields for backward compatibility
      const paymentData = {
        id: doc.id,
        ...data,
        // Ensure type field exists (use method as fallback)
        type: data.type || data.method || 'one-time',
        // Ensure currency field exists
        currency: data.currency || 'USD',
        // Ensure paymentMethod field is structured correctly
        paymentMethod: data.paymentMethod || {
          id: 'manual',
          type: 'manual'
        }
      } as Payment;
      
      payments.push(paymentData);
    });
    
    // Log for debugging
    console.log(`Fetched ${payments.length} payments for user ${userId}`);
    
    return payments;
  } catch (error) {
    console.error('Error getting user payments:', error);
    throw error;
  }
};

/**
 * Get all payments (admin only)
 */
export const getAllPayments = async (
  lastPayment: Payment | null = null,
  limitCount: number = 20
): Promise<Payment[]> => {
  try {
    let paymentsQuery;
    
    if (lastPayment) {
      paymentsQuery = query(
        collection(db, 'payments'),
        orderBy('createdAt', 'desc'),
        startAfter(lastPayment.createdAt),
        limit(limitCount)
      );
    } else {
      paymentsQuery = query(
        collection(db, 'payments'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
    }
    
    const paymentsSnapshot = await getDocs(paymentsQuery);
    const payments: Payment[] = [];
    
    paymentsSnapshot.forEach((doc) => {
      const data = doc.data();
      // Normalize payment data to handle different formats
      const paymentData = {
        id: doc.id,
        ...data,
        // Ensure type field exists (use method as fallback)
        type: data.type || data.method || 'one-time',
        // Ensure currency field exists
        currency: data.currency || 'USD',
        // Ensure status field exists
        status: data.status || 'completed',
        // Ensure amount is a number
        amount: typeof data.amount === 'number' ? data.amount : parseFloat(data.amount) || 0,
        // Ensure paymentMethod field is structured correctly
        paymentMethod: data.paymentMethod || {
          id: 'manual',
          type: 'manual'
        }
      } as Payment;
      
      payments.push(paymentData);
    });
    
    return payments;
  } catch (error) {
    console.error('Error getting payments:', error);
    throw error;
  }
};

/**
 * Get payments for a specific time period (admin only)
 */
export const getPaymentsByPeriod = async (startDate: Date, endDate: Date): Promise<Payment[]> => {
  try {
    const startTimestamp = Timestamp.fromDate(startDate);
    const endTimestamp = Timestamp.fromDate(endDate);
    
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('createdAt', '>=', startTimestamp),
      where('createdAt', '<=', endTimestamp),
      orderBy('createdAt', 'desc')
    );
    
    const paymentsSnapshot = await getDocs(paymentsQuery);
    const payments: Payment[] = [];
    
    paymentsSnapshot.forEach((doc) => {
      const data = doc.data();
      // Normalize payment data to handle legacy and current formats
      const paymentData = {
        id: doc.id,
        ...data,
        // Ensure type field exists (use method as fallback)
        type: data.type || data.method || 'one-time',
        // Ensure currency field exists
        currency: data.currency || 'USD',
        // Ensure status field exists
        status: data.status || 'completed',
        // Ensure amount is a number
        amount: typeof data.amount === 'number' ? data.amount : parseFloat(data.amount) || 0,
        // Ensure paymentMethod field is structured correctly
        paymentMethod: data.paymentMethod || {
          id: 'manual',
          type: 'manual'
        }
      } as Payment;
      
      payments.push(paymentData);
    });
    
    // Log for debugging
    console.log(`Fetched ${payments.length} payments for period ${startDate.toDateString()} to ${endDate.toDateString()}`);
    
    return payments;
  } catch (error) {
    console.error('Error getting payments by period:', error);
    throw error;
  }
};

/**
 * Calculate revenue for a specific time period (admin only)
 */
export const calculateRevenue = async (startDate: Date, endDate: Date): Promise<FinancialPeriod> => {
  try {
    // Get all payments for the period
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('createdAt', '>=', Timestamp.fromDate(startDate)),
      where('createdAt', '<=', Timestamp.fromDate(endDate)),
      orderBy('createdAt', 'desc')
    );
    
    const paymentsSnapshot = await getDocs(paymentsQuery);
    console.log(`Found ${paymentsSnapshot.size} payments in period ${startDate.toDateString()} to ${endDate.toDateString()}`);
    
    // Initialize counters
    let totalRevenue = 0;
    let newSubscriptions = 0;
    let renewals = 0;
    let cancellations = 0;
    let refunds = 0;
    
    // Process each payment and categorize properly
    paymentsSnapshot.forEach((doc) => {
      const data = doc.data();
      
      // Normalize payment data
      const paymentType = data.type || data.method || 'one-time';
      const paymentStatus = data.status || 'completed';
      const metadata = data.metadata || {};
      
      // Convert amount to number, default to 0 if invalid
      const amountStr = data.amount?.toString() || '0';
      const amount = parseFloat(amountStr);
      
      if (isNaN(amount)) {
        console.warn(`Invalid amount for payment ${doc.id}: ${data.amount}`);
        return;
      }
      
      // Process based on payment type and status
      if (paymentStatus === 'refunded') {
        refunds++;
        totalRevenue -= amount; // Subtract refunds from revenue
      } else if (paymentStatus === 'completed') {
        if (paymentType === 'subscription') {
          if (metadata.isRenewal) {
            renewals++;
          } else {
            newSubscriptions++;
          }
          totalRevenue += amount;
        } else if (paymentType === 'one-time') {
          totalRevenue += amount;
        } else if (paymentType === 'cancellation') {
          cancellations++;
        }
      }
      
      console.log(`Payment ${doc.id}: Amount=${amount}, Type=${paymentType}, Status=${paymentStatus}`);
    });
    
    // Calculate net growth
    const netGrowth = newSubscriptions + renewals - cancellations - refunds;
    
    // Create result object
    const result = {
      startDate,
      endDate,
      totalRevenue,
      newSubscriptions,
      renewals,
      cancellations,
      refunds,
      netGrowth
    };
    
    console.log('Financial calculation result:', result);
    
    return result;
  } catch (error) {
    console.error('Error calculating revenue:', error);
    console.error(error);
    
    // Return a default object with zeros in case of error
    return {
      startDate,
      endDate,
      totalRevenue: 0,
      newSubscriptions: 0,
      renewals: 0, 
      cancellations: 0,
      refunds: 0,
      netGrowth: 0
    };
  }
};

/**
 * Get monthly financial reports for a year (admin only)
 */
export const getMonthlyReports = async (year: number): Promise<FinancialPeriod[]> => {
  const reports: FinancialPeriod[] = [];
  
  for (let month = 0; month < 12; month++) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // Last day of month
    
    const report = await calculateRevenue(startDate, endDate);
    reports.push(report);
  }
  
  return reports;
};

/**
 * Add payment method to user
 */
export const addPaymentMethod = async (
  userId: string, 
  paymentMethod: User['paymentMethods'][0]
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const paymentMethods = userData.paymentMethods || [];
    
    // If this is set as default, clear other defaults
    if (paymentMethod.isDefault) {
      paymentMethods.forEach(pm => {
        pm.isDefault = false;
      });
    }
    
    paymentMethods.push(paymentMethod);
    
    await updateDoc(userRef, {
      paymentMethods,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    throw error;
  }
};

/**
 * Remove payment method from user
 */
export const removePaymentMethod = async (
  userId: string, 
  paymentMethodId: string
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const paymentMethods = userData.paymentMethods || [];
    
    const updatedPaymentMethods = paymentMethods.filter(
      pm => pm.id !== paymentMethodId
    );
    
    await updateDoc(userRef, {
      paymentMethods: updatedPaymentMethods,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error removing payment method:', error);
    throw error;
  }
};

/**
 * Search users (admin only)
 */
export const searchUsers = async (searchTerm: string): Promise<User[]> => {
  try {
    // In a production app, you would implement a proper search index
    // This is a simple implementation that searches by displayName
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users: User[] = [];
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data() as Omit<User, 'uid'>;
      
      // Simple client-side search
      if (
        userData.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userData.email?.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        users.push({ uid: doc.id, ...userData } as User);
      }
    });
    
    return users;
  } catch (error) {
    console.error('Error searching users:', error);
    throw error;
  }
};