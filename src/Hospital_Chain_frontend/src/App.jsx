import { Hospital_Chain_backend } from 'declarations/Hospital_Chain_backend';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import NotFound from './pages/NotFound';
import './index.scss';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
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
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;