import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import { getUserRole } from './utils/database';

// Import components
import Login from './components/Login';
import SetupUsers from './components/SetupUsers';
import AdminDashboard from './components/admin/AdminDashboard';
import UserDashboard from './components/user/UserDashboard';
import AdminNavigation from './components/admin/AdminNavigation';
import UserNavigation from './components/user/UserNavigation';
import OffenderProfiling from './components/user/OffenderProfiling';
import AdminOffenderList from './components/admin/AdminOffenderList';
import AdminRecommendedList from './components/admin/AdminRecommendedList';
import AdminInterventions from './components/admin/AdminInterventions';
import AdminReports from './components/admin/AdminReports';
import UserProfile from './components/user/UserProfile';
import LoadingSpinner from './components/common/LoadingSpinner';

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // First check localStorage for hardcoded user
    const checkStoredUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          console.log('Found stored user:', userData);
          setUser({ email: userData.email });
          setUserRole(userData.role);
          setLoading(false);
          return true;
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('user');
        }
      }
      return false;
    };

    // If we have a stored user, don't check Firebase
    if (checkStoredUser()) {
      return;
    }

    // If no stored user, check Firebase auth
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? firebaseUser.email : 'No user');
      
      if (firebaseUser) {
        setUser(firebaseUser);
        // Get user role from database
        const role = await getUserRole(firebaseUser.uid);
        console.log('User role from database:', role);
        setUserRole(role);
      } else {
        setUser(null);
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('user');
    // Sign out from Firebase
    auth.signOut().then(() => {
      console.log('User signed out');
      setUser(null);
      setUserRole(null);
    }).catch((error) => {
      console.error('Error signing out:', error);
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  console.log('Current user:', user);
  console.log('Current role:', userRole);
  console.log('Rendering:', userRole === 'admin' ? 'Admin Dashboard' : 'User Dashboard');

  return (
    <Router>
      {user ? (
        <>
          {userRole === 'admin' ? (
            // Admin Routes
            <>
              <AdminNavigation onLogout={handleLogout} />
              <div style={styles.content}>
                <Routes>
                  <Route path="/dashboard" element={<AdminDashboard />} />
                  <Route path="/offenders" element={<AdminOffenderList />} />
                  <Route path="/recommended" element={<AdminRecommendedList />} />
                  <Route path="/interventions" element={<AdminInterventions />} />
                  <Route path="/reports" element={<AdminReports />} />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
              </div>
            </>
          ) : (
            // User Routes
            <>
              <UserNavigation onLogout={handleLogout} />
              <div style={styles.content}>
                <Routes>
                  <Route path="/dashboard" element={<UserDashboard />} />
                  <Route path="/profiling" element={<OffenderProfiling />} />
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="*" element={<Navigate to="/dashboard" />} />
                </Routes>
              </div>
            </>
          )}
        </>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<SetupUsers />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </Router>
  );
}

const styles = {
  content: {
    padding: '24px',
    minHeight: 'calc(100vh - 64px)',
    backgroundColor: '#f3f4f6'
  }
};

export default App;