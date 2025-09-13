import { motion } from 'framer-motion';
import { Check, Clock, Star } from 'lucide-react';

const Timeline = () => {
  const phases = [
    {
      phase: "MVP 1",
      title: "Core Infrastructure",
      status: "completed",
      features: [
        "Internet Identity Integration",
        "Basic Record Storage",
        "Patient Dashboard",
        "Simple Sharing"
      ]
    },
    {
      phase: "MVP 2",
      title: "Multi-Role System",
      status: "current",
      features: [
        "Doctor Dashboard",
        "Researcher Portal",
        "Advanced Sharing Controls",
        "Audit Logging"
      ]
    },
    {
      phase: "Advanced",
      title: "AI & Analytics",
      status: "planned",
      features: [
        "AI-Powered Insights",
        "Predictive Analytics",
        "Smart Anonymization",
        "Research Marketplace"
      ]
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <Check className="h-5 w-5 text-accent-500" />;
      case 'current':
        return <Clock className="h-5 w-5 text-primary-500" />;
      default:
        return <Star className="h-5 w-5 text-secondary-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'border-accent-500 bg-accent-500/10';
      case 'current':
        return 'border-primary-500 bg-primary-500/10 animate-pulse-glow';
      default:
        return 'border-secondary-500 bg-secondary-500/10';
    }
  };

  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold gradient-text mb-6">Development Timeline</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Our roadmap from MVP to a comprehensive decentralized healthcare ecosystem
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {phases.map((phase, index) => (
            <motion.div
              key={phase.phase}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              className={`glass-card p-6 rounded-xl border-2 ${getStatusColor(phase.status)} relative`}
            >
              {/* Status indicator */}
              <div className="absolute -top-3 left-6">
                <div className={`flex items-center justify-center w-6 h-6 rounded-full ${getStatusColor(phase.status)}`}>
                  {getStatusIcon(phase.status)}
                </div>
              </div>

              <div className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-primary-400 uppercase tracking-wider">
                    {phase.phase}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    phase.status === 'completed' ? 'bg-accent-500/20 text-accent-400' :
                    phase.status === 'current' ? 'bg-primary-500/20 text-primary-400' :
                    'bg-secondary-500/20 text-secondary-400'
                  }`}>
                    {phase.status}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-4">{phase.title}</h3>

                <ul className="space-y-2">
                  {phase.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-300">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        phase.status === 'completed' ? 'bg-accent-500' :
                        phase.status === 'current' ? 'bg-primary-500' :
                        'bg-secondary-500'
                      }`}></div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Timeline;