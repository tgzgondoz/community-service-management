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
    notRecommended: 0,
    active: 0,
    completed: 0
  });
  const [recentProfiles, setRecentProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [greeting, setGreeting] = useState('');
  const [showWelcome, setShowWelcome] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    const initializeData = async () => {
      // Get user email first
      const email = await getUserEmail();
      setUserEmail(email);
      setUserName(email ? email.split('@')[0] : 'User');
      
      // Then fetch data with the email
      await fetchUserData(email);
    };

    initializeData();

    // Auto-hide welcome message after 5 seconds
    const timer = setTimeout(() => setShowWelcome(false), 5000);
    return () => clearTimeout(timer);
  }, []);

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
      const active = userOffenders.filter(o => o.status === 'active').length;
      const completed = userOffenders.filter(o => o.status === 'completed').length;

      console.log('Stats:', {
        total: userOffenders.length,
        recommended,
        notRecommended,
        pending,
        active,
        completed
      });

      setUserStats({
        totalProfiled: userOffenders.length,
        recommended: recommended,
        notRecommended: notRecommended,
        pending: pending,
        active: active,
        completed: completed
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

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'High': return '#f44336';
      case 'Medium': return '#FF9800';
      case 'Low': return '#4CAF50';
      default: return '#999999';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'active': return '#2196F3';
      case 'defaulted': return '#f44336';
      case 'pending': return '#FF9800';
      default: return '#999999';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={styles.container}>
      {/* Welcome Banner */}
      {showWelcome && (
        <div style={styles.welcomeBanner}>
          <span style={styles.welcomeIcon}>👋</span>
          <div style={styles.welcomeContent}>
            <h3 style={styles.welcomeTitle}>
              {greeting}, {userName}!
            </h3>
            <p style={styles.welcomeText}>
              Welcome to your dashboard. Here's what's happening with your cases today.
            </p>
          </div>
          <button 
            style={styles.welcomeClose}
            onClick={() => setShowWelcome(false)}
          >
            ×
          </button>
        </div>
      )}

      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>User Dashboard</h1>
          <p style={styles.subtitle}>
            {userEmail || 'Loading...'}
          </p>
        </div>
        <button onClick={handleRefresh} style={styles.refreshButton}>
          <span style={styles.refreshIcon}>🔄</span>
          <span style={styles.refreshText}>Refresh</span>
        </button>
      </div>

      {userStats.totalProfiled === 0 && (
        <div style={styles.infoMessage}>
          <span style={styles.infoIcon}>ℹ️</span>
          <div style={styles.infoContent}>
            <p style={styles.infoTitle}>Welcome to your dashboard!</p>
            <p style={styles.infoText}>
              You haven't created any offender profiles yet. Click the button below to create your first profile and start tracking cases.
            </p>
          </div>
        </div>
      )}

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📋</div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Total Profiles</p>
            <p style={styles.statValue}>{userStats.totalProfiled}</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>✅</div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Recommended (#4)</p>
            <p style={styles.statValue}>{userStats.recommended}</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>❌</div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Not Recommended (#3)</p>
            <p style={styles.statValue}>{userStats.notRecommended}</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>⏳</div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Pending Review</p>
            <p style={styles.statValue}>{userStats.pending}</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📊</div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Active Cases</p>
            <p style={styles.statValue}>{userStats.active}</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>🎉</div>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Completed</p>
            <p style={styles.statValue}>{userStats.completed}</p>
          </div>
        </div>
      </div>

      <div style={styles.quickActions}>
        <h2 style={styles.sectionTitle}>Quick Actions</h2>
        <div style={styles.actionButtons}>
          <button 
            style={styles.primaryActionButton}
            onClick={() => navigate('/profiling')}
          >
            <span style={styles.actionIcon}>➕</span>
            <span style={styles.actionText}>Create New Offender Profile (#9)</span>
          </button>
          <button 
            style={styles.secondaryActionButton}
            onClick={() => navigate('/profile')}
          >
            <span style={styles.actionIcon}>👤</span>
            <span style={styles.actionText}>View My Profile</span>
          </button>
        </div>
      </div>

      {recentProfiles.length > 0 ? (
        <div style={styles.recentProfiles}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Your Recent Profiles</h2>
            <button 
              style={styles.viewAllButton}
              onClick={() => navigate('/profiles')}
            >
              View All →
            </button>
          </div>
          
          <div style={styles.profileList}>
            {recentProfiles.map(profile => (
              <div key={profile.id} style={styles.profileCard}>
                <div style={styles.profileHeader}>
                  <div style={styles.profileAvatar}>
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </div>
                  <div style={styles.profileInfo}>
                    <span style={styles.profileName}>
                      {profile.firstName} {profile.lastName}
                    </span>
                    <span style={{
                      ...styles.profileStatus,
                      backgroundColor: profile.recommendedForCS ? '#4CAF50' : '#f44336'
                    }}>
                      {profile.recommendedForCS ? 'Recommended' : 'Not Recommended'}
                    </span>
                  </div>
                </div>
                
                <div style={styles.profileDetails}>
                  <div style={styles.profileDetail}>
                    <span style={styles.detailLabel}>Offense:</span>
                    <span style={styles.detailValue}>{profile.offenseType || 'N/A'}</span>
                  </div>
                  <div style={styles.profileDetail}>
                    <span style={styles.detailLabel}>Risk:</span>
                    <span style={{
                      ...styles.riskBadge,
                      backgroundColor: getRiskColor(profile.riskLevel)
                    }}>
                      {profile.riskLevel || 'N/A'}
                    </span>
                  </div>
                  <div style={styles.profileDetail}>
                    <span style={styles.detailLabel}>Status:</span>
                    <span style={{
                      ...styles.statusBadge,
                      backgroundColor: getStatusColor(profile.status)
                    }}>
                      {profile.status || 'pending'}
                    </span>
                  </div>
                </div>
                
                <div style={styles.profileFooter}>
                  <span style={styles.profileDate}>
                    📅 {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                  <button 
                    style={styles.viewProfileButton}
                    onClick={() => navigate(`/profile/${profile.id}`)}
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📭</span>
          <h3 style={styles.emptyTitle}>No Profiles Yet</h3>
          <p style={styles.emptyText}>
            You haven't created any offender profiles. Click the "Create New Offender Profile" button to get started.
          </p>
        </div>
      )}

      {/* Quick Stats Summary */}
      {userStats.totalProfiled > 0 && (
        <div style={styles.statsSummary}>
          <h3 style={styles.summaryTitle}>Summary</h3>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Completion Rate:</span>
              <span style={styles.summaryValue}>
                {userStats.totalProfiled > 0 
                  ? Math.round((userStats.completed / userStats.totalProfiled) * 100) 
                  : 0}%
              </span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Recommendation Rate:</span>
              <span style={styles.summaryValue}>
                {userStats.totalProfiled > 0 
                  ? Math.round((userStats.recommended / userStats.totalProfiled) * 100) 
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: 'clamp(16px, 4vw, 24px)',
    backgroundColor: '#f8f9fa',
    boxSizing: 'border-box',
  },
  welcomeBanner: {
    backgroundColor: '#000000',
    color: '#ffffff',
    padding: 'clamp(16px, 3vw, 20px)',
    borderRadius: '16px',
    marginBottom: 'clamp(20px, 4vw, 24px)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    position: 'relative',
    animation: 'slideDown 0.3s ease',
    '@media (max-width: 480px)': {
      flexDirection: 'column',
      textAlign: 'center',
      padding: '16px',
    },
  },
  welcomeIcon: {
    fontSize: 'clamp(32px, 6vw, 40px)',
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    margin: '0 0 4px 0',
    fontSize: 'clamp(16px, 3.5vw, 18px)',
    fontWeight: '600',
  },
  welcomeText: {
    margin: 0,
    fontSize: 'clamp(13px, 2.5vw, 14px)',
    opacity: 0.9,
  },
  welcomeClose: {
    background: 'rgba(255,255,255,0.2)',
    border: 'none',
    color: '#ffffff',
    fontSize: '20px',
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: 'rgba(255,255,255,0.3)',
    },
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'clamp(20px, 4vw, 24px)',
    flexWrap: 'wrap',
    gap: '16px',
    '@media (max-width: 480px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
    },
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 'clamp(24px, 5vw, 28px)',
    color: '#000000',
    margin: '0 0 4px 0',
    fontWeight: '600',
  },
  subtitle: {
    margin: 0,
    fontSize: 'clamp(13px, 2.5vw, 14px)',
    color: '#666666',
  },
  refreshButton: {
    backgroundColor: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: '10px',
    padding: 'clamp(10px, 2.5vw, 12px) clamp(16px, 3vw, 20px)',
    fontSize: 'clamp(14px, 3vw, 16px)',
    fontWeight: '500',
    color: '#333333',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f5f5f5',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  refreshIcon: {
    fontSize: '16px',
  },
  refreshText: {
    '@media (max-width: 480px)': {
      display: 'none',
    },
  },
  infoMessage: {
    backgroundColor: '#e3f2fd',
    border: '1px solid #90caf9',
    borderRadius: '12px',
    padding: 'clamp(16px, 3vw, 20px)',
    marginBottom: 'clamp(20px, 4vw, 24px)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    '@media (max-width: 480px)': {
      flexDirection: 'column',
      textAlign: 'center',
    },
  },
  infoIcon: {
    fontSize: '24px',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    margin: '0 0 4px 0',
    fontSize: 'clamp(15px, 3vw, 16px)',
    fontWeight: '600',
    color: '#0d47a1',
  },
  infoText: {
    margin: 0,
    fontSize: 'clamp(13px, 2.5vw, 14px)',
    color: '#1565c0',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: 'clamp(12px, 2.5vw, 16px)',
    marginBottom: 'clamp(24px, 5vw, 32px)',
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: 'clamp(16px, 3vw, 20px)',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(12px, 2.5vw, 16px)',
    transition: 'transform 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
    },
  },
  statIcon: {
    fontSize: 'clamp(24px, 5vw, 32px)',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    margin: '0 0 4px 0',
    fontSize: 'clamp(12px, 2.5vw, 13px)',
    color: '#666666',
    fontWeight: '500',
  },
  statValue: {
    margin: 0,
    fontSize: 'clamp(20px, 4vw, 24px)',
    fontWeight: 'bold',
    color: '#000000',
    lineHeight: 1.2,
  },
  quickActions: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: 'clamp(20px, 4vw, 24px)',
    marginBottom: 'clamp(24px, 5vw, 32px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
  },
  sectionTitle: {
    fontSize: 'clamp(18px, 4vw, 20px)',
    color: '#000000',
    margin: '0 0 16px 0',
    fontWeight: '600',
  },
  actionButtons: {
    display: 'flex',
    gap: 'clamp(12px, 3vw, 16px)',
    flexWrap: 'wrap',
    '@media (max-width: 480px)': {
      flexDirection: 'column',
    },
  },
  primaryActionButton: {
    flex: 2,
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    padding: 'clamp(12px, 3vw, 16px)',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#333333',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    color: '#000000',
    border: '2px solid #000000',
    borderRadius: '12px',
    padding: 'clamp(12px, 3vw, 16px)',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f5f5f5',
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  actionIcon: {
    fontSize: 'clamp(18px, 4vw, 20px)',
  },
  actionText: {
    '@media (max-width: 480px)': {
      fontSize: '14px',
    },
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  viewAllButton: {
    background: 'none',
    border: 'none',
    color: '#000000',
    fontSize: 'clamp(13px, 2.5vw, 14px)',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f0f0f0',
    },
  },
  recentProfiles: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: 'clamp(20px, 4vw, 24px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
    marginBottom: 'clamp(20px, 4vw, 24px)',
  },
  profileList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 'clamp(12px, 3vw, 16px)',
  },
  profileCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    padding: 'clamp(16px, 3vw, 20px)',
    border: '1px solid #e0e0e0',
    transition: 'all 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
    },
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  profileAvatar: {
    width: 'clamp(40px, 8vw, 48px)',
    height: 'clamp(40px, 8vw, 48px)',
    backgroundColor: '#000000',
    color: '#ffffff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'clamp(16px, 3.5vw, 18px)',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    display: 'block',
    fontSize: 'clamp(15px, 3vw, 16px)',
    fontWeight: '600',
    color: '#000000',
    marginBottom: '4px',
  },
  profileStatus: {
    display: 'inline-block',
    fontSize: 'clamp(11px, 2.5vw, 12px)',
    padding: '4px 10px',
    borderRadius: '20px',
    color: '#ffffff',
    fontWeight: '500',
  },
  profileDetails: {
    marginBottom: '12px',
  },
  profileDetail: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
    borderBottom: '1px solid #e0e0e0',
  },
  detailLabel: {
    color: '#666666',
    fontSize: 'clamp(12px, 2.5vw, 13px)',
    fontWeight: '500',
  },
  detailValue: {
    color: '#000000',
    fontSize: 'clamp(12px, 2.5vw, 13px)',
  },
  riskBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    color: '#ffffff',
    fontSize: 'clamp(11px, 2.5vw, 12px)',
    fontWeight: '500',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    color: '#ffffff',
    fontSize: 'clamp(11px, 2.5vw, 12px)',
    fontWeight: '500',
  },
  profileFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e0e0e0',
  },
  profileDate: {
    color: '#999999',
    fontSize: 'clamp(11px, 2.5vw, 12px)',
  },
  viewProfileButton: {
    background: 'none',
    border: 'none',
    color: '#000000',
    fontSize: 'clamp(12px, 2.5vw, 13px)',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f0f0f0',
    },
  },
  emptyState: {
    textAlign: 'center',
    padding: 'clamp(30px, 8vw, 40px)',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    color: '#666666',
    border: '2px dashed #cccccc',
  },
  emptyIcon: {
    fontSize: 'clamp(40px, 10vw, 48px)',
    display: 'block',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: 'clamp(18px, 4vw, 20px)',
    color: '#000000',
    marginBottom: '8px',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 'clamp(13px, 2.5vw, 14px)',
    color: '#666666',
    maxWidth: '400px',
    margin: '0 auto',
  },
  statsSummary: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: 'clamp(16px, 3vw, 20px)',
    border: '1px solid #e0e0e0',
  },
  summaryTitle: {
    fontSize: 'clamp(15px, 3vw, 16px)',
    margin: '0 0 12px 0',
    color: '#000000',
    fontWeight: '600',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 'clamp(12px, 2.5vw, 16px)',
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
  },
  summaryLabel: {
    color: '#666666',
    fontSize: 'clamp(12px, 2.5vw, 13px)',
    fontWeight: '500',
  },
  summaryValue: {
    color: '#000000',
    fontSize: 'clamp(14px, 3vw, 16px)',
    fontWeight: '600',
  },
};

// Add global animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);

export default UserDashboard;