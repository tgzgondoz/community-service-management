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
        <h1 style={styles.title}>Admin Dashboard</h1>
        <button onClick={fetchDashboardData} style={styles.refreshButton}>
          <span style={styles.refreshIcon}>🔄</span>
          <span style={styles.refreshText}>Refresh</span>
        </button>
      </div>

      <div style={styles.statsGrid}>
        <StatCard
          title="Total Vetted"
          value={stats.totalVetted}
          icon="👥"
          color="#000000"
          onClick={() => navigate('/offenders')}
        />
        <StatCard
          title="Not Recommended"
          value={stats.notRecommended}
          icon="❌"
          color="#333333"
          onClick={() => navigate('/offenders?filter=not-recommended')}
        />
        <StatCard
          title="Recommended"
          value={stats.recommended}
          icon="✅"
          color="#666666"
          onClick={() => navigate('/recommended')}
        />
        <StatCard
          title="Completed"
          value={stats.completed}
          icon="🎉"
          color="#999999"
          onClick={() => navigate('/reports?type=completed')}
        />
        <StatCard
          title="Defaulted"
          value={stats.defaulted}
          icon="⚠️"
          color="#4d4d4d"
          onClick={() => navigate('/reports?type=defaulted')}
        />
        <StatCard
          title="Active Cases"
          value={stats.active}
          icon="📋"
          color="#1a1a1a"
          onClick={() => navigate('/offenders?filter=active')}
        />
      </div>

      <div style={styles.recentActivity}>
        <h2 style={styles.sectionTitle}>Recent Activity</h2>
        <div style={styles.activityList}>
          {activities.map(activity => (
            <div key={activity.id} style={styles.activityItem}>
              <div style={styles.activityIcon}>
                {activity.type === 'offender' ? '👤' : 
                 activity.type === 'assignment' ? '📝' : '📊'}
              </div>
              <div style={styles.activityContent}>
                <p style={styles.activityDescription}>{activity.description}</p>
                <p style={styles.activityTime}>
                  {new Date(activity.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {activities.length === 0 && (
            <p style={styles.noActivity}>No recent activity</p>
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
    padding: '20px',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
    '@media (max-width: 768px)': {
      padding: '15px',
    },
    '@media (max-width: 480px)': {
      padding: '10px',
    }
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '15px',
    '@media (max-width: 480px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
      marginBottom: '20px',
    }
  },
  title: {
    fontSize: 'clamp(24px, 5vw, 32px)',
    color: '#000000',
    margin: 0,
    fontWeight: '600',
    '@media (max-width: 480px)': {
      textAlign: 'center',
    }
  },
  refreshButton: {
    backgroundColor: '#ffffff',
    border: '1px solid #cccccc',
    borderRadius: '8px',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333333',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f5f5f5',
      borderColor: '#999999',
    },
    ':active': {
      transform: 'scale(0.98)',
    },
    '@media (max-width: 480px)': {
      width: '100%',
      padding: '12px',
    }
  },
  refreshIcon: {
    fontSize: '16px',
  },
  refreshText: {
    '@media (max-width: 320px)': {
      display: 'none',
    }
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
    '@media (max-width: 768px)': {
      gap: '15px',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    },
    '@media (max-width: 480px)': {
      gap: '12px',
      gridTemplateColumns: '1fr',
    }
  },
  recentActivity: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: 'clamp(16px, 4vw, 24px)',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
    width: '100%',
    boxSizing: 'border-box',
  },
  sectionTitle: {
    fontSize: 'clamp(18px, 4vw, 20px)',
    color: '#000000',
    marginTop: 0,
    marginBottom: '20px',
    fontWeight: '600',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  activityItem: {
    display: 'flex',
    gap: 'clamp(12px, 3vw, 16px)',
    padding: 'clamp(10px, 2.5vw, 12px)',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    border: '1px solid #e0e0e0',
    width: '100%',
    boxSizing: 'border-box',
    ':hover': {
      backgroundColor: '#e8e8e8',
      transform: 'translateX(5px)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    '@media (max-width: 480px)': {
      flexDirection: 'column',
      alignItems: 'flex-start',
      ':hover': {
        transform: 'translateY(-2px)',
      }
    }
  },
  activityIcon: {
    width: 'clamp(35px, 8vw, 40px)',
    height: 'clamp(35px, 8vw, 40px)',
    backgroundColor: '#d9d9d9',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 'clamp(16px, 4vw, 20px)',
    border: '1px solid #b3b3b3',
    flexShrink: 0,
  },
  activityContent: {
    flex: 1,
    minWidth: 0, // Prevents text overflow
  },
  activityDescription: {
    margin: '0 0 4px 0',
    color: '#000000',
    fontSize: 'clamp(13px, 3.5vw, 14px)',
    lineHeight: '1.4',
    wordWrap: 'break-word',
  },
  activityTime: {
    margin: 0,
    color: '#666666',
    fontSize: 'clamp(11px, 3vw, 12px)',
  },
  noActivity: {
    textAlign: 'center',
    color: '#666666',
    padding: 'clamp(30px, 8vw, 40px)',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    border: '1px dashed #cccccc',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
  }
};

export default AdminDashboard;