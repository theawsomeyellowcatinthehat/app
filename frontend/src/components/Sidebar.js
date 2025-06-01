import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ isOpen, toggleSidebar, currentUser }) => {
  const location = useLocation();

  const navItems = [
    {
      path: '/dashboard',
      name: 'Dashboard',
      icon: (
        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v1H8V5z" />
        </svg>
      )
    },
    {
      path: '/cases',
      name: 'Cases',
      icon: (
        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      path: '/clients',
      name: 'Clients',
      icon: (
        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    },
    {
      path: '/court-dates',
      name: 'Court Dates',
      icon: (
        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    {
      path: '/users',
      name: 'Users',
      icon: (
        <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className={`${isOpen ? 'block' : 'hidden'}`}>
            <h1 className="text-xl font-bold text-gray-900">Court Organizer</h1>
            <p className="text-sm text-gray-500">Legal Case Management</p>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
          >
            <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${
              location.pathname === item.path ? 'nav-item-active' : 'nav-item-inactive'
            }`}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className={`ml-3 ${isOpen ? 'block' : 'hidden'}`}>
              {item.name}
            </span>
          </Link>
        ))}
      </nav>

      {/* User Info */}
      {currentUser && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className={`flex items-center ${isOpen ? 'justify-start' : 'justify-center'}`}>
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {currentUser.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className={`ml-3 ${isOpen ? 'block' : 'hidden'}`}>
              <p className="text-sm font-medium text-gray-900">{currentUser.name}</p>
              <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
