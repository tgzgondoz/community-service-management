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
    backgroundColor: '#f3f4f6',
    backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    width: '100%',
    maxWidth: '400px'
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
    color: '#1f2937',
    margin: '0 0 8px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
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
    color: '#4b5563',
    fontSize: '14px',
    fontWeight: '500'
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  button: {
    backgroundColor: '#667eea',
    color: 'white',
    padding: '12px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    textAlign: 'center'
  },
  quickLogin: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: '#e8f4fd',
    borderRadius: '8px'
  },
  quickLoginText: {
    margin: '0 0 10px 0',
    fontSize: '14px',
    color: '#0369a1',
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
    backgroundColor: '#0ea5e9',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  footer: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    textAlign: 'center'
  },
  footerText: {
    margin: '4px 0',
    fontSize: '12px',
    color: '#6b7280'
  },
  footerNote: {
    margin: '8px 0 0 0',
    fontSize: '11px',
    color: '#9ca3af',
    fontStyle: 'italic'
  }
};

export default Login;