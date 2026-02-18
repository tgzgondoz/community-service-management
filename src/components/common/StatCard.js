import React from 'react';

const StatCard = ({ title, value, icon, color, onClick }) => {
  return (
    <div 
      style={{
        ...styles.card,
        borderLeft: `4px solid ${color}`,
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
    >
      <div style={styles.iconContainer}>
        <span style={styles.icon}>{icon}</span>
      </div>
      <div style={styles.content}>
        <p style={styles.title}>{title}</p>
        <p style={styles.value}>{value}</p>
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    border: '1px solid #e0e0e0',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
    }
  },
  iconContainer: {
    width: '60px',
    height: '60px',
    backgroundColor: '#f0f0f0',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #cccccc'
  },
  icon: {
    fontSize: '30px'
  },
  content: {
    flex: 1
  },
  title: {
    margin: '0 0 8px 0',
    color: '#666666',
    fontSize: '14px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  value: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#000000'
  }
};

export default StatCard;