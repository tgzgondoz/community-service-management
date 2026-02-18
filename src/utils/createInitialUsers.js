import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { auth, db } from '../config/firebase';

// This function creates initial users in Firebase
export const createInitialUsers = async () => {
  const users = [
    { email: 'admin@csms.com', password: 'admin123', role: 'admin', displayName: 'System Admin' },
    { email: 'user@csms.com', password: 'user123', role: 'user', displayName: 'Probation Officer' }
  ];

  const results = [];

  for (const user of users) {
    try {
      // Try to create the user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
      
      // Set user role and details in Realtime Database
      await set(ref(db, `users/${userCredential.user.uid}`), {
        uid: userCredential.user.uid,
        email: user.email,
        role: user.role,
        displayName: user.displayName,
        createdAt: new Date().toISOString(),
        createdBy: 'system'
      });

      results.push({
        success: true,
        email: user.email,
        role: user.role,
        uid: userCredential.user.uid
      });

      console.log(`✅ User created successfully: ${user.email} (${user.role})`);
    } catch (error) {
      // If user already exists, try to update their role
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️ User already exists: ${user.email}`);
        
        // You would need to sign in to update role, but for now just log
        results.push({
          success: false,
          email: user.email,
          error: 'User already exists',
          message: 'Please delete existing user or use different email'
        });
      } else {
        console.error(`❌ Error creating user ${user.email}:`, error);
        results.push({
          success: false,
          email: user.email,
          error: error.message
        });
      }
    }
  }

  return results;
};

// Function to check if users exist and create them if they don't
export const ensureUsersExist = async () => {
  console.log('Checking if initial users need to be created...');
  const results = await createInitialUsers();
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`\n📊 Summary:`);
  console.log(`✅ Successfully created: ${successCount} users`);
  console.log(`❌ Failed/Existing: ${failCount} users`);
  
  return results;
};

// Function to delete a user (for cleanup if needed)
export const deleteUser = async (uid) => {
  // Note: Deleting users requires Admin SDK or Firebase Console
  // This is just a placeholder
  console.log('To delete users, please use Firebase Console:');
  console.log('1. Go to https://console.firebase.google.com');
  console.log('2. Select your project');
  console.log('3. Go to Authentication > Users');
  console.log('4. Delete the user manually');
};