import React, { useState } from 'react';

const steps = [
  { title: 'Login & Register', desc: 'Sign-in with II; role auto-registered if needed.' },
  { title: 'Patient Upload', desc: 'Upload a file; appears in the folder.' },
  { title: 'Doctor Verify', desc: 'Doctor requests verification; admin approves; badge appears.' },
  { title: 'Research Bounty', desc: 'Create bounty, patient consents, compile dataset (mock).' },
  { title: 'Distribute Tokens', desc: 'Distribute HCT (mock); wallet updates; audit log shows it.' }
];

const JudgeTour = () => {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  return (
    <div>
      <button onClick={() => setOpen(true)} className="fixed bottom-4 left-4 bg-indigo-600 text-white px-3 py-2 rounded shadow">Guide for Judges</button>
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-5 w-full max-w-md shadow">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">Judge Tour</h3>
              <button onClick={() => setOpen(false)} className="text-gray-600">✕</button>
            </div>
            <div className="mb-4">
              <div className="text-lg font-medium">{steps[idx].title}</div>
              <div className="text-sm text-gray-600">{steps[idx].desc}</div>
            </div>
            <div className="flex justify-between">
              <button disabled={idx===0} onClick={() => setIdx(i=>i-1)} className="px-3 py-1 rounded bg-gray-100 disabled:opacity-50">Back</button>
              <button onClick={() => setIdx(i=> (i+1)%steps.length)} className="px-3 py-1 rounded bg-indigo-600 text-white">Next</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JudgeTour;


