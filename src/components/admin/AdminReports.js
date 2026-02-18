import React, { useState, useEffect } from 'react';
import { getStats, getOffenders, getAssignments } from '../../utils/database';

const AdminReports = () => {
  const [stats, setStats] = useState(null);
  const [offenders, setOffenders] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('summary');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statsData = await getStats();
      const offendersData = await getOffenders();
      const assignmentsData = await getAssignments();
      
      setStats(statsData);
      setOffenders(offendersData);
      setAssignments(assignmentsData);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    let csvContent = '';
    
    if (reportType === 'offenders') {
      csvContent = 'First Name,Last Name,Email,Offense Type,Risk Level,Recommended,Status,Vetted By,Created\n';
      offenders.forEach(o => {
        csvContent += `${o.firstName || ''},${o.lastName || ''},${o.email || ''},${o.offenseType || ''},${o.riskLevel || ''},${o.recommendedForCS ? 'Yes' : 'No'},${o.status || ''},${o.vettedBy || ''},${o.createdAt || ''}\n`;
      });
    } else if (reportType === 'assignments') {
      csvContent = 'Offender Name,Institution,Start Date,End Date,Hours,Status,Supervisor,Created\n';
      assignments.forEach(a => {
        csvContent += `${a.offenderName || ''},${a.institution || ''},${a.startDate || ''},${a.endDate || ''},${a.hoursRequired || ''},${a.status || ''},${a.supervisor || ''},${a.createdAt || ''}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const printReport = () => {
    window.print();
  };

  if (loading) {
    return <div style={styles.loading}>Loading reports...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Reports & Analytics</h2>

      <div style={styles.controls}>
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          style={styles.select}
        >
          <option value="summary">Summary Report</option>
          <option value="offenders">Offenders Report (#2)</option>
          <option value="assignments">Assignments Report (#7, #8)</option>
        </select>

        <button onClick={exportToCSV} style={styles.exportButton}>
          📥 Export CSV
        </button>
        <button onClick={printReport} style={styles.printButton}>
          🖨️ Print
        </button>
        <button onClick={fetchData} style={styles.refreshButton}>
          🔄 Refresh
        </button>
      </div>

      {reportType === 'summary' && stats && (
        <div style={styles.summary}>
          <h3>Summary Statistics</h3>
          
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <p style={styles.statLabel}>Total Vetted (#2)</p>
              <p style={styles.statValue}>{stats.totalVetted}</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statLabel}>Not Recommended (#3)</p>
              <p style={styles.statValue}>{stats.notRecommended}</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statLabel}>Recommended (#4)</p>
              <p style={styles.statValue}>{stats.recommended}</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statLabel}>Completed (#7)</p>
              <p style={styles.statValue}>{stats.completed}</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statLabel}>Defaulted (#8)</p>
              <p style={styles.statValue}>{stats.defaulted}</p>
            </div>
            <div style={styles.statCard}>
              <p style={styles.statLabel}>Active Cases</p>
              <p style={styles.statValue}>{stats.active}</p>
            </div>
          </div>

          <div style={styles.completionRate}>
            <h4>Completion Rate</h4>
            <div style={styles.progressBar}>
              <div style={{
                ...styles.progress,
                width: `${stats.completed + stats.defaulted > 0 
                  ? (stats.completed / (stats.completed + stats.defaulted)) * 100 
                  : 0}%`
              }}>
                {stats.completed + stats.defaulted > 0 
                  ? ((stats.completed / (stats.completed + stats.defaulted)) * 100).toFixed(1) 
                  : 0}%
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'offenders' && (
        <div style={styles.tableContainer}>
          <h3>Offenders Report</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Offense</th>
                <th>Risk</th>
                <th>Recommended</th>
                <th>Status</th>
                <th>Vetted By</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {offenders.map(o => (
                <tr key={o.id}>
                  <td>{o.firstName} {o.lastName}</td>
                  <td>{o.email}</td>
                  <td>{o.offenseType}</td>
                  <td>{o.riskLevel}</td>
                  <td>{o.recommendedForCS ? 'Yes' : 'No'}</td>
                  <td>{o.status}</td>
                  <td>{o.vettedBy}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportType === 'assignments' && (
        <div style={styles.tableContainer}>
          <h3>Assignments Report</h3>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Offender</th>
                <th>Institution</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Hours</th>
                <th>Status</th>
                <th>Supervisor</th>
                <th>Assigned By</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a.id}>
                  <td>{a.offenderName}</td>
                  <td>{a.institution}</td>
                  <td>{new Date(a.startDate).toLocaleDateString()}</td>
                  <td>{a.endDate ? new Date(a.endDate).toLocaleDateString() : '-'}</td>
                  <td>{a.hoursRequired}</td>
                  <td style={{
                    color: a.status === 'completed' ? '#4caf50' :
                           a.status === 'defaulted' ? '#f44336' : '#ff9800'
                  }}>
                    {a.status}
                  </td>
                  <td>{a.supervisor}</td>
                  <td>{a.assignedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  title: {
    fontSize: '28px',
    marginBottom: '20px',
    color: '#333'
  },
  controls: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
    flexWrap: 'wrap'
  },
  select: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    minWidth: '200px'
  },
  exportButton: {
    padding: '10px 20px',
    backgroundColor: '#4caf50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  printButton: {
    padding: '10px 20px',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  refreshButton: {
    padding: '10px 20px',
    backgroundColor: '#ff9800',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  summary: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    backgroundColor: '#f9f9f9',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center'
  },
  statLabel: {
    color: '#666',
    marginBottom: '10px'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0
  },
  completionRate: {
    marginTop: '20px'
  },
  progressBar: {
    width: '100%',
    height: '30px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progress: {
    height: '100%',
    backgroundColor: '#4caf50',
    color: 'white',
    textAlign: 'center',
    lineHeight: '30px',
    fontSize: '14px'
  },
  tableContainer: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  }
};

export default AdminReports;