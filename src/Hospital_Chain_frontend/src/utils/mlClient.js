// Configure ML gateway via env if available, falls back to localhost for dev
// e.g., set ML_GATEWAY_URL=https://ml.healthchain.dev
function getBaseUrl() {
  try {
    const ls = typeof window !== 'undefined' ? window.localStorage : null;
    const override = ls ? ls.getItem('ml_gateway_url') : null;
    if (override && override.startsWith('http')) return override.replace(/\/$/, '');
  } catch {}
  const envUrl = (typeof process !== 'undefined' && process.env && process.env.ML_GATEWAY_URL) || '';
  return (envUrl || 'http://localhost:8001').replace(/\/$/, '');
}

async function createJob({ type, input_uri, consent_token, params = {} }) {
  let res;
  const base = getBaseUrl();
  try {
    res = await fetch(`${base}/ml/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, input_uri, consent_token, params })
    });
  } catch (e) {
    throw new Error('ML gateway unreachable');
  }
  if (!res.ok) throw new Error(`ML job creation failed (${res.status})`);
  return res.json();
}

async function getJob(jobId) {
  const base = getBaseUrl();
  let res;
  try {
    res = await fetch(`${base}/ml/jobs/${jobId}`);
  } catch (e) {
    throw new Error('ML gateway unreachable');
  }
  if (!res.ok) throw new Error(`ML job fetch failed (${res.status})`);
  return res.json();
}

async function pollJob(jobId, { intervalMs = 1000, maxMs = 15000 } = {}) {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const job = await getJob(jobId);
    if (job.status === 'succeeded' || job.status === 'failed') return job;
    if (Date.now() - start > maxMs) return job; // timeout returns last status
    await new Promise(r => setTimeout(r, intervalMs));
  }
}

async function health() {
  const base = getBaseUrl();
  const res = await fetch(`${base}/health`).catch(() => null);
  if (!res || !res.ok) return { ok: false };
  const data = await res.json();
  return { ok: true, data };
}

export const mlClient = { createJob, getJob, pollJob, health, getBaseUrl };


