import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';

const AdminNavigation = ({ onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on window resize (if screen becomes larger)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

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
    { path: '/dashboard', label: 'Dashboard', icon: '📊', shortLabel: 'Dash' },
    { path: '/offenders', label: 'Offenders (#2)', icon: '👥', shortLabel: 'Offenders' },
    { path: '/recommended', label: 'Recommended (#4)', icon: '✅', shortLabel: 'Rec.' },
    { path: '/interventions', label: 'Interventions (#5)', icon: '🫂', shortLabel: 'Inter.' },
    { path: '/reports', label: 'Reports (#7, #8)', icon: '📈', shortLabel: 'Reports' }
  ];

  return (
    <nav style={{
      ...styles.navbar,
      ...(scrolled ? styles.navbarScrolled : {}),
      boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.3)',
    }}>
      <div style={styles.navContainer}>
        {/* Logo Section */}
        <div style={styles.logoSection} onClick={() => navigate('/dashboard')}>
          <span style={styles.logoIcon}>⚖️</span>
          <span style={styles.logoText}>CSMS</span>
          <span style={styles.logoBadge}>Admin</span>
        </div>

        {/* Desktop Menu */}
        <div style={styles.desktopMenu}>
          {menuItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                ...styles.navLink,
                ...(isActive(item.path) ? styles.navLinkActive : {}),
              }}
              title={item.label}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              <span style={styles.navLabel}>{item.label}</span>
              <span style={styles.navShortLabel}>{item.shortLabel}</span>
            </button>
          ))}
        </div>

        {/* Desktop Right Section */}
        <div style={styles.rightSection}>
          <div style={styles.adminInfo}>
            <span style={styles.adminBadge}>Admin</span>
          </div>
          <button onClick={handleLogout} style={styles.logoutButton} title="Logout">
            <span style={styles.logoutIcon}>🚪</span>
            <span style={styles.logoutText}>Logout</span>
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          style={styles.mobileMenuButton}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <div style={{
            ...styles.hamburgerLine,
            transform: mobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none',
          }} />
          <div style={{
            ...styles.hamburgerLine,
            opacity: mobileMenuOpen ? 0 : 1,
          }} />
          <div style={{
            ...styles.hamburgerLine,
            transform: mobileMenuOpen ? 'rotate(-45deg) translate(7px, -7px)' : 'none',
          }} />
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={styles.mobileMenu}>
          <div style={styles.mobileMenuHeader}>
            <span style={styles.mobileMenuTitle}>Menu</span>
            <button 
              style={styles.mobileCloseButton}
              onClick={() => setMobileMenuOpen(false)}
            >
              ✕
            </button>
          </div>
          
          {menuItems.map(item => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setMobileMenuOpen(false);
              }}
              style={{
                ...styles.mobileNavLink,
                ...(isActive(item.path) ? styles.mobileNavLinkActive : {}),
              }}
            >
              <span style={styles.mobileNavIcon}>{item.icon}</span>
              <span style={styles.mobileNavLabel}>{item.label}</span>
              {isActive(item.path) && <span style={styles.mobileActiveIndicator}>✓</span>}
            </button>
          ))}
          
          <div style={styles.mobileDivider} />
          
          <div style={styles.mobileUserInfo}>
            <span style={styles.mobileAdminBadge}>Admin</span>
          </div>
          
          <button onClick={handleLogout} style={styles.mobileLogoutButton}>
            <span style={styles.logoutIcon}>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      )}
    </nav>
  );
};

const styles = {
  navbar: {
    backgroundColor: '#000000',
    padding: 'clamp(8px, 2vw, 12px) 0',
    color: '#ffffff',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    transition: 'all 0.3s ease',
    width: '100%',
  },
  navbarScrolled: {
    padding: 'clamp(4px, 1vw, 8px) 0',
    backdropFilter: 'blur(10px)',
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  navContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 clamp(16px, 4vw, 24px)',
    position: 'relative',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(4px, 1vw, 8px)',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
    ':hover': {
      opacity: 0.8,
    },
  },
  logoIcon: {
    fontSize: 'clamp(20px, 5vw, 28px)',
  },
  logoText: {
    fontSize: 'clamp(16px, 4vw, 20px)',
    fontWeight: '600',
    letterSpacing: '0.5px',
    color: '#ffffff',
    '@media (max-width: 480px)': {
      display: 'none',
    },
  },
  logoBadge: {
    backgroundColor: '#ffffff',
    color: '#000000',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: 'clamp(10px, 2.5vw, 12px)',
    fontWeight: '600',
    marginLeft: '4px',
    '@media (max-width: 380px)': {
      display: 'none',
    },
  },
  desktopMenu: {
    display: 'flex',
    gap: 'clamp(4px, 1vw, 8px)',
    flexWrap: 'wrap',
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  navLink: {
    padding: 'clamp(6px, 1.5vw, 10px) clamp(10px, 2vw, 16px)',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: 'clamp(13px, 2vw, 15px)',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(4px, 1vw, 8px)',
    background: 'transparent',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#333333',
      transform: 'translateY(-1px)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  navLinkActive: {
    backgroundColor: '#333333',
    borderBottom: '2px solid #ffffff',
  },
  navIcon: {
    fontSize: 'clamp(14px, 3vw, 18px)',
  },
  navLabel: {
    '@media (max-width: 1024px)': {
      display: 'none',
    },
  },
  navShortLabel: {
    display: 'none',
    '@media (min-width: 769px) and (max-width: 1024px)': {
      display: 'inline',
    },
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(8px, 2vw, 16px)',
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  adminInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  adminBadge: {
    backgroundColor: '#ffffff',
    color: '#000000',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: 'clamp(12px, 2.5vw, 14px)',
    fontWeight: '600',
    border: '1px solid #cccccc',
    whiteSpace: 'nowrap',
  },
  logoutButton: {
    padding: 'clamp(6px, 1.5vw, 8px) clamp(12px, 2.5vw, 16px)',
    backgroundColor: '#333333',
    border: '1px solid #666666',
    borderRadius: '8px',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: 'clamp(13px, 2.5vw, 14px)',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(4px, 1vw, 8px)',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    ':hover': {
      backgroundColor: '#444444',
      borderColor: '#888888',
      transform: 'translateY(-1px)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  logoutIcon: {
    fontSize: 'clamp(14px, 3vw, 16px)',
  },
  logoutText: {
    '@media (max-width: 480px)': {
      display: 'none',
    },
  },
  mobileMenuButton: {
    display: 'none',
    flexDirection: 'column',
    justifyContent: 'space-around',
    width: '30px',
    height: '30px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    zIndex: 1100,
    '@media (max-width: 768px)': {
      display: 'flex',
    },
  },
  hamburgerLine: {
    width: '30px',
    height: '3px',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    transition: 'all 0.3s ease',
  },
  mobileMenu: {
    display: 'none',
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: 'clamp(250px, 70vw, 300px)',
    backgroundColor: '#1a1a1a',
    padding: 'clamp(16px, 4vw, 20px)',
    boxShadow: '-4px 0 20px rgba(0,0,0,0.5)',
    animation: 'slideIn 0.3s ease',
    zIndex: 1050,
    overflowY: 'auto',
    '@media (max-width: 768px)': {
      display: 'block',
    },
  },
  mobileMenuHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '1px solid #333333',
  },
  mobileMenuTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#ffffff',
  },
  mobileCloseButton: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    ':hover': {
      backgroundColor: '#333333',
    },
  },
  mobileNavLink: {
    padding: 'clamp(12px, 3vw, 14px)',
    backgroundColor: '#333333',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    textAlign: 'left',
    marginBottom: '8px',
    transition: 'all 0.2s ease',
    position: 'relative',
    ':hover': {
      backgroundColor: '#444444',
      transform: 'translateX(5px)',
    },
    ':active': {
      transform: 'translateX(0)',
    },
  },
  mobileNavLinkActive: {
    backgroundColor: '#444444',
    borderLeft: '3px solid #ffffff',
  },
  mobileNavIcon: {
    fontSize: 'clamp(16px, 4vw, 18px)',
    minWidth: '24px',
  },
  mobileNavLabel: {
    flex: 1,
  },
  mobileActiveIndicator: {
    color: '#4CAF50',
    fontSize: '18px',
    marginRight: '8px',
  },
  mobileDivider: {
    height: '1px',
    backgroundColor: '#333333',
    margin: '16px 0',
  },
  mobileUserInfo: {
    padding: '12px',
    backgroundColor: '#222222',
    borderRadius: '8px',
    marginBottom: '12px',
  },
  mobileAdminBadge: {
    backgroundColor: '#ffffff',
    color: '#000000',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    display: 'inline-block',
  },
  mobileLogoutButton: {
    padding: 'clamp(12px, 3vw, 14px)',
    backgroundColor: '#666666',
    border: 'none',
    borderRadius: '8px',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#777777',
      transform: 'translateX(5px)',
    },
    ':active': {
      transform: 'translateX(0)',
    },
  },
};

// Add global styles for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @media (max-width: 768px) {
    body.menu-open {
      overflow: hidden;
    }
  }
`;
document.head.appendChild(style);

export default AdminNavigation;