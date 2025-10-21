import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Eye, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useAuth } from '../utils/AuthContext';
import { getIdentityKeyPair } from '../utils/cryptoKeys';
import { getIPFSFile } from '../utils/IPFSHandler';
import { importPrivateKeyFromPem, unwrapKeyWithPrivateKey } from '../utils/cryptoKeys';
import PrivateKeyModal from '../components/PrivateKeyModal';
import PassphraseModal from '../components/PassphraseModal';
import * as keyStore from '../utils/keyStore';
import { Toast } from '../components/Toast';

const RecordViewer = () => {
  const { recordId } = useParams();
  const navigate = useNavigate();
  const { actor, principal, identity } = useAuth();

  const [record, setRecord] = useState(null);
  const [decryptedContent, setDecryptedContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

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

  useEffect(() => {
    const fetchAndDecryptRecord = async () => {
      if (!actor || !recordId) return;

      try {
        setLoading(true);
        setError(null);

        // 1. Fetch all accessible records and find the correct one client-side.
        const [myRecordsRes, sharedRecordsRes] = await Promise.all([
          actor.get_my_records(),
          actor.shared_with_me(),
        ]);

        console.log('--- RecordViewer Debug ---');
        console.log('Record ID from URL:', recordId);
        console.log('My Records Response:', myRecordsRes);

        let recordData = null;
        if (myRecordsRes.Ok) {
          recordData = myRecordsRes.Ok.find(r => r.record_id === recordId);
        }
        console.log('Found in my records:', recordData);

        if (!recordData && sharedRecordsRes.Ok) {
          // The shared_with_me function returns a different structure
          const sharedRecordInfo = sharedRecordsRes.Ok.find(info => info.record.record_id === recordId);
          if (sharedRecordInfo) {
            recordData = sharedRecordInfo.record;
          }
        }
        console.log('Final recordData before check:', recordData);

        if (!recordData) throw new Error("Record not found or you don't have access.");
        setRecord(recordData);

        // 2. Ensure we have the owner's private key
        if (!ownerPrivateCryptoKey) {
          // Try to load from identity first (if available)
          if (identity) {
            try {
              const { privateKey } = await getIdentityKeyPair(identity);
              setOwnerPrivateCryptoKey(privateKey);
              console.log("Using Internet Identity-derived private key for decryption");
            } catch (keyError) {
              console.error("Failed to derive keys from identity:", keyError);
            }
          }

          // If still no key, try loading stored key
          if (!ownerPrivateCryptoKey) {
            await handleLoadStoredOwnerKey();
          }

          // If still no key, prompt user
          if (!ownerPrivateCryptoKey) {
            const modalRes = await new Promise((resolve) => {
              setShowOwnerKeyModal(true);
              setOwnerKeyImportResolve(() => resolve);
            });
            setShowOwnerKeyModal(false);
            const { pem, publicPem, storeLocally, passphrase } = modalRes || {};
            if (!pem) throw new Error('Owner private key required to view encrypted record');
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
        }

        // 3. Get the wrapped AES key for this record
        let wrappedAesKey;
        const isOwner = recordData.owner.toText() === principal.toText();

        if (isOwner) {
          // If the viewer is the owner, use the `aes_key_enc_for_owner` field directly from the record.
          if (!recordData.aes_key_enc_for_owner || recordData.aes_key_enc_for_owner.length === 0) {
            throw new Error("Owner's encrypted key is missing from the record. The record may be corrupted or from an older version.");
          }
          wrappedAesKey = new Uint8Array(recordData.aes_key_enc_for_owner);
        } else {
          // If the viewer is NOT the owner (i.e., a shared user), fetch their specific key.
          const keyResult = await actor.get_my_encrypted_key_for_record(recordId);
          if (keyResult.Err) {
            throw new Error(`Failed to get encryption key for shared record: ${keyResult.Err}`);
          }
          wrappedAesKey = new Uint8Array(keyResult.Ok);
        }

        // 4. Unwrap the AES key using owner's private key
        const aesKeyBytes = await unwrapKeyWithPrivateKey(wrappedAesKey, ownerPrivateCryptoKey);

        // 5. Reconstruct AES key
        const aesKey = await window.crypto.subtle.importKey(
          'raw',
          aesKeyBytes,
          { name: 'AES-GCM', length: 256 },
          false,
          ['decrypt']
        );

        // 6. Fetch encrypted file from IPFS
        const encryptedBlob = await getIPFSFile(recordData.file_cid);
        const encryptedArrayBuffer = await encryptedBlob.arrayBuffer();
        const encryptedData = new Uint8Array(encryptedArrayBuffer);

        // 7. Extract IV and ciphertext (IV is first 12 bytes)
        const iv = encryptedData.slice(0, 12);
        const ciphertext = encryptedData.slice(12);

        // 8. Decrypt the file
        const decrypted = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv },
          aesKey,
          ciphertext
        );

        // 9. Convert to appropriate format based on file type
        const decryptedBlob = new Blob([decrypted], { type: getMimeType(recordData.file_type) });
        const decryptedUrl = URL.createObjectURL(decryptedBlob);

        // For images, create an image element
        if (recordData.file_type.toLowerCase() === 'imaging' || recordData.file_name?.[0]?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
          setDecryptedContent({ type: 'image', url: decryptedUrl });
        }
        // For PDFs, create an iframe or download link
        else if (recordData.file_name?.[0]?.match(/\.pdf$/i)) {
          setDecryptedContent({ type: 'pdf', url: decryptedUrl });
        }
        // For text files, read as text
        else if (recordData.file_name?.[0]?.match(/\.(txt|md|json|xml|html)$/i)) {
          const text = await decryptedBlob.text();
          setDecryptedContent({ type: 'text', content: text });
        }
        // Default: download link
        else {
          setDecryptedContent({ type: 'download', url: decryptedUrl, filename: recordData.file_name?.[0] || 'file' });
        }

      } catch (err) {
        console.error('Error fetching/decrypting record:', err);
        setError(err.message || 'Failed to load record');
        handleToast(`Failed to load record: ${err.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchAndDecryptRecord();
  }, [actor, recordId, principal, identity, ownerPrivateCryptoKey]);

  const getMimeType = (fileType) => {
    switch (fileType.toLowerCase()) {
      case 'imaging':
        return 'image/jpeg'; // Default, could be improved
      case 'lab report':
      case 'clinical notes':
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  };

  const handleDownload = () => {
    if (decryptedContent?.url) {
      const link = document.createElement('a');
      link.href = decryptedContent.url;
      link.download = record?.file_name?.[0] || 'medical_record';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (loading) {
    return (
      <div className="pt-24 pb-16 min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-xl shadow-lg text-center"
        >
          <Loader className="h-12 w-12 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-gray-600">Decrypting and loading record...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-24 pb-16 min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-md p-8 text-center"
          >
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Record</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </button>
            <div className="flex space-x-3">
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-all duration-200"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {record?.file_name?.[0] || 'Medical Record'}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Type: {record?.file_type}</span>
                <span>•</span>
                <span>Uploaded: {record ? new Date(Number(record.timestamp / 1_000_000n)).toLocaleString() : ''}</span>
                <span>•</span>
                <span>Size: {record ? `${(record.file_size / 1024).toFixed(2)} KB` : ''}</span>
              </div>
            </div>

            <div className="p-6">
              {decryptedContent ? (
                <div className="space-y-4">
                  {decryptedContent.type === 'image' && (
                    <div className="text-center">
                      <img
                        src={decryptedContent.url}
                        alt="Medical Record"
                        className="max-w-full h-auto mx-auto rounded-lg shadow-md"
                        style={{ maxHeight: '70vh' }}
                      />
                    </div>
                  )}

                  {decryptedContent.type === 'pdf' && (
                    <div className="h-96">
                      <iframe
                        src={decryptedContent.url}
                        className="w-full h-full border rounded-lg"
                        title="Medical Record PDF"
                      />
                    </div>
                  )}

                  {decryptedContent.type === 'text' && (
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm">
                        {decryptedContent.content}
                      </pre>
                    </div>
                  )}

                  {decryptedContent.type === 'download' && (
                    <div className="text-center py-12">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">Record Decrypted Successfully</h3>
                      <p className="text-gray-600 mb-6">
                        This file type cannot be previewed in the browser. Click download to view the file.
                      </p>
                      <button
                        onClick={handleDownload}
                        className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-all duration-200"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Download {decryptedContent.filename}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Unable to Display Record</h3>
                  <p className="text-gray-600">
                    This record could not be decrypted or displayed. Please ensure you have the correct decryption key.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      {showOwnerKeyModal && (
        <PrivateKeyModal
          open={showOwnerKeyModal}
          onClose={() => { setShowOwnerKeyModal(false); setOwnerKeyImportResolve(null); }}
          onImportResolve={ownerKeyImportResolve || handleOwnerKeyImport}
        />
      )}
      {showPassphraseModal && (
        <PassphraseModal
          open={showPassphraseModal}
          onClose={() => { setShowPassphraseModal(false); passphraseResolve && passphraseResolve(null); setPassphraseResolve(null); }}
          onSubmit={(p) => { setShowPassphraseModal(false); passphraseResolve && passphraseResolve(p); setPassphraseResolve(null); }}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default RecordViewer;
