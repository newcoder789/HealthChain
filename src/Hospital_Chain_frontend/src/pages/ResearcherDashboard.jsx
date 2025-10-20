import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Microscope,
  Database,
  BarChart3,
  Download,
  Search,
  Filter,
  Globe,
  Shield,
  Users,
  TrendingUp,
  Coins,
  Plus,
  X,
  Eye,
  Edit3,
  Trash2,
  Calendar,
  Target,
  DollarSign,
  Tag
} from 'lucide-react';
import AuditLogTable from '../components/AuditLogTable';
import { TokenService } from '../utils/TokenService';
import { useDemo } from '../utils/DemoContext';
import { Protect } from '../components/DeveloperOverlay';
import { mlClient } from '../utils/mlClient';
import { dataset_manager } from '../../../declarations/dataset_manager';
import { research_marketplace } from '../../../declarations/research_marketplace';
import { icrc1_ledger } from '../../../declarations/icrc1_ledger';
import { useAuth } from '../utils/AuthContext';

const ResearcherDashboard = () => {
  const [activeTab, setActiveTab] = useState('datasets');
  const { demoMode } = useDemo();
  const { user, isAuthenticated } = useAuth();

  // main data states
  const [bounties, setBounties] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', tags: '', budget: 0 });
  const [selectedBounty, setSelectedBounty] = useState(null);
  const [datasetCid, setDatasetCid] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showDatasetRequestModal, setShowDatasetRequestModal] = useState(false);
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);
  const [showBountyModal, setShowBountyModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [mlJob, setMlJob] = useState(null);
  const [mlStatus, setMlStatus] = useState(null);
  const [aggregatedReport, setAggregatedReport] = useState(null);

  // Form states
  const [newProjectForm, setNewProjectForm] = useState({
    name: '',
    description: '',
    category: '',
    collaborators: '',
    startDate: '',
    endDate: '',
    budget: 0
  });

  const [datasetRequestForm, setDatasetRequestForm] = useState({
    researchPurpose: '',
    dataRequirements: '',
    duration: '',
    ethicalApproval: false,
    institution: ''
  });

  // -------------------------
  // Demo fallbacks
  // -------------------------
  const DEMO_DATASETS = [
    {
      id: 'odir-5k-sample',
      name: 'ODIR-5K (sample)',
      category: 'Ophthalmology',
      records: 5000,
      countries: 4,
      timeRange: '2016-2020',
      access: 'approved',
      anonymization: 'k-anonymity, ε=1.0',
      uri: 'ipfs://bafybeifa6uaf7tdzfo7rj7xc7adlavubu6p454xj22lpui2hlfat6uuu6m'
    },
    {
      id: 'retina-1k-demo',
      name: 'Retina Fundus 1k (demo)',
      category: 'Ophthalmology',
      records: 1200,
      countries: 1,
      timeRange: '2019-2021',
      access: 'pending',
      anonymization: 'k-anonymity',
      uri: 'ipfs://QmDemoRetina1K'
    }
  ];

  const DEMO_PROJECTS = [
    {
      id: 'proj-1',
      name: 'AI-Powered Cardiac Risk Prediction',
      description: 'Develop a model to predict 5-year cardiac events',
      category: 'Cardiology',
      status: 'active',
      progress: 50,
      collaborators: ['alice@uni.edu', 'bob@hospital.org'],
      datasets: 2,
      budget: 5000,
      startDate: '2024-01-01',
      endDate: '2025-01-01'
    },
    {
      id: 'proj-2',
      name: 'Global Diabetes Prevention Study',
      description: 'Longitudinal study of lifestyle interventions',
      category: 'Endocrinology',
      status: 'planning',
      progress: 25,
      collaborators: ['carol@research.org'],
      datasets: 1,
      budget: 12000,
      startDate: '2024-06-01',
      endDate: '2026-06-01'
    }
  ];

  // -------------------------
  // Helpers
  // -------------------------
  const safeCall = async (fn, ...args) => {
    if (!fn) return null;
    try {
      return await fn(...args);
    } catch (err) {
      console.warn('Canister call failed', err);
      return null;
    }
  };

  const normalizeDataset = (raw) => {
    if (!raw) return null;
    const id = raw.id || raw.dataset_id || raw.datasetId || String(raw.name || '').toLowerCase().replace(/\s+/g, '-');
    const name = raw.name || raw.title || raw.dataset_name || 'Untitled Dataset';
    const category = raw.category || (raw.tags && raw.tags[0]) || raw.domain || 'Unknown';
    let records = raw.records || raw.record_count || raw.count || 0;
    try {
      if (typeof records === 'object' && records !== null && 'toString' in records) records = Number(records.toString());
      else records = Number(records || 0);
    } catch {
      records = 0;
    }
    const countries = raw.countries || raw.countryCount || (raw.locations && raw.locations.length) || '—';
    const timeRange = raw.timeRange || raw.date_range || raw.period || '—';
    const approvedFlag = raw.approved === true || raw.access === 'approved' || raw.status === 'approved';
    const access = approvedFlag ? 'approved' : (raw.access || raw.status || 'pending');
    const anonymization = raw.anonymization || raw.privacy || (raw.privacy_level ? String(raw.privacy_level) : 'k-anonymity');
    const uri = raw.anonymized_data_reference || raw.anonymized_uri || raw.cid || raw.ipfs || raw.uri || raw.storage_uri || null;

    return {
      ...raw,
      id,
      name,
      category,
      records: records || 0,
      countries,
      timeRange,
      access,
      anonymization,
      uri
    };
  };

  const parseArtifacts = (art) => {
    if (!art) return null;
    if (typeof art === 'string') {
      try {
        return JSON.parse(art);
      } catch {
        return art;
      }
    }
    return art;
  };

  // -------------------------
  // Load initial data
  // -------------------------
  useEffect(() => {
    try {
      const tokenBounties = TokenService.getBounties ? TokenService.getBounties() : [];
      setBounties(tokenBounties);
    } catch (e) {
      setBounties([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        // datasets
        const rawDatasets = await safeCall(dataset_manager?.list_datasets);
        if (rawDatasets && Array.isArray(rawDatasets) && rawDatasets.length > 0) {
          const mapped = rawDatasets.map(normalizeDataset);
          if (mounted) setDatasets(mapped);
        } else {
          if (mounted) setDatasets(DEMO_DATASETS);
        }

        // projects
        if (user?.principal && research_marketplace?.get_user_projects) {
          const rawProjects = await safeCall(research_marketplace.get_user_projects, user.principal);
          if (rawProjects && Array.isArray(rawProjects) && rawProjects.length > 0) {
            const mapped = rawProjects.map((p) => ({
              id: p.id || p.project_id || `${p.name}-${Math.random().toString(36).slice(2, 6)}`,
              name: p.name || p.title || 'Untitled Project',
              description: p.description || '',
              category: p.category || 'General',
              collaborators: p.collaborators || p.team || [],
              datasets: p.datasets || p.dataset_count || 0,
              progress: Number(p.progress || 0),
              status: p.status || 'active',
              budget: p.budget || 0,
              startDate: p.startDate || p.start_at,
              endDate: p.endDate || p.end_at
            }));
            if (mounted) setProjects(mapped);
          } else {
            if (mounted) setProjects(DEMO_PROJECTS);
          }
        } else {
          if (mounted) setProjects(DEMO_PROJECTS);
        }

        // bounties keep token service result
        const tb = TokenService.getBounties ? TokenService.getBounties() : [];
        if (mounted) setBounties(tb);
      } catch (err) {
        console.error('Error loading dashboard data', err);
        if (mounted) {
          setDatasets(DEMO_DATASETS);
          setProjects(DEMO_PROJECTS);
          setBounties(TokenService.getBounties ? TokenService.getBounties() : []);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [user]);

  // -------------------------
  // Handlers
  // -------------------------
  const handleCreateProject = () => setShowNewProjectModal(true);

  const handleRequestDataset = (dataset) => {
    setSelectedDataset(dataset);
    setShowDatasetRequestModal(true);
  };

  const handleViewProject = (project) => {
    setSelectedProject(project);
    setShowProjectDetailsModal(true);
  };

  const handleCreateBounty = () => setShowBountyModal(true);

  const handleSubmitProject = async () => {
    setBusy(true);
    try {
      const collaborators = newProjectForm.collaborators.split(',').map((c) => c.trim()).filter(Boolean);
      // try canister first
      if (research_marketplace && research_marketplace.create_project) {
        const result = await safeCall(
          research_marketplace.create_project,
          newProjectForm.name,
          newProjectForm.description,
          newProjectForm.category,
          collaborators,
          newProjectForm.startDate || null,
          newProjectForm.endDate || null,
          BigInt(newProjectForm.budget || 0)
        );
        if (result && typeof result === 'object' && 'Err' in result) {
          throw new Error(result.Err);
        }
        // reload projects from canister if possible
        if (user?.principal && research_marketplace.get_user_projects) {
          const projectsResult = await safeCall(research_marketplace.get_user_projects, user.principal);
          if (projectsResult && Array.isArray(projectsResult)) {
            const mapped = projectsResult.map((p) => ({
              id: p.id || p.project_id || `${p.name}-${Math.random().toString(36).slice(2, 6)}`,
              name: p.name || p.title || 'Untitled Project',
              description: p.description || '',
              category: p.category || 'General',
              collaborators: p.collaborators || p.team || [],
              datasets: p.datasets || p.dataset_count || 0,
              progress: Number(p.progress || 0),
              status: p.status || 'active',
              budget: p.budget || 0,
              startDate: p.startDate || p.start_at,
              endDate: p.endDate || p.end_at
            }));
            setProjects(mapped);
          }
        }
      } else {
        // fallback - add to local state
        const newProject = {
          id: `local-${Date.now()}`,
          name: newProjectForm.name,
          description: newProjectForm.description,
          category: newProjectForm.category,
          status: 'planning',
          progress: 0,
          collaborators,
          datasets: 0,
          startDate: newProjectForm.startDate,
          endDate: newProjectForm.endDate,
          budget: newProjectForm.budget
        };
        setProjects((p) => [newProject, ...p]);
      }

      // reset form
      setNewProjectForm({
        name: '',
        description: '',
        category: '',
        collaborators: '',
        startDate: '',
        endDate: '',
        budget: 0
      });
      setShowNewProjectModal(false);
      alert('Project created successfully!');
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleGenerateAggregatedReport = async () => {
    setBusy(true);
    setAggregatedReport(null);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      const report = {
        query: 'Diabetic Retinopathy in ages 40-70',
        matching_records: 47300,
        aggregated_demographics: {
          age_distribution: { '40-50': 12000, '50-60': 18500, '60-70': 16800 },
          gender_distribution: { Male: 0.52, Female: 0.47, Other: 0.01 },
          nationality_distribution: { India: 0.45, USA: 0.25, Germany: 0.15, Other: 0.15 }
        },
        condition_prevalence: { 'Diabetic Retinopathy': 0.15, Cataracts: 0.22, Normal: 0.63 },
        data_quality_summary: { average_score: 0.89, records_above_90_percent: 35000 },
        privacy_guarantee: 'Results generated with k-anonymity (k=50) and differential privacy (epsilon=1.0).'
      };
      setAggregatedReport(report);
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitDatasetRequest = async () => {
    setBusy(true);
    try {
      if (!selectedDataset) throw new Error('No dataset selected');
      const consentToken = 'demo-consent-token';
      const inputUri = selectedDataset.uri || selectedDataset.cid || 'ipfs://QmDemoCID';

      // create on-chain request if supported (best-effort)
      if (dataset_manager && dataset_manager.request_access) {
        try {
          await safeCall(dataset_manager.request_access, selectedDataset.id || selectedDataset.dataset_id || selectedDataset.name, datasetRequestForm.researchPurpose || 'research');
        } catch (e) {
          console.warn('dataset_manager.request_access failed (continuing demo flow)', e);
        }
      }

      // ML pipeline: deid -> report
      const job = await mlClient.createJob({ type: 'deid', input_uri: inputUri, consent_token: consentToken, params: { purpose: datasetRequestForm.researchPurpose } });
      setMlJob(job);
      setMlStatus('queued');

      const deidFinal = await mlClient.pollJob(job.id, { intervalMs: 1200, maxMs: 60000 });
      setMlStatus(deidFinal.status || 'unknown');
      if (!deidFinal || deidFinal.status !== 'succeeded') throw new Error('De-identification failed');

      const anonUri = (deidFinal.artifacts && (deidFinal.artifacts.anonymized_uri || deidFinal.artifacts.anonymized_data_reference)) || inputUri;
      const reportJob = await mlClient.createJob({ type: 'report', input_uri: anonUri, consent_token: consentToken });
      const reportFinal = await mlClient.pollJob(reportJob.id, { intervalMs: 1200, maxMs: 60000 });
      setMlJob(reportFinal);
      setMlStatus(reportFinal.status || 'unknown');

      if (reportFinal && reportFinal.artifacts) {
        const parsed = {};
        for (const k of Object.keys(reportFinal.artifacts)) {
          parsed[k] = parseArtifacts(reportFinal.artifacts[k]);
        }
        setMlJob({ ...reportFinal, artifacts: parsed });
      }

      alert('Anonymization and dataset report generated successfully!');

      setDatasetRequestForm({
        researchPurpose: '',
        dataRequirements: '',
        duration: '',
        ethicalApproval: false,
        institution: ''
      });
      setShowDatasetRequestModal(false);
    } catch (error) {
      console.error('Error submitting dataset request:', error);
      const msg = String(error && (error.message || error));
      if (msg.toLowerCase().includes('unreachable')) {
        alert('ML service is unavailable right now. Please try again later.');
      } else {
        alert('Failed to process ML pipeline. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  // -------------------------
  // UI
  // -------------------------
  const tabs = [
    { id: 'datasets', name: 'Datasets', icon: Database },
    { id: 'projects', name: 'My Projects', icon: BarChart3 },
    { id: 'insights', name: 'Insights', icon: TrendingUp },
    { id: 'audit', name: 'Audit Log', icon: Shield }
  ];

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="mb-8">
          <h1 className="text-4xl font-bold gradient-text mb-4">Research Dashboard</h1>
          <p className="text-xl text-gray-300">Access anonymized datasets and conduct breakthrough research</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="glass-card p-6 rounded-xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Available Datasets</p>
                <p className="text-2xl font-bold text-white">{datasets.length}</p>
              </div>
              <Database className="h-8 w-8 text-accent-400" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="glass-card p-6 rounded-xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Projects</p>
                <p className="text-2xl font-bold text-white">{projects.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary-400" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.2 }} className="glass-card p-6 rounded-xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Records</p>
                <p className="text-2xl font-bold text-white">47.3K</p>
              </div>
              <Users className="h-8 w-8 text-secondary-400" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.3 }} className="glass-card p-6 rounded-xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Collaborations</p>
                <p className="text-2xl font-bold text-white">20</p>
              </div>
              <Globe className="h-8 w-8 text-neon-400" />
            </div>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-white/10 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-accent-400 text-accent-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {/* DATASETS */}
          {activeTab === 'datasets' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Available Datasets</h2>
                <div className="flex items-center space-x-4">
                  <button className="inline-flex items-center px-4 py-2 glass-card border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800/50 transition-all duration-200">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </button>
                  <div className="relative">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input type="text" placeholder="Search datasets..." className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-accent-400" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {datasets.map((dataset, index) => (
                  <motion.div key={dataset.id || index} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: index * 0.05 }} className="glass-card p-6 rounded-xl border border-white/20 hover:border-white/30 transition-all duration-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-accent-400 to-accent-600 rounded-lg flex items-center justify-center">
                          <Database className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{dataset.name}</h3>
                          <p className="text-sm text-gray-400 mb-2">{dataset.category}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>{(dataset.records || 0).toLocaleString()} records</span>
                            <span>•</span>
                            <span>{dataset.countries}</span>
                            <span>•</span>
                            <span>{dataset.timeRange}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`px-3 py-1 text-xs rounded-full mb-2 ${dataset.access === 'approved' ? 'bg-accent-500/20 text-accent-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                          {dataset.access}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-primary-400" />
                          <span className="text-xs text-primary-300">{dataset.anonymization}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-400">Privacy-preserved with differential privacy algorithms</div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => handleRequestDataset(dataset)} className="px-4 py-2 glass-card border border-accent-400/50 text-accent-400 rounded-lg hover:bg-accent-400/10 transition-all duration-200 flex items-center">
                          <Target className="h-4 w-4 mr-2" />Request Access
                        </button>
                        {dataset.access === 'approved' && dataset.uri && (
                          <a href={String(dataset.uri).startsWith('ipfs://') ? `https://ipfs.io/ipfs/${String(dataset.uri).replace('ipfs://','')}` : String(dataset.uri)} target="_blank" rel="noreferrer" className="px-4 py-2 bg-gradient-to-r from-accent-500 to-primary-500 text-white rounded-lg flex items-center">
                            <Download className="h-4 w-4 mr-2" />Download
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* PROJECTS */}
          {activeTab === 'projects' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Research Projects</h2>
                <Protect level="green" label="Bounty (mock)">
                  <button onClick={handleCreateProject} className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-accent-500 to-primary-500 text-white font-semibold rounded-lg hover:from-accent-600 hover:to-primary-600 transition-all duration-200">
                    <Microscope className="h-4 w-4 mr-2" />
                    New Project
                  </button>
                </Protect>
              </div>

              <div className="space-y-6">
                {projects.map((project, index) => (
                  <motion.div key={project.id || index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: index * 0.06 }} className="glass-card p-6 rounded-xl border border-white/20">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">{project.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {Array.isArray(project.collaborators) ? project.collaborators.length : project.collaborators} collaborators
                          </span>
                          <span className="flex items-center">
                            <Database className="h-4 w-4 mr-1" />
                            {project.datasets} datasets
                          </span>
                          <span className="flex items-center">
                            <Tag className="h-4 w-4 mr-1" />
                            {project.category || 'General'}
                          </span>
                        </div>
                      </div>

                      <div className={`px-3 py-1 text-xs rounded-full ${project.status === 'active' ? 'bg-accent-500/20 text-accent-400' : 'bg-secondary-500/20 text-secondary-400'}`}>
                        {project.status}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Progress</span>
                        <span className="text-sm text-white font-medium">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div className="bg-gradient-to-r from-accent-500 to-primary-500 h-2 rounded-full transition-all duration-300" style={{ width: `${project.progress}%` }}></div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <button onClick={() => handleViewProject(project)} className="px-4 py-2 glass-card border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800/50 transition-all duration-200 flex items-center">
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </button>
                      <button className="px-4 py-2 bg-accent-500/20 text-accent-400 rounded-lg hover:bg-accent-500/30 transition-all duration-200 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Collaborate
                      </button>
                      <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 flex items-center" onClick={() => alert('Invite flow (demo)')}>
                        <Plus className="h-4 w-4 mr-2" />
                        Invite
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* INSIGHTS */}
          {activeTab === 'insights' && (
            <div>
              <div className="glass-card p-6 rounded-xl border border-white/20 mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Generate Aggregated Report</h3>
                <p className="text-sm text-gray-400 mb-4">Simulate a research query to generate an aggregated, anonymized report from the patient data pool.</p>
                <div className="flex gap-3">
                  <button onClick={handleGenerateAggregatedReport} disabled={busy} className="px-4 py-2 bg-gradient-to-r from-accent-500 to-primary-500 text-white rounded inline-flex items-center hover:from-accent-600 hover:to-primary-600 transition-colors duration-200 disabled:opacity-50">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    {busy ? 'Generating...' : 'Generate Report: "Diabetic Retinopathy in ages 40-70"'}
                  </button>
                  <button onClick={() => { navigator.clipboard && aggregatedReport && navigator.clipboard.writeText(JSON.stringify(aggregatedReport, null, 2)); alert('Report copied (demo)'); }} disabled={!aggregatedReport} className="px-4 py-2 glass-card border border-gray-600 text-gray-300 rounded-lg">
                    <Download className="h-4 w-4 mr-2" />
                    Export JSON
                  </button>
                </div>

                {aggregatedReport && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 p-4 bg-gray-800/50 rounded-lg">
                    <h4 className="text-md font-semibold text-white mb-2">Aggregated Report Results</h4>
                    <pre className="text-xs text-gray-300 bg-black/30 p-3 rounded-md">{JSON.stringify(aggregatedReport, null, 2)}</pre>
                    <p className="text-xs text-gray-500 mt-2">Note: This is a simulated result. In a real scenario, this data would be generated by a secure enclave querying encrypted embeddings, ensuring no raw patient data is ever exposed.</p>
                  </motion.div>
                )}
              </div>

              <h2 className="text-2xl font-bold text-white mb-6">Research Marketplace (Demo)</h2>

              <div className="glass-card p-6 rounded-xl border border-white/20 mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Create Bounty</h3>
                <div className="grid md:grid-cols-4 gap-3">
                  <input className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  <input className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  <input className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white" placeholder="Tags (comma)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
                  <input className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white" placeholder="Budget (HCT)" type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) || 0 })} />
                </div>
                <div className="mt-3">
                  <Protect level="green" label="Create (mock)">
                    <button onClick={handleCreateBounty} className="px-4 py-2 bg-indigo-600 text-white rounded inline-flex items-center hover:bg-indigo-700 transition-colors duration-200">
                      <Coins className="h-4 w-4 mr-1" />
                      Create & Fund Bounty
                    </button>
                  </Protect>
                </div>
              </div>

              <div className="glass-card p-6 rounded-xl border border-white/20 mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Open Bounties</h3>
                <div className="space-y-3">
                  {bounties.length === 0 && <div className="text-gray-400">No open bounties (demo).</div>}
                  {bounties.map((b) => (
                    <div key={b.id} className="flex items-center justify-between border border-white/10 rounded p-3">
                      <div className="text-white text-sm">
                        <div className="font-medium">{b.title}</div>
                        <div className="text-xs text-gray-400">Budget: {b.budget} HCT • Participants: {(b.participants || []).length}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setSelectedBounty(b)} className="px-3 py-1 bg-gray-700 text-white rounded">Compile Dataset</button>
                        <button onClick={() => { TokenService.joinBounty && TokenService.joinBounty(b.id); alert('Joined bounty (demo)'); }} className="px-3 py-1 bg-emerald-600 text-white rounded">Join</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedBounty && (
                <div className="glass-card p-6 rounded-xl border border-white/20">
                  <h3 className="text-lg font-semibold text-white mb-3">Compile Dataset for: {selectedBounty.title}</h3>
                  <div className="text-sm text-gray-300 mb-3">Simulating anonymization and bundling consenting patient records...</div>
                  <Protect level="green" label="Compile (mock)">
                    <button onClick={() => { setDatasetCid(`bafy-demo-${Date.now()}`); alert('Dataset compiled (demo)'); }} className="px-3 py-1 bg-emerald-600 text-white rounded">Run Compile</button>
                  </Protect>
                  {datasetCid && <div className="mt-3 text-sm text-gray-200">Dataset CID: {datasetCid}</div>}
                  <div className="mt-3">
                    <Protect level="green" label="Distribute (mock)">
                      <button onClick={() => { TokenService.distributeBounty && TokenService.distributeBounty(selectedBounty.id); alert('Tokens distributed to participants (demo)'); }} className="px-3 py-1 bg-indigo-600 text-white rounded inline-flex items-center">
                        <Coins className="h-4 w-4 mr-1" />Distribute Tokens
                      </button>
                    </Protect>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 mt-8">
                <div className="glass-card p-6 rounded-xl border border-white/20">
                  <h3 className="text-lg font-semibold text-white mb-4">Global Health Trends</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Cardiovascular Disease</span>
                      <span className="text-red-400 font-semibold">↑ 12%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Diabetes Type 2</span>
                      <span className="text-yellow-400 font-semibold">↑ 8%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Mental Health</span>
                      <span className="text-accent-400 font-semibold">↓ 5%</span>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-xl border border-white/20">
                  <h3 className="text-lg font-semibold text-white mb-4">Research Impact</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Published Papers</span>
                      <span className="text-primary-400 font-semibold">156</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Citations</span>
                      <span className="text-secondary-400 font-semibold">2,847</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Collaborations</span>
                      <span className="text-accent-400 font-semibold">73</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 rounded-xl border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-4">AI-Generated Insights</h3>
                <div className="space-y-4">
                  <div className="p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg">
                    <p className="text-primary-300 font-medium mb-2">Cardiovascular Risk Prediction</p>
                    <p className="text-gray-300 text-sm">Machine learning models trained on anonymized datasets show 94% accuracy in predicting cardiovascular events within 5 years.</p>
                  </div>
                  <div className="p-4 bg-secondary-500/10 border border-secondary-500/30 rounded-lg">
                    <p className="text-secondary-300 font-medium mb-2">Diabetes Prevention Patterns</p>
                    <p className="text-gray-300 text-sm">Early intervention programs show 67% effectiveness in preventing Type 2 diabetes progression in high-risk populations.</p>
                  </div>
                  <div className="p-4 bg-accent-500/10 border border-accent-500/30 rounded-lg">
                    <p className="text-accent-300 font-medium mb-2">Treatment Optimization</p>
                    <p className="text-gray-300 text-sm">Personalized treatment protocols based on genetic and lifestyle factors show 32% improvement in patient outcomes.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AUDIT */}
          {activeTab === 'audit' && (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">Research Audit Log</h2>
                <p className="text-gray-400">Complete transparency of dataset access and research activities</p>
              </div>
              <AuditLogTable />
            </div>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* New Project Modal */}
        {showNewProjectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card p-8 rounded-2xl border border-white/20 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Create New Research Project</h3>
                <button onClick={() => setShowNewProjectModal(false)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200"><X className="h-6 w-6 text-gray-400" /></button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Project Name</label>
                    <input type="text" value={newProjectForm.name} onChange={(e) => setNewProjectForm((p) => ({ ...p, name: e.target.value }))} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-400" placeholder="Enter project name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                    <select value={newProjectForm.category} onChange={(e) => setNewProjectForm((p) => ({ ...p, category: e.target.value }))} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-400">
                      <option value="">Select category</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Oncology">Oncology</option>
                      <option value="Neurology">Neurology</option>
                      <option value="Endocrinology">Endocrinology</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea value={newProjectForm.description} onChange={(e) => setNewProjectForm((p) => ({ ...p, description: e.target.value }))} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-400 h-24" placeholder="Describe your research project" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                    <input type="date" value={newProjectForm.startDate} onChange={(e) => setNewProjectForm((p) => ({ ...p, startDate: e.target.value }))} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                    <input type="date" value={newProjectForm.endDate} onChange={(e) => setNewProjectForm((p) => ({ ...p, endDate: e.target.value }))} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-400" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Collaborators (comma-separated emails)</label>
                    <input type="text" value={newProjectForm.collaborators} onChange={(e) => setNewProjectForm((p) => ({ ...p, collaborators: e.target.value }))} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-400" placeholder="collaborator1@email.com, collaborator2@email.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Budget (HCT)</label>
                    <input type="number" value={newProjectForm.budget} onChange={(e) => setNewProjectForm((p) => ({ ...p, budget: Number(e.target.value) || 0 }))} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-400" placeholder="0" />
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 mt-8">
                <button onClick={() => setShowNewProjectModal(false)} className="flex-1 px-6 py-3 glass-card border border-gray-600 text-gray-300 font-semibold rounded-lg hover:bg-gray-800/50 transition-all duration-200">Cancel</button>
                <button onClick={handleSubmitProject} disabled={busy || !newProjectForm.name} className="flex-1 px-6 py-3 bg-gradient-to-r from-accent-500 to-primary-500 text-white font-semibold rounded-lg hover:from-accent-600 hover:to-primary-600 transition-all duration-200 disabled:opacity-50">{busy ? 'Creating...' : 'Create Project'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Dataset Request Modal */}
        {showDatasetRequestModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card p-8 rounded-2xl border border-white/20 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Request Dataset Access</h3>
                <button onClick={() => setShowDatasetRequestModal(false)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200"><X className="h-6 w-6 text-gray-400" /></button>
              </div>

              <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-2">{selectedDataset?.name}</h4>
                <p className="text-gray-300 text-sm">{selectedDataset?.category} • {(selectedDataset?.records || 0).toLocaleString()} records</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Research Purpose</label>
                  <textarea value={datasetRequestForm.researchPurpose} onChange={(e) => setDatasetRequestForm((p) => ({ ...p, researchPurpose: e.target.value }))} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-400 h-24" placeholder="Describe your research objectives and how you plan to use this dataset" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Data Requirements</label>
                  <textarea value={datasetRequestForm.dataRequirements} onChange={(e) => setDatasetRequestForm((p) => ({ ...p, dataRequirements: e.target.value }))} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-400 h-20" placeholder="Specify what data fields and time periods you need" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Duration</label>
                    <select value={datasetRequestForm.duration} onChange={(e) => setDatasetRequestForm((p) => ({ ...p, duration: e.target.value }))} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-400">
                      <option value="">Select duration</option>
                      <option value="1-month">1 Month</option>
                      <option value="3-months">3 Months</option>
                      <option value="6-months">6 Months</option>
                      <option value="1-year">1 Year</option>
                      <option value="2-years">2 Years</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Institution</label>
                    <input type="text" value={datasetRequestForm.institution} onChange={(e) => setDatasetRequestForm((p) => ({ ...p, institution: e.target.value }))} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-400" placeholder="Your research institution" />
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <input type="checkbox" id="ethicalApproval" checked={datasetRequestForm.ethicalApproval} onChange={(e) => setDatasetRequestForm((p) => ({ ...p, ethicalApproval: e.target.checked }))} className="w-4 h-4 text-accent-600 bg-gray-800 border-gray-600 rounded focus:ring-accent-500" />
                  <label htmlFor="ethicalApproval" className="text-sm text-gray-300">I have obtained ethical approval for this research</label>
                </div>
              </div>

              <div className="flex space-x-4 mt-8">
                <button onClick={() => setShowDatasetRequestModal(false)} className="flex-1 px-6 py-3 glass-card border border-gray-600 text-gray-300 font-semibold rounded-lg hover:bg-gray-800/50 transition-all duration-200">Cancel</button>
                <button onClick={handleSubmitDatasetRequest} disabled={busy || !datasetRequestForm.researchPurpose} className="flex-1 px-6 py-3 bg-gradient-to-r from-accent-500 to-primary-500 text-white font-semibold rounded-lg hover:from-accent-600 hover:to-primary-600 transition-all duration-200 disabled:opacity-50">{busy ? 'Submitting...' : 'Submit Request'}</button>
              </div>

              {/* ML Job Status */}
              {mlStatus && (
                <div className="mt-6 p-4 bg-gray-800/50 rounded-lg text-gray-300 text-sm">
                  <div>Status: <span className="font-semibold">{mlStatus}</span></div>
                  {mlJob?.artifacts && (
                    <div className="mt-2 space-y-1">
                      {Object.entries(mlJob.artifacts).map(([k, v]) => {
                        const val = typeof v === 'object' ? (v.uri || v.link || JSON.stringify(v)) : v;
                        const href = String(val).startsWith('ipfs://') ? `https://ipfs.io/ipfs/${String(val).replace('ipfs://','')}` : String(val);
                        return (
                          <div key={k} className="flex items-center justify-between">
                            <span className="text-gray-400">{k}</span>
                            <a href={href} target="_blank" rel="noreferrer" className="text-cyan-300 hover:text-cyan-200 underline">Open</a>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Project Details Modal */}
        {showProjectDetailsModal && selectedProject && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card p-8 rounded-2xl border border-white/20 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">{selectedProject.name}</h3>
                <button onClick={() => setShowProjectDetailsModal(false)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200"><X className="h-6 w-6 text-gray-400" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Project Information</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400">Description</label>
                      <p className="text-white">{selectedProject.description || 'No description provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Category</label>
                      <p className="text-white">{selectedProject.category || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Status</label>
                      <span className={`px-3 py-1 text-xs rounded-full ${selectedProject.status === 'active' ? 'bg-accent-500/20 text-accent-400' : 'bg-secondary-500/20 text-secondary-400'}`}>{selectedProject.status}</span>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Progress</label>
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                        <div className="bg-gradient-to-r from-accent-500 to-primary-500 h-2 rounded-full transition-all duration-300" style={{ width: `${selectedProject.progress}%` }}></div>
                      </div>
                      <p className="text-white text-sm mt-1">{selectedProject.progress}%</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Project Details</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400">Collaborators</label>
                      <p className="text-white">{Array.isArray(selectedProject.collaborators) ? selectedProject.collaborators.join(', ') : selectedProject.collaborators}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Datasets</label>
                      <p className="text-white">{selectedProject.datasets || 0} datasets</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Budget</label>
                      <p className="text-white">{selectedProject.budget || 0} HCT</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Timeline</label>
                      <p className="text-white">
                        {selectedProject.startDate ? new Date(selectedProject.startDate).toLocaleDateString() : 'Not set'} - {selectedProject.endDate ? new Date(selectedProject.endDate).toLocaleDateString() : 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex space-x-4">
                <button onClick={() => setShowProjectDetailsModal(false)} className="flex-1 px-6 py-3 glass-card border border-gray-600 text-gray-300 font-semibold rounded-lg hover:bg-gray-800/50 transition-all duration-200">Close</button>
                <button className="flex-1 px-6 py-3 bg-gradient-to-r from-accent-500 to-primary-500 text-white font-semibold rounded-lg hover:from-accent-600 hover:to-primary-600 transition-all duration-200">Edit Project</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Bounty Creation Modal */}
        {showBountyModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card p-8 rounded-2xl border border-white/20 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Create Research Bounty</h3>
                <button onClick={() => setShowBountyModal(false)} className="p-2 hover:bg-gray-800 rounded-lg transition-colors duration-200"><X className="h-6 w-6 text-gray-400" /></button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Bounty Title</label>
                    <input type="text" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-400" placeholder="Enter bounty title" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Budget (HCT)</label>
                    <input type="number" value={form.budget} onChange={(e) => setForm((p) => ({ ...p, budget: Number(e.target.value) || 0 }))} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-400" placeholder="0" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-400 h-24" placeholder="Describe what you're looking for" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Tags (comma-separated)</label>
                  <input type="text" value={form.tags} onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-accent-400" placeholder="cardiology, diabetes, machine-learning" />
                </div>
              </div>

              <div className="flex space-x-4 mt-8">
                <button onClick={() => setShowBountyModal(false)} className="flex-1 px-6 py-3 glass-card border border-gray-600 text-gray-300 font-semibold rounded-lg hover:bg-gray-800/50 transition-all duration-200">Cancel</button>
                <button onClick={async () => {
                  if (!form.title || !form.budget) { alert('Enter title and budget'); return; }
                  setBusy(true);
                  try {
                    const id = TokenService.createBounty ? TokenService.createBounty({
                      title: form.title,
                      description: form.description,
                      tags: (form.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
                      budget: Number(form.budget) || 0
                    }) : `local-bounty-${Date.now()}`;
                    TokenService.depositToEscrow && TokenService.depositToEscrow(id, Number(form.budget) || 0);
                    setBounties(TokenService.getBounties ? TokenService.getBounties() : bounties);
                    alert('Bounty created and funded (demo)');
                    setForm({ title: '', description: '', tags: '', budget: 0 });
                    setShowBountyModal(false);
                  } finally {
                    setBusy(false);
                  }
                }} disabled={busy || !form.title || !form.budget} className="flex-1 px-6 py-3 bg-gradient-to-r from-accent-500 to-primary-500 text-white font-semibold rounded-lg hover:from-accent-600 hover:to-primary-600 transition-all duration-200 disabled:opacity-50">{busy ? 'Processing...' : 'Create & Fund Bounty'}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResearcherDashboard;
