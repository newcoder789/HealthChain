import React, { useMemo, useState } from 'react';
import { CheckCircle, XCircle, Coins } from 'lucide-react';
import { useAuth } from '../utils/AuthContext';
import { useDemo } from '../utils/DemoContext';
import { TokenService } from '../utils/TokenService';
import seed from '../data/demo-seed.json';

const AdminPortal = () => {
  const { actor } = useAuth();
  const { demoMode } = useDemo();
  const [requests, setRequests] = useState([
    { principal_text: 'aaaaa-admin', name: 'Dr. Sarah Smith', evidence_cid: 'bafy...evid', status: 'pending' },
  ]);
  const [submissions, setSubmissions] = useState([
    { id: 'sub-001', title: 'Eye Imaging — Longitudinal', bountyId: 'bounty-eye-001', status: 'ready' }
  ]);

  const doctorByName = useMemo(() => new Map(seed.users.filter(u => u.role === 'Doctor').map(d => [d.name, d])), []);

  const approveVerification = async (req) => {
    if (!demoMode) {
      const expiresAt = BigInt(Date.now() + 1000 * 60 * 60 * 24 * 365);
      await actor.complete_doctor_verification(req.principal_text, 'HealthChain Admin', expiresAt);
    }
    setRequests(rs => rs.map(r => r.name === req.name ? { ...r, status: 'approved' } : r));
  };

  const rejectVerification = (req) => setRequests(rs => rs.map(r => r.name === req.name ? { ...r, status: 'rejected' } : r));

  const distributeSubmission = (sub) => {
    TokenService.distributeBounty(sub.bountyId);
    setSubmissions(ss => ss.map(s => s.id === sub.id ? { ...s, status: 'distributed' } : s));
  };

  return (
    <div className="pt-24 pb-16 max-w-6xl mx-auto px-4">
      <h1 className="text-3xl font-semibold mb-6">Admin Portal</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-4 shadow">
          <h2 className="font-semibold mb-3">Doctor Verification Requests</h2>
          {requests.map((r, i) => (
            <div key={i} className="flex items-center justify-between border rounded p-3 mb-2">
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-sm text-gray-500">Evidence CID: {r.evidence_cid}</div>
                <div className="text-xs">Status: {r.status}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => approveVerification(r)} className="inline-flex items-center px-3 py-1 bg-emerald-600 text-white rounded"><CheckCircle size={16} className="mr-1"/>Approve</button>
                <button onClick={() => rejectVerification(r)} className="inline-flex items-center px-3 py-1 bg-rose-600 text-white rounded"><XCircle size={16} className="mr-1"/>Reject</button>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <h2 className="font-semibold mb-3">Research Submissions</h2>
          {submissions.map((s) => (
            <div key={s.id} className="flex items-center justify-between border rounded p-3 mb-2">
              <div>
                <div className="font-medium">{s.title}</div>
                <div className="text-xs">Status: {s.status}</div>
              </div>
              <button disabled={s.status !== 'ready'} onClick={() => distributeSubmission(s)} className="inline-flex items-center px-3 py-1 bg-indigo-600 text-white rounded disabled:opacity-50"><Coins size={16} className="mr-1"/>Distribute</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;


