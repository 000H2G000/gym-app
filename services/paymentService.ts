import { db } from '@/firebase/config';
import { collection, query, where, getDocs, orderBy, addDoc, Timestamp, doc, updateDoc } from 'firebase/firestore';

// Payment interface for representing payment data
export interface Payment {
  id: string;
  userId: string;
  amount: number;
  date: Date;
  status: 'completed' | 'pending' | 'failed' | 'succeeded';
  method: 'manual' | 'credit_card' | 'paypal' | 'bank_transfer';
  description?: string;
  // Additional fields for compatibility with different payment systems
  createdAt?: Date;
  created?: number; // Unix timestamp
  currency?: string;
  type?: string;
  paymentMethod?: {
    id: string;
    type: string;
  };
}

/**
 * Retrieves all payments for admin dashboard
 * @returns An array of all Payment objects
 */
export const getAllPayments = async (): Promise<Payment[]> => {
  try {
    const paymentsRef = collection(db, 'payments');
    const paymentsQuery = query(
      paymentsRef,
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(paymentsQuery);
    
    const payments: Payment[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      payments.push({
        id: doc.id,
        userId: data.userId,
        amount: data.amount,
        date: data.date.toDate(), // Convert Firestore timestamp to Date
        status: data.status,
        method: data.method,
        description: data.description
      });
    });
    
    return payments;
  } catch (error) {
    console.error('Error fetching all payments:', error);
    throw error;
  }
};

/**
 * Retrieves all payments for a specific user
 * @param userId The ID of the user to get payments for
 * @returns An array of Payment objects
 */
export const getUserPayments = async (userId: string): Promise<Payment[]> => {
  try {
    const paymentsRef = collection(db, 'payments');
    
    // First try to query by createdAt field
    const userPaymentsQuery = query(
      paymentsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(userPaymentsQuery);
    
    const payments: Payment[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      payments.push({
        id: doc.id,
        userId: data.userId,
        amount: data.amount,
        date: (data.date || data.createdAt).toDate(), // Handle both fields
        status: data.status,
        method: data.method || data.type, // Handle both fields
        description: data.description,
        // Store the actual timestamp used for sorting
        createdAt: data.createdAt?.toDate() || data.date?.toDate(),
        created: data.created,
        currency: data.currency || 'USD',
        type: data.type || data.method,
        paymentMethod: data.paymentMethod
      });
    });
    
    // Sort payments by date in descending order to ensure consistency
    payments.sort((a, b) => {
      const dateA = a.createdAt || a.date;
      const dateB = b.createdAt || b.date;
      return dateB.getTime() - dateA.getTime();
    });
    
    return payments;
  } catch (error) {
    console.error('Error fetching user payments:', error);
    throw error;
  }
};

/**
 * Process a new payment for a user
 * @param payment The payment to process (without id)
 * @returns The created Payment object with id
 */
export const processPayment = async (payment: Omit<Payment, 'id'>): Promise<Payment> => {
  try {
    // Create a new payment record in Firestore
    const paymentsRef = collection(db, 'payments');
    
    // Create a payment document that works with both payment systems
    const firestorePayment = {
      ...payment,
      // Original payment fields
      date: Timestamp.fromDate(payment.date),
      
      // Add fields needed by userService.getUserPayments:
      createdAt: Timestamp.fromDate(payment.date),
      created: Math.floor(payment.date.getTime() / 1000), // Unix timestamp in seconds
      type: payment.method, // Map method to type for compatibility
      currency: 'USD', // Default currency
      status: payment.status, // Make sure status is included
      paymentMethod: {
        id: payment.method,
        type: payment.method
      }
    };
    
    const docRef = await addDoc(paymentsRef, firestorePayment);
    
    return {
      ...payment,
      id: docRef.id
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};

/**
 * Create a manual payment entry for a user
 * @param userId The ID of the user making the payment
 * @param amount The payment amount
 * @param description Optional description of the payment
 * @returns The created Payment object
 */
export const createManualPayment = async (
  userId: string, 
  amount: number, 
  description?: string
): Promise<Payment> => {
  try {
    // Create a payment object with default values for manual entry
    const payment: Omit<Payment, 'id'> = {
      userId,
      amount,
      date: new Date(),
      status: 'completed',
      method: 'manual',
      description: description || 'Manual payment entry'
    };
    
    // Use existing processPayment function to save to Firestore
    return await processPayment(payment);
  } catch (error) {
    console.error('Error creating manual payment:', error);
    throw error;
  }
};

/**
 * Update payment status
 * @param paymentId The ID of the payment to update
 * @param status The new status
 */
export const updatePaymentStatus = async (
  paymentId: string,
  status: 'completed' | 'pending' | 'failed'
): Promise<void> => {
  try {
    const paymentRef = doc(db, 'payments', paymentId);
    await updateDoc(paymentRef, {
      status
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};