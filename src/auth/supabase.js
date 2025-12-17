
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bnmpwnprruexcaozecsb.supabase.co';
const supabaseKey = 'sb_publishable_zLGEXkd9kdlDdakScFo2iA_VNVhyW8b';

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
