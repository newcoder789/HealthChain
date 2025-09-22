import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Microscope, Database, BarChart3, Download, Search, Filter, Globe, Shield, Users, TrendingUp, Coins } from 'lucide-react';
import AuditLogTable from '../components/AuditLogTable';
import { TokenService } from '../utils/TokenService';
import { useDemo } from '../utils/DemoContext';
import { Protect } from '../components/DeveloperOverlay';

const ResearcherDashboard = () => {
  const [activeTab, setActiveTab] = useState('datasets');
  const { demoMode } = useDemo();
  const [bounties, setBounties] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', tags: '', budget: 0 });
  const [selectedBounty, setSelectedBounty] = useState(null);
  const [datasetCid, setDatasetCid] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(()=>{
    try { setBounties(TokenService.getBounties()); } catch(e) {}
  },[]);

  const mockDatasets = [
    {
      id: 1,
      name: 'Cardiovascular Disease Dataset',
      category: 'Cardiology',
      records: 15420,
      countries: 12,
      timeRange: '2020-2025',
      access: 'approved',
      anonymization: 'full'
    },
    {
      id: 2,
      name: 'Diabetes Type 2 Longitudinal Study',
      category: 'Endocrinology',
      records: 8750,
      countries: 8,
      timeRange: '2018-2024',
      access: 'pending',
      anonymization: 'full'
    },
    {
      id: 3,
      name: 'Cancer Treatment Outcomes',
      category: 'Oncology',
      records: 23100,
      countries: 15,
      timeRange: '2019-2025',
      access: 'approved',
      anonymization: 'differential-privacy'
    }
  ];

  const mockProjects = [
    {
      id: 1,
      name: 'AI-Powered Cardiac Risk Prediction',
      status: 'active',
      progress: 75,
      collaborators: 8,
      datasets: 2
    },
    {
      id: 2,
      name: 'Global Diabetes Prevention Study',
      status: 'planning',
      progress: 25,
      collaborators: 12,
      datasets: 1
    }
  ];

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold gradient-text mb-4">Research Dashboard</h1>
          <p className="text-xl text-gray-300">Access anonymized datasets and conduct breakthrough research</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-6 rounded-xl border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Available Datasets</p>
                <p className="text-2xl font-bold text-white">{mockDatasets.length}</p>
              </div>
              <Database className="h-8 w-8 text-accent-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card p-6 rounded-xl border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Projects</p>
                <p className="text-2xl font-bold text-white">{mockProjects.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-primary-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="glass-card p-6 rounded-xl border border-white/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Records</p>
                <p className="text-2xl font-bold text-white">47.3K</p>
              </div>
              <Users className="h-8 w-8 text-secondary-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-card p-6 rounded-xl border border-white/20"
          >
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
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
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
                    <input
                      type="text"
                      placeholder="Search datasets..."
                      className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-accent-400"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {mockDatasets.map((dataset, index) => (
                  <motion.div
                    key={dataset.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="glass-card p-6 rounded-xl border border-white/20 hover:border-white/30 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-accent-400 to-accent-600 rounded-lg flex items-center justify-center">
                          <Database className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{dataset.name}</h3>
                          <p className="text-sm text-gray-400 mb-2">{dataset.category}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>{dataset.records.toLocaleString()} records</span>
                            <span>•</span>
                            <span>{dataset.countries} countries</span>
                            <span>•</span>
                            <span>{dataset.timeRange}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`px-3 py-1 text-xs rounded-full mb-2 ${
                          dataset.access === 'approved' 
                            ? 'bg-accent-500/20 text-accent-400' 
                            : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {dataset.access}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-primary-400" />
                          <span className="text-xs text-primary-300">{dataset.anonymization}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-400">
                        Privacy-preserved with differential privacy algorithms
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="px-4 py-2 glass-card border border-accent-400/50 text-accent-400 rounded-lg hover:bg-accent-400/10 transition-all duration-200">
                          Request Access
                        </button>
                        {dataset.access === 'approved' && (
                          <button className="px-4 py-2 bg-gradient-to-r from-accent-500 to-primary-500 text-white rounded-lg hover:from-accent-600 hover:to-primary-600 transition-all duration-200">
                            <Download className="h-4 w-4 mr-2 inline" />
                            Download
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'projects' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Research Projects</h2>
                <Protect level="green" label="Bounty (mock)">
                <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-accent-500 to-primary-500 text-white font-semibold rounded-lg hover:from-accent-600 hover:to-primary-600 transition-all duration-200">
                  <Microscope className="h-4 w-4 mr-2" />
                  New Project
                </button>
                </Protect>
              </div>

              <div className="space-y-6">
                {mockProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="glass-card p-6 rounded-xl border border-white/20"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-white mb-2">{project.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {project.collaborators} collaborators
                          </span>
                          <span className="flex items-center">
                            <Database className="h-4 w-4 mr-1" />
                            {project.datasets} datasets
                          </span>
                        </div>
                      </div>

                      <div className={`px-3 py-1 text-xs rounded-full ${
                        project.status === 'active' 
                          ? 'bg-accent-500/20 text-accent-400' 
                          : 'bg-secondary-500/20 text-secondary-400'
                      }`}>
                        {project.status}
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">Progress</span>
                        <span className="text-sm text-white font-medium">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-accent-500 to-primary-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <button className="px-4 py-2 glass-card border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800/50 transition-all duration-200">
                        View Details
                      </button>
                      <button className="px-4 py-2 bg-accent-500/20 text-accent-400 rounded-lg hover:bg-accent-500/30 transition-all duration-200">
                        Collaborate
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Research Marketplace (Demo)</h2>

              <div className="glass-card p-6 rounded-xl border border-white/20 mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Create Bounty</h3>
                <div className="grid md:grid-cols-4 gap-3">
                  <input className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white" placeholder="Title" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
                  <input className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white" placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} />
                  <input className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white" placeholder="Tags (comma)" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} />
                  <input className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white" placeholder="Budget (HCT)" type="number" value={form.budget} onChange={e=>setForm({...form,budget:Number(e.target.value)||0})} />
                </div>
                <div className="mt-3">
                  <Protect level="green" label="Create (mock)">
                    <button onClick={()=>{
                      if (!form.title || !form.budget) { alert('Enter title and budget'); return; }
                      setBusy(true);
                      try {
                        const id = TokenService.createBounty({ title: form.title, description: form.description, tags: (form.tags||'').split(',').map(t=>t.trim()).filter(Boolean), budget: Number(form.budget)||0 });
                        TokenService.depositToEscrow(id, Number(form.budget)||0);
                        setBounties(TokenService.getBounties());
                        alert('Bounty created and funded (demo)');
                        setForm({ title: '', description: '', tags: '', budget: 0 });
                      } finally { setBusy(false); }
                    }} disabled={busy} className="px-4 py-2 bg-indigo-600 text-white rounded inline-flex items-center disabled:opacity-50"><Coins className="h-4 w-4 mr-1"/>{busy ? 'Processing...' : 'Create & Fund'}</button>
                  </Protect>
                </div>
              </div>

              <div className="glass-card p-6 rounded-xl border border-white/20 mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Open Bounties</h3>
                <div className="space-y-3">
                  {bounties.map(b=> (
                    <div key={b.id} className="flex items-center justify-between border border-white/10 rounded p-3">
                      <div className="text-white text-sm">
                        <div className="font-medium">{b.title}</div>
                        <div className="text-xs text-gray-400">Budget: {b.budget} HCT • Participants: {(b.participants||[]).length}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={()=> setSelectedBounty(b)} className="px-3 py-1 bg-gray-700 text-white rounded">Compile Dataset</button>
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
                    <button onClick={()=> { setDatasetCid(`bafy-demo-${Date.now()}`); alert('Dataset compiled (demo)'); }} className="px-3 py-1 bg-emerald-600 text-white rounded">Run Compile</button>
                  </Protect>
                  {datasetCid && (
                    <div className="mt-3 text-sm text-gray-200">Dataset CID: {datasetCid}</div>
                  )}
                  <div className="mt-3">
                    <Protect level="green" label="Distribute (mock)">
                      <button onClick={()=>{ TokenService.distributeBounty(selectedBounty.id); alert('Tokens distributed to participants (demo)'); }} className="px-3 py-1 bg-indigo-600 text-white rounded inline-flex items-center"><Coins className="h-4 w-4 mr-1"/>Distribute Tokens</button>
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
                    <p className="text-gray-300 text-sm">
                      Machine learning models trained on anonymized datasets show 94% accuracy in 
                      predicting cardiovascular events within 5 years.
                    </p>
                  </div>
                  <div className="p-4 bg-secondary-500/10 border border-secondary-500/30 rounded-lg">
                    <p className="text-secondary-300 font-medium mb-2">Diabetes Prevention Patterns</p>
                    <p className="text-gray-300 text-sm">
                      Early intervention programs show 67% effectiveness in preventing Type 2 diabetes 
                      progression in high-risk populations.
                    </p>
                  </div>
                  <div className="p-4 bg-accent-500/10 border border-accent-500/30 rounded-lg">
                    <p className="text-accent-300 font-medium mb-2">Treatment Optimization</p>
                    <p className="text-gray-300 text-sm">
                      Personalized treatment protocols based on genetic and lifestyle factors show 
                      32% improvement in patient outcomes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

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
    </div>
  );
};

export default ResearcherDashboard;