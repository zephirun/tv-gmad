/**
 * Backend Service - Abstração de dados
 * Gerencia o carregamento/salvamento via GitHub (Vercel/Remote) ou API Local (Desktop)
 */
export const backend = {
    db: {
        // BUSCA HÍBRIDA (GITHUB PARA VERCEL / API LOCAL PARA DESKTOP)
        getDoc: async (collection, docId) => {
            const isRemote = window.location.hostname.includes('vercel.app') || window.location.hostname.includes('pages.dev');

            if (isRemote) {
                const REPO = 'zephirun/tv-gmad';
                const FILE_PATH = 'src/data/local_cities.json';

                // Cache buster ultra agressivo com timestamp de milissegundos e número randômico
                const cacheBuster = `t=${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                // Prioridade: LocalStorage -> Env Var (Cloudflare/Vercel)
                const GITHUB_TOKEN = localStorage.getItem('gmad_github_token_v3') ||
                    localStorage.getItem('gmad_github_token') ||
                    import.meta.env.VITE_GITHUB_TOKEN;

                // 1. TENTATIVA VIA API OFICIAL (Instantâneo com Token)
                try {
                    const headers = {
                        'Accept': 'application/vnd.github.v3+json',
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache'
                    };
                    if (GITHUB_TOKEN) headers['Authorization'] = `token ${GITHUB_TOKEN}`;

                    const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?${cacheBuster}`, {
                        headers,
                        cache: 'no-store'
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
                    } else if (res.status === 403) {
                        console.warn("[BACKEND] GitHub API Rate Limited (403).");
                    }
                } catch (e) {
                    console.warn("[BACKEND] Erro na API GitHub:", e.message);
                }

                // 2. FALLBACK 1: JSDELIVR (Bypass de cache as vezes melhor que o Raw)
                try {
                    const jsDelivrRes = await fetch(`https://cdn.jsdelivr.net/gh/${REPO}@main/${FILE_PATH}?${cacheBuster}`, {
                        cache: 'no-store',
                        headers: { 'Cache-Control': 'no-cache' }
                    });
                    if (jsDelivrRes.ok) {
                        const allData = await jsDelivrRes.json();
                        return {
                            data: (allData[collection] && allData[collection][docId]) || null,
                            source: "JSDELIVR",
                            hasToken: !!GITHUB_TOKEN
                        };
                    }
                } catch (e) {
                    console.warn("[BACKEND] Fallback JSDELIVR falhou:", e.message);
                }

                // 3. FALLBACK 2: GITHUB RAW (TTL de ~5min se o cache buster for ignorado)
                try {
                    const rawRes = await fetch(`https://raw.githubusercontent.com/${REPO}/main/${FILE_PATH}?${cacheBuster}`, {
                        cache: 'no-store',
                        headers: {
                            'Cache-Control': 'no-cache, no-store, must-revalidate',
                            'Pragma': 'no-cache'
                        }
                    });
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
                    throw new Error(`Falha total: ${e.message}`);
                }
            }

            // Fallback LOCAL (Desktop)
            try {
                const res = await fetch('/api/get-local-data', { cache: 'no-store' });
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

        // SALVAMENTO HÍBRIDO (LOCAL + GITHUB PARA VERCEL)
        setDoc: async (collection, docId, data) => {
            const isRemote = window.location.hostname.includes('vercel.app') || window.location.hostname.includes('pages.dev');
            if (isRemote) {
                console.log("[BACKEND] Salvando no GitHub...");
                const GITHUB_TOKEN = localStorage.getItem('gmad_github_token_v3') ||
                    localStorage.getItem('gmad_github_token') ||
                    import.meta.env.VITE_GITHUB_TOKEN;

                const REPO = 'zephirun/tv-gmad';
                const FILE_PATH = 'src/data/local_cities.json';

                if (!GITHUB_TOKEN) throw new Error("Token não disponível (LocalStorage ou Env Var).");

                const getFileRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${FILE_PATH}?v=${Date.now()}`, {
                    headers: { 'Authorization': `token ${GITHUB_TOKEN}` },
                    cache: 'no-store'
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
                if (!allData[collection][docId]) allData[collection][docId] = {};

                if (typeof data === 'object' && !Array.isArray(data)) {
                    allData[collection][docId] = { ...allData[collection][docId], ...data };
                } else {
                    allData[collection][docId] = data;
                }

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
                        message: `Update ${collection} ${docId}`,
                        content: base64Content,
                        sha: fileData.sha
                    })
                });

                if (!updateRes.ok) throw new Error("Erro ao salvar no GitHub.");
                return { success: true };
            }

            const response = await fetch('/api/save-city-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ collectionId: collection, docId, data })
            });
            return response.json();
        }
    },

    cloudflare: {
        purgeCache: async (zoneId, apiToken) => {
            if (!zoneId || !apiToken) return;
            try {
                const res = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ purge_everything: true })
                });
                return res.json();
            } catch (e) {
                console.error("[BACKEND] Cloudflare Purge failed:", e);
                throw e;
            }
        }
    }
};
