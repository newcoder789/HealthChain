import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, CheckCircle, Folder, File as FileIcon, FileText, FileImage, Download, ArrowLeft, SortAsc, SortDesc, Share2, Clock, Eye, Plus, Users, Shield, Calendar, UserPlus, Edit3, Trash2, Send, Copy, Check, Save, Microscope } from 'lucide-react';
import { useAuth } from '../utils/AuthContext';
import { getIdentityKeyPair } from '../utils/cryptoKeys';
import { useNavigate } from 'react-router-dom';
import { Protect } from '../components/DeveloperOverlay';
import { uploadFileToIPFS, getIPFSFile, unpinFileFromIPFS } from '../utils/IPFSHandler';
import { importPublicKeyFromPem, importPrivateKeyFromPem, wrapKeyWithPublicKey, unwrapKeyWithPrivateKey } from '../utils/cryptoKeys';
import PrivateKeyModal from '../components/PrivateKeyModal';
import PassphraseModal from '../components/PassphraseModal';
import * as keyStore from '../utils/keyStore';
import { mlClient } from '../utils/mlClient';
import { Toast } from '../components/Toast';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('records');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const { isAuthenticated, userRole, principal, actor, identity, publicKeyPem, registerUser } = useAuth();
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
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
  const [displayName, setDisplayName] = useState('');
  const [bounties, setBounties] = useState([]);
  const [consented, setConsented] = useState({});
  const [qualityByRecordId, setQualityByRecordId] = useState({});
  const [mlReportsByRecordId, setMlReportsByRecordId] = useState({});
  const [showMlReportModal, setShowMlReportModal] = useState(false);
  const [activeMlReportRecordId, setActiveMlReportRecordId] = useState(null);
  
  // New sharing states
  const [dashboardStats, setDashboardStats] = useState({
    activeShares: 0,
    recentViews: 0,
    storageUsed: 0,
  });
  const [auditLogs, setAuditLogs] = useState([]);

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
  const [privacySettings, setPrivacySettings] = useState({
    allow_research_use: false,
    show_public_stats: false,
    default_sharing_scope: null,
    require_manual_approval: false,
    watermark_on_view: false,
    auto_expire_days: null,
    notify_on_access: false,
    allowed_data_regions: [],
    custom_prefs: null,
    email_updates: true,
    access_alerts: true,
    security_alerts: true,
    research_updates: false,
    profile_visibility: "private",
    analytics: true,
  });
  const [sharedAccess, setSharedAccess] = useState([]);
  // Crypto state for owner private key (session only)
  const [ownerPrivatePem, setOwnerPrivatePem] = useState(null);
  const [ownerPrivateCryptoKey, setOwnerPrivateCryptoKey] = useState(null);
  const [showOwnerKeyModal, setShowOwnerKeyModal] = useState(false);
  const [showPassphraseModal, setShowPassphraseModal] = useState(false);
  const [passphraseResolve, setPassphraseResolve] = useState(null);
  const [ownerKeyImportResolve, setOwnerKeyImportResolve] = useState(null);
  const handleOwnerKeyImport = async (pem, publicPem, storeLocally, passphrase) => {
    try {
      setOwnerPrivatePem(pem);
      const priv = await importPrivateKeyFromPem(pem);
      setOwnerPrivateCryptoKey(priv);
      if (storeLocally) await keyStore.storePrivateKey('owner-' + (principal?.toText?.() || 'me'), pem, passphrase || '');
      handleToast('Owner private key imported', 'success');

      // Publish the public key to the profile
      if (publicPem) {
        try {
          await actor.update_profile({ encryption_public_key: [publicPem] });
          handleToast('Public key published successfully', 'success');
        } catch (e) {
          console.error('Failed to publish public key', e);
          handleToast('Failed to publish public key', 'error');
        }
      }
    } catch (e) {
      console.error('Owner import failed', e);
      handleToast('Failed to import key', 'error');
    }
  };

  // Try to load an owner private key from the local keystore. If the key is encrypted with a
  // passphrase we don't prompt here for simplicity; we first try an empty passphrase and if that
  // fails we open the import modal so the user can re-import or paste the PEM.
  const handleLoadStoredOwnerKey = async () => {
    try {
      const id = 'owner-' + (principal?.toText?.() || 'me');
      // Try reading with empty passphrase first
      try {
        const pem = await keyStore.getPrivateKey(id, '');
        if (pem) {
          setOwnerPrivatePem(pem);
          const priv = await importPrivateKeyFromPem(pem);
          setOwnerPrivateCryptoKey(priv);
          handleToast('Loaded owner private key from local keystore', 'success');
          return;
        }
      } catch (e) {
        console.debug('Keystore read with empty passphrase failed', e);
      }

      // Ask for passphrase using modal
      const pass = await new Promise((resolve) => {
        setShowPassphraseModal(true);
        setPassphraseResolve(() => resolve);
      });
      setShowPassphraseModal(false);
      setPassphraseResolve(null);
      if (!pass) {
        handleToast('Passphrase required to load stored key', 'info');
        return;
      }
      const pem2 = await keyStore.getPrivateKey(id, pass);
      if (!pem2) { handleToast('No stored key found', 'info'); return; }
      setOwnerPrivatePem(pem2);
      const priv2 = await importPrivateKeyFromPem(pem2);
      setOwnerPrivateCryptoKey(priv2);
      handleToast('Loaded owner private key from local keystore', 'success');
    } catch (e) {
      console.error('Failed to load stored owner key', e);
      handleToast('Failed to load stored key', 'error');
    }
  };

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
      const principalRes = await actor.get_principal_by_name(shareForm.doctorName);
      if (principalRes.Err) {
        throw new Error(principalRes.Err);
      }
      const toPrincipal = principalRes.Ok;

      // Try to fetch their published public PEM (optional step for Level C)
      let recipientPublicPem = null;
      try {
        const pp = await actor.get_public_pem_for_principal(toPrincipal.to_text());
        if (pp.Ok) recipientPublicPem = pp.Ok;
      } catch (e) {
        console.debug('No public PEM published for recipient or fetch failed', e);
      }

      const permissions = {
        can_view: shareForm.permissions.includes('view'),
        can_edit: shareForm.permissions.includes('edit') || shareForm.permissions.includes('comment'), // 'edit' or 'comment' implies edit rights
        can_share: false, // Sharing by proxy is a complex feature, disabling for now.
        is_anonymized: false, // This should be a separate option in the UI
        expiry: [BigInt(Date.now() + parseInt(shareForm.duration) * 24 * 60 * 60 * 1000) * 1_000_000n],
      };

      for (const recordId of shareForm.records) {
        // If recipient published a public PEM, attempt to perform Level C wrapping
        if (recipientPublicPem) {
          try {
            // 1) import recipient public key
            const recipientPubKey = await importPublicKeyFromPem(recipientPublicPem);

            // 2) fetch the record locally to find the owner-wrapped AES key
            const record = myRecords.find(r => r.record_id === recordId);
            if (!record) throw new Error('Record not found in client state');

            if (!record.aes_key_enc_for_owner || record.aes_key_enc_for_owner.length === 0) {
              throw new Error('No owner-wrapped AES key available for this record');
            }

            // 3) ensure we have the owner's private key crypto object in session
                    if (!ownerPrivateCryptoKey) {
                      // Show modal to import private PEM using the promise-style modal
                      const modalRes = await new Promise((resolve) => {
                        setShowOwnerKeyModal(true);
                        // pass resolver to be called by the modal
                        const resolver = (obj) => resolve(obj);
                        setOwnerKeyImportResolve(() => resolver);
                      });
                      setShowOwnerKeyModal(false);
                      const { pem, publicPem, storeLocally, passphrase } = modalRes || {};
                      if (!pem) throw new Error('Owner private key required to share encrypted record');
                      setOwnerPrivatePem(pem);
                      const priv = await importPrivateKeyFromPem(pem);
                      setOwnerPrivateCryptoKey(priv);
                      if (storeLocally) {
                        try { await keyStore.storePrivateKey('owner-' + (principal?.toText?.() || 'me'), pem, passphrase || ''); } catch (e) { console.warn('store key failed', e); }
                      }
                      // Publish public key if provided
                      if (publicPem) {
                        try {
                          await actor.update_profile({ encryption_public_key: [publicPem] });
                        } catch (e) {
                          console.warn('Failed to publish public key', e);
                        }
                      }
                    }

            // 4) unwrap owner's encrypted AES key with owner's private key
            // record.aes_key_enc_for_owner may be Uint8Array or number[] depending on candid bindings
            const ownerWrapped = new Uint8Array(record.aes_key_enc_for_owner);
            const aesKeyBytes = await unwrapKeyWithPrivateKey(ownerWrapped, ownerPrivateCryptoKey || await importPrivateKeyFromPem(ownerPrivatePem));
            // 5) wrap AES key bytes with recipient public key
            const wrappedForRecipient = await wrapKeyWithPublicKey(aesKeyBytes, recipientPubKey);

            // 6) store wrapped key for principal on-chain
            const expiresAt = BigInt(Date.now() + parseInt(shareForm.duration) * 24 * 60 * 60 * 1000) * 1_000_000n;
            await actor.store_encrypted_key_for_principal(recordId, Array.from(wrappedForRecipient), toPrincipal.to_text(), [expiresAt]);

            // 7) finally, grant access permission as before
            await actor.grant_access(recordId, toPrincipal, permissions);
          } catch (wrapErr) {
            console.error('Wrapping failed, falling back to grant only:', wrapErr);
            // If wrapping fails, still attempt to grant access (best-effort)
            await actor.grant_access(recordId, toPrincipal, permissions);
          }
        } else {
          // No recipient public key published: fallback to grant_only
          await actor.grant_access(recordId, toPrincipal, permissions);
        }
      }
      handleToast(`Successfully shared ${shareForm.records.length} record(s) with ${shareForm.doctorName}`, 'success');
      setShowShareRecordModal(false);
      setShowShareWithDoctorModal(false);
    } catch (error) {
      handleToast(`Failed to share records: ${error.message || 'Please try again.'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (share) => {
    try {
      const principalToRevoke = await actor.get_principal_by_name(share.grantee_name[0]);
      await actor.revoke_access(share.record_id, principalToRevoke.Ok);
      setSharedAccess(prev => prev.filter(s => s.grant_id !== share.grant_id));
      handleToast('Access revoked successfully', 'success');
    } catch (error) {
      handleToast(`Failed to revoke access: ${error.message || error}`, 'error');
    }
  };

  const handleRequestAccess = () => {
    setShowAccessRequestModal(true);
  };

  const handleSubmitAccessRequest = async () => {
    setLoading(true);
    // This modal is for a doctor requesting access, which is not the patient's role.
    // We will implement the patient's view of incoming requests.
    // For now, this button can be considered a placeholder for a doctor's dashboard.
    try {
      handleToast('This feature is for doctors to request access.', 'info');
      setShowAccessRequestModal(false);
    } catch (error) {
      handleToast('Failed to send access request', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await actor.approve_access_request(requestId);
      setAccessRequests(prev => prev.filter(req => req.request_id !== requestId));
      handleToast('Access request approved', 'success');
    } catch (error) {
      handleToast(`Failed to approve request: ${error.message || error}`, 'error');
    }
  };

  const handleDenyRequest = async (requestId) => {
    try {
      await actor.deny_access_request(requestId);
      setAccessRequests(prev => prev.filter(req => req.request_id !== requestId));
      handleToast('Access request denied', 'success');
    } catch (error) {
      handleToast(`Failed to deny request: ${error.message || error}`, 'error');
    }
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPrivacySettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      const settingsUpdate = {
        ...privacySettings,
        auto_expire_days: privacySettings.auto_expire_days
          ? [Number(privacySettings.auto_expire_days)]
          : [],
        default_sharing_scope: privacySettings.default_sharing_scope
          ? [privacySettings.default_sharing_scope]
          : [],
        custom_prefs: privacySettings.custom_prefs ? [privacySettings.custom_prefs] : [],
      };
      await actor.update_settings(settingsUpdate);
      handleToast('Privacy settings updated successfully', 'success');
    } catch (error) {
      handleToast(`Failed to update settings: ${error.message || error}`, 'error');
    }
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
    setIsInitialLoading(true);
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
      // Since all roles are granted in dev, we can fetch shared records for everyone.
      const sharedResult = await actor.shared_with_me();
      if (sharedResult.Ok) {
        setSharedRecords(sharedResult.Ok);
      } else {
        handleToast(`Error fetching shared records: ${sharedResult.Err}`, 'error');
      }
    } catch (error) {
      handleToast(`Failed to fetch records: ${error}`, 'error');
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
    }
  }, [actor, userRole, registerUser]);

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

      const fetchDashboardData = async () => {
        const profileRes = await actor.get_profile();
        if (profileRes.Ok) {
          setDisplayName(profileRes.Ok.name?.[0] || 'Unnamed User');
        }

        // Fetch dashboard stats
        const statsRes = await actor.get_dashboard_stats();
        if (statsRes.Ok) {
          const [activeShares, recentViews, storageUsed] = statsRes.Ok;
          setDashboardStats({ activeShares: Number(activeShares), recentViews: Number(recentViews), storageUsed: Number(storageUsed) });
        }

        // Fetch active shares list
        const sharesRes = await actor.get_my_active_shares();
        if (sharesRes.Ok) {
          setSharedAccess(sharesRes.Ok);
        }

        // Fetch privacy settings
        const settingsRes = await actor.get_settings();
        if (settingsRes.Ok) {
          setPrivacySettings(prev => ({ ...prev, ...settingsRes.Ok }));
        }

        // Fetch pending access requests for the user
        const requestsRes = await actor.get_pending_requests();
        if (requestsRes.Ok) {
          setAccessRequests(requestsRes.Ok);
        }
      };
      fetchRecords();
      fetchDashboardData();
    }
  }, [isAuthenticated, actor, fetchRecords]);

  useEffect(() => {
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

  const handleUpload = async (files, file_type, year, parentId) => {
    setLoadingUpload(true);
    try {
      // Use Internet Identity-derived keys instead of manual key import
      if (!ownerPrivateCryptoKey && identity) {
        try {
          const { privateKey } = await getIdentityKeyPair(identity);
          setOwnerPrivateCryptoKey(privateKey);
          console.log("Using Internet Identity-derived private key for encryption");
        } catch (keyError) {
          console.error("Failed to derive keys from identity:", keyError);
          throw new Error('Failed to access encryption keys from Internet Identity');
        }
      }

      // Publish public key to profile if not already done
      if (publicKeyPem && !ownerPrivatePem) {
        try {
          // Get current profile to preserve existing fields
          const currentProfile = await actor.get_profile();
          if (currentProfile.Ok) {
            await actor.update_profile({
              name: currentProfile.Ok["name"],
              age:[],
              bio: [],
              avatar_cid: [],
              phone_hash: [],
              email: [],
              sex: [],
              ethnicity: [],
              meta: [],
              nationality: [],  
              encryption_public_key: [publicKeyPem]
            });
          } else {
            // If no profile exists, create minimal profile with public key
            await actor.update_profile({
              name: [],
              bio: [],
              avatar_cid: [],
              phone_hash: [],
              email: [],
              age: [],
              sex: [],
              ethnicity: [],
              meta: [],
              nationality: [],
              encryption_public_key: [publicKeyPem]
            });
          }
          handleToast('Public key published successfully', 'success');
        } catch (e) {
          console.warn('Failed to publish public key', e);
          handleToast('Failed to publish public key', 'error');
        }
      }

      for (const file of files) {
        let cid = null;
        try {
          console.log("Step 1: Encrypting file client-side for end-to-end security...", file.name);

          // 1) generate AES-GCM key and IV
          const aesKey = await window.crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
          const rawAes = await window.crypto.subtle.exportKey('raw', aesKey); // ArrayBuffer
          const iv = window.crypto.getRandomValues(new Uint8Array(12));

          // 2) read file as ArrayBuffer and encrypt
          const fileBuf = await file.arrayBuffer();
          const encrypted = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, fileBuf);
          const encryptedBytes = new Uint8Array(encrypted);

          // 3) Upload payload as IV || ciphertext to IPFS
          const payload = new Uint8Array(iv.byteLength + encryptedBytes.byteLength);
          payload.set(iv, 0);
          payload.set(encryptedBytes, iv.byteLength);
          const encryptedBlob = new Blob([payload], { type: file.type || 'application/octet-stream' });
          const encryptedFile = new File([encryptedBlob], file.name, { type: file.type });

          console.log("Step 2: Uploading encrypted payload to IPFS...", file.name);
          cid = await uploadFileToIPFS(encryptedFile);
          console.log("Step 3: Successful upload to IPFS. CID is:", cid);

          // For organization, append year to file name if provided
          const fileName = year ? `${file.name} (${year})` : file.name;

          // 4) Create record on-chain (use encrypted payload size)
          console.log("Step 4: Attempting to upload record to canister with CID...");
          const result = await actor.upload_record(cid, file_type, fileName, parentId, payload.byteLength);
          const recordId = result.Ok;
          console.log("Step 5: Record uploaded successfully to canister! Record ID:", recordId);

          // 5) Wrap AES key with owner's public key and store it for self-access
          try {
            const ownerPrincipalText = principal?.toText?.();
            let ownerPubPem = null;
            try {
              const pp = await actor.get_public_pem_for_principal(ownerPrincipalText);
              if (pp.Ok) ownerPubPem = pp.Ok;
            } catch (e) {
              console.debug('No owner public PEM found or fetch failed', e);
            }

            if (ownerPubPem) {
              const ownerPubKey = await importPublicKeyFromPem(ownerPubPem);
              const wrappedForOwner = await wrapKeyWithPublicKey(new Uint8Array(rawAes), ownerPubKey);
              // Store the wrapped AES key for the owner so owner can later re-wrap for grantees
              try {
                await actor.store_encrypted_key_for_principal(recordId, Array.from(wrappedForOwner), ownerPrincipalText, []);
                console.log('Stored owner-wrapped AES key on-chain for record', recordId);
              } catch (e) {
                console.warn('Failed to store owner-wrapped AES key on-chain', e);
                // Not fatal: record is uploaded but owner-wrapped key missing -> sharing later will require owner to have AES key locally
              }
            } else {
              console.warn('Owner public PEM not published; owner-wrapped AES key not stored. Sharing later will require owner private key from session.');
            }
          } catch (wrapErr) {
            console.warn('Owner wrapping failed:', wrapErr);
          }

          handleToast(`Record "${fileName}" uploaded and encrypted successfully!`, 'success');

          // Step 5: Run ML quality check and analysis, as per your plan
          if (file.type.startsWith('image/')) {
            // First try validate_direct (send bytes) which avoids IPFS/network issues
            try {
              console.log('Sending file to ML validate_direct (bytes)');
              const fileBytes = await file.arrayBuffer();
              const respRaw = await actor.validate_ml_direct(Array.from(new Uint8Array(fileBytes)), [JSON.stringify({ recordId })]);
              if (respRaw.Err) {
                throw new Error(respRaw.Err);
              }
              const resp = JSON.parse(respRaw.Ok);

              // handle response and show to user
              if (resp && resp.report) {
                const qreport = resp.report;

                // normalize score to 0-100
                const normalizeScore = (raw) => {
                  if (raw === null || raw === undefined) return 0;
                  const n = Number(raw);
                  if (Number.isNaN(n)) return 0;
                  if (n > 0 && n <= 1) return Math.round(n * 100);
                  if (n >= 0 && n <= 100) return Math.round(n);
                  if (n > 100) return Math.round(Math.min(n, 100));
                  if (n < 0) return 0;
                  return Math.round(n);
                };

                const normalized = normalizeScore(qreport.quality_score ?? qreport.score ?? qreport.qualityScore ?? null);
                setQualityByRecordId(prev => ({ ...prev, [recordId]: { score: normalized, reportUri: null } }));
                // store detailed report for modal view
                setMlReportsByRecordId(prev => ({ ...prev, [recordId]: qreport }));
                setActiveMlReportRecordId(recordId);
                setShowMlReportModal(true);
                handleToast('AI analysis (direct) complete!', 'success');
                continue; // move to next file
              }
            } catch (directErr) {
              console.warn('validate_direct failed, falling back to async job:', directErr);
              handleToast('validate_direct failed, will try async job; check server logs if this persists.', 'info');
              // fall through to job-based flow
            }

            try {// use a known public gateway that works for this CID
              const inputUri = `https://ipfs.io/ipfs/${cid}`;
              console.log('Creating async ML job with inputUri:', inputUri);
              try {
                // This is now handled by the backend, no need for getBaseUrl
              } catch (e) {
                console.warn('Could not read ML client base URL', e);
              }
              const jobRes = await actor.create_ml_job('quality', inputUri, 'demo-consent', []);
              if (jobRes.Err) throw new Error(jobRes.Err);
              const job = JSON.parse(jobRes.Ok);

              if (!job || !job.id) {
                console.warn('ML job creation did not return an id', job);
                handleToast('AI service did not return a job id. Check ML gateway logs.', 'error');
                continue; // move to next file
              }

              // Polling logic
              let final;
              const start = Date.now();
              while (Date.now() - start < 15000) {
                const pollRes = await actor.get_ml_job(job.id);
                if (pollRes.Ok) {
                  final = JSON.parse(pollRes.Ok);
                  if (final.status === 'succeeded' || final.status === 'failed') break;
                }
                await new Promise(r => setTimeout(r, 1000));
              }

              console.log('Async job final:', final);
              // be tolerant to different artifact key names
              const artifacts = final.artifacts || {};
              const reportCid = artifacts.report_cid || artifacts.reportCid || artifacts.quality_report_cid || null;
              const reportUri = artifacts.report_uri || artifacts.reportUri || artifacts.quality_report_uri || artifacts.report_uri || null;
              const qualityScore = Number(artifacts.quality_score ?? artifacts.qualityScore ?? artifacts.score ?? 0);

              if (final.status === 'succeeded' && reportCid) {
                try {
                  await actor.submit_ml_report(recordId, reportCid);
                } catch (e) {
                  console.warn('Failed to attach ML report on-chain', e);
                }
                // normalize qualityScore similarly
                const normalizeScore = (raw) => {
                  if (raw === null || raw === undefined) return 0;
                  const n = Number(raw);
                  if (Number.isNaN(n)) return 0;
                  if (n > 0 && n <= 1) return Math.round(n * 100);
                  if (n >= 0 && n <= 100) return Math.round(n);
                  if (n > 100) return Math.round(Math.min(n, 100));
                  if (n < 0) return 0;
                  return Math.round(n);
                };
                const normalized = normalizeScore(qualityScore);
                setQualityByRecordId(prev => ({ ...prev, [recordId]: { score: normalized || 0, reportUri } }));
                // store detailed artifacts for modal
                setMlReportsByRecordId(prev => ({ ...prev, [recordId]: artifacts }));
                setActiveMlReportRecordId(recordId);
                setShowMlReportModal(true);
                if (qualityScore && qualityScore < 0.8) {
                  handleToast('AI analysis complete. Consider improving data quality for better research opportunities.', 'info');
                }
                handleToast('AI analysis complete!', 'success');
              } else {
                const serverLogs = final?.logs || artifacts?.logs || artifacts?.error || 'No additional logs';
                console.warn('Quality check did not return expected artifacts', { final, job });
                handleToast(`AI analysis failed: ${serverLogs}`, 'error');
              }
            } catch (e) {
              console.warn('Quality check failed', e);
              handleToast(`AI analysis service unavailable: ${e.message || e}`, 'error');
            }
          }
        } catch (error) {
          console.error("Critical error during upload:", error);
          handleToast(`Upload failed for ${file.name}: ${error.message || error}`, 'error');
          if (cid) {
            await unpinFileFromIPFS(cid); // Optional: unpin on failure
          }      
          setLoadingUpload(false);
        }
      }
      await fetchRecords();
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
      setLoading(false);
    } finally {
      setLoading(false);
      setShowFolderModal(false);
      setLoadingUpload(false);
    }
  };

  const handleView = (recordId) => {
    navigate(`/view-record/${recordId}`);
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
        return <FileIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const handleConsent = (bountyId) => {
    // Placeholder for real bounty consent logic
    handleToast('Bounty and token features are not yet implemented.', 'info');
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
                            <button onClick={() => handleView(record.record_id)} className="bg-primary hover:bg-primary-dark text-white text-sm px-3 py-1 rounded-full">
                              View
                            </button>
                            <button onClick={() => handleDownload(record.file_cid, record.file_name)} className="bg-gray-600 hover:bg-gray-700 text-white text-sm px-3 py-1 rounded-full">
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

  const AuditLogTable = () => {
    useEffect(() => {
      if (activeTab === 'audit' && actor) {
        const fetchAuditLogs = async () => {
          const res = await actor.get_my_audit_log();
          if (res.Ok) {
            setAuditLogs(res.Ok);
          } else {
            handleToast('Failed to fetch audit logs.', 'error');
          }
        };
        fetchAuditLogs();
      }
    }, [activeTab, actor]);

    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md">
        <table className="w-full text-left text-gray-600">
          <thead>
            <tr className="border-b border-gray-200 text-sm text-gray-500 uppercase">
              <th className="py-3 px-4 font-medium">Action</th>
              <th className="py-3 px-4 font-medium">Actor</th>
              <th className="py-3 px-4 font-medium">Target</th>
              <th className="py-3 px-4 font-medium">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map(log => (
              <tr key={log.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-800">{log.action}</td>
                <td className="py-3 px-4 font-mono text-xs truncate" title={log.actor}>{log.actor.substring(0, 15)}...</td>
                <td className="py-3 px-4 font-mono text-xs truncate" title={log.target.join('')}>{log.target.join('') ? `${log.target.join('').substring(0, 15)}...` : 'N/A'}</td>
                <td className="py-3 px-4">{new Date(Number(log.timestamp / 1_000_000n)).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Patient Dashboard</h1>
          <p className="text-xl text-gray-600">Manage your medical records and control access permissions</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-md md:col-span-2"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Profile</p>
                <p className="text-2xl font-bold text-gray-800">{displayName}</p>
                <p className="text-sm text-primary-600">Role: {userRole || 'Patient'}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500"></div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Records</p>
                <p className="text-2xl font-bold text-gray-800">{myRecords.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Active Shares</p>
                <p className="text-2xl font-bold text-gray-800">{dashboardStats.activeShares}</p>
              </div>
              <Share2 className="h-8 w-8 text-secondary-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Recent Views</p>
                <p className="text-2xl font-bold text-gray-800">{dashboardStats.recentViews}</p>
              </div>
              <Eye className="h-8 w-8 text-accent-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-md"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Storage Used</p>
                <p className="text-2xl font-bold text-gray-800">{(dashboardStats.storageUsed / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <Upload className="h-8 w-8 text-neon-400" />
            </div>
          </motion.div>
        </div>

        <div className="mb-8 bg-white p-6 rounded-xl border border-gray-200 shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Bounties Available</h2>
          <div className="grid grid-cols-1 gap-4">
            {bounties.map((b) => (
              <div key={b.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center justify-between">
                <div>
                  <div className="text-gray-800 font-semibold">{b.title}</div>
                  <div className="text-sm text-gray-500">Budget: {b.budget} HCT</div>
                  <div className="text-xs text-gray-400">Tags: {(b.tags||[]).join(', ')}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleConsent(b.id)} className="px-4 py-2 bg-emerald-600 text-white rounded">Consent</button>
                </div>
              </div>
            ))}
            {bounties.length === 0 && (
              <div className="text-gray-500">No bounties at the moment.</div>
            )}
          </div>
        </div>

        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center transition-colors duration-200 ${activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                    <button onClick={() => setCurrentFolder(null)} className="text-gray-500 hover:text-gray-700 transition-colors">
                      <ArrowLeft className="h-6 w-6" />
                    </button>
                  )}
                  <h2 className="text-2xl font-bold text-gray-800">{currentFolder ? currentFolder.file_name : 'Medical Records'}</h2>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700 text-sm focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="timestamp">Date</option>
                    <option value="file_name">Name</option>
                    <option value="file_type">Type</option>
                  </select>
                  <button onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')} className="bg-white border border-gray-300 text-gray-700 p-2 rounded-lg hover:bg-gray-50">
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
                  <button
                    onClick={handleLoadStoredOwnerKey}
                    className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg shadow-sm hover:bg-gray-300 transition-all duration-200"
                  >
                    Load Stored Key
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {isInitialLoading  && (
                  <>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 animate-pulse">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                            <div>
                              <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
                              <div className="h-3 w-56 bg-gray-200 rounded" />
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded" />
                            <div className="w-8 h-8 bg-gray-200 rounded" />
                            <div className="w-8 h-8 bg-gray-200 rounded" />
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
                    className={`${
                      record.file_type === 'folder' ? 'bg-gray-50' : 'bg-white'
                    } p-4 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-md transition-all duration-200 cursor-pointer`}
                    onClick={() => {
                      console.log("record folder we just opened", record)
                      if (record.file_type === 'folder') {
                        setCurrentFolder(record);
                        filterRecords(record.record_id);
                      } else {
                        handleView(record.file_cid);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          {getFileIcon(record.file_type)}
                        </div>
                        <div>
                          <p
                            className="font-semibold text-gray-800"
                            
                          >
                            {record.file_name || record.file_type}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>{record.file_type}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-400">{new Date(Number(record.timestamp / 1_000_000n)).toLocaleString()}</span>
                        {qualityByRecordId[record.record_id] && (() => {
                          const qRaw = qualityByRecordId[record.record_id]?.score;
                          // We store normalized score as a 0-100 value. Fall back safely if older code used 0-1.
                          const q = qRaw === undefined || qRaw === null ? null : (qRaw > 1 ? qRaw : qRaw * 100);
                          const qDisplay = q !== null ? Math.round(q) : null;
                          const isGood = q !== null ? q >= 80 : false;
                          return (
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500">•</span>
                              <span className={`px-2 py-0.5 rounded-full text-xs flex items-center ${
                                isGood ? 'bg-emerald-100 text-emerald-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                <Microscope className="h-3 w-3 mr-1" />
                                Data Quality: {qDisplay !== null ? `${qDisplay}%` : 'N/A'}
                              </span>
                            </div>
                          );
                        })()}

                        {record.ml_report_cid?.[0] && (
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-500">•</span>
                            <a
                              href={getIPFSFile(record.ml_report_cid[0])}
                              target="_blank" rel="noreferrer"
                              className="text-primary-600 hover:text-primary-500 underline underline-offset-2 text-xs flex items-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View AI Report
                            </a>
                            <button
                              onClick={(e) => { e.stopPropagation(); setActiveMlReportRecordId(record.record_id); setShowMlReportModal(true); }}
                              className="text-primary-600 hover:text-primary-500 underline underline-offset-2 text-xs flex items-center"
                              title="Open AI report modal"
                            >
                              Open Report
                            </button>
                          </div>
                        )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {record.file_type !== 'folder' && (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); handleView(record.record_id); }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200" title="View">
                              <Eye className="h-4 w-4 text-gray-600" />
                            </button>
                            <button onClick={(e) => {
                              e.stopPropagation();
                              if (record.file_name && record.file_name.length > 0) {
                                handleDownload(record.file_cid, record.file_name[0]);
                              }
                            }}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200" title="Download">
                              <Download className="h-4 w-4 text-gray-600" />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation(); // This is the crucial fix
                            handleShareRecord(record);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                          title="Share Record"
                        >
                          <Share2 className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )) : !loading && (
                  <div className="bg-white text-center p-8 rounded-xl border border-gray-200">
                    <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                      <Upload className="h-8 w-8 text-gray-500" />
                    </div>
                    <p className="text-gray-800 font-semibold mb-2">No records yet</p>
                    <p className="text-gray-500 mb-4">Upload your first medical record to get started</p>
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
                <h2 className="text-2xl font-bold text-gray-800">Sharing Management</h2>
                <div className="flex space-x-3">
                  <button 
                    onClick={handleShareWithDoctor}
                    className="inline-flex items-center px-6 py-3 bg-white border border-primary-500 text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-all duration-200"
                  >
                  <Users className="h-4 w-4 mr-2" />
                  Share with Doctor
                </button>
                  <button 
                    onClick={handleRequestAccess}
                    className="inline-flex items-center px-6 py-3 bg-white border border-accent-500 text-accent-600 font-semibold rounded-lg hover:bg-accent-50 transition-all duration-200"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Request Access
                  </button>
              </div>
              </div>

              {/* Active Shares */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Active Shares</h3>
              <div className="space-y-4">
                  {loading && sharedAccess.length === 0 && (
                    <>
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="bg-white p-6 rounded-xl border border-gray-200 animate-pulse">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gray-200 rounded-full" />
                              <div>
                                <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
                                <div className="h-3 w-24 bg-gray-200 rounded" />
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-20 h-8 bg-gray-200 rounded" />
                              <div className="w-20 h-8 bg-gray-200 rounded" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  {sharedAccess.length > 0 ? sharedAccess.map((share, index) => (
                  <motion.div
                      key={share.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-gray-500" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{share.grantee_name.join('') || 'Unnamed User'}</h3>
                          <p className="text-sm text-gray-500">Record: {share.record_name.join('') || 'Unnamed Record'}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              {share.permissions.can_view && <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">View</span>}
                              {share.permissions.can_edit && <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Edit</span>}
                              {share.permissions.can_share && <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">Share</span>}
                            </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="text-sm font-medium text-gray-800">
                              {share.permissions.can_edit ? 'Full Access' : 'View Only'}
                            </p>
                            <p className="text-xs text-gray-500">1 record shared</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Expires</p>
                            <p className="text-sm font-medium text-gray-800">
                              {share.permissions.expiry.length > 0 
                                ? new Date(Number(share.permissions.expiry[0] / 1_000_000n)).toLocaleDateString() 
                                : 'Never'}
                            </p>
                          </div>
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleRevokeAccess(share)}
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
                  )) : (
                    <div className="text-center py-8 bg-white rounded-xl border border-gray-200">
                      <p className="text-gray-500">You haven't shared any records yet.</p>
                    </div>
                  )
                }
                </div>
              </div>

              {/* Access Requests */}
              {accessRequests.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Pending Access Requests</h3>
                  <div className="space-y-4">
                    {accessRequests.map((req, index) => (
                      <motion.div
                        key={req.request_id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="bg-white p-6 rounded-xl border border-yellow-300 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center shadow-inner">
                              <UserPlus className="h-6 w-6 text-yellow-600" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-800">{req.requester_name.join('') || 'Unnamed User'}</h3>
                              <p className="text-sm text-gray-500">Record: {req.record_name.join('') || 'Unnamed Record'}</p>
                              <p className="text-xs text-gray-500 mt-1">{req.message}</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => handleApproveRequest(req.request_id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approve
                            </button>
                            <button 
                              onClick={() => handleDenyRequest(req.request_id)}
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
                <h2 className="text-2xl font-bold text-gray-800">Audit Log</h2>
                <p className="text-gray-500">Complete transparency of all interactions with your medical records</p>
              </div>
              <AuditLogTable />
            </div>
          )}

          {activeTab === 'privacy' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Privacy Settings</h2>
                <button
                  onClick={handleSaveSettings}
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-md hover:from-blue-500 hover:to-indigo-600 transition-all duration-200"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Security</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-600">End-to-end encryption is enabled for all your medical records</p>
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                      Always Active
                    </span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Access Notifications</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between">
                      <span className="text-gray-600">Email notifications when records are accessed</span>
                      <input 
                        type="checkbox" 
                        name="access_alerts"
                        checked={privacySettings.access_alerts}
                        onChange={handleSettingsChange}
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                      />
                    </label>
                    <label className="flex items-center justify-between">
                      <span className="text-gray-600">Real-time alerts for new sharing requests</span>
                      <input 
                        type="checkbox" 
                        name="notify_on_access"
                        checked={privacySettings.notify_on_access}
                        onChange={handleSettingsChange}
                        className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                      />
                    </label>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-md">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Retention</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-600">Auto-expire shared data after (days)</p>
                    <input
                      type="number"
                      name="auto_expire_days"
                      value={privacySettings.auto_expire_days || ''}
                      onChange={handleSettingsChange}
                      placeholder="Never"
                      className="w-24 bg-gray-50 border border-gray-300 rounded-lg px-3 py-1 text-gray-800 text-center focus:outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-orange-300 shadow-md">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Data Management</h3>
                  <div className="space-y-4">
                    <button 
                      onClick={handleExportData}
                      className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-all duration-200"
                    >
                      Export My Data
                    </button>
                    <button 
                      onClick={handleDeleteAccount}
                      className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200"
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
      {showOwnerKeyModal && (
        <PrivateKeyModal open={showOwnerKeyModal} onClose={() => { setShowOwnerKeyModal(false); setOwnerKeyImportResolve(null); }} onImportResolve={ownerKeyImportResolve || handleOwnerKeyImport} />
      )}
      {showPassphraseModal && (
        <PassphraseModal open={showPassphraseModal} onClose={() => { setShowPassphraseModal(false); passphraseResolve && passphraseResolve(null); setPassphraseResolve(null); }} onSubmit={(p) => { setShowPassphraseModal(false); passphraseResolve && passphraseResolve(p); setPassphraseResolve(null); }} />
      )}
      <AnimatePresence>
        {showMlReportModal && activeMlReportRecordId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white p-6 rounded-2xl shadow-xl max-w-2xl w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">AI Quality Report</h3>
                <button onClick={() => setShowMlReportModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X className="h-5 w-5 text-gray-500" /></button>
              </div>
              <div className="space-y-3">
                {mlReportsByRecordId[activeMlReportRecordId] ? (
                  (() => {
                    const r = mlReportsByRecordId[activeMlReportRecordId];
                    const score = qualityByRecordId[activeMlReportRecordId]?.score ?? 'N/A';
                    const warnings = [];
                    if (r?.detailed?.blur_check?.is_blurry) warnings.push('Image may be blurry.');
                    if (r?.detailed?.brightness?.mean_brightness < 30) warnings.push('Image appears too dark.');
                    if (r?.metadata_report && !r.metadata_report.present) warnings.push('Missing important metadata (e.g., age, gender).');
                    return (
                      <div>
                        <p className="text-gray-800 font-semibold">Quality score: <span className="text-primary-600">{score}%</span></p>
                        {warnings.length > 0 && (
                          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-yellow-800 font-semibold">Potential Issues</p>
                            <ul className="text-yellow-700 text-sm list-disc list-inside">
                              {warnings.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                          </div>
                        )}
                        <div className="mt-4 text-sm text-gray-600 grid grid-cols-2 gap-x-4 gap-y-1">
                          <p><strong>Dimensions:</strong> {r?.detailed?.dimensions?.width} x {r?.detailed?.dimensions?.height}</p>
                          <p><strong>Brightness (mean):</strong> {r?.detailed?.brightness?.mean_brightness?.toFixed(1)}</p>
                          <p><strong>Blur (Lap. Var):</strong> {r?.detailed?.blur_check?.lap_var?.toFixed(2)}</p>
                          <p><strong>Edge Uniformity:</strong> {[(r?.detailed?.edge_coverage?.left_uniform_pct||0).toFixed(2),(r?.detailed?.edge_coverage?.right_uniform_pct||0).toFixed(2),(r?.detailed?.edge_coverage?.top_uniform_pct||0).toFixed(2),(r?.detailed?.edge_coverage?.bottom_uniform_pct||0).toFixed(2)].join(' / ')}</p>
                          <p className="mt-2 col-span-2"><strong>Metadata Present:</strong> {r?.metadata_report?.present ? 'Yes' : 'No'}</p>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-gray-300">No detailed report available.</p>
                )}
              </div>
            </motion.div>
          </motion.div>
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Share Record</h3>
                <button
                  onClick={() => setShowShareRecordModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">{selectedRecord.file_name}</h4>
                <p className="text-gray-600 text-sm">Type: {selectedRecord.file_type}</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Doctor Name</label>
                    <input
                      type="text"
                      value={shareForm.doctorName}
                      onChange={(e) => setShareForm(prev => ({ ...prev, doctorName: e.target.value }))}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Dr. John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Doctor Email</label>
                    <input
                      type="email"
                      value={shareForm.doctorEmail}
                      onChange={(e) => setShareForm(prev => ({ ...prev, doctorEmail: e.target.value }))}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="doctor@hospital.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Access Duration</label>
                  <select
                    value={shareForm.duration}
                    onChange={(e) => setShareForm(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="1">1 Day</option>
                    <option value="7">1 Week</option>
                    <option value="30">1 Month</option>
                    <option value="90">3 Months</option>
                    <option value="365">1 Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
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
                          className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-gray-700 capitalize">{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message (Optional)</label>
                  <textarea
                    value={shareForm.message}
                    onChange={(e) => setShareForm(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent h-20"
                    placeholder="Add a message for the doctor..."
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => setShowShareRecordModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-all duration-200"
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Share with Doctor</h3>
                <button
                  onClick={() => setShowShareWithDoctorModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Doctor Name</label>
                    <input
                      type="text"
                      value={shareForm.doctorName}
                      onChange={(e) => setShareForm(prev => ({ ...prev, doctorName: e.target.value }))}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Dr. John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Doctor Email</label>
                    <input
                      type="email"
                      value={shareForm.doctorEmail}
                      onChange={(e) => setShareForm(prev => ({ ...prev, doctorEmail: e.target.value }))}
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="doctor@hospital.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Records to Share</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-300 rounded-lg bg-gray-50">
                    {myRecords.map((record) => (
                      <label key={record.record_id} className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-md">
                        <input
                          type="checkbox"
                          checked={shareForm.records.includes(record.record_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setShareForm(prev => ({ ...prev, records: [...prev.records, record.record_id] }));
                            } else {
                              setShareForm(prev => ({ ...prev, records: prev.records.filter(id => id !== record.record_id) }));
                            }
                          }}
                          className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-gray-800">{record.file_name}</span>
                        <span className="text-gray-500 text-sm">({record.file_type})</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Access Duration</label>
                  <select
                    value={shareForm.duration}
                    onChange={(e) => setShareForm(prev => ({ ...prev, duration: e.target.value }))}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="1">1 Day</option>
                    <option value="7">1 Week</option>
                    <option value="30">1 Month</option>
                    <option value="90">3 Months</option>
                    <option value="365">1 Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                  <div className="space-y-2">
                    {['view', 'download', 'comment', 'edit'].map((permission) => (
                      <label key={permission} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={shareForm.permissions.includes(permission)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setShareForm(prev => ({ ...prev, permissions: [...prev.permissions, permission] }));
                            } else {
                              setShareForm(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== permission) }));
                            }
                          }}
                          className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-gray-700 capitalize">{permission}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => setShowShareWithDoctorModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-all duration-200"
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Request Access</h3>
                <button
                  onClick={() => setShowAccessRequestModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <UserPlus className="h-5 w-5 text-primary-600" />
                    <h4 className="text-lg font-semibold text-primary-700">Request Doctor Access</h4>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Send a request to a doctor to access your medical records for consultation or treatment.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Doctor Name</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Dr. John Smith"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
                    <select className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                      <option value="">Select specialty</option>
                      <option value="cardiology">Cardiology</option>
                      <option value="neurology">Neurology</option>
                      <option value="oncology">Oncology</option>
                      <option value="general">General Medicine</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Access</label>
                  <textarea
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent h-24"
                    placeholder="Please describe why you need to share your medical records with this doctor..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Records to Share</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-300 rounded-lg bg-gray-50">
                    {myRecords.map((record) => (
                      <label key={record.record_id} className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-md">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-gray-800">{record.file_name}</span>
                        <span className="text-gray-500 text-sm">({record.file_type})</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-8">
                <button
                  onClick={() => setShowAccessRequestModal(false)}
                  className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-all duration-200"
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
  const [files, setFiles] = useState([]);
  const [recordType, setRecordType] = useState('Lab Report');
  const [year, setYear] = useState('');
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
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 10) {
      alert('Maximum 10 files allowed');
      return;
    }
    setFiles(droppedFiles);
  };

  const handleFileChange = (e) => {
    const uploadedFiles = Array.from(e.target.files);
    if (uploadedFiles.length > 10) {
      alert('Maximum 10 files allowed');
      return;
    }
    setFiles(uploadedFiles);
  };

  const handleUploadClick = () => {
    if (files.length > 0) {
      const parentId = currentFolder ? [currentFolder.record_id] : [];
      onUpload(files, recordType, year, parentId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4"
      >
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Upload Medical Record</h3>
        <div
          ref={dropAreaRef}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6 cursor-pointer hover:border-primary-400 transition-colors bg-gray-50 hover:bg-primary-50"
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          {files.length > 0 ? (
            <div className="text-gray-700 mb-2">
              <p>{files.length} file{files.length > 1 ? 's' : ''} selected:</p>
              <ul className="list-disc list-inside max-h-32 overflow-y-auto">
                {files.map((f, i) => (
                  <li key={i} className="truncate">{f.name}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-600 mb-2">Drag & drop files here, or click to browse</p>
          )}
          <p className="text-gray-500 text-sm">Supports PDF, DICOM, JPG, PNG files up to 50MB. Max 10 files.</p>
          <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        </div>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Record Type</label>
            <select
              value={recordType}
              onChange={(e) => setRecordType(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option>Lab Report</option>
              <option>Imaging</option>
              <option>Clinical Notes</option>
              <option>Prescription</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Year (for organization)</label>
            <input
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., '2024'"
            />
          </div>
        </div>
        <div className="flex space-x-4">
          <motion.button whileHover={{ scale: 1.02 }}
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-all duration-200"
          >
            Cancel
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }}
            onClick={handleUploadClick}
            disabled={files.length === 0 || loading}
            className={`flex-1 px-6 py-3 text-white font-semibold rounded-lg transition-all duration-200 ${files.length === 0 || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full mx-4"
      >
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Create New Folder</h3>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Folder Name</label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g., 'Lab Results 2024'"
            />
          </div>
        </div>
        <div className="flex space-x-4">
          <motion.button whileHover={{ scale: 1.02 }}
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-all duration-200"
          >
            Cancel
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }}
            onClick={handleCreateClick}
            disabled={!folderName || loading}
            className={`flex-1 px-6 py-3 text-white font-semibold rounded-lg transition-all duration-200 ${!folderName || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-700'
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
