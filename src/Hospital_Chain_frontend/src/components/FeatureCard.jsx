import { motion } from 'framer-motion';

const FeatureCard = ({ icon: Icon, title, description, color = 'primary', delay = 0 }) => {
  const colorClasses = {
    primary: 'from-primary-400 to-primary-600 shadow-primary-500/25',
    secondary: 'from-secondary-400 to-secondary-600 shadow-secondary-500/25',
    accent: 'from-accent-400 to-accent-600 shadow-accent-500/25',
    neon: 'from-neon-400 to-neon-600 shadow-neon-400/25',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="glass-card p-6 rounded-xl border border-white/20 hover:border-white/30 transition-all duration-300 group"
    >
      <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color]} rounded-xl flex items-center justify-center mb-4 group-hover:shadow-lg transition-all duration-300`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-300 leading-relaxed">{description}</p>
    </motion.div>
  );
};

export default FeatureCard;