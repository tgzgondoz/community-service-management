import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { setUserRole, getAllUsers } from '../utils/database';

const SetupUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'user'
  });

  // Hardcoded default users
  const defaultUsers = [
    { email: 'admin@csms.com', password: 'admin123', role: 'admin' },
    { email: 'user@csms.com', password: 'user123', role: 'user' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const usersList = await getAllUsers();
      setUsers(usersList || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({ 
        type: 'error', 
        text: 'Error fetching users: ' + error.message 
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const createUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        newUser.email, 
        newUser.password
      );

      // Set user role in database
      await setUserRole(
        userCredential.user.uid, 
        newUser.email, 
        newUser.role
      );

      setMessage({ 
        type: 'success', 
        text: `User ${newUser.email} created successfully!` 
      });

      // Reset form
      setNewUser({
        email: '',
        password: '',
        role: 'user'
      });

      // Refresh users list
      fetchUsers();

    } catch (error) {
      console.error('Error creating user:', error);
      let errorMessage = 'Failed to create user. ';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage += 'Email already in use.';
          break;
        case 'auth/invalid-email':
          errorMessage += 'Invalid email address.';
          break;
        case 'auth/weak-password':
          errorMessage += 'Password should be at least 6 characters.';
          break;
        default:
          errorMessage += error.message;
      }

      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultUsers = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    let successCount = 0;
    let errorCount = 0;

    for (const user of defaultUsers) {
      try {
        // Try to create the user
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          user.email, 
          user.password
        );

        await setUserRole(
          userCredential.user.uid, 
          user.email, 
          user.role
        );

        successCount++;
      } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
          // User already exists, we'll consider it a success
          successCount++;
        } else {
          console.error('Error creating default user:', error);
          errorCount++;
        }
      }
    }

    setMessage({ 
      type: successCount > 0 ? 'success' : 'error', 
      text: `Created/Verified ${successCount} users. ${errorCount} failed.` 
    });

    fetchUsers();
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>User Setup</h2>

      {message.text && (
        <div style={message.type === 'success' ? styles.successMessage : styles.errorMessage}>
          {message.text}
        </div>
      )}

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Create New User</h3>
        <form onSubmit={createUser} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={newUser.email}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Enter email"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={newUser.password}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Enter password (min. 6 characters)"
              required
              minLength={6}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Role</label>
            <select
              name="role"
              value={newUser.role}
              onChange={handleInputChange}
              style={styles.select}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button 
            type="submit" 
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </form>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Quick Setup</h3>
        <p style={styles.description}>
          Create default users for testing:
        </p>
        <ul style={styles.userList}>
          <li style={styles.userItem}>
            <strong>Admin:</strong> admin@csms.com / admin123
          </li>
          <li style={styles.userItem}>
            <strong>User:</strong> user@csms.com / user123
          </li>
        </ul>
        <button 
          onClick={createDefaultUsers} 
          style={styles.secondaryButton}
          disabled={loading}
        >
          Create Default Users
        </button>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Existing Users</h3>
        {users.length === 0 ? (
          <p style={styles.noUsers}>No users found in database.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>UID</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id || user.uid || Math.random().toString()} style={styles.tr}>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.roleBadge,
                      backgroundColor: user.role === 'admin' ? '#333333' : '#666666'
                    }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.uid}>{user.uid}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={styles.note}>
        <p style={styles.noteText}>
          <strong>Note:</strong> After creating users, they can log in at the login page.
          Admin users will have access to all admin features, while regular users have limited access.
        </p>
      </div>
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
    color: '#000000',
    borderBottom: '2px solid #000000',
    paddingBottom: '10px'
  },
  section: {
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    border: '1px solid #e0e0e0'
  },
  sectionTitle: {
    fontSize: '20px',
    marginBottom: '15px',
    color: '#000000'
  },
  description: {
    marginBottom: '10px',
    color: '#666666'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    marginBottom: '5px',
    color: '#000000',
    fontWeight: '500'
  },
  input: {
    padding: '10px',
    border: '1px solid #cccccc',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    color: '#000000'
  },
  select: {
    padding: '10px',
    border: '1px solid #cccccc',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    color: '#000000'
  },
  button: {
    padding: '12px',
    backgroundColor: '#000000',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  secondaryButton: {
    padding: '10px',
    backgroundColor: '#666666',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  successMessage: {
    padding: '12px',
    backgroundColor: '#d4edda',
    color: '#155724',
    borderRadius: '4px',
    marginBottom: '20px',
    border: '1px solid #c3e6cb'
  },
  errorMessage: {
    padding: '12px',
    backgroundColor: '#f8d7da',
    color: '#721c24',
    borderRadius: '4px',
    marginBottom: '20px',
    border: '1px solid #f5c6cb'
  },
  userList: {
    marginBottom: '15px',
    paddingLeft: '20px',
    color: '#333333'
  },
  userItem: {
    marginBottom: '5px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px'
  },
  th: {
    textAlign: 'left',
    padding: '10px',
    backgroundColor: '#e0e0e0',
    color: '#000000',
    fontWeight: '600',
    borderBottom: '2px solid #cccccc'
  },
  td: {
    padding: '10px',
    borderBottom: '1px solid #cccccc',
    color: '#333333'
  },
  tr: {
    ':hover': {
      backgroundColor: '#e0e0e0'
    }
  },
  roleBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '12px',
    textTransform: 'capitalize'
  },
  uid: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#666666'
  },
  noUsers: {
    color: '#999999',
    fontStyle: 'italic',
    padding: '20px',
    textAlign: 'center'
  },
  note: {
    padding: '15px',
    backgroundColor: '#e8f4fd',
    borderRadius: '4px',
    border: '1px solid #b8e1fc'
  },
  noteText: {
    margin: 0,
    color: '#0369a1',
    fontSize: '14px'
  }
};

export default SetupUsers;