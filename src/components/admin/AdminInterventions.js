import React, { useState, useEffect } from 'react';
import { getOffendersByRecommendation, getInterventions, addIntervention, updateOffender } from '../../utils/database';

const AdminInterventions = () => {
  const [offenders, setOffenders] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedOffender, setSelectedOffender] = useState(null);
  const [formData, setFormData] = useState({
    type: '',
    startDate: '',
    endDate: '',
    provider: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const recommendedOffenders = await getOffendersByRecommendation(true);
      setOffenders(recommendedOffenders);

      const interventionsList = await getInterventions();
      setInterventions(interventionsList);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleAssign = (offender) => {
    setSelectedOffender(offender);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addIntervention({
        offenderId: selectedOffender.id,
        offenderName: `${selectedOffender.firstName} ${selectedOffender.lastName}`,
        ...formData,
        status: 'active',
        createdAt: new Date().toISOString()
      });

      await updateOffender(selectedOffender.id, {
        hasIntervention: true,
        interventionType: formData.type
      });

      setShowForm(false);
      setFormData({ type: '', startDate: '', endDate: '', provider: '', notes: '' });
      fetchData();
    } catch (error) {
      console.error('Error assigning intervention:', error);
      alert('Error: ' + error.message);
    }
  };

  const getInterventionIcon = (type) => {
    switch (type) {
      case 'counseling': return '🧠';
      case 'detox': return '🏥';
      case 'education': return '📚';
      case 'vocational': return '💼';
      default: return '❤️';
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

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Intervention Management (#5)</h2>

      <div style={styles.grid}>
        {/* Left Column - Offenders Needing Intervention */}
        <div style={styles.column}>
          <h3 style={styles.columnTitle}>Offenders Needing Intervention</h3>
          <div style={styles.cardList}>
            {offenders.filter(o => !o.hasIntervention).map(offender => (
              <div key={offender.id} style={styles.offenderCard}>
                <div style={styles.cardHeader}>
                  <strong style={styles.offenderName}>{offender.firstName} {offender.lastName}</strong>
                  <span style={{
                    ...styles.riskBadge,
                    backgroundColor: getRiskColor(offender.riskLevel)
                  }}>
                    {offender.riskLevel}
                  </span>
                </div>
                
                <div style={styles.needs}>
                  {offender.substanceAbuse && <span style={styles.need}>Substance Abuse</span>}
                  {offender.mentalHealthIssues && <span style={styles.need}>Mental Health</span>}
                </div>

                <button 
                  onClick={() => handleAssign(offender)}
                  style={styles.assignButton}
                >
                  Assign Intervention
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - Active Interventions */}
        <div style={styles.column}>
          <h3 style={styles.columnTitle}>Active Interventions</h3>
          <div style={styles.cardList}>
            {interventions.filter(i => i.status === 'active').map(intervention => (
              <div key={intervention.id} style={styles.interventionCard}>
                <div style={styles.cardHeader}>
                  <span style={styles.interventionIcon}>
                    {getInterventionIcon(intervention.type)}
                  </span>
                  <strong style={styles.offenderName}>{intervention.offenderName}</strong>
                </div>
                
                <div style={styles.interventionDetails}>
                  <p style={styles.detailItem}><strong>Type:</strong> {intervention.type}</p>
                  <p style={styles.detailItem}><strong>Provider:</strong> {intervention.provider}</p>
                  <p style={styles.detailItem}><strong>Start:</strong> {new Date(intervention.startDate).toLocaleDateString()}</p>
                  {intervention.endDate && (
                    <p style={styles.detailItem}><strong>End:</strong> {new Date(intervention.endDate).toLocaleDateString()}</p>
                  )}
                  {intervention.notes && (
                    <p style={styles.detailItem}><strong>Notes:</strong> {intervention.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {showForm && (
        <div style={styles.modal} onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>Assign Intervention</h3>
            <button onClick={() => setShowForm(false)} style={styles.closeButton}>×</button>
            
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Intervention Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  style={styles.input}
                  required
                >
                  <option value="">Select...</option>
                  <option value="counseling">Counseling</option>
                  <option value="detox">Detoxification</option>
                  <option value="education">Education</option>
                  <option value="vocational">Vocational Training</option>
                  <option value="mental">Mental Health Support</option>
                </select>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Provider *</label>
                <input
                  type="text"
                  value={formData.provider}
                  onChange={(e) => setFormData({...formData, provider: e.target.value})}
                  style={styles.input}
                  required
                  placeholder="Enter provider name"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  style={{...styles.input, minHeight: '80px', resize: 'vertical'}}
                  placeholder="Enter any additional notes"
                />
              </div>

              <div style={styles.modalButtons}>
                <button type="button" onClick={() => setShowForm(false)} style={styles.cancelButton}>
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
    marginBottom: 'clamp(16px, 3vw, 24px)',
    color: '#000000',
    fontWeight: '600',
    '@media (max-width: 480px)': {
      textAlign: 'center',
    }
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'clamp(16px, 3vw, 24px)',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: '20px',
    }
  },
  column: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: 'clamp(16px, 3vw, 24px)',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
    height: 'fit-content',
    maxHeight: 'calc(100vh - 200px)',
    display: 'flex',
    flexDirection: 'column',
    '@media (max-width: 768px)': {
      maxHeight: '500px',
    }
  },
  columnTitle: {
    margin: '0 0 16px 0',
    color: '#000000',
    fontSize: 'clamp(16px, 3vw, 18px)',
    fontWeight: '600',
    paddingBottom: '12px',
    borderBottom: '2px solid #e0e0e0',
  },
  cardList: {
    flex: 1,
    overflowY: 'auto',
    paddingRight: '8px',
    // Custom scrollbar styling
    scrollbarWidth: 'thin',
    scrollbarColor: '#cccccc #f5f5f5',
    '&::-webkit-scrollbar': {
      width: '6px',
    },
    '&::-webkit-scrollbar-track': {
      background: '#f5f5f5',
      borderRadius: '3px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#cccccc',
      borderRadius: '3px',
      '&:hover': {
        background: '#999999',
      },
    },
  },
  offenderCard: {
    border: '1px solid #e0e0e0',
    borderRadius: '10px',
    padding: 'clamp(12px, 2.5vw, 16px)',
    marginBottom: '12px',
    backgroundColor: '#f8f8f8',
    transition: 'all 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      backgroundColor: '#f0f0f0',
    },
    '@media (max-width: 480px)': {
      padding: '12px',
    }
  },
  interventionCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: '10px',
    padding: 'clamp(12px, 2.5vw, 16px)',
    marginBottom: '12px',
    border: '1px solid #e0e0e0',
    transition: 'all 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
      backgroundColor: '#f0f0f0',
    },
    '@media (max-width: 480px)': {
      padding: '12px',
    }
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    flexWrap: 'wrap',
    gap: '8px',
  },
  offenderName: {
    color: '#000000',
    fontSize: 'clamp(14px, 2.5vw, 16px)',
    wordBreak: 'break-word',
    flex: 1,
  },
  riskBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    color: '#ffffff',
    fontSize: 'clamp(11px, 2vw, 12px)',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  },
  needs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  need: {
    backgroundColor: '#e0e0e0',
    color: '#333333',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: 'clamp(11px, 2vw, 12px)',
    border: '1px solid #cccccc',
    fontWeight: '500',
  },
  assignButton: {
    width: '100%',
    padding: 'clamp(8px, 2vw, 10px)',
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: 'clamp(13px, 2.5vw, 14px)',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#333333',
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
    '@media (max-width: 480px)': {
      padding: '12px',
    }
  },
  interventionIcon: {
    fontSize: 'clamp(18px, 3vw, 20px)',
    marginRight: '10px',
  },
  interventionDetails: {
    fontSize: 'clamp(13px, 2.5vw, 14px)',
    color: '#333333',
  },
  detailItem: {
    margin: '6px 0',
    lineHeight: '1.5',
    wordBreak: 'break-word',
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
    overflowY: 'auto',
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
    '@media (max-width: 480px)': {
      top: '10px',
      right: '10px',
    }
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
    padding: 'clamp(8px, 2vw, 10px)',
    border: '1px solid #cccccc',
    borderRadius: '6px',
    marginTop: '4px',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    color: '#000000',
    fontSize: 'clamp(13px, 2.5vw, 14px)',
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
    padding: 'clamp(10px, 2vw, 12px)',
    backgroundColor: '#666666',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: 'clamp(13px, 2.5vw, 14px)',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#555555',
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  submitButton: {
    flex: 1,
    padding: 'clamp(10px, 2vw, 12px)',
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: 'clamp(13px, 2.5vw, 14px)',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#333333',
      transform: 'translateY(-1px)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
};

// Add keyframe animations
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

export default AdminInterventions;