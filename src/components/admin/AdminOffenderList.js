import React, { useState, useEffect, useCallback } from 'react';
import { getOffenders, updateOffender, deleteOffender } from '../../utils/database';
import LoadingSpinner from '../common/LoadingSpinner';

const AdminOffenderList = () => {
  const [offenders, setOffenders] = useState([]);
  const [filteredOffenders, setFilteredOffenders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedOffender, setSelectedOffender] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    fetchOffenders();
  }, []);

  const filterOffenders = useCallback(() => {
    let filtered = [...offenders];

    if (searchTerm) {
      filtered = filtered.filter(o => 
        o.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.offenseType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      if (filterStatus === 'recommended') {
        filtered = filtered.filter(o => o.recommendedForCS === true);
      } else if (filterStatus === 'not-recommended') {
        filtered = filtered.filter(o => o.recommendedForCS === false);
      } else if (filterStatus === 'active') {
        filtered = filtered.filter(o => o.status === 'active');
      } else if (filterStatus === 'pending') {
        filtered = filtered.filter(o => o.status === 'pending');
      } else if (filterStatus === 'completed') {
        filtered = filtered.filter(o => o.status === 'completed');
      } else if (filterStatus === 'defaulted') {
        filtered = filtered.filter(o => o.status === 'defaulted');
      }
    }

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (sortConfig.key === 'name') {
          aValue = `${a.firstName} ${a.lastName}`;
          bValue = `${b.firstName} ${b.lastName}`;
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredOffenders(filtered);
    setCurrentPage(1);
  }, [offenders, searchTerm, filterStatus, sortConfig]);

  useEffect(() => {
    filterOffenders();
  }, [searchTerm, filterStatus, offenders, filterOffenders, sortConfig]);

  const fetchOffenders = async () => {
    setLoading(true);
    try {
      const data = await getOffenders();
      setOffenders(data);
      setFilteredOffenders(data);
    } catch (error) {
      console.error('Error fetching offenders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateOffender(id, { status: newStatus });
      fetchOffenders();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this offender?')) {
      try {
        await deleteOffender(id);
        fetchOffenders();
      } catch (error) {
        console.error('Error deleting offender:', error);
      }
    }
  };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'High': return '#dc2626';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'active':
        return { backgroundColor: '#e8f5e8', color: '#2e7d32', borderColor: '#a5d6a5' };
      case 'completed':
        return { backgroundColor: '#e3f2fd', color: '#1565c0', borderColor: '#90caf9' };
      case 'defaulted':
        return { backgroundColor: '#ffebee', color: '#c62828', borderColor: '#ef9a9a' };
      case 'pending':
        return { backgroundColor: '#fff3e0', color: '#ef6c00', borderColor: '#ffb74d' };
      default:
        return { backgroundColor: '#f5f5f5', color: '#616161', borderColor: '#e0e0e0' };
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOffenders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOffenders.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="admin-offender-list" style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Offender Management</h1>
          <span style={styles.subtitle}>Manage and monitor offender records</span>
        </div>
        <button onClick={fetchOffenders} style={styles.refreshButton}>
          <span style={styles.refreshText}>Refresh Data</span>
        </button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{offenders.length}</span>
          <span style={styles.statLabel}>Total Offenders</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{offenders.filter(o => o.recommendedForCS).length}</span>
          <span style={styles.statLabel}>Recommended</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{offenders.filter(o => !o.recommendedForCS).length}</span>
          <span style={styles.statLabel}>Not Recommended</span>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statValue}>{offenders.filter(o => o.status === 'active').length}</span>
          <span style={styles.statLabel}>Active Cases</span>
        </div>
      </div>

      <div style={styles.filters}>
        <div style={styles.searchWrapper}>
          <input
            type="text"
            placeholder="Search by name, email, or offense..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button 
              style={styles.clearSearch}
              onClick={() => setSearchTerm('')}
            >
              Clear
            </button>
          )}
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Offenders</option>
          <option value="recommended">Recommended for CS</option>
          <option value="not-recommended">Not Recommended</option>
          <option value="active">Active Cases</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="defaulted">Defaulted</option>
        </select>

        <div style={styles.resultsCount}>
          {filteredOffenders.length} results
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th} onClick={() => handleSort('name')}>
                <div style={styles.thContent}>
                  Name 
                  {sortConfig.key === 'name' && (
                    <span style={styles.sortIcon}>
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th style={styles.th}>Contact</th>
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
              <th style={styles.th}>Vetted By</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(offender => (
              <tr key={offender.id} style={styles.tableRow}>
                <td style={styles.td}>
                  <span style={styles.nameCell}>
                    {offender.firstName} {offender.lastName}
                  </span>
                </td>
                <td style={styles.td}>
                  <div style={styles.contactInfo}>
                    <span style={styles.contactEmail}>{offender.email}</span>
                    <span style={styles.contactPhone}>{offender.phone}</span>
                  </div>
                </td>
                <td style={styles.td}>
                  <span style={styles.offenseType}>{offender.offenseType}</span>
                </td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.riskBadge,
                    backgroundColor: getRiskColor(offender.riskLevel),
                    color: '#ffffff'
                  }}>
                    {offender.riskLevel}
                  </span>
                </td>
                <td style={styles.td}>
                  <select
                    value={offender.status || 'pending'}
                    onChange={(e) => handleStatusChange(offender.id, e.target.value)}
                    style={{
                      ...styles.statusSelect,
                      ...getStatusStyle(offender.status)
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="defaulted">Defaulted</option>
                  </select>
                </td>
                <td style={styles.td}>
                  <span style={styles.vettedBy}>{offender.vettedBy || '—'}</span>
                </td>
                <td style={styles.td}>
                  <div style={styles.actionButtons}>
                    <button 
                      onClick={() => {
                        setSelectedOffender(offender);
                        setShowDetails(true);
                      }}
                      style={styles.viewButton}
                    >
                      View
                    </button>
                    <button 
                      onClick={() => handleDelete(offender.id)}
                      style={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={styles.mobileCardContainer}>
        {currentItems.map(offender => (
          <div key={offender.id} style={styles.offenderCard}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <span style={styles.cardName}>
                  {offender.firstName} {offender.lastName}
                </span>
                <span style={{
                  ...styles.cardRiskBadge,
                  backgroundColor: getRiskColor(offender.riskLevel),
                  color: '#ffffff'
                }}>
                  {offender.riskLevel}
                </span>
              </div>
              <div style={styles.cardActions}>
                <button 
                  onClick={() => {
                    setSelectedOffender(offender);
                    setShowDetails(true);
                  }}
                  style={styles.cardViewButton}
                >
                  View
                </button>
                <button 
                  onClick={() => handleDelete(offender.id)}
                  style={styles.cardDeleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
            
            <div style={styles.cardDetails}>
              <div style={styles.cardDetail}>
                <span style={styles.cardDetailLabel}>Email</span>
                <span style={styles.cardDetailValue}>{offender.email}</span>
              </div>
              <div style={styles.cardDetail}>
                <span style={styles.cardDetailLabel}>Phone</span>
                <span style={styles.cardDetailValue}>{offender.phone}</span>
              </div>
              <div style={styles.cardDetail}>
                <span style={styles.cardDetailLabel}>Offense</span>
                <span style={styles.cardDetailValue}>{offender.offenseType}</span>
              </div>
              <div style={styles.cardDetail}>
                <span style={styles.cardDetailLabel}>Status</span>
                <select
                  value={offender.status || 'pending'}
                  onChange={(e) => handleStatusChange(offender.id, e.target.value)}
                  style={{
                    ...styles.cardStatusSelect,
                    ...getStatusStyle(offender.status)
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="defaulted">Defaulted</option>
                </select>
              </div>
              <div style={styles.cardDetail}>
                <span style={styles.cardDetailLabel}>Vetted By</span>
                <span style={styles.cardDetailValue}>{offender.vettedBy || '—'}</span>
              </div>
            </div>

            <div style={styles.cardFooter}>
              <span style={styles.cardFooterLabel}>Recommended:</span>
              <span style={offender.recommendedForCS ? styles.recommendedYes : styles.recommendedNo}>
                {offender.recommendedForCS ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredOffenders.length > 0 && (
        <div style={styles.pagination}>
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            style={styles.pageButton}
          >
            Previous
          </button>
          
          <div style={styles.pageNumbers}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
              <button
                key={number}
                onClick={() => paginate(number)}
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
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            style={styles.pageButton}
          >
            Next
          </button>

          <div style={styles.itemsPerPage}>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
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

      {showDetails && selectedOffender && (
        <div style={styles.modal} onClick={(e) => e.target === e.currentTarget && setShowDetails(false)}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Offender Details</h3>
                <p style={styles.modalSubtitle}>
                  {selectedOffender.firstName} {selectedOffender.lastName}
                </p>
              </div>
              <button onClick={() => setShowDetails(false)} style={styles.closeButton}>
                Close
              </button>
            </div>
            
            <div style={styles.details}>
              <div style={styles.detailGrid}>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Date of Birth</span>
                  <span style={styles.detailValue}>{selectedOffender.dateOfBirth}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Email</span>
                  <span style={styles.detailValue}>{selectedOffender.email}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Phone</span>
                  <span style={styles.detailValue}>{selectedOffender.phone}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Address</span>
                  <span style={styles.detailValue}>{selectedOffender.address}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Offense Type</span>
                  <span style={styles.detailValue}>{selectedOffender.offenseType}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Offense Date</span>
                  <span style={styles.detailValue}>{selectedOffender.offenseDate}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Sentence Length</span>
                  <span style={styles.detailValue}>{selectedOffender.sentenceLength} months</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Risk Level</span>
                  <span style={{
                    ...styles.riskBadge,
                    backgroundColor: getRiskColor(selectedOffender.riskLevel),
                    color: '#ffffff',
                    display: 'inline-block',
                    marginTop: '4px'
                  }}>
                    {selectedOffender.riskLevel}
                  </span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Previous Offenses</span>
                  <span style={styles.detailValue}>{selectedOffender.previousOffenses}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Employment</span>
                  <span style={styles.detailValue}>{selectedOffender.employmentStatus}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Education</span>
                  <span style={styles.detailValue}>{selectedOffender.educationLevel}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Substance Abuse</span>
                  <span style={selectedOffender.substanceAbuse ? styles.yesBadge : styles.noBadge}>
                    {selectedOffender.substanceAbuse ? 'Yes' : 'No'}
                  </span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Mental Health</span>
                  <span style={selectedOffender.mentalHealthIssues ? styles.yesBadge : styles.noBadge}>
                    {selectedOffender.mentalHealthIssues ? 'Yes' : 'No'}
                  </span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Family Support</span>
                  <span style={styles.detailValue}>{selectedOffender.familySupport}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Recommended for CS</span>
                  <span style={selectedOffender.recommendedForCS ? styles.recommendedYes : styles.recommendedNo}>
                    {selectedOffender.recommendedForCS ? 'Yes' : 'No'}
                  </span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Status</span>
                  <span style={{
                    ...styles.statusBadge,
                    ...getStatusStyle(selectedOffender.status)
                  }}>
                    {selectedOffender.status}
                  </span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Vetted By</span>
                  <span style={styles.detailValue}>{selectedOffender.vettedBy || '—'}</span>
                </div>
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Created</span>
                  <span style={styles.detailValue}>
                    {new Date(selectedOffender.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .admin-offender-list .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
          border-color: #cbd5e1;
        }
        
        .admin-offender-list .table-row:hover {
          background-color: #f8fafc;
        }
        
        .admin-offender-list .view-button:hover {
          background-color: #e2e8f0;
          border-color: #94a3b8;
        }
        
        .admin-offender-list .delete-button:hover {
          background-color: #ffcdd2;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
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
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: 'clamp(14px, 3vw, 16px)',
    color: '#64748b',
    fontWeight: '400',
  },
  refreshButton: {
    padding: '10px 20px',
    backgroundColor: '#ffffff',
    color: '#1e293b',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  refreshText: {
    fontWeight: '500',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchWrapper: {
    flex: 2,
    position: 'relative',
    minWidth: '250px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    boxSizing: 'border-box',
    transition: 'all 0.2s ease',
  },
  clearSearch: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    fontSize: '13px',
    padding: '4px 8px',
  },
  filterSelect: {
    flex: 1,
    padding: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    minWidth: '180px',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    cursor: 'pointer',
  },
  resultsCount: {
    padding: '8px 16px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  tableContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0',
    overflow: 'auto',
    marginBottom: '24px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '900px',
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
    borderBottom: '2px solid #e2e8f0',
  },
  th: {
    padding: '16px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    color: '#475569',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background-color 0.2s ease',
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
  },
  td: {
    padding: '16px',
    fontSize: '14px',
    color: '#334155',
  },
  nameCell: {
    fontWeight: '500',
    color: '#0f172a',
  },
  contactInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  contactEmail: {
    color: '#0f172a',
    wordBreak: 'break-all',
    fontSize: '13px',
  },
  contactPhone: {
    color: '#64748b',
    fontSize: '12px',
  },
  offenseType: {
    color: '#334155',
  },
  riskBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'inline-block',
    whiteSpace: 'nowrap',
  },
  statusSelect: {
    padding: '6px 10px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%',
    maxWidth: '120px',
  },
  vettedBy: {
    color: '#64748b',
    fontSize: '13px',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
  },
  viewButton: {
    padding: '6px 12px',
    backgroundColor: '#f1f5f9',
    color: '#334155',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#ffebee',
    color: '#c62828',
    border: '1px solid #ffcdd2',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  mobileCardContainer: {
    display: 'none',
  },
  offenderCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
    transition: 'all 0.2s ease',
    marginBottom: '16px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px',
  },
  cardTitle: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  cardName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0f172a',
  },
  cardRiskBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    alignSelf: 'flex-start',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
  },
  cardViewButton: {
    padding: '6px 12px',
    backgroundColor: '#f1f5f9',
    color: '#334155',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  cardDeleteButton: {
    padding: '6px 12px',
    backgroundColor: '#ffebee',
    color: '#c62828',
    border: '1px solid #ffcdd2',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  cardDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '12px',
  },
  cardDetail: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
    borderBottom: '1px solid #f1f5f9',
  },
  cardDetailLabel: {
    color: '#64748b',
    fontSize: '13px',
    fontWeight: '500',
  },
  cardDetailValue: {
    color: '#0f172a',
    fontSize: '13px',
    textAlign: 'right',
    wordBreak: 'break-word',
    maxWidth: '60%',
  },
  cardStatusSelect: {
    padding: '4px 8px',
    border: '1px solid #e2e8f0',
    borderRadius: '4px',
    fontSize: '13px',
    width: '120px',
    cursor: 'pointer',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '8px',
    borderTop: '1px solid #f1f5f9',
  },
  cardFooterLabel: {
    color: '#64748b',
    fontSize: '13px',
  },
  recommendedYes: {
    color: '#10b981',
    fontWeight: '600',
    fontSize: '13px',
  },
  recommendedNo: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: '13px',
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
    borderRadius: '8px',
    color: '#334155',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
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
    borderRadius: '8px',
    color: '#334155',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  activePage: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    borderColor: '#0f172a',
  },
  itemsPerPage: {
    marginLeft: 'auto',
  },
  itemsPerPageSelect: {
    padding: '8px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    backgroundColor: '#ffffff',
    color: '#334155',
    cursor: 'pointer',
    fontSize: '14px',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '16px',
    animation: 'fadeIn 0.2s ease',
    backdropFilter: 'blur(4px)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    maxWidth: '800px',
    width: '100%',
    maxHeight: '85vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
    animation: 'slideUp 0.3s ease',
  },
  modalHeader: {
    padding: '24px 24px 16px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    margin: '0 0 4px 0',
    fontSize: '20px',
    fontWeight: '600',
    color: '#0f172a',
  },
  modalSubtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#64748b',
  },
  closeButton: {
    background: 'none',
    border: '1px solid #e2e8f0',
    fontSize: '14px',
    cursor: 'pointer',
    color: '#64748b',
    padding: '6px 12px',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
  },
  details: {
    padding: '24px',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #f1f5f9',
  },
  detailLabel: {
    fontSize: '12px',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: '14px',
    color: '#0f172a',
    fontWeight: '500',
    wordBreak: 'break-word',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'inline-block',
    width: 'fit-content',
  },
  yesBadge: {
    padding: '2px 8px',
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'inline-block',
    width: 'fit-content',
  },
  noBadge: {
    padding: '2px 8px',
    backgroundColor: '#ffebee',
    color: '#c62828',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'inline-block',
    width: 'fit-content',
  },
};

export default AdminOffenderList;