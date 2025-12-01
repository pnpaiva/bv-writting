import { createClient, SupabaseClient } from '@supabase/supabase-js';

// GLOBAL SINGLETON
// We attach to window to ensure the instance survives Hot Module Replacement (HMR) in development.
// This is critical to stop the "Multiple GoTrueClient" warning flood.
const getGlobalInstance = () => (window as any).__supabaseInstance as SupabaseClient | null;
const setGlobalInstance = (client: SupabaseClient | null) => (window as any).__supabaseInstance = client;

// Helper to get config from local storage
const getConfig = () => {
    try {
        const url = localStorage.getItem('zen_supabase_url');
        const key = localStorage.getItem('zen_supabase_key');
        return { 
            url: url ? url.trim() : null, 
            key: key ? key.trim() : null 
        };
    } catch {
        return { url: null, key: null };
    }
};

export const getSupabaseClient = (): SupabaseClient | null => {
    // 1. Return existing global instance if available
    const existing = getGlobalInstance();
    if (existing) return existing;

    // 2. Otherwise create a new one
    const { url, key } = getConfig();
    if (url && key) {
        try {
            // Strict Validation
            new URL(url); 
            
            const client = createClient(url, key, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false,
                    storageKey: 'zen_auth_storage' // Unique key to prevent conflicts
                },
                global: {
                    headers: { 'x-application-name': 'beyond-words' }
                }
            });
            
            setGlobalInstance(client);
            return client;
        } catch (e) {
            console.warn("Invalid Supabase configuration:", e);
            return null;
        }
    }
    return null;
};

export const isSupabaseConfigured = (): boolean => {
    const { url, key } = getConfig();
    if (!url || !key) return false;
    
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

export const saveSupabaseConfig = (url: string, key: string) => {
    localStorage.setItem('zen_supabase_url', url.trim());
    localStorage.setItem('zen_supabase_key', key.trim());
    // Reset singleton so next call creates a client with NEW keys
    setGlobalInstance(null);
};

export const clearSupabaseConfig = () => {
    localStorage.removeItem('zen_supabase_url');
    localStorage.removeItem('zen_supabase_key');
    setGlobalInstance(null);
};

export const testSupabaseConnection = async (): Promise<boolean> => {
    // Force reset to ensure we test the LATEST config
    setGlobalInstance(null);
    
    const client = getSupabaseClient();
    if (!client) return false;
    try {
        const { error } = await client.from('notes').select('id').limit(1);
        if (error && error.code !== 'PGRST116') {
             console.warn("Connection test warning:", error.message);
             return false;
        }
        return true;
    } catch (e) {
        console.error("Connection test failed", e);
        return false;
    }
};