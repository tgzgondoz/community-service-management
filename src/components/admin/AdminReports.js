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
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>Loading reports...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Reports & Analytics</h1>
          <span style={styles.subtitle}>View and export system data</span>
        </div>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <div style={styles.controlGroup}>
          <label style={styles.controlLabel}>Report Type</label>
          <select
            value={reportType}
            onChange={(e) => {
              setReportType(e.target.value);
              setCurrentPage(1);
              setSortConfig({ key: null, direction: 'asc' });
            }}
            style={styles.select}
          >
            <option value="summary">Summary Report</option>
            <option value="offenders">Offenders Report</option>
            <option value="assignments">Assignments Report</option>
          </select>
        </div>

        <div style={styles.controlGroup}>
          <label style={styles.controlLabel}>Date Range</label>
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
        </div>

        <div style={styles.actionButtons}>
          <button onClick={exportToCSV} style={styles.exportButton}>
            <span style={styles.buttonText}>Export CSV</span>
          </button>
          <button onClick={printReport} style={styles.printButton}>
            <span style={styles.buttonText}>Print</span>
          </button>
          <button onClick={fetchData} style={styles.refreshButton}>
            <span style={styles.buttonText}>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Report */}
      {reportType === 'summary' && stats && (
        <div style={styles.summary}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Summary Statistics</h2>
            <span style={styles.sectionBadge}>
              Updated {new Date().toLocaleDateString()}
            </span>
          </div>
          
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statContent}>
                <span style={styles.statValue}>{stats.totalVetted}</span>
                <span style={styles.statLabel}>Total Vetted</span>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statContent}>
                <span style={styles.statValue}>{stats.notRecommended}</span>
                <span style={styles.statLabel}>Not Recommended</span>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statContent}>
                <span style={styles.statValue}>{stats.recommended}</span>
                <span style={styles.statLabel}>Recommended</span>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statContent}>
                <span style={styles.statValue}>{stats.completed}</span>
                <span style={styles.statLabel}>Completed</span>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statContent}>
                <span style={styles.statValue}>{stats.defaulted}</span>
                <span style={styles.statLabel}>Defaulted</span>
              </div>
            </div>
            
            <div style={styles.statCard}>
              <div style={styles.statContent}>
                <span style={styles.statValue}>{stats.active}</span>
                <span style={styles.statLabel}>Active Cases</span>
              </div>
            </div>
          </div>

          <div style={styles.analyticsGrid}>
            <div style={styles.analyticsCard}>
              <h3 style={styles.analyticsTitle}>Completion Rate</h3>
              <div style={styles.metricValue}>
                {stats.completed + stats.defaulted > 0 
                  ? ((stats.completed / (stats.completed + stats.defaulted)) * 100).toFixed(1)
                  : 0}%
              </div>
              <div style={styles.progressBar}>
                <div style={{
                  ...styles.progressFill,
                  width: `${stats.completed + stats.defaulted > 0 
                    ? (stats.completed / (stats.completed + stats.defaulted)) * 100 
                    : 0}%`,
                  backgroundColor: '#10b981'
                }} />
              </div>
              <div style={styles.metricLegend}>
                <span style={styles.legendItem}>
                  <span style={{...styles.legendDot, backgroundColor: '#10b981'}} />
                  Completed ({stats.completed})
                </span>
                <span style={styles.legendItem}>
                  <span style={{...styles.legendDot, backgroundColor: '#ef4444'}} />
                  Defaulted ({stats.defaulted})
                </span>
              </div>
            </div>

            <div style={styles.analyticsCard}>
              <h3 style={styles.analyticsTitle}>Recommendation Rate</h3>
              <div style={styles.metricValue}>
                {stats.totalVetted > 0 
                  ? ((stats.recommended / stats.totalVetted) * 100).toFixed(1)
                  : 0}%
              </div>
              <div style={styles.progressBar}>
                <div style={{
                  ...styles.progressFill,
                  width: `${stats.totalVetted > 0 
                    ? (stats.recommended / stats.totalVetted) * 100 
                    : 0}%`,
                  backgroundColor: '#3b82f6'
                }} />
              </div>
              <div style={styles.metricLegend}>
                <span style={styles.legendItem}>
                  <span style={{...styles.legendDot, backgroundColor: '#3b82f6'}} />
                  Recommended ({stats.recommended})
                </span>
                <span style={styles.legendItem}>
                  <span style={{...styles.legendDot, backgroundColor: '#6b7280'}} />
                  Not Recommended ({stats.notRecommended})
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offenders Report */}
      {reportType === 'offenders' && (
        <div style={styles.reportContainer}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Offenders Report</h2>
            <span style={styles.resultCount}>
              {filteredData.length} records
            </span>
          </div>
          
          {/* Desktop Table View */}
          <div style={styles.desktopTable}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th} onClick={() => handleSort('firstName')}>
                    <div style={styles.thContent}>
                      Name 
                      {sortConfig.key === 'firstName' && (
                        <span style={styles.sortIcon}>
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th style={styles.th} onClick={() => handleSort('email')}>
                    <div style={styles.thContent}>
                      Email
                      {sortConfig.key === 'email' && (
                        <span style={styles.sortIcon}>
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th style={styles.th} onClick={() => handleSort('offenseType')}>
                    <div style={styles.thContent}>
                      Offense
                      {sortConfig.key === 'offenseType' && (
                        <span style={styles.sortIcon}>
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th style={styles.th} onClick={() => handleSort('riskLevel')}>
                    <div style={styles.thContent}>
                      Risk
                      {sortConfig.key === 'riskLevel' && (
                        <span style={styles.sortIcon}>
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th style={styles.th} onClick={() => handleSort('recommendedForCS')}>
                    <div style={styles.thContent}>
                      Rec.
                      {sortConfig.key === 'recommendedForCS' && (
                        <span style={styles.sortIcon}>
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th style={styles.th} onClick={() => handleSort('status')}>
                    <div style={styles.thContent}>
                      Status
                      {sortConfig.key === 'status' && (
                        <span style={styles.sortIcon}>
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th style={styles.th} onClick={() => handleSort('vettedBy')}>
                    <div style={styles.thContent}>
                      Vetted By
                      {sortConfig.key === 'vettedBy' && (
                        <span style={styles.sortIcon}>
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th style={styles.th} onClick={() => handleSort('createdAt')}>
                    <div style={styles.thContent}>
                      Created
                      {sortConfig.key === 'createdAt' && (
                        <span style={styles.sortIcon}>
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(o => (
                  <tr key={o.id} style={styles.tableRow}>
                    <td style={styles.td}>
                      <span style={styles.nameCell}>
                        {o.firstName} {o.lastName}
                      </span>
                    </td>
                    <td style={styles.td}>{o.email}</td>
                    <td style={styles.td}>{o.offenseType}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.riskBadge,
                        backgroundColor: o.riskLevel === 'High' ? '#dc2626' :
                                      o.riskLevel === 'Medium' ? '#f59e0b' : '#10b981'
                      }}>
                        {o.riskLevel}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={o.recommendedForCS ? styles.yesBadge : styles.noBadge}>
                        {o.recommendedForCS ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        ...getStatusStyle(o.status)
                      }}>
                        {o.status}
                      </span>
                    </td>
                    <td style={styles.td}>{o.vettedBy || '—'}</td>
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
                  <span style={styles.cardName}>
                    {o.firstName} {o.lastName}
                  </span>
                  <span style={{
                    ...styles.cardStatus,
                    ...getStatusStyle(o.status)
                  }}>
                    {o.status}
                  </span>
                </div>
                
                <div style={styles.cardBody}>
                  <div style={styles.cardRow}>
                    <span style={styles.cardLabel}>Email</span>
                    <span style={styles.cardValue}>{o.email}</span>
                  </div>
                  <div style={styles.cardRow}>
                    <span style={styles.cardLabel}>Offense</span>
                    <span style={styles.cardValue}>{o.offenseType}</span>
                  </div>
                  <div style={styles.cardRow}>
                    <span style={styles.cardLabel}>Risk</span>
                    <span style={{
                      ...styles.cardRisk,
                      backgroundColor: o.riskLevel === 'High' ? '#dc2626' :
                                     o.riskLevel === 'Medium' ? '#f59e0b' : '#10b981'
                    }}>
                      {o.riskLevel}
                    </span>
                  </div>
                  <div style={styles.cardRow}>
                    <span style={styles.cardLabel}>Recommended</span>
                    <span style={o.recommendedForCS ? styles.yesBadge : styles.noBadge}>
                      {o.recommendedForCS ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div style={styles.cardRow}>
                    <span style={styles.cardLabel}>Vetted By</span>
                    <span style={styles.cardValue}>{o.vettedBy || '—'}</span>
                  </div>
                  <div style={styles.cardRow}>
                    <span style={styles.cardLabel}>Created</span>
                    <span style={styles.cardValue}>{new Date(o.createdAt).toLocaleDateString()}</span>
                  </div>
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
                Previous
              </button>
              
              <div style={styles.pageNumbers}>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        ...styles.pageNumber,
                        ...(currentPage === pageNum ? styles.activePage : {})
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={styles.pageButton}
              >
                Next
              </button>

              <div style={styles.itemsPerPage}>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={styles.itemsPerPageSelect}
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assignments Report */}
      {reportType === 'assignments' && (
        <div style={styles.reportContainer}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Assignments Report</h2>
            <span style={styles.resultCount}>
              {filteredData.length} records
            </span>
          </div>
          
          {/* Desktop Table View */}
          <div style={styles.desktopTable}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th} onClick={() => handleSort('offenderName')}>
                    <div style={styles.thContent}>
                      Offender
                      {sortConfig.key === 'offenderName' && (
                        <span style={styles.sortIcon}>
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th style={styles.th} onClick={() => handleSort('institution')}>
                    <div style={styles.thContent}>
                      Institution
                      {sortConfig.key === 'institution' && (
                        <span style={styles.sortIcon}>
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th style={styles.th} onClick={() => handleSort('startDate')}>
                    <div style={styles.thContent}>
                      Start Date
                      {sortConfig.key === 'startDate' && (
                        <span style={styles.sortIcon}>
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th style={styles.th} onClick={() => handleSort('endDate')}>
                    <div style={styles.thContent}>
                      End Date
                      {sortConfig.key === 'endDate' && (
                        <span style={styles.sortIcon}>
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th style={styles.th} onClick={() => handleSort('hoursRequired')}>
                    <div style={styles.thContent}>
                      Hours
                      {sortConfig.key === 'hoursRequired' && (
                        <span style={styles.sortIcon}>
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th style={styles.th} onClick={() => handleSort('status')}>
                    <div style={styles.thContent}>
                      Status
                      {sortConfig.key === 'status' && (
                        <span style={styles.sortIcon}>
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th style={styles.th} onClick={() => handleSort('supervisor')}>
                    <div style={styles.thContent}>
                      Supervisor
                      {sortConfig.key === 'supervisor' && (
                        <span style={styles.sortIcon}>
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th style={styles.th} onClick={() => handleSort('assignedBy')}>
                    <div style={styles.thContent}>
                      Assigned By
                      {sortConfig.key === 'assignedBy' && (
                        <span style={styles.sortIcon}>
                          {sortConfig.direction === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map(a => (
                  <tr key={a.id} style={styles.tableRow}>
                    <td style={styles.td}>
                      <span style={styles.nameCell}>{a.offenderName}</span>
                    </td>
                    <td style={styles.td}>{a.institution}</td>
                    <td style={styles.td}>{new Date(a.startDate).toLocaleDateString()}</td>
                    <td style={styles.td}>{a.endDate ? new Date(a.endDate).toLocaleDateString() : '—'}</td>
                    <td style={styles.td}>{a.hoursRequired}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        ...getAssignmentStatusStyle(a.status)
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
                  <span style={styles.cardName}>{a.offenderName}</span>
                  <span style={{
                    ...styles.cardStatus,
                    ...getAssignmentStatusStyle(a.status)
                  }}>
                    {a.status}
                  </span>
                </div>
                
                <div style={styles.cardBody}>
                  <div style={styles.cardRow}>
                    <span style={styles.cardLabel}>Institution</span>
                    <span style={styles.cardValue}>{a.institution}</span>
                  </div>
                  <div style={styles.cardRow}>
                    <span style={styles.cardLabel}>Period</span>
                    <span style={styles.cardValue}>
                      {new Date(a.startDate).toLocaleDateString()} - {a.endDate ? new Date(a.endDate).toLocaleDateString() : 'Present'}
                    </span>
                  </div>
                  <div style={styles.cardRow}>
                    <span style={styles.cardLabel}>Hours</span>
                    <span style={styles.cardValue}>{a.hoursRequired}</span>
                  </div>
                  <div style={styles.cardRow}>
                    <span style={styles.cardLabel}>Supervisor</span>
                    <span style={styles.cardValue}>{a.supervisor}</span>
                  </div>
                  <div style={styles.cardRow}>
                    <span style={styles.cardLabel}>Assigned By</span>
                    <span style={styles.cardValue}>{a.assignedBy}</span>
                  </div>
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
                Previous
              </button>
              
              <div style={styles.pageNumbers}>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      style={{
                        ...styles.pageNumber,
                        ...(currentPage === pageNum ? styles.activePage : {})
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={styles.pageButton}
              >
                Next
              </button>

              <div style={styles.itemsPerPage}>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  style={styles.itemsPerPageSelect}
                >
                  <option value={5}>5 per page</option>
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function for status styles
const getStatusStyle = (status) => {
  switch (status) {
    case 'active':
      return { backgroundColor: '#e8f5e8', color: '#2e7d32' };
    case 'completed':
      return { backgroundColor: '#e3f2fd', color: '#1565c0' };
    case 'defaulted':
      return { backgroundColor: '#ffebee', color: '#c62828' };
    case 'pending':
      return { backgroundColor: '#fff3e0', color: '#ef6c00' };
    default:
      return { backgroundColor: '#f5f5f5', color: '#616161' };
  }
};

const getAssignmentStatusStyle = (status) => {
  switch (status) {
    case 'completed':
      return { backgroundColor: '#e8f5e8', color: '#2e7d32' };
    case 'active':
      return { backgroundColor: '#e3f2fd', color: '#1565c0' };
    case 'defaulted':
      return { backgroundColor: '#ffebee', color: '#c62828' };
    case 'new':
      return { backgroundColor: '#fff3e0', color: '#ef6c00' };
    default:
      return { backgroundColor: '#f5f5f5', color: '#616161' };
  }
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
    '@media (max-width: 768px)': {
      padding: '24px 16px',
    },
    '@media (max-width: 480px)': {
      padding: '20px 12px',
    }
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  title: {
    fontSize: 'clamp(28px, 5vw, 32px)',
    color: '#0f172a',
    margin: 0,
    fontWeight: '600',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: 'clamp(14px, 3vw, 16px)',
    color: '#64748b',
  },
  controls: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
    }
  },
  controlGroup: {
    flex: 1,
    minWidth: '180px',
  },
  controlLabel: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':focus': {
      outline: 'none',
      borderColor: '#0f172a',
      boxShadow: '0 0 0 3px rgba(15,23,42,0.1)',
    },
    ':disabled': {
      backgroundColor: '#f8fafc',
      cursor: 'not-allowed',
    },
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    marginLeft: 'auto',
    '@media (max-width: 768px)': {
      marginLeft: 0,
      width: '100%',
    }
  },
  exportButton: {
    padding: '10px 16px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#1e293b',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  printButton: {
    padding: '10px 16px',
    backgroundColor: '#ffffff',
    color: '#475569',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f8fafc',
      borderColor: '#94a3b8',
      transform: 'translateY(-1px)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  refreshButton: {
    padding: '10px 16px',
    backgroundColor: '#ffffff',
    color: '#475569',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f8fafc',
      borderColor: '#94a3b8',
      transform: 'translateY(-1px)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  buttonText: {
    fontWeight: '500',
  },
  summary: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '18px',
    color: '#0f172a',
    margin: 0,
    fontWeight: '600',
  },
  sectionBadge: {
    padding: '4px 12px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.2s ease',
    textAlign: 'center',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
      borderColor: '#cbd5e1',
    },
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: '14px',
    color: '#64748b',
  },
  analyticsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  analyticsCard: {
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
  },
  analyticsTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    color: '#0f172a',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: '32px',
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: '12px',
  },
  progressBar: {
    height: '8px',
    backgroundColor: '#e2e8f0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '12px',
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  metricLegend: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#64748b',
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  reportContainer: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  resultCount: {
    padding: '4px 12px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500',
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
    minWidth: '1000px',
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
    borderBottom: '2px solid #e2e8f0',
  },
  th: {
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '600',
    color: '#475569',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background-color 0.2s ease',
    ':hover': {
      backgroundColor: '#f1f5f9',
    },
  },
  thContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  sortIcon: {
    color: '#0f172a',
    fontSize: '14px',
  },
  tableRow: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.2s ease',
    ':hover': {
      backgroundColor: '#f8fafc',
    },
  },
  td: {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#334155',
  },
  nameCell: {
    fontWeight: '500',
    color: '#0f172a',
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
    fontSize: '12px',
    fontWeight: '500',
    display: 'inline-block',
  },
  yesBadge: {
    padding: '4px 10px',
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'inline-block',
  },
  noBadge: {
    padding: '4px 10px',
    backgroundColor: '#ffebee',
    color: '#c62828',
    borderRadius: '20px',
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
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #f1f5f9',
  },
  cardName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#0f172a',
  },
  cardStatus: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
  },
  cardLabel: {
    color: '#64748b',
    fontWeight: '500',
  },
  cardValue: {
    color: '#0f172a',
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
    gap: '16px',
    marginTop: '24px',
    flexWrap: 'wrap',
  },
  pageButton: {
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    color: '#334155',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    ':hover:not(:disabled)': {
      backgroundColor: '#f8fafc',
      borderColor: '#94a3b8',
      transform: 'translateY(-1px)',
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
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    color: '#334155',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f8fafc',
      borderColor: '#94a3b8',
    },
  },
  activePage: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    borderColor: '#0f172a',
    ':hover': {
      backgroundColor: '#1e293b',
    },
  },
  itemsPerPage: {
    marginLeft: 'auto',
  },
  itemsPerPageSelect: {
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    color: '#334155',
    cursor: 'pointer',
    fontSize: '14px',
    ':focus': {
      outline: 'none',
      borderColor: '#0f172a',
    },
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    gap: '16px',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #f1f5f9',
    borderTopColor: '#0f172a',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    color: '#64748b',
    fontSize: '16px',
  },
};

// Add global animations
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media print {
    body * {
      visibility: hidden;
    }
    .report-container, .report-container * {
      visibility: visible;
    }
    .report-container {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
    }
  }
`;
document.head.appendChild(style);

export default AdminReports;