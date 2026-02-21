import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';

const AdminNavigation = ({ onLogout }) => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle scroll effect for header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close nav on route change
  useEffect(() => {
    setIsNavOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when nav is open
  useEffect(() => {
    if (isNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isNavOpen]);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      
      try {
        await signOut(auth);
      } catch (firebaseError) {
        console.log('Firebase signOut not needed for hardcoded user');
      }
      
      if (onLogout) {
        onLogout();
      }
      
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/offenders', label: 'Offenders' },
    { path: '/recommended', label: 'Recommended' },
    { path: '/interventions', label: 'Interventions' },
    { path: '/reports', label: 'Reports' }
  ];

  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  return (
    <>
      {/* Top Header Bar */}
      <header style={{
        ...styles.header,
        ...(scrolled ? styles.headerScrolled : {}),
        boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.1)' : 'none',
      }}>
        <div style={styles.headerLeft}>
          <button 
            style={styles.menuButton}
            onClick={toggleNav}
            aria-label="Toggle navigation menu"
          >
            <div style={{
              ...styles.menuBar,
              transform: isNavOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none',
            }} />
            <div style={{
              ...styles.menuBar,
              opacity: isNavOpen ? 0 : 1,
            }} />
            <div style={{
              ...styles.menuBar,
              transform: isNavOpen ? 'rotate(-45deg) translate(7px, -7px)' : 'none',
            }} />
          </button>
          <span style={styles.logo}>CSMS</span>
          <span style={styles.logoBadge}>Admin</span>
        </div>
        
        <div style={styles.headerRight}>
          <button onClick={handleLogout} style={styles.logoutButton}>
            <span style={styles.logoutIcon}>→</span>
            <span style={styles.logoutText}>Sign out</span>
          </button>
        </div>
      </header>

      {/* Navigation Overlay */}
      {isNavOpen && (
        <div 
          style={styles.overlay}
          onClick={() => setIsNavOpen(false)}
        />
      )}

      {/* Side Navigation */}
      <nav style={{
        ...styles.nav,
        transform: isNavOpen ? 'translateX(0)' : 'translateX(-100%)',
      }}>
        <div style={styles.navHeader}>
          <span style={styles.navLogo}>CSMS</span>
          <span style={styles.navLogoBadge}>Admin</span>
        </div>

        <div style={styles.navContent}>
          {menuItems.map(item => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setIsNavOpen(false);
              }}
              style={{
                ...styles.navItem,
                ...(isActive(item.path) ? styles.navItemActive : {}),
              }}
            >
              <span style={styles.navItemLabel}>{item.label}</span>
              {isActive(item.path) && <span style={styles.navItemIndicator} />}
            </button>
          ))}
        </div>

        <div style={styles.navFooter}>
          <div style={styles.userInfo}>
            <div style={styles.userAvatar}>
              A
            </div>
            <div style={styles.userDetails}>
              <span style={styles.userName}>Admin User</span>
              <span style={styles.userEmail}>admin@csms.com</span>
            </div>
          </div>
          <button onClick={handleLogout} style={styles.navLogoutButton}>
            <span style={styles.navLogoutIcon}>→</span>
            <span>Sign out</span>
          </button>
        </div>
      </nav>

      {/* Main Content Spacer */}
      <div style={styles.spacer} />
    </>
  );
};

const styles = {
  // Header Styles
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '64px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    zIndex: 900,
    transition: 'all 0.2s ease',
  },
  headerScrolled: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottomColor: 'transparent',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  menuButton: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    width: '24px',
    height: '24px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    marginRight: '8px',
  },
  menuBar: {
    width: '24px',
    height: '2px',
    backgroundColor: '#1e293b',
    borderRadius: '2px',
    transition: 'all 0.3s ease',
    margin: '2px 0',
  },
  logo: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  logoBadge: {
    padding: '2px 8px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    color: '#475569',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f1f5f9',
      borderColor: '#cbd5e1',
      transform: 'translateY(-1px)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  logoutIcon: {
    fontSize: '14px',
    transform: 'rotate(180deg)',
  },
  logoutText: {
    '@media (max-width: 480px)': {
      display: 'none',
    },
  },

  // Overlay
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 950,
    animation: 'fadeIn 0.2s ease',
    backdropFilter: 'blur(4px)',
  },

  // Navigation Styles
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: '300px',
    backgroundColor: '#ffffff',
    boxShadow: '4px 0 20px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #e2e8f0',
  },
  navHeader: {
    padding: '28px 24px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  navLogo: {
    fontSize: '22px',
    fontWeight: '600',
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  navLogoBadge: {
    padding: '2px 8px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  navContent: {
    flex: 1,
    padding: '24px 16px',
    overflowY: 'auto',
  },
  navItem: {
    width: '100%',
    padding: '14px 20px',
    marginBottom: '4px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '10px',
    color: '#475569',
    fontSize: '15px',
    fontWeight: '500',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
    ':hover': {
      backgroundColor: '#f8fafc',
      color: '#0f172a',
    },
  },
  navItemActive: {
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
    fontWeight: '600',
  },
  navItemLabel: {
    display: 'block',
  },
  navItemIndicator: {
    position: 'absolute',
    left: '0',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '3px',
    height: '20px',
    backgroundColor: '#0f172a',
    borderRadius: '0 3px 3px 0',
    animation: 'slideIn 0.2s ease',
  },
  navFooter: {
    padding: '20px 16px',
    borderTop: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    padding: '8px 12px',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    backgroundColor: '#0f172a',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: '2px',
  },
  userEmail: {
    display: 'block',
    fontSize: '12px',
    color: '#64748b',
  },
  navLogoutButton: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    color: '#475569',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f1f5f9',
      borderColor: '#cbd5e1',
      transform: 'translateY(-1px)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  navLogoutIcon: {
    fontSize: '14px',
    transform: 'rotate(180deg)',
  },
  spacer: {
    height: '64px', // Height of the header
  },
};

// Add global animations and styles
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-50%) translateX(-5px);
    }
    to {
      opacity: 1;
      transform: translateY(-50%) translateX(0);
    }
  }

  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  button {
    cursor: pointer;
  }
`;
document.head.appendChild(style);

export default AdminNavigation;