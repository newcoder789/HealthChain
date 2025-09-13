import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, Shield, Cpu } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { canisterId } from 'declarations/Hospital_Chain_backend/index.js';
import { createActor} from 'declarations/Hospital_Chain_backend';

const network = process.env.DFX_NETWORK;
const identityProvider =
  network === 'ic'
    ? 'https://identity.ic0.app' // Mainnet
    : 'http://uzt4z-lp777-77774-qaabq-cai.localhost:4943'; // Local

// Reusable button component
const Button = ({ onClick, children }) => <button onClick={onClick}>{children}</button>;


const Navbar = () => {
  const [state, setState] = useState({
    actor: undefined,
    authClient: undefined,
    isAuthenticated: false,
    principal: 'Click "Whoami" to see your principal ID'
  });

  // Initialize auth client
  useEffect(() => {
    updateActor();
  }, []);

  const updateActor = async () => {
    
    const authClient = await AuthClient.create();
    const identity = authClient.getIdentity();
    console.log('User principal:',
       identity.getPrincipal().toString());

    const actor = createActor(canisterId, {
      agentOptions: {
        identity
      }
    });
    const isAuthenticated = await authClient.isAuthenticated();

    setState((prev) => ({
      ...prev,
      actor,
      authClient,
      isAuthenticated
    }));
  };

  const login = async () => {
    await state.authClient.login({
      identityProvider,
      onSuccess: updateActor
    })
  };

  const logout = async () => {
    await state.authClient.logout();
    updateActor();
  };

  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Patient', path: '/patient' },
    { name: 'Doctor', path: '/doctor' },
    { name: 'Researcher', path: '/researcher' },
    { name: 'Demo', path: '/demo' },
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
          {!state.isAuthenticated ? (
            <Button onClick={login}>Login with Internet Identity</Button>
          ) : (
            <Button onClick={logout}>Logout</Button>
          )}
          {state.principal && (
            <div>
              <h2>Your principal ID is:</h2>
              <h4>{state.principal}</h4>
            </div>
          )}
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
            </div>
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
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;