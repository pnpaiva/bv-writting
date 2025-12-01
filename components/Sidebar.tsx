
import React, { useState, useRef, useEffect } from 'react';
import { Folder, Plus, FileText, ChevronRight, ChevronDown, Settings, Trash2, LayoutDashboard, Sun, Moon, X, Lightbulb, LogOut, FolderInput, LayoutTemplate, MoreVertical, ArrowUp, ArrowDown, Music, Volume2, VolumeX, Play, Pause, Volume1, SkipForward, SkipBack, ListMusic } from 'lucide-react';
import { Folder as FolderType, Note, ViewMode, User, Template } from '../types';

interface SidebarProps {
  user: User;
  folders: FolderType[];
  notes: Note[];
  activeNoteId: string | null;
  activeFolderId: string | null;
  currentView: ViewMode;
  darkMode: boolean;
  isMobile: boolean;
  isOpen: boolean;
  templates: Template[];
  onSelectNote: (id: string) => void;
  onSelectFolder: (id: string) => void;
  onCreateNote: (folderId: string | null, templateId?: string) => void;
  onCreateFolder: () => void;
  onUpdateFolder: (id: string, name: string, color?: string) => void;
  onReorderFolder: (fromIndex: number, toIndex: number) => void;
  onDeleteNote: (id: string) => void;
  onMoveNote: (id: string) => void;
  onOpenSettings: () => void;
  onChangeView: (view: ViewMode) => void;
  onToggleTheme: () => void;
  onCloseMobile: () => void;
  onLogout: () => void;
}

const PLAYLIST = [
  { title: "Gymnopédie No.1", composer: "Erik Satie", url: "https://ia800504.us.archive.org/33/items/ErikSatieGymnopedieNo1/ErikSatieGymnopedieNo1.mp3" },
  { title: "Moonlight Sonata", composer: "Beethoven", url: "https://ia800307.us.archive.org/17/items/BeethovenMoonlightSonata/Beethoven%20-%20Moonlight%20Sonata.mp3" },
  { title: "Clair de Lune", composer: "Debussy", url: "https://ia800201.us.archive.org/29/items/ClairDeLune_561/Debussy-ClairDeLune.mp3" },
  { title: "Nocturne Op.9 No.2", composer: "Chopin", url: "https://ia800304.us.archive.org/28/items/ChopinNocturneOp.9No.2/Chopin_Nocturne_Op_9_No_2_64kb.mp3" },
  { title: "Air on the G String", composer: "Bach", url: "https://ia902607.us.archive.org/25/items/AirOnTheGString_664/Bach-AirOnTheGString.mp3" },
  { title: "Morning Mood", composer: "Grieg", url: "https://ia800503.us.archive.org/9/items/GriegMorningMood/Grieg_Morning_Mood.mp3" }
];

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  folders,
  notes,
  activeNoteId,
  activeFolderId,
  currentView,
  darkMode,
  isMobile,
  isOpen,
  templates,
  onSelectNote,
  onSelectFolder,
  onCreateNote,
  onCreateFolder,
  onUpdateFolder,
  onReorderFolder,
  onDeleteNote,
  onMoveNote,
  onOpenSettings,
  onChangeView,
  onToggleTheme,
  onCloseMobile,
  onLogout
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(folders.map(f => f.id)));
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const hasInitializedExpansion = useRef(false);

  // Auto-expand folders when they load (if not already done)
  useEffect(() => {
    if (!hasInitializedExpansion.current && folders.length > 0) {
        setExpandedFolders(new Set(folders.map(f => f.id)));
        hasInitializedExpansion.current = true;
    }
  }, [folders]);

  // Music Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.6); // Default to 60% volume
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [showPlaylist, setShowPlaylist] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadedUrlRef = useRef<string | null>(null);

  const currentTrack = PLAYLIST[currentTrackIndex];

  const toggleFolder = (folderId: string) => {
    const newSet = new Set(expandedFolders);
    if (newSet.has(folderId)) newSet.delete(folderId);
    else newSet.add(folderId);
    setExpandedFolders(newSet);
  };

  const toggleMusic = () => {
    setIsPlaying(!isPlaying);
  };

  const nextTrack = () => {
      setCurrentTrackIndex((prev) => (prev + 1) % PLAYLIST.length);
      setIsPlaying(true);
  };

  const prevTrack = () => {
      setCurrentTrackIndex((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length);
      setIsPlaying(true);
  };

  const selectTrack = (index: number) => {
      setCurrentTrackIndex(index);
      setIsPlaying(true);
      setShowPlaylist(false);
  }

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Handle Volume Change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVol = parseFloat(e.target.value);
      setVolume(newVol);
      if (audioRef.current) {
          audioRef.current.volume = newVol;
      }
      if (newVol > 0 && isMuted) {
          setIsMuted(false);
          if (audioRef.current) audioRef.current.muted = false;
      }
  };

  // Initialize Audio & Listeners
  useEffect(() => {
    if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.volume = volume;
        audioRef.current.crossOrigin = "anonymous";
        // Initialize src immediately to prevent "no supported sources" error
        audioRef.current.src = PLAYLIST[0].url;
        loadedUrlRef.current = PLAYLIST[0].url;
    }

    const audio = audioRef.current;
    
    // Auto-next track when ended
    const handleEnded = () => {
        setCurrentTrackIndex(prev => (prev + 1) % PLAYLIST.length);
    };

    // Error handling to skip broken tracks
    const handleError = (e: Event) => {
        console.warn("Audio error, skipping track:", e);
        if (isPlaying) {
             // Delay slightly to prevent rapid loops if internet is down
             setTimeout(() => setCurrentTrackIndex(prev => (prev + 1) % PLAYLIST.length), 1000);
        }
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    return () => {
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
    };
  }, []);

  // Handle Track Source Changes
  useEffect(() => {
      if (!audioRef.current || !currentTrack) return;
      const audio = audioRef.current;
      
      // Use Ref to track loaded URL to prevent DOM/String mismatches causing reload loops
      if (loadedUrlRef.current !== currentTrack.url) {
          audio.src = currentTrack.url;
          loadedUrlRef.current = currentTrack.url;
          audio.load();
          
          if (isPlaying) {
              const playPromise = audio.play();
              if (playPromise !== undefined) {
                  playPromise.catch(e => {
                      console.error("Play failed (likely interrupted):", e);
                  });
              }
          }
      }
  }, [currentTrackIndex, currentTrack]); // Added currentTrack dependency

  // Handle Play/Pause State
  useEffect(() => {
      if (!audioRef.current) return;
      
      const audio = audioRef.current;
      
      if (isPlaying) {
          // Safety: Ensure src is set before playing
          if (!audio.src || audio.src === window.location.href) {
             audio.src = currentTrack.url;
             loadedUrlRef.current = currentTrack.url;
          }

          const playPromise = audio.play();
          if (playPromise !== undefined) {
              playPromise.catch(e => {
                  // Ignore abort errors which happen when skipping tracks quickly
                  if (e.name !== 'AbortError') {
                       console.error("Play failed:", e);
                       setIsPlaying(false);
                  }
              });
          }
      } else {
          audio.pause();
      }
  }, [isPlaying]);

  // Sync Volume
  useEffect(() => {
      if (audioRef.current) {
          audioRef.current.volume = volume;
      }
  }, [volume]);


  const FOLDER_COLORS = [
      { name: 'Stone', value: '#78716c' },
      { name: 'Red', value: '#fb7185' },
      { name: 'Orange', value: '#fbbf24' },
      { name: 'Green', value: '#34d399' },
      { name: 'Blue', value: '#38bdf8' },
      { name: 'Purple', value: '#a78bfa' },
  ];

  // Base classes for vintage theme
  const containerClass = `
    h-full flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out z-40
    bg-paper-100 border-r border-paper-200 
    dark:bg-stone-900 dark:border-stone-800
    ${isMobile ? 'fixed inset-y-0 left-0 w-72 shadow-2xl' : 'w-64 relative'}
    ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}
  `;

  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
            onClick={onCloseMobile}
        />
      )}

      {/* Folder Settings Modal */}
      {editingFolderId && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-stone-900 p-6 rounded-lg shadow-xl w-full max-w-sm border border-stone-200 dark:border-stone-700">
                  <h3 className="text-lg font-bold text-ink-900 dark:text-stone-100 mb-4 font-serif">Edit Folder</h3>
                  
                  {folders.map((f, index) => {
                      if (f.id !== editingFolderId) return null;
                      return (
                          <div key={f.id} className="space-y-4">
                              <div>
                                  <label className="block text-xs font-bold uppercase text-stone-500 mb-1">Name</label>
                                  <input 
                                      value={f.name}
                                      onChange={(e) => onUpdateFolder(f.id, e.target.value, f.color)}
                                      className="w-full bg-paper-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded p-2 text-sm outline-none"
                                  />
                              </div>
                              
                              <div>
                                  <label className="block text-xs font-bold uppercase text-stone-500 mb-2">Color Code</label>
                                  <div className="flex gap-2">
                                      {FOLDER_COLORS.map(c => (
                                          <button
                                              key={c.value}
                                              onClick={() => onUpdateFolder(f.id, f.name, c.value)}
                                              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110
                                                  ${f.color === c.value ? 'border-ink-900 dark:border-stone-100 scale-110' : 'border-transparent'}
                                              `}
                                              style={{ backgroundColor: c.value }}
                                              title={c.name}
                                          />
                                      ))}
                                  </div>
                              </div>

                              <div>
                                  <label className="block text-xs font-bold uppercase text-stone-500 mb-2">Order</label>
                                  <div className="flex gap-2">
                                      <button 
                                          onClick={() => onReorderFolder(index, index - 1)}
                                          disabled={index === 0}
                                          className="flex-1 py-2 bg-stone-100 dark:bg-stone-800 rounded hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-50 flex justify-center text-stone-600 dark:text-stone-400"
                                      >
                                          <ArrowUp size={16} /> Move Up
                                      </button>
                                      <button 
                                          onClick={() => onReorderFolder(index, index + 1)}
                                          disabled={index === folders.length - 1}
                                          className="flex-1 py-2 bg-stone-100 dark:bg-stone-800 rounded hover:bg-stone-200 dark:hover:bg-stone-700 disabled:opacity-50 flex justify-center text-stone-600 dark:text-stone-400"
                                      >
                                          <ArrowDown size={16} /> Move Down
                                      </button>
                                  </div>
                              </div>

                              <div className="pt-4 flex justify-end">
                                  <button 
                                      onClick={() => setEditingFolderId(null)}
                                      className="px-4 py-2 bg-ink-900 text-white dark:bg-stone-100 dark:text-stone-900 rounded font-bold text-sm"
                                  >
                                      Done
                                  </button>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      <div className={containerClass}>
        {/* Header */}
        <div className="p-6 border-b border-paper-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-3 text-ink-900 dark:text-stone-100 font-serif font-bold text-lg">
              <span>Beyond Words</span>
          </div>
          {isMobile && (
              <button onClick={onCloseMobile} className="text-stone-500">
                  <X size={20} />
              </button>
          )}
        </div>
        
        {/* User Info */}
        <div className="px-6 pt-4 pb-2">
           <div className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">Writer</div>
           <div className="font-serif text-ink-900 dark:text-stone-200 truncate">{user.name}</div>
           <div className="text-xs text-stone-500 truncate">{user.email}</div>
        </div>

        {/* Global New Note Button with Templates */}
        <div className="px-4 mt-4 relative">
            <div className="flex shadow-sm rounded-lg overflow-hidden">
                <button 
                    onClick={() => onCreateNote(null)}
                    className="flex-1 bg-ink-900 hover:bg-black dark:bg-stone-100 dark:hover:bg-white text-paper-50 dark:text-stone-900 py-2 font-bold flex items-center justify-center gap-2 transition-colors text-sm"
                >
                    <Plus size={16} />
                    <span>New Note</span>
                </button>
                <button 
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="bg-ink-800 hover:bg-ink-900 dark:bg-stone-200 dark:hover:bg-stone-300 text-paper-50 dark:text-stone-900 px-2 flex items-center justify-center transition-colors border-l border-white/20 dark:border-stone-900/20"
                >
                    <ChevronDown size={14} />
                </button>
            </div>
            
            {showTemplates && (
                <div className="absolute top-full left-4 right-4 mt-1 bg-white dark:bg-stone-800 rounded-lg shadow-xl border border-stone-200 dark:border-stone-700 overflow-hidden z-50">
                    <div className="px-3 py-2 text-xs font-bold text-stone-400 uppercase bg-paper-50 dark:bg-stone-900 border-b border-stone-100 dark:border-stone-700">
                        Start from Template
                    </div>
                    {templates.map(tpl => (
                         <button
                            key={tpl.id}
                            onClick={() => {
                                onCreateNote(null, tpl.id);
                                setShowTemplates(false);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-paper-100 dark:hover:bg-stone-700 flex items-center gap-2"
                        >
                            <LayoutTemplate size={14} className="text-stone-400" />
                            <span>{tpl.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Navigation */}
        <div className="px-3 py-4 space-y-1">
            <button 
                onClick={() => { onChangeView('dashboard'); if(isMobile) onCloseMobile(); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${currentView === 'dashboard' 
                        ? 'bg-paper-200 text-ink-900 dark:bg-stone-800 dark:text-stone-100' 
                        : 'text-stone-600 hover:bg-paper-200/50 dark:text-stone-400 dark:hover:bg-stone-800/50'}
                `}
            >
                <LayoutDashboard size={18} />
                Dashboard
            </button>
            
            <button 
                onClick={() => { onChangeView('inspiration'); if(isMobile) onCloseMobile(); }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${currentView === 'inspiration' 
                        ? 'bg-paper-200 text-ink-900 dark:bg-stone-800 dark:text-stone-100' 
                        : 'text-stone-600 hover:bg-paper-200/50 dark:text-stone-400 dark:hover:bg-stone-800/50'}
                `}
            >
                <Lightbulb size={18} />
                Inspiration
            </button>
        </div>

        <div className="px-6 py-2">
            <div className="h-px bg-paper-200 dark:bg-stone-800 w-full"></div>
            <div className="flex items-center justify-between mt-4 mb-2">
                <span className="text-xs font-bold uppercase tracking-widest text-stone-500 dark:text-stone-500">Folders</span>
                <button onClick={onCreateFolder} className="p-1 hover:bg-paper-200 dark:hover:bg-stone-700 rounded text-stone-500" title="New Folder">
                    <Plus size={14} />
                </button>
            </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {folders.length === 0 ? (
              <div className="px-4 py-8 space-y-3 animate-pulse">
                  <div className="h-4 bg-paper-200 dark:bg-stone-800 rounded w-3/4"></div>
                  <div className="h-4 bg-paper-200 dark:bg-stone-800 rounded w-1/2"></div>
              </div>
          ) : (
             folders.map(folder => {
              const folderNotes = notes.filter(n => n.folderId === folder.id);
              const isExpanded = expandedFolders.has(folder.id);
              const isActive = activeFolderId === folder.id && currentView === 'folder';

              return (
                  <div key={folder.id} className="mb-2">
                      <div 
                          className={`flex items-center justify-between px-2 py-1.5 rounded cursor-pointer group transition-colors ${isActive ? 'bg-paper-200 dark:bg-stone-800' : 'hover:bg-paper-200/50 dark:hover:bg-stone-800/30'}`}
                      >
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                               <button 
                                   onClick={(e) => { e.stopPropagation(); toggleFolder(folder.id); }}
                                   className="p-1 text-stone-400 hover:text-stone-600"
                               >
                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                               </button>
                               
                               <div 
                                    className="flex items-center gap-2 flex-1 min-w-0"
                                    onClick={() => { onSelectFolder(folder.id); if(isMobile) onCloseMobile(); }}
                                >
                                   {/* Color Dot */}
                                   <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: folder.color || '#78716c' }}></div>
                                   
                                   <span className={`text-sm font-serif font-medium truncate ${isActive ? 'text-ink-900 dark:text-stone-100 font-bold' : 'text-stone-700 dark:text-stone-300'}`}>
                                       {folder.name}
                                   </span>
                               </div>
                          </div>
                          
                          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setEditingFolderId(folder.id); }}
                                    className="p-1 hover:bg-paper-300 dark:hover:bg-stone-700 rounded text-stone-500"
                                    title="Folder Settings"
                                >
                                    <Settings size={12} />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onCreateNote(folder.id); }}
                                    className="p-1 hover:bg-paper-300 dark:hover:bg-stone-700 rounded text-stone-500"
                                    title="Add Note"
                                >
                                    <Plus size={12} />
                                </button>
                          </div>
                      </div>

                      {isExpanded && (
                          <div className="ml-2 border-l border-paper-300 dark:border-stone-700 pl-2 mt-1 space-y-0.5">
                              {folderNotes.map(note => (
                                  <div 
                                      key={note.id}
                                      className={`
                                          group flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-all
                                          ${activeNoteId === note.id && currentView === 'editor'
                                              ? 'bg-white text-ink-900 shadow-sm dark:bg-stone-800 dark:text-stone-100' 
                                              : 'text-stone-600 hover:bg-paper-200/50 hover:text-ink-900 dark:text-stone-400 dark:hover:bg-stone-800/30'}
                                      `}
                                      onClick={() => { onSelectNote(note.id); if(isMobile) onCloseMobile(); }}
                                  >
                                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                                          <FileText size={14} className={activeNoteId === note.id && currentView === 'editor' ? 'text-ink-900 dark:text-stone-200' : 'text-stone-400'} />
                                          <span className="truncate font-serif">{note.title || "Untitled"}</span>
                                      </div>
                                      
                                      <div className="hidden group-hover:flex items-center gap-1">
                                          <button 
                                              onClick={(e) => { e.stopPropagation(); onMoveNote(note.id); }}
                                              className="p-1 text-stone-400 hover:text-blue-500 rounded hover:bg-paper-200 dark:hover:bg-stone-700"
                                              title="Move Note"
                                          >
                                              <FolderInput size={12} />
                                          </button>
                                          <button 
                                              onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
                                              className="p-1 text-stone-400 hover:text-red-500 rounded hover:bg-paper-200 dark:hover:bg-stone-700"
                                          >
                                              <Trash2 size={12} />
                                          </button>
                                      </div>
                                  </div>
                              ))}
                              {folderNotes.length === 0 && (
                                  <div className="px-4 py-2 text-xs text-stone-400 italic font-serif">Empty folder</div>
                              )}
                          </div>
                      )}
                  </div>
              )
          })
          )}
        </div>

        {/* Music Player & Footer */}
        <div className="p-4 border-t border-paper-200 dark:border-stone-800 space-y-1 bg-paper-100 dark:bg-stone-900 z-10 relative">
          
          {/* Playlist Popover */}
          {showPlaylist && (
              <div className="absolute bottom-full left-0 right-0 mb-2 mx-4 bg-white dark:bg-stone-800 rounded-lg shadow-xl border border-stone-200 dark:border-stone-700 overflow-hidden max-h-48 overflow-y-auto">
                  <div className="px-3 py-2 text-xs font-bold text-stone-400 uppercase bg-paper-50 dark:bg-stone-900 border-b border-stone-100 dark:border-stone-700">Select Track</div>
                  {PLAYLIST.map((track, idx) => (
                      <button
                          key={idx}
                          onClick={() => selectTrack(idx)}
                          className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:bg-paper-100 dark:hover:bg-stone-700 ${currentTrackIndex === idx ? 'bg-paper-200 dark:bg-stone-700 text-ink-900 dark:text-stone-100 font-bold' : 'text-stone-600 dark:text-stone-400'}`}
                      >
                          <span className="truncate">{track.title}</span>
                          {currentTrackIndex === idx && <Music size={12} />}
                      </button>
                  ))}
              </div>
          )}

          {/* Classical Music Player */}
          <div className="mb-3 p-3 bg-paper-200 dark:bg-stone-800 rounded-lg flex flex-col gap-2">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-stone-300 dark:bg-stone-700 rounded-full text-stone-600 dark:text-stone-300 flex-shrink-0">
                          <Music size={14} />
                      </div>
                      <div className="min-w-0">
                          <div className="text-xs font-bold text-ink-900 dark:text-stone-100 font-serif truncate">{currentTrack.title}</div>
                          <div className="text-[10px] text-stone-500 truncate">{currentTrack.composer}</div>
                      </div>
                  </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between gap-2 mt-1">
                 <button onClick={prevTrack} className="p-1 hover:bg-stone-300 dark:hover:bg-stone-700 rounded text-stone-500"><SkipBack size={14}/></button>
                 <button onClick={toggleMusic} className="p-1.5 bg-stone-300 dark:bg-stone-700 hover:bg-stone-400 dark:hover:bg-stone-600 rounded-full text-ink-900 dark:text-stone-200 flex-1 flex justify-center">
                     {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                 </button>
                 <button onClick={nextTrack} className="p-1 hover:bg-stone-300 dark:hover:bg-stone-700 rounded text-stone-500"><SkipForward size={14}/></button>
                 <button onClick={() => setShowPlaylist(!showPlaylist)} className={`p-1 rounded ${showPlaylist ? 'bg-stone-300 dark:bg-stone-700 text-ink-900' : 'text-stone-500 hover:bg-stone-300 dark:hover:bg-stone-700'}`} title="Playlist"><ListMusic size={14}/></button>
              </div>
              
              {/* Volume Slider */}
              <div className="flex items-center gap-2 px-1">
                  <button onClick={toggleMute} className="text-stone-400 hover:text-stone-600">
                     {isMuted ? <VolumeX size={12} /> : <Volume1 size={12} />}
                  </button>
                  <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.05" 
                      value={volume} 
                      onChange={handleVolumeChange}
                      className="w-full h-1 bg-stone-300 dark:bg-stone-700 rounded-lg appearance-none cursor-pointer accent-ink-900 dark:accent-stone-200"
                  />
              </div>
          </div>

          <button 
              onClick={onToggleTheme}
              className="flex items-center gap-3 text-sm text-stone-600 dark:text-stone-400 hover:text-ink-900 dark:hover:text-stone-200 w-full px-3 py-2 rounded hover:bg-paper-200 dark:hover:bg-stone-800 transition-colors"
          >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>
          <button 
              onClick={onOpenSettings}
              className="flex items-center gap-3 text-sm text-stone-600 dark:text-stone-400 hover:text-ink-900 dark:hover:text-stone-200 w-full px-3 py-2 rounded hover:bg-paper-200 dark:hover:bg-stone-800 transition-colors"
          >
              <Settings size={16} />
              <span>Settings & Publish</span>
          </button>
          <button 
              onClick={onLogout}
              className="flex items-center gap-3 text-sm text-red-500 hover:text-red-700 w-full px-3 py-2 rounded hover:bg-paper-200 dark:hover:bg-stone-800 transition-colors"
          >
              <LogOut size={16} />
              <span>Log Out</span>
          </button>
        </div>
      </div>
    </>
  );
};
