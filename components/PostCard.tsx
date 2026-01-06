
import React from 'react';
import { RedditPost } from '../types';

interface PostCardProps {
  post: RedditPost;
  onGenerate: (post: RedditPost) => void;
  isGenerating?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, onGenerate, isGenerating }) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden hover:border-slate-500 transition-all group flex flex-col h-full">
      <div className="p-5 flex-grow">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold px-2 py-1 bg-slate-700 text-slate-300 rounded uppercase tracking-wider">
            r/{post.subreddit}
          </span>
          <div className="flex items-center gap-1.5 text-orange-400 text-xs font-semibold">
            <i className="fa-solid fa-fire"></i>
            {post.score.toLocaleString()}
          </div>
        </div>
        
        <h3 className="text-lg font-bold text-white mb-2 leading-tight group-hover:text-orange-400 transition-colors">
          {post.title}
        </h3>
        
        <p className="text-slate-400 text-sm line-clamp-3 mb-4">
          {post.summary}
        </p>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <i className="fa-solid fa-user"></i>
          <span>u/{post.author}</span>
        </div>
      </div>

      <div className="p-4 bg-slate-800/80 border-t border-slate-700">
        <button
          onClick={() => onGenerate(post)}
          disabled={isGenerating}
          className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            isGenerating 
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
              : 'bg-white text-slate-900 hover:bg-orange-500 hover:text-white'
          }`}
        >
          {isGenerating ? (
            <>
              <i className="fa-solid fa-circle-notch fa-spin"></i>
              Analyzing...
            </>
          ) : (
            <>
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              Transform with Gemini
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default PostCard;
