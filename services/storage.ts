import { getSupabaseClient, isSupabaseConfigured } from './supabase';
import { Note, Folder, InspirationItem, UserStats } from '../types';

/**
 * STORAGE SERVICE - DEBOUNCED & FAIL SAFE
 */

// Use 'any' for timeout type to prevent conflicts between Node/Browser environments
const saveTimeouts: Record<string, any> = {};
const DEBOUNCE_DELAY = 2000; // 2 seconds

export const storage = {
    // --- NOTES ---
    async getNotes(userEmail: string): Promise<Note[] | null> {
        const email = userEmail.toLowerCase();
        let cloudData: Note[] | null = null;
        
        if (isSupabaseConfigured()) {
            try {
                const supabase = getSupabaseClient();
                if (supabase) {
                    const { data, error } = await supabase
                        .from('notes')
                        .select('*')
                        .eq('user_email', email);
                    
                    if (!error && data) {
                        cloudData = data.map((n: any) => ({
                            id: n.id,
                            folderId: n.folder_id,
                            title: n.title,
                            content: n.content,
                            updatedAt: n.updated_at ? parseInt(n.updated_at) : Date.now(),
                            targetWordCount: n.target_word_count
                        }));
                    }
                }
            } catch (err) {
                console.warn("Cloud load skipped (using local):", err);
            }
        }
        
        const localStr = localStorage.getItem(`zen_${email}_notes`);
        const localData = localStr ? JSON.parse(localStr) : null;
        return cloudData || localData;
    },

    async saveNote(note: Note, userEmail: string) {
        const email = userEmail.toLowerCase();

        // 1. Always Save Local INSTANTLY
        try {
            const existingLocal = JSON.parse(localStorage.getItem(`zen_${email}_notes`) || '[]');
            const updatedLocal = existingLocal.some((n: Note) => n.id === note.id) 
                ? existingLocal.map((n: Note) => n.id === note.id ? note : n)
                : [note, ...existingLocal];
            localStorage.setItem(`zen_${email}_notes`, JSON.stringify(updatedLocal));
        } catch (e) {
            console.error("Local save failed", e);
        }

        // 2. Cloud Save (DEBOUNCED)
        if (isSupabaseConfigured()) {
            if (saveTimeouts[note.id]) {
                clearTimeout(saveTimeouts[note.id]);
            }

            saveTimeouts[note.id] = setTimeout(async () => {
                try {
                    const supabase = getSupabaseClient();
                    if (supabase) {
                        await supabase.from('notes').upsert({
                            id: note.id,
                            user_email: email,
                            folder_id: note.folderId,
                            title: note.title,
                            content: note.content,
                            updated_at: note.updatedAt,
                            target_word_count: note.targetWordCount
                        });
                    }
                } catch (err) {
                    console.warn("Cloud save failed (queued locally):", err);
                }
                delete saveTimeouts[note.id];
            }, DEBOUNCE_DELAY);
        }
    },

    async deleteNote(noteId: string, userEmail: string) {
        const email = userEmail.toLowerCase();
        
        try {
            const existingLocal = JSON.parse(localStorage.getItem(`zen_${email}_notes`) || '[]');
            const updatedLocal = existingLocal.filter((n: Note) => n.id !== noteId);
            localStorage.setItem(`zen_${email}_notes`, JSON.stringify(updatedLocal));
        } catch(e) {}

        if (saveTimeouts[noteId]) {
            clearTimeout(saveTimeouts[noteId]);
            delete saveTimeouts[noteId];
        }

        if (isSupabaseConfigured()) {
            try {
                const supabase = getSupabaseClient();
                if (supabase) {
                    await supabase.from('notes').delete().eq('id', noteId);
                }
            } catch (err) {
                console.warn("Cloud delete failed:", err);
            }
        }
    },

    // --- FOLDERS ---
    async getFolders(userEmail: string): Promise<Folder[] | null> {
        const email = userEmail.toLowerCase();
        let cloudData: Folder[] | null = null;

        if (isSupabaseConfigured()) {
            try {
                const supabase = getSupabaseClient();
                if (supabase) {
                    const { data, error } = await supabase
                        .from('folders')
                        .select('*')
                        .eq('user_email', email);
                    
                    if (!error && data) cloudData = data;
                }
            } catch (err) {
                console.warn("Cloud folders skipped:", err);
            }
        }

        const localStr = localStorage.getItem(`zen_${email}_folders`);
        const localData = localStr ? JSON.parse(localStr) : null;
        return cloudData || localData;
    },

    async saveFolders(folders: Folder[], userEmail: string) {
        const email = userEmail.toLowerCase();
        localStorage.setItem(`zen_${email}_folders`, JSON.stringify(folders));

        if (isSupabaseConfigured()) {
            try {
                const supabase = getSupabaseClient();
                if (supabase) {
                    for (const f of folders) {
                        await supabase.from('folders').upsert({
                            id: f.id,
                            user_email: email,
                            name: f.name,
                            color: f.color
                        });
                    }
                }
            } catch (err) {
                console.warn("Cloud folder save failed:", err);
            }
        }
    },

    // --- INSPIRATION ---
    async getInspiration(userEmail: string): Promise<InspirationItem[] | null> {
        const email = userEmail.toLowerCase();
        let cloudData: InspirationItem[] | null = null;

        if (isSupabaseConfigured()) {
            try {
                const supabase = getSupabaseClient();
                if (supabase) {
                    const { data, error } = await supabase
                        .from('inspiration')
                        .select('*')
                        .eq('user_email', email);
                    
                    if (!error && data) {
                        cloudData = data.map((i: any) => ({
                            id: i.id,
                            type: i.type,
                            content: i.content,
                            title: i.title,
                            snippet: i.snippet,
                            created_at: i.created_at ? parseInt(i.created_at) : Date.now(),
                            x: i.x,
                            y: i.y
                        }));
                    }
                }
            } catch (err) {
                console.warn("Cloud inspiration load skipped:", err);
            }
        }
        
        const localStr = localStorage.getItem(`zen_${email}_inspiration`);
        const localData = localStr ? JSON.parse(localStr) : null;
        return cloudData || localData;
    },

    async saveInspiration(items: InspirationItem[], userEmail: string) {
        const email = userEmail.toLowerCase();
        localStorage.setItem(`zen_${email}_inspiration`, JSON.stringify(items));

        if (isSupabaseConfigured()) {
            try {
                const supabase = getSupabaseClient();
                if (supabase) {
                    for (const i of items) {
                        await supabase.from('inspiration').upsert({
                            id: i.id,
                            user_email: email,
                            type: i.type,
                            content: i.content,
                            title: i.title,
                            snippet: i.snippet,
                            created_at: i.createdAt,
                            x: i.x,
                            y: i.y
                        });
                    }
                }
            } catch (err) {
                 console.warn("Cloud inspiration save failed:", err);
            }
        }
    },
    
    async deleteInspiration(id: string, userEmail: string) {
         if (isSupabaseConfigured()) {
             try {
                 const supabase = getSupabaseClient();
                 if (supabase) {
                     await supabase.from('inspiration').delete().eq('id', id);
                 }
             } catch (err) {
                 console.warn("Cloud inspiration delete failed:", err);
             }
         }
    },

    // --- STATS ---
    async getStats(userEmail: string): Promise<UserStats | null> {
        const email = userEmail.toLowerCase();
        let cloudData: UserStats | null = null;

        if (isSupabaseConfigured()) {
            try {
                const supabase = getSupabaseClient();
                if (supabase) {
                    const { data, error } = await supabase
                        .from('user_stats')
                        .select('stats_json')
                        .eq('user_email', email)
                        .maybeSingle();
                    
                    if (!error && data && data.stats_json) {
                        cloudData = JSON.parse(data.stats_json);
                    }
                }
            } catch (err) {
                console.warn("Cloud stats load skipped:", err);
            }
        }
        
        const localStr = localStorage.getItem(`zen_${email}_stats`);
        const localData = localStr ? JSON.parse(localStr) : null;
        return cloudData || localData;
    },

    async saveStats(stats: UserStats, userEmail: string) {
        const email = userEmail.toLowerCase();
        localStorage.setItem(`zen_${email}_stats`, JSON.stringify(stats));

        if (isSupabaseConfigured()) {
            try {
                const supabase = getSupabaseClient();
                if (supabase) {
                    await supabase.from('user_stats').upsert({
                        user_email: email,
                        stats_json: JSON.stringify(stats)
                    });
                }
            } catch (err) {
                console.warn("Cloud stats save failed:", err);
            }
        }
    }
};