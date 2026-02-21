import React from 'react';

const StatCard = ({ 
  title, 
  value, 
  icon, 
  color, 
  onClick,
  subtitle,
  trend,
  trendValue,
  size = 'medium',
  loading = false
}) => {
  
  // Size mappings
  const sizeMap = {
    small: {
      container: 'padding: clamp(12px, 2vw, 16px); gap: clamp(12px, 2vw, 16px);',
      icon: 'width: clamp(40px, 8vw, 50px); height: clamp(40px, 8vw, 50px);',
      iconFont: 'font-size: clamp(20px, 4vw, 24px);',
      title: 'font-size: clamp(12px, 2.5vw, 13px);',
      value: 'font-size: clamp(20px, 5vw, 24px);'
    },
    medium: {
      container: 'padding: clamp(16px, 3vw, 20px); gap: clamp(16px, 3vw, 20px);',
      icon: 'width: clamp(50px, 10vw, 60px); height: clamp(50px, 10vw, 60px);',
      iconFont: 'font-size: clamp(24px, 5vw, 30px);',
      title: 'font-size: clamp(13px, 2.5vw, 14px);',
      value: 'font-size: clamp(24px, 6vw, 28px);'
    },
    large: {
      container: 'padding: clamp(20px, 4vw, 24px); gap: clamp(20px, 4vw, 24px);',
      icon: 'width: clamp(60px, 12vw, 70px); height: clamp(60px, 12vw, 70px);',
      iconFont: 'font-size: clamp(28px, 6vw, 35px);',
      title: 'font-size: clamp(14px, 3vw, 16px);',
      value: 'font-size: clamp(28px, 7vw, 32px);'
    }
  };

  const selectedSize = sizeMap[size] || sizeMap.medium;

  // Trend indicators
  const getTrendIcon = () => {
    if (!trend) return null;
    switch(trend) {
      case 'up':
        return '📈';
      case 'down':
        return '📉';
      case 'neutral':
        return '➡️';
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '#666666';
    switch(trend) {
      case 'up':
        return '#4CAF50';
      case 'down':
        return '#f44336';
      case 'neutral':
        return '#FF9800';
      default:
        return '#666666';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{
        ...styles.card,
        borderLeft: `4px solid ${color}`,
        cursor: 'default',
        ...styles.loadingCard
      }}>
        <div style={styles.loadingIcon}></div>
        <div style={styles.loadingContent}>
          <div style={styles.loadingTitle}></div>
          <div style={styles.loadingValue}></div>
        </div>
        
        <style>{`
          @keyframes pulse {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
          
          .loading-pulse {
            animation: pulse 1.5s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div 
      style={{
        ...styles.card,
        borderLeft: `4px solid ${color}`,
        cursor: onClick ? 'pointer' : 'default',
        ...(onClick ? styles.clickable : {}),
      }}
      onClick={onClick}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : undefined}
      onKeyPress={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div style={{
        ...styles.iconContainer,
        ...JSON.parse(selectedSize.icon.replace(/(\w+):\s*([^;]+);/g, '"$1":"$2",'))
      }}>
        <span style={{
          ...styles.icon,
          ...JSON.parse(selectedSize.iconFont.replace(/(\w+):\s*([^;]+);/g, '"$1":"$2",'))
        }}>{icon}</span>
      </div>
      
      <div style={styles.content}>
        <p style={{
          ...styles.title,
          ...JSON.parse(selectedSize.title.replace(/(\w+):\s*([^;]+);/g, '"$1":"$2",'))
        }}>{title}</p>
        
        <div style={styles.valueContainer}>
          <p style={{
            ...styles.value,
            ...JSON.parse(selectedSize.value.replace(/(\w+):\s*([^;]+);/g, '"$1":"$2",'))
          }}>{value}</p>
          
          {subtitle && (
            <span style={styles.subtitle}>{subtitle}</span>
          )}
        </div>
        
        {(trend || trendValue) && (
          <div style={styles.trendContainer}>
            {trend && (
              <span style={styles.trendIcon}>{getTrendIcon()}</span>
            )}
            {trendValue && (
              <span style={{
                ...styles.trendValue,
                color: getTrendColor()
              }}>
                {trendValue}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Add CSS for hover effects */}
      <style>{`
        @media (hover: hover) {
          .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(0,0,0,0.15);
          }
        }
        
        @media (max-width: 768px) {
          .stat-card {
            padding: 16px;
          }
          
          .stat-card:active {
            transform: scale(0.98);
          }
        }
        
        @media (max-width: 480px) {
          .stat-card {
            padding: 14px;
          }
        }
      `}</style>
    </div>
  );
};

// Compact StatCard variant for dashboards with many stats
export const CompactStatCard = ({ title, value, icon, color, onClick }) => {
  return (
    <StatCard
      title={title}
      value={value}
      icon={icon}
      color={color}
      onClick={onClick}
      size="small"
    />
  );
};

// Horizontal StatCard variant for side panels
export const HorizontalStatCard = ({ title, value, icon, color, onClick }) => {
  return (
    <div style={styles.horizontalCard} onClick={onClick}>
      <div style={{
        ...styles.horizontalIcon,
        backgroundColor: color,
        opacity: 0.8
      }}>
        <span style={styles.horizontalIconText}>{icon}</span>
      </div>
      <div style={styles.horizontalContent}>
        <p style={styles.horizontalTitle}>{title}</p>
        <p style={styles.horizontalValue}>{value}</p>
      </div>
      
      <style>{`
        @media (max-width: 768px) {
          .horizontal-card {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
};

// StatCard with progress bar
export const ProgressStatCard = ({ title, value, icon, color, progress, max }) => {
  const progressPercentage = (progress / max) * 100;
  
  return (
    <div style={styles.progressCard}>
      <div style={styles.progressHeader}>
        <div style={styles.progressIconContainer}>
          <span style={styles.progressIcon}>{icon}</span>
        </div>
        <div style={styles.progressTitleContainer}>
          <p style={styles.progressTitle}>{title}</p>
          <p style={styles.progressValue}>{value}</p>
        </div>
      </div>
      
      <div style={styles.progressBarContainer}>
        <div style={styles.progressBarBackground}>
          <div style={{
            ...styles.progressBarFill,
            width: `${progressPercentage}%`,
            backgroundColor: color
          }}></div>
        </div>
        <span style={styles.progressPercentage}>
          {progressPercentage.toFixed(1)}%
        </span>
      </div>
      
      <style>{`
        @keyframes fillBar {
          from { width: 0; }
          to { width: ${progressPercentage}%; }
        }
        
        .progress-fill {
          animation: fillBar 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: 'clamp(16px, 3vw, 20px)',
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(16px, 3vw, 20px)',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease',
    border: '1px solid #e0e0e0',
    width: '100%',
    boxSizing: 'border-box',
    position: 'relative',
    overflow: 'hidden',
  },
  clickable: {
    cursor: 'pointer',
    '@media (hover: hover)': {
      ':hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.15)',
      },
      ':active': {
        transform: 'translateY(-2px)',
      },
    },
  },
  iconContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #e0e0e0',
    flexShrink: 0,
    transition: 'transform 0.3s ease',
  },
  icon: {
    lineHeight: 1,
  },
  content: {
    flex: 1,
    minWidth: 0, // Prevents text overflow
  },
  valueContainer: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '8px',
    flexWrap: 'wrap',
  },
  title: {
    margin: '0 0 4px 0',
    color: '#666666',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  value: {
    margin: 0,
    fontWeight: 'bold',
    color: '#000000',
    lineHeight: 1.2,
  },
  subtitle: {
    color: '#999999',
    fontSize: 'clamp(11px, 2.5vw, 12px)',
    fontWeight: 'normal',
  },
  trendContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '4px',
  },
  trendIcon: {
    fontSize: 'clamp(14px, 3vw, 16px)',
  },
  trendValue: {
    fontSize: 'clamp(12px, 2.5vw, 13px)',
    fontWeight: '500',
  },
  horizontalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: 'clamp(12px, 2.5vw, 16px)',
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(12px, 2.5vw, 16px)',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%',
    boxSizing: 'border-box',
    ':hover': {
      transform: 'translateX(4px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
    },
    '@media (max-width: 768px)': {
      padding: '12px',
    },
  },
  horizontalIcon: {
    width: 'clamp(40px, 8vw, 50px)',
    height: 'clamp(40px, 8vw, 50px)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  horizontalIconText: {
    fontSize: 'clamp(20px, 4vw, 24px)',
    color: '#ffffff',
  },
  horizontalContent: {
    flex: 1,
  },
  horizontalTitle: {
    margin: '0 0 4px 0',
    color: '#666666',
    fontSize: 'clamp(12px, 2.5vw, 13px)',
    fontWeight: '500',
  },
  horizontalValue: {
    margin: 0,
    fontSize: 'clamp(16px, 3.5vw, 18px)',
    fontWeight: 'bold',
    color: '#000000',
  },
  progressCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: 'clamp(16px, 3vw, 20px)',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    border: '1px solid #e0e0e0',
    width: '100%',
    boxSizing: 'border-box',
  },
  progressHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(12px, 2.5vw, 16px)',
    marginBottom: 'clamp(12px, 2.5vw, 16px)',
  },
  progressIconContainer: {
    width: 'clamp(40px, 8vw, 50px)',
    height: 'clamp(40px, 8vw, 50px)',
    backgroundColor: '#f8f8f8',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #e0e0e0',
    flexShrink: 0,
  },
  progressIcon: {
    fontSize: 'clamp(20px, 4vw, 24px)',
  },
  progressTitleContainer: {
    flex: 1,
  },
  progressTitle: {
    margin: '0 0 4px 0',
    color: '#666666',
    fontSize: 'clamp(13px, 2.5vw, 14px)',
    fontWeight: '500',
  },
  progressValue: {
    margin: 0,
    fontSize: 'clamp(18px, 4vw, 20px)',
    fontWeight: 'bold',
    color: '#000000',
  },
  progressBarContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  progressBarBackground: {
    flex: 1,
    height: '8px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease',
  },
  progressPercentage: {
    fontSize: 'clamp(12px, 2.5vw, 14px)',
    color: '#666666',
    fontWeight: '500',
    minWidth: '45px',
    textAlign: 'right',
  },
  
  // Loading states
  loadingCard: {
    pointerEvents: 'none',
  },
  loadingIcon: {
    width: 'clamp(40px, 8vw, 60px)',
    height: 'clamp(40px, 8vw, 60px)',
    backgroundColor: '#f0f0f0',
    borderRadius: '50%',
    animation: 'pulse 1.5s ease-in-out infinite',
    flexShrink: 0,
  },
  loadingContent: {
    flex: 1,
  },
  loadingTitle: {
    height: 'clamp(12px, 2.5vw, 14px)',
    width: '60%',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    marginBottom: '8px',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  loadingValue: {
    height: 'clamp(20px, 4vw, 24px)',
    width: '40%',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    animation: 'pulse 1.5s ease-in-out infinite',
  },
};

// Add global keyframe animations
const style = document.createElement('style');
style.textContent = `
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
`;
document.head.appendChild(style);

export default StatCard;