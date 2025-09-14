import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import './index.scss';
import { AuthProvider } from '../../utils/AuthContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);
