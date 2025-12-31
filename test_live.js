
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://api.weversity.org';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLiveSessions() {
    console.log('--- Checking active live sessions ---');
    const { data: active, error: activeErr } = await supabase
        .from('live_sessions')
        .select('*')
        .eq('status', 'active');

    if (activeErr) console.log('Active Error:', activeErr.message);
    else console.log('Active Sessions:', JSON.stringify(active, null, 2));

    console.log('\n--- Checking upcoming classes today ---');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tonight = new Date();
    tonight.setHours(23, 59, 59, 999);

    const { data: upcoming, error: upcomingErr } = await supabase
        .from('live_sessions')
        .select('*')
        .gte('scheduled_at', today.toISOString())
        .lte('scheduled_at', tonight.toISOString());

    if (upcomingErr) console.log('Upcoming Error:', upcomingErr.message);
    else console.log('Upcoming Count Today:', upcoming?.length || 0);
}

testLiveSessions();
