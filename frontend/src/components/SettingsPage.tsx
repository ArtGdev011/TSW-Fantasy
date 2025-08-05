import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContextLocal';
import { dbService } from '../services/indexedDB';
import toast from 'react-hot-toast';

const SettingsPage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'data' | 'about'>('profile');
  const [isUpdating, setIsUpdating] = useState(false);
  const [profileForm, setProfileForm] = useState<{
    username: string;
    email: string;
    notifications: boolean;
    emailUpdates: boolean;
  }>({
    username: user?.username || '',
    email: user?.email || '',
    notifications: user?.preferences?.notifications || true,
    emailUpdates: user?.preferences?.emailUpdates || true,
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsUpdating(true);
      await updateUser({
        preferences: {
          notifications: profileForm.notifications,
          emailUpdates: profileForm.emailUpdates,
        }
      });
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const exportData = async () => {
    try {
      const data = await dbService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tsw-fantasy-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully!');
    } catch (error) {
      console.error('Failed to export data:', error);
      toast.error('Failed to export data');
    }
  };

  const clearAllData = async () => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      return;
    }

    try {
      await dbService.clearAllData();
      await logout();
      toast.success('All data cleared successfully');
    } catch (error) {
      console.error('Failed to clear data:', error);
      toast.error('Failed to clear data');
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      // eslint-disable-next-line no-restricted-globals
      if (!confirm('This will replace all existing data. Are you sure?')) {
        return;
      }

      await dbService.importData(data);
      toast.success('Data imported successfully! Please refresh the page.');
    } catch (error) {
      console.error('Failed to import data:', error);
      toast.error('Failed to import data. Please check the file format.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account and application preferences</p>
      </div>

      <div className="bg-white rounded-lg shadow-md">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'profile', label: 'Profile', icon: '👤' },
              { id: 'data', label: 'Data Management', icon: '💾' },
              { id: 'about', label: 'About', icon: 'ℹ️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Settings</h2>
              
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={profileForm.username}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profileForm.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-700">Preferences</h3>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="notifications"
                      checked={profileForm.notifications}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, notifications: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="notifications" className="ml-2 text-sm text-gray-700">
                      Enable notifications
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="emailUpdates"
                      checked={profileForm.emailUpdates}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, emailUpdates: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="emailUpdates" className="ml-2 text-sm text-gray-700">
                      Email updates (when available)
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                >
                  {isUpdating ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            </div>
          )}

          {/* Data Management Tab */}
          {activeTab === 'data' && (
            <div className="max-w-2xl">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Management</h2>
              
              <div className="space-y-6">
                {/* Export Data */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Export Data</h3>
                  <p className="text-gray-600 mb-4">
                    Download all your data as a JSON file for backup purposes.
                  </p>
                  <button
                    onClick={exportData}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                  >
                    📥 Export Data
                  </button>
                </div>

                {/* Import Data */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Import Data</h3>
                  <p className="text-gray-600 mb-4">
                    Import data from a previously exported JSON file. This will replace all existing data.
                  </p>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                {/* Clear All Data */}
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <h3 className="text-lg font-medium text-red-900 mb-2">Danger Zone</h3>
                  <p className="text-red-700 mb-4">
                    Permanently delete all your data. This action cannot be undone.
                  </p>
                  <button
                    onClick={clearAllData}
                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition duration-200"
                  >
                    🗑️ Clear All Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="max-w-2xl">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About TSW Fantasy League</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Local Edition</h3>
                  <p className="text-gray-600">
                    This version of TSW Fantasy League runs entirely in your browser using IndexedDB for data storage. 
                    No external services or Firebase dependencies are required.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Features</h3>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    <li>Local user authentication and team management</li>
                    <li>Complete player database with customizable teams</li>
                    <li>Fantasy team creation with budget constraints</li>
                    <li>Inbox messaging system</li>
                    <li>Leaderboard and scoring system</li>
                    <li>Data export/import functionality</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Technical Details</h3>
                  <div className="bg-gray-100 rounded-lg p-4">
                    <dl className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="font-medium">Version:</dt>
                        <dd>2.0.0-local</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium">Storage:</dt>
                        <dd>IndexedDB</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium">Authentication:</dt>
                        <dd>Local with bcrypt</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="font-medium">Data Privacy:</dt>
                        <dd>Fully local - never leaves your device</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Browser Compatibility</h3>
                  <p className="text-gray-600">
                    This application requires a modern browser with IndexedDB support. 
                    All major browsers (Chrome, Firefox, Safari, Edge) are supported.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
