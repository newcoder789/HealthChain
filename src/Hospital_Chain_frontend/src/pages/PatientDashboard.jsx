import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, CheckCircle, Folder, File, FileText, FileImage, Download, ArrowLeft, SortAsc, SortDesc, Share2, Clock, Eye, Plus, Users, Shield } from 'lucide-react';
import { useAuth } from '../utils/AuthContext';
import { useDemo } from '../utils/DemoContext';
import { TokenService } from '../utils/TokenService';
import { Protect } from '../components/DeveloperOverlay';
import { uploadFileToIPFS, getIPFSFile, unpinFileFromIPFS } from '../utils/IPFSHandler';
import { Toast } from '../components/Toast';

const PatientDashboard = () => {
  const [activeTab, setActiveTab] = useState('records');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { isAuthenticated, userRole, principal, actor } = useAuth();
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [toast, setToast] = useState(null);
  const [myRecords, setMyRecords] = useState([]);
  const [sharedRecords, setSharedRecords] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [sortBy, setSortBy] = useState('timestamp'); // 'timestamp', 'file_name', 'file_type'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedRecordToShare, setSelectedRecordToShare] = useState(null);
  const [sortedRecords, setSortedRecords] = useState([]);
  const { demoMode } = useDemo();
  const [displayName, setDisplayName] = useState('Aryan Dixit');
  const [walletBalance, setWalletBalance] = useState(0);
  const [bounties, setBounties] = useState([]);
  const [consented, setConsented] = useState({});

  const handleToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const result = await actor.get_my_records();
      if (result.Ok) {
        console.log("my record: ", result.Ok)
        console.log("UserRole", userRole)
        setMyRecords(result.Ok);
      } else {
        console.log("Result ",result);
        handleToast(`Error fetching records: ${result.Err}`, 'error');
      }
      if (userRole === 'Doctor' || userRole === 'Researcher') {
        const result = await actor.shared_with_me();
        if (result.Ok) {
          setSharedRecords(result.Ok);
        } else {
          handleToast(`Error fetching shared records: ${result.Err}`, 'error');
        }
      }
    } catch (error) {
      handleToast(`Failed to fetch records: ${error}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = async ( parentId ) =>{
    const filteredRecords = myRecords.filter(record => record.parent_folder_id.includes(parentId));
    // record => currentFolder ? record.parent_folder_id === currentFolder.record_id : record.parent_folder_id === null
    const sortedRecords = sortRecords(filteredRecords);
    console.log("Sorted records", sortedRecords)
    setSortedRecords(sortedRecords);
  }

  useEffect(() => {
    if (isAuthenticated && actor) {
      // Add Patient role if not present
      console.log("Actor hai bhski", actor)
      fetchRecords();
      try {
        const b = TokenService.getBounties();
        setBounties(b);
      } catch (e) {}
      try {
        setWalletBalance(TokenService.getBalance(displayName));
      } catch (e) {}
    }
  }, [isAuthenticated, actor]);

  useEffect(() => {
    // Update sortedRecords when myRecords or currentFolder changes
    if (myRecords.length > 0) {
      const filteredRecords = currentFolder
        ? myRecords.filter(record => record.parent_folder_id.includes(currentFolder.record_id))
        : myRecords.filter(record => record.parent_folder_id.length === 0);
      const sortedRecords = sortRecords(filteredRecords);
      setSortedRecords(sortedRecords);
    }
  }, [myRecords, currentFolder]);

  const handleUpload = async (file, file_type, file_name, parentId) => {
    setLoadingUpload(true);
    let cid = null;
    try {
      console.log("Step 1: Attempting to upload file to IPFS...");
      cid = await uploadFileToIPFS(file);
      console.log("Step 2: Successful upload to IPFS. CID is:", cid);

      console.log("Step 3: Attempting to upload record to canister with CID...");
      await actor.upload_record(cid, file_type, file_name, parentId);
      console.log("Step 4: Record uploaded successfully to canister!");

      handleToast('Record uploaded successfully!', 'success');
      fetchRecords();
    } catch (error) {
      // This will now show us the exact error from the canister or IPFS.
      console.error("Critical error during upload:", error);
      handleToast(`Upload failed: ${error.message || error}`, 'error');
      if (cid) {
        await unpinFileFromIPFS(cid);
      }
    } finally {
      setLoadingUpload(false);
      setShowUploadModal(false);
    }
  };

  const handleCreateFolder = async (folderName, parentId) => {
    setLoadingUpload(true);
    try {
      await actor.create_folder(folderName, parentId);
      handleToast('Folder created successfully!', 'success');
      fetchRecords();
    } catch (error) {
      console.error("Folder creation failed:", error);
      handleToast(`Folder creation failed: ${error}`, 'error');
    } finally {
      setLoading(false);
      setShowFolderModal(false);
    }
  };

  const handleView = (cid) => {
    const fileUrl = getIPFSFile(cid);
    window.open(fileUrl, '_blank');
  };

  const handleDownload = (cid, fileName) => {
    const fileUrl = getIPFSFile(cid);
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
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

  const handleConsent = (bountyId) => {
    try {
      TokenService.consentToBounty(bountyId, displayName);
      setConsented(prev => ({ ...prev, [bountyId]: true }));
    } catch (e) {}
  };

  const handleRevoke = (bountyId) => {
    try {
      TokenService.revokeConsent(bountyId, displayName);
      setConsented(prev => ({ ...prev, [bountyId]: false }));
    } catch (e) {}
  };

  const sortRecords = (records) => {
    const sorted = [...records];
    sorted.sort((a, b) => {
      // Separate folders and files first
      const isAFolder = a.file_type === 'folder';
      const isBFolder = b.file_type === 'folder';

      if (isAFolder && !isBFolder) return -1;
      if (!isAFolder && isBFolder) return 1;

      // Now handle sorting based on the user's choice
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (sortBy === 'timestamp') {
        const aTimestamp = Number(aValue / 1_000_000n);
        const bTimestamp = Number(bValue / 1_000_000n);
        return sortOrder === 'asc' ? aTimestamp - bTimestamp : bTimestamp - aTimestamp;
      } else {
        // For string comparison like file_name
        if (sortOrder === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      }
    });
    return sorted;
  };


  const renderRecord = (record, index) => (
    <motion.div
      key={record.record_id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-gray-50 p-4 rounded-lg shadow-sm flex items-center justify-between transition-all duration-200 hover:shadow-md"
    >
      <div className="flex items-center space-x-3">
        {getFileIcon(record.file_type)}
        <div>
          <p
            className="font-semibold text-gray-800 cursor-pointer"
            onClick={() => record.file_type === 'folder' && setCurrentFolder(record)}
          >
            {record.file_name || record.file_type}
          </p>
          <p className="text-sm text-gray-500">Type: {record.file_type}</p>
        </div>
      </div>
      <div className="space-x-2">
        {record.file_type !== 'folder' && (
          <>
            <button onClick={() => handleView(record.file_hash)} className="bg-primary hover:bg-primary-dark text-white text-sm px-3 py-1 rounded-full">
              View
            </button>
            <button onClick={() => handleDownload(record.file_hash, record.file_name)} className="bg-gray-600 hover:bg-gray-700 text-white text-sm px-3 py-1 rounded-full">
              <Download size={16} />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );


  const tabs = [
    { id: 'records', name: 'My Records', icon: FileText },
    { id: 'sharing', name: 'Sharing', icon: Share2 },
    { id: 'audit', name: 'Audit Log', icon: Clock },
    { id: 'privacy', name: 'Privacy', icon: Shield }
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

  const AuditLogTable = () => {
    // You would fetch audit logs here
    const mockAuditLogs = [
      { id: 1, action: 'Record uploaded', user: 'self', timestamp: '2025-09-14 10:00 AM' },
      { id: 2, action: 'Access granted', user: 'Dr. Smith', timestamp: '2025-09-14 10:05 AM' },
    ];
    return (
      <div className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/70 to-indigo-800/70 shadow-lg">
        <table className="w-full text-left text-gray-300">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="py-2">Action</th>
              <th className="py-2">User</th>
              <th className="py-2">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {mockAuditLogs.map(log => (
              <tr key={log.id} className="border-b border-gray-800 last:border-b-0">
                <td className="py-2">{log.action}</td>
                <td className="py-2">{log.user}</td>
                <td className="py-2">{log.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-blue-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-300 mb-4">Patient Dashboard</h1>
          <p className="text-xl text-blue-200">Manage your medical records and control access permissions</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/60 to-indigo-800/60 shadow-lg md:col-span-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Profile</p>
                <p className="text-2xl font-bold text-white">{displayName}</p>
                <p className="text-sm text-blue-300">Role: {userRole || 'Patient'}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500"></div>
            </div>
          </motion.div>
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
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/60 to-indigo-800/60 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">HCT Balance</p>
                <p className="text-2xl font-bold text-white">{walletBalance} HCT</p>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-200 mb-4">Bounties Available</h2>
          <div className="grid grid-cols-1 gap-4">
            {bounties.map((b) => (
              <div key={b.id} className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/70 to-indigo-800/70 shadow-lg flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold">{b.title}</div>
                  <div className="text-sm text-gray-400">Budget: {b.budget} HCT</div>
                  <div className="text-xs text-gray-500">Tags: {(b.tags||[]).join(', ')}</div>
                </div>
                <div className="flex gap-2">
                  {!consented[b.id] ? (
                    <button onClick={() => handleConsent(b.id)} className="px-4 py-2 bg-emerald-600 text-white rounded">Consent</button>
                  ) : (
                    <button onClick={() => handleRevoke(b.id)} className="px-4 py-2 bg-rose-600 text-white rounded">Revoke</button>
                  )}
                </div>
              </div>
            ))}
            {bounties.length === 0 && (
              <div className="text-gray-400">No bounties at the moment.</div>
            )}
          </div>
        </div>

        <div className="border-b border-white/10 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors duration-200 ${activeTab === tab.id
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

        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {activeTab === 'records' && ( 
            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                  {currentFolder && (
                    <button onClick={() => setCurrentFolder(null)} className="text-gray-400 hover:text-gray-200 transition-colors">
                      <ArrowLeft className="h-6 w-6" />
                    </button>
                  )}
                  <h2 className="text-2xl font-bold text-gray-200">{currentFolder ? currentFolder.file_name : 'Medical Records'}</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white text-sm"
                  >
                    <option value="timestamp">Date</option>
                    <option value="file_name">Name</option>
                    <option value="file_type">Type</option>
                  </select>
                  <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="bg-gray-800 border border-gray-600 text-white p-2 rounded-lg">
                    {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
                  </button>
                  <Protect level="red" label="Upload (protected)">
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-md hover:from-blue-500 hover:to-indigo-600 transition-all duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Record
                  </button>
                  </Protect>
                  <Protect level="red" label="Folder (protected)">
                  <button
                    onClick={() => setShowFolderModal(true)}
                    className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-400 to-blue-500 text-white font-semibold rounded-xl shadow-md hover:from-blue-500 hover:to-indigo-600 transition-all duration-200"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Folder
                  </button>
                  </Protect>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {sortedRecords.length > 0 ? sortedRecords.map((record, index) => (
                  <motion.div
                    key={record.record_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/70 to-indigo-800/70 hover:border-blue-300/40 transition-all duration-200 shadow-lg"
                    onClick={() => {
                      console.log("record folder we just opened", record)
                      if (record.file_type === 'folder') {
                        setCurrentFolder(record);
                        filterRecords(record.record_id);
                      } else {
                        handleView(record.file_hash);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center shadow-md">
                          {getFileIcon(record.file_type)}
                        </div>
                        <div>
                          <p
                            className="font-semibold text-gray-200 cursor-pointer"
                            
                          >
                            {record.file_name || record.file_type}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span className="text-gray-400">{record.file_type}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-400">{new Date(Number(record.timestamp / 1_000_000n)).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {record.file_type !== 'folder' && (
                          <>
                            <button onClick={() => handleView(record.file_hash)} className="p-2 hover:bg-blue-900/40 rounded-lg transition-colors duration-200">
                              <Eye className="h-4 w-4 text-cyan-300" />
                            </button>
                            <button onClick={() => handleDownload(record.file_hash, record.file_name)} className="p-2 hover:bg-blue-900/40 rounded-lg transition-colors duration-200">
                              <Download className="h-4 w-4 text-cyan-300" />
                            </button>
                          </>
                        )}
                        <button className="p-2 hover:bg-blue-900/40 rounded-lg transition-colors duration-200">
                          <Share2 className="h-4 w-4 text-cyan-300" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )) : <p className="text-center text-gray-400">You have no records. Upload one to get started!</p>}
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
                <h2 className="text-2xl font-bold text-gray-200">Audit Log</h2>
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
      <AnimatePresence>
        {showUploadModal && (
          <UploadModal onClose={() => setShowUploadModal(false)} onUpload={handleUpload} loading={loadingUpload} currentFolder={currentFolder} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showFolderModal && (
          <FolderModal onClose={() => setShowFolderModal(false)} onCreate={handleCreateFolder} loading={loadingUpload} currentFolder={currentFolder} />
        )}
      </AnimatePresence>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

const UploadModal = ({ onClose, onUpload, loading, currentFolder }) => {
  const [file, setFile] = useState(null);
  const [recordType, setRecordType] = useState('Lab Report');
  const [fileName, setFileName] = useState('');
  const fileInputRef = React.useRef(null);
  const dropAreaRef = React.useRef(null);

  useEffect(() => {
    if (file) {
      setFileName(file.name);
    }
  }, [file]);

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
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
    }
  };

  const handleUploadClick = () => {
    if (file && fileName) {
      const parentId = currentFolder ? [currentFolder.record_id] : [];
      onUpload(file, recordType, fileName, parentId);
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
            <label className="block text-sm font-medium text-gray-300 mb-2">File Name</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
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
            onClick={handleUploadClick}
            disabled={!file || !fileName || loading}
            className={`flex-1 px-6 py-3 text-white font-semibold rounded-lg transition-all duration-200 ${!file || !fileName || loading ? 'bg-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-primary to-blue-500 hover:from-primary-600 hover:to-blue-600'
              }`}
          >
            {loading ? 'Uploading...' : 'Upload'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

const FolderModal = ({ onClose, onCreate, loading, currentFolder }) => {
  const [folderName, setFolderName] = useState('');
  const handleCreateClick = () => {
    if (folderName) {
      const parentId = currentFolder ? [currentFolder.record_id] : [];
      onCreate(folderName, parentId);
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
