import { motion } from 'framer-motion';
import { Stethoscope, Clock, FileText, Users, Shield, Search, Bell, TrendingUp } from 'lucide-react';
import RoleDiagram from '../components/RoleDiagram';
import FeatureCard from '../components/FeatureCard';
import { Link } from 'react-router-dom';

const Doctor = () => {
  const beforeItems = [
    "Fragmented patient records across systems",
    "Time-consuming record requests and transfers",
    "Incomplete medical histories during consultations",
    "Risk of missing critical patient information",
    "Administrative burden of record management"
  ];

  const afterItems = [
    "Unified view of complete patient medical history",
    "Instant access to shared patient records",
    "Real-time notifications for record updates",
    "Comprehensive audit trail for compliance",
    "Streamlined workflow with intelligent organization"
  ];

  const doctorFeatures = [
    {
      icon: FileText,
      title: "Unified Patient View",
      description: "Access complete patient medical history from multiple sources in one secure dashboard.",
      color: "primary"
    },
    {
      icon: Search,
      title: "Intelligent Search",
      description: "Quickly find specific information across all patient records with advanced search capabilities.",
      color: "secondary"
    },
    {
      icon: Bell,
      title: "Real-time Updates",
      description: "Get notified when patients share new records or grant access to their medical data.",
      color: "accent"
    },
    {
      icon: TrendingUp,
      title: "Analytics Dashboard",
      description: "View patient trends, treatment outcomes, and population health insights.",
      color: "neon"
    }
  ];

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full glass-card border border-secondary-400/30 mb-8">
            <Stethoscope className="h-4 w-4 text-secondary-400 mr-2" />
            <span className="text-sm text-secondary-300 font-medium">Doctor Portal</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-white">Enhanced</span>
            <br />
            <span className="gradient-text">Patient Care</span>
          </h1>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Access comprehensive patient medical histories instantly. With patient-controlled sharing, 
            you get the complete picture while respecting privacy and maintaining trust.
          </p>

          <Link
            to="/dashboard/doctor"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-secondary-500 to-primary-500 text-white font-semibold rounded-xl hover:from-secondary-600 hover:to-primary-600 transform hover:scale-105 transition-all duration-200 neon-glow"
          >
            Access Doctor Dashboard
          </Link>
        </motion.div>

        {/* Problem vs Solution */}
        <RoleDiagram 
          role="doctor"
          beforeItems={beforeItems}
          afterItems={afterItems}
          centerIcon={Stethoscope}
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
            <h2 className="text-4xl font-bold gradient-text mb-6">Doctor Features</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Powerful tools designed to enhance patient care and streamline your workflow
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {doctorFeatures.map((feature, index) => (
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

        {/* Doctor Workflow */}
        <section className="py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold gradient-text mb-6">Your Enhanced Workflow</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From patient visit to treatment planning - see how HealthChain transforms your practice
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
              <div className="w-12 h-12 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-xl flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">1. Patient Check-in</h3>
              <p className="text-gray-300">
                Instantly access shared patient records as they check in, ensuring you have the complete medical picture.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="glass-card p-6 rounded-xl border border-white/20"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">2. Review History</h3>
              <p className="text-gray-300">
                Quickly review comprehensive medical history, previous treatments, and test results in one unified view.
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
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">3. Document & Share</h3>
              <p className="text-gray-300">
                Add consultation notes and recommendations, with automatic audit logging for compliance and transparency.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Clinical Benefits */}
        <section className="py-20 bg-gradient-to-r from-secondary-500/10 via-primary-500/10 to-secondary-500/10 rounded-3xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text mb-6">Clinical Benefits</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Real improvements to patient care and practice efficiency
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="glass-card p-6 rounded-xl border border-white/20 text-center"
            >
              <Clock className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <div className="text-2xl font-bold text-secondary-400 mb-2">75%</div>
              <p className="text-gray-300">Less time on record requests</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="glass-card p-6 rounded-xl border border-white/20 text-center"
            >
              <FileText className="h-12 w-12 text-primary-400 mx-auto mb-4" />
              <div className="text-2xl font-bold text-primary-400 mb-2">100%</div>
              <p className="text-gray-300">Complete medical histories</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="glass-card p-6 rounded-xl border border-white/20 text-center"
            >
              <Shield className="h-12 w-12 text-accent-400 mx-auto mb-4" />
              <div className="text-2xl font-bold text-accent-400 mb-2">24/7</div>
              <p className="text-gray-300">Secure access availability</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="glass-card p-6 rounded-xl border border-white/20 text-center"
            >
              <TrendingUp className="h-12 w-12 text-neon-400 mx-auto mb-4" />
              <div className="text-2xl font-bold text-neon-400 mb-2">50%</div>
              <p className="text-gray-300">Better diagnostic accuracy</p>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass-card p-12 rounded-2xl border border-secondary-400/30 text-center"
          >
            <h2 className="text-3xl font-bold text-white mb-6">Transform Your Practice Today</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join healthcare providers who are already delivering better patient care with HealthChain.
            </p>
            <Link
              to="/demo"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-secondary-500 to-primary-500 text-white font-semibold rounded-xl hover:from-secondary-600 hover:to-primary-600 transform hover:scale-105 transition-all duration-200 neon-glow"
            >
              Experience the Demo
            </Link>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default Doctor;