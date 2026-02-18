import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCwUOSlxF864O7QD2KBNQFe1uhZfx8OpnQ",
  authDomain: "communityservicemanageme-c0583.firebaseapp.com",
  databaseURL: "https://communityservicemanageme-c0583-default-rtdb.firebaseio.com",
  projectId: "communityservicemanageme-c0583",
  storageBucket: "communityservicemanageme-c0583.firebasestorage.app",
  messagingSenderId: "898660048379",
  appId: "1:898660048379:web:279f0178edcd0c75d93f5e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const createUsers = async () => {
  const users = [
    { email: 'admin@csms.com', password: 'admin123', role: 'admin', displayName: 'Admin User' },
    { email: 'user@csms.com', password: 'user123', role: 'user', displayName: 'Regular User' }
  ];

  for (const user of users) {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
      
      // Store role in Realtime Database
      await set(ref(db, `users/${userCredential.user.uid}`), {
        uid: userCredential.user.uid,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        createdAt: new Date().toISOString()
      });
      
      console.log(`✅ Created user: ${user.email} with role: ${user.role}`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️ User already exists: ${user.email}`);
      } else {
        console.error(`❌ Error creating ${user.email}:`, error.message);
      }
    }
  }
};

// Run the function
createUsers().then(() => {
  console.log('User creation complete');
  process.exit(0);
}).catch(error => {
  console.error('Error:', error);
  process.exit(1);
});