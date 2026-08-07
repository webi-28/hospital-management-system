import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NotFound = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const home = user ? ({ admin:'/admin', doctor:'/doctor', patient:'/patient' }[user.role] || '/') : '/login';

  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <h1 className="not-found-code">404</h1>
        <h2>Page Not Found</h2>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <button className="btn btn-primary" onClick={() => navigate(home)}>
          Go Home
        </button>
      </div>
    </div>
  );
};

export default NotFound;
