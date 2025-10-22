import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Send, X } from 'lucide-react';

export const RegistrationModal = ({ role, onRegister, onCancel, loading }) => {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (name.trim()) {
      console.log("registration model", name)
      onRegister(name);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="glass-card p-8 rounded-2xl border border-white/20 max-w-md w-full mx-4"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Register as a {role}</h3>
          <button onClick={onCancel} className="p-2 hover:bg-gray-800 rounded-lg">
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-300">Please enter your full name to complete the registration.</p>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary-400"
                placeholder="e.g., Dr. John Smith"
              />
            </div>
          </div>
        </div>

        <div className="flex space-x-4 mt-8">
          <button onClick={onCancel} className="flex-1 px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || loading}
            className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg disabled:opacity-50 hover:from-blue-500 hover:to-indigo-600 transition-all"
          >
            {loading ? 'Registering...' : 'Complete Registration'}
            {!loading && <Send className="h-4 w-4 ml-2" />}
          </button>
        </div>
      </motion.div>
    </div>
  );
};