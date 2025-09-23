import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Key, Settings, Edit3, Save, X, Eye, EyeOff, Bell, Lock, Globe, Database, Activity } from 'lucide-react';
import { useAuth } from '../utils/AuthContext';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { isAuthenticated, userRole, principal, actor, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    displayName: 'Aryan Dixit',
    email: 'aryan@example.com',
    role: userRole || 'Patient',
    principalId: principal || '',
    joinDate: '2025-09-20',
    lastActive: '2025-09-23',
    totalRecords: 0,
    sharedRecords: 0,
    accessCount: 0
  });
  const [editForm, setEditForm] = useState({
    displayName: profile.displayName,
    email: profile.email
  });
  const [showPassword, setShowPassword] = useState(false);
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    accessAlerts: true,
    securityAlerts: true,
    researchUpdates: false
  });
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'private',
    dataSharing: 'consent-based',
    analytics: true
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    
    // Fetch user profile data
    const fetchProfile = async () => {
      try {
        if (actor) {
          const userProfile = await actor.get_profile();
          if (userProfile) {
            setProfile(prev => ({
              ...prev,
              displayName: userProfile.display_name || prev.displayName,
              role: userProfile.role || prev.role,
              totalRecords: userProfile.total_records || 0,
              sharedRecords: userProfile.shared_records || 0,
              accessCount: userProfile.access_count || 0
            }));
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, [isAuthenticated, actor, navigate]);

  const handleEdit = () => {
    setEditForm({
      displayName: profile.displayName,
      email: profile.email
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      // Update profile in backend
      if (actor) {
        await actor.update_profile(editForm.displayName, editForm.email);
      }
      
      setProfile(prev => ({
        ...prev,
        displayName: editForm.displayName,
        email: editForm.email
      }));
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleCancel = () => {
    setEditForm({
      displayName: profile.displayName,
      email: profile.email
    });
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Patient': return 'text-primary-400';
      case 'Doctor': return 'text-secondary-400';
      case 'Researcher': return 'text-accent-400';
      default: return 'text-gray-400';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'Patient': return User;
      case 'Doctor': return Shield;
      case 'Researcher': return Database;
      default: return User;
    }
  };

  const RoleIcon = getRoleIcon(profile.role);

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-cyan-300 mb-4">Profile Settings</h1>
          <p className="text-xl text-blue-200">Manage your account and privacy preferences</p>
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
                <h2 className="text-2xl font-bold text-white mb-2">{profile.displayName}</h2>
                <p className={`text-lg font-medium ${getRoleColor(profile.role)}`}>{profile.role}</p>
                <p className="text-sm text-gray-400 mt-2">Member since {profile.joinDate}</p>
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/60 to-indigo-800/60 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Account Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Records</span>
                  <span className="text-white font-semibold">{profile.totalRecords}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Shared Records</span>
                  <span className="text-white font-semibold">{profile.sharedRecords}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Access Count</span>
                  <span className="text-white font-semibold">{profile.accessCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Last Active</span>
                  <span className="text-white font-semibold">{profile.lastActive}</span>
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
                  <h3 className="text-xl font-semibold text-white">Personal Information</h3>
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
                    <label className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.displayName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-400"
                      />
                    ) : (
                      <p className="text-white">{profile.displayName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-400"
                      />
                    ) : (
                      <p className="text-white">{profile.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                    <p className={`text-lg font-medium ${getRoleColor(profile.role)}`}>{profile.role}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Principal ID</label>
                    <div className="flex items-center space-x-2">
                      <p className="text-white font-mono text-sm">{profile.principalId}</p>
                      <button
                        onClick={() => navigator.clipboard.writeText(profile.principalId)}
                        className="p-1 hover:bg-gray-700 rounded transition-colors duration-200"
                      >
                        <Key className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/70 to-indigo-800/70 shadow-lg">
                <h3 className="text-xl font-semibold text-white mb-6">Notification Preferences</h3>
                <div className="space-y-4">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {key === 'emailUpdates' && 'Receive updates about your account and system changes'}
                          {key === 'accessAlerts' && 'Get notified when someone accesses your records'}
                          {key === 'securityAlerts' && 'Receive security-related notifications'}
                          {key === 'researchUpdates' && 'Get updates about research opportunities and findings'}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setNotifications(prev => ({ ...prev, [key]: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="glass-card p-6 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-900/70 to-indigo-800/70 shadow-lg">
                <h3 className="text-xl font-semibold text-white mb-6">Privacy Settings</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Profile Visibility</label>
                    <select
                      value={privacy.profileVisibility}
                      onChange={(e) => setPrivacy(prev => ({ ...prev, profileVisibility: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-400"
                    >
                      <option value="private">Private</option>
                      <option value="public">Public</option>
                      <option value="contacts">Contacts Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Data Sharing</label>
                    <select
                      value={privacy.dataSharing}
                      onChange={(e) => setPrivacy(prev => ({ ...prev, dataSharing: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-400"
                    >
                      <option value="consent-based">Consent-based only</option>
                      <option value="anonymized">Allow anonymized research</option>
                      <option value="none">No data sharing</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Analytics & Usage Data</p>
                      <p className="text-gray-400 text-sm">Help improve the platform by sharing anonymous usage data</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacy.analytics}
                        onChange={(e) => setPrivacy(prev => ({ ...prev, analytics: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
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
  );
};

export default Profile;
