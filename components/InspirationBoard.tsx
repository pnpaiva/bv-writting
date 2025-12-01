import React, { useState, useRef, useEffect } from 'react';
import { InspirationItem, InspirationType } from '../types';
import { Plus, Link as LinkIcon, Image as ImageIcon, Video, Type, Trash2, Sparkles, X, Move, Edit2, ZoomIn, ZoomOut, MousePointer2, Search, LayoutGrid, List, Quote } from 'lucide-react';
import { generateWritingAssistance } from '../services/geminiService';

interface InspirationBoardProps {
  items: InspirationItem[];
  onAddItem: (item: InspirationItem) => void;
  onUpdateItem: (item: InspirationItem) => void;
  onDeleteItem: (id: string) => void;
  onToggleSidebar: () => void;
}

export const InspirationBoard: React.FC<InspirationBoardProps> = ({ items, onAddItem, onUpdateItem, onDeleteItem, onToggleSidebar }) => {
  const [showModal, setShowModal] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [editingItem, setEditingItem] = useState<InspirationItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  // Canvas State
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Item Dragging State
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [startDrag, setStartDrag] = useState({ x: 0, y: 0 }); // Mouse position at start
  const [itemStart, setItemStart] = useState({ x: 0, y: 0 }); // Item position at start

  // Filter Items
  const filteredItems = items.filter(item => {
      if (!searchTerm) return true;
      const lowerTerm = searchTerm.toLowerCase();
      return (
          (item.title && item.title.toLowerCase().includes(lowerTerm)) ||
          item.content.toLowerCase().includes(lowerTerm) ||
          (item.snippet && item.snippet.toLowerCase().includes(lowerTerm))
      );
  });
  
  const highlights = items.filter(i => i.type === 'highlight');

  // --- Canvas Navigation ---

  const handleWheel = (e: React.WheelEvent) => {
      if (viewMode === 'list') return;
      // Zoom on ctrl + wheel
      if (e.ctrlKey) {
          e.preventDefault();
          const zoomSensitivity = 0.001;
          const delta = -e.deltaY * zoomSensitivity;
          const newScale = Math.min(Math.max(scale + delta, 0.2), 3);
          setScale(newScale);
      } else {
          // Pan on regular wheel
          setOffset(prev => ({
              x: prev.x - e.deltaX,
              y: prev.y - e.deltaY
          }));
      }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
      if (viewMode === 'list') return;
      // If clicking directly on canvas (not on an item)
      if (e.target === canvasRef.current || e.target === canvasRef.current?.parentElement) {
          setIsPanning(true);
          setStartDrag({ x: e.clientX, y: e.clientY });
      }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
      if (viewMode === 'list') return;
      if (isPanning) {
          const dx = e.clientX - startDrag.x;
          const dy = e.clientY - startDrag.y;
          setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
          setStartDrag({ x: e.clientX, y: e.clientY });
      } else if (draggingId) {
          // Dragging Item
          const dx = (e.clientX - startDrag.x) / scale;
          const dy = (e.clientY - startDrag.y) / scale;
          
          const item = items.find(i => i.id === draggingId);
          if (item) {
              onUpdateItem({
                  ...item,
                  x: itemStart.x + dx,
                  y: itemStart.y + dy
              });
          }
      }
  };

  const handleCanvasMouseUp = () => {
      setIsPanning(false);
      setDraggingId(null);
  };

  // --- Item Interaction ---

  const handleItemMouseDown = (e: React.MouseEvent, item: InspirationItem) => {
    e.stopPropagation(); // Stop pan
    setDraggingId(item.id);
    setStartDrag({ x: e.clientX, y: e.clientY });
    setItemStart({ x: item.x || 0, y: item.y || 0 });
  };

  const handleEdit = (item: InspirationItem) => {
      setEditingItem(item);
      setShowModal(true);
  };

  const openAddModal = () => {
      setEditingItem(null);
      setShowModal(true);
  };

  // Ensure items are placed reasonably relative to current view when adding
  const handleSaveItem = (item: InspirationItem) => {
      if (editingItem) {
          onUpdateItem(item);
      } else {
          // Position new item in center of current view
          // View center = (-offset.x + width/2) / scale
          const viewWidth = canvasRef.current?.clientWidth || 800;
          const viewHeight = canvasRef.current?.clientHeight || 600;
          
          const centerX = (-offset.x + viewWidth / 2) / scale;
          const centerY = (-offset.y + viewHeight / 2) / scale;
          
          onAddItem({ ...item, x: centerX - 100, y: centerY - 100 });
      }
  };

  return (
    <div className="h-full flex flex-col bg-stone-100 dark:bg-stone-950 transition-colors overflow-hidden relative">
        {/* Toolbar */}
        <div className="absolute top-4 left-4 right-4 md:left-6 md:right-6 flex flex-col md:flex-row justify-between items-start md:items-center pointer-events-none z-20 gap-4">
            <div className="bg-white/90 dark:bg-stone-900/90 backdrop-blur p-4 rounded-xl shadow-lg border border-stone-200 dark:border-stone-800 pointer-events-auto flex items-center gap-6">
                <div>
                    <h1 className="text-xl font-serif font-bold text-ink-900 dark:text-stone-100">Inspiration Board</h1>
                    <p className="text-xs text-stone-500">
                        {viewMode === 'board' ? 'Drag background to pan • Scroll to zoom' : 'List View'}
                    </p>
                </div>
                
                {/* Search Bar */}
                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-ink-900 dark:group-focus-within:text-stone-100 transition-colors" size={16} />
                    <input 
                        type="text" 
                        placeholder="Search items..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-stone-100 dark:bg-stone-800 border-none rounded-full py-2 pl-9 pr-4 text-sm w-48 focus:w-64 transition-all outline-none focus:ring-2 focus:ring-stone-400 dark:text-stone-200"
                    />
                </div>
                
                <button 
                    onClick={() => setShowGallery(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-yellow-100 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:hover:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                >
                    <Quote size={16} /> Highlights
                </button>
            </div>
            
            <div className="flex gap-2 pointer-events-auto self-end md:self-auto">
                 {/* View Toggle */}
                 <div className="flex items-center bg-white/90 dark:bg-stone-900/90 backdrop-blur rounded-lg shadow border border-stone-200 dark:border-stone-800 overflow-hidden p-1 gap-1">
                    <button 
                        onClick={() => setViewMode('board')}
                        className={`p-2 rounded transition-colors ${viewMode === 'board' ? 'bg-ink-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                        title="Board View"
                    >
                        <LayoutGrid size={18} />
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-ink-900 text-white dark:bg-stone-100 dark:text-stone-900' : 'text-stone-400 hover:text-stone-600'}`}
                        title="List View"
                    >
                        <List size={18} />
                    </button>
                 </div>

                 {viewMode === 'board' && (
                     <div className="flex items-center bg-white/90 dark:bg-stone-900/90 backdrop-blur rounded-lg shadow border border-stone-200 dark:border-stone-800 overflow-hidden">
                        <button 
                            onClick={() => setScale(s => Math.min(s + 0.1, 3))}
                            className="p-3 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400"
                            title="Zoom In"
                        >
                            <ZoomIn size={18} />
                        </button>
                        <div className="w-px h-6 bg-stone-200 dark:bg-stone-700"></div>
                        <button 
                            onClick={() => setScale(s => Math.max(s - 0.1, 0.2))}
                            className="p-3 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400"
                            title="Zoom Out"
                        >
                            <ZoomOut size={18} />
                        </button>
                     </div>
                 )}

                 <button 
                    onClick={openAddModal}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-ink-900 text-paper-50 dark:bg-stone-100 dark:text-stone-900 rounded-lg shadow-xl hover:scale-105 transition-transform text-sm font-bold"
                >
                    <Plus size={18} />
                    <span className="hidden md:inline">Add Card</span>
                </button>
            </div>
        </div>

        {/* Views */}
        <div className="flex-1 overflow-hidden relative">
            
            {/* BOARD VIEW */}
            {viewMode === 'board' && (
                <div 
                    className={`w-full h-full overflow-hidden relative ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    onWheel={handleWheel}
                >
                    <div 
                        ref={canvasRef}
                        className="w-full h-full origin-top-left"
                        style={{ 
                            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                            backgroundImage: 'radial-gradient(circle, #a8a29e 1px, transparent 1px)', 
                            backgroundSize: '40px 40px',
                            backgroundColor: 'transparent'
                        }}
                    >
                        {filteredItems.map(item => (
                            <div
                                key={item.id}
                                className={`absolute group shadow-md hover:shadow-2xl hover:scale-[1.02] transition-all rounded-lg border w-64 md:w-80 select-none animate-fadeIn
                                    ${item.type === 'highlight' 
                                        ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-900/30'
                                        : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800'}
                                `}
                                style={{ 
                                    left: item.x ?? 0, 
                                    top: item.y ?? 0,
                                    zIndex: draggingId === item.id ? 50 : 10 
                                }}
                            >
                                {/* Drag Handle */}
                                <div 
                                    className={`h-8 rounded-t-lg cursor-move flex items-center justify-between px-3 border-b
                                        ${item.type === 'highlight'
                                            ? 'bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-900/30'
                                            : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700'}
                                    `}
                                    onMouseDown={(e) => handleItemMouseDown(e, item)}
                                >
                                    <div className="flex items-center gap-2 text-stone-400">
                                        {item.type === 'highlight' ? <Quote size={12} className="text-yellow-600 dark:text-yellow-500" /> : <MousePointer2 size={12} />}
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleEdit(item)} className="p-1 text-stone-400 hover:text-blue-500 rounded hover:bg-black/5">
                                            <Edit2 size={12} />
                                        </button>
                                        <button onClick={() => onDeleteItem(item.id)} className="p-1 text-stone-400 hover:text-red-500 rounded hover:bg-black/5">
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-0 pointer-events-none">
                                    {item.type === 'video' && (
                                        <div className="aspect-video w-full bg-black relative">
                                            <iframe 
                                                src={getEmbedUrl(item.content)} 
                                                className="w-full h-full pointer-events-auto" 
                                                title={item.title}
                                            />
                                        </div>
                                    )}
                                    {item.type === 'image' && (
                                        <img src={item.content} alt={item.title} className="w-full h-auto object-cover max-h-48" />
                                    )}
                                    <div className="p-4">
                                        {item.title && <h3 className="font-bold text-sm text-ink-900 dark:text-stone-100 mb-1">{item.title}</h3>}
                                        {item.type === 'text' && (
                                            <p className="text-sm font-serif italic text-stone-600 dark:text-stone-300 whitespace-pre-wrap">{item.content}</p>
                                        )}
                                        {item.type === 'highlight' && (
                                            <div className="relative">
                                                 <Quote size={24} className="absolute -top-2 -left-2 text-yellow-300 dark:text-yellow-900/50 opacity-50" />
                                                 <p className="text-lg font-serif leading-relaxed text-ink-900 dark:text-stone-100 relative z-10 px-2">
                                                     {item.content}
                                                 </p>
                                                 {item.snippet && <p className="text-xs text-stone-500 mt-2 text-right">— {item.snippet}</p>}
                                            </div>
                                        )}
                                        {(item.type === 'link' || item.type === 'video') && (
                                            <div className="text-xs text-stone-500 truncate mt-2 bg-stone-100 dark:bg-stone-800 p-1 rounded">
                                                <LinkIcon size={10} className="inline mr-1" />
                                                {item.content}
                                            </div>
                                        )}
                                        {item.snippet && item.type !== 'highlight' && (
                                            <div className="mt-3 bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-xs text-stone-600 dark:text-stone-400 font-serif border-l-2 border-purple-400">
                                                <Sparkles size={10} className="inline mr-1 text-purple-500" />
                                                {item.snippet}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* LIST VIEW */}
            {viewMode === 'list' && (
                <div className="w-full h-full overflow-y-auto pt-24 px-4 md:px-8 pb-8">
                    <div className="max-w-6xl mx-auto bg-white dark:bg-stone-900 rounded-lg shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-stone-500 w-16">Type</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-stone-500">Content</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-stone-500 hidden md:table-cell">AI Insight</th>
                                    <th className="px-6 py-4 text-xs font-bold uppercase text-stone-500 text-right w-24">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                                {filteredItems.map(item => (
                                    <tr key={item.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                                        <td className="px-6 py-4 text-stone-400">
                                            {item.type === 'text' && <Type size={18} />}
                                            {item.type === 'image' && <ImageIcon size={18} />}
                                            {item.type === 'video' && <Video size={18} />}
                                            {item.type === 'link' && <LinkIcon size={18} />}
                                            {item.type === 'highlight' && <Quote size={18} className="text-yellow-500" />}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.title && <div className="font-bold text-ink-900 dark:text-stone-200 text-sm mb-1">{item.title}</div>}
                                            {item.type === 'image' ? (
                                                <div className="w-16 h-10 bg-stone-100 rounded overflow-hidden">
                                                    <img src={item.content} alt={item.title} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="text-sm text-stone-600 dark:text-stone-400 font-serif line-clamp-2">
                                                    {item.content}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            {item.snippet ? (
                                                <div className="flex gap-2 items-start text-xs text-stone-500 italic">
                                                    <Sparkles size={12} className="text-purple-400 flex-shrink-0 mt-0.5" />
                                                    <span>{item.snippet}</span>
                                                </div>
                                            ) : (
                                                <span className="text-stone-300 dark:text-stone-700 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(item)} className="p-2 text-stone-400 hover:text-blue-500 hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition-colors">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => onDeleteItem(item.id)} className="p-2 text-stone-400 hover:text-red-500 hover:bg-stone-100 dark:hover:bg-stone-700 rounded transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredItems.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-stone-400 text-sm italic">
                                            No inspiration found. Add some cards or adjust your search.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>

        {/* Modal */}
        {(showModal) && (
            <InspirationModal 
                onClose={() => setShowModal(false)} 
                onSave={handleSaveItem}
                existingItem={editingItem}
            />
        )}
        
        {/* Gallery Modal */}
        {showGallery && (
            <HighlightsGallery 
                highlights={highlights}
                onClose={() => setShowGallery(false)}
            />
        )}
    </div>
  );
};

const HighlightsGallery: React.FC<{ highlights: InspirationItem[], onClose: () => void }> = ({ highlights, onClose }) => {
    return (
        <div className="fixed inset-0 bg-stone-100 dark:bg-stone-950 z-[100] overflow-y-auto animate-fadeIn flex flex-col">
            <div className="p-6 md:p-10 max-w-7xl mx-auto w-full flex-1">
                <div className="flex justify-between items-center mb-12">
                     <div>
                        <h2 className="text-4xl font-serif font-bold text-ink-900 dark:text-stone-100">Highlights Gallery</h2>
                        <p className="text-stone-500 italic mt-2">A collection of your favorite passages.</p>
                     </div>
                     <button onClick={onClose} className="p-2 bg-white dark:bg-stone-800 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors">
                         <X size={24} className="text-stone-500" />
                     </button>
                </div>
                
                {highlights.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-96 text-stone-400">
                        <Quote size={64} className="mb-4 opacity-20" />
                        <p className="font-serif text-xl">No highlights yet.</p>
                        <p className="text-sm mt-2">Use the highlight tool in the editor to save passages here.</p>
                    </div>
                ) : (
                    <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
                        {highlights.map(item => (
                            <div key={item.id} className="break-inside-avoid bg-white dark:bg-stone-900 p-8 rounded shadow-sm border border-stone-200 dark:border-stone-800 relative group hover:shadow-lg transition-shadow">
                                <Quote size={32} className="text-yellow-400 dark:text-yellow-600/50 mb-4" />
                                <p className="font-serif text-xl leading-relaxed text-ink-900 dark:text-stone-200">
                                    {item.content}
                                </p>
                                {item.snippet && (
                                    <div className="mt-6 pt-6 border-t border-stone-100 dark:border-stone-800 text-sm text-stone-500 font-bold uppercase tracking-widest text-right">
                                        {item.snippet.replace('From note: ', '')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const InspirationModal: React.FC<{ 
    onClose: () => void, 
    onSave: (item: InspirationItem) => void,
    existingItem: InspirationItem | null 
}> = ({ onClose, onSave, existingItem }) => {
    const [type, setType] = useState<InspirationType>(existingItem?.type || 'text');
    const [content, setContent] = useState(existingItem?.content || '');
    const [title, setTitle] = useState(existingItem?.title || '');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        
        let snippet = existingItem?.snippet || '';

        if (!existingItem || existingItem.title !== title) {
             if ((type === 'link' || type === 'video') && title) {
                 try {
                     snippet = await generateWritingAssistance(title, 'summarize', `Generate an inspiring 1-sentence thought about: ${title}`);
                 } catch (err) {
                     console.log("AI skip", err);
                 }
             }
        }

        const newItem: InspirationItem = {
            id: existingItem?.id || Date.now().toString(),
            type,
            content,
            title: title || undefined,
            snippet: snippet || undefined,
            createdAt: existingItem?.createdAt || Date.now(),
            x: existingItem?.x || 0, 
            y: existingItem?.y || 0
        };

        onSave(newItem);
        setIsProcessing(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-stone-200 dark:border-stone-700 animate-fadeIn">
                <div className="flex justify-between items-center p-4 border-b border-stone-100 dark:border-stone-800">
                    <h2 className="font-serif font-bold text-lg text-ink-900 dark:text-stone-100">
                        {existingItem ? 'Edit Card' : 'Add Inspiration'}
                    </h2>
                    <button onClick={onClose}><X size={20} className="text-stone-500" /></button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Type Selector */}
                    <div className="grid grid-cols-5 gap-2 mb-4">
                        {(['text', 'image', 'video', 'link', 'highlight'] as InspirationType[]).map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setType(t)}
                                className={`flex flex-col items-center justify-center p-2 rounded border transition-all
                                    ${type === t 
                                        ? 'bg-ink-900 text-white border-ink-900 dark:bg-stone-100 dark:text-stone-900' 
                                        : 'bg-paper-50 dark:bg-stone-800 text-stone-500 border-transparent hover:bg-paper-200'}
                                `}
                            >
                                {t === 'text' && <Type size={16} />}
                                {t === 'image' && <ImageIcon size={16} />}
                                {t === 'video' && <Video size={16} />}
                                {t === 'link' && <LinkIcon size={16} />}
                                {t === 'highlight' && <Quote size={16} />}
                                <span className="text-[9px] uppercase font-bold mt-1">{t.slice(0, 4)}</span>
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-stone-400 mb-1">Title (Optional)</label>
                        <input 
                            className="w-full bg-paper-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded p-2 text-sm outline-none focus:border-stone-500"
                            placeholder="e.g., Writing Routine Video"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold uppercase text-stone-400 mb-1">
                            {type === 'text' || type === 'highlight' ? 'Quote / Text' : 'URL'}
                        </label>
                        {type === 'text' || type === 'highlight' ? (
                            <textarea 
                                className="w-full h-32 bg-paper-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded p-2 text-sm outline-none focus:border-stone-500 resize-none font-serif"
                                placeholder="Paste text here..."
                                value={content}
                                required
                                onChange={e => setContent(e.target.value)}
                            />
                        ) : (
                            <input 
                                className="w-full bg-paper-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded p-2 text-sm outline-none focus:border-stone-500"
                                placeholder="https://..."
                                value={content}
                                required
                                onChange={e => setContent(e.target.value)}
                            />
                        )}
                    </div>

                    <button 
                        type="submit" 
                        disabled={isProcessing}
                        className="w-full py-3 bg-ink-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {isProcessing ? 'Saving...' : 'Save Card'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// Helper for videos
function getEmbedUrl(url: string): string {
    if (url.includes('youtube.com/watch?v=')) {
        return `https://www.youtube.com/embed/${url.split('v=')[1]?.split('&')[0]}`;
    }
    if (url.includes('youtu.be/')) {
        return `https://www.youtube.com/embed/${url.split('youtu.be/')[1]}`;
    }
    if (url.includes('vimeo.com/')) {
        return `https://player.vimeo.com/video/${url.split('vimeo.com/')[1]}`;
    }
    return url;
}