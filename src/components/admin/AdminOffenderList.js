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
      case 'High': return '#f44336';
      case 'Medium': return '#ff9800';
      case 'Low': return '#4caf50';
      default: return '#999';
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
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Offense</th>
              <th>Risk</th>
              <th>Status</th>
              <th>Vetted By</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOffenders.map(offender => (
              <tr key={offender.id}>
                <td>{offender.firstName} {offender.lastName}</td>
                <td>
                  <div>{offender.email}</div>
                  <small>{offender.phone}</small>
                </td>
                <td>{offender.offenseType}</td>
                <td>
                  <span style={{
                    ...styles.riskBadge,
                    backgroundColor: getRiskColor(offender.riskLevel)
                  }}>
                    {offender.riskLevel}
                  </span>
                </td>
                <td>
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
                <td>{offender.vettedBy}</td>
                <td>
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
            <h3>Offender Details</h3>
            <button onClick={() => setShowDetails(false)} style={styles.closeButton}>×</button>
            
            <div style={styles.details}>
              <p><strong>Name:</strong> {selectedOffender.firstName} {selectedOffender.lastName}</p>
              <p><strong>Date of Birth:</strong> {selectedOffender.dateOfBirth}</p>
              <p><strong>Email:</strong> {selectedOffender.email}</p>
              <p><strong>Phone:</strong> {selectedOffender.phone}</p>
              <p><strong>Address:</strong> {selectedOffender.address}</p>
              <p><strong>Offense Type:</strong> {selectedOffender.offenseType}</p>
              <p><strong>Offense Date:</strong> {selectedOffender.offenseDate}</p>
              <p><strong>Sentence Length:</strong> {selectedOffender.sentenceLength} months</p>
              <p><strong>Risk Level:</strong> {selectedOffender.riskLevel}</p>
              <p><strong>Previous Offenses:</strong> {selectedOffender.previousOffenses}</p>
              <p><strong>Employment Status:</strong> {selectedOffender.employmentStatus}</p>
              <p><strong>Education Level:</strong> {selectedOffender.educationLevel}</p>
              <p><strong>Substance Abuse:</strong> {selectedOffender.substanceAbuse ? 'Yes' : 'No'}</p>
              <p><strong>Mental Health Issues:</strong> {selectedOffender.mentalHealthIssues ? 'Yes' : 'No'}</p>
              <p><strong>Family Support:</strong> {selectedOffender.familySupport}</p>
              <p><strong>Recommended for CS:</strong> {selectedOffender.recommendedForCS ? 'Yes' : 'No'}</p>
              <p><strong>Status:</strong> {selectedOffender.status}</p>
              <p><strong>Vetted By:</strong> {selectedOffender.vettedBy}</p>
              <p><strong>Created:</strong> {new Date(selectedOffender.createdAt).toLocaleString()}</p>
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
    margin: '0 auto'
  },
  title: {
    fontSize: '28px',
    marginBottom: '20px',
    color: '#333'
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
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    minWidth: '250px'
  },
  filterSelect: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    minWidth: '150px'
  },
  refreshButton: {
    padding: '10px 20px',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  stats: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  statLabel: {
    fontWeight: '500',
    color: '#666'
  },
  statValue: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333'
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    overflow: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  riskBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '12px'
  },
  statusSelect: {
    padding: '4px',
    border: '1px solid #ddd',
    borderRadius: '4px'
  },
  viewButton: {
    padding: '4px 8px',
    marginRight: '4px',
    backgroundColor: '#2196f3',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  deleteButton: {
    padding: '4px 8px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
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
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    maxWidth: '600px',
    maxHeight: '80vh',
    overflow: 'auto',
    position: 'relative'
  },
  closeButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    fontSize: '24px',
    background: 'none',
    border: 'none',
    cursor: 'pointer'
  },
  details: {
    marginTop: '20px'
  }
};

export default AdminOffenderList;