
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCollections() {
    const { data, error } = await supabase
        .from('tv_collections')
        .select('collection_id');

    if (error) {
        console.error("Error fetching collections:", error.message);
        return;
    }

    console.log("Existing collections in Supabase:");
    data.forEach(row => {
        console.log(`- ${row.collection_id}`);
    });
}

checkCollections();
