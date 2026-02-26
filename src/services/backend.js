/**
 * Backend Service - Abstração de dados
 * Gerencia o carregamento/salvamento via GitHub (Vercel/Remote) ou API Local (Desktop)
 */
export const backend = {
    // MOCK AUTH PARA EVITAR ERROS NO ADMIN (SUPABASE DESATIVADO)
    auth: {
        currentUser: () => ({ id: 'admin', email: 'admin@gmad.com' }),
        signInWithPassword: async () => {
            console.log("[BACKEND] Login via mock auth");
            return { data: { user: { id: 'admin' } }, error: null };
        }
    },

    // MOCK STORAGE PARA EVITAR ERROS NO ADMIN
    storage: {
        uploadFile: async () => { throw new Error("Upload desativado (Supabase desativado)."); },
        deleteFile: async () => { console.warn("Delete ignorado (Supabase desativado)."); }
    },

    db: {
        // BUSCA HÍBRIDA (GITHUB PARA VERCEL / API LOCAL PARA DESKTOP)
        getDoc: async (collection, docId) => {
            const isRemote = window.location.hostname !== 'localhost' &&
                window.location.hostname !== '127.0.0.1' &&
                !window.location.hostname.startsWith('192.168.');

            if (isRemote) {
                const REPO = 'zephirun/tv-gmad';
                const FILE_PATH = 'src/data/local_cities.json';
                const GITHUB_TOKEN = localStorage.getItem('gmad_github_token_v3') ||
                    localStorage.getItem('gmad_github_token') ||
                    import.meta.env.VITE_GITHUB_TOKEN;

                // Lista de fontes em ordem de prioridade
                const sources = [
                    { name: 'SAME_ORIGIN', url: `/data/local_cities.json?cb=${Date.now()}` },
                    { name: 'GITHUB_API', url: `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?cb=${Date.now()}`, needsDecode: true },
                    { name: 'GITHUB_RAW', url: `https://raw.githubusercontent.com/${REPO}/main/${FILE_PATH}?cb=${Date.now()}` }
                ];

                for (const src of sources) {
                    try {
                        const headers = {};
                        if (src.needsDecode && GITHUB_TOKEN) headers['Authorization'] = `token ${GITHUB_TOKEN}`;

                        const res = await fetch(src.url, { headers });
                        if (res.ok) {
                            const rawData = await res.json();
                            let parsed = rawData;

                            if (src.needsDecode && rawData.content) {
                                const bin = atob(rawData.content.replace(/\s/g, ''));
                                try {
                                    parsed = JSON.parse(decodeURIComponent(escape(bin)));
                                } catch (e) {
                                    parsed = JSON.parse(bin);
                                }
                            }

                            return {
                                data: (parsed[collection] && parsed[collection][docId]) || null,
                                source: src.name,
                                hasToken: !!GITHUB_TOKEN
                            };
                        }
                    } catch (e) {
                        console.warn(`[BACKEND] Fonte ${src.name} falhou:`, e.message);
                    }
                }

                throw new Error("Nenhuma fonte de dados respondeu.");
            }

            // Fallback LOCAL (Desktop)
            try {
                const res = await fetch(`/api/get-local-data?v=${Date.now()}`);
                const allData = await res.json();
                return {
                    data: (allData[collection] && allData[collection][docId]) || null,
                    source: "LOCAL_API"
                };
            } catch (e) {
                console.error("Local getDoc failed:", e);
                return null;
            }
        },

        // SALVAMENTO HÍBRIDO
        setDoc: async (collection, docId, data) => {
            return backend.db.setDocsBatch(collection, { [docId]: data });
        },

        // SALVAMENTO MÚLTIPLO ATÔMICO (GITHUB)
        setDocsBatch: async (collection, docsMap) => {
            const isRemote = window.location.hostname !== 'localhost' &&
                window.location.hostname !== '127.0.0.1' &&
                !window.location.hostname.startsWith('192.168.');

            // Injeta o sinal de recarga automaticamente se estivermos salvando settings ou se for um save geral
            const now = Date.now();
            if (docsMap.settings) {
                docsMap.settings.system_reload_timestamp = now;
            } else {
                docsMap.settings = { system_reload_timestamp: now };
            }

            if (isRemote) {
                const GITHUB_TOKEN = localStorage.getItem('gmad_github_token_v3') ||
                    localStorage.getItem('gmad_github_token') ||
                    import.meta.env.VITE_GITHUB_TOKEN;

                const REPO = 'zephirun/tv-gmad';
                const FILE_PATH = 'src/data/local_cities.json';
                const PUBLIC_PATH = 'public/data/local_cities.json';

                if (!GITHUB_TOKEN) throw new Error("Token não disponível.");

                const getFileRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?v=${Date.now()}`, {
                    headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
                });

                if (!getFileRes.ok) {
                    const errorData = await getFileRes.json().catch(() => ({}));
                    throw new Error(`GitHub Error: ${errorData.message}`);
                }

                const fileData = await getFileRes.json();
                const cleanBase64 = fileData.content.replace(/\n/g, '').replace(/\r/g, '');
                const binString = atob(cleanBase64);
                const bytes = new Uint8Array(binString.length);
                for (let i = 0; i < binString.length; i++) bytes[i] = binString.charCodeAt(i);
                const currentContent = new TextDecoder().decode(bytes);
                const allData = JSON.parse(currentContent);

                if (!allData[collection]) allData[collection] = {};

                // Aplica todas as mudanças do batch
                Object.entries(docsMap).forEach(([docId, data]) => {
                    if (!allData[collection][docId]) allData[collection][docId] = {};

                    if (typeof data === 'object' && !Array.isArray(data)) {
                        allData[collection][docId] = { ...allData[collection][docId], ...data };
                    } else {
                        allData[collection][docId] = data;
                    }
                });

                const jsonString = JSON.stringify(allData, null, 2);
                const utf8Bytes = new TextEncoder().encode(jsonString);
                const base64Content = btoa(String.fromCharCode(...utf8Bytes));

                const updateRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `token ${GITHUB_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        message: `Batch update ${collection} (Auto-reload triggered)`,
                        content: base64Content,
                        sha: fileData.sha
                    })
                });

                // Tenta atualizar também o arquivo no public/ (se ele já existir no repo)
                try {
                    const getPublicRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${PUBLIC_PATH}?v=${Date.now()}`, {
                        headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
                    });
                    if (getPublicRes.ok) {
                        const publicData = await getPublicRes.json();
                        await fetch(`https://api.github.com/repos/${REPO}/contents/${PUBLIC_PATH}`, {
                            method: 'PUT',
                            headers: {
                                'Authorization': `token ${GITHUB_TOKEN}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                message: `Sync public batch update ${collection}`,
                                content: base64Content,
                                sha: publicData.sha
                            })
                        });
                    }
                } catch (e) { console.warn("Failed to sync public path", e); }

                if (!updateRes.ok) throw new Error("Erro ao salvar no GitHub.");
                return { success: true, timestamp: now };
            }

            const response = await fetch('/api/save-city-data-batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collectionId: collection, docsMap })
            });
            return response.json();
        }
    }
};
