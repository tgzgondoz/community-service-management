import React from 'react';

const LoadingSpinner = ({ 
  fullScreen = false, 
  text = 'Loading...', 
  size = 'medium',
  color = '#0f172a',
  backgroundColor = '#ffffff'
}) => {
  
  const sizeMap = {
    small: {
      spinner: '30px',
      border: '3px',
      text: '14px'
    },
    medium: {
      spinner: '50px',
      border: '5px',
      text: '16px'
    },
    large: {
      spinner: '70px',
      border: '6px',
      text: '18px'
    },
    xlarge: {
      spinner: '100px',
      border: '8px',
      text: '20px'
    }
  };

  const selectedSize = sizeMap[size] || sizeMap.medium;

  return (
    <div style={{
      ...styles.container,
      ...(fullScreen ? styles.fullScreen : {}),
      backgroundColor: backgroundColor
    }}>
      <div style={{
        ...styles.spinner,
        width: selectedSize.spinner,
        height: selectedSize.spinner,
        border: `${selectedSize.border} solid #e2e8f0`,
        borderTop: `${selectedSize.border} solid ${color}`,
      }}></div>
      
      {text && (
        <p style={{
          ...styles.text,
          fontSize: selectedSize.text,
          color: color
        }}>
          {text}
        </p>
      )}
    </div>
  );
};

// Inline loading spinner for buttons and small areas
export const InlineSpinner = ({ size = 'small', color = '#ffffff' }) => {
  const sizeMap = {
    small: '20px',
    medium: '30px',
    large: '40px'
  };

  const spinnerSize = sizeMap[size] || sizeMap.small;
  const borderSize = size === 'small' ? '2px' : size === 'medium' ? '3px' : '4px';

  return (
    <div style={styles.inlineContainer}>
      <div style={{
        ...styles.inlineSpinner,
        width: spinnerSize,
        height: spinnerSize,
        border: `${borderSize} solid rgba(255,255,255,0.3)`,
        borderTop: `${borderSize} solid ${color}`,
      }}></div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 'clamp(200px, 50vh, 400px)',
    backgroundColor: '#ffffff',
    padding: 'clamp(16px, 4vw, 24px)',
    boxSizing: 'border-box',
    position: 'relative',
  },
  fullScreen: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: '100vh',
    zIndex: 9999,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(4px)',
  },
  spinner: {
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: 'clamp(16px, 3vw, 20px)',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    position: 'relative',
    zIndex: 2,
  },
  text: {
    fontWeight: '500',
    letterSpacing: '0.5px',
    marginTop: 'clamp(8px, 2vw, 12px)',
    position: 'relative',
    zIndex: 2,
  },
  inlineContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 4px',
  },
  inlineSpinner: {
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

// Add global animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default LoadingSpinner;