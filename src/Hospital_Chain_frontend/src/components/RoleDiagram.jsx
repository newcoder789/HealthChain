import { motion } from 'framer-motion';

const RoleDiagram = ({ role, beforeItems, afterItems, centerIcon: CenterIcon }) => {
  return (
    <div className="py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-6xl mx-auto"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
          {/* Before */}
          <div className="glass-card p-6 rounded-xl border border-red-500/30 bg-red-500/5">
            <h3 className="text-xl font-bold text-red-400 mb-4 text-center">Current Problems</h3>
            <ul className="space-y-3">
              {beforeItems.map((item, index) => (
                <li key={index} className="flex items-start text-gray-300">
                  <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Center Icon */}
          <div className="flex justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 bg-gradient-to-br from-primary-400 to-secondary-500 rounded-full flex items-center justify-center shadow-2xl shadow-primary-500/50"
            >
              <CenterIcon className="h-10 w-10 text-white" />
            </motion.div>
          </div>

          {/* After */}
          <div className="glass-card p-6 rounded-xl border border-accent-500/30 bg-accent-500/5">
            <h3 className="text-xl font-bold text-accent-400 mb-4 text-center">HealthChain Solution</h3>
            <ul className="space-y-3">
              {afterItems.map((item, index) => (
                <li key={index} className="flex items-start text-gray-300">
                  <span className="w-2 h-2 bg-accent-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default RoleDiagram;