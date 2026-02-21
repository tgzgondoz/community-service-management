import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { InlineSpinner } from './common/LoadingSpinner';

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
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  // Check for saved credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem('savedEmail', email);
      } else {
        localStorage.removeItem('savedEmail');
      }
      
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

  const handleForgotPassword = () => {
    alert('Please contact your administrator to reset your password.');
  };

  return (
    <div style={styles.container}>
      <div style={styles.background}>
        <div style={styles.overlay}></div>
      </div>
      
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoContainer}>
            <span style={styles.logo}>⚖️</span>
          </div>
          <h1 style={styles.title}>Community Service Management</h1>
          <p style={styles.subtitle}>Sign in to access your dashboard</p>
        </div>
        
        {error && (
          <div style={styles.error}>
            <span style={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <span style={styles.labelIcon}>📧</span>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <span style={styles.labelIcon}>🔒</span>
              Password
            </label>
            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.passwordInput}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
              <button
                type="button"
                style={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div style={styles.options}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={styles.checkbox}
              />
              <span style={styles.checkboxText}>Remember me</span>
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              style={styles.forgotPassword}
            >
              Forgot Password?
            </button>
          </div>
          
          <button 
            type="submit" 
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {})
            }} 
            disabled={loading}
          >
            {loading ? (
              <>
                <InlineSpinner size="small" color="#ffffff" />
                <span style={styles.buttonText}>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div style={styles.quickLogin}>
          <div style={styles.quickLoginHeader}>
            <span style={styles.quickLoginIcon}>⚡</span>
            <p style={styles.quickLoginText}>Quick Access</p>
          </div>
          <div style={styles.buttonGroup}>
            <button 
              onClick={loginAsAdmin} 
              style={styles.quickButton}
              type="button"
              disabled={loading}
            >
              <span style={styles.quickButtonIcon}>👑</span>
              Admin Demo
            </button>
            <button 
              onClick={loginAsUser} 
              style={styles.quickButton}
              type="button"
              disabled={loading}
            >
              <span style={styles.quickButtonIcon}>👤</span>
              User Demo
            </button>
          </div>
          <p style={styles.quickLoginNote}>
            Use demo credentials for testing
          </p>
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            © 2024 Community Service Management System
          </p>
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
    backgroundColor: '#f5f5f5',
    position: 'relative',
    padding: 'clamp(16px, 4vw, 24px)',
    boxSizing: 'border-box',
  },
  background: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    zIndex: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 'clamp(24px, 6vw, 40px)',
    borderRadius: '20px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    width: '100%',
    maxWidth: '450px',
    border: '1px solid rgba(255,255,255,0.1)',
    position: 'relative',
    zIndex: 1,
    animation: 'slideUp 0.5s ease',
    backdropFilter: 'blur(10px)',
    '@media (max-width: 480px)': {
      padding: '24px',
    },
  },
  header: {
    textAlign: 'center',
    marginBottom: 'clamp(24px, 5vw, 32px)',
  },
  logoContainer: {
    width: 'clamp(70px, 15vw, 90px)',
    height: 'clamp(70px, 15vw, 90px)',
    backgroundColor: '#f8f8f8',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px auto',
    border: '3px solid #000000',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
  },
  logo: {
    fontSize: 'clamp(36px, 8vw, 48px)',
    lineHeight: 1,
  },
  title: {
    fontSize: 'clamp(20px, 5vw, 24px)',
    color: '#000000',
    margin: '0 0 8px 0',
    fontWeight: '600',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: 'clamp(13px, 3vw, 14px)',
    color: '#666666',
    margin: 0,
  },
  error: {
    backgroundColor: '#fff2f0',
    color: '#ff4d4f',
    padding: 'clamp(10px, 2.5vw, 12px)',
    borderRadius: '10px',
    marginBottom: '20px',
    fontSize: 'clamp(13px, 3vw, 14px)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid #ffccc7',
  },
  errorIcon: {
    fontSize: '16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    color: '#333333',
    fontSize: 'clamp(13px, 3vw, 14px)',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  labelIcon: {
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: 'clamp(12px, 3vw, 14px)',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    boxSizing: 'border-box',
    backgroundColor: '#fafafa',
    color: '#000000',
    transition: 'all 0.3s ease',
    ':focus': {
      outline: 'none',
      borderColor: '#000000',
      backgroundColor: '#ffffff',
      boxShadow: '0 0 0 3px rgba(0,0,0,0.1)',
    },
    ':disabled': {
      backgroundColor: '#f5f5f5',
      cursor: 'not-allowed',
    },
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    width: '100%',
    padding: 'clamp(12px, 3vw, 14px)',
    paddingRight: '50px',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    boxSizing: 'border-box',
    backgroundColor: '#fafafa',
    color: '#000000',
    transition: 'all 0.3s ease',
    ':focus': {
      outline: 'none',
      borderColor: '#000000',
      backgroundColor: '#ffffff',
      boxShadow: '0 0 0 3px rgba(0,0,0,0.1)',
    },
    ':disabled': {
      backgroundColor: '#f5f5f5',
      cursor: 'not-allowed',
    },
  },
  passwordToggle: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '20px',
    padding: '4px',
    color: '#666666',
    transition: 'color 0.2s ease',
    ':hover': {
      color: '#000000',
    },
    ':disabled': {
      cursor: 'not-allowed',
      opacity: 0.5,
    },
  },
  options: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    color: '#666666',
    fontSize: 'clamp(13px, 3vw, 14px)',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: '#000000',
  },
  checkboxText: {
    userSelect: 'none',
  },
  forgotPassword: {
    background: 'none',
    border: 'none',
    color: '#000000',
    fontSize: 'clamp(13px, 3vw, 14px)',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: '4px',
    transition: 'opacity 0.2s ease',
    ':hover': {
      opacity: 0.7,
    },
  },
  button: {
    backgroundColor: '#000000',
    color: '#ffffff',
    padding: 'clamp(14px, 3.5vw, 16px)',
    border: 'none',
    borderRadius: '12px',
    fontSize: 'clamp(16px, 4vw, 18px)',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '10px',
    ':hover': {
      backgroundColor: '#333333',
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 20px rgba(0,0,0,0.2)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
    ':disabled': {
      opacity: 0.7,
      cursor: 'not-allowed',
      transform: 'none',
    },
  },
  buttonDisabled: {
    backgroundColor: '#666666',
    ':hover': {
      backgroundColor: '#666666',
      transform: 'none',
      boxShadow: 'none',
    },
  },
  buttonText: {
    marginLeft: '8px',
  },
  quickLogin: {
    marginTop: 'clamp(24px, 5vw, 30px)',
    padding: 'clamp(16px, 4vw, 20px)',
    backgroundColor: '#f8f8f8',
    borderRadius: '16px',
    border: '1px solid #e0e0e0',
  },
  quickLoginHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  quickLoginIcon: {
    fontSize: '20px',
  },
  quickLoginText: {
    margin: 0,
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    color: '#000000',
    fontWeight: '500',
  },
  buttonGroup: {
    display: 'flex',
    gap: 'clamp(8px, 2vw, 12px)',
    '@media (max-width: 480px)': {
      flexDirection: 'column',
    },
  },
  quickButton: {
    flex: 1,
    padding: 'clamp(12px, 3vw, 14px)',
    backgroundColor: '#666666',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    ':hover': {
      backgroundColor: '#555555',
      transform: 'translateY(-2px)',
      boxShadow: '0 5px 10px rgba(0,0,0,0.1)',
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
  quickButtonIcon: {
    fontSize: '18px',
  },
  quickLoginNote: {
    margin: '12px 0 0 0',
    fontSize: 'clamp(12px, 2.5vw, 13px)',
    color: '#999999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    marginTop: 'clamp(20px, 4vw, 24px)',
    textAlign: 'center',
  },
  footerText: {
    margin: 0,
    fontSize: 'clamp(11px, 2.5vw, 12px)',
    color: '#999999',
  },
};

// Add global animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @media (max-width: 768px) {
    body {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
  }
`;
document.head.appendChild(style);

export default Login;