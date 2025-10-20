// Configure ML gateway via env if available, falls back to localhost for dev
// e.g., set ML_GATEWAY_URL=https://ml.healthchain.dev
function getBaseUrl() {
  try {
    const ls = typeof window !== 'undefined' ? window.localStorage : null;
    // accept either lowercase or uppercase env-style key
    const override = ls ? (ls.getItem('ml_gateway_url') || ls.getItem('ML_GATEWAY_URL')) : null;
    if (override && override.startsWith('http')) return override.replace(/\/$/, '');
  } catch {}
  const envUrl = (typeof process !== 'undefined' && process.env && process.env.ML_GATEWAY_URL) || '';
  return (envUrl || 'http://localhost:8001').replace(/\/$/, '');
}

async function createJob({ type, input_uri, consent_token, params = {} }) {
  const base = getBaseUrl();
  // allow injection of a custom fetch implementation for testing
  const fetchFn = typeof fetch !== 'undefined' ? fetch : undefined;
  let res;
  try {
    res = await (fetchFn || global.fetch)(`${base}/ml/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, input_uri, consent_token, params }),
    });
  } catch (e) {
    // network or CORS errors surface as TypeError in browsers
    const err = new Error('ML gateway unreachable');
    err.cause = e;
    throw err;
  }
  if (!res.ok) {
    // try to include response body for debugging
    let body = null;
    try { body = await res.text(); } catch (_) { }
    throw new Error(`ML job creation failed (${res.status})${body ? `: ${body}` : ''}`);
  }
  try {
    return await res.json();
  } catch (e) {
    const err = new Error('Failed to parse ML job creation response');
    err.cause = e;
    throw err;
  }
}

async function getJob(jobId) {
  const base = getBaseUrl();
  const fetchFn = typeof fetch !== 'undefined' ? fetch : undefined;
  let res;
  try {
    res = await (fetchFn || global.fetch)(`${base}/ml/jobs/${jobId}`);
  } catch (e) {
    const err = new Error('ML gateway unreachable');
    err.cause = e;
    throw err;
  }
  if (!res.ok) {
    let body = null;
    try { body = await res.text(); } catch (_) { }
    throw new Error(`ML job fetch failed (${res.status})${body ? `: ${body}` : ''}`);
  }
  try {
    return await res.json();
  } catch (e) {
    const err = new Error('Failed to parse ML job fetch response');
    err.cause = e;
    throw err;
  }
}

async function pollJob(jobId, { intervalMs = 1000, maxMs = 15000 } = {}) {
  const start = Date.now();
  // allow abort via AbortController on the caller side by passing a signal into options in the future
  // eslint-disable-next-line no-constant-condition
  while (true) {
    let job;
    try {
      job = await getJob(jobId);
    } catch (e) {
      // on transient network/CORS errors, keep retrying until maxMs
      if (Date.now() - start > maxMs) throw e;
      await new Promise(r => setTimeout(r, intervalMs));
      continue;
    }
    if (job.status === 'succeeded' || job.status === 'failed') return job;
    if (Date.now() - start > maxMs) return job; // timeout returns last status
    await new Promise(r => setTimeout(r, intervalMs));
  }
}

async function health() {
  const base = getBaseUrl();
  const fetchFn = typeof fetch !== 'undefined' ? fetch : undefined;
  const res = await (fetchFn || global.fetch)(`${base}/health`).catch(() => null);
  if (!res || !res.ok) return { ok: false };
  try {
    const data = await res.json();
    return { ok: true, data };
  } catch (e) {
    return { ok: true, data: null };
  }
}

async function validateDirect(file, metadata = {}) {
  const base = getBaseUrl();
  const fetchFn = typeof fetch !== 'undefined' ? fetch : undefined;
  const fd = new FormData();
  // Append file (browser File or Blob). If file is a plain object (test), handle accordingly.
  if (file && file instanceof File) {
    fd.append('file', file, file.name);
  } else if (file && file.buffer) {
    // Node-like Buffer (not expected in browser) - skip for now
    fd.append('file', new Blob([file.buffer]), file.name || 'upload');
  } else {
    throw new Error('validateDirect requires a File/Blob');
  }
  if (metadata && Object.keys(metadata).length) fd.append('metadata', JSON.stringify(metadata));

  let res;
  try {
    res = await (fetchFn || global.fetch)(`${base}/ml/validate_direct`, {
      method: 'POST',
      body: fd,
    });
  } catch (e) {
    const err = new Error('ML gateway unreachable (validate_direct)');
    err.cause = e;
    throw err;
  }
  if (!res.ok) {
    let body = null;
    try { body = await res.text(); } catch (_) {}
    throw new Error(`ML validate_direct failed (${res.status})${body ? `: ${body}` : ''}`);
  }
  try {
    return await res.json();
  } catch (e) {
    const err = new Error('Failed to parse ML validate_direct response');
    err.cause = e;
    throw err;
  }
}

export const mlClient = { createJob, getJob, pollJob, health, validateDirect, getBaseUrl };


