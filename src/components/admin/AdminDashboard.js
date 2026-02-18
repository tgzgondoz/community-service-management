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
          Refresh
        </button>
      </div>

      <div style={styles.statsGrid}>
        <StatCard
          title="Total Vetted (#2)"
          value={stats.totalVetted}
          icon="👥"
          color="#2196f3"
          onClick={() => navigate('/offenders')}
        />
        <StatCard
          title="Not Recommended (#3)"
          value={stats.notRecommended}
          icon="❌"
          color="#ff9800"
          onClick={() => navigate('/offenders?filter=not-recommended')}
        />
        <StatCard
          title="Recommended (#4)"
          value={stats.recommended}
          icon="✅"
          color="#4caf50"
          onClick={() => navigate('/recommended')}
        />
        <StatCard
          title="Completed (#7)"
          value={stats.completed}
          icon="🎉"
          color="#9c27b0"
          onClick={() => navigate('/reports?type=completed')}
        />
        <StatCard
          title="Defaulted (#8)"
          value={stats.defaulted}
          icon="⚠️"
          color="#f44336"
          onClick={() => navigate('/reports?type=defaulted')}
        />
        <StatCard
          title="Active Cases"
          value={stats.active}
          icon="⚡"
          color="#00bcd4"
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
                 activity.type === 'assignment' ? '📋' : '🫂'}
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
    maxWidth: '1400px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '32px',
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
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#f9fafb'
    }
  },
  refreshIcon: {
    fontSize: '16px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginBottom: '40px'
  },
  recentActivity: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    fontSize: '20px',
    color: '#1f2937',
    marginTop: 0,
    marginBottom: '20px'
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  activityItem: {
    display: 'flex',
    gap: '16px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#f3f4f6'
    }
  },
  activityIcon: {
    width: '40px',
    height: '40px',
    backgroundColor: '#e5e7eb',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '20px'
  },
  activityContent: {
    flex: 1
  },
  activityDescription: {
    margin: '0 0 4px 0',
    color: '#1f2937',
    fontSize: '14px'
  },
  activityTime: {
    margin: 0,
    color: '#6b7280',
    fontSize: '12px'
  },
  noActivity: {
    textAlign: 'center',
    color: '#6b7280',
    padding: '40px'
  }
};

export default AdminDashboard;