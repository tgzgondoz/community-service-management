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
      case 'High': return '#dc2626';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner} />
        <p style={styles.loadingText}>Loading recommended offenders...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Recommended for Community Service</h1>
          <span style={styles.subtitle}>Manage assignments for recommended offenders</span>
        </div>
        {currentUser && (
          <div style={styles.userBadge}>
            <span style={styles.userBadgeText}>{currentUser.email}</span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statContent}>
            <span style={styles.statValue}>{recommendedOffenders.length}</span>
            <span style={styles.statLabel}>Total Recommended</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statContent}>
            <span style={styles.statValue}>
              {recommendedOffenders.filter(o => o.status !== 'assigned').length}
            </span>
            <span style={styles.statLabel}>Pending Assignment</span>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statContent}>
            <span style={styles.statValue}>
              {recommendedOffenders.filter(o => o.status === 'assigned').length}
            </span>
            <span style={styles.statLabel}>Assigned</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.searchWrapper}>
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
              Clear
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
          <option value="risk">Sort by Risk Level</option>
          <option value="sentence">Sort by Sentence Length</option>
        </select>

        <button onClick={fetchRecommendedOffenders} style={styles.refreshButton}>
          <span style={styles.refreshText}>Refresh</span>
        </button>
      </div>

      {/* Results Info */}
      <div style={styles.resultsInfo}>
        <span style={styles.resultsCount}>
          Showing {filteredOffenders.length} of {recommendedOffenders.length} offenders
        </span>
      </div>

      {/* Offender Cards Grid */}
      {filteredOffenders.length === 0 ? (
        <div style={styles.emptyState}>
          <p style={styles.emptyText}>No recommended offenders found matching your criteria.</p>
          <button onClick={() => {
            setSearchTerm('');
            setFilterRisk('all');
            setFilterStatus('all');
          }} style={styles.clearFiltersButton}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredOffenders.map(offender => (
            <div key={offender.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.cardTitleSection}>
                  <h3 style={styles.cardTitle}>
                    {offender.firstName} {offender.lastName}
                  </h3>
                  <span style={{
                    ...styles.statusBadge,
                    backgroundColor: offender.status === 'assigned' ? '#10b981' : '#f59e0b'
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
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Offense</span>
                  <span style={styles.detailValue}>{offender.offenseType || 'N/A'}</span>
                </div>
                
                <div style={styles.detailItem}>
                  <span style={styles.detailLabel}>Sentence</span>
                  <span style={styles.detailValue}>{offender.sentenceLength || '0'} months</span>
                </div>
                
                {offender.assignedTo && (
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Assigned to</span>
                    <span style={styles.detailValue}>{offender.assignedTo}</span>
                  </div>
                )}
                
                <div style={styles.needs}>
                  {offender.substanceAbuse && (
                    <span style={styles.needTag}>
                      Substance Abuse
                    </span>
                  )}
                  {offender.mentalHealthIssues && (
                    <span style={styles.needTag}>
                      Mental Health
                    </span>
                  )}
                </div>
              </div>

              {offender.status !== 'assigned' ? (
                <button 
                  onClick={() => handleAssign(offender)}
                  style={styles.assignButton}
                >
                  Assign to Institution
                </button>
              ) : (
                <div style={styles.assignmentInfo}>
                  <span style={styles.assignmentDate}>
                    Assigned: {new Date(offender.assignmentDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignment && selectedOffender && (
        <div style={styles.modal} onClick={(e) => e.target === e.currentTarget && setShowAssignment(false)}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Assign to Institution</h3>
                <p style={styles.modalSubtitle}>
                  {selectedOffender.firstName} {selectedOffender.lastName}
                </p>
              </div>
              <button onClick={() => setShowAssignment(false)} style={styles.closeButton}>
                Close
              </button>
            </div>
            
            <div style={styles.modalRiskInfo}>
              <span style={styles.modalRiskLabel}>Risk Level</span>
              <span style={{
                ...styles.modalRiskBadge,
                backgroundColor: getRiskColor(selectedOffender.riskLevel)
              }}>
                {selectedOffender.riskLevel}
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
                  Create Assignment
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
    '@media (max-width: 480px)': {
      flexDirection: 'column',
      alignItems: 'stretch',
    }
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
  userBadge: {
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '40px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  userBadgeText: {
    fontSize: '14px',
    color: '#1e293b',
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
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
      borderColor: '#cbd5e1',
    },
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '14px',
    color: '#64748b',
  },
  filters: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
    flexWrap: 'wrap',
    '@media (max-width: 768px)': {
      flexDirection: 'column',
    }
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
    ':focus': {
      outline: 'none',
      borderColor: '#0f172a',
      boxShadow: '0 0 0 3px rgba(15,23,42,0.1)',
    },
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
    ':hover': {
      color: '#0f172a',
    },
  },
  filterSelect: {
    flex: 1,
    padding: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    minWidth: '140px',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':focus': {
      outline: 'none',
      borderColor: '#0f172a',
      boxShadow: '0 0 0 3px rgba(15,23,42,0.1)',
    },
  },
  refreshButton: {
    padding: '12px 20px',
    backgroundColor: '#ffffff',
    color: '#1e293b',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    ':hover': {
      backgroundColor: '#f8fafc',
      borderColor: '#94a3b8',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
    '@media (max-width: 768px)': {
      justifyContent: 'center',
    },
  },
  refreshText: {
    fontWeight: '500',
  },
  resultsInfo: {
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  resultsCount: {
    padding: '6px 12px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500',
  },
  emptyState: {
    textAlign: 'center',
    padding: '48px 24px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px dashed #cbd5e1',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  emptyText: {
    color: '#64748b',
    fontSize: '16px',
    marginBottom: '16px',
  },
  clearFiltersButton: {
    padding: '8px 20px',
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    transition: 'all 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
      borderColor: '#cbd5e1',
    },
  },
  cardHeader: {
    padding: '16px',
    borderBottom: '1px solid #f1f5f9',
  },
  cardTitleSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  cardTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#0f172a',
    fontWeight: '600',
  },
  statusBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '500',
  },
  riskBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '20px',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: '500',
  },
  cardBody: {
    padding: '16px',
    flex: 1,
  },
  detailItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid #f1f5f9',
    ':last-child': {
      borderBottom: 'none',
    },
  },
  detailLabel: {
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '500',
  },
  detailValue: {
    color: '#0f172a',
    fontSize: '14px',
    fontWeight: '500',
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
  needTag: {
    padding: '4px 10px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
  },
  assignButton: {
    margin: '0 16px 16px 16px',
    padding: '12px',
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
  assignmentInfo: {
    margin: '0 16px 16px 16px',
    padding: '10px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    textAlign: 'center',
  },
  assignmentDate: {
    fontSize: '13px',
    color: '#64748b',
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
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
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
    ':hover': {
      backgroundColor: '#f1f5f9',
      color: '#0f172a',
    },
  },
  modalRiskInfo: {
    padding: '16px 24px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  modalRiskLabel: {
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
  },
  modalRiskBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: '500',
  },
  formGroup: {
    padding: '0 24px',
    marginBottom: '20px',
  },
  formRow: {
    padding: '0 24px',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '20px',
    '@media (max-width: 480px)': {
      gridTemplateColumns: '1fr',
    }
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#334155',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#0f172a',
    transition: 'all 0.2s ease',
    boxSizing: 'border-box',
    ':focus': {
      outline: 'none',
      borderColor: '#0f172a',
      boxShadow: '0 0 0 3px rgba(15,23,42,0.1)',
    },
  },
  modalButtons: {
    padding: '20px 24px 24px 24px',
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    borderTop: '1px solid #e2e8f0',
  },
  cancelButton: {
    padding: '12px',
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
      borderColor: '#cbd5e1',
    },
  },
  submitButton: {
    padding: '12px',
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

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default AdminRecommendedList;