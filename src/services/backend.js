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

        // SALVAMENTO LOCAL REAL
        setDoc: async (collection, docId, data) => {
            if (PROVIDER === 'LOCAL') {
                // 'collection' aqui é a cityKey
                // Primeiro precisamos pegar o estado atual da cidade no JSON
                // Mas o AdminPanel envia uma parte (ex: playlist).
                // Nossa API local agora vai receber a cityKey e o dado específico.

                // Vamos simplificar: O AdminPanel envia backend.db.setDoc(collectionId, 'items', newItems)
                // Vamos mapear isso para a estrutura do JSON.

                const response = await fetch('/api/save-city-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        cityKey: collection,
                        data: { [docId]: data } // Isso vai mesclar no JSON no lado do servidor
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
