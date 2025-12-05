import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_URL = 'shiftfree_sb_url';
const STORAGE_KEY_KEY = 'shiftfree_sb_key';

// Default credentials provided by the user
const DEFAULT_URL = 'https://hrxportfexjvqnwmlmme.supabase.co';
const DEFAULT_KEY = 'sb_publishable_L1KyEFp8kATmazXYPUJtBw_E__l2j3b';

export const getStoredCredentials = () => {
    const storedUrl = localStorage.getItem(STORAGE_KEY_URL);
    const storedKey = localStorage.getItem(STORAGE_KEY_KEY);
    
    // Return stored if available, otherwise return default hardcoded values
    return {
        url: storedUrl || DEFAULT_URL,
        key: storedKey || DEFAULT_KEY
    };
};

export const storeCredentials = (url: string, key: string) => {
    localStorage.setItem(STORAGE_KEY_URL, url);
    localStorage.setItem(STORAGE_KEY_KEY, key);
};

export const clearCredentials = () => {
    localStorage.removeItem(STORAGE_KEY_URL);
    localStorage.removeItem(STORAGE_KEY_KEY);
};

export const createClientFromStored = (): SupabaseClient | null => {
    const { url, key } = getStoredCredentials();
    if (url && key) {
        try {
            return createClient(url, key);
        } catch (e) {
            console.error("Failed to create Supabase client", e);
            return null;
        }
    }
    return null;
};

export const createNewClient = (url: string, key: string): SupabaseClient => {
    return createClient(url, key);
};