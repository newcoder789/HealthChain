import { motion } from 'framer-motion';
import { Microscope, Database, BarChart3, Users, Shield, Brain, Globe, Zap } from 'lucide-react';
import RoleDiagram from '../components/RoleDiagram';
import FeatureCard from '../components/FeatureCard';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../utils/AuthContext';

const Researcher = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, userRole, login, registerUser, actor } = useAuth();

  const handleAccess = async () => {
    setLoading(true);
    try {
      if (!isAuthenticated) {
        await login();
      } else if (userRole === 'None') {
        await registerUser('Researcher');
        navigate("/dashboard/researcher");
      } else {
        navigate("/dashboard/researcher");
      }
    } catch (err) {
      console.error("Error accessing researcher dashboard:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  const beforeItems = [
    "Limited access to diverse medical datasets",
    "Complex approval processes and delays",
    "Privacy concerns limiting data sharing",
    "Fragmented data across institutions",
    "High costs for accessing quality data"
  ];

  const afterItems = [
    "Access to anonymized global health datasets",
    "Streamlined consent-based data access",
    "Privacy-preserving research capabilities",
    "Unified, interoperable data standards",
    "Transparent, cost-effective data marketplace"
  ];

  const researcherFeatures = [
    {
      icon: Database,
      title: "Anonymized Datasets",
      description: "Access large-scale, anonymized medical datasets while preserving patient privacy through advanced techniques.",
      color: "primary"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Built-in tools for statistical analysis, machine learning, and population health insights.",
      color: "secondary"
    },
    {
      icon: Shield,
      title: "Privacy-First Research",
      description: "Conduct research with differential privacy and secure multi-party computation protocols.",
      color: "accent"
    },
    {
      icon: Globe,
      title: "Global Collaboration",
      description: "Connect with researchers worldwide and access international health data repositories.",
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
          <div className="inline-flex items-center px-4 py-2 rounded-full glass-card border border-accent-400/30 mb-8">
            <Microscope className="h-4 w-4 text-accent-400 mr-2" />
            <span className="text-sm text-accent-300 font-medium">Research Portal</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="text-white">Accelerate</span>
            <br />
            <span className="gradient-text">Medical Research</span>
          </h1>

          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Access anonymized, high-quality medical datasets from a global network of patients and healthcare providers. 
            Conduct groundbreaking research while maintaining the highest privacy standards.
          </p>

          <button
            onClick={handleAccess}
            disabled={loading}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-accent-500 to-primary-500 text-white font-semibold rounded-xl hover:from-accent-600 hover:to-primary-600 transform hover:scale-105 transition-all duration-200 neon-glow disabled:opacity-50"
          >
            {loading ? "Preparing your dashboard..." : "Access Research Portal"}
          </button>
        </motion.div>

        {/* Problem vs Solution */}
        <RoleDiagram 
          role="researcher"
          beforeItems={beforeItems}
          afterItems={afterItems}
          centerIcon={Microscope}
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
            <h2 className="text-4xl font-bold gradient-text mb-6">Research Features</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Powerful tools and datasets to accelerate medical discoveries and improve global health outcomes
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {researcherFeatures.map((feature, index) => (
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

        {/* Research Process */}
        <section className="py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold gradient-text mb-6">Your Research Journey</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From hypothesis to discovery - streamlined access to quality medical data
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="glass-card p-6 rounded-xl border border-white/20 text-center"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-accent-400 to-accent-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">1. Define Research</h3>
              <p className="text-gray-300 text-sm">
                Specify your research parameters, target demographics, and required data types.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="glass-card p-6 rounded-xl border border-white/20 text-center"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Database className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">2. Access Data</h3>
              <p className="text-gray-300 text-sm">
                Get secure access to anonymized datasets matching your research criteria.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="glass-card p-6 rounded-xl border border-white/20 text-center"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">3. Analyze & Discover</h3>
              <p className="text-gray-300 text-sm">
                Use advanced analytics tools to uncover insights and validate hypotheses.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="glass-card p-6 rounded-xl border border-white/20 text-center"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-neon-400 to-neon-600 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-3">4. Share Results</h3>
              <p className="text-gray-300 text-sm">
                Publish findings and contribute back to the global research community.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Research Impact */}
        <section className="py-20 bg-gradient-to-r from-accent-500/10 via-primary-500/10 to-accent-500/10 rounded-3xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold gradient-text mb-6">Research Impact</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Enabling breakthrough discoveries through democratized access to quality health data
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
              <Database className="h-12 w-12 text-accent-400 mx-auto mb-4" />
              <div className="text-2xl font-bold text-accent-400 mb-2">10M+</div>
              <p className="text-gray-300">Anonymized records available</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="glass-card p-6 rounded-xl border border-white/20 text-center"
            >
              <Users className="h-12 w-12 text-primary-400 mx-auto mb-4" />
              <div className="text-2xl font-bold text-primary-400 mb-2">500+</div>
              <p className="text-gray-300">Active researchers</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
              className="glass-card p-6 rounded-xl border border-white/20 text-center"
            >
              <BarChart3 className="h-12 w-12 text-secondary-400 mx-auto mb-4" />
              <div className="text-2xl font-bold text-secondary-400 mb-2">50+</div>
              <p className="text-gray-300">Countries represented</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="glass-card p-6 rounded-xl border border-white/20 text-center"
            >
              <Zap className="h-12 w-12 text-neon-400 mx-auto mb-4" />
              <div className="text-2xl font-bold text-neon-400 mb-2">90%</div>
              <p className="text-gray-300">Faster research timelines</p>
            </motion.div>
          </div>
        </section>

        {/* Privacy & Ethics */}
        <section className="py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass-card p-12 rounded-2xl border border-accent-400/30"
          >
            <div className="text-center mb-8">
              <Shield className="h-16 w-16 text-accent-400 mx-auto mb-4" />
              <h2 className="text-3xl font-bold gradient-text mb-4">Privacy & Ethics First</h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                All research is conducted with the highest ethical standards and privacy protections
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <h3 className="text-lg font-bold text-white mb-3">Differential Privacy</h3>
                <p className="text-gray-300">
                  Mathematical guarantees that individual privacy is protected in all analyses.
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-white mb-3">Consent-Based</h3>
                <p className="text-gray-300">
                  All data use is based on explicit patient consent for research purposes.
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-white mb-3">Transparent Audit</h3>
                <p className="text-gray-300">
                  Full audit trail of data access and usage for accountability and compliance.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-white mb-6">Join the Research Revolution</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Access the world's largest, most diverse collection of anonymized medical data for your research.
            </p>
            <Link
              to="/demo"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-accent-500 to-primary-500 text-white font-semibold rounded-xl hover:from-accent-600 hover:to-primary-600 transform hover:scale-105 transition-all duration-200 neon-glow"
            >
              Start Researching Today
            </Link>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default Researcher;