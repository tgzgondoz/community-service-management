import React, { useState, useEffect } from 'react';
import { auth } from '../../config/firebase';
import { getUserProfile, updateUserProfile } from '../../utils/database';
import LoadingSpinner, { InlineSpinner } from '../common/LoadingSpinner';

const UserProfile = () => {
  const [profile, setProfile] = useState({
    displayName: '',
    phone: '',
    department: '',
    bio: '',
    jobTitle: '',
    office: '',
    preferredLanguage: 'en'
  });
  const [originalProfile, setOriginalProfile] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [userEmail, setUserEmail] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    // Get user email
    if (auth.currentUser) {
      setUserEmail(auth.currentUser.email);
      loadProfile();
    } else {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          setUserEmail(userData.email);
          // For hardcoded users, set default profile
          const defaultProfile = {
            displayName: userData.displayName || userData.email.split('@')[0],
            phone: '',
            department: '',
            bio: '',
            jobTitle: 'Probation Officer',
            office: 'Main Office',
            preferredLanguage: 'en'
          };
          setProfile(defaultProfile);
          setOriginalProfile(defaultProfile);
          setLoading(false);
        } catch (error) {
          console.error('Error parsing stored user:', error);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
  }, []);

  const loadProfile = async () => {
    try {
      if (!auth.currentUser) return;
      
      const userProfile = await getUserProfile(auth.currentUser.uid);
      const loadedProfile = {
        displayName: userProfile?.displayName || '',
        phone: userProfile?.phone || '',
        department: userProfile?.department || '',
        bio: userProfile?.bio || '',
        jobTitle: userProfile?.jobTitle || 'Probation Officer',
        office: userProfile?.office || 'Main Office',
        preferredLanguage: userProfile?.preferredLanguage || 'en'
      };
      setProfile(loadedProfile);
      setOriginalProfile(loadedProfile);
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ 
        text: 'Error loading profile: ' + error.message, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({
      ...profile,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      if (!auth.currentUser) {
        // For hardcoded users, just show success message
        setMessage({ 
          text: 'Profile updated successfully! (Demo mode - changes not saved to database)', 
          type: 'success' 
        });
        setOriginalProfile(profile);
        setSaving(false);
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        return;
      }

      await updateUserProfile(auth.currentUser.uid, profile);
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setOriginalProfile(profile);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } catch (error) {
      setMessage({ text: 'Error updating profile: ' + error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (JSON.stringify(profile) !== JSON.stringify(originalProfile)) {
      setShowConfirmDialog(true);
    }
  };

  const confirmCancel = () => {
    setProfile(originalProfile);
    setShowConfirmDialog(false);
    setMessage({ text: 'Changes discarded', type: 'info' });
    setTimeout(() => setMessage({ text: '', type: '' }), 2000);
  };

  const hasChanges = JSON.stringify(profile) !== JSON.stringify(originalProfile);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={styles.container}>
      {/* Header with Cover Photo */}
      <div style={styles.coverPhoto}>
        <div style={styles.coverOverlay}>
          <div style={styles.profileHeader}>
            <div style={styles.avatarSection}>
              <div style={styles.avatar}>
                {profile.displayName ? profile.displayName.charAt(0).toUpperCase() : 
                 userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={styles.headerInfo}>
                <h1 style={styles.headerName}>
                  {profile.displayName || userEmail?.split('@')[0] || 'User'}
                </h1>
                <p style={styles.headerTitle}>
                  {profile.jobTitle} • {profile.department || 'Not specified'}
                </p>
                <p style={styles.headerEmail}>{userEmail}</p>
              </div>
            </div>
            <button 
              onClick={() => window.print()}
              style={styles.printButton}
              title="Print Profile"
            >
              🖨️
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={styles.tabContainer}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'profile' ? styles.activeTab : {})
          }}
          onClick={() => setActiveTab('profile')}
        >
          👤 Profile Information
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'settings' ? styles.activeTab : {})
          }}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Account Settings
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'activity' ? styles.activeTab : {})
          }}
          onClick={() => setActiveTab('activity')}
        >
          📊 Activity Log
        </button>
      </div>

      {/* Message Display */}
      {message.text && (
        <div style={{
          ...styles.message,
          ...(message.type === 'error' ? styles.errorMessage : 
             message.type === 'success' ? styles.successMessage : 
             styles.infoMessage)
        }}>
          <span style={styles.messageIcon}>
            {message.type === 'error' ? '⚠️' : 
             message.type === 'success' ? '✅' : 'ℹ️'}
          </span>
          {message.text}
          <button 
            style={styles.messageClose}
            onClick={() => setMessage({ text: '', type: '' })}
          >
            ×
          </button>
        </div>
      )}

      {/* Profile Tab Content */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formSection}>
            <h3 style={styles.sectionTitle}>Personal Information</h3>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <span style={styles.labelIcon}>📧</span>
                  Email Address
                </label>
                <input
                  type="email"
                  value={userEmail || ''}
                  style={{...styles.input, backgroundColor: '#f5f5f5'}}
                  disabled
                  readOnly
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <span style={styles.labelIcon}>👤</span>
                  Display Name
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={profile.displayName}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Enter your display name"
                />
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <span style={styles.labelIcon}>📞</span>
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Enter your phone number"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <span style={styles.labelIcon}>🏢</span>
                  Department
                </label>
                <select
                  name="department"
                  value={profile.department}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="">Select department...</option>
                  <option value="Probation">Probation</option>
                  <option value="Social Services">Social Services</option>
                  <option value="Corrections">Corrections</option>
                  <option value="Administration">Administration</option>
                  <option value="Court Services">Court Services</option>
                </select>
              </div>
            </div>

            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <span style={styles.labelIcon}>💼</span>
                  Job Title
                </label>
                <input
                  type="text"
                  name="jobTitle"
                  value={profile.jobTitle}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Enter your job title"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>
                  <span style={styles.labelIcon}>🏛️</span>
                  Office Location
                </label>
                <input
                  type="text"
                  name="office"
                  value={profile.office}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Enter office location"
                />
              </div>
            </div>
          </div>

          <div style={styles.formSection}>
            <h3 style={styles.sectionTitle}>Additional Information</h3>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>
                <span style={styles.labelIcon}>📝</span>
                Bio
              </label>
              <textarea
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                style={{...styles.input, minHeight: '120px', resize: 'vertical'}}
                placeholder="Tell us about yourself, your experience, and interests..."
              />
              <small style={styles.helperText}>
                Maximum 500 characters. {profile.bio.length}/500
              </small>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                <span style={styles.labelIcon}>🌐</span>
                Preferred Language
              </label>
              <select
                name="preferredLanguage"
                value={profile.preferredLanguage}
                onChange={handleChange}
                style={styles.input}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="zh">Chinese</option>
                <option value="ar">Arabic</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div style={styles.formActions}>
            <button 
              type="button" 
              onClick={handleCancel}
              style={styles.cancelButton}
              disabled={!hasChanges || saving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              style={{
                ...styles.saveButton,
                ...(hasChanges ? styles.saveButtonActive : styles.saveButtonDisabled)
              }} 
              disabled={!hasChanges || saving}
            >
              {saving ? (
                <>
                  <InlineSpinner size="small" color="#ffffff" />
                  <span style={styles.buttonText}>Saving...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>

          <p style={styles.lastUpdated}>
            Last updated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
        </form>
      )}

      {/* Settings Tab Content */}
      {activeTab === 'settings' && (
        <div style={styles.settingsContainer}>
          <div style={styles.settingsSection}>
            <h3 style={styles.sectionTitle}>Account Settings</h3>
            
            <div style={styles.settingItem}>
              <div style={styles.settingInfo}>
                <span style={styles.settingIcon}>🔒</span>
                <div style={styles.settingContent}>
                  <h4 style={styles.settingTitle}>Password</h4>
                  <p style={styles.settingDescription}>
                    Change your password regularly to keep your account secure
                  </p>
                </div>
              </div>
              <button style={styles.settingButton}>
                Change Password
              </button>
            </div>

            <div style={styles.settingItem}>
              <div style={styles.settingInfo}>
                <span style={styles.settingIcon}>📧</span>
                <div style={styles.settingContent}>
                  <h4 style={styles.settingTitle}>Email Notifications</h4>
                  <p style={styles.settingDescription}>
                    Manage how you receive email notifications
                  </p>
                </div>
              </div>
              <button style={styles.settingButton}>
                Configure
              </button>
            </div>

            <div style={styles.settingItem}>
              <div style={styles.settingInfo}>
                <span style={styles.settingIcon}>🔔</span>
                <div style={styles.settingContent}>
                  <h4 style={styles.settingTitle}>Push Notifications</h4>
                  <p style={styles.settingDescription}>
                    Control browser notification settings
                  </p>
                </div>
              </div>
              <button style={styles.settingButton}>
                Configure
              </button>
            </div>
          </div>

          <div style={styles.dangerSection}>
            <h4 style={styles.dangerTitle}>Danger Zone</h4>
            <div style={styles.settingItem}>
              <div style={styles.settingInfo}>
                <span style={styles.settingIcon}>⚠️</span>
                <div style={styles.settingContent}>
                  <h4 style={styles.dangerSubtitle}>Delete Account</h4>
                  <p style={styles.settingDescription}>
                    Permanently delete your account and all associated data
                  </p>
                </div>
              </div>
              <button style={styles.dangerButton}>
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Tab Content */}
      {activeTab === 'activity' && (
        <div style={styles.activityContainer}>
          <h3 style={styles.sectionTitle}>Recent Activity</h3>
          
          <div style={styles.timeline}>
            <div style={styles.timelineItem}>
              <div style={styles.timelineIcon}>📝</div>
              <div style={styles.timelineContent}>
                <p style={styles.timelineTitle}>Profile Updated</p>
                <p style={styles.timelineDescription}>
                  Your profile information was updated
                </p>
                <span style={styles.timelineTime}>2 hours ago</span>
              </div>
            </div>

            <div style={styles.timelineItem}>
              <div style={styles.timelineIcon}>👤</div>
              <div style={styles.timelineContent}>
                <p style={styles.timelineTitle}>New Offender Profile</p>
                <p style={styles.timelineDescription}>
                  You created a profile for John Doe
                </p>
                <span style={styles.timelineTime}>Yesterday</span>
              </div>
            </div>

            <div style={styles.timelineItem}>
              <div style={styles.timelineIcon}>✅</div>
              <div style={styles.timelineContent}>
                <p style={styles.timelineTitle}>Recommendation Made</p>
                <p style={styles.timelineDescription}>
                  You recommended Jane Smith for community service
                </p>
                <span style={styles.timelineTime}>3 days ago</span>
              </div>
            </div>

            <div style={styles.timelineItem}>
              <div style={styles.timelineIcon}>📊</div>
              <div style={styles.timelineContent}>
                <p style={styles.timelineTitle}>Report Generated</p>
                <p style={styles.timelineDescription}>
                  Monthly activity report was generated
                </p>
                <span style={styles.timelineTime}>1 week ago</span>
              </div>
            </div>
          </div>

          <button style={styles.viewAllButton}>
            View All Activity →
          </button>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div style={styles.modal} onClick={() => setShowConfirmDialog(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Discard Changes?</h3>
            <p style={styles.modalText}>
              You have unsaved changes. Are you sure you want to discard them?
            </p>
            <div style={styles.modalActions}>
              <button 
                style={styles.modalCancelButton}
                onClick={() => setShowConfirmDialog(false)}
              >
                Continue Editing
              </button>
              <button 
                style={styles.modalConfirmButton}
                onClick={confirmCancel}
              >
                Discard Changes
              </button>
            </div>
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
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '0 0 clamp(20px, 4vw, 30px) 0',
    backgroundColor: '#f8f9fa',
    boxSizing: 'border-box',
  },
  coverPhoto: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    height: 'clamp(150px, 30vw, 200px)',
    position: 'relative',
    borderRadius: '0 0 20px 20px',
    marginBottom: 'clamp(60px, 10vw, 80px)',
  },
  coverOverlay: {
    position: 'absolute',
    bottom: '-40px',
    left: 0,
    right: 0,
    padding: '0 clamp(16px, 4vw, 24px)',
  },
  profileHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: 'clamp(16px, 3vw, 20px)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
  },
  avatarSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(16px, 3vw, 20px)',
    flex: 1,
    flexWrap: 'wrap',
    '@media (max-width: 480px)': {
      flexDirection: 'column',
      textAlign: 'center',
    },
  },
  avatar: {
    width: 'clamp(60px, 12vw, 80px)',
    height: 'clamp(60px, 12vw, 80px)',
    backgroundColor: '#000000',
    color: '#ffffff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'clamp(24px, 5vw, 32px)',
    fontWeight: '600',
    border: '3px solid #ffffff',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    margin: '0 0 4px 0',
    fontSize: 'clamp(20px, 5vw, 24px)',
    color: '#000000',
    fontWeight: '600',
  },
  headerTitle: {
    margin: '0 0 4px 0',
    fontSize: 'clamp(13px, 3vw, 14px)',
    color: '#666666',
  },
  headerEmail: {
    margin: 0,
    fontSize: 'clamp(12px, 2.5vw, 13px)',
    color: '#999999',
  },
  printButton: {
    width: 'clamp(40px, 8vw, 48px)',
    height: 'clamp(40px, 8vw, 48px)',
    backgroundColor: '#f5f5f5',
    border: '1px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: 'clamp(18px, 4vw, 20px)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#e0e0e0',
      transform: 'translateY(-2px)',
    },
  },
  tabContainer: {
    display: 'flex',
    gap: 'clamp(8px, 2vw, 12px)',
    margin: 'clamp(20px, 4vw, 24px) clamp(16px, 4vw, 24px)',
    flexWrap: 'wrap',
    borderBottom: '2px solid #e0e0e0',
    paddingBottom: '2px',
  },
  tab: {
    padding: 'clamp(8px, 2vw, 12px) clamp(16px, 3vw, 20px)',
    background: 'none',
    border: 'none',
    fontSize: 'clamp(13px, 3vw, 15px)',
    fontWeight: '500',
    color: '#666666',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    borderRadius: '8px 8px 0 0',
    ':hover': {
      color: '#000000',
      backgroundColor: '#f5f5f5',
    },
  },
  activeTab: {
    color: '#000000',
    borderBottom: '3px solid #000000',
    backgroundColor: '#f5f5f5',
  },
  form: {
    backgroundColor: '#ffffff',
    padding: 'clamp(20px, 4vw, 30px)',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
    margin: '0 clamp(16px, 4vw, 24px)',
  },
  formSection: {
    marginBottom: 'clamp(24px, 5vw, 30px)',
    paddingBottom: 'clamp(20px, 4vw, 24px)',
    borderBottom: '2px solid #f0f0f0',
    ':last-child': {
      borderBottom: 'none',
      marginBottom: 0,
      paddingBottom: 0,
    },
  },
  sectionTitle: {
    fontSize: 'clamp(16px, 4vw, 18px)',
    marginBottom: 'clamp(16px, 3vw, 20px)',
    color: '#000000',
    fontWeight: '600',
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
    marginBottom: '8px',
    color: '#333333',
    fontWeight: '500',
    fontSize: 'clamp(13px, 2.5vw, 14px)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  labelIcon: {
    fontSize: '16px',
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
  helperText: {
    display: 'block',
    marginTop: '4px',
    fontSize: 'clamp(11px, 2.5vw, 12px)',
    color: '#999999',
  },
  formActions: {
    display: 'flex',
    gap: 'clamp(12px, 3vw, 16px)',
    marginTop: 'clamp(20px, 4vw, 24px)',
    '@media (max-width: 480px)': {
      flexDirection: 'column',
    },
  },
  cancelButton: {
    flex: 1,
    padding: 'clamp(12px, 3vw, 14px)',
    backgroundColor: '#ffffff',
    color: '#666666',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover:not(:disabled)': {
      backgroundColor: '#f5f5f5',
      borderColor: '#999999',
      transform: 'translateY(-2px)',
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  saveButton: {
    flex: 2,
    padding: 'clamp(12px, 3vw, 14px)',
    backgroundColor: '#cccccc',
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
  },
  saveButtonActive: {
    backgroundColor: '#000000',
    ':hover': {
      backgroundColor: '#333333',
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    },
  },
  saveButtonDisabled: {
    cursor: 'not-allowed',
    opacity: 0.7,
  },
  buttonText: {
    marginLeft: '8px',
  },
  lastUpdated: {
    marginTop: '16px',
    fontSize: 'clamp(11px, 2.5vw, 12px)',
    color: '#999999',
    textAlign: 'right',
  },
  message: {
    padding: 'clamp(12px, 3vw, 16px)',
    borderRadius: '10px',
    margin: '0 clamp(16px, 4vw, 24px) 20px clamp(16px, 4vw, 24px)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    position: 'relative',
    animation: 'slideIn 0.3s ease',
  },
  messageIcon: {
    fontSize: '18px',
  },
  messageClose: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    fontSize: '18px',
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
  infoMessage: {
    backgroundColor: '#e3f2fd',
    color: '#0d47a1',
    border: '1px solid #90caf9',
  },
  settingsContainer: {
    backgroundColor: '#ffffff',
    padding: 'clamp(20px, 4vw, 30px)',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
    margin: '0 clamp(16px, 4vw, 24px)',
  },
  settingsSection: {
    marginBottom: 'clamp(24px, 5vw, 30px)',
  },
  settingItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'clamp(12px, 3vw, 16px)',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    marginBottom: '8px',
    flexWrap: 'wrap',
    gap: '12px',
    '@media (max-width: 480px)': {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
  },
  settingInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  settingIcon: {
    fontSize: '20px',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    margin: '0 0 4px 0',
    fontSize: 'clamp(14px, 3vw, 15px)',
    color: '#000000',
    fontWeight: '500',
  },
  settingDescription: {
    margin: 0,
    fontSize: 'clamp(12px, 2.5vw, 13px)',
    color: '#666666',
  },
  settingButton: {
    padding: '8px 16px',
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: 'clamp(12px, 2.5vw, 13px)',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#333333',
      transform: 'translateY(-2px)',
    },
    '@media (max-width: 480px)': {
      width: '100%',
    },
  },
  dangerSection: {
    backgroundColor: '#fff2f0',
    borderRadius: '10px',
    padding: 'clamp(16px, 3vw, 20px)',
    border: '1px solid #ffcdd2',
  },
  dangerTitle: {
    margin: '0 0 12px 0',
    fontSize: 'clamp(14px, 3vw, 16px)',
    color: '#c62828',
    fontWeight: '600',
  },
  dangerSubtitle: {
    margin: '0 0 4px 0',
    fontSize: 'clamp(14px, 3vw, 15px)',
    color: '#c62828',
    fontWeight: '500',
  },
  dangerButton: {
    padding: '8px 16px',
    backgroundColor: '#f44336',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: 'clamp(12px, 2.5vw, 13px)',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#d32f2f',
      transform: 'translateY(-2px)',
    },
    '@media (max-width: 480px)': {
      width: '100%',
    },
  },
  activityContainer: {
    backgroundColor: '#ffffff',
    padding: 'clamp(20px, 4vw, 30px)',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
    margin: '0 clamp(16px, 4vw, 24px)',
  },
  timeline: {
    marginTop: '20px',
  },
  timelineItem: {
    display: 'flex',
    gap: '16px',
    padding: '16px 0',
    borderBottom: '1px solid #f0f0f0',
    ':last-child': {
      borderBottom: 'none',
    },
    '@media (max-width: 480px)': {
      flexDirection: 'column',
      gap: '8px',
    },
  },
  timelineIcon: {
    width: '36px',
    height: '36px',
    backgroundColor: '#f5f5f5',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    margin: '0 0 4px 0',
    fontSize: 'clamp(14px, 3vw, 15px)',
    color: '#000000',
    fontWeight: '500',
  },
  timelineDescription: {
    margin: '0 0 4px 0',
    fontSize: 'clamp(13px, 2.5vw, 14px)',
    color: '#666666',
  },
  timelineTime: {
    fontSize: 'clamp(11px, 2.5vw, 12px)',
    color: '#999999',
  },
  viewAllButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#666666',
    cursor: 'pointer',
    marginTop: '20px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#e0e0e0',
    },
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '16px',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 'clamp(20px, 5vw, 24px)',
    borderRadius: '16px',
    maxWidth: '400px',
    width: '100%',
    animation: 'slideUp 0.3s ease',
  },
  modalTitle: {
    margin: '0 0 12px 0',
    fontSize: 'clamp(18px, 4vw, 20px)',
    color: '#000000',
    fontWeight: '600',
  },
  modalText: {
    margin: '0 0 20px 0',
    fontSize: 'clamp(14px, 3vw, 16px)',
    color: '#666666',
    lineHeight: 1.5,
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    '@media (max-width: 480px)': {
      flexDirection: 'column',
    },
  },
  modalCancelButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#f5f5f5',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#666666',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#e0e0e0',
    },
  },
  modalConfirmButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#333333',
    },
  },
};

// Add global animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
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

export default UserProfile;