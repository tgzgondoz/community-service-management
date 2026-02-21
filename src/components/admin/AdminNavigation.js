import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';

const AdminNavigation = ({ onLogout }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
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

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsExpanded(false);
      } else if (window.innerWidth >= 1024) {
        setIsExpanded(true);
      }
    };

    handleResize(); // Set initial state
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen]);

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

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Mobile Header */}
      <div style={styles.mobileHeader}>
        <div style={styles.mobileHeaderLeft}>
          <button 
            style={styles.mobileMenuButton}
            onClick={() => setIsMobileOpen(true)}
          >
            <div style={styles.hamburgerLine} />
            <div style={styles.hamburgerLine} />
            <div style={styles.hamburgerLine} />
          </button>
          <span style={styles.mobileLogo}>CSMS Admin</span>
        </div>
        <div style={styles.mobileHeaderRight}>
          <button onClick={handleLogout} style={styles.mobileLogoutButton}>
            Logout
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileOpen && (
        <div 
          style={styles.mobileOverlay}
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Side Navigation */}
      <div style={{
        ...styles.mobileNav,
        transform: isMobileOpen ? 'translateX(0)' : 'translateX(-100%)',
      }}>
        <div style={styles.mobileNavHeader}>
          <span style={styles.mobileNavLogo}>CSMS Admin</span>
          <button 
            style={styles.mobileCloseButton}
            onClick={() => setIsMobileOpen(false)}
          >
            ✕
          </button>
        </div>

        <div style={styles.mobileNavContent}>
          {menuItems.map(item => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setIsMobileOpen(false);
              }}
              style={{
                ...styles.mobileNavItem,
                ...(isActive(item.path) ? styles.mobileNavItemActive : {}),
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={styles.mobileNavFooter}>
          <div style={styles.mobileUserInfo}>
            Admin User
          </div>
          <button onClick={handleLogout} style={styles.mobileNavLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Desktop Side Navigation */}
      <div style={{
        ...styles.sideNav,
        width: isExpanded ? '260px' : '80px',
      }}>
        {/* Logo Section */}
        <div style={styles.logoSection}>
          <span style={styles.logoText}>CSMS</span>
          {isExpanded && <span style={styles.logoBadge}>Admin</span>}
        </div>

        {/* Toggle Button */}
        <button 
          style={styles.toggleButton}
          onClick={toggleSidebar}
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? '◀' : '▶'}
        </button>

        {/* Navigation Items */}
        <div style={styles.navItems}>
          {menuItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                ...styles.navItem,
                ...(isActive(item.path) ? styles.navItemActive : {}),
                justifyContent: isExpanded ? 'flex-start' : 'center',
              }}
              title={!isExpanded ? item.label : ''}
            >
              <span style={styles.navIndicator} />
              <span style={styles.navLabel}>
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {/* Bottom Section */}
        <div style={styles.bottomSection}>
          <div style={{
            ...styles.userInfo,
            justifyContent: isExpanded ? 'flex-start' : 'center',
          }}>
            <div style={styles.userAvatar}>
              A
            </div>
            {isExpanded && (
              <div style={styles.userDetails}>
                <span style={styles.userName}>Admin User</span>
                <span style={styles.userRole}>Administrator</span>
              </div>
            )}
          </div>

          <button 
            onClick={handleLogout} 
            style={{
              ...styles.logoutButton,
              justifyContent: isExpanded ? 'flex-start' : 'center',
            }}
            title={!isExpanded ? 'Logout' : ''}
          >
            <span style={styles.logoutIcon}>→</span>
            {isExpanded && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content Spacer */}
      <div style={{
        ...styles.mainContentSpacer,
        marginLeft: window.innerWidth < 768 ? '0' : (isExpanded ? '260px' : '80px'),
      }} />
    </>
  );
};

const styles = {
  // Mobile Header
  mobileHeader: {
    display: 'none',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: '60px',
    backgroundColor: '#1a1a1a',
    borderBottom: '1px solid #333333',
    padding: '0 16px',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 900,
    '@media (max-width: 768px)': {
      display: 'flex',
    },
  },
  mobileHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  mobileMenuButton: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    width: '24px',
    height: '24px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
  },
  hamburgerLine: {
    width: '24px',
    height: '2px',
    backgroundColor: '#ffffff',
    margin: '2px 0',
  },
  mobileLogo: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
  },
  mobileHeaderRight: {
    display: 'flex',
    alignItems: 'center',
  },
  mobileLogoutButton: {
    padding: '6px 12px',
    backgroundColor: '#333333',
    border: '1px solid #444444',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '13px',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#444444',
    },
  },

  // Mobile Overlay
  mobileOverlay: {
    display: 'none',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 950,
    '@media (max-width: 768px)': {
      display: 'block',
    },
  },

  // Mobile Navigation
  mobileNav: {
    display: 'none',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    width: '280px',
    backgroundColor: '#1a1a1a',
    zIndex: 1000,
    transition: 'transform 0.3s ease',
    flexDirection: 'column',
    '@media (max-width: 768px)': {
      display: 'flex',
    },
  },
  mobileNavHeader: {
    padding: '20px 16px',
    borderBottom: '1px solid #333333',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mobileNavLogo: {
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
  },
  mobileNavContent: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
  },
  mobileNavItem: {
    width: '100%',
    padding: '12px 16px',
    marginBottom: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '15px',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#333333',
    },
  },
  mobileNavItemActive: {
    backgroundColor: '#333333',
    borderLeft: '3px solid #ffffff',
  },
  mobileNavFooter: {
    padding: '16px',
    borderTop: '1px solid #333333',
  },
  mobileUserInfo: {
    padding: '8px 0',
    marginBottom: '8px',
    color: '#ffffff',
    fontSize: '14px',
  },
  mobileNavLogout: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#333333',
    border: 'none',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '14px',
    cursor: 'pointer',
    ':hover': {
      backgroundColor: '#444444',
    },
  },

  // Desktop Side Navigation
  sideNav: {
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#1a1a1a',
    borderRight: '1px solid #333333',
    transition: 'width 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 800,
    '@media (max-width: 768px)': {
      display: 'none',
    },
  },
  logoSection: {
    padding: '24px 20px',
    borderBottom: '1px solid #333333',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  logoText: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#ffffff',
    letterSpacing: '0.5px',
  },
  logoBadge: {
    padding: '2px 8px',
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
  },
  toggleButton: {
    position: 'absolute',
    top: '20px',
    right: '-12px',
    width: '24px',
    height: '24px',
    backgroundColor: '#333333',
    border: '1px solid #444444',
    borderRadius: '50%',
    color: '#ffffff',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 850,
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#444444',
    },
  },
  navItems: {
    flex: 1,
    padding: '20px 12px',
    overflowY: 'auto',
  },
  navItem: {
    width: '100%',
    padding: '12px 16px',
    marginBottom: '4px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    position: 'relative',
    ':hover': {
      backgroundColor: '#333333',
    },
  },
  navItemActive: {
    backgroundColor: '#333333',
  },
  navIndicator: {
    width: '3px',
    height: '20px',
    backgroundColor: '#ffffff',
    position: 'absolute',
    left: '-12px',
    opacity: 0,
    transition: 'opacity 0.2s ease',
  },
  navLabel: {
    flex: 1,
    textAlign: 'left',
  },
  bottomSection: {
    padding: '20px 12px',
    borderTop: '1px solid #333333',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
    padding: '8px',
    borderRadius: '6px',
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    backgroundColor: '#333333',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: '600',
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#ffffff',
  },
  userRole: {
    fontSize: '12px',
    color: '#888888',
  },
  logoutButton: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    ':hover': {
      backgroundColor: '#333333',
    },
  },
  logoutIcon: {
    fontSize: '16px',
    transform: 'rotate(180deg)',
  },
  mainContentSpacer: {
    transition: 'margin-left 0.3s ease',
    '@media (max-width: 768px)': {
      marginLeft: '0',
    },
  },
};

// Add global styles
const style = document.createElement('style');
style.textContent = `
  @media (max-width: 768px) {
    body {
      padding-top: 60px;
    }
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