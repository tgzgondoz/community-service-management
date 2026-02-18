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
        <div style={styles.modal}>
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
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  style={{...styles.input, minHeight: '80px'}}
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
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
  },
  column: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0'
  },
  columnTitle: {
    marginTop: 0,
    marginBottom: '20px',
    color: '#000000',
    fontSize: '18px'
  },
  cardList: {
    maxHeight: '600px',
    overflowY: 'auto'
  },
  offenderCard: {
    border: '1px solid #cccccc',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '10px',
    backgroundColor: '#f5f5f5'
  },
  interventionCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '10px',
    border: '1px solid #cccccc'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  offenderName: {
    color: '#000000'
  },
  riskBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '12px'
  },
  needs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px',
    flexWrap: 'wrap'
  },
  need: {
    backgroundColor: '#e0e0e0',
    color: '#333333',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    border: '1px solid #cccccc'
  },
  assignButton: {
    width: '100%',
    padding: '8px',
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  interventionIcon: {
    fontSize: '20px',
    marginRight: '10px'
  },
  interventionDetails: {
    fontSize: '14px',
    color: '#333333'
  },
  detailItem: {
    margin: '4px 0'
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

export default AdminInterventions;