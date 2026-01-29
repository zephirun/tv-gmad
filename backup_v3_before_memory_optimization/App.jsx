import React, { useState, useEffect, useCallback } from 'react';
import { CloudSun } from 'lucide-react';
import { auth, db, appId } from './firebase/client';
import { signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';


import AdminPanel from './components/AdminPanel';
import Sidebar from './components/Sidebar';

import NewsTicker from './components/NewsTicker';
import Player from './components/Player';
import { CITY_CONFIG, DEFAULT_PLAYLIST, DEFAULT_NEWS, getWeatherDescription } from './constants';


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

  const [weather, setWeather] = useState({ temp: '--', condition: 'Carregando...', icon: <CloudSun className="w-12 h-12 text-gray-400" /> });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [dateTime, setDateTime] = useState(new Date());
  // eslint-disable-next-line no-unused-vars
  const [isMuted, setIsMuted] = useState(true);

  const currentItem = playlist[currentIndex] || null;

  // Estado para controlar se Firebase está disponível
  const [firebaseAvailable, setFirebaseAvailable] = useState(true);

  useEffect(() => {
    // Fallback para navegadores antigos sem suporte ao Firebase
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

    if (!auth) {
      loadFallbackData();
      return;
    }

    const initAuth = async () => {
      try {
        if (typeof window !== 'undefined' && window.__initial_auth_token) {
          await signInWithCustomToken(auth, window.__initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error('Firebase auth failed, using fallback mode:', err);
        loadFallbackData();
      }
    };

    initAuth();
    if (new URLSearchParams(window.location.search).get('admin') === 'true') setIsAdminOpen(true);

    try {
      return onAuthStateChanged(auth, setUser);
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
        setWeather({ temp: Math.round(d.current.temperature_2m), condition: i.label, icon: i.icon });
      } catch (e) {
        // Fallback estático para navegadores antigos
        console.warn('Weather fetch error, using static fallback:', e);
        const fallback = getWeatherDescription(0);
        setWeather({ temp: 25, condition: fallback.label, icon: fallback.icon });
      }
    };

    // Tenta buscar, mas falha silenciosamente em navegadores sem fetch
    try {
      fetchWeather();
      const interval = setInterval(fetchWeather, 1800000);
      return () => clearInterval(interval);
    } catch (e) {
      console.warn('Weather setup failed:', e);
      const fallback = getWeatherDescription(0);
      setWeather({ temp: 25, condition: fallback.label, icon: fallback.icon });
    }
  }, [settings?.weatherCity]);

  // Suporte a múltiplas TVs baseado na URL (ex: /madville)
  const pathSegment = window.location.pathname.replace(/^\/|\/$/g, '');
  const collectionId = pathSegment ? `tv_config_${pathSegment}` : 'tv_config';

  useEffect(() => {
    if (!user || !db) return;

    // Playlist Sync
    const unsubP = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', collectionId, 'playlist'), async (s) => {
      if (s.exists()) {
        setPlaylist(s.data().items || []);
        setIsLoadingData(false);
      } else {
        // Se coleção não existe, inicializa
        if (collectionId === 'tv_config') {
          // Principal vazia -> Default
          await setDoc(s.ref, { items: DEFAULT_PLAYLIST });
        } else {
          // Nova TV (ex: Madville) -> Tenta copiar da Principal
          try {
            const mainRef = doc(db, 'artifacts', appId, 'public', 'data', 'tv_config', 'playlist');
            const mainSnap = await getDoc(mainRef);
            const itemsToUse = mainSnap.exists() ? mainSnap.data().items : DEFAULT_PLAYLIST;
            await setDoc(s.ref, { items: itemsToUse });
            // O setDoc fará o snapshot disparar novamente com os dados
          } catch (e) {
            console.error("Erro clonando config", e);
            await setDoc(s.ref, { items: DEFAULT_PLAYLIST });
          }
        }
        setIsLoadingData(false);
      }
    });

    // News Sync
    const unsubN = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', collectionId, 'news'), async (s) => {
      if (s.exists()) {
        setNewsItems(s.data().items || []);
      } else {
        if (collectionId === 'tv_config') {
          await setDoc(s.ref, { items: DEFAULT_NEWS });
        } else {
          // Tenta copiar notícias da principal
          try {
            const mainRef = doc(db, 'artifacts', appId, 'public', 'data', 'tv_config', 'news');
            const mainSnap = await getDoc(mainRef);
            const itemsToUse = mainSnap.exists() ? mainSnap.data().items : DEFAULT_NEWS;
            await setDoc(s.ref, { items: itemsToUse });
          } catch (error) {
            console.error("News sync failed", error);
            await setDoc(s.ref, { items: DEFAULT_NEWS });
          }
        }
      }
    });

    // Settings Sync
    const unsubS = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', collectionId, 'settings'), async (s) => {
      if (s.exists()) {
        setSettings(s.data());
      } else {
        const defaults = {
          instagramUser: '@gmadmadville',
          instagramUrl: 'https://instagram.com/gmadmadville',
          instagramUser2: '@madvillesolucoes',
          instagramUrl2: 'https://instagram.com/madvillesolucoes'
        };

        if (collectionId === 'tv_config') {
          await setDoc(s.ref, defaults);
        } else {
          try {
            const mainRef = doc(db, 'artifacts', appId, 'public', 'data', 'tv_config', 'settings');
            const mainSnap = await getDoc(mainRef);
            await setDoc(s.ref, mainSnap.exists() ? mainSnap.data() : defaults);
          } catch (error) {
            console.error("Settings sync failed", error);
            await setDoc(s.ref, defaults);
          }
        }
      }
    });

    return () => { unsubP(); unsubN(); unsubS(); };
  }, [user, collectionId]);

  useEffect(() => {
    const clockInterval = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
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
    fontFamily: "'Outfit', 'Inter', sans-serif"
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
      {/* Admin Panel */}
      {isAdminOpen && <AdminPanel collectionId={collectionId} playlist={playlist} setPlaylist={setPlaylist} news={newsItems} setNews={setNewsItems} user={user} onClose={() => setIsAdminOpen(false)} settings={settings} />}

      {/* Main Content Area */}
      <div style={mainContentStyle}>

        {/* Sidebar */}
        <Sidebar dateTime={dateTime} weather={weather} setIsAdminOpen={setIsAdminOpen} settings={settings} />

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
