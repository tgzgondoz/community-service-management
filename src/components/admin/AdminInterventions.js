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

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'High': return '#dc2626';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getInterventionTypeColor = (type) => {
    switch (type) {
      case 'counseling': return '#8b5cf6';
      case 'detox': return '#3b82f6';
      case 'education': return '#10b981';
      case 'vocational': return '#f59e0b';
      case 'mental': return '#ec4899';
      default: return '#6b7280';
    }
  };

  const getInterventionTypeLabel = (type) => {
    switch (type) {
      case 'counseling': return 'Counseling';
      case 'detox': return 'Detoxification';
      case 'education': return 'Education';
      case 'vocational': return 'Vocational Training';
      case 'mental': return 'Mental Health Support';
      default: return type;
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Intervention Management</h1>
          <span style={styles.subtitle}>Assign and monitor rehabilitation programs</span>
        </div>
        <div style={styles.stats}>
          <div style={styles.stat}>
            <span style={styles.statValue}>{offenders.filter(o => !o.hasIntervention).length}</span>
            <span style={styles.statLabel}>Needing Intervention</span>
          </div>
          <div style={styles.statDivider} />
          <div style={styles.stat}>
            <span style={styles.statValue}>{interventions.filter(i => i.status === 'active').length}</span>
            <span style={styles.statLabel}>Active Programs</span>
          </div>
        </div>
      </div>

      <div style={styles.grid}>
        {/* Left Column - Offenders Needing Intervention */}
        <div style={styles.column}>
          <div style={styles.columnHeader}>
            <h2 style={styles.columnTitle}>Needs Intervention</h2>
            <span style={styles.columnBadge}>
              {offenders.filter(o => !o.hasIntervention).length} pending
            </span>
          </div>
          <div style={styles.cardList}>
            {offenders.filter(o => !o.hasIntervention).map(offender => (
              <div key={offender.id} style={styles.offenderCard}>
                <div style={styles.cardHeader}>
                  <div style={styles.offenderInfo}>
                    <span style={styles.offenderName}>
                      {offender.firstName} {offender.lastName}
                    </span>
                    <span style={styles.offenderId}>#{offender.id.slice(0, 8)}</span>
                  </div>
                  <span style={{
                    ...styles.riskBadge,
                    backgroundColor: getRiskColor(offender.riskLevel),
                    color: '#ffffff'
                  }}>
                    {offender.riskLevel} Risk
                  </span>
                </div>
                
                <div style={styles.needs}>
                  {offender.substanceAbuse && (
                    <span style={styles.need}>
                      Substance Abuse
                    </span>
                  )}
                  {offender.mentalHealthIssues && (
                    <span style={styles.need}>
                      Mental Health
                    </span>
                  )}
                </div>

                <div style={styles.cardFooter}>
                  <span style={styles.recommendedDate}>
                    Recommended: {new Date(offender.recommendedDate).toLocaleDateString()}
                  </span>
                  <button 
                    onClick={() => handleAssign(offender)}
                    style={styles.assignButton}
                  >
                    Assign Program
                  </button>
                </div>
              </div>
            ))}
            {offenders.filter(o => !o.hasIntervention).length === 0 && (
              <div style={styles.emptyState}>
                <p style={styles.emptyStateText}>No offenders need intervention</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Active Interventions */}
        <div style={styles.column}>
          <div style={styles.columnHeader}>
            <h2 style={styles.columnTitle}>Active Programs</h2>
            <span style={styles.columnBadge}>
              {interventions.filter(i => i.status === 'active').length} active
            </span>
          </div>
          <div style={styles.cardList}>
            {interventions.filter(i => i.status === 'active').map(intervention => (
              <div key={intervention.id} style={styles.interventionCard}>
                <div style={styles.cardHeader}>
                  <div style={styles.interventionType}>
                    <div style={styles.interventionInfo}>
                      <span style={styles.offenderName}>{intervention.offenderName}</span>
                      <span style={{
                        ...styles.interventionTypeBadge,
                        backgroundColor: getInterventionTypeColor(intervention.type)
                      }}>
                        {getInterventionTypeLabel(intervention.type)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div style={styles.interventionDetails}>
                  <div style={styles.detailGrid}>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Provider</span>
                      <span style={styles.detailValue}>{intervention.provider}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Start Date</span>
                      <span style={styles.detailValue}>
                        {new Date(intervention.startDate).toLocaleDateString()}
                      </span>
                    </div>
                    {intervention.endDate && (
                      <div style={styles.detailItem}>
                        <span style={styles.detailLabel}>End Date</span>
                        <span style={styles.detailValue}>
                          {new Date(intervention.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {intervention.notes && (
                    <div style={styles.notes}>
                      <span style={styles.notesLabel}>Notes</span>
                      <p style={styles.notesText}>{intervention.notes}</p>
                    </div>
                  )}
                </div>

                <div style={styles.progressBar}>
                  <div style={styles.progressFill} />
                </div>
              </div>
            ))}
            {interventions.filter(i => i.status === 'active').length === 0 && (
              <div style={styles.emptyState}>
                <p style={styles.emptyStateText}>No active intervention programs</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {showForm && (
        <div style={styles.modal} onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Assign Intervention Program</h3>
                <p style={styles.modalSubtitle}>
                  For: {selectedOffender?.firstName} {selectedOffender?.lastName}
                </p>
              </div>
              <button onClick={() => setShowForm(false)} style={styles.closeButton}>
                Close
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Program Type *</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                  style={styles.select}
                  required
                >
                  <option value="">Select program type...</option>
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
                <label style={styles.label}>Service Provider *</label>
                <input
                  type="text"
                  value={formData.provider}
                  onChange={(e) => setFormData({...formData, provider: e.target.value})}
                  style={styles.input}
                  required
                  placeholder="Enter provider name or organization"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Additional Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  style={styles.textarea}
                  placeholder="Enter any relevant notes or instructions..."
                  rows="4"
                />
              </div>

              <div style={styles.modalButtons}>
                <button type="button" onClick={() => setShowForm(false)} style={styles.cancelButton}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitButton}>
                  Assign Program
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
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '20px',
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
  stats: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 20px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#0f172a',
    lineHeight: 1.2,
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748b',
  },
  statDivider: {
    width: '1px',
    height: '30px',
    backgroundColor: '#e2e8f0',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px',
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr',
      gap: '20px',
    }
  },
  column: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    height: 'fit-content',
    maxHeight: 'calc(100vh - 200px)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  columnHeader: {
    padding: '20px 20px 12px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
  },
  columnTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#0f172a',
  },
  columnBadge: {
    padding: '4px 12px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '500',
  },
  cardList: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    scrollbarWidth: 'thin',
    scrollbarColor: '#cbd5e1 #f1f5f9',
    '&::-webkit-scrollbar': {
      width: '6px',
    },
    '&::-webkit-scrollbar-track': {
      background: '#f1f5f9',
      borderRadius: '3px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: '#cbd5e1',
      borderRadius: '3px',
      '&:hover': {
        background: '#94a3b8',
      },
    },
  },
  offenderCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
      borderColor: '#cbd5e1',
    },
  },
  interventionCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '12px',
    backgroundColor: '#ffffff',
    transition: 'all 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
      borderColor: '#cbd5e1',
    },
  },
  cardHeader: {
    marginBottom: '12px',
  },
  offenderInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  offenderName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#0f172a',
  },
  offenderId: {
    fontSize: '12px',
    color: '#64748b',
    fontFamily: 'monospace',
  },
  riskBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
  },
  needs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '12px',
    flexWrap: 'wrap',
  },
  need: {
    padding: '4px 10px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '12px',
  },
  recommendedDate: {
    fontSize: '12px',
    color: '#64748b',
  },
  assignButton: {
    padding: '8px 16px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
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
  interventionType: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  interventionInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    width: '100%',
  },
  interventionTypeBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: '500',
    alignSelf: 'flex-start',
  },
  interventionDetails: {
    marginBottom: '12px',
  },
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '12px',
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  detailLabel: {
    fontSize: '11px',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  detailValue: {
    fontSize: '14px',
    color: '#0f172a',
    fontWeight: '500',
  },
  notes: {
    padding: '10px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    border: '1px solid #f1f5f9',
  },
  notesLabel: {
    fontSize: '12px',
    color: '#64748b',
    display: 'block',
    marginBottom: '4px',
    fontWeight: '500',
  },
  notesText: {
    margin: 0,
    fontSize: '13px',
    color: '#334155',
    lineHeight: '1.5',
  },
  progressBar: {
    height: '4px',
    backgroundColor: '#f1f5f9',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressFill: {
    width: '60%',
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: '2px',
  },
  emptyState: {
    padding: '48px 24px',
    textAlign: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px dashed #cbd5e1',
  },
  emptyStateText: {
    margin: 0,
    color: '#64748b',
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
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
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
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    ':focus': {
      outline: 'none',
      borderColor: '#0f172a',
      boxShadow: '0 0 0 3px rgba(15,23,42,0.1)',
    },
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#0f172a',
    fontFamily: 'inherit',
    resize: 'vertical',
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