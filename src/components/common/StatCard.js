import React from 'react';

const StatCard = ({ title, value, icon, color, onClick }) => {
  return (
    <div 
      style={{...styles.card, cursor: onClick ? 'pointer' : 'default'}} 
      onClick={onClick}
    >
      <div style={styles.content}>
        <div>
          <p style={styles.title}>{title}</p>
          <p style={styles.value}>{value}</p>
        </div>
        <div style={{...styles.iconContainer, backgroundColor: color}}>
          <span style={styles.icon}>{icon}</span>
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 12px rgba(0,0,0,0.15)'
    }
  },
  content: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    color: '#6b7280',
    fontSize: '14px',
    marginBottom: '8px'
  },
  value: {
    color: '#1f2937',
    fontSize: '28px',
    fontWeight: 'bold',
    margin: 0
  },
  iconContainer: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  icon: {
    color: 'white',
    fontSize: '24px'
  }
};

export default StatCard;