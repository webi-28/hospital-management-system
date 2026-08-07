import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiHome, FiUsers, FiUserCheck, FiCalendar, FiFileText,
  FiDollarSign, FiBarChart2, FiClock, FiBook, FiChevronLeft,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const navConfig = {
  admin: [
    { label: 'Dashboard',    path: '/admin',               icon: <FiHome /> },
    { label: 'Doctors',      path: '/admin/doctors',        icon: <FiUserCheck /> },
    { label: 'Patients',     path: '/admin/patients',       icon: <FiUsers /> },
    { label: 'Appointments', path: '/admin/appointments',   icon: <FiCalendar /> },
    { label: 'Billing',      path: '/admin/billing',        icon: <FiDollarSign /> },
    { label: 'Reports',      path: '/admin/reports',        icon: <FiBarChart2 /> },
  ],
  doctor: [
    { label: 'Dashboard',    path: '/doctor',               icon: <FiHome /> },
    { label: 'Appointments', path: '/doctor/appointments',  icon: <FiCalendar /> },
    { label: 'Patients',     path: '/doctor/patients',      icon: <FiUsers /> },
    { label: 'Records',      path: '/doctor/records',       icon: <FiFileText /> },
    { label: 'Schedule',     path: '/doctor/schedule',      icon: <FiClock /> },
  ],
  patient: [
    { label: 'Dashboard',    path: '/patient',              icon: <FiHome /> },
    { label: 'Book',         path: '/patient/book',         icon: <FiCalendar /> },
    { label: 'Appointments', path: '/patient/appointments', icon: <FiClock /> },
    { label: 'Records',      path: '/patient/records',      icon: <FiFileText /> },
    { label: 'Prescriptions',path: '/patient/prescriptions',icon: <FiBook /> },
    { label: 'Bills',        path: '/patient/bills',        icon: <FiDollarSign /> },
  ],
};

const Sidebar = ({ isOpen, onToggle }) => {
  const { user } = useAuth();
  const items = navConfig[user?.role] || [];

  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <button className="sidebar-toggle" onClick={onToggle} aria-label="Collapse sidebar">
        <FiChevronLeft className={`toggle-icon ${!isOpen ? 'rotated' : ''}`} />
      </button>

      <nav className="sidebar-nav">
        {items.map(({ label, path, icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === `/${user?.role}`}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-icon">{icon}</span>
            {isOpen && <span className="sidebar-label">{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
