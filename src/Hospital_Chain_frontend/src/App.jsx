import { Hospital_Chain_backend } from 'declarations/Hospital_Chain_backend';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Patient from './pages/Patient';
import Doctor from './pages/Doctor';
import Researcher from './pages/Researcher';
import Demo from './pages/Demo';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import ResearcherDashboard from './pages/ResearcherDashboard';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import './index.scss';
import AdminPortal from './pages/AdminPortal';
import DeveloperOverlayBanner from './components/DeveloperOverlay';
import JudgeTour from './components/JudgeTour';
import { DemoProvider } from './utils/DemoContext';
import { useAuth } from './utils/AuthContext';
import React, { useEffect } from 'react';

// New component to handle routing logic and hooks
function AppRouter() {
  const { isAuthenticated, userRole, registerUser, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // useEffect(() => {
  //   if (isAuthReady && isAuthenticated && userRole === null) {
  //     const pathSegments = location.pathname.split('/');
  //     const roleFromPath = pathSegments[2];

  //     if (roleFromPath) {
  //       const roleToRegister = roleFromPath.charAt(0).toUpperCase() + roleFromPath.slice(1);
  //       registerUser(roleToRegister);
  //     } else {
  //       navigate('/');
  //     }
  //   }
  // }, [isAuthReady, isAuthenticated, userRole, location.pathname, navigate, registerUser]);

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/patient" element={<Patient />} />
        <Route path="/doctor" element={<Doctor />} />
        <Route path="/researcher" element={<Researcher />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/dashboard/patient" element={<PatientDashboard />} />
        <Route path="/dashboard/doctor" element={<DoctorDashboard />} />
        <Route path="/dashboard/researcher" element={<ResearcherDashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin" element={<AdminPortal />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer />
    </>
  );
}

function App() {
  return (
    <Router>
      <DemoProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
          <AppRouter />
          <DeveloperOverlayBanner />
          <JudgeTour />
        </div>
      </DemoProvider>
    </Router>
  );
}

export default App;
