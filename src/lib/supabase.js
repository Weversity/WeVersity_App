import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// 1. Get Supabase credentials from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// 2. A clear, early warning if the environment variables are missing.
if (!supabaseUrl || !supabaseAnonKey) {
    const errorMessage = 'Supabase URL or Anon Key is missing. Please check your .env file.';
    console.error('**************************************************');
    console.error('***           SUPABASE CONFIG ERROR            ***');
    console.error('**************************************************');
    console.error(errorMessage);
    // Throwing an error is often better than letting the app run with a broken config.
    throw new Error(errorMessage);
}

console.log("✅ Supabase config loaded successfully.");
console.log("URL:", supabaseUrl);


// 3. Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
    // Explicitly specifying the schema is a robust way to avoid schema cache errors (PGRST002)
    db: {
        schema: 'public',
    }
});
