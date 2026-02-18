import React, { useState, useEffect } from 'react';
import { addOffender } from '../../utils/database';
import { auth } from '../../config/firebase';

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
    } catch (error) {
      console.error('Error creating profile:', error);
      setMessageType('error');
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Offender Profiling (#9)</h2>
      
      {message && (
        <div style={{...styles.message, ...(messageType === 'error' ? styles.errorMessage : styles.successMessage)}}>
          {message}
        </div>
      )}
      
      {currentUser && (
        <div style={styles.userInfo}>
          Logged in as: <strong>{currentUser.email}</strong>
        </div>
      )}
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formSection}>
          <h3 style={styles.sectionTitle}>Personal Information</h3>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>First Name *</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Last Name *</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Date of Birth *</label>
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
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              style={{...styles.input, minHeight: '60px'}}
            />
          </div>
        </div>

        <div style={styles.formSection}>
          <h3 style={styles.sectionTitle}>Offense Details</h3>
          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Offense Type *</label>
              <select
                name="offenseType"
                value={formData.offenseType}
                onChange={handleChange}
                style={styles.input}
                required
              >
                <option value="">Select...</option>
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
              />
            </div>
          </div>
        </div>

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
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
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
                <option value="">Select...</option>
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
                <option value="">Select...</option>
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
                <option value="">Select...</option>
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
              />
              Substance Abuse Issues
            </label>
          </div>

          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="mentalHealthIssues"
                checked={formData.mentalHealthIssues}
                onChange={handleChange}
              />
              Mental Health Issues
            </label>
          </div>

          <div style={styles.checkboxGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="recommendedForCS"
                checked={formData.recommendedForCS}
                onChange={handleChange}
              />
              Recommend for Community Service
            </label>
          </div>
        </div>

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? 'Creating Profile...' : 'Create Profile'}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
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
  form: {
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0'
  },
  formSection: {
    marginBottom: '30px',
    paddingBottom: '20px',
    borderBottom: '1px solid #e0e0e0'
  },
  sectionTitle: {
    fontSize: '18px',
    marginBottom: '15px',
    color: '#333333'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginBottom: '15px'
  },
  formGroup: {
    marginBottom: '15px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    color: '#333333',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #cccccc',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    color: '#000000'
  },
  checkboxGroup: {
    marginBottom: '10px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#333333',
    cursor: 'pointer'
  },
  button: {
    backgroundColor: '#000000',
    color: '#ffffff',
    padding: '15px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    width: '100%',
    fontWeight: '600',
    transition: 'background-color 0.3s'
  },
  message: {
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  successMessage: {
    backgroundColor: '#f0f0f0',
    color: '#000000',
    border: '1px solid #00ff00'
  },
  errorMessage: {
    backgroundColor: '#f0f0f0',
    color: '#ff0000',
    border: '1px solid #ff0000'
  }
};

export default OffenderProfiling;