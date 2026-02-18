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
          <h3 style={styles.sectionTitle}>Summary Statistics</h3>
          
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
            <h4 style={styles.subSectionTitle}>Completion Rate</h4>
            <div style={styles.progressBar}>
              <div style={{
                ...styles.progress,
                width: `${stats.completed + stats.defaulted > 0 
                  ? (stats.completed / (stats.completed + stats.defaulted)) * 100 
                  : 0}%`,
                backgroundColor: '#000000'
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
          <h3 style={styles.sectionTitle}>Offenders Report</h3>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Offense</th>
                <th style={styles.th}>Risk</th>
                <th style={styles.th}>Recommended</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Vetted By</th>
                <th style={styles.th}>Created</th>
              </tr>
            </thead>
            <tbody>
              {offenders.map(o => (
                <tr key={o.id} style={styles.tableRow}>
                  <td style={styles.td}>{o.firstName} {o.lastName}</td>
                  <td style={styles.td}>{o.email}</td>
                  <td style={styles.td}>{o.offenseType}</td>
                  <td style={styles.td}>{o.riskLevel}</td>
                  <td style={styles.td}>{o.recommendedForCS ? 'Yes' : 'No'}</td>
                  <td style={styles.td}>{o.status}</td>
                  <td style={styles.td}>{o.vettedBy}</td>
                  <td style={styles.td}>{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportType === 'assignments' && (
        <div style={styles.tableContainer}>
          <h3 style={styles.sectionTitle}>Assignments Report</h3>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Offender</th>
                <th style={styles.th}>Institution</th>
                <th style={styles.th}>Start Date</th>
                <th style={styles.th}>End Date</th>
                <th style={styles.th}>Hours</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Supervisor</th>
                <th style={styles.th}>Assigned By</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map(a => (
                <tr key={a.id} style={styles.tableRow}>
                  <td style={styles.td}>{a.offenderName}</td>
                  <td style={styles.td}>{a.institution}</td>
                  <td style={styles.td}>{new Date(a.startDate).toLocaleDateString()}</td>
                  <td style={styles.td}>{a.endDate ? new Date(a.endDate).toLocaleDateString() : '-'}</td>
                  <td style={styles.td}>{a.hoursRequired}</td>
                  <td style={{
                    ...styles.td,
                    color: a.status === 'completed' ? '#008000' :
                           a.status === 'defaulted' ? '#ff0000' : '#666666',
                    fontWeight: '500'
                  }}>
                    {a.status}
                  </td>
                  <td style={styles.td}>{a.supervisor}</td>
                  <td style={styles.td}>{a.assignedBy}</td>
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
    margin: '0 auto',
    backgroundColor: '#ffffff'
  },
  title: {
    fontSize: '28px',
    marginBottom: '20px',
    color: '#000000'
  },
  sectionTitle: {
    fontSize: '20px',
    marginBottom: '15px',
    color: '#000000'
  },
  subSectionTitle: {
    fontSize: '16px',
    marginBottom: '10px',
    color: '#333333'
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
    border: '1px solid #cccccc',
    borderRadius: '4px',
    fontSize: '14px',
    minWidth: '200px',
    backgroundColor: '#ffffff',
    color: '#000000'
  },
  exportButton: {
    padding: '10px 20px',
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  printButton: {
    padding: '10px 20px',
    backgroundColor: '#333333',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  refreshButton: {
    padding: '10px 20px',
    backgroundColor: '#666666',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  summary: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    backgroundColor: '#f5f5f5',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid #cccccc'
  },
  statLabel: {
    color: '#333333',
    marginBottom: '10px',
    fontSize: '14px'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#000000',
    margin: 0
  },
  completionRate: {
    marginTop: '20px',
    padding: '15px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    border: '1px solid #cccccc'
  },
  progressBar: {
    width: '100%',
    height: '30px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progress: {
    height: '100%',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: '30px',
    fontSize: '14px',
    transition: 'width 0.3s ease'
  },
  tableContainer: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'auto',
    border: '1px solid #e0e0e0'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '20px'
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
    borderBottom: '2px solid #cccccc'
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    color: '#000000',
    borderBottom: '1px solid #cccccc'
  },
  tableRow: {
    borderBottom: '1px solid #e0e0e0',
    ':hover': {
      backgroundColor: '#f5f5f5'
    }
  },
  td: {
    padding: '10px 12px',
    fontSize: '14px',
    color: '#333333',
    borderBottom: '1px solid #e0e0e0'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666666',
    backgroundColor: '#ffffff'
  }
};

export default AdminReports;