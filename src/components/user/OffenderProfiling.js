import React, { useState, useEffect } from 'react';
import { addOffender } from '../../utils/database';
import { auth } from '../../config/firebase';
import { InlineSpinner } from '../common/LoadingSpinner';

const OffenderProfiling = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    address: '',
    phone: '',
    email: '',
    offenseType: '',
    offenseDate: '',
    sentenceLength: '',
    riskLevel: 'Low',
    previousOffenses: '',
    employmentStatus: '',
    educationLevel: '',
    substanceAbuse: false,
    mentalHealthIssues: false,
    familySupport: '',
    recommendedForCS: false,
    status: 'pending'
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formProgress, setFormProgress] = useState(0);

  useEffect(() => {
    // Get current user from Firebase or localStorage
    const getUserInfo = () => {
      // Check Firebase first
      if (auth.currentUser) {
        setCurrentUser({
          uid: auth.currentUser.uid,
          email: auth.currentUser.email
        });
        return;
      }

      // Check localStorage for hardcoded user
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setCurrentUser({
            uid: userData.uid || 'hardcoded-user',
            email: userData.email,
            isHardcoded: true
          });
        } catch (error) {
          console.error('Error parsing stored user:', error);
        }
      }
    };

    getUserInfo();
  }, []);

  // Calculate form progress
  useEffect(() => {
    const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'offenseType'];
    const filledRequired = requiredFields.filter(field => formData[field]).length;
    const requiredProgress = (filledRequired / requiredFields.length) * 60;
    
    const optionalFields = ['phone', 'email', 'address', 'sentenceLength', 'previousOffenses', 
                           'employmentStatus', 'educationLevel', 'familySupport'];
    const filledOptional = optionalFields.filter(field => formData[field]).length;
    const optionalProgress = (filledOptional / optionalFields.length) * 40;
    
    setFormProgress(Math.round(requiredProgress + optionalProgress));
  }, [formData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || !formData.offenseType) {
        throw new Error('Please fill in all required fields');
      }

      // Get user info with fallback
      const userEmail = currentUser?.email || 'unknown@user.com';
      const userUid = currentUser?.uid || 'unknown-uid';

      const offenderData = {
        ...formData,
        createdAt: new Date().toISOString(),
        vettedBy: userEmail,
        vettingDate: new Date().toISOString(),
        createdBy: userUid
      };

      // Remove any undefined values
      Object.keys(offenderData).forEach(key => {
        if (offenderData[key] === undefined) {
          offenderData[key] = '';
        }
      });

      await addOffender(offenderData);
      
      setMessageType('success');
      setMessage('Profile created successfully!');
      
      // Reset form
      setFormData({
        firstName: '', lastName: '', dateOfBirth: '', address: '', phone: '', email: '',
        offenseType: '', offenseDate: '', sentenceLength: '', riskLevel: 'Low',
        previousOffenses: '', employmentStatus: '', educationLevel: '',
        substanceAbuse: false, mentalHealthIssues: false, familySupport: '',
        recommendedForCS: false, status: 'pending'
      });
      setCurrentStep(1);
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('Error creating profile:', error);
      setMessageType('error');
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.firstName || !formData.lastName || !formData.dateOfBirth) {
        setMessageType('error');
        setMessage('Please fill in all required personal information fields');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Offender Profiling (#9)</h2>
        <div style={styles.progressContainer}>
          <div style={styles.progressBar}>
            <div style={{
              ...styles.progressFill,
              width: `${formProgress}%`
            }}></div>
          </div>
          <span style={styles.progressText}>{formProgress}% Complete</span>
        </div>
      </div>
      
      {message && (
        <div style={{
          ...styles.message,
          ...(messageType === 'error' ? styles.errorMessage : styles.successMessage)
        }}>
          <span style={styles.messageIcon}>
            {messageType === 'error' ? '⚠️' : '✅'}
          </span>
          {message}
          <button 
            style={styles.messageClose}
            onClick={() => setMessage('')}
          >
            ×
          </button>
        </div>
      )}
      
      {currentUser && (
        <div style={styles.userInfo}>
          <span style={styles.userIcon}>👤</span>
          <span>Logged in as: <strong>{currentUser.email}</strong></span>
        </div>
      )}
      
      {/* Step Indicators */}
      <div style={styles.stepIndicator}>
        {[1, 2, 3].map(step => (
          <div key={step} style={styles.stepItem}>
            <div style={{
              ...styles.stepCircle,
              ...(step === currentStep ? styles.stepCircleActive : {}),
              ...(step < currentStep ? styles.stepCircleCompleted : {})
            }}>
              {step < currentStep ? '✓' : step}
            </div>
            <span style={styles.stepLabel}>
              {step === 1 ? 'Personal' : step === 2 ? 'Offense' : 'Assessment'}
            </span>
          </div>
        ))}
      </div>
      
      <form onSubmit={handleSubmit} style={styles.form}>
        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div style={styles.formSection}>
            <h3 style={styles.sectionTitle}>Personal Information</h3>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  First Name <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  style={styles.input}
                  required
                  placeholder="Enter first name"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Last Name <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  style={styles.input}
                  required
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Date of Birth <span style={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={styles.input}
                placeholder="Enter email address"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                style={{...styles.input, minHeight: '80px', resize: 'vertical'}}
                placeholder="Enter full address"
              />
            </div>
          </div>
        )}

        {/* Step 2: Offense Details */}
        {currentStep === 2 && (
          <div style={styles.formSection}>
            <h3 style={styles.sectionTitle}>Offense Details</h3>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Offense Type <span style={styles.required}>*</span>
                </label>
                <select
                  name="offenseType"
                  value={formData.offenseType}
                  onChange={handleChange}
                  style={styles.input}
                  required
                >
                  <option value="">Select offense type...</option>
                  <option value="Theft">Theft</option>
                  <option value="Assault">Assault</option>
                  <option value="Drug Related">Drug Related</option>
                  <option value="Property Damage">Property Damage</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Offense Date</label>
                <input
                  type="date"
                  name="offenseDate"
                  value={formData.offenseDate}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Sentence Length (months)</label>
                <input
                  type="number"
                  name="sentenceLength"
                  value={formData.sentenceLength}
                  onChange={handleChange}
                  style={styles.input}
                  min="0"
                  placeholder="Enter sentence length"
                />
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Previous Offenses</label>
                <input
                  type="number"
                  name="previousOffenses"
                  value={formData.previousOffenses}
                  onChange={handleChange}
                  style={styles.input}
                  min="0"
                  placeholder="Number of previous offenses"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Risk Assessment */}
        {currentStep === 3 && (
          <div style={styles.formSection}>
            <h3 style={styles.sectionTitle}>Risk Assessment</h3>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Risk Level</label>
                <select
                  name="riskLevel"
                  value={formData.riskLevel}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="Low">Low Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="High">High Risk</option>
                </select>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Employment Status</label>
                <select
                  name="employmentStatus"
                  value={formData.employmentStatus}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="">Select status...</option>
                  <option value="Employed">Employed</option>
                  <option value="Unemployed">Unemployed</option>
                  <option value="Student">Student</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Education Level</label>
                <select
                  name="educationLevel"
                  value={formData.educationLevel}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="">Select education level...</option>
                  <option value="None">No formal education</option>
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                  <option value="Tertiary">Tertiary</option>
                </select>
              </div>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Family Support</label>
                <select
                  name="familySupport"
                  value={formData.familySupport}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="">Select support level...</option>
                  <option value="Strong">Strong</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Weak">Weak</option>
                  <option value="None">None</option>
                </select>
              </div>
            </div>

            <div style={styles.checkboxGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="substanceAbuse"
                  checked={formData.substanceAbuse}
                  onChange={handleChange}
                  style={styles.checkbox}
                />
                <span style={styles.checkboxText}>Substance Abuse Issues</span>
              </label>
            </div>

            <div style={styles.checkboxGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="mentalHealthIssues"
                  checked={formData.mentalHealthIssues}
                  onChange={handleChange}
                  style={styles.checkbox}
                />
                <span style={styles.checkboxText}>Mental Health Issues</span>
              </label>
            </div>

            <div style={styles.checkboxGroup}>
              <label style={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="recommendedForCS"
                  checked={formData.recommendedForCS}
                  onChange={handleChange}
                  style={styles.checkbox}
                />
                <span style={styles.checkboxText}>Recommend for Community Service</span>
              </label>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={styles.buttonGroup}>
          {currentStep > 1 && (
            <button 
              type="button" 
              onClick={prevStep} 
              style={styles.secondaryButton}
              disabled={loading}
            >
              ← Previous
            </button>
          )}
          
          {currentStep < 3 ? (
            <button 
              type="button" 
              onClick={nextStep} 
              style={styles.primaryButton}
              disabled={loading}
            >
              Next →
            </button>
          ) : (
            <button 
              type="submit" 
              style={styles.submitButton} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <InlineSpinner size="small" color="#ffffff" />
                  <span style={styles.buttonText}>Creating Profile...</span>
                </>
              ) : (
                'Create Profile'
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    maxWidth: '900px',
    margin: '0 auto',
    padding: 'clamp(16px, 4vw, 24px)',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
  },
  header: {
    marginBottom: 'clamp(20px, 4vw, 24px)',
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
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  progressBar: {
    flex: 1,
    height: '8px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    overflow: 'hidden',
    minWidth: '200px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000000',
    transition: 'width 0.3s ease',
    borderRadius: '4px',
  },
  progressText: {
    fontSize: 'clamp(12px, 2.5vw, 14px)',
    color: '#666666',
    fontWeight: '500',
  },
  userInfo: {
    backgroundColor: '#f8f8f8',
    padding: 'clamp(10px, 2.5vw, 12px) clamp(12px, 3vw, 16px)',
    borderRadius: '10px',
    marginBottom: 'clamp(20px, 4vw, 24px)',
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
  stepIndicator: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 'clamp(24px, 5vw, 30px)',
    position: 'relative',
    padding: '0 10px',
  },
  stepItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  stepCircle: {
    width: 'clamp(30px, 6vw, 36px)',
    height: 'clamp(30px, 6vw, 36px)',
    borderRadius: '50%',
    backgroundColor: '#f0f0f0',
    border: '2px solid #cccccc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'clamp(13px, 3vw, 14px)',
    fontWeight: '600',
    color: '#666666',
    transition: 'all 0.3s ease',
  },
  stepCircleActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
    color: '#ffffff',
    transform: 'scale(1.1)',
  },
  stepCircleCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
    color: '#ffffff',
  },
  stepLabel: {
    fontSize: 'clamp(11px, 2.5vw, 12px)',
    color: '#666666',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  form: {
    backgroundColor: '#ffffff',
    padding: 'clamp(20px, 4vw, 30px)',
    borderRadius: '16px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
  },
  formSection: {
    marginBottom: 'clamp(20px, 4vw, 24px)',
    animation: 'fadeIn 0.3s ease',
  },
  sectionTitle: {
    fontSize: 'clamp(16px, 3.5vw, 18px)',
    marginBottom: 'clamp(16px, 3vw, 20px)',
    color: '#000000',
    fontWeight: '600',
    paddingBottom: '10px',
    borderBottom: '2px solid #f0f0f0',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 'clamp(12px, 3vw, 16px)',
    marginBottom: 'clamp(12px, 3vw, 16px)',
    '@media (max-width: 640px)': {
      gridTemplateColumns: '1fr',
      gap: '12px',
    },
  },
  formGroup: {
    marginBottom: 'clamp(12px, 3vw, 16px)',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    color: '#333333',
    fontWeight: '500',
    fontSize: 'clamp(13px, 2.5vw, 14px)',
  },
  required: {
    color: '#ff4444',
    marginLeft: '4px',
  },
  input: {
    width: '100%',
    padding: 'clamp(10px, 2.5vw, 12px)',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: 'clamp(14px, 3vw, 16px)',
    boxSizing: 'border-box',
    backgroundColor: '#fafafa',
    color: '#000000',
    transition: 'all 0.2s ease',
    ':focus': {
      outline: 'none',
      borderColor: '#000000',
      backgroundColor: '#ffffff',
      boxShadow: '0 0 0 3px rgba(0,0,0,0.1)',
    },
    ':hover': {
      borderColor: '#999999',
    },
  },
  checkboxGroup: {
    marginBottom: '12px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#333333',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 3vw, 16px)',
    padding: '6px 0',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
    accentColor: '#000000',
  },
  checkboxText: {
    userSelect: 'none',
  },
  buttonGroup: {
    display: 'flex',
    gap: 'clamp(12px, 3vw, 16px)',
    marginTop: 'clamp(20px, 4vw, 24px)',
    '@media (max-width: 480px)': {
      flexDirection: 'column',
    },
  },
  primaryButton: {
    flex: 1,
    padding: 'clamp(12px, 3vw, 14px)',
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#333333',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
      transform: 'none',
    },
  },
  secondaryButton: {
    flex: 1,
    padding: 'clamp(12px, 3vw, 14px)',
    backgroundColor: '#666666',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#777777',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
      transform: 'none',
    },
  },
  submitButton: {
    flex: 2,
    padding: 'clamp(12px, 3vw, 14px)',
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    ':hover': {
      backgroundColor: '#333333',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
      transform: 'none',
    },
  },
  buttonText: {
    marginLeft: '8px',
  },
  message: {
    padding: 'clamp(12px, 3vw, 16px)',
    borderRadius: '10px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    position: 'relative',
    animation: 'slideIn 0.3s ease',
  },
  messageIcon: {
    fontSize: '20px',
  },
  messageClose: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    fontSize: '20px',
    cursor: 'pointer',
    color: 'inherit',
    opacity: 0.7,
    ':hover': {
      opacity: 1,
    },
  },
  successMessage: {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
    border: '1px solid #a5d6a5',
  },
  errorMessage: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    border: '1px solid #ffcdd2',
  },
};

// Add global animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;
document.head.appendChild(style);

export default OffenderProfiling;