import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { InlineSpinner } from '../components/common/LoadingSpinner';

const HARDCODED_ADMIN = {
  email: 'admin@csms.com',
  password: 'admin123',
  role: 'admin'
};

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
      if (rememberMe) {
        localStorage.setItem('savedEmail', email);
      } else {
        localStorage.removeItem('savedEmail');
      }
      
      // Check for hardcoded admin
      if (email === HARDCODED_ADMIN.email && password === HARDCODED_ADMIN.password) {
        localStorage.setItem('user', JSON.stringify({
          email: email,
          role: 'admin',
          isHardcoded: true
        }));
        navigate('/dashboard');
        window.location.reload();
        return;
      }
      
      // Check for hardcoded user
      if (email === HARDCODED_USER.email && password === HARDCODED_USER.password) {
        localStorage.setItem('user', JSON.stringify({
          email: email,
          role: 'user',
          isHardcoded: true
        }));
        navigate('/user-dashboard');
        window.location.reload();
        return;
      }
      
      // Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      localStorage.setItem('user', JSON.stringify({
        uid: userCredential.user.uid,
        email: email,
        role: 'user',
        isHardcoded: false
      }));
      
      navigate('/user-dashboard');
      window.location.reload();
      
    } catch (error) {
      console.error('Login error:', error);
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

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
          <div style={styles.logoContainer}>
            <span style={styles.logo}>CSMS</span>
          </div>
          <h1 style={styles.title}>Welcome back</h1>
          <p style={styles.subtitle}>Sign in to your account to continue</p>
        </div>
        
        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email address</label>
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
            <label style={styles.label}>Password</label>
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
                {showPassword ? 'Hide' : 'Show'}
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
                <InlineSpinner size="small" />
                <span style={styles.buttonText}>Signing in...</span>
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div style={styles.quickLogin}>
          <p style={styles.quickLoginLabel}>Demo access</p>
          <div style={styles.buttonGroup}>
            <button 
              onClick={loginAsAdmin} 
              style={styles.quickButton}
              type="button"
              disabled={loading}
            >
              Admin Login
            </button>
            <button 
              onClick={loginAsUser} 
              style={styles.quickButton}
              type="button"
              disabled={loading}
            >
              User Login
            </button>
          </div>
          <p style={styles.quickLoginNote}>
            Use demo credentials for testing
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
    backgroundColor: '#f8fafc',
    padding: 'clamp(16px, 4vw, 24px)',
    boxSizing: 'border-box',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '40px',
    borderRadius: '16px',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.02)',
    width: '100%',
    maxWidth: '440px',
    border: '1px solid #e2e8f0',
    animation: 'slideUp 0.3s ease',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoContainer: {
    width: '64px',
    height: '64px',
    backgroundColor: '#0f172a',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px auto',
  },
  logo: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: '-0.02em',
  },
  title: {
    fontSize: '24px',
    color: '#0f172a',
    margin: '0 0 8px 0',
    fontWeight: '600',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0,
  },
  error: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '24px',
    fontSize: '14px',
    border: '1px solid #fee2e2',
    textAlign: 'center',
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
    color: '#334155',
    fontSize: '14px',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '15px',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    transition: 'all 0.2s ease',
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
  },
  passwordInput: {
    width: '100%',
    padding: '12px 14px',
    paddingRight: '70px',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '15px',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    color: '#0f172a',
  },
  passwordToggle: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px 8px',
    color: '#64748b',
    fontWeight: '500',
  },
  options: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '10px',
    marginTop: '4px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    color: '#475569',
    fontSize: '14px',
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
  button: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    padding: '14px 20px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '8px',
  },
  buttonDisabled: {
    backgroundColor: '#94a3b8',
    cursor: 'not-allowed',
  },
  buttonText: {
    marginLeft: '4px',
  },
  quickLogin: {
    marginTop: '32px',
    padding: '20px',
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  quickLoginLabel: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
  },
  quickButton: {
    flex: 1,
    padding: '10px 16px',
    backgroundColor: '#ffffff',
    color: '#334155',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  quickLoginNote: {
    margin: '12px 0 0 0',
    fontSize: '12px',
    color: '#94a3b8',
    textAlign: 'center',
  },
};

// Add global animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
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
}

export default Login;