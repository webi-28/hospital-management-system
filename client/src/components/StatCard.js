import React from 'react';

/**
 * Dashboard stat card.
 * Props: icon, label, value, color ('blue'|'green'|'orange'|'red'|'purple'), trend
 */
const StatCard = ({ icon, label, value, color = 'blue', trend, loading }) => (
  <div className={`stat-card stat-${color}`}>
    <div className="stat-icon">{icon}</div>
    <div className="stat-info">
      <p className="stat-label">{label}</p>
      {loading
        ? <div className="skeleton-text" />
        : <h2 className="stat-value">{value}</h2>
      }
      {trend && <span className={`stat-trend ${trend.up ? 'up' : 'down'}`}>{trend.label}</span>}
    </div>
  </div>
);

export default StatCard;
