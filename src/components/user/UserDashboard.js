import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOffenders } from '../../utils/database';
import { auth } from '../../config/firebase';
import LoadingSpinner from '../common/LoadingSpinner';

const UserDashboard = () => {
  const [userStats, setUserStats] = useState({
    totalProfiled: 0,
    recommended: 0,
    pending: 0,
    notRecommended: 0
  });
  const [recentProfiles, setRecentProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const initializeData = async () => {
      // Get user email first
      const email = await getUserEmail();
      setUserEmail(email);
      
      // Then fetch data with the email
      await fetchUserData(email);
    };

    initializeData();
  }, []); // Empty dependency array - runs once on mount

  const getUserEmail = () => {
    return new Promise((resolve) => {
      // Check Firebase first
      if (auth.currentUser) {
        resolve(auth.currentUser.email);
        return;
      }

      // Check localStorage
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          resolve(userData.email);
          return;
        } catch (error) {
          console.error('Error parsing stored user:', error);
        }
      }

      // Fallback for testing - use a default email if none found
      console.warn('No user email found, using default for testing');
      resolve('probation.officer@example.com');
    });
  };

  const fetchUserData = async (email) => {
    setLoading(true);
    try {
      console.log('Fetching data for user email:', email);
      
      // Get all offenders
      const allOffenders = await getOffenders();
      console.log('Total offenders in database:', allOffenders.length);
      
      // Filter offenders created by this user
      // Check both vettedBy and createdBy fields to be safe
      const userOffenders = allOffenders.filter(o => {
        const matches = (
          o.vettedBy === email || 
          o.createdBy === email || 
          o.vettedBy === auth.currentUser?.email ||
          (o.vettedBy && o.vettedBy.toLowerCase() === email?.toLowerCase())
        );
        if (matches) {
          console.log('Found matching offender:', o.firstName, o.lastName, 'vettedBy:', o.vettedBy);
        }
        return matches;
      });
      
      console.log('User offenders found:', userOffenders.length);

      // Calculate stats
      const recommended = userOffenders.filter(o => o.recommendedForCS === true).length;
      const notRecommended = userOffenders.filter(o => o.recommendedForCS === false).length;
      const pending = userOffenders.filter(o => o.status === 'pending').length;

      console.log('Stats:', {
        total: userOffenders.length,
        recommended,
        notRecommended,
        pending
      });

      setUserStats({
        totalProfiled: userOffenders.length,
        recommended: recommended,
        notRecommended: notRecommended,
        pending: pending
      });

      // Sort by createdAt date (newest first) and take first 5
      const sorted = [...userOffenders].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      }).slice(0, 5);
      
      setRecentProfiles(sorted);
      
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    fetchUserData(userEmail);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Welcome, {userEmail || 'User'}</h1>
        <button onClick={handleRefresh} style={styles.refreshButton}>
          🔄 Refresh
        </button>
      </div>

      {userStats.totalProfiled === 0 && (
        <div style={styles.infoMessage}>
          <p>You haven't created any offender profiles yet.</p>
          <p>Click the button below to create your first profile.</p>
        </div>
      )}

      <div style={styles.statsGrid}>
        <div style={{...styles.statCard, backgroundColor: '#2196f3'}}>
          <p style={styles.statLabel}>Total Profiles Created</p>
          <p style={styles.statValue}>{userStats.totalProfiled}</p>
        </div>
        <div style={{...styles.statCard, backgroundColor: '#4caf50'}}>
          <p style={styles.statLabel}>Recommended (#4)</p>
          <p style={styles.statValue}>{userStats.recommended}</p>
        </div>
        <div style={{...styles.statCard, backgroundColor: '#ff9800'}}>
          <p style={styles.statLabel}>Not Recommended (#3)</p>
          <p style={styles.statValue}>{userStats.notRecommended}</p>
        </div>
        <div style={{...styles.statCard, backgroundColor: '#9c27b0'}}>
          <p style={styles.statLabel}>Pending Review</p>
          <p style={styles.statValue}>{userStats.pending}</p>
        </div>
      </div>

      <div style={styles.quickActions}>
        <h2 style={styles.sectionTitle}>Quick Actions</h2>
        <div style={styles.actionButtons}>
          <button 
            style={styles.actionButton}
            onClick={() => navigate('/profiling')}
          >
            <span style={styles.actionIcon}>➕</span>
            Create New Offender Profile (#9)
          </button>
          <button 
            style={styles.actionButton}
            onClick={() => navigate('/profile')}
          >
            <span style={styles.actionIcon}>👤</span>
            View My Profile
          </button>
        </div>
      </div>

      {recentProfiles.length > 0 ? (
        <div style={styles.recentProfiles}>
          <h2 style={styles.sectionTitle}>Your Recent Profiles</h2>
          <div style={styles.profileList}>
            {recentProfiles.map(profile => (
              <div key={profile.id} style={styles.profileCard}>
                <div style={styles.profileHeader}>
                  <span style={styles.profileName}>
                    {profile.firstName} {profile.lastName}
                  </span>
                  <span style={{
                    ...styles.profileStatus,
                    backgroundColor: profile.recommendedForCS ? '#4caf50' : '#ff9800'
                  }}>
                    {profile.recommendedForCS ? 'Recommended' : 'Not Recommended'}
                  </span>
                </div>
                <p style={styles.profileDetail}>Offense: {profile.offenseType || 'N/A'}</p>
                <p style={styles.profileDetail}>Risk Level: {profile.riskLevel || 'N/A'}</p>
                <p style={styles.profileDetail}>
                  Status: <span style={{
                    color: profile.status === 'completed' ? '#4caf50' :
                           profile.status === 'defaulted' ? '#f44336' : '#ff9800'
                  }}>{profile.status || 'pending'}</span>
                </p>
                <p style={styles.profileDate}>
                  Created: {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={styles.emptyState}>
          <p>No profiles created yet. Click "Create New Offender Profile" to get started.</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '28px',
    color: '#1f2937',
    margin: 0
  },
  refreshButton: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#4b5563',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  infoMessage: {
    backgroundColor: '#e3f2fd',
    border: '1px solid #90caf9',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '30px',
    textAlign: 'center',
    color: '#0d47a1'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  },
  statCard: {
    padding: '20px',
    borderRadius: '12px',
    color: 'white',
    textAlign: 'center',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  statLabel: {
    fontSize: '16px',
    marginBottom: '10px',
    opacity: 0.9
  },
  statValue: {
    fontSize: '36px',
    fontWeight: 'bold',
    margin: 0
  },
  quickActions: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '30px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    fontSize: '20px',
    color: '#1f2937',
    marginTop: 0,
    marginBottom: '20px'
  },
  actionButtons: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap'
  },
  actionButton: {
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background-color 0.2s'
  },
  actionIcon: {
    fontSize: '20px'
  },
  recentProfiles: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  profileList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px'
  },
  profileCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e5e7eb'
  },
  profileHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  profileName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937'
  },
  profileStatus: {
    fontSize: '12px',
    padding: '4px 8px',
    borderRadius: '12px',
    color: 'white'
  },
  profileDetail: {
    margin: '4px 0',
    color: '#4b5563',
    fontSize: '14px'
  },
  profileDate: {
    marginTop: '8px',
    color: '#6b7280',
    fontSize: '12px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '12px',
    color: '#6b7280',
    border: '2px dashed #e5e7eb'
  }
};

export default UserDashboard;