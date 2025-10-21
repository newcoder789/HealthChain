import { motion } from 'framer-motion';
import { ArrowRight, Shield, Users, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => { 
  return (
    <div className="relative overflow-hidden bg-gray-50 text-gray-800">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-100 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-100 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-accent-100 rounded-full blur-2xl animate-float"></div>
      </div> 

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <div className="text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 border border-primary-200 mb-8"
          > 
            <Shield className="h-4 w-4 text-primary-600 mr-2" />
            <span className="text-sm text-primary-700 font-medium">WCHL25 Hackathon Project</span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight"
          >
            <span className="text-primary-600">Decentralized</span>
            <br />
            <span>Medical Records</span>
            <br />
            <span className="text-secondary-500">On-Chain</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
          >
            Empowering patients with complete ownership of their health data while enabling 
            seamless, secure sharing with healthcare providers and researchers.
          </motion.p>

          {/* Key Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="flex flex-wrap justify-center gap-8 mb-12"
          >
            <div className="flex items-center space-x-2 text-primary-600">
              <Shield className="h-6 w-6" />
              <span className="font-semibold">100% Patient Control</span>
            </div>
            <div className="flex items-center space-x-2 text-secondary-600">
              <Users className="h-6 w-6" />
              <span className="font-semibold">Multi-Role Access</span>
            </div>
            <div className="flex items-center space-x-2 text-accent-600">
              <Activity  className="h-6 w-6" />
              <span className="font-semibold">Full Transparency</span>
            </div>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/demo"
              className="inline-flex items-center px-8 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
              >
              Launch Demo
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/patient"
              className="inline-flex items-center px-8 py-4 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 hover:border-gray-400 transform hover:scale-105 transition-all duration-200 shadow-md"
              >
              Learn More
            </Link>
          </motion.div>
        </div>

        {/* 3D Visual Elements */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-16 relative">
          <div className="flex justify-center space-x-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl rotate-12 animate-float shadow-2xl shadow-primary-500/50"></div>
            <div className="w-20 h-20 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-2xl -rotate-12 animate-float delay-1000 shadow-2xl shadow-secondary-500/50"></div>
            <div className="w-12 h-12 bg-gradient-to-br from-neon-400 to-accent-500 rounded-2xl rotate-45 animate-float delay-2000 shadow-2xl shadow-neon-400/50"></div>
          </div>
        </motion.div>
      </div>
    </div>
  ); 
};

export default Hero;