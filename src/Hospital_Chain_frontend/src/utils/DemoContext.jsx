import React, { createContext, useContext, useEffect, useState } from 'react';

const DemoContext = createContext();

export const DemoProvider = ({ children }) => {
  const [demoMode, setDemoMode] = useState(true);
  const [overlayEnabled, setOverlayEnabled] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && (e.key === 'h' || e.key === 'H')) {
        setOverlayEnabled(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <DemoContext.Provider value={{ demoMode, setDemoMode, overlayEnabled, setOverlayEnabled }}>
      {children}
    </DemoContext.Provider>
  );
};

export const useDemo = () => useContext(DemoContext);


