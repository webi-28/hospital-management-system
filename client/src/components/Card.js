import React from 'react';

/**
 * Generic card container.
 * Props: title, subtitle, action (JSX), className, children
 */
const Card = ({ title, subtitle, action, className = '', children, ...rest }) => (
  <div className={`card ${className}`} {...rest}>
    {(title || action) && (
      <div className="card-header">
        <div>
          {title    && <h3 className="card-title">{title}</h3>}
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </div>
        {action && <div className="card-action">{action}</div>}
      </div>
    )}
    <div className="card-body">{children}</div>
  </div>
);

export default Card;
