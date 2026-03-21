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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
    const handleResize = () => {
      if (window.innerWidth > 768 && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.displayName) {
          setUserName(userData.displayName);
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
    { path: '/user-dashboard', label: 'Dashboard' },
    { path: '/profiling', label: 'Profiling' },
    { path: '/profile', label: 'My Profile' }
  ];

  return (
    <>
      <nav className="user-nav" style={{
        ...styles.navbar,
        ...(scrolled ? styles.navbarScrolled : {}),
      }}>
        <div style={styles.navContainer}>
          <div 
            style={styles.logoSection}
            onClick={() => navigate('/user-dashboard')}
          >
            <span style={styles.logoText}>CSMS</span>
            <span style={styles.logoBadge}>User</span>
          </div>

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

          <div style={styles.rightSection}>
            {userName && (
              <div style={styles.userInfo}>
                <div style={styles.userAvatar}>
                  {userInitials || 'U'}
                </div>
                <span style={styles.userName}>{userName}</span>
              </div>
            )}
            <button onClick={handleLogout} className="logout-button" style={styles.logoutButton}>
              <span style={styles.logoutText}>Sign out</span>
            </button>
          </div>

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

      <style dangerouslySetInnerHTML={{ __html: `
        .user-nav {
          transition: all 0.3s ease;
        }
        
        .user-nav .logout-button:hover {
          background-color: #f8fafc;
          border-color: #94a3b8;
          transform: translateY(-1px);
        }
        
        .user-nav .nav-link:hover {
          background-color: #f1f5f9;
          color: #0f172a;
        }
        
        .user-nav .user-info:hover {
          background-color: #f1f5f9;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      ` }} />
    </>
  );
};

const styles = {
  navbar: {
    backgroundColor: '#ffffff',
    padding: 'clamp(8px, 2vw, 12px) 0',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
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
  },
};

export default UserNavigation;