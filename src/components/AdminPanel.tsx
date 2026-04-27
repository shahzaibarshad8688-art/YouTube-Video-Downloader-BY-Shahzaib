import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Key, Image, Type, Trash2, Loader2, CheckCircle2, AlertCircle, ArrowLeft, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AdminPanelProps {
  onNavigate: (page: string) => void;
  onSettingsUpdate: () => void;
}

const ADMIN_PASSWORD = 'shahzaib2024';

export default function AdminPanel({ onNavigate, onSettingsUpdate }: AdminPanelProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [siteTitle, setSiteTitle] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [videos, setVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSiteTitle(data.site_title || '');
        setLogoUrl(data.logo_url || '');
      }
    } catch {
      // Use defaults
    }
  }, []);

  const fetchVideos = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch {
      setVideos([]);
    } finally {
      setLoadingVideos(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      fetchSettings();
      fetchVideos();
    }
  }, [authenticated, fetchSettings, fetchVideos]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password');
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('site_settings')
          .update({ site_title: siteTitle, logo_url: logoUrl, updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_settings')
          .insert({ site_title: siteTitle, logo_url: logoUrl });

        if (error) throw error;
      }

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      onSettingsUpdate();
    } catch {
      setMessage({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      const { error } = await supabase.from('videos').delete().eq('id', id);
      if (error) throw error;
      setVideos((prev) => prev.filter((v) => v.id !== id));
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete video.' });
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pt-24 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl opacity-20 group-hover:opacity-30 blur transition-opacity duration-500" />
            <div className="relative bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
                <p className="text-gray-500 text-sm mt-1">Enter password to continue</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5" />
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError('');
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-cyan-500/50 transition-colors"
                    placeholder="Enter admin password"
                  />
                  {passwordError && (
                    <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {passwordError}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-cyan-500/20"
                >
                  Unlock
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </button>

          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-8">
            Admin Dashboard
          </h2>

          <div className="space-y-6">
            {/* Site Settings */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-500" />
              <div className="relative bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Type className="h-5 w-5 text-cyan-400" />
                  Site Settings
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 block">
                      Website Title
                    </label>
                    <input
                      type="text"
                      value={siteTitle}
                      onChange={(e) => setSiteTitle(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-cyan-500/50 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Image className="h-3.5 w-3.5" />
                      Logo URL
                    </label>
                    <input
                      type="text"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none focus:border-cyan-500/50 transition-colors"
                      placeholder="Enter image URL for logo"
                    />
                    {logoUrl && (
                      <div className="mt-2 flex items-center gap-3">
                        <img src={logoUrl} alt="Logo preview" className="h-10 w-10 rounded-lg object-cover border border-white/10" />
                        <span className="text-xs text-gray-500">Logo preview</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg shadow-cyan-500/20"
                  >
                    {saving ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Save className="h-5 w-5" />
                    )}
                    {saving ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
                    message.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <AlertCircle className="h-5 w-5" />
                  )}
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Video Management */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-500" />
              <div className="relative bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-cyan-400" />
                  Manage Videos
                </h3>

                {loadingVideos ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" />
                  </div>
                ) : videos.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No videos in gallery</p>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {videos.map((video) => (
                      <div
                        key={video.id}
                        className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="h-12 w-20 rounded-lg object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.video_id}/hqdefault.jpg`;
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{video.title}</p>
                          <p className="text-gray-500 text-xs">{video.quality} - {video.duration}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteVideo(video.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-gray-500 hover:text-red-400 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
