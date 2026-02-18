import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { setUserRole } from '../utils/database';

// Hardcoded admin credentials
const HARDCODED_ADMIN = {
  email: 'admin@csms.com',
  password: 'admin123',
  role: 'admin'
};

// Hardcoded user credentials (for demo)
const HARDCODED_USER = {
  email: 'user@csms.com',
  password: 'user123',
  role: 'user'
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Check for hardcoded admin first
      if (email === HARDCODED_ADMIN.email && password === HARDCODED_ADMIN.password) {
        console.log('✅ Hardcoded admin login successful');
        
        // Store user info in localStorage or session storage
        localStorage.setItem('user', JSON.stringify({
          email: email,
          role: 'admin',
          isHardcoded: true
        }));
        
        // Navigate to admin dashboard
        navigate('/dashboard');
        window.location.reload(); // Force reload to update app state
        return;
      }
      
      // Check for hardcoded user
      if (email === HARDCODED_USER.email && password === HARDCODED_USER.password) {
        console.log('✅ Hardcoded user login successful');
        
        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify({
          email: email,
          role: 'user',
          isHardcoded: true
        }));
        
        // Navigate to user dashboard
        navigate('/dashboard');
        window.location.reload(); // Force reload to update app state
        return;
      }
      
      // Regular Firebase authentication for other users
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Store Firebase user info
      localStorage.setItem('user', JSON.stringify({
        uid: userCredential.user.uid,
        email: email,
        role: 'user', // Default role, you might want to fetch from DB
        isHardcoded: false
      }));
      
      navigate('/dashboard');
      window.location.reload();
      
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  // Quick login functions for demo
  const loginAsAdmin = () => {
    setEmail(HARDCODED_ADMIN.email);
    setPassword(HARDCODED_ADMIN.password);
  };

  const loginAsUser = () => {
    setEmail(HARDCODED_USER.email);
    setPassword(HARDCODED_USER.password);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span style={styles.logo}>⚖️</span>
          <h1 style={styles.title}>Community Service Management</h1>
          <p style={styles.subtitle}>Sign in to your account</p>
        </div>
        
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.quickLogin}>
          <p style={styles.quickLoginText}>Quick Login:</p>
          <div style={styles.buttonGroup}>
            <button 
              onClick={loginAsAdmin} 
              style={styles.quickButton}
              type="button"
            >
              Admin Login
            </button>
            <button 
              onClick={loginAsUser} 
              style={styles.quickButton}
              type="button"
            >
              User Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    backgroundImage: 'none'
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
    border: '1px solid #e0e0e0'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  logo: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '16px'
  },
  title: {
    fontSize: '24px',
    color: '#000000',
    margin: '0 0 8px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: '#666666',
    margin: 0
  },
  form: {
    display: 'flex',
    flexDirection: 'column'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: '#333333',
    fontSize: '14px',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #cccccc',
    borderRadius: '8px',
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
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  },
  error: {
    backgroundColor: '#f5f5f5',
    color: '#ff0000',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    textAlign: 'center',
    border: '1px solid #ff0000'
  },
  quickLogin: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    border: '1px solid #cccccc'
  },
  quickLoginText: {
    margin: '0 0 10px 0',
    fontSize: '14px',
    color: '#000000',
    fontWeight: '500',
    textAlign: 'center'
  },
  buttonGroup: {
    display: 'flex',
    gap: '10px'
  },
  quickButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#666666',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  }
};

export default Login;