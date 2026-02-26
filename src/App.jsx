import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  // Identificação da Cidade via URL
  const pathSegment = window.location.pathname.replace(/^\/|\/$/g, '').toLowerCase();
  const cityKey = LOCAL_CITIES[pathSegment] ? pathSegment : 'default';
  const cityData = LOCAL_CITIES[cityKey];

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  // Usa o cityData (estático do build) como valor inicial para garantir que a TV nunca abra vazia
  const [playlist, setPlaylist] = useState(cityData?.playlist?.items || cityData?.playlist || []);
  const [newsItems, setNewsItems] = useState(cityData?.news?.items || cityData?.news || DEFAULT_NEWS);
  const [settings, setSettings] = useState(cityData?.settings || {});

  const [user, setUser] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [weather, setWeather] = useState({ temp: '--', condition: 'Carregando...', weatherCode: 0 });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  // Armazena o último timestamp conhecido para evitar loops de reload
  const lastKnownTimestampRef = useRef(null);

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

  // CARREGAMENTO DE DADOS DINÂMICOS (GitHub se estiver na Vercel)
  useEffect(() => {
    const loadAppData = async () => {
      setIsLoadingData(true);
      try {
        // Tenta buscar o dado mais fresco (especialmente útil no Admin)
        const [pDoc, nDoc, sDoc] = await Promise.all([
          backend.db.getDoc(cityKey, 'playlist'),
          backend.db.getDoc(cityKey, 'news'),
          backend.db.getDoc(cityKey, 'settings')
        ]);

        if (pDoc) setPlaylist(pDoc.items || pDoc || []);
        if (nDoc) setNewsItems(nDoc.items || nDoc || []);
        if (sDoc) {
          setSettings(sDoc || {});
          // Inicializa o timestamp se ainda não estiver definido
          if (lastKnownTimestampRef.current === null && sDoc.system_reload_timestamp) {
            lastKnownTimestampRef.current = Number(sDoc.system_reload_timestamp);
          }
        }

      } catch (err) {
        console.warn("Falha ao carregar dados dinâmicos, mantendo estáticos:", err);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadAppData();
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

  // MONITORAMENTO DE ATUALIZAÇÕES REMOTAS
  useEffect(() => {
    let failCount = 0;

    const checkUpdates = async () => {
      try {
        const sDoc = await backend.db.getDoc(cityKey, 'settings');

        if (sDoc && sDoc.system_reload_timestamp) {
          const newTimestamp = Number(sDoc.system_reload_timestamp);
          failCount = 0;

          if (lastKnownTimestampRef.current === null) {
            lastKnownTimestampRef.current = newTimestamp;
            console.log("[APP] Monitoramento iniciado com timestamp:", newTimestamp);
            return;
          }

          if (newTimestamp > lastKnownTimestampRef.current) {
            console.log(`[APP] Comando de recarga detectado! (${lastKnownTimestampRef.current} -> ${newTimestamp})`);
            lastKnownTimestampRef.current = newTimestamp; // Atualiza antes de recarregar

            const url = new URL(window.location.href);
            url.searchParams.set('reloaded', Date.now());
            window.location.replace(url.toString());
          }
        }
      } catch (err) {
        failCount++;
        console.warn(`[APP] Falha ao verificar atualizações (${failCount}):`, err.message);
      }
    };

    const interval = setInterval(checkUpdates, 60000);
    return () => clearInterval(interval);
  }, [cityKey]);

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
