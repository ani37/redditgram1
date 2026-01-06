
export interface RedditPost {
  id: string;
  title: string;
  subreddit: string;
  author: string;
  score: number;
  url: string;
  summary: string;
}

export interface GeneratedContent {
  imageUrl: string;
  caption: string;
  hashtags: string[];
}

export interface PipelineItem {
  id: string;
  redditPost: RedditPost;
  content: GeneratedContent | null;
  status: 'pending' | 'generating' | 'ready' | 'published' | 'scheduled' | 'failed';
  createdAt: number;
  scheduledFor?: number; // Timestamp for when it should be posted
}

export enum AppTab {
  DASHBOARD = 'dashboard',
  DISCOVERY = 'discovery',
  SCHEDULE = 'schedule',
  HISTORY = 'history',
  SETTINGS = 'settings'
}

export interface AppSettings {
  instagramUserId: string;
  instagramAccessToken: string;
  imageHostingProvider: 'mock' | 'cloudinary' | 's3';
  cloudinaryCloudName?: string;
  cloudinaryUploadPreset?: string;
  dailyPostCount: number;
  preferredSubreddits: string[];
  autoPublish: boolean;
}

export type PublishStep = 'idle' | 'hosting' | 'container' | 'polling' | 'finalizing' | 'success' | 'error';
