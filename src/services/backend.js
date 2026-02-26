import { supabase } from '../supabase/client';

const PROVIDER = 'LOCAL'; // Pode ser 'SUPABASE' ou 'LOCAL'

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
                const cacheBuster = `t=${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

                // 1. TENTATIVA VIA API OFICIAL (Com Token se disponível)
                try {
                    const GITHUB_TOKEN = localStorage.getItem('gmad_github_token_v3') || localStorage.getItem('gmad_github_token');
                    const headers = {
                        'Accept': 'application/vnd.github.v3+json',
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
                            // Decodificando Base64 para UTF-8 de forma robusta
                            const binString = atob(cleanBase64);
                            const bytes = new Uint8Array(binString.length);
                            for (let i = 0; i < binString.length; i++) bytes[i] = binString.charCodeAt(i);
                            const decoded = new TextDecoder().decode(bytes);

                            const allData = JSON.parse(decoded);
                            console.log(`[BACKEND] getDoc('${collection}', '${docId}') -> Sucesso via API GitHub`);
                            return (allData[collection] && allData[collection][docId]) || null;
                        }
                    } else {
                        console.warn(`[BACKEND] API GitHub falhou (Status ${res.status}). Tentando fallback RAW...`);
                    }
                } catch (e) {
                    console.warn("[BACKEND] Erro na API GitHub, tentando modo RAW:", e.message);
                }

                // 2. FALLBACK VIA GITHUB RAW (Atenção: Cache do Cloudflare/GitHub pode demorar ~5min)
                try {
                    const rawRes = await fetch(`https://raw.githubusercontent.com/${REPO}/main/${FILE_PATH}?${cacheBuster}`, {
                        cache: 'no-store'
                    });
                    if (rawRes.ok) {
                        const allData = await rawRes.json();
                        console.log(`[BACKEND] getDoc('${collection}', '${docId}') -> Dados via RAW carregados.`);
                        return (allData[collection] && allData[collection][docId]) || null;
                    } else {
                        throw new Error(`Status ${rawRes.status}`);
                    }
                } catch (e) {
                    throw new Error(`Falha total no carregamento remoto (API e RAW): ${e.message}`);
                }
            }

            if (PROVIDER === 'LOCAL') {
                try {
                    const res = await fetch('/api/get-local-data', { cache: 'no-store' });
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
                    headers: { 'Authorization': `token ${GITHUB_TOKEN}` },
                    cache: 'no-store'
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

                // Decodificar conteúdo (Base64 -> UTF-8 -> JSON)
                const cleanBase64 = fileData.content.replace(/\n/g, '').replace(/\r/g, '');
                const binString = atob(cleanBase64);
                const bytes = new Uint8Array(binString.length);
                for (let i = 0; i < binString.length; i++) bytes[i] = binString.charCodeAt(i);
                const currentContent = new TextDecoder().decode(bytes);
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
                        message: `Update ${collection} ${docId} via Admin Panel`,
                        content: base64Content,
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
                    body: JSON.stringify({ collectionId: collection, docId, data })
                });
                return response.json();
            }

            if (PROVIDER === 'SUPABASE' && supabase) {
                const { error } = await supabase
                    .from('tv_collections')
                    .upsert({ collection_id: collection, [docId]: data });
                if (error) throw error;
                return { success: true };
            }
        }
    },

    cloudflare: {
        purgeCache: async (zoneId, apiToken) => {
            if (!zoneId || !apiToken) {
                console.warn("[BACKEND] Credenciais do Cloudflare ausentes, pulando purge.");
                return;
            }
            try {
                // Cloudflare exige chamada via proxy ou direto se permitido cors
                // Aqui tentamos direto (Worker costuma bloquear, mas Pages permite as vezes)
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
