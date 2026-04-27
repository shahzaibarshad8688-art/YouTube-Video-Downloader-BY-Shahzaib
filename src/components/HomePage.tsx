import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Search, Loader2, CheckCircle2, AlertCircle, Film, Clock, Monitor } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VideoInfo {
  videoId: string;
  title: string;
  thumbnail: string;
  duration: string;
}

interface HomePageProps {
  onVideoAdded: () => void;
}

const YOUTUBE_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

const QUALITIES = ['144p', '360p', '720p', '1080p'];

export default function HomePage({ onVideoAdded }: HomePageProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedQuality, setSelectedQuality] = useState('720p');
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [urlError, setUrlError] = useState('');

  const validateUrl = useCallback((value: string) => {
    if (!value.trim()) {
      setUrlError('');
      return false;
    }
    if (!YOUTUBE_REGEX.test(value)) {
      setUrlError('Please enter a valid YouTube URL');
      return false;
    }
    setUrlError('');
    return true;
  }, []);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUrl(value);
    validateUrl(value);
    setVideoInfo(null);
    setMessage(null);
  };

  const fetchVideoInfo = async () => {
    if (!validateUrl(url)) return;

    const match = url.match(YOUTUBE_REGEX);
    if (!match) return;

    const videoId = match[1];
    setLoading(true);
    setMessage(null);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/video-info?url=${encodeURIComponent(url)}`;
      const headers = {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, { headers });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to fetch video info');

      setVideoInfo({
        videoId,
        title: data.title || 'Untitled Video',
        thumbnail: data.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        duration: data.duration || 'Unknown',
      });
    } catch {
      setVideoInfo({
        videoId,
        title: 'YouTube Video',
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        duration: 'N/A',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!videoInfo) return;
    setDownloading(true);
    setMessage(null);

    try {
      const { error } = await supabase.from('videos').insert({
        youtube_url: url,
        video_id: videoInfo.videoId,
        title: videoInfo.title,
        thumbnail_url: videoInfo.thumbnail,
        duration: videoInfo.duration,
        quality: selectedQuality,
        download_url: `https://www.youtube.com/watch?v=${videoInfo.videoId}`,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Video added to gallery successfully!' });
      onVideoAdded();
      setUrl('');
      setVideoInfo(null);
    } catch {
      setMessage({ type: 'error', text: 'Failed to save video. Please try again.' });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 leading-tight">
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 bg-clip-text text-transparent">
            YouTube Videos
          </span>
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Free Downloader
          </span>
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-400 text-lg max-w-md mx-auto"
        >
          Paste your video link and download instantly
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full max-w-xl"
      >
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500 rounded-2xl opacity-20 group-hover:opacity-40 blur transition-opacity duration-500" />
          <div className="relative flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2">
            <input
              type="text"
              value={url}
              onChange={handleUrlChange}
              placeholder="Paste YouTube URL here..."
              className="flex-1 bg-transparent px-4 py-3 text-white placeholder-gray-500 outline-none text-sm"
              onKeyDown={(e) => e.key === 'Enter' && fetchVideoInfo()}
            />
            <button
              onClick={fetchVideoInfo}
              disabled={loading || !url.trim()}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
              <span className="hidden sm:inline">{loading ? 'Fetching...' : 'Fetch'}</span>
            </button>
          </div>
        </div>
        {urlError && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-400 flex items-center gap-1"
          >
            <AlertCircle className="h-4 w-4" />
            {urlError}
          </motion.p>
        )}
      </motion.div>

      <AnimatePresence>
        {videoInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-xl mt-8"
          >
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-2xl opacity-0 group-hover:opacity-100 blur transition-opacity duration-500" />
              <div className="relative bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-64 flex-shrink-0">
                    <img
                      src={videoInfo.thumbnail}
                      alt={videoInfo.title}
                      className="w-full h-40 sm:h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoInfo.videoId}/hqdefault.jpg`;
                      }}
                    />
                  </div>
                  <div className="flex-1 p-5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-white font-semibold text-lg mb-3 line-clamp-2">
                        {videoInfo.title}
                      </h3>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-400 mb-4">
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-cyan-400" />
                          {videoInfo.duration}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Film className="h-4 w-4 text-blue-400" />
                          YouTube
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Monitor className="h-3.5 w-3.5" />
                        Select Quality
                      </label>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {QUALITIES.map((q) => (
                          <button
                            key={q}
                            onClick={() => setSelectedQuality(q)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                              selectedQuality === q
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                                : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20 hover:text-white'
                            }`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl transition-all duration-300 disabled:opacity-50 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40"
                      >
                        {downloading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Download className="h-5 w-5" />
                            Add to Gallery
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
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
    </div>
  );
}
