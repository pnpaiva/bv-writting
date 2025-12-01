
import React, { useState } from 'react';
import { Note, UserStats, Achievement } from '../types';
import { Menu, PenTool, BookOpen, Clock, TrendingUp, Trophy, Lock, Feather, Flame, Crown, Scroll, ChevronLeft, ChevronRight, Moon, Sun, Calendar, Wind, Target, Zap, Lightbulb, Globe, Maximize, Eye, Image, Video, Table, Type, CheckCircle } from 'lucide-react';

interface DashboardProps {
  notes: Note[];
  stats: UserStats;
  onToggleSidebar: () => void;
  onNavigateToNote: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ notes, stats, onToggleSidebar, onNavigateToNote }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 8;
  const totalPages = Math.ceil(stats.achievements.length / itemsPerPage);

  const paginatedAchievements = stats.achievements.slice(
      currentPage * itemsPerPage,
      (currentPage + 1) * itemsPerPage
  );

  // Icon mapper
  const getIcon = (iconName: string, size = 20) => {
      switch(iconName) {
          case 'Feather': return <Feather size={size} />;
          case 'Flame': return <Flame size={size} />;
          case 'BookOpen': return <BookOpen size={size} />;
          case 'Scroll': return <Scroll size={size} />;
          case 'Crown': return <Crown size={size} />;
          case 'Moon': return <Moon size={size} />;
          case 'Sun': return <Sun size={size} />;
          case 'Calendar': return <Calendar size={size} />;
          case 'Wind': return <Wind size={size} />;
          case 'TrendingUp': return <TrendingUp size={size} />;
          case 'Target': return <Target size={size} />;
          case 'Zap': return <Zap size={size} />;
          case 'Lightbulb': return <Lightbulb size={size} />;
          case 'Globe': return <Globe size={size} />;
          case 'Maximize': return <Maximize size={size} />;
          case 'Eye': return <Eye size={size} />;
          case 'Image': return <Image size={size} />;
          case 'Video': return <Video size={size} />;
          case 'Table': return <Table size={size} />;
          case 'Type': return <Type size={size} />;
          case 'CheckCircle': return <CheckCircle size={size} />;
          default: return <Trophy size={size} />;
      }
  };

  // --- Graph Logic: Last 7 Days ---
  const generateLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        // CHANGED: Format to "Nov 25" style
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        days.push({ dateStr, label });
    }
    return days;
  };

  const last7Days = generateLast7Days();
  const dailyHistory = stats.dailyHistory || [];
  
  // Map actual data to the last 7 days
  const chartData = last7Days.map(day => {
      const found = dailyHistory.find(h => h.date === day.dateStr);
      return {
          ...day,
          count: found ? found.wordCount : 0
      };
  });

  const maxDaily = Math.max(Math.max(...chartData.map(d => d.count)), 10); 

  const StatCard: React.FC<{ label: string, value: string | number, icon: React.ReactNode, sub?: string }> = ({ label, value, icon, sub }) => (
      <div className="bg-white dark:bg-stone-900 border border-paper-200 dark:border-stone-800 p-6 rounded-lg shadow-sm flex items-start justify-between">
          <div>
              <p className="text-stone-500 dark:text-stone-400 text-sm font-bold uppercase tracking-wider mb-1">{label}</p>
              <h3 className="text-3xl font-serif font-bold text-ink-900 dark:text-stone-100">{value}</h3>
              {sub && <p className="text-stone-400 text-xs mt-2">{sub}</p>}
          </div>
          <div className="p-3 bg-paper-100 dark:bg-stone-800 rounded-full text-stone-600 dark:text-stone-300">
              {icon}
          </div>
      </div>
  );

  // Net Words Calculation
  const netWords = notes.reduce((acc, n) => {
      const text = n.content.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
      if (!text) return acc;
      return acc + text.split(/[\s\n]+/).filter(w => w.length > 0).length;
  }, 0);

  return (
    <div className="h-full overflow-y-auto bg-paper-50 dark:bg-stone-950 p-4 md:p-8 transition-colors">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center mb-6">
            <button onClick={onToggleSidebar} className="p-2 mr-4 bg-white dark:bg-stone-900 border border-paper-200 dark:border-stone-800 rounded text-stone-600">
                <Menu size={20} />
            </button>
            <h1 className="text-xl font-serif font-bold text-ink-900 dark:text-stone-100">Dashboard</h1>
        </div>

        <div className="max-w-6xl mx-auto space-y-10">
            {/* Header */}
            <div>
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-ink-900 dark:text-stone-100 mb-2">Writing Overview</h1>
                <p className="text-stone-500 dark:text-stone-400 font-serif italic">"There is no greater agony than bearing an untold story inside you."</p>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard 
                    label="Net Words Stored" 
                    value={netWords.toLocaleString()} 
                    icon={<PenTool size={24} />}
                    sub={`Lifetime: ${stats.totalWordsWritten.toLocaleString()}`}
                />
                <StatCard 
                    label="Current Streak" 
                    value={`${stats.currentStreak} Days`} 
                    icon={<Flame size={24} className={stats.currentStreak > 2 ? 'text-orange-500' : ''} />}
                    sub={`Best: ${stats.maxStreak} Days`}
                />
                <StatCard 
                    label="Total Notes" 
                    value={notes.length} 
                    icon={<BookOpen size={24} />}
                />
                <StatCard 
                    label="Writer Points" 
                    value={Math.floor(stats.points).toLocaleString()} 
                    icon={<Trophy size={24} className="text-yellow-500" />}
                />
            </div>

            {/* Weekly Progress Chart */}
            <div className="bg-white dark:bg-stone-900 border border-paper-200 dark:border-stone-800 rounded-lg p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="font-serif font-bold text-lg text-ink-900 dark:text-stone-100">Weekly Progress</h3>
                    <div className="text-xs text-stone-500 font-medium bg-paper-100 dark:bg-stone-800 px-3 py-1 rounded-full">Net Words per Day</div>
                </div>
                
                <div className="relative h-64 w-full">
                    {/* Background Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between text-xs text-stone-400 z-0">
                         <div className="w-full border-b border-stone-100 dark:border-stone-800 border-dashed h-0"></div>
                         <div className="w-full border-b border-stone-100 dark:border-stone-800 border-dashed h-0"></div>
                         <div className="w-full border-b border-stone-100 dark:border-stone-800 border-dashed h-0"></div>
                         <div className="w-full border-b border-stone-100 dark:border-stone-800 border-dashed h-0"></div>
                         <div className="w-full border-b border-stone-200 dark:border-stone-800 h-0"></div>
                    </div>

                    <div className="absolute inset-0 flex items-end justify-between px-2 sm:px-8 gap-4 z-10">
                        {chartData.map((day, idx) => {
                            const heightPercent = maxDaily > 0 ? (day.count / maxDaily) * 100 : 0;
                            // Ensure tiny bars are visible if count > 0
                            const visualHeight = day.count > 0 ? Math.max(heightPercent, 2) : 0;
                            
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end">
                                    <div className="w-full max-w-[50px] relative flex flex-col justify-end h-full">
                                        <div 
                                            // CHANGED: Hover color to stone-400 (Silver)
                                            className="w-full bg-ink-900 dark:bg-stone-200 rounded-t-sm hover:bg-stone-700 dark:hover:bg-stone-400 transition-all duration-500 relative group-hover:shadow-lg cursor-pointer"
                                            style={{ height: `${visualHeight}%` }}
                                        >
                                            {/* Tooltip */}
                                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black dark:bg-white dark:text-black text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 font-bold shadow-lg pointer-events-none">
                                                {day.count} words
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-xs text-stone-400 mt-3 font-medium uppercase tracking-wider">{day.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Recent Notes */}
                <div className="bg-white dark:bg-stone-900 border border-paper-200 dark:border-stone-800 rounded-lg shadow-sm overflow-hidden h-fit">
                    <div className="px-6 py-4 border-b border-paper-200 dark:border-stone-800 flex items-center gap-2">
                        <Clock size={18} className="text-stone-400" />
                        <h3 className="font-serif font-bold text-lg text-ink-900 dark:text-stone-100">Recently Edited</h3>
                    </div>
                    <div className="divide-y divide-paper-100 dark:divide-stone-800">
                        {notes.slice().sort((a,b) => b.updatedAt - a.updatedAt).slice(0, 4).map(note => (
                            <div 
                                key={note.id} 
                                onClick={() => onNavigateToNote(note.id)}
                                className="p-4 hover:bg-paper-50 dark:hover:bg-stone-800 transition-colors cursor-pointer flex items-center justify-between group"
                            >
                                <div>
                                    <h4 className="font-bold text-ink-900 dark:text-stone-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {note.title || "Untitled Note"}
                                    </h4>
                                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 line-clamp-1 font-serif">
                                        {note.content.replace(/<[^>]*>/g, ' ').substring(0, 60)}...
                                    </p>
                                </div>
                                <span className="text-xs text-stone-400 whitespace-nowrap ml-4">
                                    {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Achievements */}
                <div className="bg-white dark:bg-stone-900 border border-paper-200 dark:border-stone-800 rounded-lg shadow-sm flex flex-col h-full min-h-[400px]">
                    <div className="px-6 py-4 border-b border-paper-200 dark:border-stone-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             <Trophy size={18} className="text-stone-400" />
                             <h3 className="font-serif font-bold text-lg text-ink-900 dark:text-stone-100">Achievements</h3>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                             <span className="text-stone-500">{stats.achievements.filter(a => a.unlocked).length} / {stats.achievements.length}</span>
                        </div>
                    </div>
                    
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 content-start">
                        {paginatedAchievements.map(badge => (
                            <div 
                                key={badge.id} 
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-all h-20
                                    ${badge.unlocked 
                                        ? 'bg-paper-50 dark:bg-stone-800 border-paper-200 dark:border-stone-700' 
                                        : 'bg-stone-50 dark:bg-black/30 border-transparent opacity-60'}
                                `}
                            >
                                <div className={`p-2 rounded-full flex-shrink-0 ${badge.unlocked ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-stone-200 text-stone-400 dark:bg-stone-800'}`}>
                                    {badge.unlocked ? getIcon(badge.icon) : <Lock size={20} />}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-sm text-ink-900 dark:text-stone-200 truncate">{badge.title}</h4>
                                    <p className="text-[10px] text-stone-500 line-clamp-2 leading-tight">{badge.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-paper-200 dark:border-stone-800 flex justify-between items-center bg-paper-50 dark:bg-stone-900/50 rounded-b-lg">
                        <button 
                            disabled={currentPage === 0}
                            onClick={() => setCurrentPage(c => c - 1)}
                            className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-xs text-stone-500 font-bold">Page {currentPage + 1} of {totalPages}</span>
                        <button 
                            disabled={currentPage === totalPages - 1}
                            onClick={() => setCurrentPage(c => c + 1)}
                            className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-800 disabled:opacity-30 transition-colors"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    </div>
  );
};
