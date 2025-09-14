import { X, Info, CheckCircle } from "lucide-react";
import { motion } from 'framer-motion';

export const Toast = ({ message, type, onClose }) => {
    const bgColor = type === 'success' ? 'bg-emerald-500' : 'bg-rose-500';
    const Icon = type === 'success' ? CheckCircle : X;

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.5 }}
            className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-xl text-white ${bgColor} flex items-center space-x-2`}
            role="alert"
        >
            <Icon size={20} />
            <span>{message}</span>
            <button onClick={onClose} className="ml-4">
                <X size={16} />
            </button>
        </motion.div>
    );
};
