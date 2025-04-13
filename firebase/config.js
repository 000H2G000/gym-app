import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence, 
  inMemoryPersistence 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDB3OSkb91Nt5ebQ228TED2ScIvvoF1ihI",
  authDomain: "ccursor-gym.firebaseapp.com",
  projectId: "ccursor-gym",
  storageBucket: "ccursor-gym.firebasestorage.app",
  messagingSenderId: "783728244138",
  appId: "1:783728244138:web:e534ee43315e1ab74427d3",
  measurementId: "G-GE704507NL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Configure session persistence
(async function configureAuth() {
  try {
    // For web platforms, set to LOCAL persistence (strongest)
    // For non-web, Firebase handles persistence automatically
    if (Platform.OS === 'web') {
      console.log('Setting Firebase persistence to LOCAL');
      await setPersistence(auth, browserLocalPersistence);
    } else {
      console.log('Native platform detected, using default Firebase persistence');
    }
  } catch (error) {
    console.error('Error setting auth persistence:', error);
  }
})();

export { auth, db }; 