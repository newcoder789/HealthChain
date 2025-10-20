import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Shield,
  Key,
  Settings,
  Edit3,
  Save,
  X,
  Eye,
  EyeOff,
  Bell,
  Lock,
  Globe,
  Database,
  Activity,
  Server
} from 'lucide-react';
import { mlClient } from '../utils/mlClient';
import { useAuth } from '../utils/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Toast } from '../components/Toast';

const Profile = () => {
  const { isAuthenticated, userRole, principal, actor, logout } = useAuth();
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const hasFetched = React.useRef(false);

  // --- Consolidated State Management ---
  const [userData, setUserData] = useState({
    profile: {
      displayName: 'Player_unknown',
      email: 'johdoe@example.com',
      role: userRole || 'Nothing',
      principalId: principal || '',
      joinDate: '',
      lastActive: '',
      totalRecords: 0,
      sharedRecords: 0,
      accessCount: 0,
      sex: '',
      age: '',
      bio: '',
      ethnicity: '',
      nationality: ''
    },
    settings: {
      email_updates: true,
      access_alerts: true,
      security_alerts: true,
      research_updates: false,
      profile_visibility: 'private',
      analytics: true,
      allow_research_use: false,
      show_public_stats: false,
      default_sharing_scope: null,
      require_manual_approval: false,
      watermark_on_view: false,
      auto_expire_days: null,
      notify_on_access: false,
      allowed_data_regions: [],
      custom_prefs: null
    },
    mlUrl: '',
  });

  // Function to determine the primary role
  const determinePrimaryRole = (roles) => {
    if (!roles || roles.length === 0) {
      return 'Nothing'; // Or some default role
    }
    // Assuming the first role is the primary role
    return Object.keys(roles[0])[0];
  };


  const [isEditing, setIsEditing] = useState(false);
  const [mlHealth, setMlHealth] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);

  // Load ML URL from local storage on initial render
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('ml_gateway_url');
      if (saved) setUserData(prev => ({ ...prev, mlUrl: saved }));
    } catch { }
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  // Fetch user data from backend
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    const fetchUserData = async () => {
      try {
        if (actor) {
          const userResponse = await actor.get_profile();
          const userDataFromBackend = userResponse.Ok;
          if (!userDataFromBackend) {
            console.error("Failed to get user profile from backend.");
            return;
          }
         
          
          const userProfileData = userDataFromBackend.profile?.[0];
          setUser(userDataFromBackend);

          // Fetch dashboard stats for accurate counts
          const statsRes = await actor.get_dashboard_stats();
          const [activeSharesCount, recentViewsCount, storageUsed] = statsRes.Ok 
            ? [Number(statsRes.Ok[0]), Number(statsRes.Ok[1]), Number(statsRes.Ok[2])] 
            : [0, 0, 0];

          // Get last active time from audit log
          const auditLogRes = await actor.get_my_audit_log();
          const lastActiveTime = (auditLogRes.Ok && auditLogRes.Ok.length > 0)
            ? new Date(Number(auditLogRes.Ok[0].timestamp / 1_000_000n)).toLocaleString()
            : 'N/A';
          // This block now directly sets the state from the backend data,
          // avoiding merging with potentially stale `prev` state during initial load.
          setUserData({
            ...userData, // Keep non-backend related state like mlUrl
            profile: {
              displayName: userDataFromBackend.name?.[0] || '',
              email: userProfileData?.email?.[0] || '',
              role: determinePrimaryRole(userDataFromBackend.roles),
              principalId: principal,
              totalRecords: userDataFromBackend.records?.length || 0,
              sharedRecords: activeSharesCount,
              accessCount: recentViewsCount, // This is the total audit log count
              lastActive: lastActiveTime,
              sex: userProfileData?.sex?.[0] ? Object.keys(userProfileData.sex[0])[0] : '',
              age: userProfileData?.age?.[0] || '',
              bio: userProfileData?.bio?.[0] || '',
              ethnicity: userProfileData?.ethnicity?.[0] || '',
              nationality: userProfileData?.nationality?.[0] || '',
              joinDate: userDataFromBackend.created_at
            },
            settings: { ...userData.settings, ...userDataFromBackend.settings }
          });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    if (actor && !hasFetched.current) {
      fetchUserData();
      hasFetched.current = true; // Set the flag to true after the first fetch
    }
  }, [isAuthenticated, actor, navigate, principal]); // Keep dependencies to trigger on login

  // --- Handlers for User Profile (Personal Information) ---

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      console.log("Actor", actor)
      if (actor) {
        // Prepare the profile object for the backend call
        const profileUpdate = {
          name: userData.profile.displayName ? [userData.profile.displayName] : [],
          avatar_cid: [], // Not implemented in UI yet
          bio: userData.profile.bio ? [userData.profile.bio] : [],
          phone_hash: [],
          email: userData.profile.email ? [userData.profile.email] : [], // Email is part of UserProfile
          age: userData.profile.age ? [userData.profile.age.toString()] : [],
          sex: userData.profile.sex ? [{ [userData.profile.sex]: null }] : [],
          ethnicity: userData.profile.ethnicity ? [userData.profile.ethnicity] : [],
          meta: [],
          nationality: userData.profile.nationality ? [userData.profile.nationality] : []
        };
        const result = await actor.update_profile(profileUpdate);
        if (result.Ok) {
          showToast('Profile updated successfully.', 'success');
          // We need to update the `user` state to reflect the change for the cancel button
          const updatedUser = await actor.get_profile();
          if(updatedUser.Ok) setUser(updatedUser.Ok);
          setIsEditing(false);
        } else {
          // Handle specific error for unique name violation
          showToast(`Failed to update profile: ${result.Err}`, 'error');
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('An unexpected error occurred while updating your profile. Please try again.', 'error');
    }
  };

  const handleCancel = () => {
    // Revert to the last saved state by using the `user` object
    // This avoids another network call and correctly reverts changes.
    const userProfileData = user?.profile?.[0];
    setUserData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        displayName: user.name?.[0] || prev.profile.displayName,
        email: userProfileData?.email?.[0] || prev.profile.email,
        sex: userProfileData?.sex?.[0] ? Object.keys(userProfileData.sex[0])[0] : '',
        age: userProfileData?.age?.[0] || '',
        bio: userProfileData?.bio?.[0] || '',
        ethnicity: userProfileData?.ethnicity?.[0] || '',
        nationality: userProfileData?.nationality?.[0] || '',
      },
    }));
    setIsEditing(false);
  };
  
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [name]: value
      }
    }));
  };

  // --- Handlers for Settings ---
  const handleSaveSettings = async () => {
    try {
      if (actor) {
        // The backend expects the full PrivacySettings object with correct optional types.
        // `null` or `undefined` should be sent as `[]`. Values should be wrapped in an array, e.g., `[value]`.
        const settingsUpdate = {
          ...userData.settings,
          // Ensure optional fields are in the correct format for Candid (opt)
          auto_expire_days: userData.settings.auto_expire_days
            ? [Number(userData.settings.auto_expire_days)]
            : [],
          default_sharing_scope: userData.settings.default_sharing_scope
            ? [userData.settings.default_sharing_scope]
            : [],
          custom_prefs: userData.settings.custom_prefs
            ? [userData.settings.custom_prefs]
            : [],
        };

        // The backend expects auto_expire_days to be nat32, so we ensure it's a number.
        if (settingsUpdate.auto_expire_days.length > 0) {
          settingsUpdate.auto_expire_days[0] = parseInt(settingsUpdate.auto_expire_days[0], 10);
        }

        await actor.update_settings(settingsUpdate);
        showToast('Settings updated successfully', 'success');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      showToast('Failed to update settings. Please try again.', 'error');
    }
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  // --- Handlers for ML Gateway URL ---
  const handleSaveMl = () => {
    try {
      window.localStorage.setItem('ml_gateway_url', userData.mlUrl.trim());
      setMlHealth(null);
      showToast('ML gateway URL saved', 'success');
    } catch (e) {
      showToast('Failed to save ML URL', 'error');
    }
  };

  const handleTestMl = async () => {
    setMlHealth(null);
    const res = await mlClient.health();
    setMlHealth(res.ok ? res.data : { ok: false });
  };

  const handleMlChange = (e) => {
    setUserData(prev => ({
      ...prev,
      mlUrl: e.target.value
    }));
  };

  // --- General Handlers ---
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // --- Helpers for Role styling and icon selection (unchanged) ---
  const getRoleColor = (role) => {
    switch (role) {
      case 'Patient':
        return 'text-primary-400';
      case 'Doctor':
        return 'text-secondary-400';
      case 'Researcher':
        return 'text-accent-400';
      default:
        return 'text-gray-400';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Patient':
        return User;
      case 'Doctor':
        return Shield;
      case 'Researcher':
        return Database;
      default:
        return User;
    }
  };
  const RoleIcon = getRoleIcon(userData.profile.role);

  return (
    <>
    <AnimatePresence>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AnimatePresence>

    <div className="pt-24 pb-16 min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-300 mb-4">
            Profile Settings
          </h1>
          <p className="text-xl text-blue-200">
            Manage your account and privacy preferences
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/60 to-indigo-800/60 shadow-lg mb-6"
            >
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <RoleIcon className="h-12 w-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {userData.profile.displayName}
                </h2>
                <p className={`text-lg font-medium ${getRoleColor(userData.profile.role)}`}>
                  {userData.profile.role}
                </p>  
                <p className="text-sm text-gray-400 mt-2">
                  Member since {user?.created_at ? new Date(Number(user.created_at) / 1e9 * 1000).toLocaleDateString() : '...'}
                </p>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/60 to-indigo-800/60 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Account Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Records</span>
                  <span className="text-white font-semibold">{userData.profile.totalRecords}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Shared Records</span>
                  <span className="text-white font-semibold">{userData.profile.sharedRecords}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Access Count</span>
                  <span className="text-white font-semibold">{userData.profile.accessCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Last Active</span>
                  <span className="text-white font-semibold">{userData.profile.lastActive}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Profile Settings */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              {/* Personal Information */}
              <div className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/70 to-indigo-800/70 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">
                    Personal Information
                  </h3>
                  {!isEditing ? (
                    <button
                      onClick={handleEdit}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSave}
                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Display Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="displayName"
                        value={userData.profile.displayName}
                        onChange={handleProfileChange}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-400"
                      />
                    ) : (
                      <p className="text-white">{userData.profile.displayName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={userData.profile.email}
                        onChange={handleProfileChange}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-400"
                      />
                    ) : (
                      <p className="text-white">{userData.profile.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Role
                    </label>
                    <p className={`text-lg font-medium ${getRoleColor(userData.profile.role)}`}>
                      {userData.profile.role}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Principal ID
                    </label>
                    <div className="flex items-center space-x-2">
                      <p className="text-white font-mono text-sm">{userData.profile.principalId}</p>
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(userData.profile.principalId)
                        }
                        className="p-1 hover:bg-gray-700 rounded transition-colors duration-200"
                      >
                        <Key className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Bio
                    </label>
                    {isEditing ? (
                      <textarea
                        name="bio"
                        value={userData.profile.bio}
                        onChange={handleProfileChange}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-400 h-24"
                        placeholder="Tell us a bit about yourself..."
                      />
                    ) : (
                      <p className="text-white whitespace-pre-wrap">{userData.profile.bio || 'Not set'}</p>
                    )}
                  </div>

                  {/* Age */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Age
                    </label>
                    {isEditing ? (
                      <input
                        type="number"
                        name="age"
                        value={userData.profile.age}
                        onChange={handleProfileChange}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-400"
                      />
                    ) : (
                      <p className="text-white">{userData.profile.age || 'Not set'}</p>
                    )}
                  </div>

                  {/* Sex */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Sex
                    </label>
                    {isEditing ? (
                      <select
                        name="sex"
                        value={userData.profile.sex}
                        onChange={handleProfileChange}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-400"
                      >
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="text-white">{userData.profile.sex || 'Not set'}</p>
                    )}
                  </div>

                  {/* Ethnicity and Nationality */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Ethnicity</label>
                    {isEditing ? <input type="text" name="ethnicity" value={userData.profile.ethnicity} onChange={handleProfileChange} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white" /> : <p className="text-white">{userData.profile.ethnicity || 'Not set'}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nationality</label>
                    {isEditing ? <input type="text" name="nationality" value={userData.profile.nationality} onChange={handleProfileChange} className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white" /> : <p className="text-white">{userData.profile.nationality || 'Not set'}</p>}
                  </div>
                  </div>
              </div>

              {/* Notifications */}
              <div className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/70 to-indigo-800/70 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-white">
                    Notification Preferences
                  </h3>
                  <button
                    onClick={handleSaveSettings}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Settings
                  </button>
                </div>
                <div className="space-y-4">
                  {/* Email Updates */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Email Updates</p>
                      <p className="text-gray-400 text-sm">
                        Receive updates about your account and system changes
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="email_updates"
                        checked={userData.settings.email_updates}
                        onChange={handleSettingsChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-blue-600 transition-all">
                        {/* Toggle knob */}
                      </div>
                    </label>
                  </div>
                  {/* Access Alerts */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Access Alerts</p>
                      <p className="text-gray-400 text-sm">
                        Get notified when someone accesses your records
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="access_alerts"
                        checked={userData.settings.access_alerts}
                        onChange={handleSettingsChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-blue-600 transition-all">
                      </div>
                    </label>
                  </div>
                  {/* Security Alerts */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Security Alerts</p>
                      <p className="text-gray-400 text-sm">
                        Receive security-related notifications
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="security_alerts"
                        checked={userData.settings.security_alerts}
                        onChange={handleSettingsChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-blue-600 transition-all">
                      </div>
                    </label>
                  </div>
                  {/* Research Updates */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Research Updates</p>
                      <p className="text-gray-400 text-sm">
                        Get updates about research opportunities and findings
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="research_updates"
                        checked={userData.settings.research_updates}
                        onChange={handleSettingsChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-blue-600 transition-all">
                      </div>
                    </label>
                  </div>
                  {/* auto expire */}
                  
              </div>

              {/* Privacy Settings */}
              <div className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/70 to-indigo-800/70 shadow-lg">
                <h3 className="text-xl font-semibold text-white mb-6">Privacy Settings</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Profile Visibility
                    </label>
                    <select
                      name="profile_visibility"
                      value={userData.settings.profile_visibility}
                      onChange={handleSettingsChange}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-400"
                    >
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                      <option value="contacts">Contacts Only</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Allow Research Use</p>
                      <p className="text-gray-400 text-sm">
                        Allow your data to be used for research purposes
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="allow_research_use"
                        checked={userData.settings.allow_research_use}
                        onChange={handleSettingsChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-blue-600 transition-all">
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Show Public Stats</p>
                      <p className="text-gray-400 text-sm">
                        Display your contribution statistics publicly
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="show_public_stats"
                        checked={userData.settings.show_public_stats}
                        onChange={handleSettingsChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-blue-600 transition-all">
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Require Manual Approval</p>
                      <p className="text-gray-400 text-sm">
                        Require manual approval for all data access requests
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="require_manual_approval"
                        checked={userData.settings.require_manual_approval}
                        onChange={handleSettingsChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-blue-600 transition-all">
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Watermark on View</p>
                      <p className="text-gray-400 text-sm">
                        Add watermark when records are viewed
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="watermark_on_view"
                        checked={userData.settings.watermark_on_view}
                        onChange={handleSettingsChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-blue-600 transition-all">
                      </div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Notify on Access</p>
                      <p className="text-gray-400 text-sm">
                        Get notified when your records are accessed
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="notify_on_access"
                        checked={userData.settings.notify_on_access}
                        onChange={handleSettingsChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-blue-600 transition-all">
                      </div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Auto Expire Days</p>
                      <p className="text-gray-400 text-sm">
                        Set in how many days your shared data should expire automatically.
                      </p>
                    </div>
                    <input
                      type="number"
                      name="auto_expire_days"
                      value={userData.settings.auto_expire_days || ''}
                      onChange={handleSettingsChange}
                      placeholder="Days"
                      className="w-24 bg-gray-800 border border-gray-600 rounded-lg px-3 py-1 text-white text-center focus:outline-none focus:border-blue-400"
                    />
                  </div>
                </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Analytics & Usage Data</p>
                      <p className="text-gray-400 text-sm">
                        Help improve the platform by sharing anonymous usage data
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="analytics"
                        checked={userData.settings.analytics}
                        onChange={handleSettingsChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-checked:bg-blue-600 transition-all">
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* ML Settings */}
              <div className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/70 to-indigo-800/70 shadow-lg">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <Server className="h-5 w-5 mr-2" /> ML Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Gateway URL
                    </label>
                    <input
                      type="text"
                      name="mlUrl"
                      value={userData.mlUrl}
                      onChange={handleMlChange}
                      placeholder="http://localhost:8001"
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-400"
                    />
                    <p className="text-gray-400 text-xs mt-1">
                      Overrides ML_GATEWAY_URL. Stored in your browser only.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveMl}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleTestMl}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
                    >
                      Test Connection
                    </button>
                  </div>
                  {mlHealth && (
                    <div className="mt-2 text-sm text-gray-300">
                      {mlHealth.ok === false ? (
                        <span className="text-red-400">Connection failed</span>
                      ) : (
                        <span className="text-emerald-400">OK</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Security Actions */}
              <div className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/70 to-indigo-800/70 shadow-lg">
                <h3 className="text-xl font-semibold text-white mb-6">Security</h3>
                <div className="space-y-4">
                  <button className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors duration-200">
                    <div className="flex items-center space-x-3">
                      <Lock className="h-5 w-5 text-gray-400" />
                      <div className="text-left">
                        <p className="text-white font-medium">Change Password</p>
                        <p className="text-gray-400 text-sm">Update your account password</p>
                      </div>
                    </div>
                    <Key className="h-4 w-4 text-gray-400" />
                  </button>

                  <button className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors duration-200">
                    <div className="flex items-center space-x-3">
                      <Activity className="h-5 w-5 text-gray-400" />
                      <div className="text-left">
                        <p className="text-white font-medium">View Login History</p>
                        <p className="text-gray-400 text-sm">Check recent account activity</p>
                      </div>
                    </div>
                    <Eye className="h-4 w-4 text-gray-400" />
                  </button>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center p-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                  >
                    <X className="h-5 w-5 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Profile; 