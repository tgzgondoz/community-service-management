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
          text: 'Profile updated successfully! (Demo mode)', 
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
                  {profile.jobTitle} {profile.department && `• ${profile.department}`}
                </p>
                <p style={styles.headerEmail}>{userEmail}</p>
              </div>
            </div>
            <button 
              onClick={() => window.print()}
              style={styles.printButton}
            >
              Print
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
          Profile Information
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'settings' ? styles.activeTab : {})
          }}
          onClick={() => setActiveTab('settings')}
        >
          Account Settings
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'activity' ? styles.activeTab : {})
          }}
          onClick={() => setActiveTab('activity')}
        >
          Activity Log
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
          <span>{message.text}</span>
          <button 
            style={styles.messageClose}
            onClick={() => setMessage({ text: '', type: '' })}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Profile Tab Content */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formSection}>
            <h2 style={styles.sectionTitle}>Personal Information</h2>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  value={userEmail || ''}
                  style={{...styles.input, backgroundColor: '#f1f5f9'}}
                  disabled
                  readOnly
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Display Name</label>
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
                <label style={styles.label}>Phone Number</label>
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
                <label style={styles.label}>Department</label>
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
                <label style={styles.label}>Job Title</label>
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
                <label style={styles.label}>Office Location</label>
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
            <h2 style={styles.sectionTitle}>Additional Information</h2>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Bio</label>
              <textarea
                name="bio"
                value={profile.bio}
                onChange={handleChange}
                style={{...styles.input, minHeight: '100px', resize: 'vertical'}}
                placeholder="Tell us about yourself, your experience, and interests..."
              />
              <small style={styles.helperText}>
                {profile.bio.length}/500 characters
              </small>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Preferred Language</label>
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
            <h2 style={styles.sectionTitle}>Account Settings</h2>
            
            <div style={styles.settingItem}>
              <div style={styles.settingInfo}>
                <div style={styles.settingContent}>
                  <h3 style={styles.settingTitle}>Password</h3>
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
                <div style={styles.settingContent}>
                  <h3 style={styles.settingTitle}>Email Notifications</h3>
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
                <div style={styles.settingContent}>
                  <h3 style={styles.settingTitle}>Push Notifications</h3>
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
            <h3 style={styles.dangerTitle}>Danger Zone</h3>
            <div style={styles.settingItem}>
              <div style={styles.settingInfo}>
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
          <h2 style={styles.sectionTitle}>Recent Activity</h2>
          
          <div style={styles.timeline}>
            <div style={styles.timelineItem}>
              <div style={styles.timelineContent}>
                <p style={styles.timelineTitle}>Profile Updated</p>
                <p style={styles.timelineDescription}>
                  Your profile information was updated
                </p>
                <span style={styles.timelineTime}>2 hours ago</span>
              </div>
            </div>

            <div style={styles.timelineItem}>
              <div style={styles.timelineContent}>
                <p style={styles.timelineTitle}>New Offender Profile</p>
                <p style={styles.timelineDescription}>
                  You created a profile for John Doe
                </p>
                <span style={styles.timelineTime}>Yesterday</span>
              </div>
            </div>

            <div style={styles.timelineItem}>
              <div style={styles.timelineContent}>
                <p style={styles.timelineTitle}>Recommendation Made</p>
                <p style={styles.timelineDescription}>
                  You recommended Jane Smith for community service
                </p>
                <span style={styles.timelineTime}>3 days ago</span>
              </div>
            </div>

            <div style={styles.timelineItem}>
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
            View All Activity
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
    padding: '0 0 30px 0',
    backgroundColor: '#f8fafc',
    boxSizing: 'border-box',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  coverPhoto: {
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    height: '180px',
    position: 'relative',
    borderRadius: '0 0 20px 20px',
    marginBottom: '70px',
  },
  coverOverlay: {
    position: 'absolute',
    bottom: '-40px',
    left: 0,
    right: 0,
    padding: '0 24px',
  },
  profileHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0',
  },
  avatarSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    flex: 1,
    flexWrap: 'wrap',
    '@media (max-width: 480px)': {
      flexDirection: 'column',
      textAlign: 'center',
    },
  },
  avatar: {
    width: '80px',
    height: '80px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: '600',
    border: '3px solid #ffffff',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    margin: '0 0 4px 0',
    fontSize: '24px',
    color: '#0f172a',
    fontWeight: '600',
    letterSpacing: '-0.02em',
  },
  headerTitle: {
    margin: '0 0 4px 0',
    fontSize: '14px',
    color: '#64748b',
  },
  headerEmail: {
    margin: 0,
    fontSize: '13px',
    color: '#94a3b8',
  },
  printButton: {
    padding: '8px 16px',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#475569',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#e2e8f0',
      transform: 'translateY(-1px)',
    },
  },
  tabContainer: {
    display: 'flex',
    gap: '12px',
    margin: '24px 24px',
    flexWrap: 'wrap',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '2px',
  },
  tab: {
    padding: '10px 20px',
    background: 'none',
    border: 'none',
    fontSize: '15px',
    fontWeight: '500',
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    borderRadius: '8px 8px 0 0',
    ':hover': {
      color: '#0f172a',
      backgroundColor: '#f1f5f9',
    },
  },
  activeTab: {
    color: '#0f172a',
    borderBottom: '2px solid #0f172a',
    backgroundColor: '#f8fafc',
  },
  form: {
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    margin: '0 24px',
  },
  formSection: {
    marginBottom: '30px',
    paddingBottom: '24px',
    borderBottom: '1px solid #e2e8f0',
    ':last-child': {
      borderBottom: 'none',
      marginBottom: 0,
      paddingBottom: 0,
    },
  },
  sectionTitle: {
    fontSize: '18px',
    marginBottom: '20px',
    color: '#0f172a',
    fontWeight: '600',
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
  helperText: {
    display: 'block',
    marginTop: '4px',
    fontSize: '12px',
    color: '#94a3b8',
  },
  formActions: {
    display: 'flex',
    gap: '16px',
    marginTop: '24px',
    '@media (max-width: 480px)': {
      flexDirection: 'column',
    },
  },
  cancelButton: {
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
    ':hover:not(:disabled)': {
      backgroundColor: '#f8fafc',
      borderColor: '#94a3b8',
      transform: 'translateY(-1px)',
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  },
  saveButton: {
    flex: 2,
    padding: '12px 24px',
    backgroundColor: '#94a3b8',
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
  },
  saveButtonActive: {
    backgroundColor: '#0f172a',
    ':hover': {
      backgroundColor: '#1e293b',
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    },
  },
  saveButtonDisabled: {
    cursor: 'not-allowed',
  },
  buttonText: {
    marginLeft: '4px',
  },
  lastUpdated: {
    marginTop: '16px',
    fontSize: '12px',
    color: '#94a3b8',
    textAlign: 'right',
  },
  message: {
    padding: '14px 20px',
    borderRadius: '8px',
    margin: '0 24px 20px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
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
  infoMessage: {
    backgroundColor: '#eff6ff',
    color: '#1e40af',
    border: '1px solid #bfdbfe',
  },
  settingsContainer: {
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    margin: '0 24px',
  },
  settingsSection: {
    marginBottom: '30px',
  },
  settingItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    marginBottom: '8px',
    flexWrap: 'wrap',
    gap: '12px',
    border: '1px solid #f1f5f9',
    '@media (max-width: 480px)': {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
  },
  settingInfo: {
    flex: 1,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    margin: '0 0 4px 0',
    fontSize: '15px',
    color: '#0f172a',
    fontWeight: '600',
  },
  settingDescription: {
    margin: 0,
    fontSize: '13px',
    color: '#64748b',
  },
  settingButton: {
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    color: '#475569',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f8fafc',
      borderColor: '#94a3b8',
      transform: 'translateY(-1px)',
    },
    '@media (max-width: 480px)': {
      width: '100%',
    },
  },
  dangerSection: {
    backgroundColor: '#fef2f2',
    borderRadius: '10px',
    padding: '20px',
    border: '1px solid #fee2e2',
  },
  dangerTitle: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    color: '#991b1b',
    fontWeight: '600',
  },
  dangerSubtitle: {
    margin: '0 0 4px 0',
    fontSize: '15px',
    color: '#991b1b',
    fontWeight: '500',
  },
  dangerButton: {
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#fee2e2',
      transform: 'translateY(-1px)',
    },
    '@media (max-width: 480px)': {
      width: '100%',
    },
  },
  activityContainer: {
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #e2e8f0',
    margin: '0 24px',
  },
  timeline: {
    marginTop: '20px',
  },
  timelineItem: {
    padding: '16px 0',
    borderBottom: '1px solid #f1f5f9',
    ':last-child': {
      borderBottom: 'none',
    },
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    margin: '0 0 4px 0',
    fontSize: '15px',
    color: '#0f172a',
    fontWeight: '500',
  },
  timelineDescription: {
    margin: '0 0 4px 0',
    fontSize: '14px',
    color: '#64748b',
  },
  timelineTime: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  viewAllButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#475569',
    cursor: 'pointer',
    marginTop: '20px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f1f5f9',
      borderColor: '#cbd5e1',
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
    backdropFilter: 'blur(4px)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '16px',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
    animation: 'slideUp 0.3s ease',
  },
  modalTitle: {
    margin: '0 0 12px 0',
    fontSize: '20px',
    color: '#0f172a',
    fontWeight: '600',
  },
  modalText: {
    margin: '0 0 20px 0',
    fontSize: '15px',
    color: '#475569',
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
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#475569',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f8fafc',
      borderColor: '#94a3b8',
    },
  },
  modalConfirmButton: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#1e293b',
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