import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Shield, Users, Activity, Moon, Sun } from 'lucide-react';
import { Link } from 'react-router-dom';

const Demo = () => {
  const [darkMode, setDarkMode] = useState(true);

  const roles = [
    {
      name: 'Patient',
      icon: Users,
      color: 'primary',
      path: '/dashboard/patient',
      description: 'Own and control your medical records',
      features: ['Upload records', 'Share with doctors', 'Monitor access', 'Privacy controls']
    },
    {
      name: 'Doctor',
      icon: Activity,
      color: 'secondary', 
      path: '/dashboard/doctor',
      description: 'Access patient records with consent',
      features: ['View shared records', 'Patient insights', 'Treatment history', 'Audit compliance']
    },
    {
      name: 'Researcher',
      icon: Shield,
      color: 'accent',
      path: '/dashboard/researcher', 
      description: 'Analyze anonymized datasets',
      features: ['Access datasets', 'Privacy-preserved analytics', 'Global collaboration', 'Research insights']
    }
  ];

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full glass-card border border-primary-400/30 mb-8">
            <Play className="h-4 w-4 text-primary-400 mr-2" />
            <span className="text-sm text-primary-300 font-medium">Interactive Demo</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-white">Welcome to</span>
            <br />
            <span className="gradient-text">HealthChain dApp</span>
          </h1>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Experience the future of healthcare data management. Choose your role to explore 
            how HealthChain transforms medical records through decentralization.
          </p>

          {/* Theme Toggle removed for demo stability */}
        </motion.div>

        {/* Role Selection */}
        <section className="mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-white mb-4">Choose Your Role</h2>
            <p className="text-lg text-gray-300">
              Select a role to experience HealthChain from different perspectives
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {roles.map((role, index) => (
              <motion.div
                key={role.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="glass-card p-8 rounded-xl border border-white/20 hover:border-white/40 transition-all duration-300 group"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${
                  role.color === 'primary' ? 'from-primary-400 to-primary-600' :
                  role.color === 'secondary' ? 'from-secondary-400 to-secondary-600' :
                  'from-accent-400 to-accent-600'
                } rounded-xl flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                  <role.icon className="h-8 w-8 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-3 text-center">{role.name}</h3>
                <p className="text-gray-300 mb-6 text-center">{role.description}</p>

                <ul className="space-y-2 mb-8">
                  {role.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-300">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        role.color === 'primary' ? 'bg-primary-400' :
                        role.color === 'secondary' ? 'bg-secondary-400' :
                        'bg-accent-400'
                      }`}></div>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to={role.path}
                  className={`block w-full text-center px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    role.color === 'primary' 
                      ? 'bg-primary-500 hover:bg-primary-600 text-white' :
                    role.color === 'secondary'
                      ? 'bg-secondary-500 hover:bg-secondary-600 text-white' :
                      'bg-accent-500 hover:bg-accent-600 text-white'
                  } transform hover:scale-105`}
                >
                  Enter {role.name} Dashboard
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Demo;