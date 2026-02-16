/**
 * BACKEND SERVICE ABSTRACTION LAYER
 * 
 * Centraliza as chamadas ao backend.
 * Suporta PROVIDER: 'SUPABASE' | 'LOCAL'
 */

import { supabase } from '../supabase/client';
export { supabase };

// ==========================================
// CONFIGURATION
// ==========================================
// MUDANÇA: Agora o padrão é LOCAL para eliminar dependência do Supabase
export const PROVIDER = 'LOCAL';

export const backend = {
    // Auth (Mockado no modo LOCAL)
    auth: {
        signInAnonymously: async () => ({ user: { isAnonymous: true, uid: 'anon' } }),
        signInWithPassword: async (email, password) => {
            if (PROVIDER === 'SUPABASE') {
                let finalEmail = email.includes('@') ? email : `${email}@gmad.com`;
                const { data, error } = await supabase.auth.signInWithPassword({ email: finalEmail, password });
                if (error) throw error;
                return data.user;
            }
            // LOCAL: Aceita qualquer coisa para admin/admin (ou o que estiver no JSON futuramente)
            if (email === 'admin' && password === 'admin') return { uid: 'admin' };
            throw new Error("Credenciais inválidas");
        },
        onAuthStateChanged: (callback) => {
            setTimeout(() => callback({ isAnonymous: true, uid: 'anon' }), 0);
            return () => { };
        },
        signOut: async () => { },
        currentUser: () => ({ isAnonymous: true, uid: 'anon' })
    },

    // Database (Local API / Supabase)
    db: {
        // No modo LOCAL, subscribeToDoc apenas emite o dado inicial
        subscribeToDoc: (collection, docId, callback) => {
            if (PROVIDER === 'LOCAL') {
                // Aqui no LOCAL, usamos os dados importados no App.jsx.
                // Mas para compatibilidade, o backend.db.getDoc será usado.
                return () => { };
            }
            // Supabase implementation...
            if (PROVIDER === 'SUPABASE' && supabase) {
                supabase.from('tv_collections').select(docId).eq('collection_id', collection).maybeSingle()
                    .then(({ data }) => data && callback(data[docId]));

                const channel = supabase.channel(`public:tv_collections:${collection}`)
                    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tv_collections', filter: `collection_id=eq.${collection}` },
                        (p) => p.new && p.new[docId] && callback(p.new[docId]))
                    .subscribe();
                return () => supabase.removeChannel(channel);
            }
            return () => { };
        },

        getDoc: async (collection, docId) => {
            if (PROVIDER === 'LOCAL') {
                try {
                    const res = await fetch('/api/get-local-data');
                    const allData = await res.json();
                    return (allData[collection] && allData[collection][docId]) || null;
                } catch (e) {
                    console.error("Local getDoc failed:", e);
                    return null;
                }
            }
            if (PROVIDER === 'SUPABASE' && supabase) {
                const { data } = await supabase.from('tv_collections').select(docId).eq('collection_id', collection).maybeSingle();
                return data ? data[docId] : null;
            }
            return null;
        },

        // SALVAMENTO HÍBRIDO (LOCAL + GITHUB PARA VERCEL)
        setDoc: async (collection, docId, data) => {
            const isVercel = window.location.hostname.includes('vercel.app');

            if (isVercel) {
                console.log("[BACKEND] Salvando via GitHub API...");
                const GITHUB_TOKEN = localStorage.getItem('gmad_github_token');
                const REPO = 'zephirun/tv-gmad';
                const FILE_PATH = 'src/data/local_cities.json';

                if (!GITHUB_TOKEN) throw new Error("GitHub Token não configurado no Painel Admin.");

                // 1. Pegar todos os dados atuais (preservar outras cidades)
                const currentRes = await fetch('/api/get-local-data');
                const allData = await currentRes.json();

                // 2. Atualizar localmente no objeto
                if (!allData[collection]) allData[collection] = {};
                if (!allData[collection][docId]) allData[collection][docId] = {};

                // Mesclar dados
                if (typeof data === 'object' && !Array.isArray(data)) {
                    allData[collection][docId] = { ...allData[collection][docId], ...data };
                } else {
                    allData[collection][docId] = data;
                }

                // 3. Pegar o SHA do arquivo no GitHub para poder atualizar
                const getFileRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
                    headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
                });
                const fileData = await getFileRes.json();

                if (!getFileRes.ok) throw new Error("Erro ao buscar SHA do arquivo no GitHub");

                // 4. Enviar atualização
                const updateRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${GITHUB_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: `Update ${collection} ${docId} via Admin Panel`,
                        content: btoa(unescape(encodeURIComponent(JSON.stringify(allData, null, 2)))),
                        sha: fileData.sha
                    })
                });

                if (!updateRes.ok) throw new Error("Erro ao salvar no GitHub. Verifique o Token.");
                return { success: true };
            }

            if (PROVIDER === 'LOCAL') {
                const response = await fetch('/api/save-city-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        cityKey: collection,
                        data: { [docId]: data }
                    })
                });

                if (!response.ok) throw new Error("Erro ao salvar dados localmente");
                return await response.json();
            }

            if (PROVIDER === 'SUPABASE') {
                const updateData = { collection_id: collection, [docId]: data };
                const { error } = await supabase.from('tv_collections').upsert(updateData, { onConflict: 'collection_id' });
                if (error) throw error;
                return { success: true };
            }
        }
    },

    // Storage (Upload Local vs Supabase)
    storage: {
        uploadFile: async (file, cityName = 'madville') => {
            if (PROVIDER === 'LOCAL') {
                const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    headers: {
                        'x-city-name': cityName,
                        'x-file-name': safeName
                    },
                    body: file
                });
                const result = await response.json();
                return result.url;
            }

            if (PROVIDER === 'SUPABASE' && supabase) {
                const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                const { data, error } = await supabase.storage.from('media').upload(safeName, file);
                if (error) throw error;
                const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(safeName);
                return publicUrl;
            }
        },
        deleteFile: async (url) => {
            // No modo local, deletar é opcional ou removemos do disco se quiser
            console.warn("Delete local file not implemented yet:", url);
            return { success: true };
        }
    }
};
