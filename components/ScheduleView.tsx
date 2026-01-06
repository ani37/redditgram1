
import React from 'react';
import { PipelineItem } from '../types';

interface ScheduleViewProps {
  items: PipelineItem[];
  isBatchProcessing: boolean;
  dailyCount: number;
  onAutoPopulate: () => void;
  onPublishNow: (id: string) => void;
  onRemove: (id: string) => void;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ 
  items, 
  isBatchProcessing, 
  dailyCount, 
  onAutoPopulate, 
  onPublishNow, 
  onRemove 
}) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Daily Schedule</h2>
          <p className="text-slate-400">Managing your {dailyCount} automated posts for today.</p>
        </div>
        <button 
          onClick={onAutoPopulate}
          disabled={isBatchProcessing}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-600 hover:scale-[1.02] active:scale-[0.98] text-white rounded-2xl font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-3 disabled:opacity-50"
        >
          {isBatchProcessing ? (
            <>
              <i className="fa-solid fa-circle-notch fa-spin"></i>
              Populating Pipeline...
            </>
          ) : (
            <>
              <i className="fa-solid fa-magic"></i>
              Auto-Populate Today's Schedule
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {items.length === 0 ? (
          <div className="p-20 text-center bg-slate-900/50 rounded-3xl border border-dashed border-slate-800">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-600">
              <i className="fa-solid fa-calendar-xmark text-3xl"></i>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Schedule is empty</h3>
            <p className="text-slate-500 max-w-sm mx-auto">Click "Auto-Populate" to let Gemini find and generate content for your target subreddits automatically.</p>
          </div>
        ) : (
          items.sort((a, b) => (a.scheduledFor || 0) - (b.scheduledFor || 0)).map((item, idx) => (
            <div key={item.id} className="group bg-slate-900 p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <img 
                  src={item.content?.imageUrl} 
                  className="w-32 h-32 rounded-2xl object-cover shadow-2xl" 
                  alt="" 
                />
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold border-4 border-slate-950 text-sm">
                  {idx + 1}
                </div>
              </div>

              <div className="flex-grow">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-bold px-2 py-1 bg-slate-800 text-orange-400 rounded uppercase tracking-wider border border-orange-500/20">
                    r/{item.redditPost.subreddit}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <i className="fa-solid fa-clock"></i>
                    {item.scheduledFor ? new Date(item.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white mb-2 line-clamp-1">{item.redditPost.title}</h4>
                <p className="text-slate-500 text-sm line-clamp-2 italic">"{item.content?.caption}"</p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <button 
                  onClick={() => onPublishNow(item.id)}
                  className="flex-grow md:flex-initial px-5 py-2.5 bg-white text-slate-900 rounded-xl font-bold hover:bg-orange-500 hover:text-white transition-all text-sm flex items-center justify-center gap-2"
                >
                  <i className="fa-solid fa-paper-plane"></i>
                  Publish Now
                </button>
                <button 
                  onClick={() => onRemove(item.id)}
                  className="p-3 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-xl transition-all"
                >
                  <i className="fa-solid fa-trash-can"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ScheduleView;
