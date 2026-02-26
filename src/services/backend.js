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
            const isRemote = window.location.hostname.includes('vercel.app') || window.location.hostname.includes('pages.dev');

            if (isRemote) {
                const REPO = 'zephirun/tv-gmad';
                const FILE_PATH = 'src/data/local_cities.json';

                // Cache buster ultra agressivo
                const cacheBuster = `cb=${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

                // Prioridade: LocalStorage -> Env Var (Cloudflare/Vercel)
                const GITHUB_TOKEN = localStorage.getItem('gmad_github_token_v3') ||
                    localStorage.getItem('gmad_github_token') ||
                    import.meta.env.VITE_GITHUB_TOKEN;

                // 1. TENTATIVA VIA API OFICIAL
                try {
                    const headers = {
                        'Accept': 'application/vnd.github.v3+json'
                    };
                    if (GITHUB_TOKEN) headers['Authorization'] = `token ${GITHUB_TOKEN}`;

                    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?${cacheBuster}`, {
                        headers
                    });

                    if (res.ok) {
                        const fileData = await res.json();
                        if (fileData.content) {
                            const cleanBase64 = fileData.content.replace(/\n/g, '').replace(/\r/g, '');
                            const binString = atob(cleanBase64);
                            const bytes = new Uint8Array(binString.length);
                            for (let i = 0; i < binString.length; i++) bytes[i] = binString.charCodeAt(i);
                            const decoded = new TextDecoder().decode(bytes);

                            const allData = JSON.parse(decoded);
                            const sourcePrefix = GITHUB_TOKEN ? "API_AUTH" : "API_ANON";
                            return {
                                data: (allData[collection] && allData[collection][docId]) || null,
                                source: sourcePrefix,
                                hasToken: !!GITHUB_TOKEN
                            };
                        }
                    } else {
                        console.warn(`[BACKEND] API GitHub falhou: ${res.status}`);
                    }
                } catch (e) {
                    console.warn("[BACKEND] Erro na API GitHub:", e.name, e.message);
                }

                // 2. FALLBACK 1: JSDELIVR
                try {
                    const jsDelivrRes = await fetch(`https://cdn.jsdelivr.net/gh/${REPO}@main/${FILE_PATH}?${cacheBuster}`);
                    if (jsDelivrRes.ok) {
                        const allData = await jsDelivrRes.json();
                        return {
                            data: (allData[collection] && allData[collection][docId]) || null,
                            source: "JSDELIVR",
                            hasToken: !!GITHUB_TOKEN
                        };
                    }
                } catch (e) {
                    console.warn("[BACKEND] Fallback JSDELIVR falhou:", e.name, e.message);
                }

                // 3. FALLBACK 2: GITHUB RAW
                try {
                    const rawRes = await fetch(`https://raw.githubusercontent.com/${REPO}/main/${FILE_PATH}?${cacheBuster}`);
                    if (rawRes.ok) {
                        const allData = await rawRes.json();
                        return {
                            data: (allData[collection] && allData[collection][docId]) || null,
                            source: "GITHUB_RAW",
                            hasToken: !!GITHUB_TOKEN
                        };
                    } else {
                        throw new Error(`Status ${rawRes.status}`);
                    }
                } catch (e) {
                    throw new Error(`Falha total fetch: ${e.name} ${e.message}`);
                }
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
            const isRemote = window.location.hostname.includes('vercel.app') || window.location.hostname.includes('pages.dev');

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
