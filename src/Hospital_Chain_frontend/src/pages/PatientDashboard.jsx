import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, CheckCircle, Folder, File, FileText, FileImage, Download, ArrowLeft, SortAsc, SortDesc, Share2, Clock, Eye, Plus, Users, Shield, Calendar, UserPlus, Edit3, Trash2, Send, Copy, Check } from 'lucide-react';
import { useAuth } from '../utils/AuthContext';
import { useDemo } from '../utils/DemoContext';
import { TokenService } from '../utils/TokenService';
import { Protect } from '../components/DeveloperOverlay';
import { uploadFileToIPFS, getIPFSFile, unpinFileFromIPFS } from '../utils/IPFSHandler';
import { mlClient } from '../utils/mlClient';
import { Toast } from '../components/Toast';

const PatientDashboard = () => {
  const [activeTab, setActiveTab] = useState('records');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { isAuthenticated, userRole, principal, actor } = useAuth();
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const hasFetchedRef = useRef(false);
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
  const [qualityByRecordId, setQualityByRecordId] = useState({});
  
  // New sharing states
  const [showShareRecordModal, setShowShareRecordModal] = useState(false);
  const [showShareWithDoctorModal, setShowShareWithDoctorModal] = useState(false);
  const [showAccessRequestModal, setShowAccessRequestModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [shareForm, setShareForm] = useState({
    doctorEmail: '',
    doctorName: '',
    duration: '30',
    permissions: ['view'],
    message: '',
    records: []
  });
  const [accessRequests, setAccessRequests] = useState([]);
  const [sharedAccess, setSharedAccess] = useState([
    {
      id: 1,
      doctor: 'Dr. Sarah Smith',
      specialty: 'Cardiology',
      accessLevel: 'Full Access',
      expiry: '2025-06-10',
      recordsShared: 5,
      permissions: ['view', 'download', 'comment'],
      status: 'active'
    },
    {
      id: 2,
      doctor: 'Dr. Mike Johnson',
      specialty: 'Internal Medicine',
      accessLevel: 'Limited Access',
      expiry: '2025-03-15',
      recordsShared: 2,
      permissions: ['view'],
      status: 'active'
    }
  ]);

  const handleToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Sharing handlers
  const handleShareRecord = (record) => {
    setSelectedRecord(record);
    setShareForm(prev => ({
      ...prev,
      records: [record.record_id]
    }));
    setShowShareRecordModal(true);
  };

  const handleShareWithDoctor = () => {
    setShowShareWithDoctorModal(true);
  };

  const handleSubmitShare = async () => {
    setLoading(true);
    try {
      // Simulate sharing process
      const newShare = {
        id: Date.now(),
        doctor: shareForm.doctorName,
        specialty: 'General Medicine',
        accessLevel: shareForm.permissions.includes('download') ? 'Full Access' : 'Limited Access',
        expiry: new Date(Date.now() + parseInt(shareForm.duration) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        recordsShared: shareForm.records.length,
        permissions: shareForm.permissions,
        status: 'active'
      };
      
      setSharedAccess(prev => [...prev, newShare]);
      handleToast(`Successfully shared ${shareForm.records.length} record(s) with ${shareForm.doctorName}`, 'success');
      
      setShareForm({
        doctorEmail: '',
        doctorName: '',
        duration: '30',
        permissions: ['view'],
        message: '',
        records: []
      });
      setShowShareRecordModal(false);
      setShowShareWithDoctorModal(false);
    } catch (error) {
      handleToast('Failed to share records. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = (shareId) => {
    setSharedAccess(prev => prev.filter(share => share.id !== shareId));
    handleToast('Access revoked successfully', 'success');
  };

  const handleRequestAccess = () => {
    setShowAccessRequestModal(true);
  };

  const handleSubmitAccessRequest = async () => {
    setLoading(true);
    try {
      // Simulate access request
      const newRequest = {
        id: Date.now(),
        doctor: 'Dr. New Doctor',
        specialty: 'Requested Specialty',
        status: 'pending',
        requestedAt: new Date().toISOString(),
        message: 'Requesting access to medical records for consultation'
      };
      
      setAccessRequests(prev => [...prev, newRequest]);
      handleToast('Access request sent successfully', 'success');
      setShowAccessRequestModal(false);
    } catch (error) {
      handleToast('Failed to send access request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = (requestId) => {
    setAccessRequests(prev => prev.filter(req => req.id !== requestId));
    handleToast('Access request approved', 'success');
  };

  const handleDenyRequest = (requestId) => {
    setAccessRequests(prev => prev.filter(req => req.id !== requestId));
    handleToast('Access request denied', 'success');
  };

  // Privacy and settings handlers
  const handlePrivacyToggle = (setting) => {
    handleToast(`${setting} setting updated`, 'success');
  };

  const handleDataRetentionUpdate = (days) => {
    handleToast(`Data retention policy updated to ${days} days`, 'success');
  };

  const handleEncryptionToggle = () => {
    handleToast('End-to-end encryption toggled', 'success');
  };

  const handleNotificationToggle = (type) => {
    handleToast(`${type} notifications updated`, 'success');
  };

  const handleExportData = () => {
    handleToast('Data export initiated. You will receive an email when ready.', 'success');
  };

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      handleToast('Account deletion request submitted', 'success');
    }
  };

  const fetchRecords = useCallback(async () => {
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
      setIsInitialLoading(false);
    }
  }, [actor, userRole]);

  const filterRecords = async ( parentId ) =>{
    const filteredRecords = myRecords.filter(record => record.parent_folder_id.includes(parentId));
    // record => currentFolder ? record.parent_folder_id === currentFolder.record_id : record.parent_folder_id === null
    const sortedRecords = sortRecords(filteredRecords);
    console.log("Sorted records", sortedRecords)
    setSortedRecords(sortedRecords);
  }

  useEffect(() => {
    if (isAuthenticated && actor && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      console.log("Actor present, fetching records once", actor);
      fetchRecords();
      try {
        const b = TokenService.getBounties();
        setBounties(b);
      } catch (e) {}
      try {
        setWalletBalance(TokenService.getBalance(displayName));
      } catch (e) {}
    }
  }, [isAuthenticated, actor, fetchRecords]);

  useEffect(() => {
    // Update sortedRecords when myRecords or currentFolder changes
    const filteredRecords = myRecords.length > 0
      ? (currentFolder
        ? myRecords.filter(record => record.parent_folder_id.includes(currentFolder.record_id))
        : myRecords.filter(record => record.parent_folder_id.length === 0))
      : [];
    const nextSorted = sortRecords(filteredRecords);
    // Only update state if changed to avoid flicker
    const sameLength = nextSorted.length === sortedRecords.length;
    const sameIds = sameLength && nextSorted.every((r, i) => r.record_id === sortedRecords[i]?.record_id);
    if (!sameLength || !sameIds) {
      setSortedRecords(nextSorted);
    }
  }, [myRecords, currentFolder, sortBy, sortOrder]);

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

      handleToast(`Record "${file_name}" uploaded successfully!`, 'success');
      await fetchRecords();

      // Find the newly uploaded record and run quality check via ML
      try {
        const uploaded = myRecords.find(r => r.file_name === file_name) || null;
        const inputUri = `ipfs://${cid}`;
        const job = await mlClient.createJob({ type: 'quality', input_uri: inputUri, consent_token: 'demo-consent' });
        const final = await mlClient.pollJob(job.id, { intervalMs: 1000, maxMs: 15000 });
        if (final.status === 'succeeded') {
          setQualityByRecordId(prev => ({ ...prev, [uploaded?.record_id || cid]: { score: 0.92, reportUri: final.artifacts?.quality_report_uri } }));
        }
      } catch (e) {
        console.warn('Quality check failed', e);
        handleToast('Quality service unavailable right now. Try later.', 'error');
      }
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
      handleToast(`Folder "${folderName}" created successfully!`, 'success');
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
                {isInitialLoading && (
                  <>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/50 to-indigo-800/50 animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-800/50 rounded-lg" />
                            <div>
                              <div className="h-4 w-40 bg-blue-800/50 rounded mb-2" />
                              <div className="h-3 w-56 bg-blue-800/40 rounded" />
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-800/50 rounded" />
                            <div className="w-8 h-8 bg-blue-800/50 rounded" />
                            <div className="w-8 h-8 bg-blue-800/50 rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
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
                        {qualityByRecordId[record.record_id] && (
                          <>
                            <span className="text-gray-500">•</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                              Quality {Math.round(qualityByRecordId[record.record_id].score * 100)}%
                            </span>
                            {qualityByRecordId[record.record_id].reportUri && (
                              <>
                                <span className="text-gray-500">•</span>
                                <a
                                  href={qualityByRecordId[record.record_id].reportUri.startsWith('ipfs://')
                                    ? getIPFSFile(qualityByRecordId[record.record_id].reportUri.replace('ipfs://',''))
                                    : qualityByRecordId[record.record_id].reportUri}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-cyan-300 hover:text-cyan-200 underline underline-offset-2"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  View Quality Report
                                </a>
                              </>
                            )}
                          </>
                        )}
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
                        <button 
                          onClick={() => handleShareRecord(record)}
                          className="p-2 hover:bg-blue-900/40 rounded-lg transition-colors duration-200"
                          title="Share Record"
                        >
                          <Share2 className="h-4 w-4 text-cyan-300" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )) : !loading && (
                  <div className="glass-card p-8 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/60 to-indigo-800/60 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-blue-800/60 flex items-center justify-center mb-4">
                      <Upload className="h-8 w-8 text-cyan-300" />
                    </div>
                    <p className="text-gray-200 font-semibold mb-2">No records yet</p>
                    <p className="text-gray-400 mb-4">Upload your first medical record to get started</p>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg shadow hover:from-blue-500 hover:to-indigo-600 transition-all duration-200"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Upload Record
                      </button>
                      <button
                        onClick={() => setShowFolderModal(true)}
                        className="inline-flex items-center px-5 py-2.5 bg-gray-700 text-white font-semibold rounded-lg shadow hover:bg-gray-600 transition-all duration-200"
                      >
                        <Folder className="h-4 w-4 mr-2" />
                        Create Folder
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'sharing' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-200">Sharing Management</h2>
                <div className="flex space-x-3">
                  <button 
                    onClick={handleShareWithDoctor}
                    className="inline-flex items-center px-6 py-3 glass-card border border-primary-400/50 text-primary-400 font-semibold rounded-lg hover:bg-primary-400/10 transition-all duration-200"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Share with Doctor
                  </button>
                  <button 
                    onClick={handleRequestAccess}
                    className="inline-flex items-center px-6 py-3 glass-card border border-accent-400/50 text-accent-400 font-semibold rounded-lg hover:bg-accent-400/10 transition-all duration-200"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Request Access
                  </button>
                </div>
              </div>

              {/* Active Shares */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-200 mb-4">Active Shares</h3>
                <div className="space-y-4">
                  {loading && sharedAccess.length === 0 && (
                    <>
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-indigo-900/50 to-blue-800/50 animate-pulse">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-blue-800/50 rounded-full" />
                              <div>
                                <div className="h-4 w-40 bg-blue-800/50 rounded mb-2" />
                                <div className="h-3 w-24 bg-blue-800/40 rounded" />
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 h-8 bg-blue-800/50 rounded" />
                              <div className="w-20 h-8 bg-blue-800/50 rounded" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  {sharedAccess.map((share, index) => (
                    <motion.div
                      key={share.id}
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
                            <div className="flex items-center space-x-2 mt-1">
                              {share.permissions.map((permission, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded">
                                  {permission}
                                </span>
                              ))}
                            </div>
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
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleRevokeAccess(share.id)}
                                className="px-4 py-2 bg-gradient-to-r from-rose-500/80 to-pink-500/80 text-white rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all duration-200 shadow"
                              >
                                Revoke
                              </button>
                              <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200">
                                <Edit3 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Access Requests */}
              {accessRequests.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-200 mb-4">Pending Access Requests</h3>
                  <div className="space-y-4">
                    {accessRequests.map((request, index) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="glass-card p-6 rounded-xl border border-yellow-400/20 bg-gradient-to-br from-yellow-900/70 to-orange-800/70 shadow-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                              <UserPlus className="h-6 w-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-200">{request.doctor}</h3>
                              <p className="text-sm text-gray-400">{request.specialty}</p>
                              <p className="text-xs text-gray-500 mt-1">{request.message}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleApproveRequest(request.id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </button>
                            <button 
                              onClick={() => handleDenyRequest(request.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Deny
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
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
                    <button 
                      onClick={handleEncryptionToggle}
                      className="px-3 py-1 bg-accent-500/20 text-accent-400 rounded-full text-sm hover:bg-accent-500/30 transition-colors duration-200"
                    >
                      Active
                    </button>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/70 to-indigo-800/70 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-200 mb-4">Access Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        defaultChecked 
                        onChange={() => handleNotificationToggle('Email access')}
                        className="mr-3" 
                      />
                      <span className="text-gray-400">Email notifications when records are accessed</span>
                    </label>
                    <label className="flex items-center">
                      <input 
                        type="checkbox" 
                        defaultChecked 
                        onChange={() => handleNotificationToggle('Real-time sharing')}
                        className="mr-3" 
                      />
                      <span className="text-gray-400">Real-time alerts for new sharing requests</span>
                    </label>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/70 to-indigo-800/70 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-200 mb-4">Data Retention</h3>
                  <p className="text-gray-400 mb-4">Configure how long your data is retained on the network</p>
                  <select 
                    onChange={(e) => handleDataRetentionUpdate(e.target.value)}
                    className="bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                  >
                    <option value="indefinite">Indefinite (recommended)</option>
                    <option value="3650">10 years</option>
                    <option value="1825">5 years</option>
                    <option value="custom">Custom period</option>
                  </select>
                </div>

                <div className="glass-card p-6 rounded-xl border border-orange-400/20 bg-gradient-to-br from-orange-900/70 to-red-800/70 shadow-lg">
                  <h3 className="text-lg font-semibold text-gray-200 mb-4">Data Management</h3>
                  <div className="space-y-4">
                    <button 
                      onClick={handleExportData}
                      className="w-full px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200"
                    >
                      Export My Data
                    </button>
                    <button 
                      onClick={handleDeleteAccount}
                      className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200"
                    >
                      Delete Account
                    </button>
                  </div>
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
      {/* Sharing Modals */}
      <AnimatePresence>
        {/* Share Record Modal */}
        {showShareRecordModal && selectedRecord && (
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
                <h3 className="text-2xl font-bold text-white">Share Record</h3>
                <button
                  onClick={() => setShowShareRecordModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200"
                >
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-2">{selectedRecord.file_name}</h4>
                <p className="text-gray-300 text-sm">Type: {selectedRecord.file_type}</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Doctor Name</label>
                    <input
                      type="text"
                      value={shareForm.doctorName}
                      onChange={(e) => setShareForm(prev => ({ ...prev, doctorName: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                      placeholder="Dr. John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Doctor Email</label>
                    <input
                      type="email"
                      value={shareForm.doctorEmail}
                      onChange={(e) => setShareForm(prev => ({ ...prev, doctorEmail: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                      placeholder="doctor@hospital.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Access Duration</label>
                  <select
                    value={shareForm.duration}
                    onChange={(e) => setShareForm(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                  >
                    <option value="1">1 Day</option>
                    <option value="7">1 Week</option>
                    <option value="30">1 Month</option>
                    <option value="90">3 Months</option>
                    <option value="365">1 Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Permissions</label>
                  <div className="space-y-2">
                    {['view', 'download', 'comment', 'edit'].map((permission) => (
                      <label key={permission} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={shareForm.permissions.includes(permission)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setShareForm(prev => ({
                                ...prev,
                                permissions: [...prev.permissions, permission]
                              }));
                            } else {
                              setShareForm(prev => ({
                                ...prev,
                                permissions: prev.permissions.filter(p => p !== permission)
                              }));
                            }
                          }}
                          className="w-4 h-4 text-primary-600 bg-gray-800 border-gray-600 rounded focus:ring-primary-500"
                        />
                        <span className="text-gray-300 capitalize">{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Message (Optional)</label>
                  <textarea
                    value={shareForm.message}
                    onChange={(e) => setShareForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400 h-20"
                    placeholder="Add a message for the doctor..."
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => setShowShareRecordModal(false)}
                  className="flex-1 px-6 py-3 glass-card border border-gray-600 text-gray-300 font-semibold rounded-lg hover:bg-gray-800/50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitShare}
                  disabled={loading || !shareForm.doctorName}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Sharing...' : 'Share Record'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Share with Doctor Modal */}
        {showShareWithDoctorModal && (
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
                <h3 className="text-2xl font-bold text-white">Share with Doctor</h3>
                <button
                  onClick={() => setShowShareWithDoctorModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200"
                >
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Doctor Name</label>
                    <input
                      type="text"
                      value={shareForm.doctorName}
                      onChange={(e) => setShareForm(prev => ({ ...prev, doctorName: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                      placeholder="Dr. John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Doctor Email</label>
                    <input
                      type="email"
                      value={shareForm.doctorEmail}
                      onChange={(e) => setShareForm(prev => ({ ...prev, doctorEmail: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                      placeholder="doctor@hospital.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Select Records to Share</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {myRecords.map((record) => (
                      <label key={record.record_id} className="flex items-center space-x-3 p-2 hover:bg-gray-800/50 rounded">
                        <input
                          type="checkbox"
                          checked={shareForm.records.includes(record.record_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setShareForm(prev => ({
                                ...prev,
                                records: [...prev.records, record.record_id]
                              }));
                            } else {
                              setShareForm(prev => ({
                                ...prev,
                                records: prev.records.filter(id => id !== record.record_id)
                              }));
                            }
                          }}
                          className="w-4 h-4 text-primary-600 bg-gray-800 border-gray-600 rounded focus:ring-primary-500"
                        />
                        <span className="text-gray-300">{record.file_name}</span>
                        <span className="text-gray-500 text-sm">({record.file_type})</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Access Duration</label>
                  <select
                    value={shareForm.duration}
                    onChange={(e) => setShareForm(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                  >
                    <option value="1">1 Day</option>
                    <option value="7">1 Week</option>
                    <option value="30">1 Month</option>
                    <option value="90">3 Months</option>
                    <option value="365">1 Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Permissions</label>
                  <div className="space-y-2">
                    {['view', 'download', 'comment', 'edit'].map((permission) => (
                      <label key={permission} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={shareForm.permissions.includes(permission)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setShareForm(prev => ({
                                ...prev,
                                permissions: [...prev.permissions, permission]
                              }));
                            } else {
                              setShareForm(prev => ({
                                ...prev,
                                permissions: prev.permissions.filter(p => p !== permission)
                              }));
                            }
                          }}
                          className="w-4 h-4 text-primary-600 bg-gray-800 border-gray-600 rounded focus:ring-primary-500"
                        />
                        <span className="text-gray-300 capitalize">{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => setShowShareWithDoctorModal(false)}
                  className="flex-1 px-6 py-3 glass-card border border-gray-600 text-gray-300 font-semibold rounded-lg hover:bg-gray-800/50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitShare}
                  disabled={loading || !shareForm.doctorName || shareForm.records.length === 0}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Sharing...' : 'Share Records'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Access Request Modal */}
        {showAccessRequestModal && (
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
                <h3 className="text-2xl font-bold text-white">Request Access</h3>
                <button
                  onClick={() => setShowAccessRequestModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200"
                >
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <UserPlus className="h-5 w-5 text-blue-400" />
                    <h4 className="text-lg font-semibold text-blue-300">Request Doctor Access</h4>
                  </div>
                  <p className="text-gray-300 text-sm">
                    Send a request to a doctor to access your medical records for consultation or treatment.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Doctor Name</label>
                    <input
                      type="text"
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400"
                      placeholder="Dr. John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Specialty</label>
                    <select className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400">
                      <option value="">Select specialty</option>
                      <option value="cardiology">Cardiology</option>
                      <option value="neurology">Neurology</option>
                      <option value="oncology">Oncology</option>
                      <option value="general">General Medicine</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Reason for Access</label>
                  <textarea
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-primary-400 h-24"
                    placeholder="Please describe why you need to share your medical records with this doctor..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Records to Share</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {myRecords.map((record) => (
                      <label key={record.record_id} className="flex items-center space-x-3 p-2 hover:bg-gray-800/50 rounded">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-primary-600 bg-gray-800 border-gray-600 rounded focus:ring-primary-500"
                        />
                        <span className="text-gray-300">{record.file_name}</span>
                        <span className="text-gray-500 text-sm">({record.file_type})</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => setShowAccessRequestModal(false)}
                  className="flex-1 px-6 py-3 glass-card border border-gray-600 text-gray-300 font-semibold rounded-lg hover:bg-gray-800/50 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAccessRequest}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-accent-500 to-primary-500 text-white font-semibold rounded-lg hover:from-accent-600 hover:to-primary-600 transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </motion.div>
          </motion.div>
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
