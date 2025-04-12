import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

export { auth, db }; 