import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Share2, Eye, Plus, Download, Clock, Shield, Users, Search } from 'lucide-react';
import AuditLogTable from '../components/AuditLogTable';

const PatientDashboard = () => {
  const [activeTab, setActiveTab] = useState('records');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const mockRecords = [
    {
      id: 1,
      name: 'Blood Test Results - January 2025',
      type: 'Lab Report',
      date: '2025-01-10',
      size: '2.4 MB',
      sharedWith: ['Dr. Smith', 'Dr. Johnson'],
      status: 'shared'
    },
    {
      id: 2,
      name: 'Chest X-Ray - December 2024',
      type: 'Imaging',
      date: '2024-12-15',
      size: '15.7 MB',
      sharedWith: ['Dr. Smith'],
      status: 'private'
    },
    {
      id: 3,
      name: 'Annual Physical Exam',
      type: 'Clinical Notes',
      date: '2024-11-20',
      size: '1.2 MB',
      sharedWith: [],
      status: 'private'
    }
  ];

  const mockSharedAccess = [
    {
      doctor: 'Dr. Sarah Smith',
      specialty: 'Cardiology',
      accessLevel: 'Full Access',
      expiry: '2025-06-10',
      recordsShared: 5
    },
    {
      doctor: 'Dr. Mike Johnson', 
      specialty: 'Internal Medicine',
      accessLevel: 'Limited Access',
      expiry: '2025-03-15',
      recordsShared: 2
    }
  ];

  const tabs = [
    { id: 'records', name: 'My Records', icon: FileText },
    { id: 'sharing', name: 'Sharing', icon: Share2 },
    { id: 'audit', name: 'Audit Log', icon: Clock },
    { id: 'privacy', name: 'Privacy', icon: Shield }
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
          <h1 className="text-4xl font-bold gradient-text mb-4">Patient Dashboard</h1>
          <p className="text-xl text-gray-300">Manage your medical records and control access permissions</p>
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
                <p className="text-gray-400 text-sm">Total Records</p>
                <p className="text-2xl font-bold text-white">{mockRecords.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary-400" />
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
                <p className="text-gray-400 text-sm">Active Shares</p>
                <p className="text-2xl font-bold text-white">{mockSharedAccess.length}</p>
              </div>
              <Share2 className="h-8 w-8 text-secondary-400" />
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
                <p className="text-gray-400 text-sm">Recent Views</p>
                <p className="text-2xl font-bold text-white">7</p>
              </div>
              <Eye className="h-8 w-8 text-accent-400" />
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
                <p className="text-gray-400 text-sm">Storage Used</p>
                <p className="text-2xl font-bold text-white">19.3 MB</p>
              </div>
              <Upload className="h-8 w-8 text-neon-400" />
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
                    ? 'border-primary-400 text-primary-400'
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
          {activeTab === 'records' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Medical Records</h2>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Record
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {mockRecords.map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="glass-card p-6 rounded-xl border border-white/20 hover:border-white/30 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center">
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{record.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>{record.type}</span>
                            <span>•</span>
                            <span>{record.date}</span>
                            <span>•</span>
                            <span>{record.size}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className={`px-2 py-1 text-xs rounded-full ${
                            record.status === 'shared' 
                              ? 'bg-accent-500/20 text-accent-400' 
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {record.status === 'shared' ? 'Shared' : 'Private'}
                          </div>
                          {record.sharedWith.length > 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                              with {record.sharedWith.length} doctor{record.sharedWith.length > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200">
                          <Download className="h-4 w-4 text-gray-400" />
                        </button>
                        <button className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200">
                          <Share2 className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sharing' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Sharing Management</h2>
                <button className="inline-flex items-center px-6 py-3 glass-card border border-primary-400/50 text-primary-400 font-semibold rounded-lg hover:bg-primary-400/10 transition-all duration-200">
                  <Users className="h-4 w-4 mr-2" />
                  Share with Doctor
                </button>
              </div>

              <div className="space-y-4">
                {mockSharedAccess.map((share, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="glass-card p-6 rounded-xl border border-white/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{share.doctor}</h3>
                          <p className="text-sm text-gray-400">{share.specialty}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="text-sm font-medium text-white">{share.accessLevel}</p>
                            <p className="text-xs text-gray-400">{share.recordsShared} records shared</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Expires</p>
                            <p className="text-sm font-medium text-white">{share.expiry}</p>
                          </div>
                          <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all duration-200">
                            Revoke
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Audit Log</h2>
                <p className="text-gray-400">Complete transparency of all interactions with your medical records</p>
              </div>
              <AuditLogTable />
            </div>
          )}

          {activeTab === 'privacy' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Privacy Settings</h2>
              <div className="space-y-6">
                <div className="glass-card p-6 rounded-xl border border-white/20">
                  <h3 className="text-lg font-semibold text-white mb-4">Data Encryption</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-300">End-to-end encryption is enabled for all your medical records</p>
                    <div className="px-3 py-1 bg-accent-500/20 text-accent-400 rounded-full text-sm">Active</div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-xl border border-white/20">
                  <h3 className="text-lg font-semibold text-white mb-4">Access Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" checked className="mr-3" />
                      <span className="text-gray-300">Email notifications when records are accessed</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" checked className="mr-3" />
                      <span className="text-gray-300">Real-time alerts for new sharing requests</span>
                    </label>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-xl border border-white/20">
                  <h3 className="text-lg font-semibold text-white mb-4">Data Retention</h3>
                  <p className="text-gray-300 mb-4">Configure how long your data is retained on the network</p>
                  <select className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white">
                    <option>Indefinite (recommended)</option>
                    <option>10 years</option>
                    <option>5 years</option>
                    <option>Custom period</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 rounded-2xl border border-white/20 max-w-md w-full mx-4"
          >
            <h3 className="text-2xl font-bold text-white mb-6">Upload Medical Record</h3>
            
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center mb-6">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-300 mb-2">Drag & drop files here, or click to browse</p>
              <p className="text-gray-500 text-sm">Supports PDF, DICOM, JPG, PNG files up to 50MB</p>
              <input type="file" className="hidden" />
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Record Type</label>
                <select className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white">
                  <option>Lab Report</option>
                  <option>Imaging</option>
                  <option>Clinical Notes</option>
                  <option>Prescription</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea 
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  rows="3"
                  placeholder="Brief description of the medical record..."
                ></textarea>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-6 py-3 glass-card border border-gray-600 text-gray-300 font-semibold rounded-lg hover:bg-gray-800/50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowUploadModal(false)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200"
              >
                Upload
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;