
import React from 'react';
import { PipelineItem, PublishStep } from '../types';

interface PipelineVisualizerProps {
  item: PipelineItem;
  onPublish: (id: string) => void;
  onDismiss: () => void;
  onGoToSettings?: () => void;
  publishStep: PublishStep;
  publishError?: string | null;
  imageHostingProvider?: string;
}

const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({ 
  item, 
  onPublish, 
  onDismiss, 
  onGoToSettings, 
  publishStep, 
  publishError,
  imageHostingProvider 
}) => {
  if (!item.content) return null;

  const getStepMessage = () => {
    switch (publishStep) {
      case 'hosting': 
        return imageHostingProvider === 'cloudinary' 
          ? 'Uploading your real AI image to Cloudinary...' 
          : '⚠️ Mock Mode: Using placeholder URL...';
      case 'container': return 'Linking public URL to Instagram...';
      case 'polling': return 'Instagram processing image...';
      case 'finalizing': return 'Confirming final publication...';
      case 'success': return 'Successfully published!';
      case 'error': return 'Publishing failed.';
      default: return '';
    }
  };

  const isPublishing = publishStep !== 'idle' && publishStep !== 'success' && publishStep !== 'error';
  const isMockMode = imageHostingProvider === 'mock';

  return (
    <div className="bg-slate-800 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl flex flex-col md:flex-row max-w-5xl mx-auto relative">
      {/* Publishing Overlay */}
      {publishStep !== 'idle' && (
        <div className="absolute inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
          {publishStep === 'success' ? (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto text-white text-4xl animate-bounce">
                <i className="fa-solid fa-check"></i>
              </div>
              <h2 className="text-3xl font-bold text-white">Published Successfully!</h2>
              {isMockMode && (
                <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl max-w-sm">
                   <p className="text-orange-400 text-xs font-semibold">
                     <i className="fa-solid fa-circle-info mr-2"></i>
                     NOTE: Since you are in Mock mode, Instagram shows a placeholder. Set up Cloudinary to see your real AI image.
                   </p>
                </div>
              )}
              <button onClick={onDismiss} className="px-8 py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-colors">Done</button>
            </div>
          ) : publishStep === 'error' ? (
            <div className="space-y-6 max-w-lg">
              <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto text-white text-4xl">
                <i className="fa-solid fa-triangle-exclamation"></i>
              </div>
              <h2 className="text-3xl font-bold text-white">Pipeline Error</h2>
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                <p className="text-red-400 text-sm font-mono break-all">{publishError}</p>
              </div>
              <div className="flex gap-4">
                <button onClick={onDismiss} className="px-6 py-2 bg-slate-700 text-white rounded-lg">Close</button>
                <button onClick={() => onPublish(item.id)} className="px-6 py-2 bg-white text-slate-900 rounded-lg font-bold">Retry</button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-sm">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-slate-800 border-t-orange-500 animate-spin mx-auto"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <i className="fa-brands fa-instagram text-2xl text-white"></i>
                </div>
              </div>
              <p className="text-lg font-semibold text-white">{getStepMessage()}</p>
            </div>
          )}
        </div>
      )}

      {/* Visual Side */}
      <div className="w-full md:w-1/2 aspect-square relative group bg-slate-900">
        <img 
          src={item.content.imageUrl} 
          alt="AI Preview" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-end p-6 bg-gradient-to-t from-black/60 to-transparent">
          <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[10px] font-bold rounded-full border border-white/20">
            LOCAL AI PREVIEW
          </span>
        </div>
      </div>

      {/* Content Side */}
      <div className="w-full md:w-1/2 p-8 flex flex-col">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Post Preview</h2>
            <p className="text-slate-400 text-sm">Review before publishing to IG</p>
          </div>
          <button onClick={onDismiss} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>

        <div className="flex-grow space-y-6">
          {isMockMode ? (
            <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl flex gap-3">
              <i className="fa-solid fa-circle-exclamation text-orange-400 mt-1"></i>
              <div>
                <p className="text-[11px] font-bold text-orange-400 uppercase tracking-widest mb-1">Warning: Mock Hosting</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Instagram <strong className="text-slate-200">cannot</strong> see your local AI image. To upload the <strong>correct</strong> image, you must configure <button onClick={onGoToSettings} className="text-orange-500 underline">Cloudinary in Settings</button>. Currently, a placeholder will be posted.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl flex gap-3">
              <i className="fa-solid fa-cloud-check text-green-400 mt-1"></i>
              <div>
                <p className="text-[11px] font-bold text-green-400 uppercase tracking-widest mb-1">Hosting Active</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  The real AI image will be uploaded to your Cloudinary storage and then sent to Instagram.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Caption</label>
            <textarea 
              className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 text-sm focus:ring-2 focus:ring-orange-500 outline-none resize-none"
              defaultValue={item.content.caption}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {item.content.hashtags.map((tag, idx) => (
              <span key={idx} className="px-2 py-1 bg-slate-700/50 text-slate-400 text-[10px] rounded border border-slate-700">
                {tag.startsWith('#') ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <button 
            onClick={() => onPublish(item.id)}
            disabled={isPublishing}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-pink-600 hover:from-orange-600 hover:to-pink-700 text-white rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl transition-all disabled:opacity-50"
          >
            <i className="fa-brands fa-instagram text-xl"></i>
            {isPublishing ? 'Executing Pipeline...' : 'Publish to Instagram'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PipelineVisualizer;
