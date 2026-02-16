/**
 * BACKEND SERVICE ABSTRACTION LAYER
 * 
 * Este arquivo centraliza todas as chamadas ao backend (Firebase/Supabase).
 * Objetivo: Permitir a migração gradual sem quebrar a UI.
 * 
 * Atualmente: Wrapper para o Firebase existente.
 * Futuramente: Switch para Supabase.
 */

import {
    auth as fbAuth,
    db as fbDb,
    storage as fbStorage,
    appId as fbAppId
} from '../firebase/client';
import {
    signInAnonymously,
    signInWithCustomToken,
    onAuthStateChanged,
    signOut
} from 'firebase/auth';
import {
    doc,
    setDoc,
    getDoc,
    onSnapshot
} from 'firebase/firestore';
import {
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'firebase/storage';

import { supabase } from '../supabase/client';
export { supabase };

// ==========================================
// CONFIGURATION
// ==========================================
export const PROVIDER = 'SUPABASE'; // 'FIREBASE' | 'SUPABASE'

export const backend = {
    // Auth
    auth: {
        signInAnonymously: async () => {
            if (PROVIDER === 'FIREBASE') return signInAnonymously(fbAuth);
            if (PROVIDER === 'SUPABASE') {
                // Supabase doesn't have "anonymous" auth in the same way.
                // We can use a public user or just rely on RLS for public variables.
                // For now, we return a mock user or handle it if you need specific auth.
                // Or use signInAnonymously if configured in Supabase (requires extra setup).
                console.warn("Supabase signInAnonymously: Check RLS policies.");
                return { user: { isAnonymous: true, uid: 'anon' } };
            }
        },
        signInWithCustomToken: async (token) => {
            if (PROVIDER === 'FIREBASE') return signInWithCustomToken(fbAuth, token);
            // Supabase uses different auth. If migrating custom tokens, need mapping.
        },
        // Login for Admin
        signInWithPassword: async (email, password) => {
            if (PROVIDER === 'SUPABASE') {
                // Allow username login by appending domain if validation fails or just by default
                let finalEmail = email;
                if (!email.includes('@')) {
                    finalEmail = `${email}@gmad.com`;
                }
                if (!supabase) {
                    console.error("Supabase not initialized. Login failed.");
                    throw new Error("Sistema indisponível (Erro de Configuração)");
                }
                const { data, error } = await supabase.auth.signInWithPassword({ email: finalEmail, password });
                if (error) throw error;
                return data.user;
            }
            // Helper for Firebase compat if needed, though AdminPanel handles its own creds check currently
        },
        onAuthStateChanged: (callback) => {
            if (PROVIDER === 'FIREBASE') return onAuthStateChanged(fbAuth, callback);
            if (PROVIDER === 'SUPABASE') {
                // Para o Supabase, como não estamos usando Auth Real para as TVs (via Anon),
                // enviamos um usuário mock imediatamente para destravar o App.jsx
                setTimeout(() => callback({ isAnonymous: true, uid: 'anon' }), 0);

                if (!supabase) return () => { };
                const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                    if (session?.user) callback(session.user);
                });
                return () => subscription.unsubscribe();
            }
        },
        signOut: async () => {
            if (PROVIDER === 'FIREBASE') return signOut(fbAuth);
            if (PROVIDER === 'SUPABASE') {
                if (!supabase) return;
                return supabase.auth.signOut();
            }
        },
        currentUser: () => {
            if (PROVIDER === 'FIREBASE') return fbAuth?.currentUser;
            if (PROVIDER === 'SUPABASE') return { isAnonymous: true, uid: 'anon' }; // Mock sync
        }
    },

    // Database (Firestore / Postgres)
    db: {
        // Assinatura em tempo real
        subscribeToDoc: (collection, docId, callback) => {
            if (PROVIDER === 'FIREBASE') {
                const docRef = doc(fbDb, 'artifacts', fbAppId, 'public', 'data', collection, docId);
                return onSnapshot(docRef, (snap) => {
                    callback(snap.exists() ? snap.data() : null);
                });
            }
            if (PROVIDER === 'SUPABASE') {
                if (!supabase) {
                    console.error("Supabase not initialized.");
                    callback(null);
                    return () => { };
                }
                // Initial Fetch
                supabase.from('tv_collections').select(docId).eq('collection_id', collection).maybeSingle()
                    .then(({ data, error }) => {
                        if (error) {
                            console.error(`[SUPABASE] Fetch error for ${collection}/${docId}:`, error.message);
                            callback(null);
                        } else if (data) {
                            callback(data[docId]);
                        } else {
                            callback(null);
                        }
                    });

                const channel = supabase.channel(`public:tv_collections:${collection}`)
                    .on('postgres_changes', {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'tv_collections',
                        filter: `collection_id=eq.${collection}`
                    }, (payload) => {
                        if (payload.new && payload.new[docId]) {
                            callback(payload.new[docId]);
                        }
                    })
                    .subscribe();

                return () => supabase.removeChannel(channel);
            }
        },

        // Get único
        getDoc: async (collection, docId) => {
            if (PROVIDER === 'FIREBASE') {
                const docRef = doc(fbDb, 'artifacts', fbAppId, 'public', 'data', collection, docId);
                const snap = await getDoc(docRef);
                return snap.exists() ? snap.data() : null;
            }
            if (PROVIDER === 'SUPABASE') {
                if (!supabase) return null;
                const { data, error } = await supabase.from('tv_collections').select(docId).eq('collection_id', collection).maybeSingle();
                if (error) {
                    console.error(`[SUPABASE] getDoc error:`, error.message);
                    return null;
                }
                return data ? data[docId] : null;
            }
        },

        // Set / Update
        setDoc: async (collection, docId, data) => {
            if (PROVIDER === 'FIREBASE') {
                const docRef = doc(fbDb, 'artifacts', fbAppId, 'public', 'data', collection, docId);
                return setDoc(docRef, data);
            }
            if (PROVIDER === 'SUPABASE') {
                if (!supabase) throw new Error("Supabase não configurado.");
                const updateData = { collection_id: collection };
                updateData[docId] = data;

                const { error } = await supabase
                    .from('tv_collections')
                    .upsert(updateData, { onConflict: 'collection_id' });

                if (error) throw error;
                return { data: updateData };
            }
        }
    },

    // Storage
    storage: {
        uploadFile: async (file) => {
            if (PROVIDER === 'FIREBASE') {
                const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
                const storageRef = ref(fbStorage, `artifacts/${fbAppId}/public/${Date.now()}_${safeName}`);
                const snapshot = await uploadBytes(storageRef, file);
                return getDownloadURL(snapshot.ref);
            }
            if (PROVIDER === 'SUPABASE') {
                if (!supabase) throw new Error("Supabase não configurado.");
                const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
                const { data, error } = await supabase.storage.from('media').upload(safeName, file);
                if (error) throw error;

                const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(safeName);
                return publicUrl;
            }
        },
        deleteFile: async (url) => {
            if (PROVIDER === 'FIREBASE') {
                const fileRef = ref(fbStorage, url);
                return deleteObject(fileRef);
            }
            if (PROVIDER === 'SUPABASE') {
                if (!supabase) return { error: "Supabase não configurado." };
                // Extract filename regardless of query params
                const match = url.match(/\/media\/([^?#]+)/);
                const path = match ? match[1] : null;

                if (path) {
                    const { error } = await supabase.storage.from('media').remove([path]);
                    if (error) console.error(`[SUPABASE] deleteFile error:`, error.message);
                    return { error };
                }
            }
        }
    }
};
