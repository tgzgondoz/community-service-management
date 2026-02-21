import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStats, getActivities } from '../../utils/database';
import StatCard from '../common/StatCard';
import LoadingSpinner from '../common/LoadingSpinner';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsData, activitiesData] = await Promise.all([
        getStats(),
        getActivities()
      ]);
      setStats(statsData);
      setActivities(activitiesData.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      ).slice(0, 10));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Dashboard</h1>
          <span style={styles.subtitle}>Admin Overview</span>
        </div>
        <button onClick={fetchDashboardData} style={styles.refreshButton}>
          <span style={styles.refreshIcon}>↻</span>
          <span style={styles.refreshText}>Refresh Data</span>
        </button>
      </div>

      <div style={styles.statsGrid}>
        <StatCard
          title="Total Vetted"
          value={stats.totalVetted}
          icon="👥"
          color="#2563eb"
          onClick={() => navigate('/offenders')}
        />
        <StatCard
          title="Not Recommended"
          value={stats.notRecommended}
          icon="❌"
          color="#dc2626"
          onClick={() => navigate('/offenders?filter=not-recommended')}
        />
        <StatCard
          title="Recommended"
          value={stats.recommended}
          icon="✅"
          color="#16a34a"
          onClick={() => navigate('/recommended')}
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon="🎉"
          color="#9333ea"
          onClick={() => navigate('/reports?type=completed')}
        />
        <StatCard
          title="Defaulted"
          value={stats.defaulted}
          icon="⚠️"
          color="#ea580c"
          onClick={() => navigate('/reports?type=defaulted')}
        />
        <StatCard
          title="Active Cases"
          value={stats.active}
          icon="📋"
          color="#0891b2"
          onClick={() => navigate('/offenders?filter=active')}
        />
      </div>

      <div style={styles.recentActivity}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Recent Activity</h2>
          <span style={styles.activityBadge}>{activities.length} items</span>
        </div>
        <div style={styles.activityList}>
          {activities.map(activity => (
            <div key={activity.id} style={styles.activityItem}>
              <div style={styles.activityIcon}>
                {activity.type === 'offender' ? '👤' : 
                 activity.type === 'assignment' ? '📝' : '📊'}
              </div>
              <div style={styles.activityContent}>
                <p style={styles.activityDescription}>{activity.description}</p>
                <div style={styles.activityMeta}>
                  <span style={styles.activityType}>
                    {activity.type === 'offender' ? 'Offender Update' : 
                     activity.type === 'assignment' ? 'Assignment' : 'Report'}
                  </span>
                  <span style={styles.activityTime}>
                    {new Date(activity.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <div style={styles.noActivity}>
              <span style={styles.noActivityIcon}>📭</span>
              <p>No recent activity to display</p>
            </div>
          )}
        </div>
      </div>
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
    '@media (max-width: 768px)': {
      padding: '24px 16px',
    },
    '@media (max-width: 480px)': {
      padding: '20px 12px',
    }
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px',
    '@media (max-width: 480px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
      marginBottom: '24px',
    }
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  title: {
    fontSize: 'clamp(28px, 5vw, 36px)',
    color: '#0f172a',
    margin: 0,
    fontWeight: '600',
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: 'clamp(14px, 3vw, 16px)',
    color: '#64748b',
    fontWeight: '400',
  },
  refreshButton: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1e293b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    ':hover': {
      backgroundColor: '#f8fafc',
      borderColor: '#94a3b8',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      transform: 'translateY(-1px)',
    },
    ':active': {
      transform: 'translateY(0)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    },
    '@media (max-width: 480px)': {
      width: '100%',
      padding: '14px',
    }
  },
  refreshIcon: {
    fontSize: '18px',
    display: 'inline-block',
    transition: 'transform 0.3s ease',
    ':hover': {
      transform: 'rotate(180deg)',
    }
  },
  refreshText: {
    '@media (max-width: 320px)': {
      display: 'none',
    }
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginBottom: '48px',
    '@media (max-width: 768px)': {
      gap: '16px',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    },
    '@media (max-width: 480px)': {
      gap: '12px',
      gridTemplateColumns: '1fr',
    }
  },
  recentActivity: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0',
    width: '100%',
    boxSizing: 'border-box',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: 'clamp(18px, 4vw, 20px)',
    color: '#0f172a',
    margin: 0,
    fontWeight: '600',
    letterSpacing: '-0.01em',
  },
  activityBadge: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  activityItem: {
    display: 'flex',
    gap: '16px',
    padding: '16px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    border: '1px solid #f1f5f9',
    width: '100%',
    boxSizing: 'border-box',
    ':hover': {
      backgroundColor: '#f8fafc',
      borderColor: '#cbd5e1',
      transform: 'translateX(4px)',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    },
    '@media (max-width: 480px)': {
      flexDirection: 'row',
      padding: '14px',
      ':hover': {
        transform: 'translateY(-2px)',
      }
    }
  },
  activityIcon: {
    width: '44px',
    height: '44px',
    backgroundColor: '#f1f5f9',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '20px',
    border: '1px solid #e2e8f0',
    flexShrink: 0,
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#e2e8f0',
    }
  },
  activityContent: {
    flex: 1,
    minWidth: 0,
  },
  activityDescription: {
    margin: '0 0 6px 0',
    color: '#0f172a',
    fontSize: 'clamp(14px, 3.5vw, 15px)',
    lineHeight: '1.5',
    fontWeight: '500',
    wordWrap: 'break-word',
  },
  activityMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  activityType: {
    fontSize: '12px',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    padding: '2px 8px',
    borderRadius: '12px',
    fontWeight: '500',
  },
  activityTime: {
    margin: 0,
    color: '#94a3b8',
    fontSize: '12px',
  },
  noActivity: {
    textAlign: 'center',
    color: '#64748b',
    padding: '48px 24px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px dashed #cbd5e1',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
  },
  noActivityIcon: {
    fontSize: '32px',
    opacity: 0.7,
  }
};

export default AdminDashboard;