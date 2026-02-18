import React, { useState, useEffect } from 'react';
import { auth } from '../../config/firebase';
import { getUserProfile, updateUserProfile } from '../../utils/database';
import LoadingSpinner from '../common/LoadingSpinner';

const UserProfile = () => {
  const [profile, setProfile] = useState({
    displayName: '',
    phone: '',
    department: '',
    bio: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [userEmail, setUserEmail] = useState('');

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
          setProfile({
            displayName: userData.displayName || userData.email.split('@')[0],
            phone: '',
            department: '',
            bio: ''
          });
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
      if (userProfile) {
        setProfile({
          displayName: userProfile.displayName || '',
          phone: userProfile.phone || '',
          department: userProfile.department || '',
          bio: userProfile.bio || ''
        });
      }
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
        setSaving(false);
        return;
      }

      await updateUserProfile(auth.currentUser.uid, profile);
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (error) {
      setMessage({ text: 'Error updating profile: ' + error.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>My Profile</h2>
      
      {message.text && (
        <div style={{
          ...styles.message,
          backgroundColor: message.type === 'error' ? '#f0f0f0' : '#f0f0f0',
          color: message.type === 'error' ? '#ff0000' : '#000000',
          border: message.type === 'error' ? '1px solid #ff0000' : '1px solid #00ff00'
        }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={userEmail || ''}
            style={{...styles.input, backgroundColor: '#f0f0f0'}}
            disabled
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

        <div style={styles.formGroup}>
          <label style={styles.label}>Bio</label>
          <textarea
            name="bio"
            value={profile.bio}
            onChange={handleChange}
            style={{...styles.input, minHeight: '100px'}}
            placeholder="Tell us about yourself..."
          />
        </div>

        <button 
          type="submit" 
          style={{
            ...styles.button,
            opacity: saving ? 0.7 : 1,
            cursor: saving ? 'not-allowed' : 'pointer'
          }} 
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#ffffff'
  },
  title: {
    fontSize: '28px',
    marginBottom: '20px',
    color: '#000000'
  },
  form: {
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0'
  },
  formGroup: {
    marginBottom: '20px'
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
  button: {
    backgroundColor: '#000000',
    color: '#ffffff',
    padding: '12px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: '600',
    width: '100%',
    transition: 'background-color 0.3s'
  },
  message: {
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '20px',
    textAlign: 'center',
    backgroundColor: '#f0f0f0'
  }
};

export default UserProfile;