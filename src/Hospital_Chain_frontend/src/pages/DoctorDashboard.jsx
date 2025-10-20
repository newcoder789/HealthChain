import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileText, Users, Eye, Search, UserPlus, X, BadgeCheck, Clock, Send, ShieldQuestion, Activity, UploadCloud, Folder, ArrowLeft } from 'lucide-react';
import { useAuth } from '../utils/AuthContext';
import { getIPFSFile, uploadFileToIPFS } from '../utils/IPFSHandler';
import { Toast } from '../components/Toast';

const DoctorDashboard = () => {
  const { isAuthenticated, actor } = useAuth();
  const [sharedRecords, setSharedRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [requestMessage, setRequestMessage] = useState('');
  const [recordIdToRequest, setRecordIdToRequest] = useState('');
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [sentRequests, setSentRequests] = useState([]);
  const [verifiedPatientsCount, setVerifiedPatientsCount] = useState(0);
  const [activeTab, setActiveTab] = useState('sharedRecords');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(null); // For folder navigation
  const [displayedRecords, setDisplayedRecords] = useState([]); // For folder navigation
  const [auditLogs, setAuditLogs] = useState([]);

  const handleToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const fetchDoctorData = useCallback(async () => {
    if (!actor) return;
    // Only show the main loader on the very first fetch
    try {
      // Fetch doctor's profile
      const [profileRes, recordsRes, sentRequestsRes, auditLogRes] = await Promise.all([
        actor.get_profile(),
        actor.shared_with_me(),
        actor.get_my_sent_requests(),
        actor.get_my_audit_log(),
      ]);

      if (profileRes.Ok) {
        setDoctorProfile(profileRes.Ok);
        setDisplayName(profileRes.Ok.name?.join('') || 'Dr. Anonymous');
      }

      // Fetch records shared with the doctor
      if (recordsRes.Ok) {
        console.log(recordsRes.Ok)
        setSharedRecords(recordsRes.Ok);
        const uniqueVerifiedPatients = new Set(
          recordsRes.Ok
            .filter(r => r.owner_is_verified)
            .map(r => r.record.owner.toText())
        );
        setVerifiedPatientsCount(uniqueVerifiedPatients.size);
      } else {
        handleToast(`Error fetching shared records: ${recordsRes.Err}`, 'error');
      }

      if (sentRequestsRes.Ok) {
        setSentRequests(sentRequestsRes.Ok);
      }

      if (auditLogRes.Ok) {
        setAuditLogs(auditLogRes.Ok);
      }
    } catch (error) {
      handleToast(`Failed to fetch dashboard data: ${error.message || error}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [actor]);

  useEffect(() => {
    if (isAuthenticated && actor) {
      fetchDoctorData();
    }
  }, [isAuthenticated, actor, fetchDoctorData]);

  // Effect for handling folder navigation in shared records
  useEffect(() => {
    const getParentId = (record) => record.record.parent_folder_id[0] || null;

    const filtered = sharedRecords.filter(record => {
      const parentId = getParentId(record);
      const currentFolderId = currentFolder ? currentFolder.record.record_id : null;
      return parentId === currentFolderId;
    });

    // You can add sorting logic here if needed
    setDisplayedRecords(filtered);
  }, [sharedRecords, currentFolder]);

  const handleView = (cid) => {
    const fileUrl = getIPFSFile(cid);
    window.open(fileUrl, '_blank');
  };

  const handleSearchPatients = async () => {
    if (!searchQuery.trim() || !actor) return;
    try {
      const res = await actor.search_patients_by_name(searchQuery);
      if (res.Ok) {
        setSearchResults(res.Ok);
      } else {
        handleToast(`Search failed: ${res.Err}`, 'error');
      }
    } catch (error) {
      handleToast(`An error occurred during search: ${error.message}`, 'error');
    }
  };

  const handleSendAccessRequest = async () => {
    if (!selectedPatient || !recordIdToRequest.trim() || !requestMessage.trim()) {
      handleToast('Please select a patient and fill all fields.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      await actor.request_access_to_record(recordIdToRequest, requestMessage);
      handleToast('Access request sent successfully!', 'success');
      setShowRequestModal(false);
      setSearchQuery('');
      setSearchResults([]);
      setSelectedPatient(null);
      setRequestMessage('');
      setRecordIdToRequest('');
    } catch (error) {
      handleToast(`Failed to send request: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetVerified = () => {
    setShowVerificationModal(true); }

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        ><div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-300 mb-2">Doctor Dashboard</h1>
              <div className="flex items-center space-x-2">
                <p className="text-xl text-blue-200">Welcome, {displayName}</p>
                {isLoading ? <div className="h-4 w-24 bg-slate-700 rounded-full animate-pulse"></div> :
                  doctorProfile?.identity_status.hasOwnProperty('Approved') ? (
                  <span className="flex items-center px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                    <BadgeCheck className="h-3 w-3 mr-1" />
                    Verified
                  </span>
                ) : doctorProfile?.identity_status.hasOwnProperty('Pending') ? (
                  <span className="flex items-center px-2 py-1 bg-sky-500/20 text-sky-300 text-xs rounded-full">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending Review
                  </span>
                ) : (
                  <span className="flex items-center px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">
                    <ShieldQuestion className="h-3 w-3 mr-1" />
                    Not Verified
                  </span>
                )
                }
              </div>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <button onClick={() => setShowRequestModal(true)} className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-md hover:from-blue-500 hover:to-indigo-600 transition-all duration-200">
                <UserPlus className="h-5 w-5 mr-2" />
                Request Record Access
              </button>
              {!isLoading && doctorProfile && !doctorProfile.identity_status.hasOwnProperty('Approved') && !doctorProfile.identity_status.hasOwnProperty('Pending') && (
                <button onClick={handleGetVerified} className="text-xs text-cyan-300 hover:underline">
                  Get Verified
                </button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-6 rounded-xl border border-blue-400/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Shared Records</p>
                <p className="text-2xl font-bold text-white">{sharedRecords.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary-400" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card p-6 rounded-xl border border-blue-400/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Verified Patients</p>
                <p className="text-2xl font-bold text-white">{verifiedPatientsCount}</p>
              </div>
              <Users className="h-8 w-8 text-green-400" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-card p-6 rounded-xl border border-blue-400/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Requests</p>
                <p className="text-2xl font-bold text-white">{sentRequests.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </motion.div>
        </div>

        <div className="border-b border-white/10 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('sharedRecords')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors duration-200 ${activeTab === 'sharedRecords'
                  ? 'border-primary-400 text-primary-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
            >
              <FileText className="h-4 w-4 mr-2" />
              Shared Records
            </button>
            <button
              onClick={() => setActiveTab('sentRequests')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors duration-200 ${activeTab === 'sentRequests'
                  ? 'border-primary-400 text-primary-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
            >
              <Clock className="h-4 w-4 mr-2" />
              Sent Requests
            </button>
            <button
              onClick={() => setActiveTab('auditLog')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors duration-200 ${activeTab === 'auditLog'
                  ? 'border-primary-400 text-primary-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
            >
              <Activity className="h-4 w-4 mr-2" />
              Audit Log
            </button>
          </nav>
        </div>

        {activeTab === 'sharedRecords' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 rounded-xl border border-blue-400/20">
            <div className="flex items-center space-x-4 mb-6">
              {currentFolder && (
                <button onClick={() => setCurrentFolder(null)} className="p-2 hover:bg-blue-900/40 rounded-lg transition-colors duration-200">
                  <ArrowLeft className="h-6 w-6 text-cyan-300" />
                </button>
              )}
              <h2 className="text-2xl font-bold text-gray-200">{currentFolder ? currentFolder.record.file_name.join('') : 'Records Shared With You'}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-gray-300">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="py-3 px-4">Record Name</th>
                    <th className="py-3 px-4">Record Type</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Shared On</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan="5" className="text-center py-8">Loading...</td></tr>
                  ) : displayedRecords.length > 0 ? (
                    displayedRecords.map(({ record, owner_name, owner_is_verified }) => (
                      <motion.tr
                        key={record.record_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => {
                          if (record.file_type === 'folder') {
                            setCurrentFolder({ record, owner_name, owner_is_verified });
                          }
                        }}
                        className={`border-b border-gray-800 hover:bg-blue-900/20 ${record.file_type === 'folder' ? 'cursor-pointer' : ''}`}
                      >
                        <td className="py-4 px-4 font-medium">{record.file_name.join('') || 'N/A'}</td>
                        <td className="py-4 px-4">{record.file_type}</td>
                        <td className="py-4 px-4 flex items-center space-x-2">
                          <span>{owner_name.join('') || 'Anonymous Patient'}</span>
                          {owner_is_verified && <BadgeCheck className="h-4 w-4 text-green-400" title="Verified Patient" />}
                        </td>
                        <td className="py-4 px-4">{new Date(Number(record.timestamp / 1_000_000n)).toLocaleDateString()}</td>
                        <td className="py-4 px-4 text-right">
                          {record.file_type === 'folder' ? (
                            <Folder className="h-5 w-5 text-yellow-400 inline-block" />
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleView(record.file_cid);
                              }}
                              className="p-2 hover:bg-blue-900/40 rounded-lg transition-colors duration-200"
                              title="View Record"
                            >
                              <Eye className="h-4 w-4 text-cyan-300" />
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-8">
                        <div className="mx-auto w-16 h-16 rounded-full bg-blue-800/60 flex items-center justify-center mb-4">
                          <FileText className="h-8 w-8 text-cyan-300" />
                        </div>
                        <p className="text-gray-300">No records have been shared with you yet.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'sentRequests' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 rounded-xl border border-blue-400/20">
            <h2 className="text-2xl font-bold text-gray-200 mb-6">Your Pending Access Requests</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-gray-300">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Record Name</th>
                    <th className="py-3 px-4">Requested At</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && sentRequests.length === 0 ? (
                    <tr><td colSpan="4" className="text-center py-8">Loading requests...</td></tr>
                  ) : sentRequests.length > 0 ? (
                    sentRequests.map((request) => (
                      <motion.tr
                        key={request.request_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-gray-800 hover:bg-blue-900/20"
                      >
                        <td className="py-4 px-4 font-medium">{request.requester_name.join('') || 'N/A'}</td>
                        <td className="py-4 px-4">{request.record_name.join('') || 'N/A'}</td>
                        <td className="py-4 px-4">{new Date(Number(request.requested_at / 1_000_000n)).toLocaleString()}</td>
                        <td className="py-4 px-4">
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">
                            Pending
                          </span>
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-8">
                        <div className="mx-auto w-16 h-16 rounded-full bg-blue-800/60 flex items-center justify-center mb-4">
                          <Clock className="h-8 w-8 text-cyan-300" />
                        </div>
                        <p className="text-gray-300">You have no pending access requests.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'auditLog' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 rounded-xl border border-blue-400/20">
            <h2 className="text-2xl font-bold text-gray-200 mb-6">Your Activity Log</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-gray-300">
                <thead>
                  <tr className="border-b border-gray-600">
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading && auditLogs.length === 0 ? (
                    <tr><td colSpan="3" className="text-center py-8">Loading logs...</td></tr>
                  ) : auditLogs.length > 0 ? (
                    auditLogs.map((log) => (
                      <motion.tr
                        key={log.id.toString()}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="border-b border-gray-800 hover:bg-blue-900/20"
                      >
                        <td className="py-4 px-4 font-medium">{log.action}</td>
                        <td className="py-4 px-4 font-mono text-xs truncate" title={log.target.join('') || 'N/A'}>
                          {log.target.join('') || 'N/A'}
                        </td>
                        <td className="py-4 px-4">{new Date(Number(log.timestamp / 1_000_000n)).toLocaleString()}</td>
                      </motion.tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="text-center py-8">
                        <div className="mx-auto w-16 h-16 rounded-full bg-blue-800/60 flex items-center justify-center mb-4">
                          <Activity className="h-8 w-8 text-cyan-300" />
                        </div>
                        <p className="text-gray-300">No activity has been logged for your account yet.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </div>

      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-card p-8 rounded-2xl border border-white/20 max-w-2xl w-full mx-4"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Request Record Access</h3>
              <button onClick={() => setShowRequestModal(false)} className="p-2 hover:bg-gray-800 rounded-lg">
                <X className="h-6 w-6 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Search Patient by Name</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
                    placeholder="Enter patient name..."
                  />
                  <button onClick={handleSearchPatients} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                    <Search size={16} />
                  </button>
                </div>
              </div>

              {searchResults.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Select Patient</label>
                  <ul className="max-h-40 overflow-y-auto bg-gray-800/50 rounded-lg p-2 space-y-1">
                    {searchResults.map((patient) => (
                      <li
                        key={patient.principal_text}
                        onClick={() => setSelectedPatient(patient)}
                        className={`p-2 rounded-md cursor-pointer ${selectedPatient?.principal_text === patient.principal_text ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                      >
                        <p className="font-semibold">{patient.name.join('')}</p>
                        <p className="text-xs text-gray-400 font-mono">{patient.principal_text}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedPatient && (
                <div className="p-4 bg-blue-900/30 rounded-lg">
                  <p className="text-white">Selected Patient: <span className="font-bold">{selectedPatient.name.join('')}</span></p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Record ID</label>
                <input
                  type="text"
                  value={recordIdToRequest}
                  onChange={(e) => setRecordIdToRequest(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white"
                  placeholder="Enter the specific Record ID you are requesting"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Reason for Request</label>
                <textarea
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white h-24"
                  placeholder="e.g., 'Requesting access for follow-up consultation regarding recent lab results.'"
                />
              </div>
            </div>

            <div className="flex space-x-4 mt-8">
              <button onClick={() => setShowRequestModal(false)} className="flex-1 px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg">
                Cancel
              </button>
              <button
                onClick={handleSendAccessRequest}
                disabled={!selectedPatient || !recordIdToRequest || !requestMessage || isLoading}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showVerificationModal && (
        <VerificationModal
          onClose={() => setShowVerificationModal(false)}
          actor={actor}
          handleToast={handleToast}
          onSuccess={() => {
            setShowVerificationModal(false);
            fetchDoctorData(); // Refresh profile to show "Pending" status
            // Refetch data to show the "Pending" status immediately
            // We set isLoading to true to show a loading state on the badge
            setIsLoading(true);
            fetchDoctorData().finally(() => {
              setIsLoading(false);
            });
          }}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

const VerificationModal = ({ onClose, actor, handleToast, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      handleToast('Please select a file to upload.', 'error');
      return;
    }
    setIsUploading(true);
    try {
      // Step 1: Upload file to IPFS
      const cid = await uploadFileToIPFS(file);
      if (!cid) {
        throw new Error('Failed to upload file to IPFS.');
      }
      handleToast('Proof of identity uploaded to IPFS.', 'info');

      // Step 2: Submit CID to the backend
      const result = await actor.submit_identity_verification(cid);
      if (result.Ok) {
        handleToast('Verification submitted successfully! An admin will review it shortly.', 'success');
        onSuccess();
      } else {
        throw new Error(result.Err);
      }
    } catch (error) {
      handleToast(`Submission failed: ${error.message}`, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card p-8 rounded-2xl border border-white/20 max-w-lg w-full mx-4"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-white">Submit for Verification</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg">
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>
        <p className="text-gray-300 mb-4">
          To get verified as a doctor, please upload a clear image of your medical license or other professional identification.
        </p>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">Proof of Identity</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <UploadCloud className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-400">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-cyan-400 hover:text-cyan-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-cyan-500">
                  <span>Upload a file</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">{file ? file.name : 'PDF, PNG, JPG up to 10MB'}</p>
            </div>
          </div>
        </div>
        <div className="flex space-x-4 mt-8">
          <button onClick={onClose} className="flex-1 px-6 py-3 bg-gray-700 text-white font-semibold rounded-lg">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || isUploading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg disabled:opacity-50"
          >
            {isUploading ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default DoctorDashboard;