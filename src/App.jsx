import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { backend } from './services/backend';

import AdminPanel from './components/AdminPanel';

import NewsTicker from './components/NewsTicker';
import Player from './components/Player';
import LockScreen from './components/LockScreen';
import MaintenanceScreen from './components/MaintenanceScreen';
import { CITY_CONFIG, DEFAULT_PLAYLIST, DEFAULT_NEWS, getWeatherDescription, ROUTE_SECURITY } from './constants.jsx';
import { LOCAL_CITIES } from './data/local_cities';


// ==========================================
// COMPONENTE PRINCIPAL (TV)
// ==========================================

const INFO_SLIDE_ITEM = { id: '__info_slide__', type: 'info', duration: 30000 };

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

  // Debug Diagnostics
  const [showDebug, setShowDebug] = useState(false);
  const [debugLog, setDebugLog] = useState([]);
  const [lastSource, setLastSource] = useState('N/A');
  const [hasToken, setHasToken] = useState(false);

  const addLog = (msg) => {
    const time = new Date().toLocaleTimeString();
    const logEntry = `[${time}] ${msg}`;
    console.log(logEntry);
    setDebugLog(prev => [logEntry, ...prev].slice(0, 30));
  };

  // Armazena o último timestamp conhecido para evitar loops de reload
  const lastKnownTimestampRef = useRef(null);

  // Security
  const [isLocked, setIsLocked] = useState(false);
  const [securityPin, setSecurityPin] = useState(null);

  useEffect(() => {
    // Escuta tecla 'd' para abrir debug
    const handleKey = (e) => {
      if (e.key === 'd' || e.key === 'D') setShowDebug(prev => !prev);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

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

  // Enriched playlist: insere InfoSlide a cada 5 itens
  const enrichedPlaylist = useMemo(() => {
    if (!playlist || playlist.length === 0) return [INFO_SLIDE_ITEM];
    const result = [];
    for (let i = 0; i < playlist.length; i++) {
      result.push(playlist[i]);
      // Insere o InfoSlide a cada 2 itens
      if ((i + 1) % 2 === 0) {
        result.push(INFO_SLIDE_ITEM);
      }
    }
    // Se a playlist não terminou com um InfoSlide, adicionar ao final
    if (result[result.length - 1].id !== '__info_slide__') {
      result.push(INFO_SLIDE_ITEM);
    }
    return result;
  }, [playlist]);

  // CARREGAMENTO DE DADOS DINÂMICOS (GitHub se estiver na Vercel)
  useEffect(() => {
    const loadAppData = async () => {
      setIsLoadingData(true);
      addLog(`[APP] Carregando: ${cityKey}`);
      try {
        const [pRes, nRes, sRes] = await Promise.all([
          backend.db.getDoc(cityKey, 'playlist'),
          backend.db.getDoc(cityKey, 'news'),
          backend.db.getDoc(cityKey, 'settings')
        ]);

        if (pRes?.data) {
          setPlaylist(pRes.data.items || pRes.data || []);
          addLog(`[APP] Playlist: ${pRes.source}`);
        }
        if (nRes?.data) {
          setNewsItems(nRes.data.items || nRes.data || []);
          addLog(`[APP] Notícias: ${nRes.source}`);
        }
        if (sRes?.data) {
          const sDoc = sRes.data;
          setSettings(sDoc || {});
          setLastSource(sRes.source);
          setHasToken(sRes.hasToken);
          addLog(`[APP] Settings: ${sRes.source} (TS: ${sDoc.system_reload_timestamp})`);

          if (lastKnownTimestampRef.current === null && sDoc.system_reload_timestamp) {
            lastKnownTimestampRef.current = Number(sDoc.system_reload_timestamp);
          }
        }

      } catch (err) {
        addLog(`[ERR] Load failed: ${err.message}`);
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

  // Redirecionamento automático se configurado em settings.redirectUrl
  useEffect(() => {
    if (settings?.redirectUrl) {
      const searchParams = new URLSearchParams(window.location.search);
      const noRedirect = searchParams.get('noredirect') === 'true' ||
                         searchParams.get('edit') === 'true' ||
                         searchParams.get('admin') === 'true';
      if (!noRedirect) {
        addLog(`[APP] Redirecionando para: ${settings.redirectUrl}`);
        window.location.replace(settings.redirectUrl);
      }
    }
  }, [settings?.redirectUrl]);

  // MONITORAMENTO DE ATUALIZAÇÕES REMOTAS (MAIS AGRESSIVO: 20s)
  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const res = await backend.db.getDoc(cityKey, 'settings');

        if (res?.data && res.data.system_reload_timestamp) {
          const sDoc = res.data;
          const newTimestamp = Number(sDoc.system_reload_timestamp);
          setLastSource(res.source);
          setHasToken(res.hasToken);

          if (lastKnownTimestampRef.current === null) {
            lastKnownTimestampRef.current = newTimestamp;
            addLog(`[CHECK] Monitor ativo (${newTimestamp}) em ${window.location.hostname} via ${res.source}`);
            return;
          }

          if (newTimestamp !== lastKnownTimestampRef.current) {
            addLog(`[TRIGGER] Mudança detectada: ${newTimestamp}`);
            lastKnownTimestampRef.current = newTimestamp;

            setTimeout(() => {
              // Força o Cloudflare a servir o index.html novo
              const origin = window.location.protocol + "//" + window.location.host;
              const newUrl = origin + window.location.pathname +
                '?v=' + newTimestamp + '&t=' + Date.now();

              addLog(`[RELOAD] Redirecionando: ${newUrl}`);
              window.location.replace(newUrl);

              // Fallbacks agressivos
              setTimeout(() => { window.location.href = newUrl; }, 1000);
              setTimeout(() => { window.location.reload(true); }, 3000);
            }, 1000);
          } else {
            // Add periodic log only every 3 checks to avoid spamming
            if (Math.random() < 0.3) addLog(`[CHECK] Sem mudanças (${newTimestamp}) via ${res.source}`);
          }
        }
      } catch (err) {
        addLog(`[FAIL] Verificação: ${err.message}`);
      }
    };

    const interval = setInterval(checkUpdates, 20000); // 20 segundos
    setTimeout(checkUpdates, 2000);
    return () => clearInterval(interval);
  }, [cityKey]);

  const next = useCallback(() => {
    if (enrichedPlaylist.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % enrichedPlaylist.length);
  }, [enrichedPlaylist.length]);

  const appContainerStyle = {
    height: '100vh', width: '100vw', backgroundColor: '#000', color: '#fff',
    display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative'
  };

  const playerContainerStyle = {
    flex: 1, position: 'relative', backgroundColor: '#000',
    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
  };

  const isMaintenanceMode = false;
  const displayItem = enrichedPlaylist[currentIndex] || null;

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

      {showDebug && (
        <div style={{
          position: 'absolute', top: 50, right: 10, width: 350, maxHeight: '80vh',
          backgroundColor: 'rgba(0,0,0,0.95)', border: '1px solid #0f0', padding: 10,
          fontSize: 10, zIndex: 9999, overflowY: 'auto', pointerEvents: 'none',
          fontFamily: 'monospace', color: '#0f0', borderRadius: 5, boxShadow: '0 0 10px #0f0'
        }}>
          <h4 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #0f0', color: '#fff' }}>TV STATUS DIAGNOSTICS</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 10 }}>
            <div>City: <span style={{ color: '#fff' }}>{cityKey}</span></div>
            <div>Token: <span style={{ color: hasToken ? '#0f0' : '#f00' }}>{hasToken ? 'VALID' : 'MISSING'}</span></div>
            <div>Source: <span style={{ color: '#fff' }}>{lastSource}</span></div>
            <div>Interval: <span style={{ color: '#fff' }}>20s</span></div>
            <div>Items: <span style={{ color: '#fff' }}>{enrichedPlaylist.length}</span></div>
            <div>Index: <span style={{ color: '#fff' }}>{currentIndex}</span></div>
          </div>
          <div style={{ fontWeight: 'bold', borderBottom: '1px solid #333', marginBottom: 5 }}>ACTIVITY LOG:</div>
          {debugLog.map((log, i) => <div key={i} style={{ marginBottom: 2, borderLeft: '2px solid #222', paddingLeft: 5 }}>{log}</div>)}
          <div style={{ marginTop: 10, color: '#888', fontStyle: 'italic' }}>TS: {lastKnownTimestampRef.current} | v{Date.now()}</div>
        </div>
      )}

      {/* Botão Admin invisível no canto superior esquerdo */}
      <button
        onClick={() => setIsAdminOpen(true)}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '60px', height: '60px',
          background: 'transparent', border: 'none',
          cursor: 'pointer', zIndex: 100, opacity: 0
        }}
      />

      <main style={playerContainerStyle}>
        {isMaintenanceMode ? (
          <MaintenanceScreen />
        ) : (
          <Player
            currentItem={displayItem}
            playlist={enrichedPlaylist}
            currentIndex={currentIndex}
            next={next}
            isMuted={isMuted}
            weather={weather}
            settings={settings}
          />
        )}
      </main>

      <NewsTicker newsItems={newsItems} />
    </div>
  );
}
