import React from 'react';

const LoadingSpinner = ({ fullScreen = false, size = 40, message = 'Loading...' }) => {
  if (fullScreen) {
    return (
      <div className="spinner-fullscreen">
        <div className="spinner" style={{ width: size, height: size }} />
        <p className="spinner-text">{message}</p>
      </div>
    );
  }
  return (
    <div className="spinner-inline">
      <div className="spinner" style={{ width: size, height: size }} />
    </div>
  );
};

export default LoadingSpinner;
