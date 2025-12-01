
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { RichEditor } from './components/RichEditor';
import { Dashboard } from './components/Dashboard';
import { InspirationBoard } from './components/InspirationBoard';
import { LoginPage } from './components/LoginPage';
import { FolderView } from './components/FolderView';
import { AdminPanel } from './components/AdminPanel';
import { Folder, Note, ViewMode, User, InspirationItem, EditorSettings, UserStats, Achievement, DailyStat, Template, ToastMessage } from './types';
import { storage } from './services/storage';
import { isSupabaseConfigured, saveSupabaseConfig, clearSupabaseConfig, testSupabaseConnection, getConfig } from './services/supabase';
import { Globe, AlertTriangle, Trophy, FolderPlus, Cloud, Shield, Database, Check, RefreshCw } from 'lucide-react';

// --- ERROR BOUNDARY ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    handleReset = () => {
        clearSupabaseConfig();
        window.location.reload();
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-stone-950 text-stone-200 flex flex-col items-center justify-center p-8 text-center font-serif">
                    <div className="bg-stone-900 p-8 rounded-xl border border-stone-800 shadow-2xl max-w-md">
                        <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold mb-2 text-white">Something went wrong</h1>
                        <p className="text-stone-400 mb-6">The application encountered a critical error. We have disconnected the database to restore access.</p>
                        <div className="bg-black/30 p-3 rounded text-xs font-mono text-red-300 mb-6 overflow-x-auto whitespace-pre-wrap text-left">
                            {this.state.error?.message}
                        </div>
                        <button 
                            onClick={this.handleReset}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                            <RefreshCw size={18} />
                            Reset & Restart
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// --- TEMPLATES ---
const TEMPLATES: Template[] = [
    {
        id: 'script',
        name: 'Video Script',
        description: 'A-Roll, B-Roll, and Thumbnail planning',
        defaultTitle: 'New Video Script',
        content: `
            <p><strong>Logline:</strong> One sentence summary of the video...</p>
            <hr/>
            <h2>Script & Visuals</h2>
            <table>
                <thead>
                    <tr>
                        <th style="width: 15%">Section</th>
                        <th style="width: 30%">Visual (A-Roll)</th>
                        <th style="width: 30%">B-Roll / Overlay</th>
                        <th style="width: 25%">Audio / Script</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Intro</strong></td>
                        <td>Talking head, energetic</td>
                        <td>Montage of results</td>
                        <td>"In this video, I'm going to show you..."</td>
                    </tr>
                </tbody>
            </table>
            <h2>Thumbnail Ideas</h2>
            <div class="thumbnail-grid">
                <div class="thumbnail-slot"><div class="image-placeholder">Slot 1</div></div>
                <div class="thumbnail-slot"><div class="image-placeholder">Slot 2</div></div>
                <div class="thumbnail-slot"><div class="image-placeholder">Slot 3</div></div>
            </div>
        `
    },
    {
        id: 'novel',
        name: 'Novel Chapter',
        description: 'Standard manuscript format',
        defaultTitle: 'Chapter 1',
        content: `
            <p style="text-align: center; font-style: italic;">(Scene setting...)</p>
            <p>It was a dark and stormy night...</p>
        `
    },
    {
        id: 'meeting',
        name: 'Meeting Notes',
        description: 'Agenda, Attendees, Action Items',
        defaultTitle: 'Meeting: [Topic]',
        content: `
            <h2>Details</h2>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <h2>Agenda</h2>
            <ul><li>Topic 1</li></ul>
        `
    }
];

// --- INITIAL DATA FACTORIES ---
const getInitialFolders = (): Folder[] => [
  { id: 'f1', name: 'Drafts', color: '#78716c' },
  { id: 'f2', name: 'Ideas', color: '#fbbf24' },
  { id: 'f3', name: 'Blog Posts', color: '#3b82f6' },
];

const getInitialNotes = (): Note[] => [
  { id: 'n1', folderId: 'f1', title: 'Welcome to Beyond Words', content: '<h1>Welcome!</h1><p>This is your new <b>vintage</b> writing space.</p><p>Try using the <i>AI Assistant</i> to help you write.</p><blockquote>"Fill your paper with the breathings of your heart." - Wordsworth</blockquote>', updatedAt: Date.now() },
];

const getInitialInspiration = (): InspirationItem[] => [
    { id: 'i1', type: 'text', content: 'Write drunk, edit sober.', title: 'Hemingway Advice', createdAt: Date.now(), x: 100, y: 100 },
];

const ACHIEVEMENTS_LIST: Achievement[] = [
    { id: 'first_word', title: 'First Ink', description: 'Wrote your first word.', icon: 'Feather', unlocked: false },
    { id: 'words_100', title: 'Postcard', description: 'Wrote 100 words total.', icon: 'Scroll', unlocked: false },
    { id: 'words_500', title: 'Letter', description: 'Wrote 500 words total.', icon: 'Scroll', unlocked: false },
    { id: 'words_1000', title: 'Scribe', description: 'Wrote 1,000 words total.', icon: 'BookOpen', unlocked: false },
    { id: 'words_5000', title: 'Essayist', description: 'Wrote 5,000 words total.', icon: 'BookOpen', unlocked: false },
    { id: 'words_10000', title: 'Author', description: 'Wrote 10,000 words total.', icon: 'Crown', unlocked: false },
    { id: 'words_25000', title: 'Novella', description: 'Wrote 25,000 words total.', icon: 'Crown', unlocked: false },
    { id: 'words_50000', title: 'Novelist', description: 'Wrote 50,000 words (NaNoWriMo goal).', icon: 'Crown', unlocked: false },
    { id: 'words_100000', title: 'Epic', description: 'Wrote 100,000 words total.', icon: 'Crown', unlocked: false },
    { id: 'streak_3', title: 'Spark', description: 'Reached a 3-day writing streak.', icon: 'Flame', unlocked: false },
    { id: 'streak_7', title: 'Flame', description: 'Reached a 7-day writing streak.', icon: 'Flame', unlocked: false },
    { id: 'streak_14', title: 'Blaze', description: 'Reached a 14-day writing streak.', icon: 'Flame', unlocked: false },
    { id: 'streak_30', title: 'Inferno', description: 'Reached a 30-day writing streak.', icon: 'Flame', unlocked: false },
    { id: 'notes_5', title: 'Collector', description: 'Created 5 notes.', icon: 'Files', unlocked: false },
    { id: 'notes_10', title: 'Archivist', description: 'Created 10 notes.', icon: 'Files', unlocked: false },
    { id: 'notes_25', title: 'Librarian', description: 'Created 25 notes.', icon: 'Files', unlocked: false },
    { id: 'notes_50', title: 'Curator', description: 'Created 50 notes.', icon: 'Files', unlocked: false },
    { id: 'organizer', title: 'Organizer', description: 'Created 3 folders.', icon: 'Folder', unlocked: false },
    { id: 'structured', title: 'Structured', description: 'Created 10 folders.', icon: 'Folder', unlocked: false },
    { id: 'dark_side', title: 'Dark Side', description: 'Enabled Dark Mode.', icon: 'Moon', unlocked: false },
    { id: 'light_side', title: 'Light Side', description: 'Switched back to Light Mode.', icon: 'Sun', unlocked: false },
    { id: 'typewriter', title: 'Typewriter', description: 'Used the Monospace font setting.', icon: 'Type', unlocked: false },
    { id: 'visual_storyteller', title: 'Visual Storyteller', description: 'Inserted an image into a note.', icon: 'Image', unlocked: false },
    { id: 'director', title: 'Director', description: 'Inserted a video into a note.', icon: 'Video', unlocked: false },
    { id: 'researcher', title: 'Researcher', description: 'Added an item to the inspiration board.', icon: 'Lightbulb', unlocked: false },
    { id: 'muse', title: 'Muse', description: 'Added 10 items to the inspiration board.', icon: 'Lightbulb', unlocked: false },
    { id: 'highlighter', title: 'Scholar', description: 'Highlighted text in a note.', icon: 'PenTool', unlocked: false },
    { id: 'scriptwriter', title: 'Screenwriter', description: 'Created a Video Script.', icon: 'Film', unlocked: false },
    { id: 'early_bird', title: 'Early Bird', description: 'Wrote between 5 AM and 8 AM.', icon: 'Sun', unlocked: false },
    { id: 'night_owl', title: 'Night Owl', description: 'Wrote between 11 PM and 3 AM.', icon: 'Moon', unlocked: false },
];

const countWordsSimple = (html: string) => {
    const plainText = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');
    return plainText.trim().split(/[\s\n]+/).filter(w => w.length > 0).length;
};

const reconstructStats = (notes: Note[], existingAchievements?: Achievement[]): UserStats => {
    try {
        const wordsByDate: Record<string, number> = {};
        let totalWords = 0;

        notes.forEach(n => {
            const words = countWordsSimple(n.content);
            totalWords += words;
            const d = new Date(n.updatedAt);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            wordsByDate[dateStr] = (wordsByDate[dateStr] || 0) + words;
        });

        const history: DailyStat[] = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            history.push({ date: dateStr, wordCount: wordsByDate[dateStr] || 0 });
        }

        const updatedAchievements = ACHIEVEMENTS_LIST.map(a => {
            // Prioritize saved achievements that are already unlocked
            if (existingAchievements) {
                const savedA = existingAchievements.find(sa => sa.id === a.id);
                if (savedA && savedA.unlocked) return savedA;
            }

            if (a.id === 'first_word' && totalWords > 0) return { ...a, unlocked: true, unlockedAt: Date.now() };
            if (a.id === 'words_100' && totalWords >= 100) return { ...a, unlocked: true, unlockedAt: Date.now() };
            if (a.id === 'words_500' && totalWords >= 500) return { ...a, unlocked: true, unlockedAt: Date.now() };
            if (a.id === 'words_1000' && totalWords >= 1000) return { ...a, unlocked: true, unlockedAt: Date.now() };
            if (a.id === 'words_5000' && totalWords >= 5000) return { ...a, unlocked: true, unlockedAt: Date.now() };
            if (a.id === 'words_10000' && totalWords >= 10000) return { ...a, unlocked: true, unlockedAt: Date.now() };
            if (a.id === 'words_25000' && totalWords >= 25000) return { ...a, unlocked: true, unlockedAt: Date.now() };
            if (a.id === 'words_50000' && totalWords >= 50000) return { ...a, unlocked: true, unlockedAt: Date.now() };
            if (a.id === 'words_100000' && totalWords >= 100000) return { ...a, unlocked: true, unlockedAt: Date.now() };
            if (a.id === 'notes_5' && notes.length >= 5) return { ...a, unlocked: true, unlockedAt: Date.now() };
            if (a.id === 'notes_10' && notes.length >= 10) return { ...a, unlocked: true, unlockedAt: Date.now() };
            if (a.id === 'notes_25' && notes.length >= 25) return { ...a, unlocked: true, unlockedAt: Date.now() };
            if (a.id === 'notes_50' && notes.length >= 50) return { ...a, unlocked: true, unlockedAt: Date.now() };
            if (a.id === 'organizer' && notes.length > 0) return { ...a, unlocked: true, unlockedAt: Date.now() }; 

            return a;
        });

        return {
            totalWordsWritten: totalWords,
            currentStreak: 1, 
            maxStreak: 1,
            lastWrittenDate: Object.keys(wordsByDate).sort().pop() || null,
            dailyHistory: history,
            points: totalWords * 0.1,
            achievements: updatedAchievements
        };
    } catch (e) {
        console.error("Stats reconstruction failed", e);
        return {
            totalWordsWritten: 0,
            currentStreak: 0,
            maxStreak: 0,
            lastWrittenDate: null,
            dailyHistory: [],
            points: 0,
            achievements: ACHIEVEMENTS_LIST
        };
    }
};

const defaultEditorSettings: EditorSettings = { fontFamily: 'serif', fontSize: 'medium', maxWidth: 'medium' };

const ToastContainer: React.FC<{ toasts: ToastMessage[] }> = ({ toasts }) => (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
            <div key={t.id} className={`bg-white dark:bg-stone-900 border-l-4 p-4 rounded shadow-xl min-w-[300px] pointer-events-auto animate-fadeIn flex items-start gap-3 ${
                t.type === 'success' ? 'border-green-500' : 
                t.type === 'error' ? 'border-red-500' : 
                t.type === 'achievement' ? 'border-yellow-500' : 'border-blue-500'
            }`}>
                {t.type === 'success' && <Check size={20} className="text-green-500 flex-shrink-0" />}
                {t.type === 'error' && <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />}
                {t.type === 'achievement' && <Trophy size={20} className="text-yellow-500 flex-shrink-0" />}
                {t.type === 'info' && <Globe size={20} className="text-blue-500 flex-shrink-0" />}
                <div>
                    <h4 className="font-bold text-sm text-ink-900 dark:text-stone-100">{t.title}</h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{t.description}</p>
                </div>
            </div>
        ))}
    </div>
);

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
      const stored = localStorage.getItem('zen_current_user');
      return stored ? JSON.parse(stored) : null;
  });
  const [users, setUsers] = useState<User[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [inspirationItems, setInspirationItems] = useState<InspirationItem[]>([]);
  const [userStats, setUserStats] = useState<UserStats>(reconstructStats([]));
  const [dataLoaded, setDataLoaded] = useState(false); 
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
      const saved = localStorage.getItem('zen_theme');
      return saved === 'light' ? false : true; 
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSettings, setShowSettings] = useState(false);
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(defaultEditorSettings);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showMoveNote, setShowMoveNote] = useState(false);
  const [noteToMoveId, setNoteToMoveId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Database Config State
  const [dbUrl, setDbUrl] = useState('');
  const [dbKey, setDbKey] = useState('');
  const [dbConnected, setDbConnected] = useState(isSupabaseConfigured());
  const [isDbTesting, setIsDbTesting] = useState(false);
  
  const [usingDefaults, setUsingDefaults] = useState(false);

  useEffect(() => {
    // Window Resize Handler to update isMobile state
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    const handleOnline = () => { setIsOnline(true); addToast('Back Online', 'Syncing your work...', 'success'); setTimeout(() => addToast('Synced', 'All changes saved.', 'success'), 1000); };
    const handleOffline = () => { setIsOnline(false); addToast('Offline Mode', 'You are offline.', 'info'); };
    window.addEventListener('online', handleOnline); window.addEventListener('offline', handleOffline);
    return () => { 
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('online', handleOnline); 
        window.removeEventListener('offline', handleOffline); 
    };
  }, []);

  useEffect(() => {
      const storedUsers = localStorage.getItem('zen_users');
      if (storedUsers) { setUsers(JSON.parse(storedUsers)); } 
      else {
          const adminUser: User = { name: 'Pedro', email: 'pedro@beyond-views.com', password: 'Nense123nense!', isAdmin: true };
          setUsers([adminUser]); localStorage.setItem('zen_users', JSON.stringify([adminUser]));
      }
      
      // Init Settings inputs from Config (using defaults if available)
      const config = getConfig();
      setDbUrl(config.url || '');
      setDbKey(config.key || '');
      setUsingDefaults(config.url === "https://lowlkudvulcccjadqfwj.supabase.co");
  }, []);

  // --- DATA LOADING ---
  useEffect(() => {
    const loadData = async () => {
        if (currentUser) {
            const email = currentUser.email.toLowerCase();
            const prefix = `zen_${email}`;

            try {
                // Load folders and notes (Fail-safe: storage checks both cloud and local)
                let loadedFolders = await storage.getFolders(email);
                let loadedNotes = await storage.getNotes(email);
                
                // Seed default data if completely empty (First time user)
                if (!loadedFolders || loadedFolders.length === 0) {
                    loadedFolders = getInitialFolders();
                    storage.saveFolders(loadedFolders, email); // Save immediately
                }
                
                if (!loadedNotes || loadedNotes.length === 0) {
                    loadedNotes = getInitialNotes();
                    if (loadedNotes[0]) storage.saveNote(loadedNotes[0], email); // Save immediately
                }

                setFolders(loadedFolders || []);
                setNotes(loadedNotes || []);

                const savedInsp = localStorage.getItem(`${prefix}_inspiration`);
                const loadedInspiration = await storage.getInspiration(email) || (savedInsp ? JSON.parse(savedInsp) : getInitialInspiration());
                setInspirationItems(loadedInspiration || []);
                
                const savedStats = localStorage.getItem(`${prefix}_stats`);
                let loadedStats = savedStats ? JSON.parse(savedStats) : null;
                if(!loadedStats) loadedStats = await storage.getStats(email);

                if (loadedStats) {
                    const reconstructed = reconstructStats(loadedNotes || [], loadedStats.achievements);
                    setUserStats({ ...loadedStats, dailyHistory: reconstructed.dailyHistory, totalWordsWritten: reconstructed.totalWordsWritten, achievements: reconstructed.achievements });
                } else { 
                    setUserStats(reconstructStats(loadedNotes || [])); 
                }

                const savedSettings = localStorage.getItem(`${prefix}_editor_settings`);
                setEditorSettings(savedSettings ? JSON.parse(savedSettings) : defaultEditorSettings);
                
                setTimeout(() => setDataLoaded(true), 500);
            } catch (err) {
                console.error("Critical load failure", err);
                // Fallback to defaults to prevent white screen
                setFolders(getInitialFolders());
                setNotes(getInitialNotes());
                setDataLoaded(true);
                addToast("Data Load Error", "Could not load cloud data. Falling back to local defaults.", "error");
            }
        }
    };
    loadData();
  }, [currentUser, dbConnected]);

  // --- SAVE EFFECTS ---
  useEffect(() => { if (currentUser) storage.saveFolders(folders, currentUser.email); }, [folders, currentUser]);
  useEffect(() => { if (currentUser) storage.saveInspiration(inspirationItems, currentUser.email); }, [inspirationItems, currentUser]);
  useEffect(() => { if (currentUser) storage.saveStats(userStats, currentUser.email); }, [userStats, currentUser]);
  useEffect(() => { if (currentUser) localStorage.setItem(`zen_${currentUser.email.toLowerCase()}_editor_settings`, JSON.stringify(editorSettings)); }, [editorSettings, currentUser]);

  useEffect(() => {
    const unlocked = userStats.achievements.find(a => a.id === 'typewriter')?.unlocked;
    if (dataLoaded && editorSettings.fontFamily === 'mono' && !unlocked) unlockAchievement('typewriter');
  }, [editorSettings, dataLoaded, userStats.achievements]);

  useEffect(() => {
      if (darkMode) { 
          document.documentElement.classList.add('dark'); 
          localStorage.setItem('zen_theme', 'dark'); 
          // Only unlock if not already unlocked to prevent spam
          const unlocked = userStats.achievements.find(a => a.id === 'dark_side')?.unlocked;
          if (dataLoaded && !unlocked) unlockAchievement('dark_side'); 
      } else { 
          document.documentElement.classList.remove('dark'); 
          localStorage.setItem('zen_theme', 'light'); 
          const unlocked = userStats.achievements.find(a => a.id === 'light_side')?.unlocked;
          if (dataLoaded && !unlocked) unlockAchievement('light_side'); 
      }
  }, [darkMode, dataLoaded, userStats.achievements]);

  const addToast = (title: string, description: string, type: ToastMessage['type'] = 'info') => {
      const id = Date.now().toString(); setToasts(prev => [...prev, { id, title, description, type }]); setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const unlockAchievement = (id: string) => {
      if(!dataLoaded) return;
      setUserStats(prev => {
          const achievement = prev.achievements.find(a => a.id === id);
          if (achievement && !achievement.unlocked) {
              addToast('Achievement Unlocked!', achievement.title, 'achievement');
              return { ...prev, achievements: prev.achievements.map(a => a.id === id ? { ...a, unlocked: true, unlockedAt: Date.now() } : a) };
          }
          return prev;
      });
  };

  const handleLogin = (user: User) => { 
      const normalizedUser = { ...user, email: user.email.toLowerCase() };
      localStorage.setItem('zen_current_user', JSON.stringify(normalizedUser)); 
      setCurrentUser(normalizedUser); 
      addToast(`Welcome back, ${user.name}`, 'Your desk is ready.', 'info'); 
      setCurrentView('dashboard'); 
  };
  
  const handleLogout = () => { localStorage.removeItem('zen_current_user'); setCurrentUser(null); setDataLoaded(false); setFolders([]); setNotes([]); setInspirationItems([]); setCurrentView('dashboard'); };
  
  const handleCreateFolderClick = () => { setNewFolderName(''); setShowCreateFolder(true); };
  const confirmCreateFolder = (e: React.FormEvent) => {
      e.preventDefault();
      if (newFolderName.trim()) {
          setFolders(prev => [...prev, { id: `f-${Date.now()}`, name: newFolderName, color: '#78716c' }]);
          addToast('Folder Created', `"${newFolderName}" added.`, 'success'); setShowCreateFolder(false); if (folders.length + 1 >= 3) unlockAchievement('organizer');
      }
  };
  const handleUpdateFolder = (id: string, name: string, color?: string) => setFolders(prev => prev.map(f => f.id === id ? { ...f, name, color } : f));
  const handleReorderFolders = (from: number, to: number) => { if (to < 0 || to >= folders.length) return; setFolders(prev => { const n = [...prev]; const [moved] = n.splice(from, 1); n.splice(to, 0, moved); return n; }); };

  const handleCreateNote = (folderId: string | null = null, templateId?: string) => {
    let targetFolderId = folderId || (folders.length > 0 ? folders[0].id : null);
    if (!targetFolderId) {
        const newId = `f-${Date.now()}`;
        setFolders(prev => [...prev, { id: newId, name: 'Drafts', color: '#78716c' }]);
        targetFolderId = newId;
    }
    const template = TEMPLATES.find(t => t.id === templateId);
    if (templateId === 'script') unlockAchievement('scriptwriter');
    
    const newNote: Note = {
      id: `n-${Date.now()}`,
      folderId: targetFolderId,
      title: template?.defaultTitle || '',
      content: template?.content || '',
      updatedAt: Date.now(),
    };
    
    setNotes(prev => {
        const updated = [newNote, ...prev];
        if (updated.length >= 5) unlockAchievement('notes_5');
        if (updated.length >= 10) unlockAchievement('notes_10');
        if (updated.length >= 25) unlockAchievement('notes_25');
        return updated;
    });

    if (currentUser) {
        storage.saveNote(newNote, currentUser.email);
    }

    setActiveNoteId(newNote.id);
    setCurrentView('editor');
    if (isMobile) setSidebarOpen(false);
  };

  const handleDeleteNote = (id: string) => setNoteToDelete(id);
  const confirmDeleteNote = () => {
      if (noteToDelete) {
          setNotes(prev => prev.filter(n => n.id !== noteToDelete));
          if (currentUser) storage.deleteNote(noteToDelete, currentUser.email);
          if (activeNoteId === noteToDelete) { setActiveNoteId(null); setCurrentView('dashboard'); }
          addToast('Note Deleted', 'Permanently removed.', 'info');
      }
      setNoteToDelete(null);
  };

  const handleMoveNoteClick = (id: string) => { setNoteToMoveId(id); setShowMoveNote(true); };
  const confirmMoveNote = (folderId: string) => {
      if (noteToMoveId) {
          setNotes(prev => {
              const updated = prev.map(n => n.id === noteToMoveId ? { ...n, folderId } : n);
              const modified = updated.find(n => n.id === noteToMoveId);
              if (modified && currentUser) storage.saveNote(modified, currentUser.email);
              return updated;
          });
          addToast('Note Moved', 'Success.', 'success'); setShowMoveNote(false); setNoteToMoveId(null);
      }
  };

  const handleUpdateNote = (id: string, content: string, title: string, targetWordCount?: number) => {
    setNotes(prevNotes => {
        const idx = prevNotes.findIndex(n => n.id === id);
        if (idx === -1) return prevNotes;
        
        const oldNote = prevNotes[idx];
        const updatedNote = { ...oldNote, content, title, updatedAt: Date.now(), targetWordCount };
        
        if (currentUser) {
            storage.saveNote(updatedNote, currentUser.email);
        }

        const oldWords = countWordsSimple(oldNote.content);
        const newWords = countWordsSimple(content);
        const diff = newWords - oldWords;
        
        if (diff > 0) setTimeout(() => updateGamification(diff), 0);
        if (content.includes('<img') && !oldNote.content.includes('<img')) setTimeout(() => unlockAchievement('visual_storyteller'), 0);
        
        const newNotes = [...prevNotes];
        newNotes[idx] = updatedNote;
        return newNotes;
    });
  };

  const updateGamification = (wordsAdded: number) => {
      const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
      setUserStats(prev => {
          const newTotal = prev.totalWordsWritten + wordsAdded;
          const history = [...(prev.dailyHistory || [])];
          const todayIdx = history.findIndex(h => h.date === todayStr);
          if (todayIdx >= 0) history[todayIdx] = { ...history[todayIdx], wordCount: history[todayIdx].wordCount + wordsAdded };
          else { history.push({ date: todayStr, wordCount: wordsAdded }); if (history.length > 30) history.shift(); }
          
          return { ...prev, totalWordsWritten: newTotal, dailyHistory: history, points: prev.points + (wordsAdded * 0.1) };
      });
  };

  const handleUpdateInspiration = (item: InspirationItem) => setInspirationItems(prev => {
      const idx = prev.findIndex(i => i.id === item.id);
      return idx >= 0 ? prev.map(i => i.id === item.id ? item : i) : [item, ...prev];
  });
  
  const handleSaveHighlight = (text: string) => {
     // Check for duplicate content (exact match)
     const isDuplicate = inspirationItems.some(i => i.type === 'highlight' && i.content === text);
     if (isDuplicate) return;

     setInspirationItems(prev => [{ id: `i-${Date.now()}`, type: 'highlight', content: text, title: activeNote ? activeNote.title : 'Highlight', snippet: `From note: ${activeNote ? activeNote.title : 'Untitled'}`, createdAt: Date.now(), x: 100, y: 100 }, ...prev]);
     addToast('Highlight Saved', 'Added to Inspiration Board.', 'success');
     unlockAchievement('highlighter');
     unlockAchievement('researcher');
  };
  const handleAddUser = (user: User) => { const u = [...users, user]; setUsers(u); localStorage.setItem('zen_users', JSON.stringify(u)); addToast('User Added', `Welcome ${user.name}`, 'success'); };
  const handleDeleteUser = (email: string) => { const u = users.filter(x => x.email !== email); setUsers(u); localStorage.setItem('zen_users', JSON.stringify(u)); addToast('User Removed', email, 'info'); };
  
  const handleSaveDbConfig = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsDbTesting(true);
      
      saveSupabaseConfig(dbUrl, dbKey);
      
      const success = await testSupabaseConnection();
      setIsDbTesting(false);
      
      if (success) {
          setDbConnected(true);
          setUsingDefaults(false); // Custom config saved
          addToast("Database Connected", "Restarting to sync...", "success");
          setTimeout(() => window.location.reload(), 1000);
      } else {
          clearSupabaseConfig();
          setDbConnected(false);
          addToast("Connection Failed", "Check your URL and Anon Key.", "error");
      }
  };

  const handleDisconnectDb = () => {
      clearSupabaseConfig();
      setDbUrl('');
      setDbKey('');
      setDbConnected(false);
      addToast("Database Disconnected", "Switched to local storage.", "info");
      setTimeout(() => window.location.reload(), 1000);
  };

  const activeNote = notes.find(n => n.id === activeNoteId);
  const activeFolder = folders.find(f => f.id === activeFolderId);

  if (!currentUser) return <><ToastContainer toasts={toasts} /><LoginPage onLogin={handleLogin} users={users} /></>;

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans bg-paper-50 dark:bg-stone-950 transition-colors">
      <ToastContainer toasts={toasts} />
      <Sidebar user={currentUser} folders={folders} notes={notes} activeNoteId={activeNoteId} activeFolderId={activeFolderId} currentView={currentView} darkMode={darkMode} isMobile={isMobile} isOpen={sidebarOpen} onSelectNote={(id) => { setActiveNoteId(id); setCurrentView('editor'); }} onSelectFolder={(id) => { setActiveFolderId(id); setCurrentView('folder'); }} onCreateFolder={handleCreateFolderClick} onUpdateFolder={handleUpdateFolder} onReorderFolder={handleReorderFolders} onCreateNote={handleCreateNote} onDeleteNote={handleDeleteNote} onMoveNote={handleMoveNoteClick} onOpenSettings={() => setShowSettings(true)} onChangeView={setCurrentView} onToggleTheme={() => setDarkMode(!darkMode)} onCloseMobile={() => setSidebarOpen(false)} onLogout={handleLogout} templates={TEMPLATES} />
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {currentView === 'dashboard' && <Dashboard notes={notes} stats={userStats} onToggleSidebar={() => setSidebarOpen(true)} onNavigateToNote={(id) => { setActiveNoteId(id); setCurrentView('editor'); }} />}
        {currentView === 'inspiration' && <InspirationBoard items={inspirationItems} onAddItem={(item) => { setInspirationItems([item, ...inspirationItems]); unlockAchievement('researcher'); if(inspirationItems.length + 1 >= 10) unlockAchievement('muse'); }} onUpdateItem={handleUpdateInspiration} onDeleteItem={(id) => setInspirationItems(inspirationItems.filter(i => i.id !== id))} onToggleSidebar={() => setSidebarOpen(true)} />}
        {currentView === 'folder' && activeFolder && <FolderView folder={activeFolder} notes={notes.filter(n => n.folderId === activeFolder.id)} onSelectNote={(id) => { setActiveNoteId(id); setCurrentView('editor'); }} onToggleSidebar={() => setSidebarOpen(true)} />}
        {currentView === 'admin' && currentUser.isAdmin && <AdminPanel users={users} onAddUser={handleAddUser} onDeleteUser={handleDeleteUser} currentUserEmail={currentUser.email} onToggleSidebar={() => setSidebarOpen(true)} />}
        {currentView === 'editor' && (
             activeNote ? (
              <div className="flex-1 overflow-y-auto bg-paper-50 dark:bg-stone-950">
                   <RichEditor key={activeNote.id} note={activeNote} onUpdate={handleUpdateNote} onSaveHighlight={handleSaveHighlight} allNotes={notes} onToggleSidebar={() => setSidebarOpen(true)} editorSettings={editorSettings} />
              </div>
            ) : <div className="flex items-center justify-center h-full text-stone-400 font-serif">Select a note to begin.</div>
        )}
      </main>
      
      {/* MODALS */}
      {showCreateFolder && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white dark:bg-stone-900 rounded-lg shadow-xl w-full max-w-sm border border-stone-200 dark:border-stone-800 p-6">
                  <h3 className="text-lg font-bold font-serif text-ink-900 dark:text-stone-100 mb-4 flex items-center gap-2"><FolderPlus size={20} />New Folder</h3>
                  <form onSubmit={confirmCreateFolder}>
                      <input autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} className="w-full bg-paper-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded p-2 mb-4 text-ink-900 dark:text-stone-100 outline-none" />
                      <div className="flex gap-3 justify-end"><button type="button" onClick={() => setShowCreateFolder(false)} className="px-4 py-2 bg-stone-100 dark:bg-stone-800 rounded">Cancel</button><button type="submit" className="px-4 py-2 bg-ink-900 text-white rounded">Create</button></div>
                  </form>
              </div>
          </div>
      )}
      {noteToDelete && <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"><div className="bg-white dark:bg-stone-900 p-6 rounded-lg max-w-sm"><h3 className="font-bold mb-2 text-ink-900 dark:text-stone-100">Delete Note?</h3><div className="flex gap-2 justify-end"><button onClick={() => setNoteToDelete(null)} className="px-4 py-2 bg-stone-100 dark:bg-stone-800 rounded">Cancel</button><button onClick={confirmDeleteNote} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button></div></div></div>}
      {showMoveNote && noteToMoveId && <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"><div className="bg-white dark:bg-stone-900 p-6 rounded-lg max-w-sm w-full"><h3 className="font-bold mb-4 text-ink-900 dark:text-stone-100">Move Note</h3><div className="space-y-1 mb-4">{folders.map(f => <button key={f.id} onClick={() => confirmMoveNote(f.id)} className="w-full text-left p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded">{f.name}</button>)}</div><button onClick={() => setShowMoveNote(false)} className="w-full bg-stone-100 dark:bg-stone-800 py-2 rounded">Cancel</button></div></div>}
      
      {showSettings && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
              <div className="bg-white dark:bg-stone-900 p-6 rounded-lg max-w-lg w-full border border-stone-200 dark:border-stone-800 overflow-y-auto max-h-[90vh]">
                  <h2 className="font-bold text-xl mb-4 text-ink-900 dark:text-stone-100">Settings</h2>
                  
                  {/* Database Connection - ADMIN ONLY */}
                  {currentUser.isAdmin && (
                    <div className="mb-6 p-4 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-ink-900 dark:text-stone-100 flex items-center gap-2"><Database size={16}/> Database Connection</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${dbConnected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-stone-200 text-stone-500'}`}>
                                {dbConnected ? 'Connected' : 'Local Only'}
                            </span>
                        </div>
                        
                        {!dbConnected && !usingDefaults ? (
                            <form onSubmit={handleSaveDbConfig} className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Supabase URL</label>
                                    <input value={dbUrl} onChange={e => setDbUrl(e.target.value)} className="w-full text-xs p-2 bg-white dark:bg-stone-900 border rounded text-ink-900 dark:text-stone-100" placeholder="https://xyz.supabase.co" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-stone-500 uppercase mb-1">Project API Key (anon/public)</label>
                                    <input value={dbKey} onChange={e => setDbKey(e.target.value)} type="password" className="w-full text-xs p-2 bg-white dark:bg-stone-900 border rounded text-ink-900 dark:text-stone-100" placeholder="eyJ..." required />
                                    <p className="text-[10px] text-stone-400">Find this in Supabase &#62; Project Settings &#62; API. Use the 'anon' public key.</p>
                                </div>
                                <button type="submit" disabled={isDbTesting} className="w-full bg-ink-900 text-white py-2 rounded text-xs font-bold mt-2 disabled:opacity-50">
                                    {isDbTesting ? 'Testing Connection...' : 'Connect Database'}
                                </button>
                            </form>
                        ) : (
                            <div className="space-y-3">
                                <div className="text-xs text-stone-500">
                                    {usingDefaults ? "Using Integrated Database (Automatic)" : "Your notes are synced to the cloud."}
                                </div>
                                <button onClick={handleDisconnectDb} className="w-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 py-2 rounded text-xs font-bold">Disconnect</button>
                            </div>
                        )}
                    </div>
                  )}

                  {currentUser.isAdmin && (
                      <div className="mb-6 p-4 bg-[#3333cc]/5 border border-[#3333cc]/20 rounded-lg">
                          <h3 className="font-bold text-[#3333cc] mb-2 flex items-center gap-2"><Shield size={16}/> Admin Controls</h3>
                          <button onClick={() => { setShowSettings(false); setCurrentView('admin'); }} className="w-full bg-[#3333cc] hover:bg-[#2222aa] text-white py-2 rounded font-bold text-sm transition-colors">Open Admin Console</button>
                      </div>
                  )}

                  <div className="space-y-4">
                      <div><label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">Editor Width</label><div className="flex gap-2">{['narrow', 'medium', 'wide', 'full'].map((w) => (<button key={w} onClick={() => setEditorSettings(prev => ({...prev, maxWidth: w as any}))} className={`px-3 py-1 rounded text-xs uppercase font-bold border ${editorSettings.maxWidth === w ? 'bg-ink-900 text-white border-ink-900 dark:bg-stone-100 dark:text-stone-900' : 'bg-transparent text-stone-500 border-stone-200'}`}>{w}</button>))}</div></div>
                      <div><label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">Font Family</label><div className="flex gap-2">{['serif', 'sans', 'mono'].map((f) => (<button key={f} onClick={() => setEditorSettings(prev => ({...prev, fontFamily: f as any}))} className={`px-3 py-1 rounded text-xs uppercase font-bold border ${editorSettings.fontFamily === f ? 'bg-ink-900 text-white border-ink-900 dark:bg-stone-100 dark:text-stone-900' : 'bg-transparent text-stone-500 border-stone-200'}`}>{f}</button>))}</div></div>
                  </div>
                  <button onClick={() => setShowSettings(false)} className="w-full bg-stone-100 dark:bg-stone-800 text-ink-900 dark:text-stone-100 py-2 rounded mt-6 font-bold">Close</button>
              </div>
          </div>
      )}
    </div>
  );
};

const App: React.FC = () => (
    <ErrorBoundary>
        <AppContent />
    </ErrorBoundary>
);

export default App;
