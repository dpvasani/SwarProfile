import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Bars3Icon, 
  XMarkIcon, 
  UserCircleIcon,
  HomeIcon,
  PhotoIcon,
  CogIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { name: 'Home', path: '/', icon: HomeIcon },
    { name: 'Artists', path: '/artists', icon: PhotoIcon },
  ];

  if (isAdmin) {
    navLinks.push(
      { name: 'Admin Dashboard', path: '/admin', icon: CogIcon },
      { name: 'Upload Document', path: '/upload', icon: PhotoIcon }
    );
  }

  return (
    <nav className="w-full glass-effect sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-18">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg floating-element overflow-hidden">
                <img src="/SwarProfile.png" alt="Swar Profile" className="w-full h-full object-cover" />
              </div>
              <span className="text-2xl font-bold gradient-text">Swar Profile</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                    isActive(link.path)
                      ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg'
                      : 'text-dark-700 hover:text-primary-600 hover:bg-white/60 hover:shadow-md'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {/* If this is the admin dashboard link, show Admin pill instead of long text */}
                  {link.path === '/admin' ? (
                    <span className="px-2 py-1 bg-gradient-to-r from-[#7e22ce] to-[#7e22ce] text-white text-xs rounded-full font-semibold shadow-md">Admin</span>
                  ) : (
                    <span>{link.name}</span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3 px-4 py-2 glass-effect rounded-xl">
                  <UserCircleIcon className="w-6 h-6 text-primary-600" />
                  <span className="font-medium text-dark-700">
                    {user?.fullName}
                  </span>
                  {isAdmin && (
                    <span className="px-3 py-1 bg-gradient-to-r from-[#7e22ce] to-[#7e22ce] text-white text-xs rounded-full font-semibold shadow-md">
                      Admin
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-4 py-2 font-medium text-dark-600 hover:text-red-500 hover:bg-red-50/80 rounded-xl transition-all duration-300 hover:shadow-md"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="btn-secondary"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn-primary"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-secondary-600 hover:text-secondary-900 focus:outline-none focus:text-secondary-900 transition duration-150 ease-in-out"
            >
              {isOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-secondary-100">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-base font-medium transition-all duration-200 ${
                    isActive(link.path)
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-secondary-600 hover:text-primary-600 hover:bg-primary-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.path === '/admin' ? (
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full font-medium">Admin</span>
                  ) : (
                    <span>{link.name}</span>
                  )}
                </Link>
              );
            })}
          </div>
          
          {/* Mobile User Menu */}
          <div className="pt-4 pb-3 border-t border-secondary-200">
            {isAuthenticated ? (
              <div className="px-2 space-y-1">
                <div className="flex items-center px-3 py-2">
                  <UserCircleIcon className="w-8 h-8 text-secondary-400" />
                  <div className="ml-3">
                    <div className="text-base font-medium text-secondary-800">
                      {user?.fullName}
                    </div>
                    <div className="text-sm text-secondary-500">{user?.email}</div>
                  </div>
                  {isAdmin && (
                    <span className="ml-auto px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full font-medium">
                      Admin
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 w-full px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                >
                  <ArrowRightOnRectangleIcon className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="px-2 space-y-1">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center btn-secondary"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center btn-primary"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;