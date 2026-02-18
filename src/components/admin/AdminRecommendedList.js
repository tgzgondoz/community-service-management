import React, { useState, useEffect } from 'react';
import { getOffendersByRecommendation, addAssignment, updateOffender, addActivity } from '../../utils/database';
import { auth } from '../../config/firebase';

const AdminRecommendedList = () => {
  const [recommendedOffenders, setRecommendedOffenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignment, setShowAssignment] = useState(false);
  const [selectedOffender, setSelectedOffender] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
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

  if (loading) {
    return <div style={styles.loading}>Loading recommended offenders...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Recommended for Community Service (#4)</h2>

      {currentUser && (
        <div style={styles.userInfo}>
          Logged in as: <strong>{currentUser.email}</strong> (Admin)
        </div>
      )}

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Recommended</p>
          <p style={styles.statValue}>{recommendedOffenders.length}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Pending Assignment</p>
          <p style={styles.statValue}>
            {recommendedOffenders.filter(o => o.status !== 'assigned').length}
          </p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Assigned</p>
          <p style={styles.statValue}>
            {recommendedOffenders.filter(o => o.status === 'assigned').length}
          </p>
        </div>
      </div>

      {recommendedOffenders.length === 0 ? (
        <div style={styles.emptyState}>
          <p>No recommended offenders found.</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {recommendedOffenders.map(offender => (
            <div key={offender.id} style={styles.card}>
              <div style={styles.cardHeader}>
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

              <div style={styles.cardBody}>
                <p style={styles.cardText}><strong>Offense:</strong> {offender.offenseType || 'N/A'}</p>
                <p style={styles.cardText}><strong>Risk Level:</strong> 
                  <span style={{
                    ...styles.riskBadge,
                    backgroundColor: offender.riskLevel === 'High' ? '#666666' :
                                   offender.riskLevel === 'Medium' ? '#999999' : '#333333'
                  }}>
                    {offender.riskLevel || 'Low'}
                  </span>
                </p>
                <p style={styles.cardText}><strong>Sentence:</strong> {offender.sentenceLength || '0'} months</p>
                
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
            </div>
          ))}
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignment && selectedOffender && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Assign to Institution</h3>
            <button onClick={() => setShowAssignment(false)} style={styles.closeButton}>×</button>
            
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
  userInfo: {
    backgroundColor: '#f5f5f5',
    padding: '10px 15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    color: '#333333',
    border: '1px solid #cccccc'
  },
  stats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  statCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center',
    border: '1px solid #e0e0e0'
  },
  statLabel: {
    color: '#666666',
    marginBottom: '10px'
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#000000',
    margin: 0
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    color: '#666666',
    border: '1px solid #e0e0e0'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '20px'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    padding: '20px',
    border: '1px solid #e0e0e0'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '15px'
  },
  cardTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#000000'
  },
  cardText: {
    color: '#333333',
    marginBottom: '5px'
  },
  status: {
    padding: '4px 8px',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '12px'
  },
  cardBody: {
    marginBottom: '15px'
  },
  riskBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '12px',
    marginLeft: '8px'
  },
  needs: {
    display: 'flex',
    gap: '8px',
    marginTop: '10px',
    flexWrap: 'wrap'
  },
  need: {
    backgroundColor: '#e0e0e0',
    color: '#333333',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    border: '1px solid #cccccc'
  },
  assignButton: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#000000',
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
    maxWidth: '500px',
    width: '90%',
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
  label: {
    color: '#333333',
    fontWeight: '500',
    marginBottom: '5px'
  },
  formGroup: {
    marginBottom: '15px',
    flex: 1
  },
  formRow: {
    display: 'flex',
    gap: '15px'
  },
  input: {
    width: '100%',
    padding: '8px',
    border: '1px solid #cccccc',
    borderRadius: '4px',
    marginTop: '5px',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    color: '#000000'
  },
  modalButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '20px'
  },
  cancelButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#666666',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  submitButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }
};

export default AdminRecommendedList;