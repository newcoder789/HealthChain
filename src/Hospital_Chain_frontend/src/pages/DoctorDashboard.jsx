import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, Users, FileText, Activity, Search, Bell, Clock, Eye, TrendingUp, BadgeCheck, Upload, Plus, X, Calendar, MessageSquare, Shield, Download, Share2, Edit3, Trash2, UserPlus, Target, AlertCircle, CheckCircle } from 'lucide-react';
import AuditLogTable from '../components/AuditLogTable';
import { useAuth } from '../utils/AuthContext';
import { useDemo } from '../utils/DemoContext';
import { Protect } from '../components/DeveloperOverlay';

const DoctorDashboard = () => {
  const [activeTab, setActiveTab] = useState('patients');
  const { actor } = useAuth();
  const { demoMode } = useDemo();
  const [verification, setVerification] = useState({ status: 'pending' });
  const [searchName, setSearchName] = useState('');
  const [patientResult, setPatientResult] = useState(null);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [busy, setBusy] = useState(false);
  
  // Modal states
  const [showPatientSearchModal, setShowPatientSearchModal] = useState(false);
  const [showRecordAccessModal, setShowRecordAccessModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showPatientDetailsModal, setShowPatientDetailsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // Form states
  const [patientSearchForm, setPatientSearchForm] = useState({
    name: '',
    email: '',
    patientId: '',
    searchType: 'name'
  });
  
  const [appointmentForm, setAppointmentForm] = useState({
    patientId: '',
    patientName: '',
    date: '',
    time: '',
    type: '',
    notes: '',
    duration: 30
  });
  
  const [verificationForm, setVerificationForm] = useState({
    licenseNumber: '',
    institution: '',
    specialty: '',
    experience: '',
    evidence: null
  });

  useEffect(() => {
    // fetch profile badge if available
    (async () => {
      try {
        const prof = await actor.get_profile();
        if (prof && prof.doctor_badge) setVerification({ status: 'approved', ...prof.doctor_badge });
      } catch (e) {}
    })();
  }, [actor]);

  // Modal handlers
  const handleSearchPatient = () => {
    setShowPatientSearchModal(true);
  };

  const handleViewPatient = (patient) => {
    setSelectedPatient(patient);
    setShowPatientDetailsModal(true);
  };

  const handleAccessRecords = (patient) => {
    setSelectedPatient(patient);
    setShowRecordAccessModal(true);
  };

  const handleScheduleAppointment = (patient = null) => {
    if (patient) {
      setAppointmentForm(prev => ({
        ...prev,
        patientId: patient.id,
        patientName: patient.name
      }));
    }
    setShowAppointmentModal(true);
  };

  const handleVerification = () => {
    setShowVerificationModal(true);
  };

  const handleSubmitPatientSearch = async () => {
    setBusy(true);
    try {
      // Simulate patient search
      const searchResult = {
        id: Date.now(),
        name: patientSearchForm.name || 'John Doe',
        email: patientSearchForm.email || 'john@example.com',
        age: 45,
        lastVisit: '2025-01-10',
        condition: 'Hypertension',
        status: 'stable',
        recordsCount: 5
      };
      
      setPatientResult(searchResult);
      setShowPatientSearchModal(false);
    } catch (error) {
      console.error('Error searching patient:', error);
      alert('Failed to search patient. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitAppointment = async () => {
    setBusy(true);
    try {
      // Simulate appointment scheduling
      alert(`Appointment scheduled for ${appointmentForm.patientName} on ${appointmentForm.date} at ${appointmentForm.time}`);
      
      setAppointmentForm({
        patientId: '',
        patientName: '',
        date: '',
        time: '',
        type: '',
        notes: '',
        duration: 30
      });
      setShowAppointmentModal(false);
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      alert('Failed to schedule appointment. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitVerification = async () => {
    setBusy(true);
    try {
      if (!verificationForm.evidence) {
        alert('Please upload verification evidence');
        return;
      }
      
      // Simulate verification submission
      await actor.request_doctor_verification('demo_evidence_cid');
      setVerification({ status: 'pending' });
      alert('Verification evidence submitted successfully!');
      setShowVerificationModal(false);
    } catch (error) {
      console.error('Error submitting verification:', error);
      alert('Failed to submit verification. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const mockPatients = [
    {
      id: 1,
      name: 'John Doe',
      age: 45,
      lastVisit: '2025-01-10',
      recordsShared: 5,
      condition: 'Hypertension',
      status: 'stable'
    },
    {
      id: 2,
      name: 'Jane Smith',
      age: 32,
      lastVisit: '2025-01-08',
      recordsShared: 3,
      condition: 'Diabetes Type 2',
      status: 'monitoring'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      age: 67,
      lastVisit: '2025-01-05',
      recordsShared: 8,
      condition: 'Post-Surgery Recovery',
      status: 'improving'
    }
  ];

  const mockRecentActivity = [
    {
      patient: 'John Doe',
      action: 'Shared blood test results',
      time: '2 hours ago',
      type: 'share'
    },
    {
      patient: 'Jane Smith',
      action: 'Updated medication list',
      time: '4 hours ago', 
      type: 'update'
    },
    {
      patient: 'Mike Johnson',
      action: 'Scheduled follow-up appointment',
      time: '1 day ago',
      type: 'appointment'
    }
  ];

  const tabs = [
    { id: 'patients', name: 'My Patients', icon: Users },
    { id: 'records', name: 'Shared Records', icon: FileText },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp },
    { id: 'audit', name: 'Audit Log', icon: Clock }
  ];

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold gradient-text mb-4">Doctor Dashboard</h1>
          <p className="text-xl text-gray-300">Access patient records and manage healthcare data</p>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <BadgeCheck className={`h-5 w-5 ${verification.status==='approved' ? 'text-emerald-400' : 'text-yellow-400'}`} />
            <span>{verification.status==='approved' ? 'Verified Doctor' : 'Verification pending'}</span>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-6 rounded-xl border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Patients</p>
                <p className="text-2xl font-bold text-white">{mockPatients.length}</p>
              </div>
              <Users className="h-8 w-8 text-secondary-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card p-6 rounded-xl border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Records Accessed</p>
                <p className="text-2xl font-bold text-white">23</p>
              </div>
              <FileText className="h-8 w-8 text-primary-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-card p-6 rounded-xl border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Today's Appointments</p>
                <p className="text-2xl font-bold text-white">8</p>
              </div>
              <Activity className="h-8 w-8 text-accent-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-card p-6 rounded-xl border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Notifications</p>
                <p className="text-2xl font-bold text-white">5</p>
              </div>
              <Bell className="h-8 w-8 text-neon-400" />
            </div>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-white/10 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-secondary-400 text-secondary-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {activeTab === 'patients' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Patient List</h2>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleSearchPatient}
                    className="inline-flex items-center px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition-colors duration-200"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Search Patient
                  </button>
                  <button
                    onClick={() => handleScheduleAppointment()}
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Appointment
                  </button>
                </div>
              </div>

              {patientResult && (
                <div className="glass-card p-4 rounded-xl border border-white/20 mb-4 flex items-center justify-between">
                  <div className="text-white text-sm">Found: {searchName}</div>
                  <Protect level="green" label="Access request (demo)">
                    <button onClick={()=> alert('Access request sent (demo)')} className="px-3 py-1 bg-indigo-600 text-white rounded">Request Access</button>
                  </Protect>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {mockPatients.map((patient, index) => (
                  <motion.div
                    key={patient.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="glass-card p-6 rounded-xl border border-white/20 hover:border-white/30 transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{patient.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>Age: {patient.age}</span>
                            <span>•</span>
                            <span>Last visit: {patient.lastVisit}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="text-sm font-medium text-white">{patient.condition}</p>
                            <p className="text-xs text-gray-400">{patient.recordsShared} records shared</p>
                          </div>
                          <div className={`px-3 py-1 text-xs rounded-full ${
                            patient.status === 'stable' ? 'bg-accent-500/20 text-accent-400' :
                            patient.status === 'monitoring' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-primary-500/20 text-primary-400'
                          }`}>
                            {patient.status}
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleViewPatient(patient)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
                              title="View Patient Details"
                            >
                            <Eye className="h-4 w-4 text-gray-400" />
                          </button>
                            <button 
                              onClick={() => handleAccessRecords(patient)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
                              title="Access Records"
                            >
                              <FileText className="h-4 w-4 text-gray-400" />
                            </button>
                            <button 
                              onClick={() => handleScheduleAppointment(patient)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
                              title="Schedule Appointment"
                            >
                              <Calendar className="h-4 w-4 text-gray-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'records' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Recently Accessed Records</h2>
                <p className="text-gray-400">Patient records that have been shared with you</p>
              </div>

              <div className="space-y-4">
                {mockPatients.map((patient, index) => (
                  <motion.div
                    key={patient.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="glass-card p-6 rounded-xl border border-white/20"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">{patient.name}'s Records</h3>
                      <span className="text-sm text-gray-400">{patient.recordsShared} records available</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-800/50 p-4 rounded-lg">
                        <FileText className="h-6 w-6 text-primary-400 mb-2" />
                        <p className="text-sm font-medium text-white">Lab Results</p>
                        <p className="text-xs text-gray-400">Latest: Jan 10, 2025</p>
                      </div>
                      <div className="bg-gray-800/50 p-4 rounded-lg">
                        <Activity className="h-6 w-6 text-secondary-400 mb-2" />
                        <p className="text-sm font-medium text-white">Vital Signs</p>
                        <p className="text-xs text-gray-400">Latest: Jan 8, 2025</p>
                      </div>
                      <div className="bg-gray-800/50 p-4 rounded-lg select-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 10px, transparent 10px, transparent 20px)' }}>
                        <Stethoscope className="h-6 w-6 text-accent-400 mb-2" />
                        <p className="text-sm font-medium text-white">Clinical Notes</p>
                        <p className="text-xs text-gray-400">Latest: Jan 5, 2025</p>
                        <div className="mt-2 text-[10px] text-gray-500 italic">Watermark: Dr. Sarah Smith | {new Date().toLocaleString()}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Practice Analytics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div className="glass-card p-6 rounded-xl border border-white/20">
                  <h3 className="text-lg font-semibold text-white mb-4">Patient Outcomes</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Stable Conditions</span>
                      <span className="text-accent-400 font-semibold">78%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Improving</span>
                      <span className="text-primary-400 font-semibold">15%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Needs Attention</span>
                      <span className="text-yellow-400 font-semibold">7%</span>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-xl border border-white/20">
                  <h3 className="text-lg font-semibold text-white mb-4">Record Access Trends</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">This Week</span>
                      <span className="text-secondary-400 font-semibold">45 accesses</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Last Week</span>
                      <span className="text-gray-400 font-semibold">38 accesses</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Growth</span>
                      <span className="text-accent-400 font-semibold">+18%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-xl border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {mockRecentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-4 py-2">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'share' ? 'bg-primary-400' :
                        activity.type === 'update' ? 'bg-secondary-400' : 'bg-accent-400'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-white">{activity.patient} {activity.action}</p>
                        <p className="text-gray-400 text-sm">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Audit Log</h2>
                <p className="text-gray-400">Track all interactions with patient records for compliance</p>
              </div>
              <AuditLogTable />
            </div>
          )}
          {activeTab === 'analytics' && (
            <div className="glass-card p-6 rounded-xl border border-white/20 mb-8">
              <h3 className="text-lg font-semibold text-white mb-4">Doctor Verification</h3>
              <div className="flex items-center gap-3 mb-3 text-sm text-gray-300">
                <BadgeCheck className={`h-5 w-5 ${verification.status==='approved' ? 'text-emerald-400' : 'text-yellow-400'}`} />
                <span>{verification.status==='approved' ? 'Verified' : 'Not verified'}</span>
              </div>
              <Protect level="green" label="Verification (demo)">
                <button 
                  onClick={handleVerification}
                  className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                >
                  <Upload className="h-4 w-4 mr-2"/>
                  {verification.status === 'approved' ? 'Update Verification' : 'Submit Verification'}
                </button>
              </Protect>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Patient Search Modal */}
        {showPatientSearchModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 rounded-2xl border border-white/20 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Search Patient</h3>
                <button
                  onClick={() => setShowPatientSearchModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200"
                >
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Search Type</label>
                  <select
                    value={patientSearchForm.searchType}
                    onChange={(e) => setPatientSearchForm(prev => ({ ...prev, searchType: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-secondary-400"
                  >
                    <option value="name">Search by Name</option>
                    <option value="email">Search by Email</option>
                    <option value="id">Search by Patient ID</option>
                  </select>
                </div>

                {patientSearchForm.searchType === 'name' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Patient Name</label>
                    <input
                      type="text"
                      value={patientSearchForm.name}
                      onChange={(e) => setPatientSearchForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-secondary-400"
                      placeholder="Enter patient name"
                    />
                  </div>
                )}

                {patientSearchForm.searchType === 'email' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={patientSearchForm.email}
                      onChange={(e) => setPatientSearchForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-secondary-400"
                      placeholder="Enter email address"
                    />
                  </div>
                )}

                {patientSearchForm.searchType === 'id' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Patient ID</label>
                    <input
                      type="text"
                      value={patientSearchForm.patientId}
                      onChange={(e) => setPatientSearchForm(prev => ({ ...prev, patientId: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-secondary-400"
                      placeholder="Enter patient ID"
                    />
                  </div>
                )}
              </div>

              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => setShowPatientSearchModal(false)}
                  className="flex-1 px-6 py-3 glass-card border border-gray-600 text-gray-300 font-semibold rounded-lg hover:bg-gray-800/50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitPatientSearch}
                  disabled={busy}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-secondary-500 to-primary-500 text-white font-semibold rounded-lg hover:from-secondary-600 hover:to-primary-600 transition-all duration-200 disabled:opacity-50"
                >
                  {busy ? 'Searching...' : 'Search Patient'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Patient Details Modal */}
        {showPatientDetailsModal && selectedPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 rounded-2xl border border-white/20 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">{selectedPatient.name}</h3>
                <button
                  onClick={() => setShowPatientDetailsModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200"
                >
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Patient Information</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400">Name</label>
                      <p className="text-white">{selectedPatient.name}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Age</label>
                      <p className="text-white">{selectedPatient.age} years</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Last Visit</label>
                      <p className="text-white">{selectedPatient.lastVisit}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Condition</label>
                      <p className="text-white">{selectedPatient.condition}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Status</label>
                      <span className={`px-3 py-1 text-xs rounded-full ${
                        selectedPatient.status === 'stable' 
                          ? 'bg-accent-500/20 text-accent-400' 
                          : selectedPatient.status === 'monitoring'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-primary-500/20 text-primary-400'
                      }`}>
                        {selectedPatient.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Medical Records</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400">Records Shared</label>
                      <p className="text-white">{selectedPatient.recordsShared || 0} records</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Access Level</label>
                      <p className="text-white">Full Access</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Last Updated</label>
                      <p className="text-white">{selectedPatient.lastVisit}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex space-x-4">
                <button
                  onClick={() => setShowPatientDetailsModal(false)}
                  className="flex-1 px-6 py-3 glass-card border border-gray-600 text-gray-300 font-semibold rounded-lg hover:bg-gray-800/50 transition-all duration-200"
                >
                  Close
                </button>
                <button 
                  onClick={() => handleAccessRecords(selectedPatient)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-secondary-500 to-primary-500 text-white font-semibold rounded-lg hover:from-secondary-600 hover:to-primary-600 transition-all duration-200"
                >
                  Access Records
                </button>
                <button 
                  onClick={() => handleScheduleAppointment(selectedPatient)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-accent-500 to-primary-500 text-white font-semibold rounded-lg hover:from-accent-600 hover:to-primary-600 transition-all duration-200"
                >
                  Schedule Appointment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Record Access Modal */}
        {showRecordAccessModal && selectedPatient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 rounded-2xl border border-white/20 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Access Patient Records - {selectedPatient.name}</h3>
                <button
                  onClick={() => setShowRecordAccessModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200"
                >
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-gray-800/50 rounded-lg">
                  <h4 className="text-lg font-semibold text-white mb-2">Available Records</h4>
                  <p className="text-gray-300 text-sm">{selectedPatient.recordsShared || 0} records available for access</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <FileText className="h-6 w-6 text-primary-400 mb-2" />
                    <p className="text-sm font-medium text-white">Lab Results</p>
                    <p className="text-xs text-gray-400">Latest: Jan 10, 2025</p>
                    <button className="mt-2 px-3 py-1 bg-primary-600 text-white rounded text-xs hover:bg-primary-700 transition-colors duration-200">
                      View
                    </button>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <Activity className="h-6 w-6 text-secondary-400 mb-2" />
                    <p className="text-sm font-medium text-white">Vital Signs</p>
                    <p className="text-xs text-gray-400">Latest: Jan 8, 2025</p>
                    <button className="mt-2 px-3 py-1 bg-secondary-600 text-white rounded text-xs hover:bg-secondary-700 transition-colors duration-200">
                      View
                    </button>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <Stethoscope className="h-6 w-6 text-accent-400 mb-2" />
                    <p className="text-sm font-medium text-white">Clinical Notes</p>
                    <p className="text-xs text-gray-400">Latest: Jan 5, 2025</p>
                    <button className="mt-2 px-3 py-1 bg-accent-600 text-white rounded text-xs hover:bg-accent-700 transition-colors duration-200">
                      View
                    </button>
                  </div>
                  <div className="bg-gray-800/50 p-4 rounded-lg">
                    <Shield className="h-6 w-6 text-neon-400 mb-2" />
                    <p className="text-sm font-medium text-white">Imaging</p>
                    <p className="text-xs text-gray-400">Latest: Jan 3, 2025</p>
                    <button className="mt-2 px-3 py-1 bg-neon-600 text-white rounded text-xs hover:bg-neon-700 transition-colors duration-200">
                      View
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => setShowRecordAccessModal(false)}
                  className="flex-1 px-6 py-3 glass-card border border-gray-600 text-gray-300 font-semibold rounded-lg hover:bg-gray-800/50 transition-all duration-200"
                >
                  Close
                </button>
                <button className="flex-1 px-6 py-3 bg-gradient-to-r from-secondary-500 to-primary-500 text-white font-semibold rounded-lg hover:from-secondary-600 hover:to-primary-600 transition-all duration-200">
                  Request Full Access
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Appointment Scheduling Modal */}
        {showAppointmentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 rounded-2xl border border-white/20 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Schedule Appointment</h3>
                <button
                  onClick={() => setShowAppointmentModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200"
                >
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Patient Name</label>
                    <input
                      type="text"
                      value={appointmentForm.patientName}
                      onChange={(e) => setAppointmentForm(prev => ({ ...prev, patientName: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                      placeholder="Enter patient name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Appointment Type</label>
                    <select
                      value={appointmentForm.type}
                      onChange={(e) => setAppointmentForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                    >
                      <option value="">Select type</option>
                      <option value="consultation">Consultation</option>
                      <option value="follow-up">Follow-up</option>
                      <option value="emergency">Emergency</option>
                      <option value="routine">Routine Check-up</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                    <input
                      type="date"
                      value={appointmentForm.date}
                      onChange={(e) => setAppointmentForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
                    <input
                      type="time"
                      value={appointmentForm.time}
                      onChange={(e) => setAppointmentForm(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Duration (minutes)</label>
                    <select
                      value={appointmentForm.duration}
                      onChange={(e) => setAppointmentForm(prev => ({ ...prev, duration: Number(e.target.value) }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                    >
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                      <option value={90}>90 minutes</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
                  <textarea
                    value={appointmentForm.notes}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400 h-24"
                    placeholder="Add any notes about the appointment"
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => setShowAppointmentModal(false)}
                  className="flex-1 px-6 py-3 glass-card border border-gray-600 text-gray-300 font-semibold rounded-lg hover:bg-gray-800/50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAppointment}
                  disabled={busy || !appointmentForm.patientName || !appointmentForm.date || !appointmentForm.time}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 disabled:opacity-50"
                >
                  {busy ? 'Scheduling...' : 'Schedule Appointment'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Doctor Verification Modal */}
        {showVerificationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-8 rounded-2xl border border-white/20 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Doctor Verification</h3>
                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200"
                >
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Shield className="h-5 w-5 text-blue-400" />
                    <h4 className="text-lg font-semibold text-blue-300">Verification Requirements</h4>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Please provide the following information to verify your medical credentials and gain access to patient records.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Medical License Number</label>
                    <input
                      type="text"
                      value={verificationForm.licenseNumber}
                      onChange={(e) => setVerificationForm(prev => ({ ...prev, licenseNumber: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                      placeholder="Enter license number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Institution</label>
                    <input
                      type="text"
                      value={verificationForm.institution}
                      onChange={(e) => setVerificationForm(prev => ({ ...prev, institution: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                      placeholder="Hospital or clinic name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Specialty</label>
                    <select
                      value={verificationForm.specialty}
                      onChange={(e) => setVerificationForm(prev => ({ ...prev, specialty: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                    >
                      <option value="">Select specialty</option>
                      <option value="cardiology">Cardiology</option>
                      <option value="neurology">Neurology</option>
                      <option value="oncology">Oncology</option>
                      <option value="pediatrics">Pediatrics</option>
                      <option value="surgery">Surgery</option>
                      <option value="internal-medicine">Internal Medicine</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Years of Experience</label>
                    <input
                      type="number"
                      value={verificationForm.experience}
                      onChange={(e) => setVerificationForm(prev => ({ ...prev, experience: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                      placeholder="Years"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Verification Evidence</label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300 mb-2">Upload medical license or certification</p>
                    <p className="text-gray-500 text-sm">Supports PDF, JPG, PNG files up to 10MB</p>
                    <input
                      type="file"
                      onChange={(e) => setVerificationForm(prev => ({ ...prev, evidence: e.target.files?.[0] }))}
                      className="mt-4 text-sm text-gray-300"
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => setShowVerificationModal(false)}
                  className="flex-1 px-6 py-3 glass-card border border-gray-600 text-gray-300 font-semibold rounded-lg hover:bg-gray-800/50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitVerification}
                  disabled={busy || !verificationForm.licenseNumber || !verificationForm.evidence}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 disabled:opacity-50"
                >
                  {busy ? 'Submitting...' : 'Submit Verification'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DoctorDashboard;