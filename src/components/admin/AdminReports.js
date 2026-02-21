import React, { useState, useEffect } from 'react';
import { getStats, getOffenders, getAssignments } from '../../utils/database';

const AdminReports = () => {
  const [stats, setStats] = useState(null);
  const [offenders, setOffenders] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

  // Filter by date range
  const filterByDateRange = (items, dateField) => {
    if (dateRange === 'all') return items;
    
    const now = new Date();
    const filterDate = new Date();
    
    if (dateRange === 'week') {
      filterDate.setDate(now.getDate() - 7);
    } else if (dateRange === 'month') {
      filterDate.setMonth(now.getMonth() - 1);
    } else if (dateRange === 'quarter') {
      filterDate.setMonth(now.getMonth() - 3);
    }
    
    return items.filter(item => new Date(item[dateField]) >= filterDate);
  };

  // Sort function
  const sortData = (data, key, direction) => {
    if (!key) return data;
    
    return [...data].sort((a, b) => {
      let aValue = a[key];
      let bValue = b[key];
      
      // Handle date fields
      if (key.includes('Date') || key === 'createdAt') {
        aValue = new Date(aValue || 0).getTime();
        bValue = new Date(bValue || 0).getTime();
      }
      
      // Handle string comparison
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Pagination
  const getPaginatedData = (data) => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return data.slice(indexOfFirstItem, indexOfLastItem);
  };

  const exportToCSV = () => {
    let csvContent = '';
    let filename = '';
    
    if (reportType === 'offenders') {
      csvContent = 'First Name,Last Name,Email,Offense Type,Risk Level,Recommended,Status,Vetted By,Created\n';
      offenders.forEach(o => {
        csvContent += `${o.firstName || ''},${o.lastName || ''},${o.email || ''},${o.offenseType || ''},${o.riskLevel || ''},${o.recommendedForCS ? 'Yes' : 'No'},${o.status || ''},${o.vettedBy || ''},${o.createdAt || ''}\n`;
      });
      filename = 'offenders_report';
    } else if (reportType === 'assignments') {
      csvContent = 'Offender Name,Institution,Start Date,End Date,Hours,Status,Supervisor,Assigned By,Created\n';
      assignments.forEach(a => {
        csvContent += `${a.offenderName || ''},${a.institution || ''},${a.startDate || ''},${a.endDate || ''},${a.hoursRequired || ''},${a.status || ''},${a.supervisor || ''},${a.assignedBy || ''},${a.createdAt || ''}\n`;
      });
      filename = 'assignments_report';
    } else {
      // Summary report as JSON
      const blob = new Blob([JSON.stringify(stats, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `summary_report_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      return;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const printReport = () => {
    window.print();
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  // Prepare data based on filters and sorting
  const getFilteredData = () => {
    let data = [];
    if (reportType === 'offenders') {
      data = filterByDateRange(offenders, 'createdAt');
      data = sortData(data, sortConfig.key, sortConfig.direction);
    } else if (reportType === 'assignments') {
      data = filterByDateRange(assignments, 'createdAt');
      data = sortData(data, sortConfig.key, sortConfig.direction);
    }
    return data;
  };

  const filteredData = getFilteredData();
  const paginatedData = getPaginatedData(filteredData);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  if (loading) {
    return <div style={styles.loading}>Loading reports...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Reports & Analytics</h2>

      <div style={styles.controls}>
        <select
          value={reportType}
          onChange={(e) => {
            setReportType(e.target.value);
            setCurrentPage(1);
          }}
          style={styles.select}
        >
          <option value="summary">📊 Summary Report</option>
          <option value="offenders">👥 Offenders Report (#2)</option>
          <option value="assignments">📋 Assignments Report (#7, #8)</option>
        </select>

        <select
          value={dateRange}
          onChange={(e) => {
            setDateRange(e.target.value);
            setCurrentPage(1);
          }}
          style={styles.select}
          disabled={reportType === 'summary'}
        >
          <option value="all">All Time</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
          <option value="quarter">Last 90 Days</option>
        </select>

        <div style={styles.buttonGroup}>
          <button onClick={exportToCSV} style={styles.exportButton} title="Export as CSV">
            <span style={styles.buttonIcon}>📥</span>
            <span style={styles.buttonText}>Export</span>
          </button>
          <button onClick={printReport} style={styles.printButton} title="Print Report">
            <span style={styles.buttonIcon}>🖨️</span>
            <span style={styles.buttonText}>Print</span>
          </button>
          <button onClick={fetchData} style={styles.refreshButton} title="Refresh">
            <span style={styles.buttonIcon}>🔄</span>
            <span style={styles.buttonText}>Refresh</span>
          </button>
        </div>
      </div>

      {reportType === 'summary' && stats && (
        <div style={styles.summary}>
          <h3 style={styles.sectionTitle}>Summary Statistics</h3>
          
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <span style={styles.statIcon}>👥</span>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Total Vetted (#2)</p>
                <p style={styles.statValue}>{stats.totalVetted}</p>
              </div>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statIcon}>❌</span>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Not Recommended (#3)</p>
                <p style={styles.statValue}>{stats.notRecommended}</p>
              </div>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statIcon}>✅</span>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Recommended (#4)</p>
                <p style={styles.statValue}>{stats.recommended}</p>
              </div>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statIcon}>🎉</span>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Completed (#7)</p>
                <p style={styles.statValue}>{stats.completed}</p>
              </div>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statIcon}>⚠️</span>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Defaulted (#8)</p>
                <p style={styles.statValue}>{stats.defaulted}</p>
              </div>
            </div>
            <div style={styles.statCard}>
              <span style={styles.statIcon}>📋</span>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Active Cases</p>
                <p style={styles.statValue}>{stats.active}</p>
              </div>
            </div>
          </div>

          <div style={styles.chartsSection}>
            <div style={styles.chartCard}>
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

            <div style={styles.chartCard}>
              <h4 style={styles.subSectionTitle}>Recommendation Rate</h4>
              <div style={styles.progressBar}>
                <div style={{
                  ...styles.progress,
                  width: `${stats.totalVetted > 0 
                    ? (stats.recommended / stats.totalVetted) * 100 
                    : 0}%`,
                  backgroundColor: '#333333'
                }}>
                  {stats.totalVetted > 0 
                    ? ((stats.recommended / stats.totalVetted) * 100).toFixed(1) 
                    : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'offenders' && (
        <div style={styles.tableContainer}>
          <h3 style={styles.sectionTitle}>Offenders Report</h3>
          
          {/* Desktop Table View */}
          <div style={styles.desktopTable}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th} onClick={() => handleSort('firstName')}>
                    Name {sortConfig.key === 'firstName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={styles.th} onClick={() => handleSort('email')}>
                    Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={styles.th} onClick={() => handleSort('offenseType')}>
                    Offense {sortConfig.key === 'offenseType' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={styles.th} onClick={() => handleSort('riskLevel')}>
                    Risk {sortConfig.key === 'riskLevel' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={styles.th} onClick={() => handleSort('recommendedForCS')}>
                    Rec. {sortConfig.key === 'recommendedForCS' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={styles.th} onClick={() => handleSort('status')}>
                    Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={styles.th} onClick={() => handleSort('vettedBy')}>
                    Vetted By {sortConfig.key === 'vettedBy' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={styles.th} onClick={() => handleSort('createdAt')}>
                    Created {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(o => (
                  <tr key={o.id} style={styles.tableRow}>
                    <td style={styles.td}>{o.firstName} {o.lastName}</td>
                    <td style={styles.td}>{o.email}</td>
                    <td style={styles.td}>{o.offenseType}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.riskBadge,
                        backgroundColor: o.riskLevel === 'High' ? '#666666' :
                                      o.riskLevel === 'Medium' ? '#999999' : '#333333'
                      }}>
                        {o.riskLevel}
                      </span>
                    </td>
                    <td style={styles.td}>{o.recommendedForCS ? 'Yes' : 'No'}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: o.status === 'active' ? '#4CAF50' :
                                        o.status === 'completed' ? '#2196F3' :
                                        o.status === 'defaulted' ? '#f44336' : '#FF9800'
                      }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={styles.td}>{o.vettedBy}</td>
                    <td style={styles.td}>{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div style={styles.mobileCards}>
            {paginatedData.map(o => (
              <div key={o.id} style={styles.reportCard}>
                <div style={styles.cardHeader}>
                  <strong>{o.firstName} {o.lastName}</strong>
                  <span style={{
                    ...styles.cardStatus,
                    backgroundColor: o.status === 'active' ? '#4CAF50' :
                                   o.status === 'completed' ? '#2196F3' :
                                   o.status === 'defaulted' ? '#f44336' : '#FF9800'
                  }}>
                    {o.status}
                  </span>
                </div>
                <div style={styles.cardDetail}>
                  <span style={styles.cardLabel}>Email:</span>
                  <span style={styles.cardValue}>{o.email}</span>
                </div>
                <div style={styles.cardDetail}>
                  <span style={styles.cardLabel}>Offense:</span>
                  <span style={styles.cardValue}>{o.offenseType}</span>
                </div>
                <div style={styles.cardDetail}>
                  <span style={styles.cardLabel}>Risk:</span>
                  <span style={{
                    ...styles.cardRisk,
                    backgroundColor: o.riskLevel === 'High' ? '#666666' :
                                   o.riskLevel === 'Medium' ? '#999999' : '#333333'
                  }}>
                    {o.riskLevel}
                  </span>
                </div>
                <div style={styles.cardDetail}>
                  <span style={styles.cardLabel}>Recommended:</span>
                  <span style={styles.cardValue}>{o.recommendedForCS ? 'Yes' : 'No'}</span>
                </div>
                <div style={styles.cardDetail}>
                  <span style={styles.cardLabel}>Vetted By:</span>
                  <span style={styles.cardValue}>{o.vettedBy}</span>
                </div>
                <div style={styles.cardDetail}>
                  <span style={styles.cardLabel}>Created:</span>
                  <span style={styles.cardValue}>{new Date(o.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {filteredData.length > 0 && (
            <div style={styles.pagination}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={styles.pageButton}
              >
                ←
              </button>
              
              <div style={styles.pageNumbers}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                  <button
                    key={number}
                    onClick={() => setCurrentPage(number)}
                    style={{
                      ...styles.pageNumber,
                      ...(currentPage === number ? styles.activePage : {})
                    }}
                  >
                    {number}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={styles.pageButton}
              >
                →
              </button>
            </div>
          )}
        </div>
      )}

      {reportType === 'assignments' && (
        <div style={styles.tableContainer}>
          <h3 style={styles.sectionTitle}>Assignments Report</h3>
          
          {/* Desktop Table View */}
          <div style={styles.desktopTable}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th} onClick={() => handleSort('offenderName')}>
                    Offender {sortConfig.key === 'offenderName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={styles.th} onClick={() => handleSort('institution')}>
                    Institution {sortConfig.key === 'institution' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={styles.th} onClick={() => handleSort('startDate')}>
                    Start {sortConfig.key === 'startDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={styles.th} onClick={() => handleSort('endDate')}>
                    End {sortConfig.key === 'endDate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={styles.th} onClick={() => handleSort('hoursRequired')}>
                    Hours {sortConfig.key === 'hoursRequired' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={styles.th} onClick={() => handleSort('status')}>
                    Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={styles.th} onClick={() => handleSort('supervisor')}>
                    Supervisor {sortConfig.key === 'supervisor' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={styles.th} onClick={() => handleSort('assignedBy')}>
                    Assigned By {sortConfig.key === 'assignedBy' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(a => (
                  <tr key={a.id} style={styles.tableRow}>
                    <td style={styles.td}>{a.offenderName}</td>
                    <td style={styles.td}>{a.institution}</td>
                    <td style={styles.td}>{new Date(a.startDate).toLocaleDateString()}</td>
                    <td style={styles.td}>{a.endDate ? new Date(a.endDate).toLocaleDateString() : '-'}</td>
                    <td style={styles.td}>{a.hoursRequired}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: a.status === 'completed' ? '#4CAF50' :
                                        a.status === 'active' ? '#2196F3' :
                                        a.status === 'defaulted' ? '#f44336' : '#FF9800'
                      }}>
                        {a.status}
                      </span>
                    </td>
                    <td style={styles.td}>{a.supervisor}</td>
                    <td style={styles.td}>{a.assignedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div style={styles.mobileCards}>
            {paginatedData.map(a => (
              <div key={a.id} style={styles.reportCard}>
                <div style={styles.cardHeader}>
                  <strong>{a.offenderName}</strong>
                  <span style={{
                    ...styles.cardStatus,
                    backgroundColor: a.status === 'completed' ? '#4CAF50' :
                                    a.status === 'active' ? '#2196F3' :
                                    a.status === 'defaulted' ? '#f44336' : '#FF9800'
                  }}>
                    {a.status}
                  </span>
                </div>
                <div style={styles.cardDetail}>
                  <span style={styles.cardLabel}>Institution:</span>
                  <span style={styles.cardValue}>{a.institution}</span>
                </div>
                <div style={styles.cardDetail}>
                  <span style={styles.cardLabel}>Period:</span>
                  <span style={styles.cardValue}>
                    {new Date(a.startDate).toLocaleDateString()} - {a.endDate ? new Date(a.endDate).toLocaleDateString() : 'Present'}
                  </span>
                </div>
                <div style={styles.cardDetail}>
                  <span style={styles.cardLabel}>Hours:</span>
                  <span style={styles.cardValue}>{a.hoursRequired}</span>
                </div>
                <div style={styles.cardDetail}>
                  <span style={styles.cardLabel}>Supervisor:</span>
                  <span style={styles.cardValue}>{a.supervisor}</span>
                </div>
                <div style={styles.cardDetail}>
                  <span style={styles.cardLabel}>Assigned By:</span>
                  <span style={styles.cardValue}>{a.assignedBy}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {filteredData.length > 0 && (
            <div style={styles.pagination}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={styles.pageButton}
              >
                ←
              </button>
              
              <div style={styles.pageNumbers}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                  <button
                    key={number}
                    onClick={() => setCurrentPage(number)}
                    style={{
                      ...styles.pageNumber,
                      ...(currentPage === number ? styles.activePage : {})
                    }}
                  >
                    {number}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={styles.pageButton}
              >
                →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Items Per Page Selector */}
      {reportType !== 'summary' && filteredData.length > 0 && (
        <div style={styles.itemsPerPage}>
          <label htmlFor="itemsPerPage">Show:</label>
          <select
            id="itemsPerPage"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            style={styles.itemsPerPageSelect}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span>entries</span>
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
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
  },
  title: {
    fontSize: 'clamp(24px, 5vw, 28px)',
    marginBottom: 'clamp(16px, 3vw, 24px)',
    color: '#000000',
    fontWeight: '600',
    '@media (max-width: 480px)': {
      textAlign: 'center',
    }
  },
  controls: {
    display: 'flex',
    gap: 'clamp(8px, 2vw, 12px)',
    marginBottom: 'clamp(20px, 4vw, 30px)',
    flexWrap: 'wrap',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
    }
  },
  select: {
    flex: 1,
    minWidth: '180px',
    padding: 'clamp(10px, 2.5vw, 12px)',
    border: '1px solid #cccccc',
    borderRadius: '8px',
    fontSize: 'clamp(14px, 3vw, 16px)',
    backgroundColor: '#ffffff',
    color: '#000000',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease',
    ':focus': {
      outline: 'none',
      borderColor: '#000000',
    },
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    '@media (max-width: 768px)': {
      width: '100%',
    }
  },
  exportButton: {
    padding: 'clamp(10px, 2.5vw, 12px) clamp(16px, 3vw, 20px)',
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 3vw, 16px)',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#333333',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  printButton: {
    padding: 'clamp(10px, 2.5vw, 12px) clamp(16px, 3vw, 20px)',
    backgroundColor: '#333333',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 3vw, 16px)',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#444444',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  refreshButton: {
    padding: 'clamp(10px, 2.5vw, 12px) clamp(16px, 3vw, 20px)',
    backgroundColor: '#666666',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 3vw, 16px)',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#777777',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  buttonIcon: {
    fontSize: '16px',
  },
  buttonText: {
    '@media (max-width: 480px)': {
      display: 'none',
    },
  },
  summary: {
    backgroundColor: '#ffffff',
    padding: 'clamp(16px, 3vw, 20px)',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
  },
  sectionTitle: {
    fontSize: 'clamp(18px, 4vw, 20px)',
    marginBottom: 'clamp(16px, 3vw, 20px)',
    color: '#000000',
    fontWeight: '600',
  },
  subSectionTitle: {
    fontSize: 'clamp(15px, 3.5vw, 16px)',
    marginBottom: '12px',
    color: '#333333',
    fontWeight: '500',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 'clamp(12px, 2.5vw, 16px)',
    marginBottom: 'clamp(20px, 4vw, 30px)',
  },
  statCard: {
    backgroundColor: '#f8f8f8',
    padding: 'clamp(16px, 3vw, 20px)',
    borderRadius: '10px',
    border: '1px solid #e0e0e0',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: 'transform 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    },
  },
  statIcon: {
    fontSize: 'clamp(24px, 5vw, 32px)',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    color: '#666666',
    margin: '0 0 4px 0',
    fontSize: 'clamp(13px, 2.5vw, 14px)',
  },
  statValue: {
    fontSize: 'clamp(24px, 5vw, 32px)',
    fontWeight: 'bold',
    color: '#000000',
    margin: 0,
    lineHeight: 1.2,
  },
  chartsSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 'clamp(16px, 3vw, 20px)',
    marginTop: '20px',
  },
  chartCard: {
    backgroundColor: '#f8f8f8',
    padding: 'clamp(16px, 3vw, 20px)',
    borderRadius: '10px',
    border: '1px solid #e0e0e0',
  },
  progressBar: {
    width: '100%',
    height: '30px',
    backgroundColor: '#e0e0e0',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: '30px',
    fontSize: 'clamp(12px, 2.5vw, 14px)',
    fontWeight: '500',
    transition: 'width 0.3s ease',
    whiteSpace: 'nowrap',
  },
  tableContainer: {
    backgroundColor: '#ffffff',
    padding: 'clamp(16px, 3vw, 20px)',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
  },
  desktopTable: {
    overflow: 'auto',
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '800px',
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    borderBottom: '2px solid #e0e0e0',
  },
  th: {
    padding: 'clamp(10px, 2vw, 12px)',
    textAlign: 'left',
    fontSize: 'clamp(13px, 2.5vw, 14px)',
    fontWeight: '600',
    color: '#000000',
    borderBottom: '1px solid #e0e0e0',
    cursor: 'pointer',
    userSelect: 'none',
    ':hover': {
      backgroundColor: '#e8e8e8',
    },
  },
  tableRow: {
    borderBottom: '1px solid #f0f0f0',
    transition: 'background-color 0.2s ease',
    ':hover': {
      backgroundColor: '#f8f8f8',
    },
  },
  td: {
    padding: 'clamp(10px, 2vw, 12px)',
    fontSize: 'clamp(13px, 2.5vw, 14px)',
    color: '#333333',
    borderBottom: '1px solid #f0f0f0',
  },
  riskBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '500',
    display: 'inline-block',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '500',
    display: 'inline-block',
  },
  mobileCards: {
    display: 'none',
    '@media (max-width: 768px)': {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
  },
  reportCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: '10px',
    padding: '16px',
    border: '1px solid #e0e0e0',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e0e0e0',
  },
  cardStatus: {
    padding: '4px 10px',
    borderRadius: '20px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '500',
  },
  cardDetail: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  cardLabel: {
    color: '#666666',
    fontSize: '13px',
    fontWeight: '500',
  },
  cardValue: {
    color: '#000000',
    fontSize: '13px',
    textAlign: 'right',
    maxWidth: '60%',
    wordBreak: 'break-word',
  },
  cardRisk: {
    padding: '4px 10px',
    borderRadius: '20px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '500',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 'clamp(8px, 2vw, 16px)',
    marginTop: 'clamp(20px, 4vw, 24px)',
    flexWrap: 'wrap',
  },
  pageButton: {
    padding: '8px 16px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    color: '#000000',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    ':hover:not(:disabled)': {
      backgroundColor: '#e0e0e0',
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  pageNumbers: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  pageNumber: {
    minWidth: '36px',
    height: '36px',
    padding: '0 8px',
    backgroundColor: '#ffffff',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    color: '#000000',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f0f0f0',
    },
  },
  activePage: {
    backgroundColor: '#000000',
    color: '#ffffff',
    borderColor: '#000000',
    ':hover': {
      backgroundColor: '#333333',
    },
  },
  itemsPerPage: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '8px',
    marginTop: '16px',
    fontSize: '14px',
    color: '#666666',
  },
  itemsPerPageSelect: {
    padding: '4px 8px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
    color: '#000000',
    cursor: 'pointer',
  },
  loading: {
    textAlign: 'center',
    padding: 'clamp(30px, 8vw, 40px)',
    color: '#666666',
    backgroundColor: '#ffffff',
    fontSize: 'clamp(16px, 4vw, 18px)',
  },
};

export default AdminReports;