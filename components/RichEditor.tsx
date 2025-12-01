
import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  Bold, Italic, List, ListOrdered, Image as ImageIcon, 
  Type, Wand2, Link as LinkIcon, Menu, 
  Video, Eye, Heading1, Heading2, Quote, Minus, Download, ListTree, PanelRightOpen, PanelRightClose, Target, Upload, X,
  Maximize2, Minimize2, Table, PlusSquare, ChevronRight, ToggleLeft, Columns, Trash2, Copy, ArrowDownToLine, MoveVertical, Cloud, Check, AlignLeft, AlignCenter, AlignRight,
  ArrowUp, ArrowDown, Scissors, AlignJustify, Box, Code, Calendar, Clock, FileText, Highlighter, ArrowUpFromLine, PaintBucket, Eraser
} from 'lucide-react';
import { Note, EditorSettings } from '../types';
import { generateWritingAssistance } from '../services/geminiService';
import { SocialPreview } from './SocialPreview';

// Declare html2pdf for TypeScript since it's loaded via CDN
declare var html2pdf: any;

interface RichEditorProps {
  note: Note;
  onUpdate: (id: string, content: string, title: string, targetWordCount?: number) => void;
  onSaveHighlight: (text: string) => void;
  allNotes: Note[];
  onToggleSidebar: () => void;
  editorSettings: EditorSettings;
}

interface CommandItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  category: 'Basic' | 'Media' | 'Advanced' | 'AI';
  action: () => void;
}

interface HeadingItem {
    id: string;
    text: string;
    level: number;
}

type MediaType = 'image' | 'video' | 'pdf' | null;
type MediaSize = '25%' | '50%' | '75%' | '100%';
type MediaAlign = 'left' | 'center' | 'right';

export const RichEditor: React.FC<RichEditorProps> = ({ note, onUpdate, onSaveHighlight, allNotes, onToggleSidebar, editorSettings }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(note.title);
  const [targetWordCount, setTargetWordCount] = useState<number | undefined>(note.targetWordCount);
  
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiMenu, setShowAiMenu] = useState(false); // Dropdown state
  const [isExporting, setIsExporting] = useState(false);
  
  // Layout State
  const [showOutline, setShowOutline] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Mention State
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });

  // Slash Command State
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState('');
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 });
  const [slashIndex, setSlashIndex] = useState(0);
  const [savedRange, setSavedRange] = useState<Range | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    targetBlock: HTMLElement | null;
  }>({ visible: false, x: 0, y: 0, targetBlock: null });

  // Media Modal State
  const [mediaModalType, setMediaModalType] = useState<MediaType>(null);
  const [mediaUrlInput, setMediaUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('upload');
  const [mediaSize, setMediaSize] = useState<MediaSize>('100%');
  const [mediaAlign, setMediaAlign] = useState<MediaAlign>('center');

  // Preview State
  const [showSocialPreview, setShowSocialPreview] = useState(false);
  
  // Stats State
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  // Table State
  const [isInsideTable, setIsInsideTable] = useState(false);

  useEffect(() => {
    setTitle(note.title);
    setTargetWordCount(note.targetWordCount);
    if (editorRef.current && editorRef.current.innerHTML !== note.content) {
      editorRef.current.innerHTML = note.content;
    }
    updateStats();
    setShowSlashMenu(false);
    setShowMentionList(false);
    setSavedRange(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id]);

  useEffect(() => {
    // Close context menu on click elsewhere
    const handleClick = () => {
        if (contextMenu.visible) setContextMenu(prev => ({ ...prev, visible: false }));
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu.visible]);

  useEffect(() => {
    const handleSaveShortcut = (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            handleInput();
            setIsSaving(true);
            setTimeout(() => setIsSaving(false), 800);
        }
    };
    window.addEventListener('keydown', handleSaveShortcut);
    return () => window.removeEventListener('keydown', handleSaveShortcut);
  }, [note.id]);

  const updateStats = () => {
      if (!editorRef.current) return;
      const text = editorRef.current.innerText || "";
      const words = text.replace(/[\u00A0\n\r]/g, ' ').trim().split(/\s+/).filter(w => w.length > 0);
      setWordCount(words.length);
      setCharCount(text.length);

      const nodes = editorRef.current.querySelectorAll('h1, h2');
      const newHeadings: HeadingItem[] = [];
      nodes.forEach((node, idx) => {
          const id = `heading-${idx}`;
          node.id = id; 
          newHeadings.push({
              id,
              text: node.textContent || "Untitled Section",
              level: node.tagName === 'H1' ? 1 : 2
          });
      });
      setHeadings(newHeadings);
  };

  const handleWrapperClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || e.target === editorRef.current?.parentElement) {
        if (editorRef.current) {
            editorRef.current.focus();
            const range = document.createRange();
            range.selectNodeContents(editorRef.current);
            range.collapse(false);
            const sel = window.getSelection();
            if (sel) {
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!editorRef.current?.contains(e.target as Node)) return;
    
    e.preventDefault();
    const target = e.target as HTMLElement;
    const block = target.closest('p, h1, h2, h3, blockquote, ul, ol, li, div.video-container, table, div.thumbnail-grid, details, .callout-block, pre, div.pdf-container') as HTMLElement;
    
    if (block && editorRef.current?.contains(block)) {
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            targetBlock: block
        });
    }
  };

  const performBlockAction = (action: 'delete' | 'duplicate' | 'insertBelow' | 'insertAbove' | 'turnH1' | 'turnH2' | 'turnP' | 'turnCode' | 'turnQuote' | 'turnCallout' | 'moveUp' | 'moveDown' | 'copy' | 'cut' | 'bold' | 'italic' | 'highlight' | 'clearFormat') => {
      const { targetBlock } = contextMenu;
      if (!targetBlock || !editorRef.current) return;

      if (['bold', 'italic', 'copy', 'cut', 'highlight', 'clearFormat'].includes(action)) {
          const range = document.createRange();
          range.selectNodeContents(targetBlock);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
          
          if (action === 'bold') document.execCommand('bold');
          if (action === 'italic') document.execCommand('italic');
          if (action === 'copy') document.execCommand('copy');
          if (action === 'cut') document.execCommand('cut');
          if (action === 'highlight') handleHighlight();
          if (action === 'clearFormat') document.execCommand('removeFormat');
          
          handleInput();
          return;
      }

      switch(action) {
          case 'delete': targetBlock.remove(); break;
          case 'duplicate': targetBlock.after(targetBlock.cloneNode(true)); break;
          case 'insertBelow':
              const pBelow = document.createElement('p'); pBelow.innerHTML = '<br>'; targetBlock.after(pBelow);
              break;
          case 'insertAbove':
              const pAbove = document.createElement('p'); pAbove.innerHTML = '<br>'; targetBlock.before(pAbove);
              break;
          case 'moveUp': if (targetBlock.previousElementSibling) targetBlock.previousElementSibling.before(targetBlock); break;
          case 'moveDown': if (targetBlock.nextElementSibling) targetBlock.nextElementSibling.after(targetBlock); break;
          case 'turnH1': { const h1 = document.createElement('h1'); h1.innerHTML = targetBlock.innerHTML; targetBlock.replaceWith(h1); break; }
          case 'turnH2': { const h2 = document.createElement('h2'); h2.innerHTML = targetBlock.innerHTML; targetBlock.replaceWith(h2); break; }
          case 'turnP': { const p = document.createElement('p'); p.innerHTML = targetBlock.innerHTML; targetBlock.replaceWith(p); break; }
          case 'turnQuote': { const q = document.createElement('blockquote'); q.innerHTML = targetBlock.innerHTML; targetBlock.replaceWith(q); break; }
          case 'turnCode': { const pre = document.createElement('pre'); pre.innerHTML = targetBlock.innerHTML; targetBlock.replaceWith(pre); break; }
          case 'turnCallout': { const div = document.createElement('div'); div.className = 'callout-block'; div.innerHTML = targetBlock.innerHTML; targetBlock.replaceWith(div); break; }
      }
      handleInput();
  };

  const handleInput = () => {
    if (editorRef.current) {
      setIsSaving(true);
      onUpdate(note.id, editorRef.current.innerHTML, title, targetWordCount);
      setTimeout(() => setIsSaving(false), 500);
      updateStats();

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      let parent = selection.anchorNode?.parentElement;
      let inTable = false;
      while(parent) {
          if (parent.tagName === 'TD' || parent.tagName === 'TH') { inTable = true; break; }
          parent = parent.parentElement;
      }
      setIsInsideTable(inTable);

      const range = selection.getRangeAt(0);
      const text = range.startContainer.textContent || "";
      
      const lastAt = text.lastIndexOf('@', range.startOffset);
      if (lastAt !== -1 && (range.startOffset - lastAt) < 20 && !text.slice(lastAt, range.startOffset).includes(' ')) {
         const query = text.substring(lastAt + 1, range.startOffset);
         setMentionQuery(query);
         const rect = range.getBoundingClientRect();
         setMentionPosition({ top: rect.bottom + 5, left: rect.left });
         setShowMentionList(true);
         setShowSlashMenu(false);
         setSavedRange(range.cloneRange());
         return;
      } else { setShowMentionList(false); }

      const lastSlash = text.lastIndexOf('/', range.startOffset);
      const isStart = lastSlash === 0 || text[lastSlash - 1] === ' ' || text.charCodeAt(lastSlash - 1) === 160; 
      
      if (lastSlash !== -1 && isStart && (range.startOffset - lastSlash) < 15 && !text.slice(lastSlash, range.startOffset).includes(' ')) {
          const query = text.substring(lastSlash + 1, range.startOffset);
          setSlashQuery(query);
          
          let rect;
          try {
              const slashRange = document.createRange();
              slashRange.setStart(range.startContainer, lastSlash);
              slashRange.setEnd(range.startContainer, lastSlash + 1);
              rect = slashRange.getBoundingClientRect();
          } catch (e) { rect = range.getBoundingClientRect(); }
          
          setSlashPosition({ top: rect.bottom + 5, left: rect.left });
          setShowSlashMenu(true);
          setSlashIndex(0);
          setSavedRange(range.cloneRange());
      } else { setShowSlashMenu(false); }
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (editorRef.current) onUpdate(note.id, editorRef.current.innerHTML, newTitle, targetWordCount);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handleHighlight = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    document.execCommand('styleWithCSS', false, 'true');
    const currentBg = document.queryCommandValue('hiliteColor');
    const isHighlighted = currentBg && currentBg !== 'transparent' && currentBg !== 'rgba(0, 0, 0, 0)' && currentBg !== 'rgb(255, 255, 255)';

    if (isHighlighted) {
        document.execCommand('hiliteColor', false, 'transparent');
        document.execCommand('removeFormat');
    } else {
        document.execCommand('hiliteColor', false, '#fde047');
        document.execCommand('foreColor', false, '#000000');
        const text = selection.toString();
        if (text.trim().length > 0) onSaveHighlight(text);
    }
    document.execCommand('styleWithCSS', false, 'false');
    handleInput();
  };

  const insertTableRow = () => { /* ... (same as before) ... */ };
  const insertTableColumn = () => { /* ... (same as before) ... */ };
  
  const restoreSelection = () => {
      const selection = window.getSelection();
      if (savedRange && selection) { selection.removeAllRanges(); selection.addRange(savedRange); } 
      else if (editorRef.current) { editorRef.current.focus(); }
  };

  const triggerMediaModal = (type: MediaType) => {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) setSavedRange(selection.getRangeAt(0).cloneRange());
      setMediaModalType(type);
      setMediaUrlInput('');
      setActiveTab('upload');
      setMediaSize('100%');
      setMediaAlign('center');
      setShowSlashMenu(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => insertMedia(e.target?.result as string);
      reader.readAsDataURL(file);
      setMediaModalType(null);
  };

  const insertMedia = (url: string) => {
      if (slashQuery && savedRange) deleteSlashQuery();
      restoreSelection();

      let wrapperClasses = "my-4 block ";
      let imgClasses = "rounded-lg shadow-md max-w-full ";
      if (mediaSize === '25%') wrapperClasses += "w-1/4 "; else if (mediaSize === '50%') wrapperClasses += "w-1/2 "; else if (mediaSize === '75%') wrapperClasses += "w-3/4 "; else wrapperClasses += "w-full ";
      if (mediaAlign === 'center') wrapperClasses += "mx-auto "; else if (mediaAlign === 'left') wrapperClasses += "float-left mr-4 "; else if (mediaAlign === 'right') wrapperClasses += "float-right ml-4 ";

      let html = '';
      if (mediaModalType === 'image') html = `<div class="${wrapperClasses} relative"><img src="${url}" class="w-full h-auto rounded-lg shadow-md" /></div><p style="clear:both"><br/></p>`;
      else if (mediaModalType === 'video') {
          let embedUrl = url;
          if (url.includes('youtube.com') || url.includes('youtu.be')) embedUrl = url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/');
          html = `<div class="${wrapperClasses} aspect-video bg-black rounded-lg overflow-hidden" contenteditable="false"><iframe src="${embedUrl}" class="w-full h-full" frameborder="0" allowfullscreen></iframe></div><p style="clear:both"><br/></p>`;
      } else if (mediaModalType === 'pdf') {
          html = `<div class="${wrapperClasses} h-[600px] bg-stone-100 rounded-lg border border-stone-200 overflow-hidden pdf-container" contenteditable="false"><embed src="${url}" type="application/pdf" width="100%" height="100%" /></div><p style="clear:both"><br/></p>`;
      }

      if (savedRange && html) {
          const div = document.createElement('div'); div.innerHTML = html; savedRange.deleteContents(); savedRange.insertNode(div); savedRange.collapse(false);
      } else { execCmd('insertHTML', html); }

      handleInput(); setSavedRange(null); setMediaModalType(null);
  };

  const handleAiAssist = async (action: 'summarize' | 'continue' | 'fix_grammar' | 'rephrase') => {
    if (!navigator.onLine) { alert("Offline."); return; }
    const selection = window.getSelection();
    let textToProcess = selection?.toString();
    if ((!textToProcess || textToProcess.trim() === '') && action === 'continue') textToProcess = editorRef.current?.innerText || "";
    if (!textToProcess) { alert("Select text."); return; }

    setIsAiLoading(true);
    try {
      const result = await generateWritingAssistance(textToProcess, action);
      if (action === 'continue') {
         const span = document.createElement('span'); span.innerHTML = " " + result;
         if (selection && selection.rangeCount > 0) { selection.getRangeAt(0).collapse(false); selection.getRangeAt(0).insertNode(span); } 
         else editorRef.current?.appendChild(span);
      } else { execCmd('insertText', result); }
      handleInput();
    } catch (e) { alert("Error: " + (e as Error).message); } 
    finally { setIsAiLoading(false); }
  };

  const handleExportPDF = async () => {
    if (!containerRef.current) return;
    setIsExporting(true);
    const element = containerRef.current;
    const opt = { margin: [20, 20, 20, 20], filename: `${title || 'note'}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' } };
    try { await html2pdf().set(opt).from(element).save(); } 
    catch (err) { console.error(err); alert("PDF Error"); } 
    finally { setIsExporting(false); }
  };

  const deleteSlashQuery = () => {
      if (savedRange) {
         try {
             const textNode = savedRange.startContainer;
             const startOffset = savedRange.startOffset;
             const lengthToDelete = slashQuery.length + 1; 
             if (startOffset >= lengthToDelete) { savedRange.setStart(textNode, startOffset - lengthToDelete); savedRange.setEnd(textNode, startOffset); savedRange.deleteContents(); }
         } catch(e) {}
      }
  };

  const insertMention = (targetNote: Note) => {
    if (savedRange) {
        const textNode = savedRange.startContainer;
        savedRange.setStart(textNode, savedRange.startOffset - (mentionQuery.length + 1));
        savedRange.deleteContents();
        const link = document.createElement('a');
        link.href = `#${targetNote.id}`; link.contentEditable = "false"; link.className = "text-stone-600 underline decoration-dotted bg-paper-200 px-1 rounded inline-block"; link.innerText = `@${targetNote.title}`;
        savedRange.insertNode(link); savedRange.collapse(false); savedRange.insertNode(document.createTextNode('\u00A0')); restoreSelection();
    }
    setShowMentionList(false); handleInput();
  };

  const executeSlashCommand = (cmd: CommandItem) => { cmd.action(); };

  const slashCommands: CommandItem[] = [
      { id: 'h1', label: 'Heading 1', category: 'Basic', icon: <Heading1 size={18} />, action: () => { deleteSlashQuery(); restoreSelection(); execCmd('formatBlock', 'H1'); setShowSlashMenu(false); } },
      { id: 'h2', label: 'Heading 2', category: 'Basic', icon: <Heading2 size={18} />, action: () => { deleteSlashQuery(); restoreSelection(); execCmd('formatBlock', 'H2'); setShowSlashMenu(false); } },
      { id: 'text', label: 'Text', category: 'Basic', icon: <Type size={18} />, action: () => { deleteSlashQuery(); restoreSelection(); execCmd('formatBlock', 'P'); setShowSlashMenu(false); } },
      { id: 'bullet', label: 'Bullet List', category: 'Basic', icon: <List size={18} />, action: () => { deleteSlashQuery(); restoreSelection(); execCmd('insertUnorderedList'); setShowSlashMenu(false); } },
      { id: 'number', label: 'Numbered List', category: 'Basic', icon: <ListOrdered size={18} />, action: () => { deleteSlashQuery(); restoreSelection(); execCmd('insertOrderedList'); setShowSlashMenu(false); } },
      { id: 'quote', label: 'Quote', category: 'Basic', icon: <Quote size={18} />, action: () => { deleteSlashQuery(); restoreSelection(); execCmd('formatBlock', 'blockquote'); setShowSlashMenu(false); } },
      { id: 'divider', label: 'Divider', category: 'Basic', icon: <Minus size={18} />, action: () => { deleteSlashQuery(); restoreSelection(); execCmd('insertHorizontalRule'); setShowSlashMenu(false); } },
      { id: 'callout', label: 'Callout', category: 'Basic', icon: <Box size={18} />, action: () => { deleteSlashQuery(); restoreSelection(); execCmd('insertHTML', '<div class="callout-block"><p><br/></p></div>'); setShowSlashMenu(false); }},
      { id: 'toggle', label: 'Toggle List', category: 'Advanced', icon: <ToggleLeft size={18} />, action: () => { deleteSlashQuery(); restoreSelection(); execCmd('insertHTML', '<details><summary>Toggle</summary><p><br/></p></details>'); setShowSlashMenu(false); }},
      { id: 'table', label: 'Table', category: 'Advanced', icon: <Table size={18} />, action: () => { deleteSlashQuery(); restoreSelection(); execCmd('insertHTML', '<table style="width:100%"><tr><td><br></td><td><br></td></tr></table>'); setShowSlashMenu(false); }},
      { id: 'code', label: 'Code Block', category: 'Advanced', icon: <Code size={18} />, action: () => { deleteSlashQuery(); restoreSelection(); execCmd('insertHTML', '<pre><code>// Code here...</code></pre>'); setShowSlashMenu(false); }},
      { id: 'date', label: 'Date', category: 'Advanced', icon: <Calendar size={18} />, action: () => { deleteSlashQuery(); restoreSelection(); execCmd('insertText', new Date().toLocaleDateString()); setShowSlashMenu(false); }},
      { id: 'time', label: 'Time', category: 'Advanced', icon: <Clock size={18} />, action: () => { deleteSlashQuery(); restoreSelection(); execCmd('insertText', new Date().toLocaleTimeString()); setShowSlashMenu(false); }},
      { id: 'image', label: 'Image', category: 'Media', icon: <ImageIcon size={18} />, action: () => triggerMediaModal('image') },
      { id: 'video', label: 'Video', category: 'Media', icon: <Video size={18} />, action: () => triggerMediaModal('video') },
      { id: 'pdf', label: 'PDF', category: 'Media', icon: <FileText size={18} />, action: () => triggerMediaModal('pdf') },
  ];

  const filteredSlashCommands = slashCommands.filter(c => c.label.toLowerCase().includes(slashQuery.toLowerCase()));
  const groupedCommands = filteredSlashCommands.reduce((groups, cmd) => { (groups[cmd.category] = groups[cmd.category] || []).push(cmd); return groups; }, {} as Record<string, CommandItem[]>);
  const flatCommands = Object.values(groupedCommands).flat();
  const filteredNotes = allNotes.filter(n => n.id !== note.id && n.title.toLowerCase().includes(mentionQuery.toLowerCase()));

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (showSlashMenu) {
          if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIndex(prev => (prev + 1) % flatCommands.length); return; }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setSlashIndex(prev => (prev - 1 + flatCommands.length) % flatCommands.length); return; }
          else if (e.key === 'Enter') { e.preventDefault(); if (flatCommands[slashIndex]) executeSlashCommand(flatCommands[slashIndex]); return; }
          else if (e.key === 'Escape') { setShowSlashMenu(false); return; }
      }
      if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); document.execCommand('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;'); handleInput(); return; }
      if (e.key === ' ') {
          const selection = window.getSelection();
          if (selection && selection.anchorNode && selection.anchorNode.textContent?.trim() === '-' && selection.anchorOffset === 1) {
              e.preventDefault(); const range = document.createRange(); range.selectNodeContents(selection.anchorNode); range.deleteContents(); execCmd('insertUnorderedList'); handleInput(); return;
          }
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        const selection = window.getSelection();
        if (selection?.anchorNode?.textContent && /^-{3,}$/.test(selection.anchorNode.textContent.trim())) { e.preventDefault(); document.execCommand('delete'); execCmd('insertHorizontalRule'); handleInput(); return; }
        e.preventDefault(); document.execCommand('insertParagraph', false); document.execCommand('removeFormat', false); document.execCommand('formatBlock', false, 'p'); handleInput();
      }
  };

  const { maxWidthClass, fontClass, sizeClass } = (() => {
      let maxWidthClass = 'max-w-[740px]';
      if (editorSettings.maxWidth === 'narrow') maxWidthClass = 'max-w-2xl';
      if (editorSettings.maxWidth === 'wide') maxWidthClass = 'max-w-[1100px]';
      if (editorSettings.maxWidth === 'full') maxWidthClass = 'max-w-none px-12';
      let fontClass = editorSettings.fontFamily === 'serif' ? 'font-serif' : editorSettings.fontFamily === 'sans' ? 'font-sans' : 'font-mono';
      let sizeClass = editorSettings.fontSize === 'medium' ? 'text-lg' : editorSettings.fontSize === 'small' ? 'text-base' : 'text-xl';
      return { maxWidthClass, fontClass, sizeClass };
  })();

  const containerClassName = focusMode ? "fixed inset-0 z-50 bg-paper-50 dark:bg-stone-950 flex flex-col transition-all duration-300" : "flex h-full w-full bg-paper-50 dark:bg-stone-950 transition-colors relative overflow-hidden";
  const toolbarClassName = focusMode ? "fixed top-0 left-0 right-0 z-50 bg-paper-50/80 dark:bg-stone-950/80 backdrop-blur-md border-b border-transparent px-6 py-3 flex items-center justify-between gap-4 opacity-0 hover:opacity-100 transition-opacity duration-300" : "flex-none sticky top-0 z-20 bg-paper-50/80 dark:bg-stone-950/80 backdrop-blur-md border-b border-transparent px-3 md:px-6 py-3 flex items-center justify-between gap-4";

  // --- PORTAL MENU RENDERERS ---
  const slashMenuContent = showSlashMenu && filteredSlashCommands.length > 0 ? (
      <div 
        className="fixed bg-white dark:bg-stone-800 shadow-xl rounded-lg border border-paper-200 dark:border-stone-700 z-[9999] w-72 max-h-80 overflow-y-auto overflow-x-hidden"
        style={{ top: slashPosition.top, left: slashPosition.left }}
      >
          {Object.entries(groupedCommands).map(([category, cmds]) => (
              <React.Fragment key={category}>
                  <div className="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider bg-paper-100 dark:bg-stone-900/50 mt-1 first:mt-0">{category}</div>
                  {cmds.map(cmd => {
                      const idx = flatCommands.indexOf(cmd);
                      return (
                          <button
                              key={cmd.id}
                              className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-ink-900 dark:text-stone-200 font-sans text-sm transition-colors ${idx === slashIndex ? 'bg-paper-200 dark:bg-stone-700' : 'hover:bg-paper-100 dark:hover:bg-stone-700'}`}
                              onClick={() => executeSlashCommand(cmd)}
                              onMouseEnter={() => setSlashIndex(idx)}
                          >
                              <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-600 p-1 rounded shadow-sm text-stone-600 dark:text-stone-400">{cmd.icon}</div>
                              <span className="font-medium">{cmd.label}</span>
                          </button>
                      );
                  })}
              </React.Fragment>
          ))}
      </div>
  ) : null;

  const mentionMenuContent = showMentionList && filteredNotes.length > 0 ? (
      <div 
        className="fixed bg-white dark:bg-stone-800 shadow-xl rounded border border-paper-200 dark:border-stone-700 z-[9999] w-64 max-h-60 overflow-y-auto"
        style={{ top: mentionPosition.top, left: mentionPosition.left }}
      >
          <div className="px-3 py-2 text-xs font-bold text-stone-500 uppercase tracking-wider bg-paper-100 dark:bg-stone-900 border-b dark:border-stone-700">Link to Note</div>
          {filteredNotes.map(n => (
              <button
                  key={n.id}
                  className="w-full text-left px-4 py-3 hover:bg-paper-100 dark:hover:bg-stone-700 text-sm flex items-center gap-2 text-ink-900 dark:text-stone-200 font-serif"
                  onClick={() => insertMention(n)}
              >
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                  {n.title || "Untitled"}
              </button>
          ))}
      </div>
  ) : null;

  return (
    <div className={containerClassName}>
      <SocialPreview content={note.content} title={note.title} isOpen={showSocialPreview} onClose={() => setShowSocialPreview(false)} />
      {createPortal(slashMenuContent, document.body)}
      {createPortal(mentionMenuContent, document.body)}

      {contextMenu.visible && (
          <div className="fixed z-[70] bg-white dark:bg-stone-800 rounded-lg shadow-xl border border-stone-200 dark:border-stone-700 w-64 overflow-hidden animate-fadeIn text-ink-900 dark:text-stone-200" style={{ top: contextMenu.y, left: contextMenu.x }}>
              <div className="p-1 space-y-0.5">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider bg-stone-50 dark:bg-stone-900/50">Actions</div>
                  <button onClick={() => performBlockAction('delete')} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex items-center gap-3 font-bold"><Trash2 size={14} /> Delete Line</button>
                  <button onClick={() => performBlockAction('duplicate')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-stone-100 dark:hover:bg-stone-700 rounded flex items-center gap-3"><Copy size={14} /> Duplicate</button>
                  <button onClick={() => performBlockAction('clearFormat')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-stone-100 dark:hover:bg-stone-700 rounded flex items-center gap-3"><Eraser size={14} /> Clear Format</button>
                  <div className="h-px bg-stone-200 dark:bg-stone-700 my-1"></div>
                  <div className="px-3 py-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider bg-stone-50 dark:bg-stone-900/50">Insert</div>
                  <button onClick={() => performBlockAction('insertAbove')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-stone-100 dark:hover:bg-stone-700 rounded flex items-center gap-3"><ArrowUpFromLine size={14} /> Paragraph Above</button>
                  <button onClick={() => performBlockAction('insertBelow')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-stone-100 dark:hover:bg-stone-700 rounded flex items-center gap-3"><ArrowDownToLine size={14} /> Paragraph Below</button>
                  <div className="h-px bg-stone-200 dark:bg-stone-700 my-1"></div>
                  <div className="px-3 py-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider bg-stone-50 dark:bg-stone-900/50">Turn Into</div>
                  <button onClick={() => performBlockAction('turnH1')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-stone-100 dark:hover:bg-stone-700 rounded flex items-center gap-3"><Heading1 size={14} /> Heading 1</button>
                  <button onClick={() => performBlockAction('turnH2')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-stone-100 dark:hover:bg-stone-700 rounded flex items-center gap-3"><Heading2 size={14} /> Heading 2</button>
                  <button onClick={() => performBlockAction('turnQuote')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-stone-100 dark:hover:bg-stone-700 rounded flex items-center gap-3"><Quote size={14} /> Quote</button>
                  <button onClick={() => performBlockAction('turnCode')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-stone-100 dark:hover:bg-stone-700 rounded flex items-center gap-3"><Code size={14} /> Code Block</button>
                  <button onClick={() => performBlockAction('turnCallout')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-stone-100 dark:hover:bg-stone-700 rounded flex items-center gap-3"><Box size={14} /> Callout</button>
              </div>
          </div>
      )}

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*, application/pdf" onChange={handleFileUpload} />
      {mediaModalType && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white dark:bg-stone-900 rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-fadeIn border border-stone-200 dark:border-stone-700">
                  <div className="flex justify-between items-center p-4 border-b border-stone-100 dark:border-stone-800">
                      <h3 className="font-bold text-ink-900 dark:text-stone-100 capitalize">Insert {mediaModalType}</h3>
                      <button onClick={() => setMediaModalType(null)} className="text-stone-500"><X size={20}/></button>
                  </div>
                  <div className="flex border-b border-stone-100 dark:border-stone-800">
                      <button onClick={() => setActiveTab('upload')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'upload' ? 'border-ink-900 text-ink-900 dark:border-stone-100 dark:text-stone-100' : 'border-transparent text-stone-400'}`}>Upload</button>
                      <button onClick={() => setActiveTab('url')} className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'url' ? 'border-ink-900 text-ink-900 dark:border-stone-100 dark:text-stone-100' : 'border-transparent text-stone-400'}`}>Embed Link</button>
                  </div>
                  <div className="p-4 space-y-4">
                      {activeTab === 'upload' ? (
                          <button onClick={() => fileInputRef.current?.click()} className="w-full flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-stone-300 dark:border-stone-700 rounded hover:bg-paper-100 dark:hover:bg-stone-800 transition-colors text-stone-600 dark:text-stone-400"><Upload size={24} /><span>Upload</span></button>
                      ) : (
                          <div className="space-y-4">
                              <input type="url" placeholder={`Paste ${mediaModalType} URL...`} value={mediaUrlInput} onChange={(e) => setMediaUrlInput(e.target.value)} className="w-full bg-paper-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded p-2 text-sm outline-none" autoFocus />
                              <button onClick={() => insertMedia(mediaUrlInput)} disabled={!mediaUrlInput} className="w-full bg-ink-900 dark:bg-stone-100 text-white dark:text-stone-900 py-2 rounded font-bold hover:opacity-90 disabled:opacity-50">Insert</button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      <div className="flex-1 flex flex-col h-full min-w-0">
          <div className={toolbarClassName}>
            <div className="flex items-center gap-1 md:gap-2 overflow-x-auto no-scrollbar mask-gradient flex-1">
              {!focusMode && <button onClick={onToggleSidebar} className="md:hidden mr-2 text-stone-500"><Menu size={20} /></button>}
              <ToolbarBtn onClick={() => execCmd('bold')} icon={<Bold size={18} />} title="Bold" />
              <ToolbarBtn onClick={() => execCmd('italic')} icon={<Italic size={18} />} title="Italic" />
              <ToolbarBtn onClick={handleHighlight} icon={<Highlighter size={18} />} title="Highlight" />
              <div className="w-px h-5 bg-stone-300/50 dark:bg-stone-700/50 mx-1 flex-shrink-0"></div>
              <ToolbarBtn onClick={() => execCmd('formatBlock', 'H1')} icon={<Heading1 size={18} />} title="Heading 1" />
              <ToolbarBtn onClick={() => execCmd('formatBlock', 'H2')} icon={<Heading2 size={16} />} title="Heading 2" />
              <div className="w-px h-5 bg-stone-300/50 dark:bg-stone-700/50 mx-1 flex-shrink-0"></div>
              <ToolbarBtn onClick={() => execCmd('insertUnorderedList')} icon={<List size={18} />} title="List" />
              <ToolbarBtn onClick={() => execCmd('insertOrderedList')} icon={<ListOrdered size={18} />} title="Ordered" />
              <ToolbarBtn onClick={() => execCmd('formatBlock', 'blockquote')} icon={<Quote size={18} />} title="Quote" />
              <div className="w-px h-5 bg-stone-300/50 dark:bg-stone-700/50 mx-1 flex-shrink-0"></div>
              <ToolbarBtn onClick={() => triggerMediaModal('image')} icon={<ImageIcon size={18} />} title="Image" />
              <ToolbarBtn onClick={() => triggerMediaModal('video')} icon={<Video size={18} />} title="Video" />
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
                <div className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1 mr-2">
                    {isSaving ? <span className="animate-pulse">Saving...</span> : <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><Cloud size={12}/> Saved</span>}
                </div>
                <button onClick={() => setFocusMode(!focusMode)} className={`p-2 transition-colors hidden sm:block ${focusMode ? 'text-ink-900 bg-paper-200 dark:bg-stone-800' : 'text-stone-500 hover:text-ink-900'}`}>{focusMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}</button>
                <button onClick={handleExportPDF} disabled={isExporting} className="p-2 text-stone-500 hover:text-ink-900 transition-colors hidden sm:block"><Download size={20} /></button>
                <button onClick={() => setShowSocialPreview(true)} className="p-2 text-stone-500 hover:text-ink-900 transition-colors hidden sm:block"><Eye size={20} /></button>
                <div className="relative hidden sm:block">
                     <button onClick={() => setShowAiMenu(!showAiMenu)} className="p-2 text-stone-400 hover:text-ink-900 transition-colors"><Wand2 size={18} /></button>
                     {showAiMenu && (
                         <>
                         <div className="fixed inset-0 z-40" onClick={() => setShowAiMenu(false)}></div>
                         <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-stone-800 rounded-lg shadow-xl border border-paper-200 dark:border-stone-700 overflow-hidden p-1 z-50">
                            <AiOption label="Continue" onClick={() => { handleAiAssist('continue'); setShowAiMenu(false); }} />
                            <AiOption label="Fix Grammar" onClick={() => { handleAiAssist('fix_grammar'); setShowAiMenu(false); }} />
                        </div>
                        </>
                     )}
                </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto w-full flex justify-center cursor-text relative" onClick={handleWrapperClick}>
            <div ref={containerRef} className={`w-full ${maxWidthClass} px-6 md:px-12 pt-12 bg-transparent editor-wrapper relative transition-all duration-300`}>
                <textarea value={title} onChange={handleTitleChange} placeholder="Untitled" rows={1} className={`w-full font-extrabold text-ink-900 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-700 outline-none bg-transparent mb-6 leading-tight text-5xl resize-none overflow-hidden ${fontClass}`} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); editorRef.current?.focus(); } }} />
                <div className={`relative ${fontClass} ${sizeClass} animate-fadeIn`}>
                    <div ref={editorRef} className="editor-content w-full outline-none text-ink-800 dark:text-stone-300 min-h-[50vh]" contentEditable onInput={handleInput} onKeyDown={handleKeyDown} onContextMenu={handleContextMenu} onBlur={handleInput} suppressContentEditableWarning={true} />
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};

const ToolbarBtn: React.FC<{ onClick: () => void, icon: React.ReactNode, title: string, label?: string }> = ({ onClick, icon, title, label }) => (
  <button onMouseDown={(e) => { e.preventDefault(); onClick(); }} title={title} className="p-2 text-stone-400 hover:text-ink-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-stone-800 rounded transition-colors flex items-center gap-1 flex-shrink-0">
    {icon}{label && <span className="text-xs font-bold font-serif">{label}</span>}
  </button>
);

const AiOption: React.FC<{ label: string, onClick: () => void }> = ({ label, onClick }) => (
    <button onClick={onClick} className="w-full text-left px-3 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-paper-100 dark:hover:bg-stone-700 rounded transition-colors font-serif">{label}</button>
);
