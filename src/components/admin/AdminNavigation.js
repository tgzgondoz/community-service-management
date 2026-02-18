import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';

const AdminNavigation = ({ onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/offenders', label: 'Offenders (#2)', icon: '👥' },
    { path: '/recommended', label: 'Recommended (#4)', icon: '✅' },
    { path: '/interventions', label: 'Interventions (#5)', icon: '🫂' },
    { path: '/reports', label: 'Reports (#7, #8)', icon: '📈' }
  ];

  return (
    <nav style={styles.navbar}>
      <div style={styles.navContainer}>
        <div style={styles.logoSection}>
          <span style={styles.logoIcon}>⚖️</span>
          <span style={styles.logoText}>CSMS Admin</span>
        </div>

        {/* Desktop Menu */}
        <div style={styles.desktopMenu}>
          {menuItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                ...styles.navLink,
                backgroundColor: isActive(item.path) ? 'rgba(255,255,255,0.2)' : 'transparent'
              }}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>

        <div style={styles.rightSection}>
          <span style={styles.adminBadge}>Admin</span>
          <button onClick={handleLogout} style={styles.logoutButton}>
            <span style={styles.logoutIcon}>🚪</span>
            Logout
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button 
          style={styles.mobileMenuButton}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div style={styles.mobileMenu}>
          {menuItems.map(item => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setMobileMenuOpen(false);
              }}
              style={styles.mobileNavLink}
            >
              <span style={styles.navIcon}>{item.icon}</span>
              {item.label}
            </button>
          ))}
          <button onClick={handleLogout} style={styles.mobileLogoutButton}>
            <span style={styles.logoutIcon}>🚪</span>
            Logout
          </button>
        </div>
      )}

      {/* Add CSS in a style tag */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-menu {
            display: none !important;
          }
          .right-section {
            display: none !important;
          }
          .mobile-menu-button {
            display: block !important;
          }
          .mobile-menu {
            display: flex !important;
            flex-direction: column;
            animation: slideDown 0.3s ease;
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
      `}</style>
    </nav>
  );
};

const styles = {
  navbar: {
    backgroundColor: '#1a237e',
    padding: '12px 0',
    color: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    position: 'sticky',
    top: 0,
    zIndex: 1000
  },
  navContainer: {
    maxWidth: '1400px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 24px'
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer'
  },
  logoIcon: {
    fontSize: '28px'
  },
  logoText: {
    fontSize: '20px',
    fontWeight: '600',
    letterSpacing: '0.5px'
  },
  desktopMenu: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  navLink: {
    padding: '10px 16px',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'transparent'
  },
  navIcon: {
    fontSize: '18px'
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  adminBadge: {
    backgroundColor: '#ffd700',
    color: '#1a237e',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600'
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  logoutIcon: {
    fontSize: '16px'
  },
  mobileMenuButton: {
    display: 'none',
    fontSize: '24px',
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '4px'
  },
  mobileMenu: {
    display: 'none',
    padding: '16px',
    backgroundColor: '#283593'
  },
  mobileNavLink: {
    padding: '12px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    textAlign: 'left',
    marginBottom: '8px'
  },
  mobileLogoutButton: {
    padding: '12px',
    backgroundColor: '#f44336',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    textAlign: 'left',
    marginTop: '8px'
  }
};

export default AdminNavigation;