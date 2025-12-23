import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// --- ULTRA-VISIBLE LOGS ---
console.log('****************************************');
console.log('*** SUPABASE CONFIG LOADED (Ver 4.0) ***');
console.log('*** Timestamp: ' + new Date().toLocaleTimeString() + ' ***');
console.log('****************************************');

// Deep cleaning function
const deepClean = (val) => {
    if (!val) return '';
    return val
        .replace(/[^\x20-\x7E]/g, "") // Remove non-printable ASCII
        .trim()
        .replace(/(\r\n|\n|\r)/gm, "") // Remove all carriage returns/newlines
        .replace(/^["']|["']$/g, ""); // Remove wrap-around quotes
};

// 1. Production Credentials (STRICT HARD-FIX)
const REAL_URL = 'https://api.weversity.org';
const REAL_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

// 2. Get environment variables
const envUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const envKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// 3. Force switch to Real URL if .env is missing or invalid
const isPlaceholder = (val) => !val || val.includes('YOUR_SUPABASE') || val.length < 10 || !val.startsWith('http');

const finalUrl = isPlaceholder(envUrl) ? REAL_URL : deepClean(envUrl);
const finalKey = isPlaceholder(envKey) ? REAL_KEY : deepClean(envKey);

console.log('Source:', isPlaceholder(envUrl) ? '⚠️ FORCED HARDCODED (ENV FAILED)' : '✅ ENV LOADED');
console.log('Final URL:', finalUrl);

// 4. Client Creation
export const supabase = createClient(finalUrl, finalKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
