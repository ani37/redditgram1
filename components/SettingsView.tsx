
import React, { useState } from 'react';
import { AppSettings } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === 'number' ? parseInt(value) : value;
    setLocalSettings(prev => ({ ...prev, [name]: finalValue }));
  };

  const testToken = async () => {
    if (!localSettings.instagramAccessToken || !localSettings.instagramUserId) {
      setTestResult({ success: false, message: "Enter User ID and Token first." });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${localSettings.instagramUserId}?fields=username,name&access_token=${localSettings.instagramAccessToken}`);
      const data = await res.json();
      if (data.error) throw new Error(`${data.error.message} (Code: ${data.error.code})`);
      setTestResult({ success: true, message: `Connected to @${data.username} successfully!` });
    } catch (error: any) {
      setTestResult({ success: false, message: error.message || "Failed to validate token." });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4 duration-500 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
          <i className="fa-solid fa-sliders text-xl"></i>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Pipeline Settings</h2>
          <p className="text-slate-400 text-sm">Configure your API connections and automation rules.</p>
        </div>
      </div>

      {/* Instagram Section */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <i className="fa-brands fa-instagram text-pink-500"></i>
            Instagram Graph API
          </h3>
          <button 
            onClick={testToken}
            disabled={isTesting}
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2"
          >
            {isTesting ? <i className="fa-solid fa-circle-notch fa-spin"></i> : <i className="fa-solid fa-vial"></i>}
            Test Token
          </button>
        </div>
        <div className="p-6 space-y-6">
          {testResult && (
            <div className={`p-4 rounded-xl text-sm flex items-center gap-3 animate-in fade-in duration-300 ${testResult.success ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              <i className={`fa-solid ${testResult.success ? 'fa-circle-check' : 'fa-circle-exclamation'}`}></i>
              {testResult.message}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">User ID</label>
              <input type="text" name="instagramUserId" value={localSettings.instagramUserId} onChange={handleChange} placeholder="e.g. 1784140..." className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Access Token</label>
              <input type="password" name="instagramAccessToken" value={localSettings.instagramAccessToken} onChange={handleChange} placeholder="EAA..." className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all" />
            </div>
          </div>
        </div>
      </div>

      {/* Automation Rules */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <i className="fa-solid fa-robot text-orange-500"></i>
            Automation Pipeline Rules
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Daily Post Count (X)</label>
              <input 
                type="number" 
                name="dailyPostCount" 
                min="1" 
                max="10" 
                value={localSettings.dailyPostCount} 
                onChange={handleChange} 
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all" 
              />
              <p className="text-[10px] text-slate-500">How many posts should be auto-populated in the daily schedule.</p>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Auto-Publish Mode</label>
              <select 
                name="autoPublish" 
                value={localSettings.autoPublish ? 'true' : 'false'} 
                onChange={(e) => setLocalSettings(p => ({ ...p, autoPublish: e.target.value === 'true' }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none"
              >
                <option value="false">Manual Review Required</option>
                <option value="true">Fully Automated (Simulated)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Hosting Section */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <i className="fa-solid fa-cloud text-blue-500"></i>
            Image Hosting (Cloudinary)
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Hosting Provider</label>
            <select name="imageHostingProvider" value={localSettings.imageHostingProvider} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 outline-none transition-all appearance-none">
              <option value="mock">Simulated (Mock URLs)</option>
              <option value="cloudinary">Cloudinary (Real AI Images)</option>
            </select>
          </div>

          {localSettings.imageHostingProvider === 'cloudinary' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 animate-in slide-in-from-top-2">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Cloud Name</label>
                <input type="text" name="cloudinaryCloudName" value={localSettings.cloudinaryCloudName || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white" />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">Upload Preset</label>
                <input type="text" name="cloudinaryUploadPreset" value={localSettings.cloudinaryUploadPreset || ''} onChange={handleChange} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button onClick={() => onSave(localSettings)} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20">
          Save Configuration
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
