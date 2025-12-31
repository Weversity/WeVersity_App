
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://api.weversity.org';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    if (!error && data && data.length > 0) {
        console.log('PROFILES_COLS:' + Object.keys(data[0]).join(','));
    } else {
        console.log('PROFILES_ERROR:' + (error ? error.message : 'Empty'));
    }
}

checkProfiles();
