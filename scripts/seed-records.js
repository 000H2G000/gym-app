#!/usr/bin/env node

/**
 * This script seeds the Firestore database with sample personal records data
 * for existing users. It will create realistic personal records entries
 * to populate the leaderboard with real user data.
 */

// Firebase setup
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  addDoc,
  query,
  where,
  deleteDoc
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

// Common lifting exercises
const liftingExercises = [
  'Bench Press',
  'Squat',
  'Deadlift',
  'Overhead Press',
  'Barbell Row',
  'Pull-Up',
  'Push-Up',
  'Dip',
  'Chin-Up',
  'Power Clean'
];

// Generate a random weight within a realistic range
const getRandomWeight = (exercise) => {
  let baseWeight;
  let variation;
  
  switch (exercise) {
    case 'Bench Press':
      baseWeight = 185;
      variation = 75;
      break;
    case 'Squat':
      baseWeight = 225;
      variation = 100;
      break;
    case 'Deadlift':
      baseWeight = 275;
      variation = 125;
      break;
    case 'Overhead Press':
      baseWeight = 115;
      variation = 50;
      break;
    case 'Barbell Row':
      baseWeight = 155;
      variation = 65;
      break;
    case 'Pull-Up':
      baseWeight = 12; // Reps with bodyweight
      variation = 8;
      break;
    case 'Push-Up':
      baseWeight = 25; // Reps
      variation = 15;
      break;
    case 'Dip':
      baseWeight = 15; // Reps with bodyweight
      variation = 10;
      break;
    case 'Chin-Up':
      baseWeight = 10; // Reps with bodyweight
      variation = 8;
      break;
    case 'Power Clean':
      baseWeight = 155;
      variation = 70;
      break;
    default:
      baseWeight = 100;
      variation = 50;
  }
  
  // Random weight with some variation
  return Math.round(baseWeight + (Math.random() * 2 - 1) * variation);
};

// Generate a date within the last 6 months
const getRandomRecentDate = () => {
  const today = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(today.getMonth() - 6);
  
  const randomTimestamp = sixMonthsAgo.getTime() + Math.random() * (today.getTime() - sixMonthsAgo.getTime());
  const date = new Date(randomTimestamp);
  
  return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
};

// Generate random unit (lb or kg)
const getRandomUnit = () => {
  return Math.random() > 0.2 ? 'lb' : 'kg'; // 80% chance of lb
};

// Main function to seed the database
async function seedPersonalRecords() {
  console.log('🏋️‍♂️ Seeding personal records...');
  
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
      console.log('⚠️ No users found in the database. Cannot seed personal records.');
      return;
    }
    
    console.log(`📊 Found ${users.length} users. Generating personal records...`);
    
    // First, clear existing personal records
    const existingRecordsSnapshot = await getDocs(collection(db, 'personalRecords'));
    let deletedCount = 0;
    
    for (const doc of existingRecordsSnapshot.docs) {
      await deleteDoc(doc.ref);
      deletedCount++;
    }
    
    console.log(`🗑️ Cleared ${deletedCount} existing personal records.`);
    
    // For each user, create 3-7 random personal records
    let totalRecords = 0;
    
    for (const user of users) {
      // Random number of records per user (3-7)
      const numRecords = Math.floor(Math.random() * 5) + 3;
      
      // Create a set to ensure no duplicate exercises for this user
      const userExercises = new Set();
      
      // Create records for this user
      for (let i = 0; i < numRecords; i++) {
        // Randomly select an exercise that hasn't been used for this user yet
        let exercise;
        do {
          exercise = liftingExercises[Math.floor(Math.random() * liftingExercises.length)];
        } while (userExercises.has(exercise) && userExercises.size < liftingExercises.length);
        
        // If we've used all exercises, break
        if (userExercises.has(exercise)) {
          break;
        }
        
        userExercises.add(exercise);
        
        // Create the personal record data
        const recordData = {
          userId: user.id,
          lift: exercise,
          weight: getRandomWeight(exercise),
          unit: getRandomUnit(),
          date: getRandomRecentDate()
        };
        
        // Add to Firestore
        await addDoc(collection(db, 'personalRecords'), recordData);
        totalRecords++;
      }
    }
    
    console.log(`✅ Successfully seeded ${totalRecords} personal records for ${users.length} users.`);
    
  } catch (error) {
    console.error('❌ Error seeding personal records:', error);
  }
}

// Run the seeding function
seedPersonalRecords();