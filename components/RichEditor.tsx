
import React, { useRef, useEffect, useState } from 'react';
import { 
  Bold, Italic, List, ListOrdered, Image as ImageIcon, 
  Type, Wand2, Link as LinkIcon, Menu, 
  Video, Eye, Heading1, Heading2, Quote, Minus, Download, ListTree, PanelRightOpen, PanelRightClose, Target, Upload, X,
  Maximize2, Minimize2, Table, PlusSquare, ChevronRight, ToggleLeft, Columns, Trash2, Copy, ArrowDownToLine, MoveVertical, Cloud, Check, AlignLeft, AlignCenter, AlignRight,
  ArrowUp, ArrowDown, Scissors, AlignJustify
} from 'lucide-react';
import { Note, EditorSettings } from '../types';
import { generateWritingAssistance } from '../services/geminiService';
import { SocialPreview } from './SocialPreview';

// Declare html2pdf for TypeScript since it's loaded via CDN
declare var html2pdf: any;

interface RichEditorProps {
  note: Note;
  onUpdate: (id: string, content: string, title: string, targetWordCount?: number) => void;
  allNotes: Note[];
  onToggleSidebar: () => void;
  editorSettings: EditorSettings;
}

interface CommandItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  action: () => void;
}

interface HeadingItem {
    id: string;
    text: string;
    level: number;
}

type MediaType = 'image' | 'video' | null;
type MediaSize = '25%' | '50%' | '75%' | '100%';
type MediaAlign = 'left' | 'center' | 'right';

export const RichEditor: React.FC<RichEditorProps> = ({ note, onUpdate, allNotes, onToggleSidebar, editorSettings }) => {
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

  const updateStats = () => {
      if (!editorRef.current) return;
      
      const text = editorRef.current.innerText || "";
      // Improved word count logic for stats
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

  // --- Context Menu Logic ---
  const handleContextMenu = (e: React.MouseEvent) => {
    if (!editorRef.current?.contains(e.target as Node)) return;
    
    e.preventDefault();
    const target = e.target as HTMLElement;
    // Find the closest "Block" element
    const block = target.closest('p, h1, h2, h3, blockquote, ul, ol, li, div.video-container, table, div.thumbnail-grid, details') as HTMLElement;
    
    if (block && editorRef.current?.contains(block)) {
        setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            targetBlock: block
        });
    }
  };

  const performBlockAction = (action: 'delete' | 'duplicate' | 'insertBelow' | 'turnH1' | 'turnP' | 'moveUp' | 'moveDown' | 'copy' | 'cut' | 'bold' | 'italic' | 'alignLeft' | 'alignCenter' | 'alignRight') => {
      const { targetBlock } = contextMenu;
      if (!targetBlock || !editorRef.current) return;

      // Formatting Actions (apply to selection if exists, else tricky but context menu usually implies acting on block)
      if (['bold', 'italic', 'copy', 'cut'].includes(action)) {
          // Restore generic selection if possible, otherwise we act on block content
          // Since context menu clears selection in some browsers, we might need to select the block
          const range = document.createRange();
          range.selectNodeContents(targetBlock);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
          
          if (action === 'bold') document.execCommand('bold');
          if (action === 'italic') document.execCommand('italic');
          if (action === 'copy') document.execCommand('copy');
          if (action === 'cut') document.execCommand('cut');
          
          handleInput();
          return;
      }

      // Alignment
      if (action === 'alignLeft') { targetBlock.style.textAlign = 'left'; handleInput(); return; }
      if (action === 'alignCenter') { targetBlock.style.textAlign = 'center'; handleInput(); return; }
      if (action === 'alignRight') { targetBlock.style.textAlign = 'right'; handleInput(); return; }

      // Block Transformations
      switch(action) {
          case 'delete':
              targetBlock.remove();
              break;
          case 'duplicate':
              const clone = targetBlock.cloneNode(true);
              targetBlock.after(clone);
              break;
          case 'insertBelow':
              const p = document.createElement('p');
              p.innerHTML = '<br>';
              targetBlock.after(p);
              const range = document.createRange();
              range.selectNodeContents(p);
              range.collapse(false);
              const sel = window.getSelection();
              sel?.removeAllRanges();
              sel?.addRange(range);
              break;
          case 'moveUp':
              if (targetBlock.previousElementSibling) {
                  targetBlock.previousElementSibling.before(targetBlock);
              }
              break;
          case 'moveDown':
              if (targetBlock.nextElementSibling) {
                  targetBlock.nextElementSibling.after(targetBlock);
              }
              break;
          case 'turnH1':
              const h1 = document.createElement('h1');
              h1.innerHTML = targetBlock.innerHTML;
              targetBlock.replaceWith(h1);
              break;
          case 'turnP':
              const p2 = document.createElement('p');
              p2.innerHTML = targetBlock.innerHTML;
              targetBlock.replaceWith(p2);
              break;
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

      // Check for Table Context
      let parent = selection.anchorNode?.parentElement;
      let inTable = false;
      while(parent) {
          if (parent.tagName === 'TD' || parent.tagName === 'TH') {
              inTable = true;
              break;
          }
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
         setMentionPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
         setShowMentionList(true);
         setShowSlashMenu(false);
         setSavedRange(range.cloneRange());
         return;
      } else {
         setShowMentionList(false);
      }

      const lastSlash = text.lastIndexOf('/', range.startOffset);
      // Ensure slash is start of block or preceded by space
      const isStart = lastSlash === 0 || text[lastSlash - 1] === ' ' || text.charCodeAt(lastSlash - 1) === 160; 
      
      if (lastSlash !== -1 && isStart && (range.startOffset - lastSlash) < 15 && !text.slice(lastSlash, range.startOffset).includes(' ')) {
          const query = text.substring(lastSlash + 1, range.startOffset);
          setSlashQuery(query);
          const rect = range.getBoundingClientRect();
          setSlashPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
          setShowSlashMenu(true);
          setSlashIndex(0);
          setSavedRange(range.cloneRange());
      } else {
          setShowSlashMenu(false);
      }
    }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onUpdate(note.id, note.content, newTitle, targetWordCount);
  };

  const handleTargetChange = () => {
      const current = targetWordCount || 0;
      const newVal = prompt("Set target word count for this note (e.g. 5000):", current.toString());
      if (newVal !== null) {
          const num = parseInt(newVal);
          if (!isNaN(num)) {
              setTargetWordCount(num);
              onUpdate(note.id, note.content, title, num);
          }
      }
  };

  const scrollToHeading = (id: string) => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const insertTableRow = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      let node = selection.anchorNode;
      while (node && node.nodeName !== 'TR') {
          node = node.parentNode;
      }
      
      if (node && node.nodeName === 'TR') {
          const tr = node as HTMLTableRowElement;
          const newRow = tr.cloneNode(true) as HTMLTableRowElement;
          // Clear content of new row
          Array.from(newRow.cells).forEach(cell => cell.innerHTML = '<br>');
          tr.after(newRow);
          handleInput();
      }
  };

  const insertTableColumn = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      
      let node = selection.anchorNode as HTMLElement | null;
      while (node && node.nodeName !== 'TABLE') {
          node = node.parentElement;
      }
      
      if (node && node.nodeName === 'TABLE') {
          const table = node as HTMLTableElement;
          // Add cell to every row
          for(let i = 0; i < table.rows.length; i++) {
              const row = table.rows[i];
              const cell = row.insertCell(-1); // Append to end
              cell.innerHTML = '<br>';
              // Match header style if it's a header row
              if (row.parentElement?.tagName === 'THEAD' || row.cells[0].tagName === 'TH') {
                 cell.outerHTML = '<th><br></th>';
              }
          }
          handleInput();
      }
  };

  const restoreSelection = () => {
      const selection = window.getSelection();
      if (savedRange && selection) {
          selection.removeAllRanges();
          selection.addRange(savedRange);
      } else if (editorRef.current) {
          editorRef.current.focus();
      }
  };

  // --- Media Insertion Logic ---

  const triggerMediaModal = (type: MediaType) => {
      // Save current range before opening modal
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
          setSavedRange(selection.getRangeAt(0).cloneRange());
      }
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
      reader.onload = (e) => {
          const result = e.target?.result as string;
          insertMedia(result);
      };
      reader.readAsDataURL(file);
      setMediaModalType(null); // Close modal
  };

  const insertMedia = (url: string) => {
      // Logic to delete slash command if present
      if (slashQuery && savedRange) {
         try {
             const textNode = savedRange.startContainer;
             const startOffset = savedRange.startOffset;
             const lengthToDelete = slashQuery.length + 1; // +1 for '/'
             if (startOffset >= lengthToDelete) {
                 savedRange.setStart(textNode, startOffset - lengthToDelete);
                 savedRange.setEnd(textNode, startOffset);
                 savedRange.deleteContents();
             }
         } catch(e) { console.warn("Failed to clean slash query", e); }
      }

      restoreSelection();

      // CSS Classes for sizing and alignment
      let wrapperClasses = "my-4 block ";
      let imgClasses = "rounded-lg shadow-md max-w-full ";

      // Sizing
      if (mediaSize === '25%') wrapperClasses += "w-1/4 ";
      else if (mediaSize === '50%') wrapperClasses += "w-1/2 ";
      else if (mediaSize === '75%') wrapperClasses += "w-3/4 ";
      else wrapperClasses += "w-full "; // 100%

      // Alignment
      if (mediaAlign === 'center') wrapperClasses += "mx-auto ";
      else if (mediaAlign === 'left') wrapperClasses += "float-left mr-4 ";
      else if (mediaAlign === 'right') wrapperClasses += "float-right ml-4 ";

      if (mediaModalType === 'image') {
          if (savedRange) {
              const img = document.createElement('img');
              img.src = url;
              // Applying classes directly to image or wrapping?
              // Wrapping is safer for layout, but img itself is better for resize.
              // Let's wrap to be consistent with video
              const wrapper = document.createElement('div');
              wrapper.className = wrapperClasses + " relative";
              img.className = "w-full h-auto rounded-lg";
              wrapper.appendChild(img);
              
              savedRange.deleteContents();
              savedRange.insertNode(wrapper);
              savedRange.collapse(false);
              
              // Clear float after if needed
              if (mediaAlign !== 'center') {
                  const br = document.createElement('div');
                  br.style.clear = 'both';
                  wrapper.after(br);
              }
          } else {
             // Fallback if range lost
             execCmd('insertImage', url);
          }
      } else if (mediaModalType === 'video') {
          let embedUrl = url;
          if (url.includes('youtube.com/watch?v=')) {
              const videoId = url.split('v=')[1]?.split('&')[0];
              embedUrl = `https://www.youtube.com/embed/${videoId}`;
          } else if (url.includes('youtu.be/')) {
              const videoId = url.split('youtu.be/')[1];
              embedUrl = `https://www.youtube.com/embed/${videoId}`;
          } else if (url.includes('vimeo.com/')) {
              const videoId = url.split('vimeo.com/')[1];
              embedUrl = `https://player.vimeo.com/video/${videoId}`;
          }

          const html = `
            <div class="${wrapperClasses} aspect-video bg-black rounded-lg overflow-hidden" contenteditable="false">
                <iframe src="${embedUrl}" class="w-full h-full" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div><p style="clear:both"><br/></p>
          `;
          
          if (savedRange) {
              const div = document.createElement('div');
              div.innerHTML = html;
              savedRange.deleteContents();
              savedRange.insertNode(div);
              savedRange.collapse(false);
          } else {
              execCmd('insertHTML', html);
          }
      }

      handleInput();
      setSavedRange(null);
      setMediaModalType(null);
  };

  const handleAiAssist = async (action: 'summarize' | 'continue' | 'fix_grammar' | 'rephrase') => {
    if (!navigator.onLine) {
        alert("You are offline. AI features require an internet connection.");
        return;
    }

    const selection = window.getSelection();
    let textToProcess = selection?.toString();
    
    if ((!textToProcess || textToProcess.trim() === '') && action === 'continue') {
        textToProcess = editorRef.current?.innerText || "";
    }

    if (!textToProcess) {
      alert("Please select some text first.");
      return;
    }

    setIsAiLoading(true);
    try {
      const result = await generateWritingAssistance(textToProcess, action);
      
      if (action === 'continue') {
         const span = document.createElement('span');
         span.innerHTML = " " + result;
         if (selection && selection.rangeCount > 0) {
             const range = selection.getRangeAt(0);
             range.collapse(false);
             range.insertNode(span);
         } else {
             editorRef.current?.appendChild(span);
         }
      } else {
          execCmd('insertText', result);
      }
      handleInput();
    } catch (e) {
      alert("AI Error: " + (e as Error).message);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!containerRef.current) return;
    setIsExporting(true);
    const element = containerRef.current;
    const opt = {
      margin:       [20, 20, 20, 20],
      filename:     `${title || 'untitled-note'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
        await html2pdf().set(opt).from(element).save();
    } catch (err) {
        console.error("PDF generation failed", err);
        alert("Could not generate PDF.");
    } finally {
        setIsExporting(false);
    }
  };

  // --- Slash Command & Mention Logic ---

  const deleteSlashQuery = () => {
      if (savedRange) {
         try {
             const textNode = savedRange.startContainer;
             const startOffset = savedRange.startOffset;
             const lengthToDelete = slashQuery.length + 1; 
             if (startOffset >= lengthToDelete) {
                 savedRange.setStart(textNode, startOffset - lengthToDelete);
                 savedRange.setEnd(textNode, startOffset);
                 savedRange.deleteContents();
             }
         } catch(e) { console.error("Error deleting slash command text", e); }
      }
  };

  const insertMention = (targetNote: Note) => {
    if (savedRange) {
        const textNode = savedRange.startContainer;
        const startOffset = savedRange.startOffset;
        const lengthToDelete = mentionQuery.length + 1; 
        
        savedRange.setStart(textNode, startOffset - lengthToDelete);
        savedRange.setEnd(textNode, startOffset);
        savedRange.deleteContents();

        const link = document.createElement('a');
        link.href = `#${targetNote.id}`;
        link.contentEditable = "false";
        link.className = "text-stone-600 underline decoration-dotted bg-paper-200 px-1 rounded inline-block";
        link.innerText = `@${targetNote.title}`;
        
        savedRange.insertNode(link);
        savedRange.collapse(false);
        const space = document.createTextNode('\u00A0');
        savedRange.insertNode(space);
        savedRange.collapse(false);
        restoreSelection();
    }
    setShowMentionList(false);
    handleInput();
  };

  const executeSlashCommand = (cmd: CommandItem) => {
      cmd.action();
  };

  const slashCommands: CommandItem[] = [
      { id: 'h1', label: 'Heading 1', icon: <Heading1 size={18} />, action: () => { deleteSlashQuery(); restoreSelection(); execCmd('formatBlock', 'H1'); setShowSlashMenu(false); } },
      { id: 'h2', label: 'Heading 2', icon: <Heading2 size={18} />, action: () => { deleteSlashQuery(); restoreSelection(); execCmd('formatBlock', 'H2'); setShowSlashMenu(false); } },
      { id: 'text', label: 'Text', icon: <Type size={18} />, action: () => { deleteSlashQuery(); restoreSelection(); execCmd('formatBlock', 'P'); setShowSlashMenu(false); } },
      { id: 'bullet', label: 'Bullet List', icon: <List size={18} />, action: () => { deleteSlashQuery(); restoreSelection(); execCmd('insertUnorderedList'); setShowSlashMenu(false); } },
      { id: 'number', label: 'Numbered List', icon: <ListOrdered size={18} />, action: () => { deleteSlashQuery(); restoreSelection(); execCmd('insertOrderedList'); setShowSlashMenu(false); } },
      { id: 'quote', label: 'Quote', icon: <Quote size={18} />, action: () => { deleteSlashQuery(); restoreSelection(); execCmd('formatBlock', 'blockquote'); setShowSlashMenu(false); } },
      { id: 'divider', label: 'Divider', icon: <Minus size={18} />, action: () => { deleteSlashQuery(); restoreSelection(); execCmd('insertHorizontalRule'); setShowSlashMenu(false); } },
      { id: 'toggle', label: 'Toggle List', icon: <ToggleLeft size={18} />, action: () => {
          deleteSlashQuery();
          restoreSelection();
          execCmd('insertHTML', '<details><summary>Toggle</summary><p><br/></p></details>');
          setShowSlashMenu(false);
      }},
      { id: 'toggle1', label: 'Toggle Heading 1', icon: <Heading1 size={18} />, action: () => {
          deleteSlashQuery();
          restoreSelection();
          execCmd('insertHTML', '<details><summary><h1>Heading 1</h1></summary><p><br/></p></details>');
          setShowSlashMenu(false);
      }},
      { id: 'toggle2', label: 'Toggle Heading 2', icon: <Heading2 size={18} />, action: () => {
          deleteSlashQuery();
          restoreSelection();
          execCmd('insertHTML', '<details><summary><h2>Heading 2</h2></summary><p><br/></p></details>');
          setShowSlashMenu(false);
      }},
      { id: 'table', label: 'Table', icon: <Table size={18} />, action: () => { 
          deleteSlashQuery(); 
          restoreSelection(); 
          execCmd('insertHTML', '<table style="width:100%"><tr><td><br></td><td><br></td></tr></table>'); 
          setShowSlashMenu(false); 
      }},
      { id: 'image', label: 'Image', icon: <ImageIcon size={18} />, action: () => triggerMediaModal('image') },
      { id: 'video', label: 'Video', icon: <Video size={18} />, action: () => triggerMediaModal('video') },
  ];

  const filteredSlashCommands = slashCommands.filter(c => 
      c.label.toLowerCase().includes(slashQuery.toLowerCase())
  );
  
  const filteredNotes = allNotes.filter(n => 
    n.id !== note.id && n.title.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
      // Slash Menu Navigation
      if (showSlashMenu) {
          if (e.key === 'ArrowDown') {
              e.preventDefault();
              setSlashIndex(prev => (prev + 1) % filteredSlashCommands.length);
              return;
          } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setSlashIndex(prev => (prev - 1 + filteredSlashCommands.length) % filteredSlashCommands.length);
              return;
          } else if (e.key === 'Enter') {
              e.preventDefault();
              if (filteredSlashCommands[slashIndex]) {
                  executeSlashCommand(filteredSlashCommands[slashIndex]);
              }
              return;
          } else if (e.key === 'Escape') {
              setShowSlashMenu(false);
              return;
          }
      }

      // DIVIDER SHORTCUT (--- + Enter)
      if (e.key === 'Enter' && !e.shiftKey) {
        const selection = window.getSelection();
        if (selection && selection.anchorNode) {
            const node = selection.anchorNode;
            // Get text content of current block/node
            const text = node.textContent || "";
            // Check if line is just dashes (at least 3)
            if (/^-{3,}$/.test(text.trim())) {
                e.preventDefault();
                // Select and delete the dashes
                const range = document.createRange();
                if (node.nodeType === 3) {
                    range.selectNode(node);
                } else {
                    range.selectNodeContents(node);
                }
                range.deleteContents();
                
                // Insert HR
                execCmd('insertHorizontalRule');
                handleInput();
                return;
            }
        }
      }

      // STRICT FORMATTING RESET ON ENTER
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          
          // 1. Insert a new paragraph
          document.execCommand('insertParagraph', false);
          
          // 2. Clear any formatting carry-over (bold, italic, etc)
          document.execCommand('removeFormat', false);
          
          // 3. Ensure the new block is a Paragraph (not an H1/H2 continuation)
          document.execCommand('formatBlock', false, 'p');

          // Scroll if needed
          const selection = window.getSelection();
          if (selection && selection.anchorNode) {
              const el = selection.anchorNode instanceof HTMLElement ? selection.anchorNode : selection.anchorNode.parentElement;
              el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          
          handleInput();
      }
  };

  const getEditorStyles = () => {
      let maxWidthClass = 'max-w-3xl';
      if (editorSettings.maxWidth === 'narrow') maxWidthClass = 'max-w-2xl';
      if (editorSettings.maxWidth === 'wide') maxWidthClass = 'max-w-5xl';
      if (editorSettings.maxWidth === 'full') maxWidthClass = 'max-w-none';

      let fontClass = 'font-serif';
      if (editorSettings.fontFamily === 'sans') fontClass = 'font-sans';
      if (editorSettings.fontFamily === 'mono') fontClass = 'font-mono';

      let sizeClass = 'text-lg'; 
      if (editorSettings.fontSize === 'small') sizeClass = 'text-base';
      if (editorSettings.fontSize === 'large') sizeClass = 'text-xl';

      return { maxWidthClass, fontClass, sizeClass };
  };

  const { maxWidthClass, fontClass, sizeClass } = getEditorStyles();

  // Focus Mode Logic:
  const containerClassName = focusMode 
    ? "fixed inset-0 z-50 bg-paper-50 dark:bg-stone-950 flex flex-col transition-all duration-300"
    : "flex h-full w-full bg-paper-50 dark:bg-stone-950 transition-colors relative overflow-hidden";
  
  const toolbarClassName = focusMode
    ? "fixed top-0 left-0 right-0 z-50 bg-paper-50/95 dark:bg-stone-950/95 backdrop-blur border-b border-paper-200 dark:border-stone-800 px-6 py-3 flex items-center justify-between gap-4 opacity-0 hover:opacity-100 transition-opacity duration-300"
    : "flex-none sticky top-0 z-20 bg-paper-50/90 dark:bg-stone-950/90 backdrop-blur border-b border-paper-200 dark:border-stone-800 px-3 md:px-6 py-3 flex items-center justify-between gap-4";

  return (
    <div className={containerClassName}>
      
      <SocialPreview 
        content={note.content} 
        title={note.title} 
        isOpen={showSocialPreview} 
        onClose={() => setShowSocialPreview(false)} 
      />

      {/* Context Menu */}
      {contextMenu.visible && (
          <div 
            className="fixed z-[70] bg-white dark:bg-stone-800 rounded-lg shadow-xl border border-stone-200 dark:border-stone-700 w-56 overflow-hidden animate-fadeIn text-ink-900 dark:text-stone-200"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
              <div className="p-1 space-y-0.5">
                  <div className="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">Format</div>
                  <div className="flex gap-1 px-2">
                     <button onClick={() => performBlockAction('bold')} className="flex-1 p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded flex justify-center" title="Bold"><Bold size={14}/></button>
                     <button onClick={() => performBlockAction('italic')} className="flex-1 p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded flex justify-center" title="Italic"><Italic size={14}/></button>
                     <button onClick={() => performBlockAction('copy')} className="flex-1 p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded flex justify-center" title="Copy"><Copy size={14}/></button>
                     <button onClick={() => performBlockAction('cut')} className="flex-1 p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded flex justify-center" title="Cut"><Scissors size={14}/></button>
                  </div>

                  <div className="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider mt-1">Movement</div>
                  <button onClick={() => performBlockAction('moveUp')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-stone-100 dark:hover:bg-stone-700 rounded flex items-center gap-2">
                      <ArrowUp size={14} /> Move Up
                  </button>
                  <button onClick={() => performBlockAction('moveDown')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-stone-100 dark:hover:bg-stone-700 rounded flex items-center gap-2">
                      <ArrowDown size={14} /> Move Down
                  </button>

                  <div className="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider mt-1">Alignment</div>
                  <div className="flex gap-1 px-2">
                      <button onClick={() => performBlockAction('alignLeft')} className="flex-1 p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded flex justify-center"><AlignLeft size={14}/></button>
                      <button onClick={() => performBlockAction('alignCenter')} className="flex-1 p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded flex justify-center"><AlignCenter size={14}/></button>
                      <button onClick={() => performBlockAction('alignRight')} className="flex-1 p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded flex justify-center"><AlignRight size={14}/></button>
                  </div>

                  <div className="h-px bg-stone-200 dark:bg-stone-700 my-1"></div>
                  
                  <button onClick={() => performBlockAction('duplicate')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-stone-100 dark:hover:bg-stone-700 rounded flex items-center gap-2">
                      <Copy size={14} /> Duplicate Block
                  </button>
                  <button onClick={() => performBlockAction('insertBelow')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-stone-100 dark:hover:bg-stone-700 rounded flex items-center gap-2">
                      <ArrowDownToLine size={14} /> Insert Below
                  </button>
                  <button onClick={() => performBlockAction('turnH1')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-stone-100 dark:hover:bg-stone-700 rounded flex items-center gap-2">
                      <Heading1 size={14} /> Turn into H1
                  </button>
                  <button onClick={() => performBlockAction('turnP')} className="w-full text-left px-3 py-1.5 text-sm hover:bg-stone-100 dark:hover:bg-stone-700 rounded flex items-center gap-2">
                      <Type size={14} /> Turn into Text
                  </button>

                  <div className="h-px bg-stone-200 dark:bg-stone-700 my-1"></div>
                  <button onClick={() => performBlockAction('delete')} className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex items-center gap-2 font-bold">
                      <Trash2 size={14} /> Delete
                  </button>
              </div>
          </div>
      )}

      {/* Hidden File Input */}
      <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={handleFileUpload}
      />

      {/* Media Modal */}
      {mediaModalType && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white dark:bg-stone-900 rounded-lg shadow-xl w-full max-w-sm overflow-hidden animate-fadeIn border border-stone-200 dark:border-stone-700">
                  <div className="flex justify-between items-center p-4 border-b border-stone-100 dark:border-stone-800">
                      <h3 className="font-bold text-ink-900 dark:text-stone-100 capitalize">Insert {mediaModalType}</h3>
                      <button onClick={() => setMediaModalType(null)} className="text-stone-500"><X size={20}/></button>
                  </div>
                  
                  {/* Tabs */}
                  <div className="flex border-b border-stone-100 dark:border-stone-800">
                      <button 
                        onClick={() => setActiveTab('upload')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'upload' ? 'border-ink-900 text-ink-900 dark:border-stone-100 dark:text-stone-100' : 'border-transparent text-stone-400'}`}
                      >
                          Upload
                      </button>
                      <button 
                        onClick={() => setActiveTab('url')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 ${activeTab === 'url' ? 'border-ink-900 text-ink-900 dark:border-stone-100 dark:text-stone-100' : 'border-transparent text-stone-400'}`}
                      >
                          Embed Link
                      </button>
                  </div>

                  <div className="p-4 space-y-4">
                      {/* Controls for Size and Alignment */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold uppercase text-stone-500 mb-1 block">Size</label>
                            <div className="flex bg-paper-100 dark:bg-stone-800 rounded p-1">
                                {(['25%', '50%', '75%', '100%'] as MediaSize[]).map(size => (
                                    <button 
                                        key={size} 
                                        onClick={() => setMediaSize(size)}
                                        className={`flex-1 text-[10px] py-1 rounded ${mediaSize === size ? 'bg-white dark:bg-stone-700 shadow text-ink-900 dark:text-stone-100 font-bold' : 'text-stone-500'}`}
                                    >
                                        {size.replace('%', '')}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold uppercase text-stone-500 mb-1 block">Align</label>
                            <div className="flex bg-paper-100 dark:bg-stone-800 rounded p-1">
                                <button 
                                    onClick={() => setMediaAlign('left')}
                                    className={`flex-1 py-1 rounded flex justify-center ${mediaAlign === 'left' ? 'bg-white dark:bg-stone-700 shadow text-ink-900 dark:text-stone-100' : 'text-stone-500'}`}
                                    title="Left"
                                ><AlignLeft size={14}/></button>
                                <button 
                                    onClick={() => setMediaAlign('center')}
                                    className={`flex-1 py-1 rounded flex justify-center ${mediaAlign === 'center' ? 'bg-white dark:bg-stone-700 shadow text-ink-900 dark:text-stone-100' : 'text-stone-500'}`}
                                    title="Center"
                                ><AlignCenter size={14}/></button>
                                <button 
                                    onClick={() => setMediaAlign('right')}
                                    className={`flex-1 py-1 rounded flex justify-center ${mediaAlign === 'right' ? 'bg-white dark:bg-stone-700 shadow text-ink-900 dark:text-stone-100' : 'text-stone-500'}`}
                                    title="Right"
                                ><AlignRight size={14}/></button>
                            </div>
                        </div>
                      </div>

                      {activeTab === 'upload' ? (
                          <div className="space-y-4">
                            {mediaModalType === 'image' ? (
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-stone-300 dark:border-stone-700 rounded hover:bg-paper-100 dark:hover:bg-stone-800 transition-colors text-stone-600 dark:text-stone-400"
                                >
                                    <Upload size={24} />
                                    <span>Click to upload image</span>
                                    <span className="text-xs text-stone-400">Supported: JPG, PNG, GIF</span>
                                </button>
                            ) : (
                                <div className="text-center p-6 text-stone-500 text-sm">
                                    Video uploads not supported yet. Please use Embed Link.
                                </div>
                            )}
                          </div>
                      ) : (
                          <div className="space-y-4">
                              <input 
                                  type="url" 
                                  placeholder={`Paste ${mediaModalType} URL...`}
                                  value={mediaUrlInput}
                                  onChange={(e) => setMediaUrlInput(e.target.value)}
                                  className="w-full bg-paper-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-stone-500"
                                  autoFocus
                              />
                              <button 
                                  onClick={() => insertMedia(mediaUrlInput)}
                                  disabled={!mediaUrlInput}
                                  className="w-full bg-ink-900 dark:bg-stone-100 text-white dark:text-stone-900 py-2 rounded font-bold hover:opacity-90 disabled:opacity-50"
                              >
                                  Insert Embed
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
          
          {/* Toolbar */}
          <div className={toolbarClassName}>
            <div className="flex items-center gap-1 md:gap-2 overflow-x-auto no-scrollbar mask-gradient flex-1">
              
              {!focusMode && (
                  <button onClick={onToggleSidebar} className="md:hidden mr-2 text-stone-500">
                    <Menu size={20} />
                  </button>
              )}

              <ToolbarBtn onClick={() => execCmd('bold')} icon={<Bold size={18} />} title="Bold" />
              <ToolbarBtn onClick={() => execCmd('italic')} icon={<Italic size={18} />} title="Italic" />
              <div className="w-px h-5 bg-paper-300 dark:bg-stone-700 mx-1 flex-shrink-0"></div>
              <ToolbarBtn onClick={() => execCmd('formatBlock', 'H1')} icon={<Heading1 size={18} />} title="Heading 1" />
              <ToolbarBtn onClick={() => execCmd('formatBlock', 'H2')} icon={<Heading2 size={16} />} title="Heading 2" />
              <div className="w-px h-5 bg-paper-300 dark:bg-stone-700 mx-1 flex-shrink-0"></div>
              <ToolbarBtn onClick={() => execCmd('insertUnorderedList')} icon={<List size={18} />} title="Bullet List" />
              <ToolbarBtn onClick={() => execCmd('insertOrderedList')} icon={<ListOrdered size={18} />} title="Numbered List" />
              <ToolbarBtn onClick={() => execCmd('formatBlock', 'blockquote')} icon={<Quote size={18} />} title="Quote" />
              <div className="w-px h-5 bg-paper-300 dark:bg-stone-700 mx-1 flex-shrink-0"></div>
              <ToolbarBtn onClick={() => triggerMediaModal('image')} icon={<ImageIcon size={18} />} title="Insert Image" />
              <ToolbarBtn onClick={() => triggerMediaModal('video')} icon={<Video size={18} />} title="Insert Video" />
              <ToolbarBtn onClick={() => {
                  const url = prompt("Enter Link URL:");
                  if(url) execCmd('createLink', url);
              }} icon={<LinkIcon size={18} />} title="Link" />
              
              {isInsideTable && (
                  <>
                    <div className="w-px h-5 bg-paper-300 dark:bg-stone-700 mx-1 flex-shrink-0"></div>
                    <ToolbarBtn onClick={insertTableRow} icon={<PlusSquare size={18} />} title="Add Row" label="Row" />
                    <ToolbarBtn onClick={insertTableColumn} icon={<Columns size={18} />} title="Add Column" label="Col" />
                  </>
              )}
            </div>

            {/* Right Actions */}
            <div className="flex-shrink-0 flex items-center gap-2">
                <div className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1 mr-2">
                    {isSaving ? <span className="animate-pulse">Saving...</span> : <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><Cloud size={12}/> Saved</span>}
                </div>

                <button 
                    onClick={() => setFocusMode(!focusMode)}
                    className={`p-2 transition-colors hidden sm:block ${focusMode ? 'text-ink-900 bg-paper-200 dark:bg-stone-800 dark:text-stone-100' : 'text-stone-500 hover:text-ink-900 dark:hover:text-stone-100'}`}
                    title={focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
                >
                    {focusMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>

                <button 
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    className="p-2 text-stone-500 hover:text-ink-900 dark:hover:text-stone-100 transition-colors hidden sm:block"
                    title="Export PDF"
                >
                    <Download size={20} className={isExporting ? 'animate-bounce' : ''} />
                </button>
                <button 
                    onClick={() => setShowSocialPreview(true)}
                    className="p-2 text-stone-500 hover:text-ink-900 dark:hover:text-stone-100 transition-colors hidden sm:block"
                    title="Social Preview"
                >
                    <Eye size={20} />
                </button>
                
                {/* AI Assist - moved here as Icon */}
                {isAiLoading ? (
                     <div className="p-2 text-stone-500 animate-pulse" title="AI Thinking...">
                         <Wand2 size={20} />
                     </div>
                ) : (
                    <div className="relative hidden sm:block">
                         <button 
                            onClick={() => setShowAiMenu(!showAiMenu)}
                            className={`p-2 transition-colors rounded hover:bg-paper-200 dark:hover:bg-stone-800 flex items-center gap-1 ${showAiMenu ? 'text-ink-900 dark:text-stone-100 bg-paper-200 dark:bg-stone-800' : 'text-stone-400 hover:text-ink-900 dark:hover:text-stone-100'}`}
                            title="AI Assist"
                         >
                             <Wand2 size={18} />
                         </button>
                         {showAiMenu && (
                             <>
                             <div className="fixed inset-0 z-40" onClick={() => setShowAiMenu(false)}></div>
                             <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-stone-800 rounded-lg shadow-xl border border-paper-200 dark:border-stone-700 overflow-hidden p-1 z-50">
                                <AiOption label="Continue Writing" onClick={() => { handleAiAssist('continue'); setShowAiMenu(false); }} />
                                <AiOption label="Fix Grammar" onClick={() => { handleAiAssist('fix_grammar'); setShowAiMenu(false); }} />
                                <AiOption label="Rephrase" onClick={() => { handleAiAssist('rephrase'); setShowAiMenu(false); }} />
                                <AiOption label="Summarize" onClick={() => { handleAiAssist('summarize'); setShowAiMenu(false); }} />
                            </div>
                            </>
                         )}
                    </div>
                )}

                <button
                    onClick={() => setShowOutline(!showOutline)}
                    className={`p-2 rounded transition-colors border-l border-paper-200 dark:border-stone-800 ml-1 pl-3 ${showOutline ? 'text-ink-900 bg-paper-200 dark:text-stone-100 dark:bg-stone-800' : 'text-stone-500 hover:text-ink-900 dark:hover:text-stone-100'}`}
                    title="Toggle Outline / Stats"
                >
                    {showOutline ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
                </button>
            </div>
          </div>

          {/* Scrolling Editor Container */}
          <div 
            className="flex-1 overflow-y-auto w-full flex justify-center cursor-text relative"
            onClick={handleWrapperClick}
          >
            <div 
                ref={containerRef} 
                className={`w-full ${maxWidthClass} px-6 md:px-12 py-12 bg-paper-50 dark:bg-stone-900/50 editor-wrapper transition-all duration-300`}
            >
                {/* Title Input */}
                <input
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Untitled"
                    className={`w-full font-bold text-ink-900 dark:text-stone-100 placeholder-stone-300 dark:placeholder-stone-700 outline-none bg-transparent mb-8 leading-tight ${fontClass} text-4xl`}
                />

                {/* Editor Content */}
                <div className={`relative ${fontClass} ${sizeClass}`}>
                    <div
                        ref={editorRef}
                        className="editor-content w-full outline-none text-ink-800 dark:text-stone-300 min-h-[30vh]"
                        contentEditable
                        onInput={handleInput}
                        onKeyDown={handleKeyDown}
                        onContextMenu={handleContextMenu}
                        onBlur={handleInput}
                        suppressContentEditableWarning={true}
                    />
                    
                    {/* Popups (Slash/Mention) */}
                    {showSlashMenu && filteredSlashCommands.length > 0 && (
                         <div 
                            className="fixed bg-white dark:bg-stone-800 shadow-xl rounded-lg border border-paper-200 dark:border-stone-700 z-[60] w-72 max-h-80 overflow-y-auto overflow-x-hidden"
                            style={{ top: slashPosition.top, left: slashPosition.left }}
                         >
                             <div className="px-3 py-2 text-xs font-bold text-stone-400 uppercase tracking-wider bg-paper-100 dark:bg-stone-900 border-b dark:border-stone-700">
                                 Basic Blocks
                             </div>
                             {filteredSlashCommands.map((cmd, idx) => (
                                 <button
                                     key={cmd.id}
                                     className={`w-full text-left px-4 py-2.5 flex items-center gap-3 text-ink-900 dark:text-stone-200 font-sans text-sm transition-colors
                                        ${idx === slashIndex ? 'bg-paper-200 dark:bg-stone-700' : 'hover:bg-paper-100 dark:hover:bg-stone-700'}
                                     `}
                                     onClick={() => executeSlashCommand(cmd)}
                                     onMouseEnter={() => setSlashIndex(idx)}
                                 >
                                     <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-600 p-1 rounded shadow-sm text-stone-600 dark:text-stone-400">
                                         {cmd.icon}
                                     </div>
                                     <div className="flex flex-col">
                                         <span className="font-medium">{cmd.label}</span>
                                         <span className="text-xs text-stone-400">Insert {cmd.label.toLowerCase()}</span>
                                     </div>
                                 </button>
                             ))}
                         </div>
                    )}

                    {showMentionList && filteredNotes.length > 0 && (
                        <div 
                            className="fixed bg-white dark:bg-stone-800 shadow-xl rounded border border-paper-200 dark:border-stone-700 z-[60] w-64 max-h-60 overflow-y-auto"
                            style={{ top: mentionPosition.top, left: mentionPosition.left }}
                        >
                            <div className="px-3 py-2 text-xs font-bold text-stone-500 uppercase tracking-wider bg-paper-100 dark:bg-stone-900 border-b dark:border-stone-700">
                                Link to Note
                            </div>
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
                    )}
                </div>
            </div>
          </div>
      </div>

      {/* Outline / Stats Sidebar */}
      {showOutline && !focusMode && (
          <div className="w-64 border-l border-paper-200 dark:border-stone-800 bg-paper-50 dark:bg-stone-950 flex flex-col flex-shrink-0 transition-all h-full overflow-hidden">
              <div className="p-4 border-b border-paper-200 dark:border-stone-800">
                  <h3 className="font-serif font-bold text-ink-900 dark:text-stone-100 text-sm uppercase tracking-wider flex items-center gap-2">
                      <ListTree size={16} /> Outline
                  </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-1">
                  {headings.length > 0 ? (
                      headings.map(h => (
                          <button 
                              key={h.id}
                              onClick={() => scrollToHeading(h.id)}
                              className={`w-full text-left text-sm py-1.5 px-2 rounded hover:bg-paper-200 dark:hover:bg-stone-800 truncate text-stone-600 dark:text-stone-400
                                  ${h.level === 1 ? 'font-bold pl-2' : 'pl-6'}
                              `}
                          >
                              {h.text}
                          </button>
                      ))
                  ) : (
                      <p className="text-xs text-stone-400 italic p-2">Add H1 or H2 headings to see outline.</p>
                  )}
              </div>

              {/* Goal Tracker */}
              <div className="p-4 bg-paper-100 dark:bg-stone-900 border-t border-paper-200 dark:border-stone-800">
                  <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase text-stone-500">Details</span>
                      <button onClick={handleTargetChange} className="text-stone-400 hover:text-ink-900 dark:hover:text-stone-200" title="Set Goal">
                          <Target size={14} />
                      </button>
                  </div>
                  
                  <div className="space-y-3 text-xs text-stone-600 dark:text-stone-400">
                      <div className="flex justify-between">
                          <span>Words:</span>
                          <span className="font-mono">{wordCount}</span>
                      </div>
                      <div className="flex justify-between">
                          <span>Characters:</span>
                          <span className="font-mono">{charCount}</span>
                      </div>
                      <div className="flex justify-between">
                          <span>Reading Time:</span>
                          <span className="font-mono">~{Math.ceil(wordCount / 200)} min</span>
                      </div>
                      
                      {targetWordCount && targetWordCount > 0 && (
                          <div className="pt-2 border-t border-stone-200 dark:border-stone-700">
                              <div className="flex justify-between mb-1">
                                  <span>Goal:</span>
                                  <span className="font-mono">{targetWordCount}</span>
                              </div>
                              <div className="w-full h-2 bg-stone-300 dark:bg-stone-700 rounded-full overflow-hidden">
                                  <div 
                                      className="h-full bg-ink-900 dark:bg-stone-100 transition-all duration-500" 
                                      style={{ width: `${Math.min((wordCount / targetWordCount) * 100, 100)}%` }}
                                  ></div>
                              </div>
                              <div className="text-right mt-1 text-[10px] text-stone-400">
                                  {Math.round((wordCount / targetWordCount) * 100)}%
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

const ToolbarBtn: React.FC<{ onClick: () => void, icon: React.ReactNode, title: string, label?: string }> = ({ onClick, icon, title, label }) => (
  <button
    onClick={onClick}
    title={title}
    className="p-2 text-stone-400 hover:text-ink-900 dark:hover:text-stone-100 hover:bg-paper-200 dark:hover:bg-stone-800 rounded transition-colors flex items-center gap-1 flex-shrink-0"
  >
    {icon}
    {label && <span className="text-xs font-bold font-serif">{label}</span>}
  </button>
);

const AiOption: React.FC<{ label: string, onClick: () => void }> = ({ label, onClick }) => (
    <button 
        onClick={onClick}
        className="w-full text-left px-3 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-paper-100 dark:hover:bg-stone-700 rounded transition-colors font-serif"
    >
        {label}
    </button>
)
