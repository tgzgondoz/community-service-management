import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCwUOSlxF864O7QD2KBNQFe1uhZfx8OpnQ",
  authDomain: "communityservicemanageme-c0583.firebaseapp.com",
  databaseURL: "https://communityservicemanageme-c0583-default-rtdb.firebaseio.com",
  projectId: "communityservicemanageme-c0583",
  storageBucket: "communityservicemanageme-c0583.firebasestorage.app",
  messagingSenderId: "898660048379",
  appId: "1:898660048379:web:279f0178edcd0c75d93f5e",
  measurementId: "G-FP66LK7HTX"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);