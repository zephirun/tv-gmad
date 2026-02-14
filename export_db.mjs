
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function exportData() {
    const { data, error } = await supabase
        .from('tv_collections')
        .select('*');

    if (error) {
        console.error("Export error:", error.message);
        return;
    }

    const filename = `supabase_backup_${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
    console.log(`Data exported to ${filename}`);
}

exportData();
