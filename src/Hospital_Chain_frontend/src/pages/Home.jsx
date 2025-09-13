import { motion } from 'framer-motion';
import Hero from '../components/Hero';
import FeatureCard from '../components/FeatureCard';
import Timeline from '../components/Timeline';
import { Shield, Users, Activity, Database, Lock, Zap, Globe, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';
const Home = () => {
  const features = [
    {
      icon: Shield,
      title: "Patient-Controlled Data",
      description: "Complete ownership and control over your medical records with granular sharing permissions.",
      color: "primary"
    },
    {
      icon: Users,
      title: "Multi-Role Access",
      description: "Seamless integration for patients, doctors, and researchers with role-based permissions.",
      color: "secondary"
    },
    {
      icon: Activity,
      title: "Complete Transparency",
      description: "Full audit trail of all interactions with your data, ensuring trust and accountability.",
      color: "accent"
    },
    {
      icon: Database,
      title: "Decentralized Storage",
      description: "Your data is stored on a distributed network, eliminating single points of failure.",
      color: "neon"
    },
    {
      icon: Lock,
      title: "Military-Grade Security",
      description: "Advanced encryption and Internet Identity ensure your data remains private and secure.",
      color: "primary"
    },
    {
      icon: Zap,
      title: "Instant Access",
      description: "Real-time access to your records from anywhere in the world, when you need them most.",
      color: "secondary"
    }
  ];

  const techStack = [
    { name: "Internet Computer", icon: Globe, description: "Decentralized cloud platform" },
    { name: "Rust", icon: Cpu, description: "High-performance backend" },
    { name: "React", icon: Activity, description: "Modern frontend framework" },
    { name: "IPFS/Pinata", icon: Database, description: "Distributed file storage" },
  ];

  return (
    <div className="pt-16">
      <Hero />
      
      {/* Problem Statement */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-6">The Healthcare Data Crisis</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              <div className="glass-card p-6 rounded-xl border border-red-500/30 bg-red-500/5">
                <div className="text-3xl font-bold text-red-400 mb-2">73%</div>
                <p className="text-gray-300">of patients can't access their own medical records easily</p>
              </div>
              <div className="glass-card p-6 rounded-xl border border-red-500/30 bg-red-500/5">
                <div className="text-3xl font-bold text-red-400 mb-2">$31B</div>
                <p className="text-gray-300">lost annually due to medical data breaches</p>
              </div>
              <div className="glass-card p-6 rounded-xl border border-red-500/30 bg-red-500/5">
                <div className="text-3xl font-bold text-red-400 mb-2">89%</div>
                <p className="text-gray-300">of healthcare organizations experienced data breaches</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-20 bg-gradient-to-r from-primary-500/10 via-secondary-500/10 to-primary-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold gradient-text mb-6">Our Solution</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              HealthChain revolutionizes healthcare data management with blockchain technology, 
              giving patients complete control while enabling seamless, secure sharing.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
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
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold gradient-text mb-6">Built on Cutting-Edge Technology</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Powered by the Internet Computer Protocol and modern web technologies
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {techStack.map((tech, index) => (
              <motion.div
                key={tech.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass-card p-6 rounded-xl border border-white/20 text-center hover:border-primary-400/50 transition-all duration-300"
              >
                <tech.icon className="h-12 w-12 text-primary-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">{tech.name}</h3>
                <p className="text-gray-400 text-sm">{tech.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Timeline />

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass-card p-12 rounded-2xl border border-primary-400/30 text-center"
          >
            <h2 className="text-4xl font-bold gradient-text mb-6">Ready to Experience the Future?</h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join the healthcare revolution and see how HealthChain transforms medical data management.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/demo"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-xl hover:from-primary-600 hover:to-secondary-600 transform hover:scale-105 transition-all duration-200 neon-glow"
              >
                Launch Interactive Demo
              </Link>
              <Link
                to="/patient"
                className="inline-flex items-center px-8 py-4 glass-card border border-primary-400/50 text-primary-400 font-semibold rounded-xl hover:bg-primary-400/10 transform hover:scale-105 transition-all duration-200"
              >
                Explore Features
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;