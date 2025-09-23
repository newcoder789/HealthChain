import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, Shield, Cpu } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from "../utils/AuthContext";


const Button = ({ onClick, children }) => <button onClick={onClick}>{children}</button>;


const Navbar = () => {
  const { isAuthenticated, authClient, principal, login, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Patient', path: '/dashboard/patient' },
    { name: 'Doctor', path: '/dashboard/doctor' },
    { name: 'Researcher', path: '/dashboard/researcher' },
    { name: 'Demo', path: '/demo' },
  ];

  const authLinks = [
    { name: 'Profile', path: '/profile' },
  ];

  const isActive = (path) => location.pathname === path;
  
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 w-full z-50 glass-card border-b border-white/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="relative">
              <Shield className="h-8 w-8 text-primary-400" />
              <Cpu className="h-4 w-4 text-neon-400 absolute -top-1 -right-1" />
            </div>
            <span className="text-xl font-bold gradient-text">HealthChain</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive(link.path)
                      ? 'text-primary-400 bg-primary-400/10'
                      : 'text-gray-300 hover:text-primary-400 hover:bg-primary-400/5'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              {isAuthenticated && authLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive(link.path)
                      ? 'text-secondary-400 bg-secondary-400/10'
                      : 'text-gray-300 hover:text-secondary-400 hover:bg-secondary-400/5'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <Button onClick={login} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200">
                Login with Internet Identity
              </Button>
            ) : (
              <div className="flex items-center space-x-4">
                {authClient && (
                  <div className="hidden lg:block text-sm text-gray-300">
                    <div className="text-xs text-gray-400">Principal ID:</div>
                    <div className="font-mono text-xs">{principal?.slice(0, 8)}...</div>
                  </div>
                )}
                <Button onClick={logout} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200">
                  Logout
                </Button>
              </div>
            )}
          </div>
              

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-primary-400 transition-colors duration-200"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="md:hidden glass-card border-t border-white/10"
        >
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? 'text-primary-400 bg-primary-400/10'
                    : 'text-gray-300 hover:text-primary-400 hover:bg-primary-400/5'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            {isAuthenticated && authLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`block px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? 'text-secondary-400 bg-secondary-400/10'
                    : 'text-gray-300 hover:text-secondary-400 hover:bg-secondary-400/5'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;