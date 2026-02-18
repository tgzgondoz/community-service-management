import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOffendersByRecommendation, getOffenderById } from '../../utils/database';
import { auth } from '../../config/firebase';
import LoadingSpinner from '../common/LoadingSpinner';

const UserDashboard = () => {
  const [userStats, setUserStats] = useState({
    totalProfiled: 0,
    recommended: 0,
    pending: 0
  });
  const [recentProfiles, setRecentProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      // Get offenders created by this user
      // Note: You'll need to modify getOffenders to filter by vettedBy
      const allOffenders = await getOffendersByRecommendation(true);
      const userOffenders = allOffenders.filter(o => o.vettedBy === auth.currentUser?.email);
      
      setUserStats({
        totalProfiled: userOffenders.length,
        recommended: userOffenders.filter(o => o.recommendedForCS).length,
        pending: userOffenders.filter(o => o.status === 'pending').length
      });

      setRecentProfiles(userOffenders.slice(0, 5));
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Welcome, {auth.currentUser?.email}</h1>

      <div style={styles.statsGrid}>
        <div style={{...styles.statCard, backgroundColor: '#2196f3'}}>
          <p style={styles.statLabel}>Total Profiles Created</p>
          <p style={styles.statValue}>{userStats.totalProfiled}</p>
        </div>
        <div style={{...styles.statCard, backgroundColor: '#4caf50'}}>
          <p style={styles.statLabel}>Recommended</p>
          <p style={styles.statValue}>{userStats.recommended}</p>
        </div>
        <div style={{...styles.statCard, backgroundColor: '#ff9800'}}>
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
            Create New Offender Profile
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

      {recentProfiles.length > 0 && (
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
                    {profile.recommendedForCS ? 'Recommended' : 'Pending'}
                  </span>
                </div>
                <p style={styles.profileDetail}>Offense: {profile.offenseType}</p>
                <p style={styles.profileDetail}>Risk Level: {profile.riskLevel}</p>
                <p style={styles.profileDate}>
                  Created: {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  },
  title: {
    fontSize: '28px',
    color: '#1f2937',
    marginBottom: '30px'
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
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#1565c0'
    }
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
  }
};

export default UserDashboard;