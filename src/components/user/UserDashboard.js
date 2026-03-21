import React, { useState, useEffect, useCallback } from 'react';
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
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const getUserEmail = useCallback(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        return userData.email;
      } catch (error) {
        console.error('Error parsing stored user:', error);
      }
    }
    
    if (auth.currentUser) {
      return auth.currentUser.email;
    }
    
    return 'probation.officer@example.com';
  }, []);

  const fetchUserData = useCallback(async (email) => {
    setLoading(true);
    try {
      const allOffenders = await getOffenders();
      const userOffenders = allOffenders.filter(o => 
        o.vettedBy === email || 
        o.createdBy === email ||
        (o.vettedBy && o.vettedBy.toLowerCase() === email?.toLowerCase())
      );

      const recommended = userOffenders.filter(o => o.recommendedForCS === true).length;
      const notRecommended = userOffenders.filter(o => o.recommendedForCS === false).length;
      const pending = userOffenders.filter(o => o.status === 'pending').length;
      const active = userOffenders.filter(o => o.status === 'active').length;
      const completed = userOffenders.filter(o => o.status === 'completed').length;

      setUserStats({
        totalProfiled: userOffenders.length,
        recommended,
        notRecommended,
        pending,
        active,
        completed
      });

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
  }, []);

  useEffect(() => {
    const email = getUserEmail();
    setUserEmail(email);
    setUserName(email ? email.split('@')[0] : 'User');
    fetchUserData(email);

    const timer = setTimeout(() => setShowWelcome(false), 5000);
    return () => clearTimeout(timer);
  }, [getUserEmail, fetchUserData]);

  const handleRefresh = () => {
    setLoading(true);
    fetchUserData(userEmail);
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'High': return '#dc2626';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'active': return '#3b82f6';
      case 'defaulted': return '#dc2626';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="user-dashboard" style={styles.container}>
      {showWelcome && (
        <div style={styles.welcomeBanner}>
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
            Dismiss
          </button>
        </div>
      )}

      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>
            {userEmail || 'Loading...'}
          </p>
        </div>
        <button onClick={handleRefresh} style={styles.refreshButton}>
          <span style={styles.refreshText}>Refresh</span>
        </button>
      </div>

      {userStats.totalProfiled === 0 && (
        <div style={styles.infoMessage}>
          <div style={styles.infoContent}>
            <p style={styles.infoTitle}>Welcome to your dashboard</p>
            <p style={styles.infoText}>
              You haven't created any offender profiles yet. Click the button below to create your first profile.
            </p>
          </div>
        </div>
      )}

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statContent}>
            <span style={styles.statValue}>{userStats.totalProfiled}</span>
            <span style={styles.statLabel}>Total Profiles</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statContent}>
            <span style={styles.statValue}>{userStats.recommended}</span>
            <span style={styles.statLabel}>Recommended</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statContent}>
            <span style={styles.statValue}>{userStats.notRecommended}</span>
            <span style={styles.statLabel}>Not Recommended</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statContent}>
            <span style={styles.statValue}>{userStats.pending}</span>
            <span style={styles.statLabel}>Pending Review</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statContent}>
            <span style={styles.statValue}>{userStats.active}</span>
            <span style={styles.statLabel}>Active Cases</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statContent}>
            <span style={styles.statValue}>{userStats.completed}</span>
            <span style={styles.statLabel}>Completed</span>
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
            <span style={styles.actionText}>Create New Offender Profile</span>
          </button>
          <button 
            style={styles.secondaryActionButton}
            onClick={() => navigate('/profile')}
          >
            <span style={styles.actionText}>View My Profile</span>
          </button>
        </div>
      </div>

      {recentProfiles.length > 0 ? (
        <div style={styles.recentProfiles}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Recent Profiles</h2>
            <button 
              style={styles.viewAllButton}
              onClick={() => navigate('/profiles')}
            >
              View All
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
                      backgroundColor: profile.recommendedForCS ? '#10b981' : '#dc2626'
                    }}>
                      {profile.recommendedForCS ? 'Recommended' : 'Not Recommended'}
                    </span>
                  </div>
                </div>
                
                <div style={styles.profileDetails}>
                  <div style={styles.profileDetail}>
                    <span style={styles.detailLabel}>Offense</span>
                    <span style={styles.detailValue}>{profile.offenseType || 'N/A'}</span>
                  </div>
                  <div style={styles.profileDetail}>
                    <span style={styles.detailLabel}>Risk</span>
                    <span style={{
                      ...styles.riskBadge,
                      backgroundColor: getRiskColor(profile.riskLevel)
                    }}>
                      {profile.riskLevel || 'N/A'}
                    </span>
                  </div>
                  <div style={styles.profileDetail}>
                    <span style={styles.detailLabel}>Status</span>
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
                    {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                  <button 
                    style={styles.viewProfileButton}
                    onClick={() => navigate(`/profile/${profile.id}`)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={styles.emptyState}>
          <h3 style={styles.emptyTitle}>No Profiles Yet</h3>
          <p style={styles.emptyText}>
            Create your first offender profile to get started.
          </p>
        </div>
      )}

      {userStats.totalProfiled > 0 && (
        <div style={styles.statsSummary}>
          <h3 style={styles.summaryTitle}>Summary</h3>
          <div style={styles.summaryGrid}>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Completion Rate</span>
              <span style={styles.summaryValue}>
                {userStats.totalProfiled > 0 
                  ? Math.round((userStats.completed / userStats.totalProfiled) * 100) 
                  : 0}%
              </span>
            </div>
            <div style={styles.summaryItem}>
              <span style={styles.summaryLabel}>Recommendation Rate</span>
              <span style={styles.summaryValue}>
                {userStats.totalProfiled > 0 
                  ? Math.round((userStats.recommended / userStats.totalProfiled) * 100) 
                  : 0}%
              </span>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .user-dashboard .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
          border-color: #cbd5e1;
        }
        
        .user-dashboard .primary-action-button:hover {
          background-color: #1e293b;
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        
        .user-dashboard .secondary-action-button:hover {
          background-color: #f8fafc;
          border-color: #94a3b8;
          transform: translateY(-1px);
        }
        
        .user-dashboard .view-profile-button:hover {
          background-color: #f8fafc;
          border-color: #94a3b8;
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      ` }} />
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '32px 24px',
    backgroundColor: '#f8fafc',
    boxSizing: 'border-box',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  welcomeBanner: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    padding: '20px 24px',
    borderRadius: '12px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    animation: 'slideDown 0.3s ease',
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    margin: '0 0 4px 0',
    fontSize: '18px',
    fontWeight: '600',
  },
  welcomeText: {
    margin: 0,
    fontSize: '14px',
    opacity: 0.9,
  },
  welcomeClose: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#ffffff',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 'clamp(28px, 5vw, 32px)',
    color: '#0f172a',
    margin: '0 0 4px 0',
    fontWeight: '600',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#64748b',
  },
  refreshButton: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#475569',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  refreshText: {
    fontWeight: '500',
  },
  infoMessage: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '24px',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    margin: '0 0 4px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#1e40af',
  },
  infoText: {
    margin: 0,
    fontSize: '14px',
    color: '#3b82f6',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    transition: 'all 0.2s ease',
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  statLabel: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 1.2,
  },
  quickActions: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '32px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
  },
  sectionTitle: {
    fontSize: '18px',
    color: '#0f172a',
    margin: '0 0 20px 0',
    fontWeight: '600',
  },
  actionButtons: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  primaryActionButton: {
    flex: 2,
    backgroundColor: '#0f172a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '14px 24px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    color: '#475569',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '14px 24px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  actionText: {
    fontWeight: '500',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  viewAllButton: {
    background: 'none',
    border: '1px solid #e2e8f0',
    color: '#475569',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '8px 16px',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
  },
  recentProfiles: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    marginBottom: '24px',
  },
  profileList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '16px',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '16px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.2s ease',
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  profileAvatar: {
    width: '44px',
    height: '44px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    display: 'block',
    fontSize: '15px',
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: '4px',
  },
  profileStatus: {
    display: 'inline-block',
    fontSize: '11px',
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
    padding: '6px 0',
    borderBottom: '1px solid #f1f5f9',
  },
  detailLabel: {
    color: '#64748b',
    fontSize: '13px',
    fontWeight: '500',
  },
  detailValue: {
    color: '#0f172a',
    fontSize: '13px',
    fontWeight: '500',
  },
  riskBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '500',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '500',
  },
  profileFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #f1f5f9',
  },
  profileDate: {
    color: '#94a3b8',
    fontSize: '12px',
  },
  viewProfileButton: {
    background: 'none',
    border: '1px solid #e2e8f0',
    color: '#475569',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px dashed #cbd5e1',
    color: '#64748b',
  },
  emptyTitle: {
    fontSize: '18px',
    color: '#0f172a',
    marginBottom: '8px',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: '14px',
    color: '#64748b',
    maxWidth: '400px',
    margin: '0 auto',
  },
  statsSummary: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  summaryTitle: {
    fontSize: '16px',
    margin: '0 0 16px 0',
    color: '#0f172a',
    fontWeight: '600',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
  },
  summaryItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #f1f5f9',
  },
  summaryLabel: {
    color: '#64748b',
    fontSize: '13px',
    fontWeight: '500',
  },
  summaryValue: {
    color: '#0f172a',
    fontSize: '15px',
    fontWeight: '600',
  },
};

export default UserDashboard;