#!/usr/bin/env node

/**
 * This script seeds the Firestore database with sample payment data
 * for existing users. It will create realistic payment entries
 * to populate the financial reports with test data.
 */

// Firebase setup
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs,
  addDoc,
  query,
  Timestamp,
  serverTimestamp
} = require('firebase/firestore');

// Firebase config - same as your app
const firebaseConfig = {
  apiKey: "AIzaSyDB3OSkb91Nt5ebQ228TED2ScIvvoF1ihI",
  authDomain: "ccursor-gym.firebaseapp.com",
  projectId: "ccursor-gym",
  storageBucket: "ccursor-gym.firebasestorage.app",
  messagingSenderId: "783728244138",
  appId: "1:783728244138:web:e534ee43315e1ab74427d3",
  measurementId: "G-GE704507NL"
};

// Subscription plans with their prices
const subscriptionPlans = [
  { name: 'basic', price: 9.99 },
  { name: 'premium', price: 19.99 },
  { name: 'pro', price: 29.99 }
];

// Payment methods
const paymentMethods = [
  { type: 'credit_card', last4: '4242' },
  { type: 'credit_card', last4: '1234' },
  { type: 'paypal', last4: null },
  { type: 'bank_transfer', last4: '5678' }
];

// Payment types
const paymentTypes = ['subscription', 'one-time'];

// Create a random date within the current year (2025)
const getRandomDateInCurrentYear = () => {
  const year = 2025;
  const month = Math.floor(Math.random() * 5); // Jan to May
  const day = Math.floor(Math.random() * 28) + 1; // 1-28 to avoid month boundary issues
  
  return new Date(year, month, day);
};

// Get a random payment method
const getRandomPaymentMethod = () => {
  const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
  return {
    id: `pm_${Math.random().toString(36).substring(2, 10)}`,
    type: method.type,
    last4: method.last4
  };
};

// Randomly decide if this is a renewal based on metadata
const isRenewal = () => {
  return Math.random() > 0.7; // 30% chance of being a renewal
};

// Main function to seed the database
async function seedPayments() {
  console.log('💰 Seeding payment data...');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Get all users from Firestore
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = [];
    
    usersSnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    if (users.length === 0) {
      console.log('⚠️ No users found in the database. Cannot seed payment data.');
      return;
    }
    
    console.log(`📊 Found ${users.length} users. Generating payment data...`);
    
    // For each user, create 2-8 random payments in 2025
    let totalPayments = 0;
    let paymentsByMonth = [0, 0, 0, 0, 0]; // Jan to May
    
    for (const user of users) {
      // Random number of payments per user
      const numPayments = Math.floor(Math.random() * 7) + 2; // 2-8 payments per user
      
      // Create payments for this user
      for (let i = 0; i < numPayments; i++) {
        // Get random date within current year
        const paymentDate = getRandomDateInCurrentYear();
        const month = paymentDate.getMonth();
        paymentsByMonth[month]++;
        
        // Random payment details
        const planIndex = Math.floor(Math.random() * subscriptionPlans.length);
        const plan = subscriptionPlans[planIndex];
        
        // Determine type (80% subscription, 20% one-time)
        const type = Math.random() > 0.2 ? 'subscription' : 'one-time';
        
        // Random status (90% completed, 5% pending, 5% refunded)
        const statusRandom = Math.random();
        const status = statusRandom > 0.95 ? 'refunded' : 
                      statusRandom > 0.9 ? 'pending' : 'completed';
                      
        // Create the payment data
        const paymentData = {
          userId: user.id,
          amount: plan.price,
          currency: 'USD',
          status: status,
          type: type,
          plan: plan.name,
          createdAt: Timestamp.fromDate(paymentDate),
          paymentMethod: getRandomPaymentMethod(),
          metadata: {
            isRenewal: type === 'subscription' ? isRenewal() : false,
            description: `${type === 'subscription' ? 'Monthly subscription' : 'One-time payment'} - ${plan.name}`
          }
        };
        
        // Add to Firestore
        await addDoc(collection(db, 'payments'), paymentData);
        totalPayments++;
      }
    }
    
    console.log(`✅ Successfully seeded ${totalPayments} payments for ${users.length} users.`);
    console.log(`📊 Payments by month in 2025: 
      January: ${paymentsByMonth[0]}
      February: ${paymentsByMonth[1]}
      March: ${paymentsByMonth[2]}
      April: ${paymentsByMonth[3]}
      May: ${paymentsByMonth[4]}`);
    
  } catch (error) {
    console.error('❌ Error seeding payment data:', error);
  }
}

// Run the seeding function
seedPayments();