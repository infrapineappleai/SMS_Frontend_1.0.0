// ✅ Sidebar.js (clean, with NavLink active class support)
import React from 'react';
import { NavLink } from 'react-router-dom';
import '../Styles/Sidebar.css';

import Logo from '../assets/images/Aradana-logo.png';
import DashboardIcon from '../assets/icons/Dashboard.png';
import StudentIcon from '../assets/icons/Students.png';
import CourseIcon from '../assets/icons/Course.png';
import PaymentIcon from '../assets/icons/Payment.png';
import ExamIcon from '../assets/icons/Exam.png';
import ReportIcon from '../assets/icons/Report.png';
//import SettingsIcon from '../assets/icons/Settings.png';
import LogoutIcon from '../assets/icons/Logout.png';
import ScheduleIcon from '../assets/icons/Schedule.png';

const menuItems = [
  { name: 'Dashboard', icon: DashboardIcon, key: 'dashboard', path: '/dashboard' },
  { name: 'Users', icon: StudentIcon, key: 'students', path: '/students' },
  { name: 'Course', icon: CourseIcon, key: 'course', path: '/course' },
  { name: 'Payment', icon: PaymentIcon, key: 'payment', path: '/payments' },
  { name: 'Schedule', icon: ScheduleIcon, key: 'schedule', path: '/schedule' },
  { name: 'Exam', icon: ExamIcon, key: 'exam', path: '/exam' },
  { name: 'Report', icon: ReportIcon, key: 'report', path: '/report' },
  //{ name: 'Settings', icon: SettingsIcon, key: 'settings', path: '/settings' },
  { name: 'Logout', icon: LogoutIcon, key: 'logout', path: '/logout' },
];

const Sidebar = ({ onClose }) => {
  return (
    <div className="sidebar">
      {onClose && (
        <button className="sidebar-close-btn" onClick={onClose}>
          ✕
        </button>
      )}
      <div className="sidebar-logo">
        <img src={Logo} alt="Logo" className="logo-img" />
      </div>
      <div className="menu-list">
        {menuItems.map((item) => (
          <NavLink
            to={item.path}
            key={item.key}
            className={({ isActive }) =>
              `menu-item ${isActive ? 'active' : ''}`
            }
            onClick={onClose}
          >
            <img src={item.icon} alt={item.name} className={`Sidebar-icon ${item.key}-icon`} />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
