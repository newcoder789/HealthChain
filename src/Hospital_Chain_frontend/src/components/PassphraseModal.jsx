import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const PassphraseModal = ({ open, onClose, onSubmit, title = 'Enter Passphrase' }) => {
  const [passphrase, setPassphrase] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-6 rounded-2xl border border-white/20 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded"><X className="h-5 w-5 text-gray-300" /></button>
        </div>
        <p className="text-gray-300 text-sm mb-3">Enter the passphrase you used when storing the private key locally.</p>
        <input type="password" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} placeholder="Passphrase" className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white mb-3" />
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded">Cancel</button>
          <button onClick={() => onSubmit(passphrase)} className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded">Submit</button>
        </div>
      </motion.div>
    </div>
  );
};

export default PassphraseModal;
