// Script to set a user as admin by email
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc, doc } = require('firebase/firestore');

// Load Firebase config
const firebaseConfig = require('../firebase/config').default;

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setUserAsAdmin(email) {
  try {
    // Find user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error(`No user found with email: ${email}`);
      process.exit(1);
    }
    
    // Get the first matching user
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    
    // Update user role to admin
    await updateDoc(doc(db, 'users', userId), {
      role: 'admin',
      updatedAt: new Date()
    });
    
    console.log(`User ${email} (ID: ${userId}) has been set as admin!`);
    process.exit(0);
  } catch (error) {
    console.error('Error setting admin role:', error);
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address: node set-admin.js your-email@example.com');
  process.exit(1);
}

setUserAsAdmin(email);