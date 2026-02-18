import React, { useState, useEffect } from 'react';
import { getOffenders, updateOffender, deleteOffender } from '../../utils/database';

const AdminOffenderList = () => {
  const [offenders, setOffenders] = useState([]);
  const [filteredOffenders, setFilteredOffenders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedOffender, setSelectedOffender] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchOffenders();
  }, []);

  useEffect(() => {
    filterOffenders();
  }, [searchTerm, filterStatus, offenders]);

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

  const filterOffenders = () => {
    let filtered = [...offenders];

    if (searchTerm) {
      filtered = filtered.filter(o => 
        o.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== 'all') {
      if (filterStatus === 'recommended') {
        filtered = filtered.filter(o => o.recommendedForCS === true);
      } else if (filterStatus === 'not-recommended') {
        filtered = filtered.filter(o => o.recommendedForCS === false);
      } else if (filterStatus === 'active') {
        filtered = filtered.filter(o => o.status === 'active');
      }
    }

    setFilteredOffenders(filtered);
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

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'High': return '#666666';
      case 'Medium': return '#999999';
      case 'Low': return '#333333';
      default: return '#cccccc';
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading offenders...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Offender Management (#2)</h2>

      <div style={styles.filters}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Offenders</option>
          <option value="recommended">Recommended (#4)</option>
          <option value="not-recommended">Not Recommended (#3)</option>
          <option value="active">Active Cases</option>
        </select>

        <button onClick={fetchOffenders} style={styles.refreshButton}>
          🔄 Refresh
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
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Contact</th>
              <th style={styles.th}>Offense</th>
              <th style={styles.th}>Risk</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Vetted By</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOffenders.map(offender => (
              <tr key={offender.id} style={styles.tableRow}>
                <td style={styles.td}>{offender.firstName} {offender.lastName}</td>
                <td style={styles.td}>
                  <div>{offender.email}</div>
                  <small>{offender.phone}</small>
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
                    style={styles.statusSelect}
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="defaulted">Defaulted</option>
                  </select>
                </td>
                <td style={styles.td}>{offender.vettedBy}</td>
                <td style={styles.td}>
                  <button 
                    onClick={() => {
                      setSelectedOffender(offender);
                      setShowDetails(true);
                    }}
                    style={styles.viewButton}
                  >
                    👁️ View
                  </button>
                  <button 
                    onClick={() => handleDelete(offender.id)}
                    style={styles.deleteButton}
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {showDetails && selectedOffender && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Offender Details</h3>
            <button onClick={() => setShowDetails(false)} style={styles.closeButton}>×</button>
            
            <div style={styles.details}>
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
  filters: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  searchInput: {
    flex: 2,
    padding: '10px',
    border: '1px solid #cccccc',
    borderRadius: '4px',
    fontSize: '14px',
    minWidth: '250px',
    backgroundColor: '#ffffff',
    color: '#000000'
  },
  filterSelect: {
    flex: 1,
    padding: '10px',
    border: '1px solid #cccccc',
    borderRadius: '4px',
    fontSize: '14px',
    minWidth: '150px',
    backgroundColor: '#ffffff',
    color: '#000000'
  },
  refreshButton: {
    padding: '10px 20px',
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  stats: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0'
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  statLabel: {
    fontWeight: '500',
    color: '#666666'
  },
  statValue: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#000000'
  },
  tableContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'auto',
    border: '1px solid #e0e0e0'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
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
  riskBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '12px',
    display: 'inline-block'
  },
  statusSelect: {
    padding: '4px',
    border: '1px solid #cccccc',
    borderRadius: '4px',
    backgroundColor: '#ffffff',
    color: '#000000'
  },
  viewButton: {
    padding: '4px 8px',
    marginRight: '4px',
    backgroundColor: '#333333',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  deleteButton: {
    padding: '4px 8px',
    backgroundColor: '#666666',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666666',
    backgroundColor: '#ffffff'
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
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '8px',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflow: 'auto',
    position: 'relative',
    border: '1px solid #cccccc'
  },
  modalTitle: {
    marginTop: 0,
    color: '#000000'
  },
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    fontSize: '24px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#666666'
  },
  details: {
    marginTop: '20px'
  },
  detailItem: {
    margin: '8px 0',
    color: '#333333',
    borderBottom: '1px solid #f0f0f0',
    paddingBottom: '4px'
  }
};

export default AdminOffenderList;