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
    { path: '/user-dashboard', label: 'Dashboard' },
    { path: '/profiling', label: 'Profiling' },
    { path: '/profile', label: 'My Profile' }
  ];

  return (
    <nav style={{
      ...styles.navbar,
      ...(scrolled ? styles.navbarScrolled : {}),
      boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <div style={styles.navContainer}>
        {/* Logo Section */}
        <div 
          style={styles.logoSection}
          onClick={() => navigate('/user-dashboard')}
        >
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
            >
              <span style={styles.navLabel}>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Desktop Right Section */}
        <div style={styles.rightSection}>
          {userName && (
            <div style={styles.userInfo}>
              <div style={styles.userAvatar}>
                {userInitials || 'U'}
              </div>
              <span style={styles.userName}>{userName}</span>
            </div>
          )}
          <button onClick={handleLogout} style={styles.logoutButton}>
            <span style={styles.logoutText}>Sign out</span>
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
              Close
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
              <span style={styles.mobileNavLabel}>{item.label}</span>
              {isActive(item.path) && <span style={styles.mobileActiveIndicator}>●</span>}
            </button>
          ))}
          
          <div style={styles.mobileMenuDivider} />
          
          <button onClick={handleLogout} style={styles.mobileLogoutButton}>
            <span>Sign out</span>
          </button>
        </div>
      )}
    </nav>
  );
};

const styles = {
  navbar: {
    backgroundColor: '#ffffff',
    padding: 'clamp(8px, 2vw, 12px) 0',
    color: '#1e293b',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    transition: 'all 0.3s ease',
    width: '100%',
    borderBottom: '1px solid #e2e8f0',
  },
  navbarScrolled: {
    padding: 'clamp(4px, 1vw, 8px) 0',
    backdropFilter: 'blur(10px)',
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderBottomColor: 'transparent',
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
  logoText: {
    fontSize: 'clamp(18px, 4vw, 22px)',
    fontWeight: '600',
    letterSpacing: '-0.02em',
    color: '#0f172a',
  },
  logoBadge: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: 'clamp(10px, 2.5vw, 11px)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  desktopMenu: {
    display: 'flex',
    gap: 'clamp(4px, 1vw, 8px)',
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  navLink: {
    padding: 'clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 16px)',
    border: 'none',
    borderRadius: '6px',
    color: '#475569',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 2vw, 15px)',
    fontWeight: '500',
    background: 'transparent',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f1f5f9',
      color: '#0f172a',
    },
  },
  navLinkActive: {
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
    fontWeight: '600',
  },
  navLabel: {
    whiteSpace: 'nowrap',
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
    backgroundColor: '#f8fafc',
    padding: '4px 12px 4px 4px',
    borderRadius: '30px',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f1f5f9',
    },
  },
  userAvatar: {
    width: 'clamp(30px, 5vw, 32px)',
    height: 'clamp(30px, 5vw, 32px)',
    backgroundColor: '#10b981',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'clamp(12px, 2.5vw, 13px)',
    fontWeight: '600',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  userName: {
    fontSize: 'clamp(13px, 2.5vw, 14px)',
    fontWeight: '500',
    color: '#1e293b',
    maxWidth: '120px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  logoutButton: {
    padding: 'clamp(6px, 1.5vw, 8px) clamp(12px, 2.5vw, 16px)',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    color: '#475569',
    cursor: 'pointer',
    fontSize: 'clamp(13px, 2.5vw, 14px)',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    whiteSpace: 'nowrap',
    ':hover': {
      backgroundColor: '#f8fafc',
      borderColor: '#94a3b8',
      transform: 'translateY(-1px)',
    },
    ':active': {
      transform: 'translateY(0)',
    },
  },
  logoutText: {
    fontWeight: '500',
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
    height: '2px',
    backgroundColor: '#475569',
    borderRadius: '2px',
    transition: 'all 0.3s ease',
  },
  mobileMenu: {
    display: 'none',
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: 'clamp(280px, 80vw, 320px)',
    backgroundColor: '#ffffff',
    padding: 'clamp(20px, 5vw, 24px)',
    boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
    zIndex: 1050,
    overflowY: 'auto',
    borderLeft: '1px solid #e2e8f0',
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
    borderBottom: '1px solid #e2e8f0',
  },
  mobileMenuTitle: {
    fontSize: 'clamp(16px, 4vw, 18px)',
    fontWeight: '600',
    color: '#0f172a',
  },
  mobileCloseButton: {
    background: 'none',
    border: '1px solid #e2e8f0',
    color: '#64748b',
    fontSize: '14px',
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f1f5f9',
      color: '#0f172a',
    },
  },
  mobileUserInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#f8fafc',
    padding: 'clamp(12px, 3vw, 16px)',
    borderRadius: '12px',
    marginBottom: '16px',
    border: '1px solid #e2e8f0',
  },
  mobileUserAvatar: {
    width: 'clamp(40px, 10vw, 48px)',
    height: 'clamp(40px, 10vw, 48px)',
    backgroundColor: '#10b981',
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
    color: '#0f172a',
    marginBottom: '2px',
  },
  mobileUserRole: {
    fontSize: 'clamp(11px, 2.5vw, 12px)',
    color: '#10b981',
    fontWeight: '500',
  },
  mobileMenuDivider: {
    height: '1px',
    backgroundColor: '#e2e8f0',
    margin: 'clamp(16px, 4vw, 20px) 0',
  },
  mobileNavLink: {
    padding: 'clamp(12px, 3vw, 14px)',
    backgroundColor: '#ffffff',
    border: '1px solid #f1f5f9',
    borderRadius: '8px',
    color: '#475569',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    textAlign: 'left',
    marginBottom: '8px',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#f8fafc',
      borderColor: '#cbd5e1',
    },
  },
  mobileNavLinkActive: {
    backgroundColor: '#f1f5f9',
    borderColor: '#94a3b8',
    color: '#0f172a',
    fontWeight: '600',
  },
  mobileNavLabel: {
    flex: 1,
  },
  mobileActiveIndicator: {
    color: '#10b981',
    fontSize: '12px',
    marginLeft: '8px',
  },
  mobileLogoutButton: {
    padding: 'clamp(12px, 3vw, 14px)',
    backgroundColor: '#ffffff',
    border: '1px solid #ef4444',
    borderRadius: '8px',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    textAlign: 'center',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#fef2f2',
      borderColor: '#dc2626',
    },
  },
};

export default UserNavigation;