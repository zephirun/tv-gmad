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
            const isRemote = window.location.hostname.includes('vercel.app') || window.location.hostname.includes('pages.dev');

            if (isRemote) {
                try {
                    const GITHUB_TOKEN = localStorage.getItem('gmad_github_token_v3');
                    const REPO = 'zephirun/tv-gmad';
                    const FILE_PATH = 'src/data/local_cities.json';

                    // Usamos o padrão base64 para evitar confusão de cache com o setDoc
                    const headers = { 'Accept': 'application/vnd.github.v3+json' };
                    if (GITHUB_TOKEN) headers['Authorization'] = `token ${GITHUB_TOKEN}`;

                    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?t=${Date.now()}`, {
                        headers
                    });
                    if (!res.ok) throw new Error(`GitHub fetch failed (${res.status})`);

                    const fileData = await res.json();
                    if (!fileData.content) throw new Error("GitHub metadata missing content");

                    // Decodificar Base64
                    const cleanBase64 = fileData.content.replace(/\n/g, '').replace(/\r/g, '');
                    const allData = JSON.parse(decodeURIComponent(escape(atob(cleanBase64))));

                    console.log(`[BACKEND] getDoc('${collection}', '${docId}') -> Dados carregados e decodificados do GitHub.`);
                    return (allData[collection] && allData[collection][docId]) || null;
                } catch (e) {
                    console.warn("[BACKEND] getDoc dinâmico falhou:", e.message);
                }
            }

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
            const isRemote = window.location.hostname.includes('vercel.app') || window.location.hostname.includes('pages.dev');
            if (isRemote) {
                console.log("[BACKEND] Salvando via GitHub API...");
                // Chave v3 - o usuário deve colar o novo token no painel admin
                const GITHUB_TOKEN = localStorage.getItem('gmad_github_token_v3');
                const REPO = 'zephirun/tv-gmad';
                const FILE_PATH = 'src/data/local_cities.json';

                if (!GITHUB_TOKEN) throw new Error("GitHub Token não configurado no Painel Admin.");

                // 1. Pegar o arquivo atual do GitHub (usamos metadata para ter o SHA e conteúdo base64)
                const getFileRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?v=${Date.now()}`, {
                    headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
                });

                if (!getFileRes.ok) {
                    const errorData = await getFileRes.json().catch(() => ({}));
                    throw new Error(`Erro GitHub (${getFileRes.status}): ${errorData.message || 'Falha ao buscar SHAs'}`);
                }

                const fileData = await getFileRes.json();

                if (!fileData || !fileData.content) {
                    console.error("[BACKEND] Resposta inesperada do GitHub (setDoc):", fileData);
                    throw new Error("Não foi possível obter o conteúdo do GitHub para edição. Tente recarregar a página.");
                }

                // Decodificar conteúdo (Base64 -> UTF-8 -> JSON) - Limpando quebras de linha que o GitHub envia
                const cleanBase64 = fileData.content.replace(/\n/g, '').replace(/\r/g, '');
                const currentContent = decodeURIComponent(escape(atob(cleanBase64)));
                const allData = JSON.parse(currentContent);

                // 2. Atualizar localmente no objeto
                if (!allData[collection]) allData[collection] = {};
                if (!allData[collection][docId]) allData[collection][docId] = {};

                // Mesclar dados
                if (typeof data === 'object' && !Array.isArray(data)) {
                    allData[collection][docId] = { ...allData[collection][docId], ...data };
                } else {
                    allData[collection][docId] = data;
                }

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
        },

        setDocsBatch: async (collection, docsMap) => {
            const isRemote = window.location.hostname.includes('vercel.app') || window.location.hostname.includes('pages.dev');
            if (isRemote) {
                console.log("[BACKEND] Salvando lote via GitHub API...");
                const GITHUB_TOKEN = localStorage.getItem('gmad_github_token_v3');
                const REPO = 'zephirun/tv-gmad';
                const FILE_PATH = 'src/data/local_cities.json';

                if (!GITHUB_TOKEN) throw new Error("GitHub Token não configurado no Painel Admin.");

                let getFileRes;
                try {
                    // Adicionamos ?v para evitar que o cache do browser nos dê a versão antiga (raw) do getDoc
                    getFileRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?v=${Date.now()}`, {
                        headers: {
                            'Authorization': `token ${GITHUB_TOKEN}`,
                            'Accept': 'application/vnd.github.v3+json'
                        }
                    });
                } catch (netErr) {
                    console.error("[BACKEND] Erro fatal no fetch GET GitHub:", netErr);
                    throw new Error(`Erro de conexão com GitHub: ${netErr.message || 'Verifique sua internet ou CORS'}`);
                }

                if (!getFileRes.ok) {
                    const errorData = await getFileRes.json().catch(() => ({}));
                    throw new Error(`Erro GitHub (${getFileRes.status}): ${errorData.message || 'Falha ao buscar SHAs'}`);
                }

                const fileData = await getFileRes.json();

                if (!fileData || !fileData.content) {
                    console.error("[BACKEND] Resposta inesperada do GitHub (Batch):", fileData);
                    throw new Error("Não foi possível obter o conteúdo do GitHub para salvamento em lote. Tente recarregar a página.");
                }

                const cleanBase64 = fileData.content.replace(/\n/g, '').replace(/\r/g, '');
                const allData = JSON.parse(decodeURIComponent(escape(atob(cleanBase64))));

                if (!allData[collection]) allData[collection] = {};

                console.log(`[BACKEND] Mesclando ${Object.keys(docsMap).length} documentos em '${collection}'...`);
                Object.entries(docsMap).forEach(([docId, data]) => {
                    if (!allData[collection][docId]) allData[collection][docId] = {};
                    if (typeof data === 'object' && !Array.isArray(data)) {
                        allData[collection][docId] = { ...allData[collection][docId], ...data };
                    } else {
                        allData[collection][docId] = data;
                    }
                });

                let updateRes;
                try {
                    updateRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `token ${GITHUB_TOKEN}`,
                            'Content-Type': 'application/json',
                            'Accept': 'application/vnd.github.v3+json'
                        },
                        body: JSON.stringify({
                            message: `Update batch ${Object.keys(docsMap).join(', ')} via Admin Panel`,
                            content: btoa(unescape(encodeURIComponent(JSON.stringify(allData, null, 2)))),
                            sha: fileData.sha
                        })
                    });
                } catch (netErr) {
                    console.error("Erro de rede no PUT:", netErr);
                    throw new Error("Erro de conexão (PUT) com o GitHub. Verifique o Token ou Internet.");
                }

                if (!updateRes.ok) {
                    const errorData = await updateRes.json().catch(() => ({}));
                    throw new Error(`Erro no Commit (${updateRes.status}): ${errorData.message}`);
                }
                return { success: true };
            }

            if (PROVIDER === 'LOCAL') {
                const response = await fetch('/api/save-city-data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        cityKey: collection,
                        data: docsMap
                    })
                });
                if (!response.ok) throw new Error("Erro ao salvar lote localmente");
                return await response.json();
            }

            if (PROVIDER === 'SUPABASE') {
                await Promise.all(Object.entries(docsMap).map(([docId, data]) => {
                    const updateData = { collection_id: collection, [docId]: data };
                    return supabase.from('tv_collections').upsert(updateData, { onConflict: 'collection_id' });
                }));
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
