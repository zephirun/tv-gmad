import React, { useState, useEffect, useCallback } from 'react';
import { backend } from './services/backend';

import AdminPanel from './components/AdminPanel';
import Sidebar from './components/Sidebar';

import NewsTicker from './components/NewsTicker';
import Player from './components/Player';
import LockScreen from './components/LockScreen';
import MaintenanceScreen from './components/MaintenanceScreen';
import { CITY_CONFIG, DEFAULT_PLAYLIST, DEFAULT_NEWS, getWeatherDescription, ROUTE_SECURITY } from './constants.jsx';
import { LOCAL_CITIES } from './data/local_cities';


// ==========================================
// COMPONENTE PRINCIPAL (TV)
// ==========================================
export default function App() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  const [newsItems, setNewsItems] = useState(DEFAULT_NEWS);
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [weather, setWeather] = useState({ temp: '--', condition: 'Carregando...', weatherCode: 0 });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  // Security
  const [isLocked, setIsLocked] = useState(false);
  const [securityPin, setSecurityPin] = useState(null);

  // Identificação da Cidade via URL
  const pathSegment = window.location.pathname.replace(/^\/|\/$/g, '').toLowerCase();
  const cityKey = LOCAL_CITIES[pathSegment] ? pathSegment : 'default';
  const cityData = LOCAL_CITIES[cityKey];

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

  // CARREGAMENTO DE DADOS LOCAIS (Substitui Supabase)
  useEffect(() => {
    if (cityData) {
      // Ajuste para suportar tanto array direto quanto objeto com { items: [...] }
      const p = cityData.playlist?.items || cityData.playlist || [];
      const n = cityData.news?.items || cityData.news || [];

      setPlaylist(p);
      setNewsItems(n);
      setSettings(cityData.settings || {});
      setIsLoadingData(false);
    }
  }, [cityKey, cityData]);

  useEffect(() => {
    const fetchWeather = async () => {
      let lat = CITY_CONFIG.lat;
      let lon = CITY_CONFIG.lon;

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

      try {
        const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=America%2FSao_Paulo`);
        const d = await r.json();
        const i = getWeatherDescription(d.current.weather_code);
        setWeather({ temp: Math.round(d.current.temperature_2m), condition: i.label, weatherCode: d.current.weather_code });
      } catch (e) {
        console.warn('Weather fetch error, using static fallback:', e);
        setWeather({ temp: 25, condition: 'Céu Limpo', weatherCode: 0 });
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 1800000);
    return () => clearInterval(interval);
  }, [settings?.weatherCity]);

  const next = useCallback(() => {
    if (playlist.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % playlist.length);
  }, [playlist.length]);

  const appContainerStyle = {
    height: '100vh', width: '100vw', backgroundColor: '#000', color: '#fff',
    display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative'
  };

  const mainContentStyle = { flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' };

  const playerContainerStyle = {
    flex: 1, position: 'relative', backgroundColor: '#000',
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
  };

  const isMaintenanceMode = false;
  const displayItem = playlist[currentIndex] || null;

  return (
    <div style={appContainerStyle}>
      {isLocked && <LockScreen path={window.location.pathname.replace(/^\/|\/$/g, '')} pin={securityPin} onUnlock={handleUnlock} />}

      {isAdminOpen && (
        <AdminPanel
          collectionId={cityKey}
          playlist={playlist}
          setPlaylist={setPlaylist}
          news={newsItems}
          setNews={setNewsItems}
          onClose={() => setIsAdminOpen(false)}
          settings={settings}
        />
      )}

      <div style={mainContentStyle}>
        <Sidebar weather={weather} setIsAdminOpen={setIsAdminOpen} settings={settings} />

        <main style={playerContainerStyle}>
          {isMaintenanceMode ? (
            <MaintenanceScreen />
          ) : (
            <Player
              currentItem={displayItem}
              playlist={playlist}
              currentIndex={currentIndex}
              next={next}
              isMuted={isMuted}
            />
          )}
        </main>
      </div>

      <NewsTicker newsItems={newsItems} />
    </div>
  );
}
