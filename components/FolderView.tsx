
import React, { useState } from 'react';
import { Note, Folder } from '../types';
import { LayoutGrid, List as ListIcon, Calendar, FileText, Image as ImageIcon, Search } from 'lucide-react';

interface FolderViewProps {
  folder: Folder;
  notes: Note[];
  onSelectNote: (id: string) => void;
  onToggleSidebar: () => void;
}

export const FolderView: React.FC<FolderViewProps> = ({ folder, notes, onSelectNote, onToggleSidebar }) => {
  const [viewType, setViewType] = useState<'list' | 'gallery'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotes = notes.filter(n => 
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => b.updatedAt - a.updatedAt);

  // Helper to extract first image or text snippet
  const getNotePreview = (content: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const img = doc.querySelector('img');
    const text = doc.body.textContent || "";
    
    return {
        image: img ? img.src : null,
        excerpt: text.slice(0, 150) + (text.length > 150 ? '...' : '')
    };
  };

  return (
    <div className="h-full flex flex-col bg-paper-50 dark:bg-stone-950 overflow-hidden">
        {/* Header */}
        <div className="p-8 pb-4 border-b border-paper-200 dark:border-stone-800">
             <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                     <div className="w-4 h-4 rounded-full" style={{ backgroundColor: folder.color || '#78716c' }}></div>
                     <h1 className="text-3xl font-serif font-bold text-ink-900 dark:text-stone-100">{folder.name}</h1>
                     <span className="text-stone-400 text-sm font-medium ml-2">{notes.length} Notes</span>
                 </div>
                 
                 <div className="flex items-center gap-2 bg-paper-100 dark:bg-stone-900 p-1 rounded-lg border border-paper-200 dark:border-stone-800">
                     <button 
                        onClick={() => setViewType('list')}
                        className={`p-2 rounded transition-colors ${viewType === 'list' ? 'bg-white dark:bg-stone-800 text-ink-900 dark:text-stone-100 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                        title="List View"
                     >
                         <ListIcon size={18} />
                     </button>
                     <button 
                        onClick={() => setViewType('gallery')}
                        className={`p-2 rounded transition-colors ${viewType === 'gallery' ? 'bg-white dark:bg-stone-800 text-ink-900 dark:text-stone-100 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}
                        title="Gallery View"
                     >
                         <LayoutGrid size={18} />
                     </button>
                 </div>
             </div>

             {/* Search */}
             <div className="relative max-w-md">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                 <input 
                    type="text" 
                    placeholder="Search in folder..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-stone-400/50"
                 />
             </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
            {filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-stone-400">
                    <FileText size={48} className="mb-4 opacity-50" />
                    <p>No notes found in this folder.</p>
                </div>
            ) : (
                <>
                    {viewType === 'list' ? (
                        <div className="bg-white dark:bg-stone-900 rounded-xl border border-paper-200 dark:border-stone-800 overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-paper-200 dark:border-stone-800 bg-paper-50 dark:bg-stone-900/50 text-xs font-bold text-stone-500 uppercase tracking-wider">
                                        <th className="px-6 py-4 font-serif">Title</th>
                                        <th className="px-6 py-4 font-serif w-48">Last Edited</th>
                                        <th className="px-6 py-4 font-serif w-32">Words</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-paper-100 dark:divide-stone-800">
                                    {filteredNotes.map(note => {
                                        const preview = getNotePreview(note.content);
                                        return (
                                            <tr 
                                                key={note.id} 
                                                onClick={() => onSelectNote(note.id)}
                                                className="hover:bg-paper-50 dark:hover:bg-stone-800/50 cursor-pointer transition-colors group"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <FileText size={16} className="text-stone-400 group-hover:text-ink-900 dark:group-hover:text-stone-200" />
                                                        <div>
                                                            <div className="font-bold text-ink-900 dark:text-stone-200 font-serif">{note.title || "Untitled"}</div>
                                                            <div className="text-xs text-stone-500 line-clamp-1">{preview.excerpt}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-stone-500">
                                                    {new Date(note.updatedAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-stone-500 font-mono">
                                                    {preview.excerpt.split(' ').length}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredNotes.map(note => {
                                const preview = getNotePreview(note.content);
                                return (
                                    <div 
                                        key={note.id} 
                                        onClick={() => onSelectNote(note.id)}
                                        className="bg-white dark:bg-stone-900 rounded-xl border border-paper-200 dark:border-stone-800 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-64"
                                    >
                                        <div className="h-32 bg-paper-100 dark:bg-stone-800 relative overflow-hidden">
                                            {preview.image ? (
                                                <img src={preview.image} alt="Note cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-stone-300 dark:text-stone-700">
                                                    <ImageIcon size={32} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4 flex flex-col flex-1">
                                            <h3 className="font-bold text-ink-900 dark:text-stone-200 font-serif mb-2 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {note.title || "Untitled"}
                                            </h3>
                                            <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-3 mb-auto">
                                                {preview.excerpt || "No content preview available."}
                                            </p>
                                            <div className="mt-3 flex items-center gap-1 text-[10px] text-stone-400 uppercase tracking-wider font-bold">
                                                <Calendar size={10} />
                                                {new Date(note.updatedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    </div>
  );
};
