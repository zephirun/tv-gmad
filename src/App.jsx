import React, { useState, useEffect, useCallback } from 'react';
import { CloudSun } from 'lucide-react';
import { auth, db, appId } from './firebase/client';
import { signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';


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
  // eslint-disable-next-line no-unused-vars
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [weather, setWeather] = useState({ temp: '--', condition: 'Carregando...', icon: <CloudSun className="w-12 h-12 text-gray-400" /> });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [dateTime, setDateTime] = useState(new Date());
  // eslint-disable-next-line no-unused-vars
  const [isMuted, setIsMuted] = useState(true);

  const currentItem = playlist[currentIndex] || null;

  useEffect(() => {
    if (!auth) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoadingData(false);
      const lp = localStorage.getItem('gmad_playlist');
      if (lp) setPlaylist(JSON.parse(lp)); else setPlaylist(DEFAULT_PLAYLIST);
      return;
    }
    const initAuth = async () => {
      // Access global variables via window to satisfy linter
      if (typeof window !== 'undefined' && window.__initial_auth_token) {
        await signInWithCustomToken(auth, window.__initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    if (new URLSearchParams(window.location.search).get('admin') === 'true') setIsAdminOpen(true);
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {


    const fetchWeather = async () => {
      try {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${CITY_CONFIG.lat}&longitude=${CITY_CONFIG.lon}&current=temperature_2m,weather_code&timezone=America%2FSao_Paulo`);
        const d = await r.json();
        const i = getWeatherDescription(d.current.weather_code);
        setWeather({ temp: Math.round(d.current.temperature_2m), condition: i.label, icon: i.icon });
      } catch (e) {
        // Silently fail for weather errors
        console.debug('Weather fetch error:', e);
      }
    };
    fetchWeather(); setInterval(fetchWeather, 1800000);
  }, []);

  useEffect(() => {
    if (!user || !db) return;
    const unsubP = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'tv_config', 'playlist'), (s) => {
      if (s.exists()) setPlaylist(s.data().items || []); else { setDoc(s.ref, { items: DEFAULT_PLAYLIST }); setPlaylist(DEFAULT_PLAYLIST); }
      setIsLoadingData(false);
    });
    const unsubN = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'tv_config', 'news'), (s) => {
      if (s.exists()) setNewsItems(s.data().items || []); else setDoc(s.ref, { items: DEFAULT_NEWS });
    });
    return () => { unsubP(); unsubN(); };
  }, [user]);

  useEffect(() => { setInterval(() => setDateTime(new Date()), 1000); }, []);
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
    height: 'calc(100vh - 60px)',
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
      {isAdminOpen && <AdminPanel playlist={playlist} setPlaylist={setPlaylist} news={newsItems} setNews={setNewsItems} user={user} onClose={() => setIsAdminOpen(false)} />}

      {/* Main Content Area */}
      <div style={mainContentStyle}>

        {/* Sidebar */}
        <Sidebar dateTime={dateTime} weather={weather} setIsAdminOpen={setIsAdminOpen} />

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
