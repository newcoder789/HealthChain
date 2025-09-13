import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-8xl font-bold gradient-text mb-8">404</div>
          
          <h1 className="text-4xl font-bold text-white mb-6">Page Not Found</h1>
          
          <p className="text-xl text-gray-300 mb-8">
            The page you're looking for doesn't exist in the HealthChain ecosystem. 
            Let's get you back to exploring the future of healthcare data management.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-secondary-600 transform hover:scale-105 transition-all duration-200 neon-glow"
            >
              <Home className="h-5 w-5 mr-2" />
              Go Home
            </Link>
            
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center px-8 py-4 glass-card border border-primary-400/50 text-primary-400 font-semibold rounded-xl hover:bg-primary-400/10 transform hover:scale-105 transition-all duration-200"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Go Back
            </button>
          </div>

          {/* Animated Background Elements */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-secondary-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;