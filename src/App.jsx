import React, { useState, useEffect, useCallback } from 'react';
import { backend } from './services/backend';

// ... imports ...
import AdminPanel from './components/AdminPanel';
import Sidebar from './components/Sidebar';

import NewsTicker from './components/NewsTicker';
import Player from './components/Player';
import LockScreen from './components/LockScreen';
import { CITY_CONFIG, DEFAULT_PLAYLIST, DEFAULT_NEWS, getWeatherDescription, ROUTE_SECURITY } from './constants';


// ==========================================
// COMPONENTE PRINCIPAL (TV)
// ==========================================
export default function App() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [newsItems, setNewsItems] = useState(DEFAULT_NEWS);
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [weather, setWeather] = useState({ temp: '--', condition: 'Carregando...', weatherCode: 0 });

  const [currentIndex, setCurrentIndex] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [isMuted, setIsMuted] = useState(true);

  const currentItem = playlist[currentIndex] || null;

  // Estado para controlar se Firebase está disponível (mantido nome por compatibilidade, mas refere-se ao backend geral)
  const [firebaseAvailable, setFirebaseAvailable] = useState(true);

  // Security
  const [isLocked, setIsLocked] = useState(false);
  const [securityPin, setSecurityPin] = useState(null);

  useEffect(() => {
    // Check if current route requires auth
    const path = window.location.pathname.replace(/^\/|\/$/g, '');
    const pin = ROUTE_SECURITY[path];

    if (pin) {
      const isUnlocked = localStorage.getItem(`unlocked_${path}`);
      if (!isUnlocked) {
        setIsLocked(true);
        setSecurityPin(pin);
      }
    }
  }, []);

  const handleUnlock = () => {
    const path = window.location.pathname.replace(/^\/|\/$/g, '');
    localStorage.setItem(`unlocked_${path}`, 'true');
    setIsLocked(false);
  };

  useEffect(() => {
    // Fallback para backend indisponível
    const loadFallbackData = () => {
      setIsLoadingData(false);
      setFirebaseAvailable(false);
      const lp = localStorage.getItem('gmad_playlist');
      if (lp) {
        try { setPlaylist(JSON.parse(lp)); } catch { setPlaylist(DEFAULT_PLAYLIST); }
      } else {
        setPlaylist(DEFAULT_PLAYLIST);
      }
      const ln = localStorage.getItem('gmad_news');
      if (ln) {
        try { setNewsItems(JSON.parse(ln)); } catch { setNewsItems(DEFAULT_NEWS); }
      } else {
        setNewsItems(DEFAULT_NEWS);
      }
    };

    const initAuth = async () => {
      try {
        if (typeof window !== 'undefined' && window.__initial_auth_token) {
          await backend.auth.signInWithCustomToken(window.__initial_auth_token);
        } else {
          await backend.auth.signInAnonymously();
        }
      } catch (err) {
        console.error('Backend auth failed, using fallback mode:', err);
        loadFallbackData();
      }
    };

    initAuth();
    if (new URLSearchParams(window.location.search).get('admin') === 'true') setIsAdminOpen(true);

    try {
      return backend.auth.onAuthStateChanged(setUser);
    } catch (err) {
      console.error('onAuthStateChanged failed:', err);
      loadFallbackData();
    }
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      let lat = CITY_CONFIG.lat;
      let lon = CITY_CONFIG.lon;

      // 1. Tenta buscar coordenadas da cidade se configurada
      if (settings?.weatherCity) {
        try {
          const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(settings.weatherCity)}&count=1&language=pt`);
          const geoData = await geoRes.json();
          if (geoData.results && geoData.results.length > 0) {
            lat = geoData.results[0].latitude;
            lon = geoData.results[0].longitude;
          }
        } catch (e) {
          console.warn("Geocoding falhou, usando padrão", e);
        }
      }

      // 2. Busca Previsão
      try {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=America%2FSao_Paulo`);
        const d = await r.json();
        const i = getWeatherDescription(d.current.weather_code);
        setWeather({ temp: Math.round(d.current.temperature_2m), condition: i.label, weatherCode: d.current.weather_code });
      } catch (e) {
        // Fallback estático para navegadores antigos
        console.warn('Weather fetch error, using static fallback:', e);
        setWeather({ temp: 25, condition: 'Céu Limpo', weatherCode: 0 });
      }
    };

    // Tenta buscar, mas falha silenciosamente em navegadores sem fetch
    try {
      fetchWeather();
      const interval = setInterval(fetchWeather, 1800000);
      return () => clearInterval(interval);
    } catch (e) {
      setWeather({ temp: 25, condition: 'Céu Limpo', weatherCode: 0 });
    }
  }, [settings?.weatherCity]);

  // Suporte a múltiplas TVs baseado na URL (ex: /madville)
  const pathSegment = window.location.pathname.replace(/^\/|\/$/g, '').toLowerCase();
  const collectionId = pathSegment ? `tv_config_${pathSegment}` : 'tv_config';

  useEffect(() => {
    if (!user) return; // Aguarda usuário autenticado

    // Playlist Sync
    const unsubP = backend.db.subscribeToDoc(collectionId, 'playlist', async (data) => {
      if (data) {
        // Fix: Handle both seeding format (raw array) and app format ({ items: [] })
        const items = Array.isArray(data) ? data : (data.items || []);
        setPlaylist(items);
        setIsLoadingData(false);
      } else {
        // Se coleção não existe, inicializa
        if (collectionId === 'tv_config') {
          // Principal vazia -> Default
          await backend.db.setDoc(collectionId, 'playlist', { items: DEFAULT_PLAYLIST });
        } else {
          // Nova TV (ex: Madville) -> Tenta copiar da Principal
          try {
            const mainItems = await backend.db.getDoc('tv_config', 'playlist');
            const itemsToUse = (mainItems && (Array.isArray(mainItems) ? mainItems : mainItems.items)) || DEFAULT_PLAYLIST;
            await backend.db.setDoc(collectionId, 'playlist', { items: itemsToUse });
          } catch (e) {
            console.error("Erro clonando config", e);
            await backend.db.setDoc(collectionId, 'playlist', { items: DEFAULT_PLAYLIST });
          }
        }
        setIsLoadingData(false);
      }
    });

    // News Sync
    const unsubN = backend.db.subscribeToDoc(collectionId, 'news', async (data) => {
      if (data) {
        // Fix: Handle both seeding format (raw array) and app format ({ items: [] })
        const items = Array.isArray(data) ? data : (data.items || []);
        setNewsItems(items);
      } else {
        if (collectionId === 'tv_config') {
          await backend.db.setDoc(collectionId, 'news', { items: DEFAULT_NEWS });
        } else {
          try {
            const mainNews = await backend.db.getDoc('tv_config', 'news');
            const itemsToUse = (mainNews && (Array.isArray(mainNews) ? mainNews : mainNews.items)) || DEFAULT_NEWS;
            await backend.db.setDoc(collectionId, 'news', { items: itemsToUse });
          } catch (error) {
            console.error("News sync failed", error);
            await backend.db.setDoc(collectionId, 'news', { items: DEFAULT_NEWS });
          }
        }
      }
    });

    // Settings Sync
    const unsubS = backend.db.subscribeToDoc(collectionId, 'settings', async (data) => {
      if (data) {
        setSettings(data);
      } else {
        const defaults = {
          instagramUser: '@gmadmadville',
          instagramUrl: 'https://instagram.com/gmadmadville',
          instagramUser2: '@madvillesolucoes',
          instagramUrl2: 'https://instagram.com/madvillesolucoes'
        };

        if (collectionId === 'tv_config') {
          await backend.db.setDoc(collectionId, 'settings', defaults);
        } else {
          try {
            const mainSettings = await backend.db.getDoc('tv_config', 'settings');
            await backend.db.setDoc(collectionId, 'settings', mainSettings || defaults);
          } catch (error) {
            console.error("Settings sync failed", error);
            await backend.db.setDoc(collectionId, 'settings', defaults);
          }
        }
      }
    });

    return () => {
      if (unsubP) unsubP();
      if (unsubN) unsubN();
      if (unsubS) unsubS();
    };
  }, [user, collectionId]);

  // ==========================================
  // ANTI-STANDBY: Mantém a TV acordada
  // ==========================================
  useEffect(() => {
    let wakeLock = null;
    let keepAliveInterval = null;

    // Tenta usar Wake Lock API (navegadores modernos)
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
          console.log('Wake Lock ativado');

          // Re-ativar quando a página voltar ao foco
          document.addEventListener('visibilitychange', async () => {
            if (document.visibilityState === 'visible' && !wakeLock) {
              wakeLock = await navigator.wakeLock.request('screen');
            }
          });
        }
      } catch (err) {
        console.warn('Wake Lock não disponível:', err);
      }
    };

    requestWakeLock();

    // Fallback: Micro-interação a cada 30s para evitar standby em TVs antigas
    // Isso simula atividade de usuário de forma imperceptível
    keepAliveInterval = setInterval(() => {
      // Dispara evento de scroll mínimo (não visível)
      window.scrollBy(0, 0);

      // Força repaint mínimo
      const body = document.body;
      body.style.opacity = '0.9999';
      requestAnimationFrame(() => {
        body.style.opacity = '1';
      });
    }, 30000);

    return () => {
      if (wakeLock) {
        wakeLock.release();
        wakeLock = null;
      }
      clearInterval(keepAliveInterval);
    };
  }, []);

  // AGGRESSIVE RELOAD STRATEGY for Memory Leaks
  useEffect(() => {
    // Recarregar a página a cada 20 minutos (Radical)
    const RELOAD_INTERVAL = 20 * 60 * 1000;

    const reloadInterval = setInterval(() => {
      console.log("Executando recarregamento periódico de manutenção...");
      // Forçar refresh completo ignorando cache se possível
      if (window.location.search.includes('reload=true')) {
        window.location.reload(true);
      } else {
        window.location.href = window.location.href;
      }
    }, RELOAD_INTERVAL);

    return () => {
      clearInterval(reloadInterval);
    };
  }, []);
  const next = useCallback(() => setCurrentIndex((p) => (p + 1) % playlist.length), [playlist]);

  useEffect(() => {
    if (isAdminOpen || !playlist.length) return;

    if (currentItem?.type !== 'video') {
      const t = setTimeout(next, currentItem.duration || 8000);
      return () => clearTimeout(t);
    }
  }, [currentItem, next, isAdminOpen, playlist.length]);

  // Estilos inline para compatibilidade com Smart TVs
  const appContainerStyle = {
    display: 'flex',
    WebkitDisplay: 'flex',
    flexDirection: 'column',
    WebkitFlexDirection: 'column',
    height: '100vh',
    width: '100%',
    backgroundColor: '#09090b',
    color: 'white',
    overflow: 'hidden',
    position: 'relative',
    fontFamily: "var(--font-primary)"
  };

  const mainContentStyle = {
    display: 'flex',
    WebkitDisplay: 'flex',
    flex: 1,
    WebkitFlex: 1,
    height: 'calc(100vh - 70px)',
  };

  const playerContainerStyle = {
    flex: 1,
    WebkitFlex: 1,
    position: 'relative',
    background: 'linear-gradient(to bottom right, #18181b 0%, #09090b 50%, #000000 100%)',
    display: 'flex',
    WebkitDisplay: 'flex',
    alignItems: 'center',
    WebkitAlignItems: 'center',
    justifyContent: 'center',
    WebkitJustifyContent: 'center',
    overflow: 'hidden'
  };

  return (
    <div style={appContainerStyle}>
      {/* Security Lock */}
      {isLocked && <LockScreen path={window.location.pathname.replace(/^\/|\/$/g, '')} pin={securityPin} onUnlock={handleUnlock} />}

      {/* Admin Panel */}
      {isAdminOpen && <AdminPanel collectionId={collectionId} playlist={playlist} setPlaylist={setPlaylist} news={newsItems} setNews={setNewsItems} user={user} onClose={() => setIsAdminOpen(false)} settings={settings} />}

      {/* Main Content Area */}
      <div style={mainContentStyle}>

        {/* Sidebar */}
        <Sidebar weather={weather} setIsAdminOpen={setIsAdminOpen} settings={settings} />

        {/* Main Display */}
        <main style={playerContainerStyle}>
          <Player
            currentItem={currentItem}
            playlist={playlist}
            currentIndex={currentIndex}
            next={next}
            isMuted={isMuted}
          />
        </main>
      </div>

      {/* Footer Ticker */}
      <NewsTicker newsItems={newsItems} />
    </div>
  );
}
