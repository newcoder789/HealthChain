import { motion } from 'framer-motion';
import { Github, Twitter, Globe, Award } from 'lucide-react';

const Footer = () => {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="glass-card border-t border-white/10 mt-20"
    >
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-xl font-bold gradient-text mb-4">HealthChain</h3>
            <p className="text-gray-300 mb-4">
              Decentralized medical records system built on the Internet Computer Protocol. 
              Empowering patients, doctors, and researchers with secure, transparent healthcare data.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-primary-400 transition-colors duration-200">
                <Github className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-300 hover:text-primary-400 transition-colors duration-200">
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-gray-300 hover:text-primary-400 transition-colors duration-200">
                <Globe className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Built With</h3>
            <ul className="space-y-2 text-gray-300">
              <li>Internet Computer</li>
              <li>Rust</li>
              <li>React</li>
              <li>IPFS/Pinata</li>
              <li>Internet Identity</li>
            </ul>
          </div>

          {/* Hackathon */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2 text-neon-400" />
              WCHL25
            </h3>
            <p className="text-gray-300 text-sm">
              Built for the Web3 Chain Health League 2025 hackathon. 
              Showcasing the future of decentralized healthcare.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-300 text-sm">
              © 2025 HealthChain. Built for educational and hackathon purposes.
            </p>
            <p className="text-gray-300 text-sm mt-2 md:mt-0">
              Powered by Internet Computer Protocol
            </p>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;