import React, { useState, useEffect } from 'react';
import { auth } from '../../config/firebase';
import { getUserProfile, updateUserProfile } from '../../utils/database';

const UserProfile = () => {
  const [profile, setProfile] = useState({
    displayName: '',
    phone: '',
    department: '',
    bio: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
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
    setMessage('');

    try {
      await updateUserProfile(auth.currentUser.uid, profile);
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Error updating profile: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading profile...</div>;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>My Profile</h2>
      
      {message && (
        <div style={{
          ...styles.message,
          backgroundColor: message.includes('Error') ? '#f8d7da' : '#d4edda',
          color: message.includes('Error') ? '#721c24' : '#155724'
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={auth.currentUser?.email || ''}
            style={{...styles.input, backgroundColor: '#f5f5f5'}}
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

        <button type="submit" style={styles.button} disabled={saving}>
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
    margin: '0 auto'
  },
  title: {
    fontSize: '28px',
    marginBottom: '20px',
    color: '#333'
  },
  form: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    color: '#555',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  button: {
    backgroundColor: '#1976d2',
    color: 'white',
    padding: '12px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    width: '100%',
    fontWeight: '600'
  },
  message: {
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#666'
  }
};

export default UserProfile;