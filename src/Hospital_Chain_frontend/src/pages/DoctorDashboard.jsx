import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Stethoscope, Users, FileText, Activity, Search, Bell, Clock, Eye, TrendingUp, BadgeCheck, Upload } from 'lucide-react';
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

  useEffect(() => {
    // fetch profile badge if available
    (async () => {
      try {
        const prof = await actor.get_profile();
        if (prof && prof.doctor_badge) setVerification({ status: 'approved', ...prof.doctor_badge });
      } catch (e) {}
    })();
  }, [actor]);

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
                  <div className="relative">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search patients..."
                      value={searchName}
                      onChange={(e)=>setSearchName(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-secondary-400"
                    />
                  </div>
                  <Protect level="green" label="Search (mock ok)">
                    <button onClick={async ()=>{
                      setBusy(true);
                      try { const res = await actor.get_principal_by_name(searchName); setPatientResult(res); } catch(e) { setPatientResult(null);} finally { setBusy(false); }
                    }} disabled={busy || !searchName} className="px-4 py-2 bg-secondary-600 text-white rounded disabled:opacity-50">{busy ? 'Searching...' : 'Lookup'}</button>
                  </Protect>
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
                          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200">
                            <Eye className="h-4 w-4 text-gray-400" />
                          </button>
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
                <div className="flex items-center gap-3">
                  <input type="file" onChange={(e)=>setEvidenceFile(e.target.files?.[0])} className="text-sm" />
                  <button onClick={async ()=>{
                    if (!evidenceFile) return alert('Please select a file');
                    setBusy(true);
                    try {
                      if (!demoMode) {
                        await actor.request_doctor_verification('demo_evidence_cid');
                      }
                      setVerification({ status: 'pending' });
                      alert('Verification evidence submitted (demo)');
                    } finally { setBusy(false); }
                  }} disabled={busy} className="inline-flex items-center px-3 py-1 bg-indigo-600 text-white rounded disabled:opacity-50"><Upload className="h-4 w-4 mr-1"/>{busy ? 'Submitting...' : 'Submit Evidence'}</button>
                </div>
              </Protect>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DoctorDashboard;