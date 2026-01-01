
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function probe() {
    console.log('Probing chat_messages by testing inserts...');

    // Test 1: Try conversation_id
    console.log('Test 1: Trying to insert with conversation_id...');
    const test1 = await supabase.from('chat_messages').insert({
        conversation_id: '00000000-0000-0000-0000-000000000000',
        content: 'probe',
        sender_id: '00000000-0000-0000-0000-000000000000' // Assuming this might fail FK constraint but error will tell us column exists
    });

    if (test1.error) {
        console.log('Test 1 Error:', test1.error.message);
        if (test1.error.message.includes('column "conversation_id" does not exist')) {
            console.log('--> conversation_id does NOT exist.');
        } else {
            console.log('--> conversation_id LIKELY EXISTS (error was other than missing column).');
        }
    }

    // Test 2: Try chat_id
    console.log('\nTest 2: Trying to insert with chat_id...');
    const test2 = await supabase.from('chat_messages').insert({
        chat_id: '00000000-0000-0000-0000-000000000000',
        content: 'probe',
        sender_id: '00000000-0000-0000-0000-000000000000'
    });

    if (test2.error) {
        console.log('Test 2 Error:', test2.error.message);
        if (test2.error.message.includes('column "chat_id" does not exist')) {
            console.log('--> chat_id does NOT exist.');
        } else {
            console.log('--> chat_id LIKELY EXISTS.');
        }
    }

    // Test 3: Try room_id
    console.log('\nTest 3: Trying to insert with room_id...');
    const test3 = await supabase.from('chat_messages').insert({
        room_id: '00000000-0000-0000-0000-000000000000',
        content: 'probe',
        sender_id: '00000000-0000-0000-0000-000000000000'
    });

    if (test3.error) {
        console.log('Test 3 Error:', test3.error.message);
        if (test3.error.message.includes('column "room_id" does not exist')) {
            console.log('--> room_id does NOT exist.');
        } else {
            console.log('--> room_id LIKELY EXISTS.');
        }
    }
}

probe();
