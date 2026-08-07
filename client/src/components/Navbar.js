import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiBell, FiMenu, FiMoon, FiSun, FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen]   = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [notifOpen,     setNotifOpen]     = useState(false);
  const dropRef  = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/notifications?limit=5')
      .then(({ data }) => {
        setNotifications(data.data || []);
        setUnreadCount(data.unread_count || 0);
      })
      .catch(() => {});
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current  && !dropRef.current.contains(e.target))  setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAllRead = async () => {
    await api.put('/notifications/read-all');
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const rolePaths = { admin: '/admin', doctor: '/doctor', patient: '/patient' };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="btn-icon" onClick={onMenuClick} aria-label="Toggle menu">
          <FiMenu size={22} />
        </button>
        <Link to={rolePaths[user?.role] || '/'} className="navbar-brand">
          <span className="brand-icon">🏥</span>
          <span className="brand-text">HMS</span>
        </Link>
      </div>

      <div className="navbar-right">
        {/* Theme toggle */}
        <button className="btn-icon" onClick={toggleTheme} aria-label="Toggle theme">
          {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
        </button>

        {/* Notifications */}
        <div className="notif-wrapper" ref={notifRef}>
          <button className="btn-icon notif-btn" onClick={() => setNotifOpen((p) => !p)} aria-label="Notifications">
            <FiBell size={20} />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>

          {notifOpen && (
            <div className="notif-dropdown">
              <div className="notif-header">
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <button className="btn-link" onClick={handleMarkAllRead}>Mark all read</button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="notif-empty">No notifications</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`}>
                    <strong>{n.title}</strong>
                    <p>{n.message}</p>
                    <small>{new Date(n.created_at).toLocaleDateString()}</small>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User dropdown */}
        <div className="user-dropdown-wrapper" ref={dropRef}>
          <button className="user-avatar-btn" onClick={() => setDropdownOpen((p) => !p)}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt={user.full_name} className="avatar-img" />
              : <div className="avatar-placeholder">{user?.full_name?.[0]?.toUpperCase()}</div>
            }
            <span className="user-name-nav">{user?.full_name}</span>
          </button>

          {dropdownOpen && (
            <div className="user-dropdown">
              <div className="dropdown-header">
                <strong>{user?.full_name}</strong>
                <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
              </div>
              <hr />
              <button onClick={() => { navigate('/profile'); setDropdownOpen(false); }}>
                <FiUser size={14} /> Profile
              </button>
              <button onClick={() => { navigate('/profile'); setDropdownOpen(false); }}>
                <FiSettings size={14} /> Settings
              </button>
              <hr />
              <button className="logout-btn" onClick={logout}>
                <FiLogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
