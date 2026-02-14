
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAll() {
    const { data, error } = await supabase
        .from('tv_collections')
        .select('collection_id, playlist, news, settings');

    if (error) {
        console.error(error);
        return;
    }

    data.forEach(row => {
        console.log(`Collection: ${row.collection_id}`);
        console.log(`Playlist items: ${row.playlist?.items?.length || 0}`);
        console.log(`News items: ${row.news?.items?.length || 0}`);
        console.log(`---`);
    });
}

inspectAll();
