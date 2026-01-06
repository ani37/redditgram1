
import React, { useState, useEffect } from 'react';
import { AppTab, RedditPost, PipelineItem, AppSettings, PublishStep } from './types';
import { fetchTrendingRedditTopics, generateContentForPost } from './services/geminiService';
import Header from './components/Header';
import PostCard from './components/PostCard';
import PipelineVisualizer from './components/PipelineVisualizer';
import SettingsView from './components/SettingsView';
import ScheduleView from './components/ScheduleView';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DISCOVERY);
  const [trendingPosts, setTrendingPosts] = useState<RedditPost[]>([]);
  const [pipelineItems, setPipelineItems] = useState<PipelineItem[]>([]);
  const [isLoadingTrends, setIsLoadingTrends] = useState(false);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [activePipelineItem, setActivePipelineItem] = useState<PipelineItem | null>(null);
  const [publishStep, setPublishStep] = useState<PublishStep>('idle');
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  
  const [subredditQuery, setSubredditQuery] = useState('all');
  const [searchInput, setSearchInput] = useState('');

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('reddigram_settings');
    return saved ? JSON.parse(saved) : {
      instagramUserId: '',
      instagramAccessToken: '',
      imageHostingProvider: 'mock',
      cloudinaryCloudName: '',
      cloudinaryUploadPreset: '',
      dailyPostCount: 3,
      preferredSubreddits: ['tech', 'bengaluru', 'artificial'],
      autoPublish: false
    };
  });

  useEffect(() => {
    localStorage.setItem('reddigram_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (activeTab === AppTab.DISCOVERY) {
      loadTrends(subredditQuery);
    }
  }, [subredditQuery, activeTab]);

  const loadTrends = async (sub: string) => {
    setIsLoadingTrends(true);
    try {
      const posts = await fetchTrendingRedditTopics(sub);
      setTrendingPosts(posts);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingTrends(false);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchInput.trim()) {
      setSubredditQuery(searchInput.trim().toLowerCase().replace('r/', ''));
    }
  };

  const handleGenerate = async (post: RedditPost, isScheduled: boolean = false) => {
    setGeneratingId(post.id);
    try {
      const content = await generateContentForPost(post);
      const newItem: PipelineItem = {
        id: Math.random().toString(36).substr(2, 9),
        redditPost: post,
        content: content,
        status: isScheduled ? 'scheduled' : 'ready',
        createdAt: Date.now(),
        scheduledFor: isScheduled ? Date.now() + (3600000 * 4) : undefined // Mock: 4 hours from now
      };
      setPipelineItems(prev => [newItem, ...prev]);
      if (!isScheduled) setActivePipelineItem(newItem);
      return newItem;
    } catch (error) {
      console.error("Generation failed:", error);
      if (!isScheduled) alert("Failed to generate content. Check API limits.");
      return null;
    } finally {
      setGeneratingId(null);
    }
  };

  const handleAutoPopulateSchedule = async () => {
    setIsBatchProcessing(true);
    try {
      // 1. Fetch from preferred subreddits
      const targetSub = settings.preferredSubreddits[Math.floor(Math.random() * settings.preferredSubreddits.length)];
      const posts = await fetchTrendingRedditTopics(targetSub);
      
      // 2. Take the top X posts based on dailyPostCount
      const toProcess = posts.slice(0, settings.dailyPostCount);
      
      // 3. Process each
      for (let i = 0; i < toProcess.length; i++) {
        const post = toProcess[i];
        const newItem = await handleGenerate(post, true);
        if (newItem) {
          // Stagger the schedule
          setPipelineItems(prev => prev.map(item => 
            item.id === newItem.id 
              ? { ...item, scheduledFor: Date.now() + (3600000 * (i + 1) * 3) } // Every 3 hours
              : item
          ));
        }
      }
    } catch (error) {
      console.error("Batch populate failed:", error);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handlePublish = async (id: string) => {
    const item = pipelineItems.find(i => i.id === id);
    if (!item || !item.content) return;

    if (!settings.instagramUserId || !settings.instagramAccessToken) {
      alert("Please configure Instagram User ID and Access Token in Settings first.");
      setActivePipelineItem(null);
      setActiveTab(AppTab.SETTINGS);
      return;
    }

    setPublishStep('hosting');
    setPublishError(null);
    
    try {
      let publicImageUrl = '';

      if (settings.imageHostingProvider === 'cloudinary') {
        if (!settings.cloudinaryCloudName || !settings.cloudinaryUploadPreset) {
          throw new Error("Missing Cloudinary settings. Cannot upload the real image.");
        }

        const formData = new FormData();
        formData.append('file', item.content.imageUrl);
        formData.append('upload_preset', settings.cloudinaryUploadPreset);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${settings.cloudinaryCloudName}/image/upload`, {
          method: 'POST',
          body: formData
        });

        const uploadData = await uploadRes.json();
        if (uploadData.error) {
          throw new Error(`Cloudinary Error: ${uploadData.error.message}`);
        }
        
        publicImageUrl = uploadData.secure_url;
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const searchTerms = item.content.hashtags.slice(0, 2).map(h => h.replace('#', '')).join(',');
        publicImageUrl = `https://loremflickr.com/1080/1080/${encodeURIComponent(searchTerms || 'ai,art')}?lock=${item.id}`;
      }

      setPublishStep('container');
      
      const containerRes = await fetch(`https://graph.facebook.com/v21.0/${settings.instagramUserId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: publicImageUrl,
          caption: `${item.content.caption}\n\n${item.content.hashtags.join(' ')}`,
          access_token: settings.instagramAccessToken
        })
      });

      const containerData = await containerRes.json();
      if (containerData.error) throw new Error(`${containerData.error.message} (Code: ${containerData.error.code})`);

      setPublishStep('polling');
      await new Promise(resolve => setTimeout(resolve, 5000));

      setPublishStep('finalizing');
      
      const publishRes = await fetch(`https://graph.facebook.com/v21.0/${settings.instagramUserId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: containerData.id,
          access_token: settings.instagramAccessToken
        })
      });

      const publishData = await publishRes.json();
      if (publishData.error) throw new Error(`${publishData.error.message} (Code: ${publishData.error.code})`);

      setPublishStep('success');
      setPipelineItems(prev => prev.map(item => 
        item.id === id ? { ...item, status: 'published' as const } : item
      ));

    } catch (error: any) {
      console.error("Publishing failed:", error);
      setPublishError(error.message || "Unknown error occurred.");
      setPublishStep('error');
    }
  };

  const handleDismissVisualizer = () => {
    setActivePipelineItem(null);
    setPublishStep('idle');
    setPublishError(null);
  };

  const navigateToSettings = () => {
    handleDismissVisualizer();
    setActiveTab(AppTab.SETTINGS);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="container mx-auto px-6 py-8">
        {activeTab === AppTab.SETTINGS && (
          <SettingsView 
            settings={settings} 
            onSave={(newSettings) => {
              setSettings(newSettings);
              alert("Settings saved successfully!");
              setActiveTab(AppTab.DASHBOARD);
            }} 
          />
        )}

        {activeTab === AppTab.DISCOVERY && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Trend Discovery</h2>
                <p className="text-slate-400">Discover trending topics from your favorite subreddits.</p>
              </div>
              
              <div className="flex flex-col gap-3 w-full max-w-md">
                <form onSubmit={handleSearch} className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-orange-500 transition-colors">
                    <i className="fa-brands fa-reddit-alien text-lg"></i>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Enter subreddit (e.g. tech, bengaluru...)" 
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl pl-12 pr-24 py-3.5 text-white placeholder-slate-500 focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 outline-none transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={isLoadingTrends}
                    className="absolute inset-y-1.5 right-1.5 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2"
                  >
                    {isLoadingTrends ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-magnifying-glass"></i>}
                    Explore
                  </button>
                </form>
                
                <div className="flex flex-wrap gap-2">
                  {['all', 'bengaluru', 'tech', 'artificial', 'space', 'science'].map(sub => (
                    <button 
                      key={sub}
                      onClick={() => {
                        setSubredditQuery(sub);
                        setSearchInput(sub);
                      }}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${
                        subredditQuery === sub 
                          ? 'bg-orange-500/10 border-orange-500 text-orange-400' 
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      r/{sub}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 py-2 border-b border-slate-800">
               <span className="text-xs font-bold text-slate-500 uppercase">Showing trends from:</span>
               <span className="text-xs font-bold text-white px-2 py-0.5 bg-slate-800 rounded">r/{subredditQuery}</span>
            </div>

            {isLoadingTrends ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-slate-900 h-64 rounded-2xl animate-pulse border border-slate-800"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trendingPosts.length > 0 ? (
                  trendingPosts.map(post => (
                    <PostCard 
                      key={post.id} 
                      post={post} 
                      onGenerate={(p) => handleGenerate(p, false)}
                      isGenerating={generatingId === post.id}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-20 text-center">
                    <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-700">
                      <i className="fa-solid fa-ghost text-2xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-white">No trends found</h3>
                    <p className="text-slate-500">Try a different subreddit or search query.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === AppTab.SCHEDULE && (
          <ScheduleView 
            items={pipelineItems.filter(i => i.status === 'scheduled')}
            isBatchProcessing={isBatchProcessing}
            dailyCount={settings.dailyPostCount}
            onAutoPopulate={handleAutoPopulateSchedule}
            onPublishNow={handlePublish}
            onRemove={(id) => setPipelineItems(prev => prev.filter(i => i.id !== id))}
          />
        )}

        {activeTab === AppTab.DASHBOARD && (
          <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Total Scanned', value: '1,284', icon: 'fa-eye', color: 'blue' },
                  { label: 'AI Generated', value: pipelineItems.length, icon: 'fa-wand-magic-sparkles', color: 'purple' },
                  { label: 'Published', value: pipelineItems.filter(i => i.status === 'published').length, icon: 'fa-check-circle', color: 'green' },
                  { label: 'Scheduled', value: pipelineItems.filter(i => i.status === 'scheduled').length, icon: 'fa-calendar-days', color: 'orange' },
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 bg-slate-800 text-orange-500`}>
                      <i className={`fa-solid ${stat.icon}`}></i>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                ))}
             </div>

             <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <i className="fa-brands fa-instagram text-9xl"></i>
                </div>
                <div className="max-w-md mx-auto relative z-10">
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-500 shadow-xl">
                    <i className="fa-solid fa-robot text-3xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Automated Pipeline Running</h3>
                  <p className="text-slate-400 mb-6">Your scheduler is managing {settings.dailyPostCount} posts per day. {pipelineItems.filter(i => i.status === 'scheduled').length} currently in queue.</p>
                  <button 
                    onClick={() => setActiveTab(AppTab.SCHEDULE)}
                    className="bg-white text-slate-900 px-6 py-2.5 rounded-xl font-bold hover:bg-orange-500 hover:text-white transition-all shadow-lg shadow-white/5"
                  >
                    View Schedule
                  </button>
                </div>
             </div>
          </div>
        )}

        {activeTab === AppTab.HISTORY && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Generation History</h2>
            <div className="space-y-4">
              {pipelineItems.length === 0 ? (
                <div className="p-12 text-center bg-slate-900 rounded-3xl border border-dashed border-slate-700">
                  <p className="text-slate-500">No content generated yet. Head to Discovery to start.</p>
                </div>
              ) : (
                pipelineItems.map(item => (
                  <div key={item.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center gap-6 group hover:border-slate-600 transition-colors">
                    <img src={item.content?.imageUrl} className="w-20 h-20 rounded-xl object-cover" alt="" />
                    <div className="flex-grow">
                      <h4 className="font-bold text-white line-clamp-1">{item.redditPost.title}</h4>
                      <p className="text-xs text-slate-500">Created {new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        item.status === 'published' ? 'bg-green-500/10 text-green-400' : 
                        item.status === 'scheduled' ? 'bg-orange-500/10 text-orange-400' : 'bg-slate-700 text-slate-400'
                      }`}>
                        {item.status}
                      </span>
                      <button 
                        onClick={() => setActivePipelineItem(item)}
                        className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 group-hover:text-white transition-colors"
                      >
                        <i className="fa-solid fa-eye"></i>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {activePipelineItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl" onClick={handleDismissVisualizer}></div>
          <div className="relative w-full max-w-5xl animate-in zoom-in-95 duration-300">
            <PipelineVisualizer 
              item={activePipelineItem} 
              onPublish={handlePublish}
              onDismiss={handleDismissVisualizer}
              onGoToSettings={navigateToSettings}
              publishStep={publishStep}
              publishError={publishError}
              imageHostingProvider={settings.imageHostingProvider}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
