import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const PrivateKeyModal = ({ open, onClose, onImportResolve, defaultStore = false }) => {
  const [pem, setPem] = useState('');
  const [storeLocally, setStoreLocally] = useState(defaultStore);
  const [passphrase, setPassphrase] = useState('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-6 rounded-2xl border border-white/20 max-w-xl w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Import Private PEM</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded"><X className="h-5 w-5 text-gray-300" /></button>
        </div>

        <p className="text-gray-300 text-sm mb-3">Paste your PKCS#8 PEM private key below. This key will only be used locally to unwrap AES keys for shared records.</p>

        <textarea value={pem} onChange={(e) => setPem(e.target.value)} rows={8} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white mb-3" placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----" />

        <label className="flex items-center space-x-3 mb-2">
          <input type="checkbox" checked={storeLocally} onChange={(e) => setStoreLocally(e.target.checked)} className="w-4 h-4" />
          <span className="text-gray-300 text-sm">Store encrypted locally (optional)</span>
        </label>

        {storeLocally && (
          <div className="mb-3">
            <label className="block text-xs text-gray-400 mb-1">Passphrase (used to encrypt the key locally)</label>
            <input type="password" value={passphrase} onChange={(e) => setPassphrase(e.target.value)} placeholder="Enter a passphrase" className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white" />
            <p className="text-xs text-gray-500 mt-1">Remember this passphrase to retrieve your private key later.</p>
          </div>
        )}

        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-700 text-white rounded">Cancel</button>
          <button
            onClick={() => {
              onImportResolve && onImportResolve({ pem, storeLocally, passphrase });
              onClose && onClose();
            }}
            disabled={!pem.trim()}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded disabled:opacity-50"
          >
            Import
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default PrivateKeyModal;
