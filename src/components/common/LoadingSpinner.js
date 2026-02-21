import React from 'react';

const LoadingSpinner = ({ 
  fullScreen = false, 
  text = 'Loading...', 
  size = 'medium',
  color = '#000000',
  backgroundColor = '#ffffff'
}) => {
  
  // Size mappings
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
        border: `${selectedSize.border} solid #e0e0e0`,
        borderTop: `${selectedSize.border} solid ${color}`,
      }}></div>
      
      {text && (
        <p style={{
          ...styles.text,
          fontSize: selectedSize.text,
          color: color === '#000000' ? '#333333' : color
        }}>
          {text}
        </p>
      )}

      {/* Pulse effect for the spinner container */}
      <div style={styles.pulseCircle}></div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0% {
            transform: scale(0.95);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.2;
          }
          100% {
            transform: scale(0.95);
            opacity: 0.5;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .spinner {
            animation: none;
          }
          .pulse-circle {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

// Inline loading spinner for buttons and small areas
export const InlineSpinner = ({ size = 'small', color = '#000000' }) => {
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
        border: `${borderSize} solid #e0e0e0`,
        borderTop: `${borderSize} solid ${color}`,
      }}></div>
    </div>
  );
};

// Skeleton loading component for content
export const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const renderSkeleton = () => {
    switch(type) {
      case 'card':
        return (
          <div style={styles.skeletonCard}>
            <div style={styles.skeletonImage}></div>
            <div style={styles.skeletonLine}></div>
            <div style={styles.skeletonLine}></div>
            <div style={styles.skeletonLineShort}></div>
          </div>
        );
      case 'table':
        return (
          <div style={styles.skeletonTable}>
            <div style={styles.skeletonHeader}></div>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={styles.skeletonRow}></div>
            ))}
          </div>
        );
      case 'text':
        return (
          <div style={styles.skeletonText}>
            <div style={styles.skeletonLine}></div>
            <div style={styles.skeletonLine}></div>
            <div style={styles.skeletonLineShort}></div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={styles.skeletonContainer}>
      {[...Array(count)].map((_, i) => (
        <div key={i} style={styles.skeletonWrapper}>
          {renderSkeleton()}
        </div>
      ))}
      
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }
        
        .skeleton-shimmer {
          animation: shimmer 2s infinite linear;
          background: linear-gradient(to right, #f0f0f0 4%, #e0e0e0 25%, #f0f0f0 36%);
          background-size: 1000px 100%;
        }
      `}</style>
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
  pulseCircle: {
    position: 'absolute',
    width: 'clamp(60px, 15vw, 100px)',
    height: 'clamp(60px, 15vw, 100px)',
    borderRadius: '50%',
    backgroundColor: 'rgba(0,0,0,0.05)',
    animation: 'pulse 2s ease-in-out infinite',
    zIndex: 1,
  },
  text: {
    color: '#333333',
    fontSize: 'clamp(14px, 3.5vw, 16px)',
    fontWeight: '500',
    letterSpacing: '0.5px',
    marginTop: 'clamp(8px, 2vw, 12px)',
    position: 'relative',
    zIndex: 2,
    '@media (max-width: 480px)': {
      fontSize: '14px',
    },
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
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  skeletonContainer: {
    width: '100%',
    maxWidth: '1400px',
    margin: '0 auto',
    padding: 'clamp(16px, 4vw, 24px)',
    boxSizing: 'border-box',
  },
  skeletonWrapper: {
    marginBottom: 'clamp(16px, 3vw, 20px)',
  },
  skeletonCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: 'clamp(16px, 3vw, 20px)',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
  },
  skeletonImage: {
    width: '100%',
    height: 'clamp(150px, 30vw, 200px)',
    backgroundColor: '#f0f0f0',
    borderRadius: '8px',
    marginBottom: '16px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  },
  skeletonLine: {
    height: 'clamp(16px, 3vw, 20px)',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    marginBottom: '12px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  },
  skeletonLineShort: {
    width: '60%',
    height: 'clamp(16px, 3vw, 20px)',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  },
  skeletonTable: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: 'clamp(16px, 3vw, 20px)',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
  },
  skeletonHeader: {
    height: 'clamp(40px, 8vw, 50px)',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    marginBottom: '16px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  },
  skeletonRow: {
    height: 'clamp(30px, 6vw, 40px)',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    marginBottom: '8px',
    background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite',
  },
  skeletonText: {
    padding: 'clamp(12px, 3vw, 16px)',
  },
};

// Responsive media queries for skeleton loader
const skeletonStyles = `
  @media (max-width: 768px) {
    .skeleton-card {
      padding: 12px;
    }
    
    .skeleton-image {
      height: 120px;
    }
    
    .skeleton-line {
      height: 14px;
    }
  }
  
  @media (max-width: 480px) {
    .skeleton-table {
      padding: 12px;
    }
    
    .skeleton-header {
      height: 35px;
    }
    
    .skeleton-row {
      height: 25px;
    }
  }
`;

// Add skeleton styles to document
const style = document.createElement('style');
style.textContent = skeletonStyles;
document.head.appendChild(style);

export default LoadingSpinner;