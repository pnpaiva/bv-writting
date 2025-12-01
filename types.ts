
export interface Note {
  id: string;
  folderId: string;
  title: string;
  content: string; // HTML content
  updatedAt: number;
  targetWordCount?: number; // For goal tracking
}

export interface Folder {
  id: string;
  name: string;
  color?: string; // Hex code or Tailwind color name reference
}

export type ViewMode = 'editor' | 'dashboard' | 'inspiration' | 'folder' | 'admin';

export type InspirationType = 'image' | 'video' | 'text' | 'link' | 'highlight';

export interface InspirationItem {
  id: string;
  type: InspirationType;
  content: string; // URL or Text body
  title?: string;
  snippet?: string; // AI generated excerpt or summary
  createdAt: number;
  x?: number; // X coordinate on whiteboard
  y?: number; // Y coordinate on whiteboard
}

export interface User {
  email: string;
  name: string;
  password?: string; // Stored locally for this simple app
  isAdmin?: boolean;
}

export interface EditorSettings {
  fontFamily: 'serif' | 'sans' | 'mono';
  fontSize: 'small' | 'medium' | 'large';
  maxWidth: 'narrow' | 'medium' | 'wide' | 'full';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  unlocked: boolean;
  unlockedAt?: number;
}

export interface DailyStat {
  date: string; // ISO date string YYYY-MM-DD
  wordCount: number;
}

export interface UserStats {
  totalWordsWritten: number;
  currentStreak: number;
  maxStreak: number;
  lastWrittenDate: string | null;
  dailyHistory: DailyStat[];
  achievements: Achievement[];
  points: number;
}

export interface Template {
    id: string;
    name: string;
    description: string;
    content: string; // Initial HTML content
    defaultTitle?: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  description: string;
  type: 'success' | 'achievement' | 'info' | 'error';
}

export interface AppState {
  folders: Folder[];
  notes: Note[];
  activeNoteId: string | null;
  sidebarOpen: boolean;
  webhookUrl: string; // For N8N/Notion publishing
  darkMode: boolean;
  view: ViewMode;
  editorSettings: EditorSettings;
  userStats: UserStats;
}

export type AIAction = 'summarize' | 'continue' | 'fix_grammar' | 'rephrase';