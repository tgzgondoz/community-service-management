import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStats, getActivities } from '../../utils/database';
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

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'High': return '#dc2626';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="admin-dashboard" style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Dashboard</h1>
          <span style={styles.subtitle}>Welcome back, Administrator</span>
        </div>
        <button onClick={fetchDashboardData} className="refresh-button" style={styles.refreshButton}>
          <span style={styles.refreshText}>Refresh Data</span>
        </button>
      </div>

      <div style={styles.statsGrid}>
        <div className="stat-card" style={styles.statCard} onClick={() => navigate('/offenders')}>
          <div style={styles.statHeader}>
            <span style={styles.statTitle}>Total Vetted</span>
            <span style={styles.statValue}>{stats?.totalVetted || 0}</span>
          </div>
          <div style={styles.statFooter}>
            <span style={styles.statLink}>View offenders →</span>
          </div>
        </div>

        <div className="stat-card" style={styles.statCard} onClick={() => navigate('/offenders?filter=not-recommended')}>
          <div style={styles.statHeader}>
            <span style={styles.statTitle}>Not Recommended</span>
            <span style={styles.statValue}>{stats?.notRecommended || 0}</span>
          </div>
          <div style={styles.statFooter}>
            <span style={styles.statLink}>View details →</span>
          </div>
        </div>

        <div className="stat-card" style={styles.statCard} onClick={() => navigate('/recommended')}>
          <div style={styles.statHeader}>
            <span style={styles.statTitle}>Recommended</span>
            <span style={styles.statValue}>{stats?.recommended || 0}</span>
          </div>
          <div style={styles.statFooter}>
            <span style={styles.statLink}>View recommended →</span>
          </div>
        </div>

        <div className="stat-card" style={styles.statCard} onClick={() => navigate('/reports?type=completed')}>
          <div style={styles.statHeader}>
            <span style={styles.statTitle}>Completed</span>
            <span style={styles.statValue}>{stats?.completed || 0}</span>
          </div>
          <div style={styles.statFooter}>
            <span style={styles.statLink}>View reports →</span>
          </div>
        </div>

        <div className="stat-card" style={styles.statCard} onClick={() => navigate('/reports?type=defaulted')}>
          <div style={styles.statHeader}>
            <span style={styles.statTitle}>Defaulted</span>
            <span style={styles.statValue}>{stats?.defaulted || 0}</span>
          </div>
          <div style={styles.statFooter}>
            <span style={styles.statLink}>View reports →</span>
          </div>
        </div>

        <div className="stat-card" style={styles.statCard} onClick={() => navigate('/offenders?filter=active')}>
          <div style={styles.statHeader}>
            <span style={styles.statTitle}>Active Cases</span>
            <span style={styles.statValue}>{stats?.active || 0}</span>
          </div>
          <div style={styles.statFooter}>
            <span style={styles.statLink}>View cases →</span>
          </div>
        </div>
      </div>

      <div style={styles.recentActivity}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Recent Activity</h2>
          <span style={styles.activityBadge}>{activities.length} items</span>
        </div>
        
        <div style={styles.activityList}>
          {activities.map(activity => (
            <div key={activity.id} className="activity-item" style={styles.activityItem}>
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
              <p>No recent activity to display</p>
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-dashboard .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
          border-color: #cbd5e1;
        }
        
        .admin-dashboard .refresh-button:hover {
          background-color: #f8fafc;
          border-color: #94a3b8;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          transform: translateY(-1px);
        }
        
        .admin-dashboard .activity-item:hover {
          background-color: #f8fafc;
          border-color: #cbd5e1;
          transform: translateX(4px);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }
        
        @media (max-width: 768px) {
          .admin-dashboard .activity-item:hover {
            transform: translateY(-2px);
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
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px',
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
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  refreshText: {
    fontWeight: '500',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginBottom: '48px',
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  statHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statTitle: {
    fontSize: '16px',
    color: '#64748b',
    fontWeight: '500',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 1,
  },
  statFooter: {
    borderTop: '1px solid #f1f5f9',
    paddingTop: '16px',
  },
  statLink: {
    fontSize: '14px',
    color: '#2563eb',
    fontWeight: '500',
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
  },
};

export default AdminDashboard;