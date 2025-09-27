import React from 'react';
import { useDemo } from '../utils/DemoContext';

export const Protect = ({ level = 'red', label, children }) => {
  const { overlayEnabled } = useDemo();
  const color = level === 'red' ? 'ring-2 ring-red-500' : level === 'yellow' ? 'ring-2 ring-yellow-400' : 'ring-2 ring-green-500';
  return (
    <div className={overlayEnabled ? `${color} relative` : ''}>
      {overlayEnabled && (
        <div className="absolute -top-2 -right-2 text-xs bg-black/70 text-white px-2 py-0.5 rounded">{label || level.toUpperCase()}</div>
      )}
      {children}
    </div>
  );
};

const DeveloperOverlayBanner = () => {
  const { overlayEnabled, demoMode } = useDemo();
  if (!overlayEnabled) return null;
  return (
    <div className="fixed bottom-3 right-3 bg-red-600 text-white text-sm px-3 py-2 rounded shadow-lg z-50">
      Developer Overlay ON — Ctrl+H to toggle — Demo mode: {demoMode ? 'ON' : 'OFF'}
    </div>
  );
};

export default DeveloperOverlayBanner;


