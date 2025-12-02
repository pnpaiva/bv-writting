
import React, { useState, useEffect } from 'react';
import { ArrowRight, Feather, Minimize2, Type, Book, BarChart3, Layout, PenTool, Search, Quote, Image as ImageIcon, Link as LinkIcon, MoreHorizontal, Trophy, Flame, Star, Crown, Zap, Lock } from 'lucide-react';

interface LandingPageProps {
    onEnter: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnter }) => {
    return (
        <div className="min-h-screen bg-[#fcfbf9] dark:bg-[#0c0a09] flex flex-col relative overflow-hidden transition-colors selection:bg-orange-200 dark:selection:bg-orange-900">
            
            {/* Grain Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply dark:mix-blend-overlay"
                 style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
            </div>

            {/* Navbar */}
            <nav className="relative z-10 flex justify-between items-center px-6 py-6 md:px-12 md:py-8 animate-fadeIn">
                <div className="flex items-center gap-3">
                    <span className="font-serif font-bold text-lg text-ink-900 dark:text-stone-100 tracking-tight">Beyond Words</span>
                </div>
                <button 
                    onClick={onEnter} 
                    className="text-xs font-bold uppercase tracking-widest text-stone-500 hover:text-ink-900 dark:hover:text-stone-100 transition-colors"
                >
                    Login
                </button>
            </nav>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center pt-8 md:pt-16 px-6 relative z-10 pb-12">
                
                <div className="animate-slideIn space-y-8 max-w-5xl text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-100/50 dark:bg-stone-900/50 border border-stone-200 dark:border-stone-800 text-[10px] font-bold uppercase tracking-widest text-stone-500 backdrop-blur-sm mb-2">
                        <Feather size={12} className="text-stone-600 dark:text-stone-400" />
                        <span>The Modern Writer's Studio</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif font-black text-ink-900 dark:text-stone-50 leading-[0.9] tracking-tighter">
                        Silence <br />
                        <span className="italic font-light text-stone-400 dark:text-stone-600">the noise.</span>
                    </h1>

                    <p className="text-lg md:text-xl font-serif text-stone-600 dark:text-stone-400 max-w-xl mx-auto leading-relaxed">
                        A pure, distraction-free environment designed for the act of writing. 
                        No clutter, no notifications, just you and your words.
                    </p>

                    <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button 
                            onClick={onEnter}
                            className="group relative px-10 py-4 bg-ink-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-xl font-bold text-lg overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-xl hover:shadow-2xl w-full sm:w-auto"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                Start Writing <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </span>
                        </button>
                    </div>
                </div>

                {/* APP CAROUSEL */}
                <div className="w-full max-w-5xl mx-auto mb-24 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
                    <AppShowcaseCarousel />
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl w-full animate-fadeIn opacity-0" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
                    <FeatureCard 
                        icon={<Minimize2 size={20} />} 
                        title="Focus Mode" 
                        desc="An immersive interface that fades away, leaving only the cursor and the story." 
                    />
                    <FeatureCard 
                        icon={<Type size={20} />} 
                        title="Typography" 
                        desc="Elegant serif fonts and paper-like textures curated for long-form readability." 
                    />
                    <FeatureCard 
                        icon={<Book size={20} />} 
                        title="Structured Flow" 
                        desc="Organize chapters, ideas, and research in a space that respects your process." 
                    />
                </div>

            </main>

            {/* Footer */}
            <footer className="relative z-10 py-8 text-center text-[10px] font-bold uppercase tracking-widest text-stone-300 dark:text-stone-700">
                Designed for the thoughtful
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="p-6 bg-white/40 dark:bg-stone-900/40 border border-stone-200/50 dark:border-stone-800/50 rounded-2xl backdrop-blur-sm hover:bg-white/80 dark:hover:bg-stone-900/80 hover:border-stone-300 dark:hover:border-stone-700 transition-all duration-300 group">
        <div className="text-stone-400 group-hover:text-ink-900 dark:group-hover:text-stone-100 transition-colors mb-4 bg-white dark:bg-stone-800 w-fit p-3 rounded-xl shadow-sm">{icon}</div>
        <h3 className="font-bold font-serif text-lg mb-2 text-ink-900 dark:text-stone-200">{title}</h3>
        <p className="text-sm text-stone-500 leading-relaxed">{desc}</p>
    </div>
);

// --- CAROUSEL COMPONENTS ---

const AppShowcaseCarousel = () => {
    const [activeSlide, setActiveSlide] = useState(0);
    const slides = [
        { id: 'editor', component: <EditorMockup />, label: 'Distraction-Free Editor' },
        { id: 'dashboard', component: <DashboardMockup />, label: 'Analytics Dashboard' },
        { id: 'inspiration', component: <InspirationMockup />, label: 'Inspiration Board' },
        { id: 'achievements', component: <AchievementsMockup />, label: 'Gamified Progress' }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveSlide(prev => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [slides.length]);

    return (
        <div className="relative w-full aspect-[16/10] md:aspect-[16/9] bg-stone-200 dark:bg-stone-800 rounded-xl md:rounded-2xl shadow-2xl border border-stone-300 dark:border-stone-700 overflow-hidden group">
            {/* Window Controls */}
            <div className="absolute top-0 left-0 right-0 h-8 md:h-10 bg-white/80 dark:bg-stone-900/80 backdrop-blur border-b border-stone-200 dark:border-stone-800 flex items-center px-4 gap-2 z-20">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/80"></div>
                <div className="mx-auto text-[10px] font-bold text-stone-400 uppercase tracking-wider hidden sm:block">
                    Beyond Words — {slides[activeSlide].label}
                </div>
            </div>

            {/* Slides */}
            <div className="relative w-full h-full pt-8 md:pt-10 bg-paper-50 dark:bg-stone-950">
                {slides.map((slide, index) => (
                    <div 
                        key={slide.id}
                        className={`absolute inset-0 pt-8 md:pt-10 transition-opacity duration-700 ease-in-out ${index === activeSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                    >
                        {slide.component}
                    </div>
                ))}
            </div>

            {/* Navigation Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-30 px-3 py-1.5 bg-black/10 dark:bg-white/10 backdrop-blur-md rounded-full">
                {slides.map((_, idx) => (
                    <button 
                        key={idx}
                        onClick={() => setActiveSlide(idx)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === activeSlide ? 'bg-ink-900 dark:bg-white w-4' : 'bg-stone-400/50 hover:bg-stone-400'}`}
                    />
                ))}
            </div>
        </div>
    );
};

// --- MOCKUPS (High Fidelity CSS) ---

const EditorMockup = () => (
    <div className="w-full h-full flex overflow-hidden">
        {/* Sidebar Mock */}
        <div className="w-16 md:w-64 border-r border-stone-200 dark:border-stone-800 bg-paper-100 dark:bg-stone-900 flex-shrink-0 p-4 flex flex-col gap-4">
            <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest hidden md:block">Library</div>
            <div className="space-y-2 hidden md:block">
                <div className="h-8 w-full bg-stone-200/50 dark:bg-stone-800/50 rounded flex items-center px-3 gap-2">
                    <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                    <div className="text-[10px] font-bold text-stone-600 dark:text-stone-400">Drafts</div>
                </div>
                <div className="h-8 w-full rounded flex items-center px-3 gap-2 hover:bg-stone-100 dark:hover:bg-stone-800/30">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <div className="text-[10px] font-medium text-stone-500">Ideas</div>
                </div>
                <div className="h-8 w-full rounded flex items-center px-3 gap-2 hover:bg-stone-100 dark:hover:bg-stone-800/30">
                    <div className="w-2 h-2 rounded-full bg-stone-400"></div>
                    <div className="text-[10px] font-medium text-stone-500">Archive</div>
                </div>
            </div>
            {/* Mobile Icon placeholders */}
            <div className="space-y-4 md:hidden flex flex-col items-center">
                <div className="w-8 h-8 bg-stone-200 dark:bg-stone-800 rounded-lg"></div>
                <div className="w-8 h-8 rounded-lg border border-stone-200 dark:border-stone-800"></div>
                <div className="w-8 h-8 rounded-lg border border-stone-200 dark:border-stone-800"></div>
            </div>
        </div>
        
        {/* Editor Area Mock */}
        <div className="flex-1 p-8 md:p-12 flex justify-center bg-paper-50 dark:bg-stone-950 overflow-hidden relative">
            <div className="max-w-2xl w-full space-y-6">
                <h1 className="text-4xl md:text-5xl font-serif font-black text-ink-900 dark:text-stone-100 leading-tight">The Art of Silence</h1>
                
                <div className="space-y-4 font-serif text-ink-800 dark:text-stone-300 text-base md:text-lg leading-relaxed">
                    <p>It was the kind of silence that you could feel. Not an absence of noise, but a presence of peace. The cursor blinked on the screen, a steady heartbeat waiting for the next thought.</p>
                    <p>She took a sip of her coffee, the ceramic warm against her palms. Outside, the rain tapped a gentle rhythm against the windowpane, blurring the city lights into abstract streaks of amber and steel.</p>
                    <blockquote className="border-l-4 border-stone-300 dark:border-stone-700 pl-4 italic text-stone-500 dark:text-stone-400 my-6">
                        "Write until it becomes as natural as breathing. Write until not writing makes you anxious."
                    </blockquote>
                    <p>This was where the work happened. In the quiet moments between the chaos of the day and the dreams of the night.</p>
                </div>
            </div>
            
            {/* Floating Toolbar Mock */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white dark:bg-stone-800 shadow-xl border border-stone-200 dark:border-stone-700 rounded-full px-4 py-2 flex items-center gap-4 text-stone-400 hidden md:flex">
                <div className="text-xs font-bold uppercase tracking-wider">Saved</div>
                <div className="w-px h-4 bg-stone-200 dark:bg-stone-700"></div>
                <div className="flex gap-2">
                    <div className="w-4 h-4 bg-stone-200 dark:bg-stone-700 rounded"></div>
                    <div className="w-4 h-4 bg-stone-200 dark:bg-stone-700 rounded"></div>
                    <div className="w-4 h-4 bg-stone-200 dark:bg-stone-700 rounded"></div>
                </div>
            </div>
        </div>
    </div>
);

const DashboardMockup = () => (
    <div className="w-full h-full bg-paper-50 dark:bg-stone-950 p-6 md:p-12 overflow-hidden flex flex-col gap-6">
        <div className="flex justify-between items-end mb-2">
            <div>
                <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Overview</div>
                <div className="text-2xl md:text-3xl font-serif font-bold text-ink-900 dark:text-stone-100">Writing Progress</div>
            </div>
            <div className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded font-bold">Synced</div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-4 flex flex-col justify-between h-24 shadow-sm">
                <div className="text-[10px] uppercase font-bold text-stone-400">Total Words</div>
                <div className="text-2xl font-serif font-bold text-ink-900 dark:text-stone-100">12,405</div>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-4 flex flex-col justify-between h-24 shadow-sm">
                <div className="text-[10px] uppercase font-bold text-stone-400">Streak</div>
                <div className="text-2xl font-serif font-bold text-ink-900 dark:text-stone-100 flex items-center gap-2">14 <span className="text-xs font-sans font-normal text-stone-400">Days</span></div>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-4 flex flex-col justify-between h-24 shadow-sm hidden md:flex">
                <div className="text-[10px] uppercase font-bold text-stone-400">Notes</div>
                <div className="text-2xl font-serif font-bold text-ink-900 dark:text-stone-100">28</div>
            </div>
            <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-4 flex flex-col justify-between h-24 shadow-sm hidden md:flex">
                <div className="text-[10px] uppercase font-bold text-stone-400">Points</div>
                <div className="text-2xl font-serif font-bold text-yellow-500">2,540</div>
            </div>
        </div>

        <div className="flex-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg p-6 flex items-end justify-between gap-4 relative shadow-sm">
             {/* Chart Bars */}
             <div className="absolute inset-0 flex flex-col justify-between p-6 opacity-10 pointer-events-none">
                 <div className="w-full border-b border-black dark:border-white"></div>
                 <div className="w-full border-b border-black dark:border-white"></div>
                 <div className="w-full border-b border-black dark:border-white"></div>
             </div>
             
             {[
                 { h: 30, d: 'M' }, { h: 50, d: 'T' }, { h: 45, d: 'W' }, { h: 70, d: 'T' }, { h: 60, d: 'F' }, { h: 80, d: 'S' }, { h: 55, d: 'S' }
             ].map((item, i) => (
                 <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                     <div className="w-full max-w-[40px] bg-stone-100 dark:bg-stone-800 rounded-t relative overflow-hidden h-full flex items-end">
                         <div className="w-full bg-ink-900 dark:bg-stone-400 transition-all duration-1000 group-hover:bg-stone-600" style={{ height: `${item.h}%` }}></div>
                     </div>
                     <span className="text-[10px] font-bold text-stone-400">{item.d}</span>
                 </div>
             ))}
        </div>
    </div>
);

const InspirationMockup = () => (
    <div className="w-full h-full bg-stone-100 dark:bg-stone-950 relative overflow-hidden p-8">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 relative z-10 max-w-4xl mx-auto">
            {/* Card 1: Text */}
            <div className="bg-white dark:bg-stone-900 p-4 rounded-lg shadow-lg border border-stone-200 dark:border-stone-800 transform rotate-1 transition-transform hover:scale-105">
                <div className="flex justify-between items-start mb-2">
                    <div className="text-[10px] font-bold uppercase text-stone-400">Quote</div>
                    <MoreHorizontal size={12} className="text-stone-300" />
                </div>
                <p className="font-serif text-xs md:text-sm text-ink-900 dark:text-stone-200 italic leading-relaxed">
                    "Write drunk, edit sober."
                </p>
                <div className="mt-2 text-[10px] text-stone-500 text-right">— Hemingway</div>
            </div>

            {/* Card 2: Highlight */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg shadow-md border border-yellow-200 dark:border-yellow-800/30 transform -rotate-2 transition-transform hover:scale-105">
                <div className="flex gap-2 items-center mb-2">
                    <Quote size={12} className="text-yellow-600 dark:text-yellow-500" />
                    <div className="text-[10px] font-bold uppercase text-yellow-700 dark:text-yellow-500">Highlight</div>
                </div>
                <p className="font-serif text-xs md:text-sm text-ink-900 dark:text-stone-100 leading-relaxed">
                    The protagonist's flaw is not his fear, but his inability to admit it.
                </p>
                <div className="mt-2 pt-2 border-t border-yellow-200 dark:border-yellow-800/30 text-[9px] text-yellow-600 dark:text-yellow-400">
                    Source: Character Study
                </div>
            </div>

            {/* Card 3: Image */}
            <div className="bg-white dark:bg-stone-900 p-3 rounded-lg shadow-lg border border-stone-200 dark:border-stone-800 transform rotate-2 mt-4 md:mt-0 transition-transform hover:scale-105">
                <div className="h-24 bg-stone-200 dark:bg-stone-800 rounded mb-2 flex items-center justify-center overflow-hidden relative">
                    <ImageIcon size={24} className="text-stone-400 absolute" />
                    <div className="absolute inset-0 bg-gradient-to-tr from-stone-300 to-stone-100 dark:from-stone-800 dark:to-stone-700 opacity-50"></div>
                </div>
                <div className="text-[10px] font-bold text-ink-900 dark:text-stone-200">Mood Board: Rainy London</div>
                <div className="flex gap-1 mt-2">
                    <span className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded text-[9px] text-stone-500">Atmosphere</span>
                    <span className="px-1.5 py-0.5 bg-stone-100 dark:bg-stone-800 rounded text-[9px] text-stone-500">Noir</span>
                </div>
            </div>

            {/* Card 4: Link */}
            <div className="bg-white dark:bg-stone-900 p-4 rounded-lg shadow-md border border-stone-200 dark:border-stone-800 transform -rotate-1 hidden md:block">
                <div className="flex gap-2 items-center mb-2">
                    <LinkIcon size={12} className="text-blue-400" />
                    <div className="text-[10px] font-bold uppercase text-stone-400">Research</div>
                </div>
                <div className="text-xs font-bold text-ink-900 dark:text-stone-200 mb-1">Victorian Era Etiquette</div>
                <div className="text-[10px] text-stone-500 truncate">https://history.com/victorian...</div>
            </div>
        </div>
    </div>
);

const AchievementsMockup = () => (
    <div className="w-full h-full bg-paper-50 dark:bg-stone-950 p-6 md:p-12 overflow-hidden flex flex-col gap-6">
        <div className="flex items-center gap-3 mb-2">
            <Trophy size={24} className="text-yellow-500" />
            <h2 className="text-2xl font-serif font-bold text-ink-900 dark:text-stone-100">Writer's Journey</h2>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-stone-900 p-4 rounded-lg border border-yellow-200 dark:border-yellow-900/30 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-full text-yellow-600 dark:text-yellow-500">
                    <Feather size={20} />
                </div>
                <div>
                    <div className="text-xs font-bold text-ink-900 dark:text-stone-100">First Ink</div>
                    <div className="text-[10px] text-stone-500">Unlocked</div>
                </div>
            </div>
            
            <div className="bg-white dark:bg-stone-900 p-4 rounded-lg border border-paper-200 dark:border-stone-800 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-full text-orange-600 dark:text-orange-500">
                    <Flame size={20} />
                </div>
                <div>
                    <div className="text-xs font-bold text-ink-900 dark:text-stone-100">3-Day Streak</div>
                    <div className="text-[10px] text-stone-500">Unlocked</div>
                </div>
            </div>

            <div className="bg-stone-100 dark:bg-stone-800/50 p-4 rounded-lg border border-transparent flex items-center gap-3 opacity-60">
                <div className="p-2 bg-stone-200 dark:bg-stone-700 rounded-full text-stone-400">
                    <Lock size={20} />
                </div>
                <div>
                    <div className="text-xs font-bold text-stone-500 dark:text-stone-400">Novelist</div>
                    <div className="text-[10px] text-stone-400">50,000 Words</div>
                </div>
            </div>

            <div className="bg-white dark:bg-stone-900 p-4 rounded-lg border border-paper-200 dark:border-stone-800 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow hidden sm:flex">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-500">
                    <Zap size={20} />
                </div>
                <div>
                    <div className="text-xs font-bold text-ink-900 dark:text-stone-100">Early Bird</div>
                    <div className="text-[10px] text-stone-500">Unlocked</div>
                </div>
            </div>

            <div className="bg-stone-100 dark:bg-stone-800/50 p-4 rounded-lg border border-transparent flex items-center gap-3 opacity-60 hidden sm:flex">
                <div className="p-2 bg-stone-200 dark:bg-stone-700 rounded-full text-stone-400">
                    <Lock size={20} />
                </div>
                <div>
                    <div className="text-xs font-bold text-stone-500 dark:text-stone-400">Crown</div>
                    <div className="text-[10px] text-stone-400">100k Words</div>
                </div>
            </div>
            
            <div className="bg-white dark:bg-stone-900 p-4 rounded-lg border border-paper-200 dark:border-stone-800 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow hidden sm:flex">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-full text-purple-600 dark:text-purple-500">
                    <Star size={20} />
                </div>
                <div>
                    <div className="text-xs font-bold text-ink-900 dark:text-stone-100">Muse</div>
                    <div className="text-[10px] text-stone-500">Unlocked</div>
                </div>
            </div>
        </div>

        <div className="mt-auto">
            <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
                <span>Level 3 Scholar</span>
                <span>750 / 1000 XP</span>
            </div>
            <div className="h-2 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                <div className="h-full bg-ink-900 dark:bg-stone-100 w-3/4"></div>
            </div>
        </div>
    </div>
);
