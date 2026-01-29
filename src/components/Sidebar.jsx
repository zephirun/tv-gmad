import React, { useState, useEffect, useMemo } from 'react';
import { Settings, MapPin, Wifi, Instagram } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { LOGO_URL, CITY_CONFIG, getWeatherDescription } from '../constants';

export default function Sidebar({ dateTime, weather, setIsAdminOpen, settings }) {
    const [instaIndex, setInstaIndex] = useState(0);

    const instagramProfiles = [];
    if (settings) {
        if (settings.instagramUser) instagramProfiles.push({ user: settings.instagramUser, url: settings.instagramUrl });
        if (settings.instagramUser2) instagramProfiles.push({ user: settings.instagramUser2, url: settings.instagramUrl2 });
    }
    // Fallback default
    if (instagramProfiles.length === 0) {
        instagramProfiles.push({ user: '@gmadmadville', url: 'https://instagram.com/gmadmadville' });
    }

    useEffect(() => {
        if (instagramProfiles.length <= 1) return;
        const interval = setInterval(() => {
            setInstaIndex(prev => (prev + 1) % instagramProfiles.length);
        }, 30000); // Aumentado de 10s para 30s para reduzir criação de imagens QR
        return () => clearInterval(interval);
    }, [instagramProfiles.length]);

    const currentInsta = instagramProfiles[instaIndex] || instagramProfiles[0];

    const sidebarStyle = {
        width: '22rem',
        minWidth: '22rem',
        maxWidth: '22rem',
        flexShrink: 0,
        WebkitFlexShrink: 0,
        display: 'flex',
        WebkitDisplay: 'flex',
        flexDirection: 'column',
        WebkitFlexDirection: 'column',
        background: '#ffffff',
        color: '#275D38',
        zIndex: 20,
        position: 'relative',
        height: '100%',
        overflow: 'hidden',
        fontFamily: "var(--font-primary)"
    };

    const contentStyle = {
        display: 'flex',
        WebkitDisplay: 'flex',
        flexDirection: 'column',
        WebkitFlexDirection: 'column',
        justifyContent: 'space-between',
        WebkitJustifyContent: 'space-between',
        height: '100%',
        padding: '1.5rem',
        position: 'relative',
        zIndex: 10
    };

    const clockStyle = {
        fontSize: '6.8rem',
        lineHeight: 1,
        fontWeight: 200,
        color: '#275D38',
        letterSpacing: '-0.025em',
        marginBottom: '0.5rem',
        fontFamily: "var(--font-display)"
    };

    const weatherCardStyle = {
        background: '#275D38',
        borderRadius: '24px',
        padding: '1.25rem',
        marginBottom: '1rem',
        position: 'relative',
        overflow: 'hidden'
    };

    const instagramCardStyle = {
        background: '#ffffff',
        borderRadius: '20px',
        padding: '1rem',
        marginBottom: '0.75rem',
        border: '1px solid #e5e7eb',
        position: 'relative',
        overflow: 'hidden'
    };

    const wifiCardStyle = {
        background: '#E35205',
        borderRadius: '24px',
        padding: '1.25rem',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '0.5rem'
    };

    const dateBadgeStyle = {
        display: 'inline-flex',
        WebkitDisplay: 'inline-flex',
        alignItems: 'center',
        WebkitAlignItems: 'center',
        gap: '0.5rem',
        backgroundColor: '#E35205',
        color: 'white',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        paddingTop: '0.5rem',
        paddingBottom: '0.5rem',
        borderRadius: '9999px',
        fontSize: '1rem',
        fontWeight: 500
    };

    return (
        <aside style={sidebarStyle}>
            {/* Botão Admin */}
            <button
                onClick={() => setIsAdminOpen(true)}
                style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    padding: '8px',
                    color: '#d1d5db',
                    opacity: 0,
                    transition: 'all 0.3s ease',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'poFrutiger',
                    borderRadius: '8px',
                    zIndex: 50
                }}
                onMouseEnter={(e) => { e.target.style.opacity = 1; e.target.style.color = '#275D38'; e.target.style.backgroundColor = '#f0fdf4'; }}
                onMouseLeave={(e) => { e.target.style.opacity = 0; e.target.style.backgroundColor = 'transparent'; }}
            >
                <Settings size={18} />
            </button>

            {/* Conteúdo */}
            <div style={contentStyle}>
                {/* Logo */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '0.5rem', paddingBottom: '1rem' }}>
                    <div style={{ width: '100%', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img
                            src={LOGO_URL}
                            alt="GMAD"
                            style={{ maxWidth: '180px', maxHeight: '100%', objectFit: 'contain' }}
                            onError={(e) => { e.target.style.display = 'none'; }}
                        />
                    </div>
                </div>

                {/* Relógio */}
                <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                    <div style={clockStyle}>
                        {dateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div style={dateBadgeStyle}>
                        {dateTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </div>

                {/* Card Clima */}
                <div style={weatherCardStyle}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        color: 'rgba(134, 239, 172, 0.7)',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        letterSpacing: '0.15em',
                        marginBottom: '0.75rem',
                        position: 'relative',
                        zIndex: 10
                    }}>
                        <MapPin style={{ width: '12px', height: '12px', marginRight: '8px' }} />
                        {settings?.weatherCity || CITY_CONFIG.name}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 10 }}>
                        <div>
                            <span style={{ fontSize: '3.75rem', fontWeight: 700, color: 'white', letterSpacing: '-0.025em' }}>{weather.temp}°</span>
                            <p style={{ color: '#E35205', fontWeight: 600, fontSize: '1.125rem', textTransform: 'capitalize', marginTop: '0.25rem' }}>{weather.condition}</p>
                        </div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.9)', transform: 'scale(2.5)', marginRight: '8px' }}>
                            {getWeatherDescription(weather.weatherCode || 0).icon}
                        </div>
                    </div>
                </div>

                {/* Card Instagram */}{/* Card Instagram */}
                <div style={instagramCardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{
                            padding: '6px',
                            background: 'linear-gradient(to bottom right, #8b5cf6 0%, #ec4899 50%, #E35205 100%)',
                            borderRadius: '8px',
                            marginRight: '8px'
                        }}>
                            <Instagram size={14} style={{ color: 'white' }} />
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280' }}>Siga-nos</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{
                            width: '70px',
                            height: '70px',
                            borderRadius: '8px',
                            flexShrink: 0,
                            transition: 'all 0.5s ease',
                            marginRight: '10px',
                            backgroundColor: '#ffffff', // Fundo branco para garantir contraste
                            padding: '4px', // Margem segura
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid #e5e7eb'
                        }}>
                            <QRCodeSVG
                                value={currentInsta.url}
                                size={60}
                                fgColor="#275D38"
                                bgColor="#ffffff"
                                level="M"
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
                            <p style={{ fontSize: '0.90rem', fontWeight: 800, color: '#275D38', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'all 0.5s ease' }}>{currentInsta.user}</p>
                            <p style={{ fontSize: '0.7rem', color: '#6b7280', fontWeight: 500 }}>Escaneie para seguir</p>
                        </div>
                    </div>
                </div>

                {/* Card Wi-Fi */}
                <div style={wifiCardStyle}>
                    <div style={{
                        position: 'absolute',
                        bottom: '-24px',
                        right: '-24px',
                        color: 'rgba(255, 255, 255, 0.2)',
                        transform: 'rotate(12deg)'
                    }}>
                        <Wifi size={100} strokeWidth={1.5} />
                    </div>

                    <div style={{ position: 'relative', zIndex: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.75rem' }}>
                            <Wifi style={{ width: '20px', height: '20px', marginRight: '8px' }} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>Wi-Fi</span>
                        </div>
                        <div>
                            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.625rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>Rede</p>
                            <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', lineHeight: 1.2 }}>{settings?.wifiSsid || 'GMAD Madville'}</p>
                            <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'white' }}>Visitantes</p>
                        </div>
                    </div>
                </div>
                <div style={{ position: 'absolute', bottom: '2px', right: '5px', fontSize: '9px', color: '#ccc', opacity: 0.5 }}>
                    v1.4 (Frutiger Priority)
                </div>
            </div>
        </aside>
    );
}
