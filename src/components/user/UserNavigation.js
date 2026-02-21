import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';

const UserNavigation = ({ onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userName, setUserName] = useState('');
  const [userInitials, setUserInitials] = useState('');
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

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    // Get user name from localStorage if available
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.displayName) {
          setUserName(userData.displayName);
          // Get initials for avatar
          const nameParts = userData.displayName.split(' ');
          if (nameParts.length >= 2) {
            setUserInitials(nameParts[0][0] + nameParts[1][0]);
          } else {
            setUserInitials(userData.displayName.substring(0, 2).toUpperCase());
          }
        } else if (userData.email) {
          const name = userData.email.split('@')[0];
          setUserName(name);
          setUserInitials(name.substring(0, 2).toUpperCase());
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    } else if (auth.currentUser) {
      // Get from Firebase auth
      const email = auth.currentUser.email;
      if (email) {
        const name = email.split('@')[0];
        setUserName(name);
        setUserInitials(name.substring(0, 2).toUpperCase());
      }
    }
  }, []);

  const handleLogout = async () => {
    try {
      // Clear localStorage first (for hardcoded users)
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      
      // Then try to sign out from Firebase (if it was a Firebase user)
      try {
        await signOut(auth);
      } catch (firebaseError) {
        // Ignore Firebase errors if user was hardcoded
        console.log('Firebase signOut not needed for hardcoded user');
      }
      
      // Call the parent onLogout if provided
      if (onLogout) {
        onLogout();
      }
      
      // Navigate to login page
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { path: '/user-dashboard', label: 'Dashboard', icon: '📊', shortLabel: 'Dash' },
    { path: '/profiling', label: 'Profiling (#9)', icon: '👤', shortLabel: 'Profile' },
    { path: '/profile', label: 'My Profile', icon: '⚙️', shortLabel: 'Settings' }
  ];

  return (
    <nav style={{
      ...styles.navbar,
      ...(scrolled ? styles.navbarScrolled : {}),
      boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.3)',
    }}>
      <div style={styles.navContainer}>
        {/* Logo Section */}
        <div 
          style={styles.logoSection}
          onClick={() => navigate('/user-dashboard')}
        >
          <span style={styles.logoIcon}>⚖️</span>
          <span style={styles.logoText}>CSMS</span>
          <span style={styles.logoBadge}>User</span>
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
          {userName && (
            <div style={styles.userInfo} title={userName}>
              <div style={styles.userAvatar}>
                {userInitials || 'U'}
              </div>
              <span style={styles.userName}>{userName}</span>
            </div>
          )}
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
          
          {userName && (
            <div style={styles.mobileUserInfo}>
              <div style={styles.mobileUserAvatar}>
                {userInitials || 'U'}
              </div>
              <div style={styles.mobileUserDetails}>
                <span style={styles.mobileUserName}>{userName}</span>
                <span style={styles.mobileUserRole}>Probation Officer</span>
              </div>
            </div>
          )}
          
          <div style={styles.mobileMenuDivider} />
          
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
          
          <div style={styles.mobileMenuDivider} />
          
          <button onClick={handleLogout} style={styles.mobileLogoutButton}>
            <span style={styles.logoutIcon}>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      )}

      {/* Add CSS in a style tag */}
      <style>{`
        @media (max-width: 1024px) {
          .nav-label {
            display: none;
          }
          .nav-short-label {
            display: inline;
          }
        }
        
        @media (max-width: 768px) {
          .desktop-menu {
            display: none !important;
          }
          .right-section {
            display: none !important;
          }
          .mobile-menu-button {
            display: flex !important;
          }
          .mobile-menu {
            display: block !important;
            animation: slideIn 0.3s ease;
          }
        }

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

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .mobile-menu {
            animation: none;
          }
        }
      `}</style>
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
    backgroundColor: '#4CAF50',
    color: '#ffffff',
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
    borderBottom: '2px solid #4CAF50',
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
    gap: 'clamp(12px, 2vw, 16px)',
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#333333',
    padding: '4px 12px 4px 4px',
    borderRadius: '30px',
    border: '1px solid #666666',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#444444',
    },
  },
  userAvatar: {
    width: 'clamp(30px, 5vw, 32px)',
    height: 'clamp(30px, 5vw, 32px)',
    backgroundColor: '#4CAF50',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'clamp(12px, 2.5vw, 14px)',
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  userName: {
    fontSize: 'clamp(13px, 2.5vw, 14px)',
    fontWeight: '500',
    color: '#ffffff',
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
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
    width: 'clamp(280px, 80vw, 320px)',
    backgroundColor: '#1a1a1a',
    padding: 'clamp(20px, 5vw, 24px)',
    boxShadow: '-4px 0 20px rgba(0,0,0,0.5)',
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
    marginBottom: '24px',
    paddingBottom: '12px',
    borderBottom: '1px solid #333333',
  },
  mobileMenuTitle: {
    fontSize: 'clamp(16px, 4vw, 18px)',
    fontWeight: '600',
    color: '#ffffff',
  },
  mobileCloseButton: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    fontSize: 'clamp(20px, 5vw, 24px)',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    ':hover': {
      backgroundColor: '#333333',
    },
  },
  mobileUserInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#222222',
    padding: 'clamp(12px, 3vw, 16px)',
    borderRadius: '12px',
    marginBottom: '16px',
  },
  mobileUserAvatar: {
    width: 'clamp(40px, 10vw, 48px)',
    height: 'clamp(40px, 10vw, 48px)',
    backgroundColor: '#4CAF50',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'clamp(16px, 4vw, 18px)',
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  mobileUserDetails: {
    flex: 1,
  },
  mobileUserName: {
    display: 'block',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '4px',
  },
  mobileUserRole: {
    fontSize: 'clamp(11px, 2.5vw, 12px)',
    color: '#4CAF50',
  },
  mobileMenuDivider: {
    height: '1px',
    backgroundColor: '#333333',
    margin: 'clamp(16px, 4vw, 20px) 0',
  },
  mobileNavLink: {
    padding: 'clamp(12px, 3vw, 14px)',
    backgroundColor: '#222222',
    border: 'none',
    borderRadius: '10px',
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
      backgroundColor: '#333333',
      transform: 'translateX(5px)',
    },
    ':active': {
      transform: 'translateX(0)',
    },
  },
  mobileNavLinkActive: {
    backgroundColor: '#333333',
    borderLeft: '3px solid #4CAF50',
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
    fontSize: '16px',
    marginRight: '8px',
  },
  mobileLogoutButton: {
    padding: 'clamp(12px, 3vw, 14px)',
    backgroundColor: '#f44336',
    border: 'none',
    borderRadius: '10px',
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
      backgroundColor: '#d32f2f',
      transform: 'translateX(5px)',
    },
    ':active': {
      transform: 'translateX(0)',
    },
  },
};

export default UserNavigation;