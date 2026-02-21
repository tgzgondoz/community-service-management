import React, { useState, useEffect } from 'react';
import { getOffendersByRecommendation, addAssignment, updateOffender, addActivity } from '../../utils/database';
import { auth } from '../../config/firebase';

const AdminRecommendedList = () => {
  const [recommendedOffenders, setRecommendedOffenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignment, setShowAssignment] = useState(false);
  const [selectedOffender, setSelectedOffender] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [assignmentData, setAssignmentData] = useState({
    institution: '',
    startDate: '',
    endDate: '',
    hoursRequired: '',
    supervisor: ''
  });

  useEffect(() => {
    // Get current user from Firebase or localStorage
    const getUserInfo = () => {
      // Check Firebase first
      if (auth.currentUser) {
        setCurrentUser({
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: auth.currentUser.displayName || auth.currentUser.email
        });
        return;
      }

      // Check localStorage for hardcoded user
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setCurrentUser({
            uid: userData.uid || 'hardcoded-admin',
            email: userData.email,
            displayName: 'Admin User',
            isHardcoded: true
          });
        } catch (error) {
          console.error('Error parsing stored user:', error);
        }
      }
    };

    getUserInfo();
    fetchRecommendedOffenders();
  }, []);

  const fetchRecommendedOffenders = async () => {
    setLoading(true);
    try {
      const data = await getOffendersByRecommendation(true);
      setRecommendedOffenders(data);
    } catch (error) {
      console.error('Error fetching recommended offenders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = (offender) => {
    setSelectedOffender(offender);
    setShowAssignment(true);
  };

  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    
    // Validate current user
    if (!currentUser) {
      alert('User information not available. Please try logging in again.');
      return;
    }

    try {
      // Clean assignment data - remove any undefined values
      const cleanAssignmentData = {
        institution: assignmentData.institution || '',
        startDate: assignmentData.startDate || '',
        endDate: assignmentData.endDate || '',
        hoursRequired: assignmentData.hoursRequired || '',
        supervisor: assignmentData.supervisor || ''
      };

      // Create assignment with safe values
      await addAssignment({
        offenderId: selectedOffender.id || '',
        offenderName: `${selectedOffender.firstName || ''} ${selectedOffender.lastName || ''}`.trim(),
        ...cleanAssignmentData,
        status: 'new',
        notified: false,
        createdAt: new Date().toISOString(),
        assignedBy: currentUser.email || 'admin@system.com',
        assignedById: currentUser.uid || 'system'
      });

      // Update offender status
      await updateOffender(selectedOffender.id, {
        status: 'assigned',
        assignmentDate: new Date().toISOString(),
        assignedTo: cleanAssignmentData.institution
      });

      // Log activity with safe values
      await addActivity({
        description: `Offender ${selectedOffender.firstName || ''} ${selectedOffender.lastName || ''} assigned to ${cleanAssignmentData.institution}`,
        timestamp: new Date().toISOString(),
        user: currentUser.email || 'system',
        userId: currentUser.uid || 'system',
        type: 'assignment'
      });

      // Reset form and close modal
      setShowAssignment(false);
      setAssignmentData({
        institution: '',
        startDate: '',
        endDate: '',
        hoursRequired: '',
        supervisor: ''
      });
      
      // Refresh the list
      await fetchRecommendedOffenders();
      
      // Show success message
      alert('Assignment created successfully!');
      
    } catch (error) {
      console.error('Error creating assignment:', error);
      alert('Error creating assignment: ' + (error.message || 'Unknown error'));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAssignmentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Filter and sort offenders
  const getFilteredOffenders = () => {
    let filtered = [...recommendedOffenders];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(o => 
        o.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.offenseType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Risk filter
    if (filterRisk !== 'all') {
      filtered = filtered.filter(o => o.riskLevel === filterRisk);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(o => 
        filterStatus === 'assigned' ? o.status === 'assigned' : o.status !== 'assigned'
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = `${a.firstName} ${a.lastName}`;
        const nameB = `${b.firstName} ${b.lastName}`;
        return nameA.localeCompare(nameB);
      } else if (sortBy === 'risk') {
        const riskOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
        return (riskOrder[a.riskLevel] || 4) - (riskOrder[b.riskLevel] || 4);
      } else if (sortBy === 'sentence') {
        return (b.sentenceLength || 0) - (a.sentenceLength || 0);
      }
      return 0;
    });

    return filtered;
  };

  const filteredOffenders = getFilteredOffenders();

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'High': return '#666666';
      case 'Medium': return '#999999';
      case 'Low': return '#333333';
      default: return '#cccccc';
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading recommended offenders...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Recommended for Community Service (#4)</h2>

      {currentUser && (
        <div style={styles.userInfo}>
          <span style={styles.userIcon}>👤</span>
          <span>Logged in as: <strong>{currentUser.email}</strong> (Admin)</span>
        </div>
      )}

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>📋</span>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Total Recommended</p>
            <p style={styles.statValue}>{recommendedOffenders.length}</p>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>⏳</span>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Pending Assignment</p>
            <p style={styles.statValue}>
              {recommendedOffenders.filter(o => o.status !== 'assigned').length}
            </p>
          </div>
        </div>
        <div style={styles.statCard}>
          <span style={styles.statIcon}>✅</span>
          <div style={styles.statContent}>
            <p style={styles.statLabel}>Assigned</p>
            <p style={styles.statValue}>
              {recommendedOffenders.filter(o => o.status === 'assigned').length}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.searchWrapper}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search by name or offense..."
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
          value={filterRisk}
          onChange={(e) => setFilterRisk(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Risk Levels</option>
          <option value="High">High Risk</option>
          <option value="Medium">Medium Risk</option>
          <option value="Low">Low Risk</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={styles.filterSelect}
        >
          <option value="name">Sort by Name</option>
          <option value="risk">Sort by Risk</option>
          <option value="sentence">Sort by Sentence</option>
        </select>

        <button onClick={fetchRecommendedOffenders} style={styles.refreshButton} title="Refresh">
          <span style={styles.refreshIcon}>🔄</span>
          <span style={styles.refreshText}>Refresh</span>
        </button>
      </div>

      {filteredOffenders.length === 0 ? (
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📭</span>
          <p>No recommended offenders found matching your criteria.</p>
          <button onClick={() => {
            setSearchTerm('');
            setFilterRisk('all');
            setFilterStatus('all');
          }} style={styles.clearFiltersButton}>
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div style={styles.resultsInfo}>
            Showing {filteredOffenders.length} of {recommendedOffenders.length} offenders
          </div>
          
          <div style={styles.grid}>
            {filteredOffenders.map(offender => (
              <div key={offender.id} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.cardTitleSection}>
                    <h3 style={styles.cardTitle}>
                      {offender.firstName} {offender.lastName}
                    </h3>
                    <span style={{
                      ...styles.status,
                      backgroundColor: offender.status === 'assigned' ? '#333333' : '#666666'
                    }}>
                      {offender.status === 'assigned' ? 'Assigned' : 'Pending'}
                    </span>
                  </div>
                  <span style={{
                    ...styles.riskBadge,
                    backgroundColor: getRiskColor(offender.riskLevel)
                  }}>
                    {offender.riskLevel || 'Low'} Risk
                  </span>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.cardDetail}>
                    <span style={styles.cardDetailLabel}>Offense:</span>
                    <span style={styles.cardDetailValue}>{offender.offenseType || 'N/A'}</span>
                  </div>
                  
                  <div style={styles.cardDetail}>
                    <span style={styles.cardDetailLabel}>Sentence:</span>
                    <span style={styles.cardDetailValue}>{offender.sentenceLength || '0'} months</span>
                  </div>
                  
                  {offender.assignedTo && (
                    <div style={styles.cardDetail}>
                      <span style={styles.cardDetailLabel}>Assigned to:</span>
                      <span style={styles.cardDetailValue}>{offender.assignedTo}</span>
                    </div>
                  )}
                  
                  <div style={styles.needs}>
                    {offender.substanceAbuse && (
                      <span style={styles.need}>Substance Abuse</span>
                    )}
                    {offender.mentalHealthIssues && (
                      <span style={styles.need}>Mental Health</span>
                    )}
                  </div>
                </div>

                {offender.status !== 'assigned' && (
                  <button 
                    onClick={() => handleAssign(offender)}
                    style={styles.assignButton}
                  >
                    Assign to Institution
                  </button>
                )}
                
                {offender.status === 'assigned' && offender.assignmentDate && (
                  <div style={styles.assignmentInfo}>
                    <small>Assigned on: {new Date(offender.assignmentDate).toLocaleDateString()}</small>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Assignment Modal */}
      {showAssignment && selectedOffender && (
        <div style={styles.modal} onClick={(e) => e.target === e.currentTarget && setShowAssignment(false)}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Assign to Institution</h3>
            <button onClick={() => setShowAssignment(false)} style={styles.closeButton}>×</button>
            
            <div style={styles.modalOffenderInfo}>
              <strong>{selectedOffender.firstName} {selectedOffender.lastName}</strong>
              <span style={{
                ...styles.modalRiskBadge,
                backgroundColor: getRiskColor(selectedOffender.riskLevel)
              }}>
                {selectedOffender.riskLevel} Risk
              </span>
            </div>
            
            <form onSubmit={handleSubmitAssignment}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Institution *</label>
                <input
                  type="text"
                  name="institution"
                  value={assignmentData.institution}
                  onChange={handleInputChange}
                  style={styles.input}
                  required
                  placeholder="Enter institution name"
                />
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={assignmentData.startDate}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>End Date *</label>
                  <input
                    type="date"
                    name="endDate"
                    value={assignmentData.endDate}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Hours Required *</label>
                  <input
                    type="number"
                    name="hoursRequired"
                    value={assignmentData.hoursRequired}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                    min="1"
                    placeholder="Enter hours"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Supervisor *</label>
                  <input
                    type="text"
                    name="supervisor"
                    value={assignmentData.supervisor}
                    onChange={handleInputChange}
                    style={styles.input}
                    required
                    placeholder="Enter supervisor name"
                  />
                </div>
              </div>

              <div style={styles.modalButtons}>
                <button type="button" onClick={() => setShowAssignment(false)} style={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitButton}>
                  Assign
                </button>
              </div>
            </form>
          </div>
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
    marginBottom: 'clamp(16px, 3vw, 20px)',
    color: '#000000',
    fontWeight: '600',
    '@media (max-width: 480px)': {
      textAlign: 'center',
    }
  },
  userInfo: {
    backgroundColor: '#f8f8f8',
    padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)',
    borderRadius: '8px',
    marginBottom: 'clamp(16px, 3vw, 24px)',
    fontSize: 'clamp(13px, 2.5vw, 14px)',
    color: '#333333',
    border: '1px solid #e0e0e0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  userIcon: {
    fontSize: '16px',
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 'clamp(12px, 2vw, 16px)',
    marginBottom: 'clamp(20px, 4vw, 30px)',
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: 'clamp(16px, 3vw, 20px)',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(12px, 2vw, 16px)',
    transition: 'transform 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
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
    minWidth: '140px',
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
  resultsInfo: {
    marginBottom: '16px',
    color: '#666666',
    fontSize: '14px',
  },
  emptyState: {
    textAlign: 'center',
    padding: 'clamp(30px, 8vw, 40px)',
    backgroundColor: '#f8f8f8',
    borderRadius: '12px',
    color: '#666666',
    border: '2px dashed #cccccc',
  },
  emptyIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '16px',
  },
  clearFiltersButton: {
    marginTop: '16px',
    padding: '8px 16px',
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#333333',
    },
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 'clamp(16px, 3vw, 20px)',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    padding: 'clamp(16px, 3vw, 20px)',
    border: '1px solid #e0e0e0',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
    },
  },
  cardHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '12px',
  },
  cardTitleSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  cardTitle: {
    margin: 0,
    fontSize: 'clamp(16px, 3.5vw, 18px)',
    color: '#000000',
    fontWeight: '600',
  },
  status: {
    padding: '4px 10px',
    borderRadius: '20px',
    color: '#ffffff',
    fontSize: 'clamp(11px, 2vw, 12px)',
    fontWeight: '500',
  },
  riskBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    color: '#ffffff',
    fontSize: 'clamp(11px, 2vw, 12px)',
    fontWeight: '500',
    alignSelf: 'flex-start',
  },
  cardBody: {
    marginBottom: '16px',
    flex: 1,
  },
  cardDetail: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  cardDetailLabel: {
    color: '#666666',
    fontSize: 'clamp(13px, 2.5vw, 14px)',
    fontWeight: '500',
  },
  cardDetailValue: {
    color: '#000000',
    fontSize: 'clamp(13px, 2.5vw, 14px)',
    textAlign: 'right',
    maxWidth: '60%',
    wordBreak: 'break-word',
  },
  needs: {
    display: 'flex',
    gap: '8px',
    marginTop: '12px',
    flexWrap: 'wrap',
  },
  need: {
    backgroundColor: '#f0f0f0',
    color: '#333333',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: 'clamp(11px, 2vw, 12px)',
    border: '1px solid #cccccc',
    fontWeight: '500',
  },
  assignButton: {
    width: '100%',
    padding: 'clamp(10px, 2.5vw, 12px)',
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 3vw, 16px)',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#333333',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  assignmentInfo: {
    marginTop: '12px',
    padding: '8px',
    backgroundColor: '#f8f8f8',
    borderRadius: '6px',
    textAlign: 'center',
    color: '#666666',
    fontSize: '12px',
    border: '1px solid #e0e0e0',
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
    maxWidth: '550px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative',
    border: '1px solid #e0e0e0',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    animation: 'slideUp 0.3s ease',
  },
  modalTitle: {
    margin: '0 0 16px 0',
    color: '#000000',
    fontSize: 'clamp(18px, 4vw, 20px)',
    fontWeight: '600',
    paddingRight: '30px',
  },
  modalOffenderInfo: {
    backgroundColor: '#f8f8f8',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    border: '1px solid #e0e0e0',
  },
  modalRiskBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '500',
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
  label: {
    color: '#333333',
    fontWeight: '500',
    marginBottom: '6px',
    display: 'block',
    fontSize: 'clamp(13px, 2.5vw, 14px)',
  },
  formGroup: {
    marginBottom: '16px',
    flex: 1,
  },
  formRow: {
    display: 'flex',
    gap: 'clamp(12px, 3vw, 16px)',
    '@media (max-width: 480px)': {
      flexDirection: 'column',
      gap: '12px',
    }
  },
  input: {
    width: '100%',
    padding: 'clamp(10px, 2.5vw, 12px)',
    border: '1px solid #cccccc',
    borderRadius: '8px',
    marginTop: '4px',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    color: '#000000',
    fontSize: 'clamp(14px, 3vw, 16px)',
    transition: 'border-color 0.2s ease',
    ':focus': {
      outline: 'none',
      borderColor: '#000000',
    },
  },
  modalButtons: {
    display: 'flex',
    gap: '12px',
    marginTop: '24px',
    '@media (max-width: 480px)': {
      flexDirection: 'column',
      gap: '10px',
    }
  },
  cancelButton: {
    flex: 1,
    padding: 'clamp(10px, 2.5vw, 12px)',
    backgroundColor: '#666666',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 3vw, 16px)',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#777777',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  submitButton: {
    flex: 1,
    padding: 'clamp(10px, 2.5vw, 12px)',
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 3vw, 16px)',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#333333',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
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

export default AdminRecommendedList;