import React, { useState, useEffect, useCallback } from 'react';
import { getOffenders, updateOffender, deleteOffender } from '../../utils/database';

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

  // Wrap filterOffenders in useCallback to prevent unnecessary re-renders
  const filterOffenders = useCallback(() => {
    let filtered = [...offenders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(o => 
        o.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.offenseType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
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

    // Sorting
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
    setCurrentPage(1); // Reset to first page on filter change
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
      case 'High': return '#666666';
      case 'Medium': return '#999999';
      case 'Low': return '#333333';
      default: return '#cccccc';
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOffenders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOffenders.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return <div style={styles.loading}>Loading offenders...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Offender Management (#2)</h2>

      <div style={styles.filters}>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>🔍</span>
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
              ✕
            </button>
          )}
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Offenders</option>
          <option value="recommended">Recommended (#4)</option>
          <option value="not-recommended">Not Recommended (#3)</option>
          <option value="active">Active Cases</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="defaulted">Defaulted</option>
        </select>

        <button onClick={fetchOffenders} style={styles.refreshButton} title="Refresh">
          <span style={styles.refreshIcon}>🔄</span>
          <span style={styles.refreshText}>Refresh</span>
        </button>
      </div>

      <div style={styles.stats}>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Total:</span>
          <span style={styles.statValue}>{offenders.length}</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Recommended:</span>
          <span style={styles.statValue}>{offenders.filter(o => o.recommendedForCS).length}</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Not Recommended:</span>
          <span style={styles.statValue}>{offenders.filter(o => !o.recommendedForCS).length}</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statLabel}>Active:</span>
          <span style={styles.statValue}>{offenders.filter(o => o.status === 'active').length}</span>
        </div>
      </div>

      {/* Table View - Desktop */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th} onClick={() => handleSort('name')}>
                Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th style={styles.th}>Contact</th>
              <th style={styles.th} onClick={() => handleSort('offenseType')}>
                Offense {sortConfig.key === 'offenseType' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th style={styles.th} onClick={() => handleSort('riskLevel')}>
                Risk {sortConfig.key === 'riskLevel' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th style={styles.th} onClick={() => handleSort('status')}>
                Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th style={styles.th}>Vetted By</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map(offender => (
              <tr key={offender.id} style={styles.tableRow}>
                <td style={styles.td}>
                  <strong>{offender.firstName} {offender.lastName}</strong>
                </td>
                <td style={styles.td}>
                  <div style={styles.contactInfo}>
                    <div style={styles.contactEmail}>{offender.email}</div>
                    <small style={styles.contactPhone}>{offender.phone}</small>
                  </div>
                </td>
                <td style={styles.td}>{offender.offenseType}</td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.riskBadge,
                    backgroundColor: getRiskColor(offender.riskLevel)
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
                <td style={styles.td}>{offender.vettedBy || 'N/A'}</td>
                <td style={styles.td}>
                  <div style={styles.actionButtons}>
                    <button 
                      onClick={() => {
                        setSelectedOffender(offender);
                        setShowDetails(true);
                      }}
                      style={styles.viewButton}
                      title="View Details"
                    >
                      👁️
                    </button>
                    <button 
                      onClick={() => handleDelete(offender.id)}
                      style={styles.deleteButton}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Card View - Mobile */}
      <div style={styles.mobileCardContainer}>
        {currentItems.map(offender => (
          <div key={offender.id} style={styles.offenderCard}>
            <div style={styles.cardHeader}>
              <div style={styles.cardTitle}>
                <strong>{offender.firstName} {offender.lastName}</strong>
                <span style={{
                  ...styles.cardRiskBadge,
                  backgroundColor: getRiskColor(offender.riskLevel)
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
                  title="View Details"
                >
                  👁️
                </button>
                <button 
                  onClick={() => handleDelete(offender.id)}
                  style={styles.cardDeleteButton}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
            
            <div style={styles.cardDetails}>
              <div style={styles.cardDetail}>
                <span style={styles.cardDetailLabel}>Email:</span>
                <span style={styles.cardDetailValue}>{offender.email}</span>
              </div>
              <div style={styles.cardDetail}>
                <span style={styles.cardDetailLabel}>Phone:</span>
                <span style={styles.cardDetailValue}>{offender.phone}</span>
              </div>
              <div style={styles.cardDetail}>
                <span style={styles.cardDetailLabel}>Offense:</span>
                <span style={styles.cardDetailValue}>{offender.offenseType}</span>
              </div>
              <div style={styles.cardDetail}>
                <span style={styles.cardDetailLabel}>Status:</span>
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
                <span style={styles.cardDetailLabel}>Vetted By:</span>
                <span style={styles.cardDetailValue}>{offender.vettedBy || 'N/A'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {filteredOffenders.length > 0 && (
        <div style={styles.pagination}>
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            style={styles.pageButton}
          >
            ←
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
            →
          </button>
        </div>
      )}

      {/* Items Per Page Selector */}
      <div style={styles.itemsPerPage}>
        <label htmlFor="itemsPerPage">Show:</label>
        <select
          id="itemsPerPage"
          value={itemsPerPage}
          onChange={(e) => setItemsPerPage(Number(e.target.value))}
          style={styles.itemsPerPageSelect}
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
        <span>entries</span>
      </div>

      {/* Details Modal */}
      {showDetails && selectedOffender && (
        <div style={styles.modal} onClick={(e) => e.target === e.currentTarget && setShowDetails(false)}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Offender Details</h3>
            <button onClick={() => setShowDetails(false)} style={styles.closeButton}>×</button>
            
            <div style={styles.details}>
              <div style={styles.detailGrid}>
                <p style={styles.detailItem}><strong>Name:</strong> {selectedOffender.firstName} {selectedOffender.lastName}</p>
                <p style={styles.detailItem}><strong>Date of Birth:</strong> {selectedOffender.dateOfBirth}</p>
                <p style={styles.detailItem}><strong>Email:</strong> {selectedOffender.email}</p>
                <p style={styles.detailItem}><strong>Phone:</strong> {selectedOffender.phone}</p>
                <p style={styles.detailItem}><strong>Address:</strong> {selectedOffender.address}</p>
                <p style={styles.detailItem}><strong>Offense Type:</strong> {selectedOffender.offenseType}</p>
                <p style={styles.detailItem}><strong>Offense Date:</strong> {selectedOffender.offenseDate}</p>
                <p style={styles.detailItem}><strong>Sentence Length:</strong> {selectedOffender.sentenceLength} months</p>
                <p style={styles.detailItem}><strong>Risk Level:</strong> {selectedOffender.riskLevel}</p>
                <p style={styles.detailItem}><strong>Previous Offenses:</strong> {selectedOffender.previousOffenses}</p>
                <p style={styles.detailItem}><strong>Employment Status:</strong> {selectedOffender.employmentStatus}</p>
                <p style={styles.detailItem}><strong>Education Level:</strong> {selectedOffender.educationLevel}</p>
                <p style={styles.detailItem}><strong>Substance Abuse:</strong> {selectedOffender.substanceAbuse ? 'Yes' : 'No'}</p>
                <p style={styles.detailItem}><strong>Mental Health Issues:</strong> {selectedOffender.mentalHealthIssues ? 'Yes' : 'No'}</p>
                <p style={styles.detailItem}><strong>Family Support:</strong> {selectedOffender.familySupport}</p>
                <p style={styles.detailItem}><strong>Recommended for CS:</strong> {selectedOffender.recommendedForCS ? 'Yes' : 'No'}</p>
                <p style={styles.detailItem}><strong>Status:</strong> {selectedOffender.status}</p>
                <p style={styles.detailItem}><strong>Vetted By:</strong> {selectedOffender.vettedBy}</p>
                <p style={styles.detailItem}><strong>Created:</strong> {new Date(selectedOffender.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
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
      return {};
  }
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
  filters: {
    display: 'flex',
    gap: 'clamp(8px, 2vw, 12px)',
    marginBottom: 'clamp(16px, 3vw, 24px)',
    flexWrap: 'wrap',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
    }
  },
  searchWrapper: {
    flex: 2,
    position: 'relative',
    minWidth: '200px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#999999',
    fontSize: '16px',
  },
  searchInput: {
    width: '100%',
    padding: 'clamp(10px, 2.5vw, 12px) clamp(10px, 2.5vw, 12px) clamp(10px, 2.5vw, 12px) 40px',
    border: '1px solid #cccccc',
    borderRadius: '8px',
    fontSize: 'clamp(14px, 3vw, 16px)',
    backgroundColor: '#ffffff',
    color: '#000000',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s ease',
    ':focus': {
      outline: 'none',
      borderColor: '#000000',
    },
  },
  clearSearch: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#999999',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '4px',
    ':hover': {
      color: '#000000',
    },
  },
  filterSelect: {
    flex: 1,
    padding: 'clamp(10px, 2.5vw, 12px)',
    border: '1px solid #cccccc',
    borderRadius: '8px',
    fontSize: 'clamp(14px, 3vw, 16px)',
    minWidth: '150px',
    backgroundColor: '#ffffff',
    color: '#000000',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease',
    ':focus': {
      outline: 'none',
      borderColor: '#000000',
    },
  },
  refreshButton: {
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
    gap: '8px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#333333',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
    '@media (max-width: 768px)': {
      justifyContent: 'center',
    },
  },
  refreshIcon: {
    fontSize: '16px',
  },
  refreshText: {
    '@media (max-width: 480px)': {
      display: 'none',
    },
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 'clamp(12px, 2vw, 16px)',
    marginBottom: 'clamp(16px, 3vw, 24px)',
    padding: 'clamp(12px, 2.5vw, 16px)',
    backgroundColor: '#f8f8f8',
    borderRadius: '12px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    border: '1px solid #e0e0e0',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: 'clamp(8px, 2vw, 12px)',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  statLabel: {
    fontSize: 'clamp(12px, 2.5vw, 14px)',
    color: '#666666',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 'clamp(18px, 4vw, 20px)',
    fontWeight: '700',
    color: '#000000',
  },
  tableContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    overflow: 'auto',
    border: '1px solid #e0e0e0',
    marginBottom: 'clamp(16px, 3vw, 24px)',
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
  contactInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  contactEmail: {
    color: '#000000',
    wordBreak: 'break-all',
  },
  contactPhone: {
    color: '#666666',
  },
  riskBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    color: '#ffffff',
    fontSize: 'clamp(11px, 2vw, 12px)',
    fontWeight: '500',
    display: 'inline-block',
    whiteSpace: 'nowrap',
  },
  statusSelect: {
    padding: '6px 10px',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    color: '#000000',
    fontSize: 'clamp(12px, 2.5vw, 13px)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%',
    ':focus': {
      outline: 'none',
      borderColor: '#000000',
    },
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  viewButton: {
    padding: '6px 12px',
    backgroundColor: '#333333',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#444444',
      transform: 'translateY(-1px)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#666666',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#777777',
      transform: 'translateY(-1px)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  mobileCardContainer: {
    display: 'none',
    '@media (max-width: 768px)': {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      marginBottom: '20px',
    },
  },
  offenderCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  cardTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  cardRiskBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '500',
  },
  cardActions: {
    display: 'flex',
    gap: '8px',
  },
  cardViewButton: {
    padding: '8px 12px',
    backgroundColor: '#333333',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  cardDeleteButton: {
    padding: '8px 12px',
    backgroundColor: '#666666',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  cardDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  cardDetail: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  cardDetailLabel: {
    color: '#666666',
    fontSize: '13px',
    fontWeight: '500',
  },
  cardDetailValue: {
    color: '#000000',
    fontSize: '13px',
    textAlign: 'right',
    wordBreak: 'break-word',
    maxWidth: '60%',
  },
  cardStatusSelect: {
    padding: '4px 8px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
    color: '#000000',
    fontSize: '13px',
    width: '120px',
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 'clamp(8px, 2vw, 16px)',
    marginTop: 'clamp(16px, 3vw, 24px)',
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
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '16px',
    animation: 'fadeIn 0.2s ease',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 'clamp(20px, 5vw, 30px)',
    borderRadius: '12px',
    maxWidth: '700px',
    width: '100%',
    maxHeight: '85vh',
    overflow: 'auto',
    position: 'relative',
    border: '1px solid #e0e0e0',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    animation: 'slideUp 0.3s ease',
  },
  modalTitle: {
    margin: '0 0 20px 0',
    color: '#000000',
    fontSize: 'clamp(18px, 4vw, 20px)',
    fontWeight: '600',
    paddingRight: '30px',
  },
  closeButton: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    fontSize: 'clamp(20px, 4vw, 24px)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#666666',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f0f0f0',
      color: '#000000',
    },
  },
  details: {
    marginTop: '20px',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: 'clamp(12px, 3vw, 16px)',
  },
  detailItem: {
    margin: 0,
    color: '#333333',
    fontSize: 'clamp(13px, 2.5vw, 14px)',
    lineHeight: '1.6',
    borderBottom: '1px solid #f0f0f0',
    paddingBottom: '8px',
    wordBreak: 'break-word',
  },
};

// Add global animations
const style = document.createElement('style');
style.textContent = `
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
`;
document.head.appendChild(style);

export default AdminOffenderList;