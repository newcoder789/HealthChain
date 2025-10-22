import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mlClient } from '../utils/mlClient';

describe('mlClient', () => {
  let fetchMock;
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    fetchMock = vi.fn();
    global.fetch = fetchMock;
    
    // Clear localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('getBaseUrl', () => {
    it('should return default URL when no override is set', () => {
      const baseUrl = mlClient.getBaseUrl();
      expect(baseUrl).toBe('http://ml-service-9ar8.onrender.com');
    });

    it('should use environment variable when available', () => {
      const originalEnv = import.meta.env;
      import.meta.env = { VITE_ML_GATEWAY_URL: 'https://custom-ml.example.com/' };
      
      const baseUrl = mlClient.getBaseUrl();
      expect(baseUrl).toBe('https://custom-ml.example.com');
      
      import.meta.env = originalEnv;
    });

    it('should prioritize environment variable over localStorage', () => {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('ml_gateway_url', 'https://storage-url.com');
      }
      
      const originalEnv = import.meta.env;
      import.meta.env = { VITE_ML_GATEWAY_URL: 'https://env-url.com' };
      
      const baseUrl = mlClient.getBaseUrl();
      expect(baseUrl).toBe('https://env-url.com');
      
      import.meta.env = originalEnv;
    });

    it('should use localStorage override when no env var is set', () => {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('ml_gateway_url', 'https://local-storage-url.com/');
        const baseUrl = mlClient.getBaseUrl();
        expect(baseUrl).toBe('https://local-storage-url.com');
      }
    });

    it('should handle uppercase localStorage key', () => {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('ML_GATEWAY_URL', 'https://uppercase-url.com/');
        const baseUrl = mlClient.getBaseUrl();
        expect(baseUrl).toBe('https://uppercase-url.com');
      }
    });

    it('should strip trailing slash from URL', () => {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('ml_gateway_url', 'https://example.com///');
        const baseUrl = mlClient.getBaseUrl();
        expect(baseUrl).toBe('https://example.com');
      }
    });

    it('should ignore invalid localStorage values', () => {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('ml_gateway_url', 'not-a-url');
        const baseUrl = mlClient.getBaseUrl();
        expect(baseUrl).toBe('http://ml-service-9ar8.onrender.com');
      }
    });
  });

  describe('createJob', () => {
    it('should create ML job successfully', async () => {
      const mockResponse = {
        job_id: 'job-123',
        status: 'pending',
        type: 'anonymization',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await mlClient.createJob({
        type: 'anonymization',
        input_uri: 'ipfs://QmTest123',
        consent_token: 'consent-abc',
        params: { quality_threshold: 0.8 },
      });

      expect(result).toEqual(mockResponse);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://ml-service-9ar8.onrender.com/ml/jobs',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'anonymization',
            input_uri: 'ipfs://QmTest123',
            consent_token: 'consent-abc',
            params: { quality_threshold: 0.8 },
          }),
        })
      );
    });

    it('should handle missing params parameter', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ job_id: 'job-456', status: 'pending' }),
      });

      const result = await mlClient.createJob({
        type: 'quality_check',
        input_uri: 'ipfs://QmTest456',
        consent_token: 'consent-xyz',
      });

      expect(result.job_id).toBe('job-456');
      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            type: 'quality_check',
            input_uri: 'ipfs://QmTest456',
            consent_token: 'consent-xyz',
            params: {},
          }),
        })
      );
    });

    it('should throw error on network failure', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Network error'));

      await expect(
        mlClient.createJob({
          type: 'anonymization',
          input_uri: 'ipfs://QmTest',
          consent_token: 'token',
        })
      ).rejects.toThrow('ML gateway unreachable');
    });

    it('should throw error on HTTP error status', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal server error',
      });

      await expect(
        mlClient.createJob({
          type: 'anonymization',
          input_uri: 'ipfs://QmTest',
          consent_token: 'token',
        })
      ).rejects.toThrow('ML job creation failed (500): Internal server error');
    });

    it('should handle non-JSON response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(
        mlClient.createJob({
          type: 'anonymization',
          input_uri: 'ipfs://QmTest',
          consent_token: 'token',
        })
      ).rejects.toThrow('Failed to parse ML job creation response');
    });

    it('should handle 400 Bad Request with error details', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => JSON.stringify({ error: 'Invalid consent token' }),
      });

      await expect(
        mlClient.createJob({
          type: 'anonymization',
          input_uri: 'ipfs://QmTest',
          consent_token: 'invalid',
        })
      ).rejects.toThrow('ML job creation failed (400)');
    });
  });

  describe('getJob', () => {
    it('should fetch job status successfully', async () => {
      const mockJob = {
        job_id: 'job-789',
        status: 'succeeded',
        type: 'anonymization',
        result: {
          anonymized_uri: 'ipfs://QmAnon123',
          quality_score: 0.95,
        },
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockJob,
      });

      const result = await mlClient.getJob('job-789');

      expect(result).toEqual(mockJob);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://ml-service-9ar8.onrender.com/ml/jobs/job-789'
      );
    });

    it('should throw error on network failure', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Network error'));

      await expect(mlClient.getJob('job-123')).rejects.toThrow(
        'ML gateway unreachable'
      );
    });

    it('should handle 404 Not Found', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Job not found',
      });

      await expect(mlClient.getJob('non-existent-job')).rejects.toThrow(
        'ML job fetch failed (404): Job not found'
      );
    });

    it('should handle malformed JSON response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      });

      await expect(mlClient.getJob('job-123')).rejects.toThrow(
        'Failed to parse ML job fetch response'
      );
    });
  });

  describe('pollJob', () => {
    it('should poll until job succeeds', async () => {
      const pendingJob = { job_id: 'job-poll-1', status: 'pending' };
      const succeededJob = {
        job_id: 'job-poll-1',
        status: 'succeeded',
        result: { quality_score: 0.9 },
      };

      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => pendingJob,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => pendingJob,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => succeededJob,
        });

      const result = await mlClient.pollJob('job-poll-1', {
        intervalMs: 10,
        maxMs: 1000,
      });

      expect(result).toEqual(succeededJob);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should return failed job immediately', async () => {
      const failedJob = {
        job_id: 'job-fail-1',
        status: 'failed',
        error: 'Processing error',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => failedJob,
      });

      const result = await mlClient.pollJob('job-fail-1', {
        intervalMs: 10,
        maxMs: 1000,
      });

      expect(result).toEqual(failedJob);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('should timeout after maxMs', async () => {
      const pendingJob = { job_id: 'job-timeout', status: 'pending' };

      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => pendingJob,
      });

      const result = await mlClient.pollJob('job-timeout', {
        intervalMs: 50,
        maxMs: 150,
      });

      expect(result.status).toBe('pending');
      expect(fetchMock).toHaveBeenCalled();
    });

    it('should use default polling parameters', async () => {
      const succeededJob = {
        job_id: 'job-default',
        status: 'succeeded',
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => succeededJob,
      });

      const result = await mlClient.pollJob('job-default');

      expect(result).toEqual(succeededJob);
    });

    it('should continue polling on transient network errors', async () => {
      const succeededJob = {
        job_id: 'job-retry',
        status: 'succeeded',
      };

      fetchMock
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockRejectedValueOnce(new TypeError('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => succeededJob,
        });

      const result = await mlClient.pollJob('job-retry', {
        intervalMs: 10,
        maxMs: 1000,
      });

      expect(result).toEqual(succeededJob);
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('should throw on persistent network errors after timeout', async () => {
      fetchMock.mockRejectedValue(new TypeError('Network error'));

      await expect(
        mlClient.pollJob('job-error', { intervalMs: 10, maxMs: 50 })
      ).rejects.toThrow();
    });
  });

  describe('health', () => {
    it('should return health status successfully', async () => {
      const healthData = {
        status: 'healthy',
        version: '1.0.0',
        uptime: 3600,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => healthData,
      });

      const result = await mlClient.health();

      expect(result).toEqual({ ok: true, data: healthData });
      expect(fetchMock).toHaveBeenCalledWith(
        'http://ml-service-9ar8.onrender.com/health'
      );
    });

    it('should handle network errors gracefully', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Network error'));

      const result = await mlClient.health();

      expect(result).toEqual({ ok: false });
    });

    it('should handle HTTP errors gracefully', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const result = await mlClient.health();

      expect(result).toEqual({ ok: false });
    });

    it('should handle non-JSON response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await mlClient.health();

      expect(result).toEqual({ ok: true, data: null });
    });

    it('should handle plain text health response', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      });

      const result = await mlClient.health();

      expect(result.ok).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('validateDirect', () => {
    it('should validate file successfully', async () => {
      const mockFile = new File(['test content'], 'test.dicom', {
        type: 'application/dicom',
      });
      const mockResponse = {
        quality_score: 0.92,
        issues: [],
        anonymization_required: true,
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await mlClient.validateDirect(mockFile, {
        scan_type: 'CT',
      });

      expect(result).toEqual(mockResponse);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://ml-service-9ar8.onrender.com/ml/validate_direct',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
    });

    it('should append metadata to FormData when provided', async () => {
      const mockFile = new File(['test'], 'test.dcm', {
        type: 'application/dicom',
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ quality_score: 0.85 }),
      });

      await mlClient.validateDirect(mockFile, {
        patient_age: 45,
        scan_type: 'MRI',
      });

      const callArgs = fetchMock.mock.calls[0];
      const formData = callArgs[1].body;
      expect(formData).toBeInstanceOf(FormData);
    });

    it('should handle validation without metadata', async () => {
      const mockFile = new File(['test'], 'test.dcm');

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ quality_score: 0.88 }),
      });

      const result = await mlClient.validateDirect(mockFile);

      expect(result.quality_score).toBe(0.88);
    });

    it('should throw error for invalid file input', async () => {
      await expect(mlClient.validateDirect(null)).rejects.toThrow(
        'validateDirect requires a File/Blob'
      );

      await expect(mlClient.validateDirect(undefined)).rejects.toThrow(
        'validateDirect requires a File/Blob'
      );

      await expect(mlClient.validateDirect('not-a-file')).rejects.toThrow(
        'validateDirect requires a File/Blob'
      );
    });

    it('should handle network errors', async () => {
      const mockFile = new File(['test'], 'test.dcm');

      fetchMock.mockRejectedValueOnce(new TypeError('Network error'));

      await expect(mlClient.validateDirect(mockFile)).rejects.toThrow(
        'ML gateway unreachable (validate_direct)'
      );
    });

    it('should handle HTTP errors with details', async () => {
      const mockFile = new File(['test'], 'test.dcm');

      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid file format',
      });

      await expect(mlClient.validateDirect(mockFile)).rejects.toThrow(
        'ML validate_direct failed (400): Invalid file format'
      );
    });

    it('should handle malformed JSON response', async () => {
      const mockFile = new File(['test'], 'test.dcm');

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError('Invalid JSON');
        },
      });

      await expect(mlClient.validateDirect(mockFile)).rejects.toThrow(
        'Failed to parse ML validate_direct response'
      );
    });

    it('should handle Blob input', async () => {
      const mockBlob = new Blob(['test content'], {
        type: 'application/dicom',
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ quality_score: 0.9 }),
      });

      const result = await mlClient.validateDirect(mockBlob);

      expect(result.quality_score).toBe(0.9);
    });

    it('should handle large files', async () => {
      const largeContent = new Uint8Array(10 * 1024 * 1024); // 10MB
      const largeFile = new File([largeContent], 'large.dcm', {
        type: 'application/dicom',
      });

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ quality_score: 0.87 }),
      });

      const result = await mlClient.validateDirect(largeFile);

      expect(result.quality_score).toBe(0.87);
    });
  });

  describe('Error cause chain', () => {
    it('should preserve error cause in createJob', async () => {
      const networkError = new TypeError('Failed to fetch');
      fetchMock.mockRejectedValueOnce(networkError);

      try {
        await mlClient.createJob({
          type: 'test',
          input_uri: 'ipfs://test',
          consent_token: 'token',
        });
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('ML gateway unreachable');
        expect(error.cause).toBe(networkError);
      }
    });

    it('should preserve error cause in getJob', async () => {
      const networkError = new TypeError('Network timeout');
      fetchMock.mockRejectedValueOnce(networkError);

      try {
        await mlClient.getJob('job-123');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('ML gateway unreachable');
        expect(error.cause).toBe(networkError);
      }
    });

    it('should preserve error cause in validateDirect', async () => {
      const mockFile = new File(['test'], 'test.dcm');
      const networkError = new TypeError('CORS error');
      fetchMock.mockRejectedValueOnce(networkError);

      try {
        await mlClient.validateDirect(mockFile);
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('ML gateway unreachable (validate_direct)');
        expect(error.cause).toBe(networkError);
      }
    });
  });

  describe('Integration scenarios', () => {
    it('should support complete ML workflow', async () => {
      // Step 1: Check health
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'healthy' }),
      });

      const healthResult = await mlClient.health();
      expect(healthResult.ok).toBe(true);

      // Step 2: Create job
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ job_id: 'job-integration', status: 'pending' }),
      });

      const jobCreated = await mlClient.createJob({
        type: 'anonymization',
        input_uri: 'ipfs://QmTest',
        consent_token: 'token',
      });

      expect(jobCreated.job_id).toBe('job-integration');

      // Step 3: Poll for completion
      fetchMock
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ job_id: 'job-integration', status: 'pending' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            job_id: 'job-integration',
            status: 'succeeded',
            result: { anonymized_uri: 'ipfs://QmAnon' },
          }),
        });

      const finalJob = await mlClient.pollJob('job-integration', {
        intervalMs: 10,
        maxMs: 1000,
      });

      expect(finalJob.status).toBe('succeeded');
      expect(finalJob.result.anonymized_uri).toBe('ipfs://QmAnon');
    });

    it('should support direct validation workflow', async () => {
      const mockFile = new File(
        ['DICOM content'],
        'patient-scan.dcm',
        { type: 'application/dicom' }
      );

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          quality_score: 0.94,
          issues: ['Missing patient age'],
          recommendations: ['Add patient metadata'],
          anonymization_required: true,
        }),
      });

      const validation = await mlClient.validateDirect(mockFile, {
        scan_type: 'CT',
        body_part: 'chest',
      });

      expect(validation.quality_score).toBe(0.94);
      expect(validation.issues).toContain('Missing patient age');
      expect(validation.anonymization_required).toBe(true);
    });
  });
});