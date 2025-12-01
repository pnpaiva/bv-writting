import React, { useState } from 'react';
import { X, Linkedin, Instagram, Facebook, Image as ImageIcon } from 'lucide-react';

interface SocialPreviewProps {
  content: string; // HTML content
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

type Platform = 'linkedin' | 'instagram' | 'facebook';

export const SocialPreview: React.FC<SocialPreviewProps> = ({ content, title, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<Platform>('linkedin');

  if (!isOpen) return null;

  // Extract raw text and first image from HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const rawText = doc.body.innerText || "";
  const firstImage = doc.querySelector('img')?.src;

  // Helper to format text with line breaks
  const FormattedText = ({ text, limit }: { text: string, limit?: number }) => {
    let display = text;
    if (limit && display.length > limit) {
      display = display.substring(0, limit) + "...";
    }
    return (
      <div className="whitespace-pre-wrap break-words">
        {display.split('\n').map((line, i) => (
            <React.Fragment key={i}>
                {line}
                {i < display.split('\n').length - 1 && <br />}
            </React.Fragment>
        ))}
        {limit && text.length > limit && <span className="text-stone-500 font-medium cursor-pointer"> see more</span>}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-stone-100 dark:bg-stone-900 w-full max-w-4xl h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-stone-200 dark:border-stone-800">
        
        {/* Header */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-white dark:bg-stone-900">
          <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-stone-100">Social Preview</h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full transition-colors">
            <X size={20} className="text-stone-500" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar / Tabs */}
          <div className="w-20 md:w-64 bg-stone-50 dark:bg-stone-950 border-r border-stone-200 dark:border-stone-800 flex flex-col p-2 gap-2">
             <TabButton 
                active={activeTab === 'linkedin'} 
                onClick={() => setActiveTab('linkedin')} 
                icon={<Linkedin size={20} />} 
                label="LinkedIn" 
             />
             <TabButton 
                active={activeTab === 'instagram'} 
                onClick={() => setActiveTab('instagram')} 
                icon={<Instagram size={20} />} 
                label="Instagram" 
             />
             <TabButton 
                active={activeTab === 'facebook'} 
                onClick={() => setActiveTab('facebook')} 
                icon={<Facebook size={20} />} 
                label="Facebook" 
             />
          </div>

          {/* Preview Area */}
          <div className="flex-1 overflow-y-auto bg-stone-200 dark:bg-black/50 p-4 md:p-8 flex items-start justify-center">
            
            {/* LinkedIn Mock */}
            {activeTab === 'linkedin' && (
              <div className="w-full max-w-[550px] bg-white rounded-lg shadow border border-stone-200 overflow-hidden font-sans text-sm">
                <div className="p-3 flex gap-3 border-b border-stone-100">
                  <div className="w-12 h-12 bg-stone-300 rounded-full flex-shrink-0"></div>
                  <div>
                    <div className="font-bold text-black">Your Name</div>
                    <div className="text-xs text-stone-500">Writer & Content Creator</div>
                    <div className="text-xs text-stone-500 flex items-center gap-1">2h • <GlobeIcon /></div>
                  </div>
                </div>
                <div className="p-4 text-black leading-relaxed">
                  <FormattedText text={rawText} limit={200} />
                </div>
                {firstImage && (
                  <div className="w-full h-80 bg-stone-100 flex items-center justify-center overflow-hidden border-t border-stone-100">
                    <img src={firstImage} alt="Post content" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="px-4 py-2 border-t border-stone-100 flex justify-between text-stone-500 text-sm font-medium">
                   <span>Like</span>
                   <span>Comment</span>
                   <span>Repost</span>
                   <span>Send</span>
                </div>
              </div>
            )}

            {/* Instagram Mock */}
            {activeTab === 'instagram' && (
              <div className="w-full max-w-[375px] bg-white rounded-xl shadow border border-stone-200 overflow-hidden font-sans text-sm">
                 <div className="p-3 flex items-center justify-between border-b border-stone-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-tr from-yellow-400 to-purple-600 p-0.5 rounded-full">
                            <div className="w-full h-full bg-white rounded-full border border-white"></div>
                        </div>
                        <span className="font-semibold text-xs text-black">your_handle</span>
                    </div>
                    <div className="text-black font-bold">...</div>
                 </div>
                 <div className="w-full aspect-square bg-stone-100 flex items-center justify-center overflow-hidden relative">
                    {firstImage ? (
                        <img src={firstImage} alt="Post content" className="w-full h-full object-cover" />
                    ) : (
                         <div className="flex flex-col items-center text-stone-400">
                            <ImageIcon size={48} />
                            <span className="text-xs mt-2">No image found in text</span>
                         </div>
                    )}
                 </div>
                 <div className="p-3">
                    <div className="flex justify-between mb-2 text-black">
                        <div className="flex gap-4">
                            <HeartIcon /> <BubbleIcon /> <SendIcon />
                        </div>
                        <BookmarkIcon />
                    </div>
                    <div className="text-sm text-black">
                        <span className="font-semibold mr-2">your_handle</span>
                        <FormattedText text={rawText} limit={120} />
                    </div>
                 </div>
              </div>
            )}

            {/* Facebook Mock */}
            {activeTab === 'facebook' && (
               <div className="w-full max-w-[500px] bg-white rounded-lg shadow border border-stone-200 overflow-hidden font-sans text-sm">
                <div className="p-3 flex gap-2">
                   <div className="w-10 h-10 bg-stone-300 rounded-full"></div>
                   <div>
                      <div className="font-bold text-black text-[15px]">Your Name</div>
                      <div className="text-xs text-stone-500 flex items-center gap-1">2h • <GlobeIcon /></div>
                   </div>
                </div>
                <div className="px-3 pb-3 text-black text-[15px] leading-normal">
                   <FormattedText text={rawText} />
                </div>
                {firstImage && (
                    <div className="w-full bg-black flex justify-center">
                        <img src={firstImage} alt="Post content" className="max-h-[500px] object-contain" />
                    </div>
                )}
                 <div className="px-4 py-3 border-t border-stone-200 flex justify-between text-stone-500 font-medium text-sm">
                    <div className="flex items-center gap-2"><span>Like</span></div>
                    <div className="flex items-center gap-2"><span>Comment</span></div>
                    <div className="flex items-center gap-2"><span>Share</span></div>
                 </div>
               </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

// UI Helpers
const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors
            ${active 
                ? 'bg-ink-900 text-white dark:bg-stone-100 dark:text-stone-900' 
                : 'text-stone-600 hover:bg-stone-200 dark:text-stone-400 dark:hover:bg-stone-800'}
        `}
    >
        {icon}
        <span className="hidden md:inline">{label}</span>
    </button>
);

const GlobeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
        <path fillRule="evenodd" d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1ZM4.62 3.497a6.002 6.002 0 0 1 6.76 0c-.396.608-.853 1.547-1.22 2.503H5.84c-.367-.956-.824-1.895-1.22-2.503ZM3.31 4.706C2.487 5.58 2 6.726 2 8c0 1.274.487 2.42 1.31 3.294.526-1.156 1.056-2.57 1.48-3.294H3.31Zm1.53 7.797c.396-.608.853-1.547 1.22-2.503h4.32c.367.956.824 1.895 1.22 2.503a6.002 6.002 0 0 1-6.76 0ZM11.21 8c.424 1.724.954 3.138 1.48 4.294A5.996 5.996 0 0 0 14 8a5.996 5.996 0 0 0-1.31-3.294c-.526 1.156-1.056 2.57-1.48 4.294ZM8 7.003c.532 0 1.053.037 1.562.107.034-.365.056-.734.062-1.11H6.376c.006.376.028.745.062 1.11A10.63 10.63 0 0 0 8 7.003Zm0 1.994a10.63 10.63 0 0 0-1.562-.107c-.034.365-.056.734-.062 1.11h3.248c-.006-.376-.028-.745-.062-1.11A10.63 10.63 0 0 0 8 8.997Z" clipRule="evenodd" />
    </svg>
);

const HeartIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
)
const BubbleIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
)
const SendIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
)
const BookmarkIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
)