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
        <h1 style={styles.title}>Offender Profiling</h1>
        <p style={styles.subtitle}>Create a new offender profile</p>
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
          <span>{message}</span>
          <button 
            style={styles.messageClose}
            onClick={() => setMessage('')}
          >
            Dismiss
          </button>
        </div>
      )}
      
      {currentUser && (
        <div style={styles.userInfo}>
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
              {step}
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
            <h2 style={styles.sectionTitle}>Personal Information</h2>
            
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
            <h2 style={styles.sectionTitle}>Offense Details</h2>
            
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
            <h2 style={styles.sectionTitle}>Risk Assessment</h2>
            
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
              Previous
            </button>
          )}
          
          {currentStep < 3 ? (
            <button 
              type="button" 
              onClick={nextStep} 
              style={styles.primaryButton}
              disabled={loading}
            >
              Next
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
    marginBottom: '24px',
  },
  title: {
    fontSize: 'clamp(28px, 5vw, 32px)',
    marginBottom: '4px',
    color: '#0f172a',
    fontWeight: '600',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '16px',
    color: '#64748b',
    marginBottom: '20px',
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  progressBar: {
    flex: 1,
    height: '6px',
    backgroundColor: '#e2e8f0',
    borderRadius: '3px',
    overflow: 'hidden',
    minWidth: '200px',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0f172a',
    transition: 'width 0.3s ease',
    borderRadius: '3px',
  },
  progressText: {
    fontSize: '13px',
    color: '#64748b',
    fontWeight: '500',
  },
  userInfo: {
    backgroundColor: '#ffffff',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '24px',
    fontSize: '14px',
    color: '#1e293b',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  stepIndicator: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
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
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#f1f5f9',
    border: '2px solid #cbd5e1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: '#64748b',
    transition: 'all 0.3s ease',
  },
  stepCircleActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
    color: '#ffffff',
    transform: 'scale(1.1)',
  },
  stepCircleCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    color: '#ffffff',
  },
  stepLabel: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  form: {
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0',
    '@media (max-width: 640px)': {
      padding: '20px',
    },
  },
  formSection: {
    marginBottom: '24px',
    animation: 'fadeIn 0.3s ease',
  },
  sectionTitle: {
    fontSize: '18px',
    marginBottom: '20px',
    color: '#0f172a',
    fontWeight: '600',
    paddingBottom: '10px',
    borderBottom: '1px solid #e2e8f0',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '16px',
    '@media (max-width: 640px)': {
      gridTemplateColumns: '1fr',
      gap: '12px',
    },
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    color: '#334155',
    fontWeight: '500',
    fontSize: '14px',
  },
  required: {
    color: '#ef4444',
    marginLeft: '4px',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    transition: 'all 0.2s ease',
    ':focus': {
      outline: 'none',
      borderColor: '#0f172a',
      boxShadow: '0 0 0 3px rgba(15,23,42,0.1)',
    },
    ':hover': {
      borderColor: '#94a3b8',
    },
  },
  checkboxGroup: {
    marginBottom: '12px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#334155',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '6px 0',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: '#0f172a',
  },
  checkboxText: {
    userSelect: 'none',
  },
  buttonGroup: {
    display: 'flex',
    gap: '16px',
    marginTop: '24px',
    '@media (max-width: 480px)': {
      flexDirection: 'column',
    },
  },
  primaryButton: {
    flex: 1,
    padding: '12px 24px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
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
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
      transform: 'none',
    },
  },
  secondaryButton: {
    flex: 1,
    padding: '12px 24px',
    backgroundColor: '#ffffff',
    color: '#475569',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f8fafc',
      borderColor: '#94a3b8',
      transform: 'translateY(-1px)',
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
    padding: '12px 24px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    ':hover': {
      backgroundColor: '#1e293b',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
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
    marginLeft: '4px',
  },
  message: {
    padding: '14px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '10px',
    animation: 'slideIn 0.3s ease',
    fontSize: '14px',
  },
  messageClose: {
    background: 'none',
    border: '1px solid currentColor',
    fontSize: '12px',
    cursor: 'pointer',
    padding: '4px 10px',
    borderRadius: '4px',
    opacity: 0.7,
    transition: 'opacity 0.2s ease',
    ':hover': {
      opacity: 1,
    },
  },
  successMessage: {
    backgroundColor: '#f0fdf4',
    color: '#166534',
    border: '1px solid #bbf7d0',
  },
  errorMessage: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecaca',
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
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;
document.head.appendChild(style);

export default OffenderProfiling;