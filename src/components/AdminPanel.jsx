import React, { useState, useEffect } from 'react';
import {
    Layout, X, Save, Loader2, AlertCircle,
    CheckCircle, FileImage, FileVideo, PlayCircle, Newspaper, Trash2,
    Plus, Volume2, ArrowUp, ArrowDown, Image, Settings, Lock, MapPin, Info
} from 'lucide-react';
import { backend, PROVIDER, supabase } from '../services/backend';
import { LOGO_URL } from '../constants';

export default function AdminPanel({ collectionId = 'tv_config', playlist, setPlaylist, news, setNews, onClose, user, settings }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginUser, setLoginUser] = useState('');
    const [loginPass, setLoginPass] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [storedCredentials, setStoredCredentials] = useState({ adminUser: 'admin', adminPass: 'admin' });

    const [newItem, setNewItem] = useState({ type: 'image', src: '', title: '', subtitle: '', duration: 8000 });
    const [newNews, setNewNews] = useState('');
    const [editSettings, setEditSettings] = useState(settings || {});
    const [errorMsg, setErrorMsg] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('playlist');
    const [itemsToDelete, setItemsToDelete] = useState([]);
    const [githubToken, setGithubToken] = useState(localStorage.getItem('gmad_github_token_v3') || '');

    // Sync token to localStorage
    useEffect(() => {
        if (githubToken) localStorage.setItem('gmad_github_token_v3', githubToken);
    }, [githubToken]);

    // Force basic styles reset and fetch credentials
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const isAuth = sessionStorage.getItem('gmad_admin_auth');
        if (isAuth === 'true') setIsAuthenticated(true);

        // Fetch stored credentials from Firestore
        const fetchCredentials = async () => {
            try {
                const data = await backend.db.getDoc(collectionId, 'settings');
                if (data && data.adminUser && data.adminPass) {
                    setStoredCredentials({ adminUser: data.adminUser, adminPass: data.adminPass });
                }
            } catch (err) {
                console.error('Failed to fetch credentials', err);
            }
        };
        fetchCredentials();

        return () => {
            document.body.style.overflow = '';
        };
    }, [collectionId]);

    useEffect(() => {
        if (settings) setEditSettings(settings);
    }, [settings]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoggingIn(true);
        setLoginError('');

        try {
            // First try Supabase/Backend Auth
            await backend.auth.signInWithPassword(loginUser, loginPass);
            setIsAuthenticated(true);
            sessionStorage.setItem('gmad_admin_auth', 'true');
        } catch (authErr) {
            console.log("Backend auth failed, trying legacy Firestore check", authErr);
            // Fallback: Check stored credentials in Firestore (Legacy/Firebase)
            let creds = storedCredentials;
            try {
                const data = await backend.db.getDoc(collectionId, 'settings');
                if (data && data.adminUser && data.adminPass) {
                    creds = { adminUser: data.adminUser, adminPass: data.adminPass };
                }
            } catch (err) {
                console.error('Failed to fetch credentials', err);
            }

            if (loginUser === creds.adminUser && loginPass === creds.adminPass) {
                setIsAuthenticated(true);
                sessionStorage.setItem('gmad_admin_auth', 'true');
            } else {
                setLoginError('Usuário ou senha incorretos');
            }
        }
        setIsLoggingIn(false);
    };

    // Updated Premium Styles Design System
    const s = {
        overlay: {
            position: 'fixed', inset: 0, zIndex: 9999,
            backgroundColor: 'rgba(248, 250, 252, 0.8)',
            backdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-primary)',
            padding: '20px'
        },
        window: {
            width: '100%', height: '100%', maxWidth: '1440px', maxHeight: '900px',
            backgroundColor: '#ffffff',
            borderRadius: '24px', display: 'flex', overflow: 'hidden',
            boxShadow: '0 0 0 1px rgba(0,0,0,0.05), 0 25px 50px -12px rgba(0, 0, 0, 0.1)',
            position: 'relative'
        },
        sidebar: {
            width: '280px',
            backgroundColor: '#f1f5f9',
            borderRight: '1px solid #e2e8f0',
            display: 'flex', flexDirection: 'column', flexShrink: 0
        },
        main: {
            flex: 1, display: 'flex', flexDirection: 'column',
            backgroundColor: '#f8fafc',
            overflow: 'hidden'
        },
        header: {
            height: '80px',
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid #e2e8f0',
            padding: '0 40px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexShrink: 0,
            zIndex: 10
        },
        content: {
            flex: 1, overflowY: 'auto', padding: '40px',
            scrollBehavior: 'smooth'
        },
        navItem: (active) => ({
            width: 'calc(100% - 24px)', margin: '4px 12px', padding: '12px 16px',
            display: 'flex', alignItems: 'center', gap: '12px',
            backgroundColor: active ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
            color: active ? '#f97316' : '#64748b',
            borderRadius: '12px', border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: '700', textAlign: 'left',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            outline: 'none'
        }),
        input: {
            height: '48px', width: '100%', padding: '0 16px',
            borderRadius: '12px', border: '1px solid #e2e8f0',
            fontSize: '14px', color: '#0f172a',
            backgroundColor: '#ffffff',
            transition: 'all 0.2s ease',
            outline: 'none'
        },
        btnAction: {
            height: '48px', padding: '0 24px', borderRadius: '12px',
            border: 'none', cursor: 'pointer', fontSize: '14px',
            fontWeight: '700', display: 'flex', alignItems: 'center',
            gap: '8px', color: '#ffffff',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        },
        card: {
            backgroundColor: '#ffffff',
            padding: '24px', borderRadius: '20px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
            marginBottom: '24px'
        },
        sectionTitle: {
            fontSize: '18px', fontWeight: '700', color: '#f8fafc',
            marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px'
        }
    };

    if (!isAuthenticated) {
        return (
            <div style={s.overlay}>
                <div style={{
                    backgroundColor: '#ffffff',
                    padding: '48px',
                    borderRadius: '32px',
                    width: '440px',
                    textAlign: 'center',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '100px', height: '100px', backgroundColor: '#ffffff',
                            borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            padding: '16px'
                        }}>
                            <img src={LOGO_URL} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Logo" />
                        </div>
                    </div>

                    <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', marginBottom: '12px', letterSpacing: '-0.025em' }}>
                        Painel de Controle
                    </h2>
                    <p style={{ color: '#64748b', marginBottom: '40px', fontSize: '15px' }}>
                        Área restrita à administração. Identifique-se para continuar.
                    </p>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ textAlign: 'left' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuário</label>
                            <input
                                type="text"
                                placeholder="Seu usuário"
                                value={loginUser}
                                onChange={e => setLoginUser(e.target.value)}
                                style={s.input}
                            />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Senha</label>
                            <input
                                type="password"
                                placeholder="Sua senha secreta"
                                value={loginPass}
                                onChange={e => setLoginPass(e.target.value)}
                                style={s.input}
                            />
                        </div>

                        {loginError && (
                            <div style={{
                                color: '#ef4444',
                                fontSize: '13px',
                                fontWeight: '600',
                                padding: '12px',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: '10px',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                marginTop: '8px'
                            }}>
                                <AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                                {loginError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            style={{
                                ...s.btnAction,
                                justifyContent: 'center',
                                backgroundColor: isLoggingIn ? '#94a3b8' : '#f97316',
                                marginTop: '24px',
                                fontSize: '16px',
                                height: '56px',
                                boxShadow: '0 10px 15px -3px rgba(249, 115, 22, 0.25)'
                            }}
                        >
                            {isLoggingIn ? <Loader2 className="animate-spin" size={20} /> : 'Acessar Sistema'}
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                border: 'none',
                                background: 'none',
                                color: '#64748b',
                                marginTop: '16px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '500',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={e => e.target.style.color = '#94a3b8'}
                            onMouseLeave={e => e.target.style.color = '#64748b'}
                        >
                            Voltar para a TV
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (newItem.type === 'image' && !file.type.startsWith('image/')) {
            setErrorMsg('Selecione uma imagem válida.');
            return;
        }
        if (newItem.type === 'video' && !file.type.startsWith('video/')) {
            setErrorMsg('Selecione um vídeo válido.');
            return;
        }

        setIsUploading(true);
        setErrorMsg('');

        try {
            let downloadURL = await backend.storage.uploadFile(file, collectionId);
            // Cache Busting Seletivo: Adiciona versão apenas no upload
            // Isso garante que a TV baixe o novo arquivo, mas mantenha o cache nos loops subsequentes
            if (downloadURL && !downloadURL.includes('?v=')) {
                downloadURL += `?v=${Date.now()}`;
            }
            setNewItem(prev => ({ ...prev, src: downloadURL }));
            setIsUploading(false);
        } catch (error) {
            console.warn("Upload falhou, fallback local", error);
            if (newItem.type === 'image' && file.size < 2 * 1024 * 1024) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setNewItem(prev => ({ ...prev, src: reader.result }));
                    setIsUploading(false);
                };
                reader.readAsDataURL(file);
            } else {
                setErrorMsg("Erro no upload. Tente arquivo menor.");
                setIsUploading(false);
            }
        }
    };

    const handleAddItem = (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (newItem.type !== 'news_joinville' && (!newItem.src.trim() || !newItem.title.trim())) {
            setErrorMsg('Preencha título e mídia!');
            return;
        }

        let finalSrc = newItem.src;

        // Extração de ID do YouTube se for o caso
        if (newItem.type === 'youtube') {
            const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
            const match = newItem.src.match(ytRegex);
            if (match && match[1]) {
                finalSrc = match[1];
            } else if (newItem.src.length !== 11) {
                setErrorMsg('Link do YouTube inválido!');
                return;
            }
        }

        const item = {
            ...newItem,
            src: newItem.type === 'news_joinville' ? '' : finalSrc,
            title: newItem.type === 'news_joinville' ? 'Feed de Notícias' : newItem.title,
            id: Date.now()
        };

        setPlaylist([...playlist, item]);
        setNewItem({ type: 'image', src: '', title: '', subtitle: '', duration: 8000 });
    };

    const handleDeleteItem = (id) => {
        const item = playlist.find(i => i.id === id);
        // Track file for deletion if it belongs to Firebase or Supabase Storage
        if (item && item.src && (item.src.includes('firebasestorage') || item.src.includes('supabase.co/storage'))) {
            setItemsToDelete(prev => [...prev, item]);
        }
        setPlaylist(playlist.filter(item => item.id !== id));
    };

    const handleUpdateDuration = (id, newDuration) => {
        setPlaylist(playlist.map(item =>
            item.id === id ? { ...item, duration: newDuration * 1000 } : item
        ));
    };

    const handleMovePlaylistItem = (index, direction) => {
        const newPlaylist = [...playlist];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= newPlaylist.length) return;
        [newPlaylist[index], newPlaylist[newIndex]] = [newPlaylist[newIndex], newPlaylist[index]];
        setPlaylist(newPlaylist);
    };

    const handleImportFromMain = async () => {
        if (!window.confirm("Isso substituirá a playlist atual pela da TV Principal. Continuar?")) return;
        try {
            const data = await backend.db.getDoc('tv_config', 'playlist');
            if (data && data.items) {
                setPlaylist(data.items);
            } else {
                alert("TV Principal não tem playlist salva.");
            }
        } catch (e) { alert("Erro: " + e.message); }
    };

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            // Verifica usuário no `user` prop ou no backend.auth
            const currentUser = user || backend.auth.currentUser();

            if (currentUser) {
                // 1. Deletar arquivos marcados do Storage
                if (itemsToDelete.length > 0) {
                    await Promise.all(itemsToDelete.map(async (item) => {
                        try {
                            await backend.storage.deleteFile(item.src);
                        } catch (err) {
                            console.warn("Erro ao deletar do storage (pode já não existir):", err);
                        }
                    }));
                    setItemsToDelete([]);
                }

                // 2. Salvar tudo em um único commit (Atomic Update)
                await backend.db.setDocsBatch(collectionId, {
                    playlist: { items: playlist },
                    news: { items: news },
                    settings: editSettings
                });

                alert("Tudo sincronizado com sucesso via GitHub!");
            } else {
                localStorage.setItem('gmad_playlist', JSON.stringify(playlist));
                localStorage.setItem('gmad_news', JSON.stringify(news));
                alert("Salvo localmente!");
            }
            onClose();
        } catch (error) {
            alert("Erro: " + error.message);
        } finally {
            setIsSaving(false);
        }
    };



    // ... (unchanged code) ...

    return (
        <div style={s.overlay}>
            <div style={s.window}>
                {/* ... (sidebar unchanged) ... */}
                <div style={s.sidebar}>
                    <div style={{ padding: '40px 24px', textAlign: 'center' }}>
                        <div style={{
                            width: '80px', height: '80px', backgroundColor: '#ffffff',
                            borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px', border: '1px solid #e2e8f0',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                            padding: '12px'
                        }}>
                            <img src={LOGO_URL} style={{ width: '100%', height: '100%', objectFit: 'contain' }} alt="Logo" />
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Sistema de TV
                        </div>
                        {collectionId !== 'tv_config' && (
                            <div style={{
                                fontSize: '10px', color: '#f97316', marginTop: '6px',
                                textTransform: 'uppercase', fontWeight: '700',
                                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                                padding: '4px 8px', borderRadius: '6px', display: 'inline-block'
                            }}>
                                {collectionId.replace('tv_config_', '')}
                            </div>
                        )}
                    </div>

                    <nav style={{ padding: '0 0 20px 0', flex: 1 }}>
                        <button onClick={() => setActiveTab('playlist')} style={s.navItem(activeTab === 'playlist')}>
                            <Layout size={20} strokeWidth={activeTab === 'playlist' ? 2.5 : 2} /> Playlist
                        </button>
                        <button onClick={() => setActiveTab('news')} style={s.navItem(activeTab === 'news')}>
                            <Volume2 size={20} strokeWidth={activeTab === 'news' ? 2.5 : 2} /> Notícias
                        </button>
                        <button onClick={() => setActiveTab('settings')} style={s.navItem(activeTab === 'settings')}>
                            <Settings size={20} strokeWidth={activeTab === 'settings' ? 2.5 : 2} /> Configurações
                        </button>
                        <button onClick={() => setActiveTab('diag')} style={s.navItem(activeTab === 'diag')}>
                            <Info size={20} strokeWidth={activeTab === 'diag' ? 2.5 : 2} /> Diagnóstico
                        </button>
                    </nav>

                    <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <button
                            onClick={onClose}
                            style={{
                                ...s.navItem(false),
                                width: '100%', margin: 0,
                                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                color: '#ef4444'
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.05)'}
                        >
                            <X size={18} /> Sair do Painel
                        </button>
                    </div>
                </div>

                {/* MAIN AREA */}
                <div style={s.main}>
                    <header style={s.header}>
                        <div>
                            <h2 style={{ fontSize: '24px', fontWeight: '800', margin: 0, color: '#0f172a', letterSpacing: '-0.025em' }}>
                                {{
                                    'playlist': 'Conteúdo da Playlist',
                                    'news': 'Mural de Notícias',
                                    'settings': 'Configurações Técnicas',
                                    'diag': 'Diagnóstico do Sistema'
                                }[activeTab] || 'Painel de Controle'}
                            </h2>
                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b', fontWeight: '500' }}>
                                {{
                                    'playlist': 'Gerencie a ordem e duração dos slides da TV.',
                                    'news': 'Edite os comunicados que aparecem no rodapé.',
                                    'settings': 'Ajustes globais e acesso ao sistema.',
                                    'diag': 'Informações técnicas de conexão e banco de dados.'
                                }[activeTab]}
                            </p>
                        </div>
                        <button
                            onClick={handleSaveAll}
                            disabled={isSaving}
                            style={{
                                ...s.btnAction,
                                backgroundColor: isSaving ? '#334155' : '#f97316',
                                boxShadow: '0 10px 15px -3px rgba(249, 115, 22, 0.2)'
                            }}
                            onMouseEnter={e => !isSaving && (e.currentTarget.style.backgroundColor = '#ea580c')}
                            onMouseLeave={e => !isSaving && (e.currentTarget.style.backgroundColor = '#f97316')}
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            {isSaving ? 'Sincronizando...' : 'Publicar na TV'}
                        </button>
                    </header>

                    <div style={s.content}>
                        {activeTab === 'playlist' && (
                            <>
                                <div style={s.card}>
                                    <div style={s.sectionTitle}>
                                        <div style={{ padding: '8px', backgroundColor: 'rgba(249, 115, 22, 0.1)', color: '#f97316', borderRadius: '10px' }}>
                                            <Plus size={20} />
                                        </div>
                                        <span>Adicionar Novo Slide</span>
                                        {collectionId !== 'tv_config' && (
                                            <button
                                                type="button"
                                                onClick={handleImportFromMain}
                                                style={{
                                                    fontSize: '11px', padding: '6px 12px', marginLeft: 'auto',
                                                    backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6',
                                                    border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '8px', cursor: 'pointer',
                                                    fontWeight: '700', textTransform: 'uppercase'
                                                }}
                                            >
                                                Importar da Principal
                                            </button>
                                        )}
                                    </div>

                                    {errorMsg && (
                                        <div style={{
                                            padding: '16px', backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                            color: '#ef4444', borderRadius: '12px', marginBottom: '24px',
                                            display: 'flex', gap: '12px', alignItems: 'center',
                                            border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '14px'
                                        }}>
                                            <AlertCircle size={18} /> {errorMsg}
                                        </div>
                                    )}

                                    <form onSubmit={handleAddItem}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Tipo de Mídia</label>
                                                <select style={s.input} value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value, src: '' })}>
                                                    <option value="image">Imagem Estática</option>
                                                    <option value="video">Vídeo Local (MP4)</option>
                                                    <option value="youtube">Vídeo do YouTube</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Título do Slide</label>
                                                <input type="text" style={s.input} placeholder="Ex: Promoção de Verão" value={newItem.title} onChange={e => setNewItem({ ...newItem, title: e.target.value })} />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Duração (Segundos)</label>
                                                <input type="number" style={s.input} value={newItem.duration / 1000} onChange={e => setNewItem({ ...newItem, duration: (parseInt(e.target.value) || 0) * 1000 })} disabled={newItem.type === 'video' || newItem.type === 'youtube'} />
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '24px' }}>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Subtítulo / Descrição (Opcional)</label>
                                            <input type="text" style={s.input} placeholder="Ex: Válido até 31/12" value={newItem.subtitle} onChange={e => setNewItem({ ...newItem, subtitle: e.target.value })} />
                                        </div>

                                        <div style={{
                                            border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px',
                                            padding: newItem.type === 'youtube' ? '24px' : '40px',
                                            marginBottom: '24px', backgroundColor: 'rgba(255,255,255,0.01)',
                                            textAlign: 'center', transition: 'all 0.2s ease',
                                            cursor: newItem.type === 'youtube' ? 'default' : 'pointer'
                                        }}
                                            onMouseEnter={e => newItem.type !== 'youtube' && (e.currentTarget.style.borderColor = 'rgba(249, 115, 22, 0.3)')}
                                            onMouseLeave={e => newItem.type !== 'youtube' && (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                                        >
                                            {newItem.type === 'youtube' ? (
                                                <div style={{ textAlign: 'left' }}>
                                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Link do Vídeo (Compilado ou Shorts)</label>
                                                    <input
                                                        type="text"
                                                        style={s.input}
                                                        placeholder="Cole o link do YouTube aqui..."
                                                        value={newItem.src}
                                                        onChange={e => setNewItem({ ...newItem, src: e.target.value })}
                                                    />
                                                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>Ex: https://www.youtube.com/watch?v=... ou https://youtu.be/...</p>
                                                </div>
                                            ) : (
                                                <>
                                                    {!newItem.src && !isUploading ? (
                                                        <label style={{ cursor: 'pointer', display: 'block' }}>
                                                            <div style={{ marginBottom: '16px', color: '#f97316', display: 'flex', justifyContent: 'center' }}>
                                                                <FileImage size={48} strokeWidth={1.5} />
                                                            </div>
                                                            <div style={{ fontWeight: '600', color: '#0f172a', fontSize: '15px' }}>Clique ou arraste para enviar</div>
                                                            <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Suporta JPG, PNG e MP4</div>
                                                            <input type="file" style={{ display: 'none' }} accept={newItem.type === 'image' ? "image/*" : "video/*"} onChange={handleFileUpload} />
                                                        </label>
                                                    ) : isUploading ? (
                                                        <div>
                                                            <Loader2 className="animate-spin" size={40} style={{ margin: '0 auto 16px', color: '#f97316' }} />
                                                            <span style={{ color: '#0f172a', fontWeight: '600' }}>Processando arquivo...</span>
                                                        </div>
                                                    ) : (
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                                                            <div style={{ width: '80px', height: '50px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #f97316' }}>
                                                                {newItem.type === 'image' ? <img src={newItem.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ backgroundColor: '#020617', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FileVideo size={20} color="#f97316" /></div>}
                                                            </div>
                                                            <div style={{ textAlign: 'left' }}>
                                                                <div style={{ fontWeight: '700', color: '#f97316' }}>Upload Concluído!</div>
                                                                <button type="button" onClick={() => setNewItem({ ...newItem, src: '' })} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', padding: 0, marginTop: '4px' }}>Substituir Arquivo</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        <button type="submit" disabled={isUploading} style={{ ...s.btnAction, width: '100%', justifyContent: 'center', backgroundColor: '#334155', fontSize: '15px' }}>
                                            <Plus size={20} /> Adicionar à Playlist
                                        </button>
                                    </form>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                                            Playlist Ativa ({playlist.length})
                                        </h3>
                                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Arraste para reordenar</span>
                                    </div>

                                    {playlist.length === 0 && (
                                        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '20px' }}>
                                            Nenhum slide na playlist. Adicione seu primeiro conteúdo acima.
                                        </div>
                                    )}

                                    {playlist.map((item, idx) => (
                                        <div key={item.id} style={{
                                            display: 'flex', alignItems: 'center', gap: '20px', padding: '16px',
                                            backgroundColor: '#ffffff', borderRadius: '16px',
                                            border: '1px solid #e2e8f0',
                                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                            transition: 'transform 0.2s ease, border-color 0.2s ease'
                                        }}>

                                            {/* Reorder Buttons */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <button
                                                    disabled={idx === 0}
                                                    onClick={() => handleMovePlaylistItem(idx, 'up')}
                                                    style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.1 : 0.4, color: '#0f172a', padding: '4px' }}
                                                >
                                                    <ArrowUp size={20} />
                                                </button>
                                                <button
                                                    disabled={idx === playlist.length - 1}
                                                    onClick={() => handleMovePlaylistItem(idx, 'down')}
                                                    style={{ background: 'none', border: 'none', cursor: idx === playlist.length - 1 ? 'default' : 'pointer', opacity: idx === playlist.length - 1 ? 0.1 : 0.4, color: '#0f172a', padding: '4px' }}
                                                >
                                                    <ArrowDown size={20} />
                                                </button>
                                            </div>

                                            <div style={{
                                                width: '120px', height: '68px', backgroundColor: '#f1f5f9',
                                                borderRadius: '10px', overflow: 'hidden', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0'
                                            }}>
                                                {item.type === 'image' && <img src={item.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                                {item.type === 'video' && (
                                                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                                        <video src={item.src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                                                            <PlayCircle size={24} color="white" />
                                                        </div>
                                                    </div>
                                                )}
                                                {item.type === 'youtube' && (
                                                    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <img src={`https://img.youtube.com/vi/${item.src}/mqdefault.jpg`} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
                                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <PlayCircle size={24} color="white" />
                                                        </div>
                                                    </div>
                                                )}
                                                {item.type === 'news_joinville' && <Newspaper size={28} color="#f97316" />}
                                            </div>

                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                                    <span style={{
                                                        fontSize: '10px', color: item.type === 'video' ? '#8b5cf6' : '#f97316',
                                                        textTransform: 'uppercase', fontWeight: '800',
                                                        backgroundColor: item.type === 'video' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                                                        padding: '2px 6px', borderRadius: '4px'
                                                    }}>
                                                        {{
                                                            'video': 'Vídeo Local',
                                                            'youtube': 'YouTube',
                                                            'image': 'Imagem',
                                                            'news_joinville': 'Feed'
                                                        }[item.type] || 'Mídia'}
                                                    </span>
                                                    {item.subtitle && <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>• {item.subtitle}</span>}
                                                </div>
                                            </div>

                                            {/* Duration Edit */}
                                            {item.type !== 'video' && item.type !== 'youtube' && (
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px',
                                                    backgroundColor: 'rgba(255,255,255,0.03)', padding: '8px 12px',
                                                    borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)'
                                                }}>
                                                    <input
                                                        type="number"
                                                        value={item.duration / 1000}
                                                        onChange={(e) => handleUpdateDuration(item.id, parseInt(e.target.value) || 8)}
                                                        style={{ width: '30px', border: 'none', background: 'transparent', fontWeight: '800', textAlign: 'center', fontSize: '15px', color: '#0f172a', outline: 'none' }}
                                                    />
                                                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>seg</span>
                                                </div>
                                            )}

                                            <div key={`del-${item.id}`}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteItem(item.id);
                                                    }}
                                                    style={{
                                                        border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                                                        width: '44px', height: '44px', borderRadius: '10px', cursor: 'pointer',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)'}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {activeTab === 'news' && (
                            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                                <div style={s.card}>
                                    <div style={s.sectionTitle}>
                                        <div style={{ padding: '8px', backgroundColor: 'rgba(249, 115, 22, 0.1)', color: '#f97316', borderRadius: '10px' }}>
                                            <Newspaper size={20} />
                                        </div>
                                        <span>Adicionar Comunicado</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <input
                                            type="text"
                                            style={s.input}
                                            placeholder="Digite o texto que aparecerá no rodapé..."
                                            value={newNews}
                                            onChange={e => setNewNews(e.target.value)}
                                        />
                                        <button
                                            onClick={() => { if (newNews) { setNews([...news, newNews]); setNewNews('') } }}
                                            style={{ ...s.btnAction, backgroundColor: '#f97316' }}
                                        >
                                            Adicionar
                                        </button>
                                    </div>
                                    <p style={{ fontSize: '11px', color: '#64748b', marginTop: '12px', fontWeight: '500' }}>
                                        Dica: Mantenha as mensagens curtas para melhor leitura na TV.
                                    </p>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                                            Mensagens Ativas ({news.length})
                                        </h3>
                                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Ordem de exibição</span>
                                    </div>

                                    {news.map((n, i) => (
                                        <div key={i} style={{
                                            padding: '16px 20px', backgroundColor: '#ffffff',
                                            borderRadius: '16px', border: '1px solid #e2e8f0',
                                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                            display: 'flex', gap: '20px', alignItems: 'center'
                                        }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <button disabled={i === 0} onClick={() => {
                                                    if (i > 0) { const a = [...news];[a[i - 1], a[i]] = [a[i], a[i - 1]]; setNews(a); }
                                                }} style={{ background: 'none', border: 'none', cursor: i === 0 ? 'default' : 'pointer', opacity: i === 0 ? 0.1 : 0.4, color: '#0f172a', padding: '2px' }}>
                                                    <ArrowUp size={18} />
                                                </button>
                                                <button disabled={i === news.length - 1} onClick={() => {
                                                    if (i < news.length - 1) { const a = [...news];[a[i + 1], a[i]] = [a[i], a[i + 1]]; setNews(a); }
                                                }} style={{ background: 'none', border: 'none', cursor: i === news.length - 1 ? 'default' : 'pointer', opacity: i === news.length - 1 ? 0.1 : 0.4, color: '#0f172a', padding: '2px' }}>
                                                    <ArrowDown size={18} />
                                                </button>
                                            </div>

                                            <div style={{ fontWeight: '800', color: '#f97316', fontSize: '13px', backgroundColor: 'rgba(249, 115, 22, 0.1)', padding: '4px 8px', borderRadius: '6px' }}>
                                                #{i + 1}
                                            </div>
                                            <div style={{ flex: 1, fontSize: '15px', color: '#0f172a', fontWeight: '500' }}>{n}</div>
                                            <button
                                                onClick={() => setNews(news.filter((_, idx) => idx !== i))}
                                                style={{ border: 'none', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                    {news.length === 0 && (
                                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', border: '1px dashed rgba(255,255,255,0.05)', borderRadius: '20px' }}>
                                            Nenhuma notícia cadastrada.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                                <div style={s.card}>
                                    <div style={s.sectionTitle}>
                                        <div style={{ padding: '8px', backgroundColor: 'rgba(249, 115, 22, 0.1)', color: '#f97316', borderRadius: '10px' }}>
                                            <MapPin size={20} />
                                        </div>
                                        <span>Localização e Wi-Fi</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Cidade (Previsão do Tempo)</label>
                                            <input type="text" style={s.input} value={editSettings.weatherCity || ''} onChange={e => setEditSettings({ ...editSettings, weatherCity: e.target.value })} placeholder="Ex: Joinville" />
                                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>Usado para carregar dados climáticos automaticamente.</div>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Nome da Rede Wi-Fi</label>
                                            <input type="text" style={s.input} value={editSettings.wifiSsid || ''} onChange={e => setEditSettings({ ...editSettings, wifiSsid: e.target.value })} placeholder="Ex: GMAD Visitantes" />
                                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>Exibido no card informativo da Sidebar.</div>
                                        </div>
                                    </div>
                                </div>

                                <div style={s.card}>
                                    <div style={s.sectionTitle}>
                                        <div style={{ padding: '8px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '10px' }}>
                                            <Lock size={20} />
                                        </div>
                                        <span>Segurança do Sistema</span>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Usuário de Acesso</label>
                                            <input type="text" style={s.input} value={editSettings.adminUser || ''} onChange={e => setEditSettings({ ...editSettings, adminUser: e.target.value })} placeholder="admin" />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Nova Senha</label>
                                            <input type="password" style={s.input} value={editSettings.adminPass || ''} onChange={e => setEditSettings({ ...editSettings, adminPass: e.target.value })} placeholder="••••••••" />
                                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>Deixe em branco para manter a senha atual.</div>
                                        </div>
                                    </div>

                                    <div style={{ marginTop: '24px' }}>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>GitHub Personal Access Token (PAT)</label>
                                        <input
                                            type="password"
                                            style={s.input}
                                            value={githubToken}
                                            onChange={e => {
                                                setGithubToken(e.target.value);
                                                localStorage.setItem('gmad_github_token', e.target.value);
                                            }}
                                            placeholder="ghp_..."
                                        />
                                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                                            Necessário para salvar alterações quando estiver na Vercel.
                                            O token é salvo apenas neste navegador.
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'rgba(251, 191, 36, 0.05)', borderRadius: '12px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                            <AlertCircle size={18} color="#fbbf24" />
                                            <div style={{ fontSize: '13px', color: '#fbbf24', fontWeight: '600' }}>
                                                Atenção: A alteração de senha exige um novo login imediato após salvar.
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={s.card}>
                                    <div style={s.sectionTitle}>
                                        <div style={{ padding: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '10px' }}>
                                            <Loader2 size={20} />
                                        </div>
                                        <span>Atualização Remota</span>
                                    </div>
                                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                                        Se as TVs não estiverem atualizando o conteúdo novo, use este botão para forçar o recarregamento em todos os aparelhos conectados.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setEditSettings({ ...editSettings, system_reload_timestamp: Date.now() })}
                                        style={{
                                            ...s.btnAction,
                                            backgroundColor: '#3b82f6',
                                            width: '100%',
                                            justifyContent: 'center',
                                            boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)'
                                        }}
                                    >
                                        <Loader2 size={18} /> Forçar Atualização em Todas as TVs
                                    </button>
                                    {editSettings.system_reload_timestamp && (
                                        <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '11px', color: '#94a3b8' }}>
                                            Comando agendado para o próximo salvamento.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'diag' && (
                            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                                <div style={{ display: 'grid', gap: '20px' }}>
                                    <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Arquitetura do Sistema</div>
                                        <div style={{ fontSize: '20px', fontWeight: '800', color: '#f97316', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f97316' }}></div>
                                            Híbrida (Local + GitHub API)
                                        </div>
                                        <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px', lineHeight: '1.5' }}>
                                            As mídias pesadas (vídeos/imagens) são servidas localmente para evitar custos de tráfego.
                                            As configurações e notícias são sincronizadas via **GitHub API** para garantir que funcionem na Vercel.
                                        </p>
                                    </div>

                                    <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>Status de Sincronização</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '700',
                                                backgroundColor: githubToken ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: githubToken ? '#10b981' : '#ef4444',
                                                border: '1px solid ' + (githubToken ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)')
                                            }}>
                                                {githubToken ? 'GITHUB TOKEN CONFIGURADO' : 'TOKEN PENDENTE'}
                                            </div>
                                            <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>• Repositório: zephirun/tv-gmad</span>
                                        </div>
                                        <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px' }}>
                                            As alterações levam cerca de 2 minutos para serem compiladas pela Vercel após clicar em Publicar.
                                        </p>
                                    </div>

                                    <div style={{ padding: '24px', backgroundColor: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.05em' }}>URL - ID da Coleção</div>
                                        <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', fontFamily: 'monospace' }}>{collectionId}</div>
                                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>
                                            Path detectado: <span style={{ fontFamily: 'monospace', fontWeight: '700' }}>{window.location.pathname}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
