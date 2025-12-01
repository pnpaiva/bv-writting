
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { RichEditor } from './components/RichEditor';
import { Dashboard } from './components/Dashboard';
import { InspirationBoard } from './components/InspirationBoard';
import { LoginPage } from './components/LoginPage';
import { FolderView } from './components/FolderView';
import { AdminPanel } from './components/AdminPanel';
import { Folder, Note, ViewMode, User, InspirationItem, EditorSettings, UserStats, Achievement, DailyStat, Template, ToastMessage } from './types';
import { X, Globe, Type, Layout, Maximize, AlertTriangle, Trophy, FolderPlus, FolderInput, Wifi, WifiOff, Cloud, Shield } from 'lucide-react';

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
                    <tr>
                        <td><strong>Point 1</strong></td>
                        <td>Talking head</td>
                        <td>Screen recording of X</td>
                        <td>"First, let's talk about..."</td>
                    </tr>
                    <tr>
                        <td><strong>Outro</strong></td>
                        <td>Talking head</td>
                        <td>Subscribe animation</td>
                        <td>"Thanks for watching..."</td>
                    </tr>
                </tbody>
            </table>
            <h2>Thumbnail Ideas</h2>
            <div class="thumbnail-grid">
                <div class="thumbnail-slot"><div class="image-placeholder">Slot 1</div></div>
                <div class="thumbnail-slot"><div class="image-placeholder">Slot 2</div></div>
                <div class="thumbnail-slot"><div class="image-placeholder">Slot 3</div></div>
            </div>
            <ul>
                <li>Idea 1: Close up with shocked face</li>
                <li>Idea 2: Split screen comparison</li>
            </ul>
        `
    },
    {
        id: 'novel',
        name: 'Novel Chapter',
        description: 'Standard manuscript format',
        defaultTitle: 'Chapter 1',
        content: `
            <p style="text-align: center; font-style: italic;">(Scene setting...)</p>
            <p>It was a dark and stormy night. The rain fell in torrents, except at occasional intervals, when it was checked by a violent gust of wind which swept up the streets (for it is in London that our scene lies), rattling along the housetops, and fiercely agitating the scanty flame of the lamps that struggled against the darkness.</p>
            <p>"Dialogue starts here," she said.</p>
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
            <p><strong>Attendees:</strong> </p>
            <h2>Agenda</h2>
            <ul>
                <li>Topic 1</li>
                <li>Topic 2</li>
            </ul>
            <h2>Notes</h2>
            <p>Discussion points...</p>
            <h2>Action Items</h2>
            <ul>
                <li>[ ] Task 1</li>
                <li>[ ] Task 2</li>
            </ul>
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
    { id: 'i2', type: 'video', content: 'https://www.youtube.com/watch?v=Sagx9oJ0x64', title: 'Vintage Typewriter ASMR', createdAt: Date.now(), x: 400, y: 150 }
];

// Helper to count words for initialization
const countWordsSimple = (html: string) => {
    const plainText = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ');
    return plainText.trim().split(/[\s\n]+/).filter(w => w.length > 0).length;
};

const getInitialStats = (): UserStats => {
    // Calculate REAL word count from initial notes
    const initialNotes = getInitialNotes();
    const realTotalWords = initialNotes.reduce((acc, note) => acc + countWordsSimple(note.content), 0);
    
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const history: DailyStat[] = [];
    
    // Create strict YYYY-MM-DD dates to avoid timezone mismatches
    // Initialize past 6 days to 0, and Today to the real initial count
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const d_yyyy = d.getFullYear();
        const d_mm = String(d.getMonth() + 1).padStart(2, '0');
        const d_dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${d_yyyy}-${d_mm}-${d_dd}`;
        
        history.push({
            date: dateStr,
            wordCount: dateStr === todayStr ? realTotalWords : 0
        });
    }

    // 30 ACHIEVEMENTS DEFINITION
    const achievements: Achievement[] = [
        // Writing Volume
        { id: 'first_word', title: 'First Ink', description: 'Wrote your first word.', icon: 'Feather', unlocked: realTotalWords > 0, unlockedAt: Date.now() },
        { id: 'words_1000', title: 'Scribe', description: 'Wrote 1,000 words total.', icon: 'Scroll', unlocked: realTotalWords >= 1000, unlockedAt: realTotalWords >= 1000 ? Date.now() : undefined },
        { id: 'words_10000', title: 'Author', description: 'Wrote 10,000 words total.', icon: 'BookOpen', unlocked: false },
        { id: 'words_50000', title: 'Masterpiece', description: 'Wrote 50,000 words total.', icon: 'Crown', unlocked: false },
        { id: 'words_100000', title: 'Legend', description: 'Wrote 100,000 words total.', icon: 'Crown', unlocked: false },
        
        // Streaks
        { id: 'streak_3', title: 'Consistency', description: 'Reached a 3-day writing streak.', icon: 'Flame', unlocked: false },
        { id: 'streak_7', title: 'Novelist', description: 'Reached a 7-day writing streak.', icon: 'Flame', unlocked: false },
        { id: 'streak_30', title: 'Dedicated', description: 'Reached a 30-day writing streak.', icon: 'Flame', unlocked: false },
        { id: 'streak_100', title: 'Century Club', description: 'Reached a 100-day writing streak.', icon: 'Flame', unlocked: false },
        
        // Habits
        { id: 'night_owl', title: 'Night Owl', description: 'Wrote something between 12 AM and 5 AM.', icon: 'Moon', unlocked: false },
        { id: 'early_bird', title: 'Early Bird', description: 'Wrote something between 6 AM and 9 AM.', icon: 'Sun', unlocked: false },
        { id: 'weekend_warrior', title: 'Weekend Warrior', description: 'Wrote on a Saturday or Sunday.', icon: 'Calendar', unlocked: false },
        { id: 'speed_writer', title: 'Speed Writer', description: 'Wrote 500 words in one day.', icon: 'Wind', unlocked: false },
        { id: 'marathon', title: 'Marathon', description: 'Wrote 2000 words in one day.', icon: 'TrendingUp', unlocked: false },
        
        // Collection
        { id: 'notes_10', title: 'Collector', description: 'Created 10 notes.', icon: 'Files', unlocked: false },
        { id: 'notes_50', title: 'Librarian', description: 'Created 50 notes.', icon: 'Files', unlocked: false },
        { id: 'notes_100', title: 'Archivist', description: 'Created 100 notes.', icon: 'Files', unlocked: false },
        { id: 'organizer', title: 'Organizer', description: 'Created 3 folders.', icon: 'Folder', unlocked: false },
        
        // Features
        { id: 'goal_met', title: 'Goal Setter', description: 'Reached a word count goal.', icon: 'Target', unlocked: false },
        { id: 'ai_assist', title: 'Co-Pilot', description: 'Used AI assistance.', icon: 'Zap', unlocked: false },
        { id: 'inspiration_5', title: 'Inspired', description: 'Added 5 items to inspiration board.', icon: 'Lightbulb', unlocked: false },
        { id: 'published_1', title: 'Publisher', description: 'Published a note.', icon: 'Globe', unlocked: false },
        { id: 'zen_master', title: 'Zen Master', description: 'Used Focus Mode.', icon: 'Maximize', unlocked: false },
        { id: 'socialite', title: 'Socialite', description: 'Used Social Preview.', icon: 'Eye', unlocked: false },
        { id: 'visual_storyteller', title: 'Visual Storyteller', description: 'Inserted an image into a note.', icon: 'Image', unlocked: false },
        { id: 'director', title: 'Director', description: 'Inserted a video into a note.', icon: 'Video', unlocked: false },
        { id: 'structural_engineer', title: 'Engineer', description: 'Used a table in a note.', icon: 'Table', unlocked: false },
        { id: 'typewriter', title: 'Typewriter', description: 'Used the Monospace font setting.', icon: 'Type', unlocked: false },
        { id: 'editor_chief', title: 'Editor-in-Chief', description: 'Fixed grammar using AI.', icon: 'CheckCircle', unlocked: false },
        { id: 'dark_side', title: 'Dark Side', description: 'Enabled Dark Mode.', icon: 'Moon', unlocked: false },
    ];

    return {
        totalWordsWritten: realTotalWords,
        currentStreak: realTotalWords > 0 ? 1 : 0,
        maxStreak: realTotalWords > 0 ? 1 : 0,
        lastWrittenDate: realTotalWords > 0 ? todayStr : null,
        dailyHistory: history,
        points: realTotalWords * 0.1,
        achievements: achievements
    };
};

const defaultEditorSettings: EditorSettings = {
  fontFamily: 'serif',
  fontSize: 'medium',
  maxWidth: 'medium'
};

const App: React.FC = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
      const stored = localStorage.getItem('zen_current_user');
      return stored ? JSON.parse(stored) : null;
  });

  const [users, setUsers] = useState<User[]>([]);

  // App Data
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [inspirationItems, setInspirationItems] = useState<InspirationItem[]>([]);
  const [userStats, setUserStats] = useState<UserStats>(getInitialStats());
  const [dataLoaded, setDataLoaded] = useState(false); // Flag to prevent duplicate achievement toasts on load
  
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  
  // UI State
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  
  // DEFAULT TO DARK MODE (Check logic: if 'zen_theme' is null, default to dark. If 'light', be light.)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
      const saved = localStorage.getItem('zen_theme');
      if (saved === 'light') return false;
      return true; // Default to dark
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSettings, setShowSettings] = useState(false);
  
  const [editorSettings, setEditorSettings] = useState<EditorSettings>(defaultEditorSettings);
  
  // Popups & Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  
  // Modals
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  
  const [showMoveNote, setShowMoveNote] = useState(false);
  const [noteToMoveId, setNoteToMoveId] = useState<string | null>(null);
  
  // Connectivity
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // --- DATA LOADING & AUTH EFFECTS ---
  
  useEffect(() => {
    // Network listeners
    const handleOnline = () => {
        setIsOnline(true);
        addToast('Back Online', 'Syncing your work...', 'success');
        // Simulate sync completion
        setTimeout(() => {
            addToast('Synced', 'All changes saved to app.', 'success');
        }, 1000);
    };
    const handleOffline = () => {
        setIsOnline(false);
        addToast('Offline Mode', 'You are offline. Work will be saved locally.', 'info');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize Users (Seeding Admin)
  useEffect(() => {
      const storedUsers = localStorage.getItem('zen_users');
      if (storedUsers) {
          setUsers(JSON.parse(storedUsers));
      } else {
          // SEED ADMIN
          const adminUser: User = {
              name: 'Pedro',
              email: 'pedro@beyond-views.com',
              password: 'Nense123nense!',
              isAdmin: true
          };
          setUsers([adminUser]);
          localStorage.setItem('zen_users', JSON.stringify([adminUser]));
      }
  }, []);

  useEffect(() => {
    if (currentUser) {
        // Load user specific data
        const prefix = `zen_${currentUser.email}`;
        
        const savedFolders = localStorage.getItem(`${prefix}_folders`);
        setFolders(savedFolders ? JSON.parse(savedFolders) : getInitialFolders());

        const savedNotes = localStorage.getItem(`${prefix}_notes`);
        setNotes(savedNotes ? JSON.parse(savedNotes) : getInitialNotes());

        const savedInsp = localStorage.getItem(`${prefix}_inspiration`);
        setInspirationItems(savedInsp ? JSON.parse(savedInsp) : getInitialInspiration());

        const savedStats = localStorage.getItem(`${prefix}_stats`);
        const initialStats = getInitialStats();
        
        if(savedStats) {
            const loaded = JSON.parse(savedStats);
            // Fix missing or empty history which causes empty graphs
            let history = loaded.dailyHistory;
            if (!history || history.length === 0) {
                history = initialStats.dailyHistory;
            }
            // Merge achievements
             const mergedAchievements = initialStats.achievements.map(a => {
                const found = loaded.achievements.find((la: Achievement) => la.id === a.id);
                return found ? found : a;
            });

            setUserStats({ 
                ...loaded, 
                achievements: mergedAchievements,
                dailyHistory: history
            });
        } else {
            setUserStats(initialStats);
        }

        setWebhookUrl(localStorage.getItem(`${prefix}_webhook`) || '');
        
        const savedSettings = localStorage.getItem(`${prefix}_editor_settings`);
        setEditorSettings(savedSettings ? JSON.parse(savedSettings) : defaultEditorSettings);
        
        setDataLoaded(true);
    }
  }, [currentUser]);

  // Persist Data on Change
  useEffect(() => {
    if (!currentUser) return;
    const prefix = `zen_${currentUser.email}`;
    localStorage.setItem(`${prefix}_folders`, JSON.stringify(folders));
  }, [folders, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const prefix = `zen_${currentUser.email}`;
    localStorage.setItem(`${prefix}_notes`, JSON.stringify(notes));
  }, [notes, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const prefix = `zen_${currentUser.email}`;
    localStorage.setItem(`${prefix}_inspiration`, JSON.stringify(inspirationItems));
  }, [inspirationItems, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const prefix = `zen_${currentUser.email}`;
    localStorage.setItem(`${prefix}_stats`, JSON.stringify(userStats));
  }, [userStats, currentUser]);

  useEffect(() => {
      if (!currentUser) return;
      const prefix = `zen_${currentUser.email}`;
      localStorage.setItem(`${prefix}_webhook`, webhookUrl);
  }, [webhookUrl, currentUser]);

  useEffect(() => {
      if (!currentUser) return;
      const prefix = `zen_${currentUser.email}`;
      localStorage.setItem(`${prefix}_editor_settings`, JSON.stringify(editorSettings));
  }, [editorSettings, currentUser]);

  // Check achievements when settings change, ONLY if data is loaded
  useEffect(() => {
    if (dataLoaded && editorSettings.fontFamily === 'mono') {
        const isUnlocked = userStats.achievements.find(a => a.id === 'typewriter')?.unlocked;
        if (!isUnlocked) unlockAchievement('typewriter');
    }
  }, [editorSettings, dataLoaded]);

  useEffect(() => {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('zen_theme', 'dark');
        if (dataLoaded) {
             const isUnlocked = userStats.achievements.find(a => a.id === 'dark_side')?.unlocked;
             if (!isUnlocked) unlockAchievement('dark_side');
        }
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('zen_theme', 'light');
      }
  }, [darkMode, dataLoaded]);

  // General UI Effects
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- HANDLERS ---

  const addToast = (title: string, description: string, type: ToastMessage['type'] = 'info') => {
      const id = Date.now().toString();
      setToasts(prev => [...prev, { id, title, description, type }]);
      setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
  };

  const unlockAchievement = (id: string) => {
      setUserStats(prev => {
          const achievement = prev.achievements.find(a => a.id === id);
          if (achievement && !achievement.unlocked) {
              addToast('Achievement Unlocked!', achievement.title, 'achievement');
              return {
                  ...prev,
                  achievements: prev.achievements.map(a => a.id === id ? { ...a, unlocked: true, unlockedAt: Date.now() } : a)
              };
          }
          return prev;
      });
  };

  // User Management
  const handleAddUser = (newUser: User) => {
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      localStorage.setItem('zen_users', JSON.stringify(updatedUsers));
      addToast('User Created', `${newUser.name} has been added to the system.`, 'success');
  };

  const handleDeleteUser = (email: string) => {
      const updatedUsers = users.filter(u => u.email !== email);
      setUsers(updatedUsers);
      localStorage.setItem('zen_users', JSON.stringify(updatedUsers));
      addToast('User Removed', `Access revoked for ${email}`, 'info');
  };

  const handleLogin = (user: User) => {
      localStorage.setItem('zen_current_user', JSON.stringify(user));
      setCurrentUser(user);
      addToast(`Welcome back, ${user.name}`, 'Your desk is ready.', 'info');
      setCurrentView('dashboard');
  };

  const handleLogout = () => {
      localStorage.removeItem('zen_current_user');
      setCurrentUser(null);
      setDataLoaded(false);
      setFolders([]);
      setNotes([]);
      setInspirationItems([]);
      setCurrentView('dashboard');
  };

  const handleCreateFolderClick = () => {
      setNewFolderName('');
      setShowCreateFolder(true);
  };

  const confirmCreateFolder = (e: React.FormEvent) => {
      e.preventDefault();
      if (newFolderName.trim()) {
          setFolders([...folders, { id: `f-${Date.now()}`, name: newFolderName, color: '#78716c' }]);
          addToast('Folder Created', `Folder "${newFolderName}" added to sidebar.`, 'success');
          setShowCreateFolder(false);
          if (folders.length + 1 >= 3) unlockAchievement('organizer');
      }
  };
  
  const handleUpdateFolder = (folderId: string, name: string, color?: string) => {
      setFolders(folders.map(f => f.id === folderId ? { ...f, name, color } : f));
  };
  
  const handleReorderFolders = (fromIndex: number, toIndex: number) => {
      if (toIndex < 0 || toIndex >= folders.length) return;
      const newFolders = [...folders];
      const [moved] = newFolders.splice(fromIndex, 1);
      newFolders.splice(toIndex, 0, moved);
      setFolders(newFolders);
  };

  const handleCreateNote = (folderId: string | null = null, templateId?: string) => {
    let targetFolderId = folderId;
    if (!targetFolderId) {
        if (folders.length === 0) {
            const newId = `f-${Date.now()}`;
            setFolders([{ id: newId, name: 'Drafts' }]);
            targetFolderId = newId;
        } else {
            targetFolderId = folders[0].id;
        }
    }

    const template = TEMPLATES.find(t => t.id === templateId);

    const newNote: Note = {
      id: `n-${Date.now()}`,
      folderId: targetFolderId,
      title: template?.defaultTitle || '',
      content: template?.content || '',
      updatedAt: Date.now(),
    };
    setNotes([newNote, ...notes]);
    setActiveNoteId(newNote.id);
    setCurrentView('editor');
    if (isMobile) setSidebarOpen(false);
    
    // Check note count achievements
    const noteCount = notes.length + 1;
    if (noteCount >= 10) unlockAchievement('notes_10');
    if (noteCount >= 50) unlockAchievement('notes_50');
    if (noteCount >= 100) unlockAchievement('notes_100');
  };

  // Delete Handlers
  const handleDeleteNote = (id: string) => {
    setNoteToDelete(id);
  };

  const confirmDeleteNote = () => {
      if (noteToDelete) {
          setNotes(notes.filter(n => n.id !== noteToDelete));
          if (activeNoteId === noteToDelete) {
              setActiveNoteId(null);
              setCurrentView('dashboard');
          }
          addToast('Note Deleted', 'The note has been permanently removed.', 'info');
      }
      setNoteToDelete(null);
  };

  // Move Note Handlers
  const handleMoveNoteClick = (noteId: string) => {
      setNoteToMoveId(noteId);
      setShowMoveNote(true);
  };

  const confirmMoveNote = (targetFolderId: string) => {
      if (noteToMoveId) {
          setNotes(notes.map(n => n.id === noteToMoveId ? { ...n, folderId: targetFolderId } : n));
          const folderName = folders.find(f => f.id === targetFolderId)?.name;
          addToast('Note Moved', `Moved to ${folderName}`, 'success');
          setShowMoveNote(false);
          setNoteToMoveId(null);
      }
  };

  const getTodayStr = () => {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
  }

  const handleUpdateNote = (id: string, content: string, title: string, targetWordCount?: number) => {
    const oldNote = notes.find(n => n.id === id);
    if (!oldNote) return;

    // Feature Detection for Achievements (Only check if changed)
    if (content !== oldNote.content) {
        if (!content.includes('<img') && content.includes('<img')) unlockAchievement('visual_storyteller');
        if (!content.includes('<iframe') && content.includes('<iframe')) unlockAchievement('director');
        if (!content.includes('<table') && content.includes('<table')) unlockAchievement('structural_engineer');
    }

    const updatedNote = { ...oldNote, content, title, updatedAt: Date.now(), targetWordCount };
    setNotes(notes.map(n => n.id === id ? updatedNote : n));

    const oldWords = countWordsSimple(oldNote.content);
    const newWords = countWordsSimple(content);
    const diff = newWords - oldWords;

    if (diff > 0) {
        updateGamification(diff);
    }
  };

  const updateGamification = (wordsAdded: number) => {
      const todayStr = getTodayStr();
      const hour = new Date().getHours();
      const dayOfWeek = new Date().getDay();

      setUserStats(prev => {
          const newTotal = prev.totalWordsWritten + wordsAdded;
          const newPoints = prev.points + (wordsAdded * 0.1); 
          
          let history = [...(prev.dailyHistory || [])];
          const todayStatIndex = history.findIndex(h => h.date === todayStr);
          let todayCount = wordsAdded;
          
          if (todayStatIndex >= 0) {
              history[todayStatIndex] = { 
                  ...history[todayStatIndex], 
                  wordCount: history[todayStatIndex].wordCount + wordsAdded 
              };
              todayCount = history[todayStatIndex].wordCount;
          } else {
              history.push({ date: todayStr, wordCount: wordsAdded });
              // Keep only last 30 days max to prevent bloat
              if (history.length > 30) history.shift();
          }

          let streak = prev.currentStreak;
          if (prev.lastWrittenDate !== todayStr) {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yY = yesterday.getFullYear();
              const yM = String(yesterday.getMonth() + 1).padStart(2, '0');
              const yD = String(yesterday.getDate()).padStart(2, '0');
              const yesterdayStr = `${yY}-${yM}-${yD}`;

              if (prev.lastWrittenDate === yesterdayStr) {
                  streak += 1;
              } else {
                  streak = 1; 
              }
          }

          const newState = {
              ...prev,
              totalWordsWritten: newTotal,
              points: newPoints,
              currentStreak: streak,
              maxStreak: Math.max(streak, prev.maxStreak),
              lastWrittenDate: todayStr,
              dailyHistory: history,
          };
          
          // Separate achievement checking to avoid duplicate toasts
          checkAchievements(newState, todayCount, hour, dayOfWeek);
          
          return newState;
      });
  };
  
  const checkAchievements = (stats: UserStats, todayCount: number, hour: number, dayOfWeek: number) => {
      const newUnlocked: string[] = [];
      const streak = stats.currentStreak;
      const total = stats.totalWordsWritten;

      if (streak >= 3) newUnlocked.push('streak_3');
      if (streak >= 7) newUnlocked.push('streak_7');
      if (streak >= 30) newUnlocked.push('streak_30');
      if (streak >= 100) newUnlocked.push('streak_100');
      
      if (total >= 1000) newUnlocked.push('words_1000');
      if (total >= 10000) newUnlocked.push('words_10000');
      if (total >= 50000) newUnlocked.push('words_50000');
      if (total >= 100000) newUnlocked.push('words_100000');
      
      if (hour >= 0 && hour < 5) newUnlocked.push('night_owl');
      if (hour >= 6 && hour < 9) newUnlocked.push('early_bird');
      if (dayOfWeek === 0 || dayOfWeek === 6) newUnlocked.push('weekend_warrior');
      
      if (todayCount >= 500) newUnlocked.push('speed_writer');
      if (todayCount >= 2000) newUnlocked.push('marathon');

      // Update state if new unlocks
      setUserStats(current => {
          let changed = false;
          const updatedAchievements = current.achievements.map(a => {
              if (newUnlocked.includes(a.id) && !a.unlocked) {
                  changed = true;
                  addToast('Achievement Unlocked!', a.title, 'achievement');
                  return { ...a, unlocked: true, unlockedAt: Date.now() };
              }
              return a;
          });

          return changed ? { ...current, achievements: updatedAchievements } : current;
      });
  }

  const handleUpdateInspiration = (item: InspirationItem) => {
    setInspirationItems(prev => {
        const idx = prev.findIndex(i => i.id === item.id);
        const newItems = idx >= 0 ? [...prev] : [...prev, item];
        if (idx >= 0) newItems[idx] = item;
        
        if (newItems.length >= 5) unlockAchievement('inspiration_5');
        return newItems;
    });
  };

  const activeNote = notes.find(n => n.id === activeNoteId);
  const activeFolder = folders.find(f => f.id === activeFolderId);

  // --- RENDER ---

  if (!currentUser) {
      return (
        <>
            <ToastContainer toasts={toasts} />
            <LoginPage onLogin={handleLogin} users={users} />
        </>
      );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans bg-paper-50 dark:bg-stone-950 transition-colors">
      
      {/* Global Toast Container */}
      <ToastContainer toasts={toasts} />

      <Sidebar 
        user={currentUser}
        folders={folders}
        notes={notes}
        activeNoteId={activeNoteId}
        activeFolderId={activeFolderId}
        currentView={currentView}
        darkMode={darkMode}
        isMobile={isMobile}
        isOpen={sidebarOpen}
        onSelectNote={(id) => { setActiveNoteId(id); setCurrentView('editor'); }}
        onSelectFolder={(id) => { setActiveFolderId(id); setCurrentView('folder'); }}
        onCreateFolder={handleCreateFolderClick}
        onUpdateFolder={handleUpdateFolder}
        onReorderFolder={handleReorderFolders}
        onCreateNote={handleCreateNote}
        onDeleteNote={handleDeleteNote}
        onMoveNote={handleMoveNoteClick}
        onOpenSettings={() => setShowSettings(true)}
        onChangeView={setCurrentView}
        onToggleTheme={() => setDarkMode(!darkMode)}
        onCloseMobile={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        templates={TEMPLATES}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {currentView === 'dashboard' && (
            <Dashboard 
                notes={notes}
                stats={userStats} 
                onToggleSidebar={() => setSidebarOpen(true)}
                onNavigateToNote={(id) => { setActiveNoteId(id); setCurrentView('editor'); }}
            />
        )}

        {currentView === 'inspiration' && (
             <InspirationBoard 
                items={inspirationItems}
                onAddItem={(item) => setInspirationItems([item, ...inspirationItems])}
                onUpdateItem={handleUpdateInspiration}
                onDeleteItem={(id) => setInspirationItems(inspirationItems.filter(i => i.id !== id))}
                onToggleSidebar={() => setSidebarOpen(true)}
             />
        )}

        {currentView === 'folder' && activeFolder && (
            <FolderView 
                folder={activeFolder}
                notes={notes.filter(n => n.folderId === activeFolder.id)}
                onSelectNote={(id) => { setActiveNoteId(id); setCurrentView('editor'); }}
                onToggleSidebar={() => setSidebarOpen(true)}
            />
        )}

        {currentView === 'admin' && currentUser.isAdmin && (
             <AdminPanel 
                 users={users}
                 onAddUser={handleAddUser}
                 onDeleteUser={handleDeleteUser}
                 currentUserEmail={currentUser.email}
                 onToggleSidebar={() => setSidebarOpen(true)}
             />
        )}

        {currentView === 'editor' && (
             activeNote ? (
              <>
                <div className="flex-1 overflow-y-auto bg-paper-50 dark:bg-stone-950">
                   <RichEditor 
                      note={activeNote} 
                      onUpdate={handleUpdateNote} 
                      allNotes={notes}
                      onToggleSidebar={() => setSidebarOpen(true)}
                      editorSettings={editorSettings}
                   />
                </div>
              </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-stone-400">
                    <p className="font-serif">Select a note to begin.</p>
                </div>
            )
        )}
      </main>

      {/* Delete Modal */}
      {noteToDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white dark:bg-stone-900 rounded-lg shadow-xl w-full max-w-sm border border-stone-200 dark:border-stone-800 p-6 text-center">
                 <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
                     <AlertTriangle size={24} />
                 </div>
                 <h3 className="text-lg font-bold font-serif text-ink-900 dark:text-stone-100 mb-2">Delete Note?</h3>
                 <p className="text-stone-500 text-sm mb-6">This action cannot be undone. Are you sure you want to discard this piece of writing?</p>
                 <div className="flex gap-3 justify-center">
                     <button 
                        onClick={() => setNoteToDelete(null)}
                        className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                     >
                         Cancel
                     </button>
                     <button 
                        onClick={confirmDeleteNote}
                        className="px-4 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-colors shadow-lg"
                     >
                         Delete
                     </button>
                 </div>
            </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolder && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white dark:bg-stone-900 rounded-lg shadow-xl w-full max-w-sm border border-stone-200 dark:border-stone-800 p-6">
                  <h3 className="text-lg font-bold font-serif text-ink-900 dark:text-stone-100 mb-4 flex items-center gap-2">
                      <FolderPlus size={20} />
                      New Folder
                  </h3>
                  <form onSubmit={confirmCreateFolder}>
                      <input 
                          type="text" 
                          autoFocus
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          placeholder="e.g., Short Stories"
                          className="w-full bg-paper-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded p-2 mb-4 text-ink-900 dark:text-stone-100 outline-none focus:ring-2 focus:ring-stone-500 font-serif"
                      />
                      <div className="flex gap-3 justify-end">
                        <button 
                            type="button"
                            onClick={() => setShowCreateFolder(false)}
                            className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-sm"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            disabled={!newFolderName.trim()}
                            className="px-4 py-2 bg-ink-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded font-medium hover:opacity-90 transition-colors text-sm disabled:opacity-50"
                        >
                            Create
                        </button>
                    </div>
                  </form>
              </div>
          </div>
      )}

      {/* Move Note Modal */}
      {showMoveNote && noteToMoveId && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white dark:bg-stone-900 rounded-lg shadow-xl w-full max-w-sm border border-stone-200 dark:border-stone-800 p-6">
                  <h3 className="text-lg font-bold font-serif text-ink-900 dark:text-stone-100 mb-4 flex items-center gap-2">
                      <FolderInput size={20} />
                      Move Note
                  </h3>
                  <div className="max-h-60 overflow-y-auto space-y-1 mb-4 border rounded border-stone-100 dark:border-stone-800 p-1">
                      {folders.map(folder => (
                          <button
                              key={folder.id}
                              onClick={() => confirmMoveNote(folder.id)}
                              className="w-full text-left px-3 py-2 rounded hover:bg-paper-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-serif text-sm flex items-center gap-2 transition-colors"
                          >
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: folder.color || '#78716c' }}></span>
                              {folder.name}
                          </button>
                      ))}
                  </div>
                  <div className="flex justify-end">
                      <button 
                          onClick={() => setShowMoveNote(false)}
                          className="px-4 py-2 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded font-medium hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-sm"
                      >
                          Cancel
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white dark:bg-stone-900 rounded-lg shadow-2xl w-full max-w-lg border border-stone-200 dark:border-stone-700 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-stone-100 dark:border-stone-800">
                    <h2 className="text-xl font-bold font-serif text-ink-900 dark:text-stone-100">Settings</h2>
                    <button onClick={() => setShowSettings(false)} className="text-stone-500 hover:text-ink-900 dark:hover:text-stone-200">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-8">
                    
                    {/* Admin Section (Only for Admins) */}
                    {currentUser?.isAdmin && (
                         <section className="bg-[#3333cc]/10 dark:bg-[#3333cc]/10 p-4 rounded border border-[#3333cc]/20 dark:border-[#3333cc]/30">
                            <h3 className="text-sm font-bold uppercase text-[#3333cc] dark:text-[#3333cc] mb-2 tracking-wider flex items-center gap-2">
                                 <Shield size={16} /> Admin Controls
                            </h3>
                            <p className="text-xs text-stone-600 dark:text-stone-400 mb-4">Manage other writers and system access.</p>
                            <button 
                                onClick={() => { setCurrentView('admin'); setShowSettings(false); }}
                                className="bg-[#3333cc] text-white px-4 py-2 rounded text-sm font-bold hover:bg-[#3333cc]/80 transition-colors w-full"
                            >
                                Open Admin Panel
                            </button>
                         </section>
                    )}

                    {/* Editor Appearance */}
                    <section>
                        <h3 className="text-sm font-bold uppercase text-stone-400 mb-4 tracking-wider flex items-center gap-2">
                             <Type size={16} /> Typography
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Font Family</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['serif', 'sans', 'mono'] as const).map(font => (
                                        <button
                                            key={font}
                                            onClick={() => setEditorSettings({ ...editorSettings, fontFamily: font })}
                                            className={`p-3 rounded border text-sm transition-all
                                                ${font === 'serif' ? 'font-serif' : font === 'sans' ? 'font-sans' : 'font-mono'}
                                                ${editorSettings.fontFamily === font 
                                                    ? 'bg-ink-900 text-white border-ink-900 dark:bg-stone-100 dark:text-stone-900' 
                                                    : 'bg-paper-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-400'}
                                            `}
                                        >
                                            {font.charAt(0).toUpperCase() + font.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Font Size</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['small', 'medium', 'large'] as const).map(size => (
                                        <button
                                            key={size}
                                            onClick={() => setEditorSettings({ ...editorSettings, fontSize: size })}
                                            className={`p-2 rounded border text-sm transition-all font-serif
                                                ${editorSettings.fontSize === size 
                                                    ? 'bg-ink-900 text-white border-ink-900 dark:bg-stone-100 dark:text-stone-900' 
                                                    : 'bg-paper-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-400'}
                                            `}
                                        >
                                            {size.charAt(0).toUpperCase() + size.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                         <h3 className="text-sm font-bold uppercase text-stone-400 mb-4 tracking-wider flex items-center gap-2">
                             <Layout size={16} /> Layout
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-stone-700 dark:text-stone-300 mb-2">Page Width</label>
                            <div className="grid grid-cols-4 gap-2">
                                {(['narrow', 'medium', 'wide', 'full'] as const).map(width => (
                                    <button
                                        key={width}
                                        onClick={() => setEditorSettings({ ...editorSettings, maxWidth: width })}
                                        className={`p-2 rounded border text-sm transition-all font-serif
                                            ${editorSettings.maxWidth === width 
                                                ? 'bg-ink-900 text-white border-ink-900 dark:bg-stone-100 dark:text-stone-900' 
                                                : 'bg-paper-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:border-stone-400'}
                                        `}
                                    >
                                        {width.charAt(0).toUpperCase() + width.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-sm font-bold uppercase text-stone-400 mb-4 tracking-wider flex items-center gap-2">
                             <Maximize size={16} /> Publishing
                        </h3>
                        <div className="bg-paper-50 dark:bg-stone-800 p-4 rounded border border-stone-200 dark:border-stone-700">
                            <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2 font-serif">N8N Webhook URL</label>
                            <input 
                                type="url" 
                                value={webhookUrl}
                                onChange={(e) => setWebhookUrl(e.target.value)}
                                placeholder="https://your-n8n-instance.com/webhook/..."
                                className="w-full border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-ink-900 dark:text-stone-200 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-stone-500 outline-none"
                            />
                            <p className="text-xs text-stone-500 mt-2">
                                Use this webhook to connect your published articles to Notion, WordPress, or any other platform via N8N.
                            </p>
                        </div>
                    </section>
                </div>

                <div className="p-6 border-t border-stone-100 dark:border-stone-800 flex justify-end">
                    <button 
                        onClick={() => setShowSettings(false)}
                        className="bg-ink-900 dark:bg-stone-100 text-paper-50 dark:text-stone-900 px-6 py-2.5 rounded hover:opacity-90 transition-opacity font-serif font-medium"
                    >
                        Save & Close
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const ToastContainer: React.FC<{ toasts: ToastMessage[] }> = ({ toasts }) => {
    return (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
            {toasts.map(toast => (
                <div 
                    key={toast.id}
                    className="bg-white dark:bg-stone-800 border-l-4 rounded shadow-2xl p-4 w-72 toast-enter pointer-events-auto flex items-start gap-3"
                    style={{ 
                        borderColor: toast.type === 'achievement' ? '#eab308' : toast.type === 'error' ? '#ef4444' : '#1c1917' 
                    }}
                >
                    <div className={`${toast.type === 'achievement' ? 'text-yellow-500' : 'text-stone-800 dark:text-stone-200'}`}>
                        {toast.type === 'achievement' && <Trophy size={20} />}
                        {toast.type === 'error' && <AlertTriangle size={20} />}
                        {toast.type === 'info' && <Globe size={20} />}
                        {toast.type === 'success' && <div className="w-5 h-5 rounded-full bg-green-500"></div>}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm text-ink-900 dark:text-stone-100">{toast.title}</h4>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">{toast.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export default App;
