import { motion } from 'framer-motion';
import { User, Upload, Share2, Shield, Eye, FileText, Activity, Search, Bell, Clock, Eye as EyeIcon, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import RoleDiagram from '../components/RoleDiagram';
import FeatureCard from '../components/FeatureCard';

const Patient = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, userRole, login, registerUser } = useAuth();

  const handleAccess = async () => {
    setLoading(true);
    try {
      if (!isAuthenticated) {
        await login();
      } else if (userRole === 'None') {
        await registerUser('Patient');
        await actor.get_profile().then((profile) => console.log(profile))
        navigate("/dashboard/patient");
      } else {
        navigate("/dashboard/patient");
      }
    } catch (err) {
      console.error("Error accessing patient dashboard:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const beforeItems = [
    "Medical records scattered across multiple providers",
    "No control over who accesses your data",
    "Difficulty getting copies of your own records",
    "Limited transparency in data usage",
    "Risk of data breaches at healthcare facilities"
  ];

  const afterItems = [
    "All records in one secure, personal vault",
    "Complete control over sharing permissions",
    "Instant access to your medical history",
    "Full audit trail of all data interactions",
    "Military-grade encryption protects your privacy"
  ];

  const patientFeatures = [
    {
      icon: Upload,
      title: "Easy Record Upload",
      description: "Securely upload medical documents, test results, and images with automatic encryption.",
      color: "primary"
    },
    {
      icon: Share2,
      title: "Granular Sharing",
      description: "Choose exactly what to share with each healthcare provider and for how long.",
      color: "secondary"
    },
    {
      icon: Eye,
      title: "Access Monitoring",
      description: "See exactly who accessed your records, when, and what they viewed.",
      color: "accent"
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your data is encrypted and only accessible with your explicit permission.",
      color: "neon"
    }
  ];

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        { isAuthenticated? <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full glass-card border border-primary-400/30 mb-8">
            <User className="h-4 w-4 text-primary-400 mr-2" />
            <span className="text-sm text-primary-300 font-medium">Patient Portal</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Your Health Data,</span>
            <br />
            <span className="text-white">Your Control</span>
          </h1>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Take complete ownership of your medical records. Upload, organize, and share your health data
            with healthcare providers on your terms, with full transparency and security.
          </p>
          <button
            onClick={handleAccess}
            disabled={loading}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-secondary-600 transform hover:scale-105 transition-all duration-200 neon-glow"
          >
            {loading ? "Preparing your dashboard..." : "Access Patient Dashboard"}
          </button>
        </motion.div> : <div className='text-center mb-16 text-red-300'> User not registered yet </div>}

        {/* Problem vs Solution */}
        <RoleDiagram
          role="patient"
          beforeItems={beforeItems}
          afterItems={afterItems}
          centerIcon={User}
        />

        {/* Features */}
        <section className="py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold gradient-text mb-6">Patient Features</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Everything you need to manage your health data with confidence and control
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {patientFeatures.map((feature, index) => (
              <FeatureCard
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                color={feature.color}
                delay={index * 0.1}
              />
            ))}
          </div>
        </section>

        {/* Patient Journey */}
        <section className="py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold gradient-text mb-6">Your Patient Journey</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From setup to sharing - here's how HealthChain transforms your healthcare experience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="glass-card p-6 rounded-xl border border-white/20"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">1. Upload Records</h3>
              <p className="text-gray-300">
                Securely upload your existing medical records, test results, and documentation to your personal vault.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="glass-card p-6 rounded-xl border border-white/20"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-xl flex items-center justify-center mb-4">
                <Share2 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">2. Share Selectively</h3>
              <p className="text-gray-300">
                Choose exactly what to share with each healthcare provider, with time-limited access controls.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="glass-card p-6 rounded-xl border border-white/20"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-accent-400 to-accent-600 rounded-xl flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">3. Monitor Access</h3>
              <p className="text-gray-300">
                Track all interactions with your data through comprehensive audit logs and real-time notifications.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Statistics */}
        <section className="py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass-card p-12 rounded-2xl border border-primary-400/30 text-center"
          >
            <h2 className="text-3xl font-bold text-white mb-8">Patient Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="text-4xl font-bold text-primary-400 mb-2">100%</div>
                <p className="text-gray-300">Data Ownership</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-secondary-400 mb-2">24/7</div>
                <p className="text-gray-300">Record Access</p>
              </div>
              <div>
                <div className="text-4xl font-bold text-accent-400 mb-2">0</div>
                <p className="text-gray-300">Data Breaches</p>
              </div>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default Patient;
