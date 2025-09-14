import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Upload, FileText, Share2, Eye, Plus, Download, Clock, Shield, Users, Search, X } from 'lucide-react';
import { Cpu, CheckCircle, Info, Folder, File, FileImage } from 'lucide-react';
import AuditLogTable from '../components/AuditLogTable';
import { useAuth } from '../utils/AuthContext';
import { Hospital_Chain_backend } from "declarations/Hospital_Chain_backend";
import * as React from 'react';
import { uploadFileToIPFS, getIPFSFile, unpinFileFromIPFS } from '../utils/IPFSHandler';
import { Toast } from '../components/Toast';





const PatientDashboard = () => {
  const [activeTab, setActiveTab] = useState('records');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { isAuthenticated, authClient, principal, login, logout, userRole} = useAuth();  
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [onShowFolderModal, setonShowFolderModal] = useState(true);
  const [onShowUploadModal, setonShowUploadModal] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [myRecords, setMyRecords] = useState([]);
  const [sharedRecords, setSharedRecords] = useState([]);

  // Functions to handle viewing and downloading files
  const handleView = (cid) => {
    const fileUrl = getIPFSFile(cid);
    window.open(fileUrl, '_blank');
  };

  const handleDownload = (cid) => {
    const fileUrl = getIPFSFile(cid);
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = cid; // The download attribute forces a download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const getFileIcon = (fileType) => {
    switch (fileType.toLowerCase()) {
      case 'lab report':
      case 'clinical notes':
        return <FileText className="h-6 w-6 text-gray-500" />;
      case 'imaging':
        return <FileImage className="h-6 w-6 text-gray-500" />;
      case 'folder':
        return <Folder className="h-6 w-6 text-yellow-500" />;
      default:
        return <File className="h-6 w-6 text-gray-500" />;
    }
  };
  
  const getMedicalData = async () =>{
    return await Hospital_Chain_backend.get_my_records();
  }
  const handleToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

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

  useEffect(() => {
    if (isAuthenticated){
      getMedicalData().then(medicalData => {
        console.log("full object ", medicalData)
        setMyRecords(medicalData["Ok"]);
        const timestampNs = medicalData["Ok"][0]["timestamp"]; // Assuming timestamp is a BigInt in nanoseconds
        const timestampMs = Number(timestampNs / 1_000_000n); // Convert nanoseconds to milliseconds
        console.log("medical data: owner ", medicalData["Ok"][0]["owner"].toString(), "file Type:", medicalData["Ok"][0]["file_type"], "accesslist", medicalData["Ok"][0]["access_list"][0].toString(), "\n",
          "Timestamp", new Date(timestampMs).toLocaleString());
      })

    }
  }, [authClient])

  return (
  <div className="pt-24 pb-16 min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-300 mb-4">Patient Dashboard</h1>
          <p className="text-xl text-blue-200">Manage your medical records and control access permissions</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/60 to-indigo-800/60 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Records</p>
                <p className="text-2xl font-bold text-white">{myRecords.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/60 to-indigo-800/60 shadow-lg"
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
            className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/60 to-indigo-800/60 shadow-lg"
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
            className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/60 to-indigo-800/60 shadow-lg"
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
                <h2 className="text-2xl font-bold text-gray-200">Medical Records</h2>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-md hover:from-blue-500 hover:to-indigo-600 transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Record
                </button>
                <button
                  onClick={() => setShowFolderModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-400 to-blue-500 text-white font-semibold rounded-xl shadow-md hover:from-blue-500 hover:to-indigo-600 transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Folder
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {myRecords.map((record, index) => (
                  <motion.div
                    key={record.record_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/70 to-indigo-800/70 hover:border-blue-300/40 transition-all duration-200 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center shadow-md">
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-200">{record.file_name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span className="text-gray-400">{record.file_type}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-400">{new Date(Number(record.timestamp / 1_000_000n)).toLocaleString()}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-400">{record.size}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className={`px-2 py-1 text-xs rounded-full ${
                            record.status === 'shared' 
                              ? 'bg-accent-500/20 text-accent-400' 
                              : 'bg-gray-700/40 text-gray-400'
                          }`}>
                            {record.status === 'shared' ? 'Shared' : 'Private'}
                          </div>
                          {record.access_list.length > 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                              with {record.access_list.length} doctor{record.access_list.length > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                        <button className="p-2 hover:bg-blue-900/40 rounded-lg transition-colors duration-200">
                          <Download className="h-4 w-4 text-cyan-300" />
                        </button>
                        <button className="p-2 hover:bg-blue-900/40 rounded-lg transition-colors duration-200">
                          <Share2 className="h-4 w-4 text-cyan-300" />
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
                <h2 className="text-2xl font-bold text-gray-200">Sharing Management</h2>
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
                    className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-indigo-900/70 to-blue-800/70 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-200">{share.doctor}</h3>
                          <p className="text-sm text-gray-400">{share.specialty}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="text-sm font-medium text-gray-200">{share.accessLevel}</p>
                            <p className="text-xs text-gray-400">{share.recordsShared} records shared</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Expires</p>
                            <p className="text-sm font-medium text-gray-200">{share.expiry}</p>
                          </div>
                          <button className="px-4 py-2 bg-gradient-to-r from-rose-500/80 to-pink-500/80 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all duration-200 shadow">
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
                <h2 className="text-2xl font-bold text-gray-200 mb-2">Audit Log</h2>
                <p className="text-gray-400">Complete transparency of all interactions with your medical records</p>
              </div>
              <AuditLogTable />
            </div>
          )}

          {activeTab === 'privacy' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-200 mb-6">Privacy Settings</h2>
              <div className="space-y-6">
                <div className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/70 to-indigo-800/70 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-200 mb-4">Data Encryption</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-400">End-to-end encryption is enabled for all your medical records</p>
                    <div className="px-3 py-1 bg-accent-500/20 text-accent-400 rounded-full text-sm">Active</div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/70 to-indigo-800/70 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-200 mb-4">Access Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" checked className="mr-3" />
                      <span className="text-gray-400">Email notifications when records are accessed</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" checked className="mr-3" />
                      <span className="text-gray-400">Real-time alerts for new sharing requests</span>
                    </label>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/70 to-indigo-800/70 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-200 mb-4">Data Retention</h3>
                  <p className="text-gray-400 mb-4">Configure how long your data is retained on the network</p>
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

      <div className="antialiased text-gray-800 bg-gray-100 min-h-screen">
        <AnimatePresence>
          {showUploadModal && (
            <UploadModal
              onClose={() => setShowUploadModal(false)}
              onUpload={async (file, type, file_name, parentId) => {
                setLoading(true);
                let cid = null;
                try {
                  cid = await uploadFileToIPFS(file);
                  await Hospital_Chain_backend.upload_record(cid, type, file_name, parentId? parentId :[]);
                  handleToast('Record uploaded successfully!', 'success');
                } catch (error) {
                  console.error("Upload failed:", error);
                  handleToast(`Upload failed: ${error}`, 'error');
                  // Rollback: Unpin the file from IPFS if canister call fails
                  if (cid) {
                    await unpinFileFromIPFS(cid);
                  }
                } finally {
                  setLoading(false);
                  setShowUploadModal(false);
                }
              }}
              loading={loading}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showFolderModal && (
            <FolderModal
              onClose={() => setShowFolderModal(false)}
              onCreate={async (folderName, parentId) => {
                setLoading(true);
                try {
                  await Hospital_Chain_backend.create_folder(folderName, parentId);
                  handleToast('Folder created successfully!', 'success');
                } catch (error) {
                  console.error("Folder creation failed:", error);
                  handleToast(`Folder creation failed: ${error}`, 'error');
                } finally {
                  setLoading(false);
                  setShowFolderModal(false);
                }
              }}
              loading={loading}
            />
          )}
        </AnimatePresence>

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
};

const UploadModal = ({ onClose, onUpload, loading }) => {
  const [file, setFile] = useState(null);
  const [recordType, setRecordType] = useState('Lab Report');
  const [fileName, setFileName] = useState('medical-record');
  const fileInputRef = React.useRef(null);
  const dropAreaRef = React.useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropAreaRef.current.classList.add('border-primary', 'bg-gray-800');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropAreaRef.current.classList.remove('border-primary', 'bg-gray-800');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropAreaRef.current.classList.remove('border-primary', 'bg-gray-800');
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUploadClick = () => {
    if (file) {
      // Pass `null` for parentId to match the Option<String> in Rust
      onUpload(file, recordType, fileName, null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 rounded-2xl border border-white/20 max-w-md w-full mx-4"
      >
        <h3 className="text-2xl font-bold text-white mb-6">Upload Medical Record</h3>

        <div
          ref={dropAreaRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center mb-6 cursor-pointer hover:border-primary-400 transition-colors"
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          {file ? (
            <p className="text-gray-200">{file.name}</p>
          ) : (
            <p className="text-gray-300 mb-2">Drag & drop files here, or click to browse</p>
          )}
          <p className="text-gray-500 text-sm">Supports PDF, DICOM, JPG, PNG files up to 50MB</p>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Record Type</label>
            <select
              value={recordType}
              onChange={(e) => setRecordType(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
            >
              <option>Lab Report</option>
              <option>Imaging</option>
              <option>Clinical Notes</option>
              <option>Prescription</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">File-name</label>
            <textarea
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
              rows="3"
              placeholder="Brief fileName of the medical record..."
            ></textarea>
          </div>
        </div>

        <div className="flex space-x-4">
          <motion.button whileHover={{ scale: 1.02 }}
            onClick={onClose}
            className="flex-1 px-6 py-3 glass-card border border-gray-600 text-gray-300 font-semibold rounded-lg hover:bg-gray-800/50 transition-all duration-200"
          >
            Cancel
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }}
            onClick={handleUploadClick}
            disabled={!file || loading}
            className={`flex-1 px-6 py-3 text-white font-semibold rounded-lg transition-all duration-200 ${!file || loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-primary to-blue-500 hover:from-primary-600 hover:to-blue-600'
              }`}
          >
            {loading ? 'Uploading...' : 'Upload'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
const FolderModal = ({ onClose, onCreate, loading }) => {
  const [folderName, setFolderName] = useState('');

  const handleCreateClick = () => {
    if (folderName) {
      onCreate(folderName, null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 rounded-2xl border border-white/20 max-w-md w-full mx-4"
      >
        <h3 className="text-2xl font-bold text-white mb-6">Create New Folder</h3>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Folder Name</label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
              placeholder="e.g., 'Lab Results 2024'"
            />
          </div>
        </div>
        <div className="flex space-x-4">
          <motion.button whileHover={{ scale: 1.02 }}
            onClick={onClose}
            className="flex-1 px-6 py-3 glass-card border border-gray-600 text-gray-300 font-semibold rounded-lg hover:bg-gray-800/50 transition-all duration-200"
          >
            Cancel
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }}
            onClick={handleCreateClick}
            disabled={!folderName || loading}
            className={`flex-1 px-6 py-3 text-white font-semibold rounded-lg transition-all duration-200 ${!folderName || loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-primary to-blue-500 hover:from-primary-600 hover:to-blue-600'
              }`}
          >
            {loading ? 'Creating...' : 'Create Folder'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};





export default PatientDashboard;