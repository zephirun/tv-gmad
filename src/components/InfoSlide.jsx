import React, { useState, useEffect } from 'react';
import { MapPin, Wifi, Instagram } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { LOGO_URL, CITY_CONFIG, getWeatherDescription } from '../constants';

/**
 * InfoSlide – Slide de informações em tela cheia para o carrossel da TV.
 * Mostra: Logo + Relógio, Clima, Instagram e Wi-Fi em um grid 2×2.
 */

const Clock = () => {
    const [dateTime, setDateTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setDateTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1.5rem' }}>
            <img
                src={LOGO_URL}
                alt="GMAD"
                style={{ maxWidth: '200px', maxHeight: '70px', objectFit: 'contain' }}
                onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div style={{
                fontSize: 'clamp(4rem, 9vw, 7rem)',
                lineHeight: 1,
                fontWeight: 200,
                color: '#275D38',
                letterSpacing: '-0.03em',
                fontFamily: 'var(--font-display)',
                marginBottom: '0.75rem'
            }}>
                {dateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#E35205',
                color: 'white',
                padding: '0.6rem 1.5rem',
                borderRadius: '9999px',
                fontSize: 'clamp(0.9rem, 1.5vw, 1.2rem)',
                fontWeight: 500,
                textTransform: 'capitalize'
            }}>
                {dateTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
        </div>
    );
};

export default function InfoSlide({ weather, settings }) {
    const currentInsta = { user: '@grupogmad', url: 'https://instagram.com/grupogmad' };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#f8f9fa',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1.2fr 1fr',
            gap: '1.5rem',
            padding: '2rem',
            fontFamily: 'var(--font-primary)',
            boxSizing: 'border-box',
            overflow: 'hidden'
        }}>
            {/* Quadrante Superior Esquerdo: Logo + Relógio */}
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '32px',
                padding: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                border: '1px solid #e5e7eb',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative circle */}
                <div style={{
                    position: 'absolute', top: '-40px', left: '-40px',
                    width: '120px', height: '120px', borderRadius: '50%',
                    backgroundColor: 'rgba(39, 93, 56, 0.05)'
                }} />
                <Clock />
            </div>

            {/* Quadrante Superior Direito: Clima */}
            <div style={{
                backgroundColor: '#275D38',
                borderRadius: '32px',
                padding: '2.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 24px rgba(39, 93, 56, 0.15)'
            }}>
                {/* Decorative circle */}
                <div style={{
                    position: 'absolute', bottom: '-60px', right: '-60px',
                    width: '200px', height: '200px', borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.06)'
                }} />

                <div style={{
                    display: 'flex', alignItems: 'center',
                    color: 'rgba(134, 239, 172, 0.7)',
                    fontSize: '0.85rem', textTransform: 'uppercase',
                    fontWeight: 700, letterSpacing: '0.15em',
                    marginBottom: '1.5rem', position: 'relative', zIndex: 10
                }}>
                    <MapPin style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                    {settings?.weatherCity || CITY_CONFIG.name}
                </div>

                <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'relative', zIndex: 10
                }}>
                    <div>
                        <span style={{
                            fontSize: 'clamp(5rem, 12vw, 9rem)',
                            fontWeight: 700, color: 'white',
                            letterSpacing: '-0.03em', lineHeight: 1
                        }}>
                            {weather.temp}°
                        </span>
                        <p style={{
                            color: '#E35205', fontWeight: 600,
                            fontSize: 'clamp(1rem, 2vw, 1.5rem)',
                            textTransform: 'capitalize', marginTop: '0.5rem'
                        }}>
                            {weather.condition}
                        </p>
                    </div>
                    <div style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        transform: 'scale(4.5)',
                        marginRight: '2.5rem',
                        marginTop: '-1rem'
                    }}>
                        {getWeatherDescription(weather.weatherCode || 0).icon}
                    </div>
                </div>
            </div>

            {/* Quadrante Inferior Esquerdo: Instagram */}
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '32px',
                padding: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2rem',
                boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
                border: '1px solid #e5e7eb',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: 'clamp(100px, 12vw, 160px)',
                    height: 'clamp(100px, 12vw, 160px)',
                    borderRadius: '16px',
                    backgroundColor: '#ffffff',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #e5e7eb',
                    flexShrink: 0
                }}>
                    <QRCodeSVG
                        value={currentInsta.url}
                        size={140}
                        fgColor="#275D38"
                        bgColor="#ffffff"
                        level="M"
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', marginBottom: '0.75rem'
                    }}>
                        <div style={{
                            padding: '8px',
                            background: 'linear-gradient(to bottom right, #8b5cf6 0%, #ec4899 50%, #E35205 100%)',
                            borderRadius: '12px',
                            marginRight: '12px'
                        }}>
                            <Instagram size={20} style={{ color: 'white' }} />
                        </div>
                        <span style={{
                            fontSize: '0.85rem', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.1em',
                            color: '#6b7280'
                        }}>Siga-nos</span>
                    </div>
                    <p style={{
                        fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                        fontWeight: 800, color: '#275D38',
                        marginBottom: '0.25rem', lineHeight: 1.2
                    }}>{currentInsta.user}</p>
                    <p style={{
                        fontSize: 'clamp(0.8rem, 1.2vw, 1rem)',
                        color: '#6b7280', fontWeight: 500
                    }}>
                        Escaneie o QR Code para seguir
                    </p>
                </div>
            </div>

            {/* Quadrante Inferior Direito: Wi-Fi */}
            <div style={{
                backgroundColor: '#E35205',
                borderRadius: '32px',
                padding: '2.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 4px 24px rgba(227, 82, 5, 0.2)'
            }}>
                {/* Decorative icon */}
                <div style={{
                    position: 'absolute', bottom: '-30px', right: '-30px',
                    color: 'rgba(255, 255, 255, 0.15)',
                    transform: 'rotate(12deg)'
                }}>
                    <Wifi size={160} strokeWidth={1.5} />
                </div>

                <div style={{ position: 'relative', zIndex: 10 }}>
                    <div style={{
                        display: 'flex', alignItems: 'center',
                        color: 'rgba(255, 255, 255, 0.8)',
                        marginBottom: '1.5rem'
                    }}>
                        <Wifi style={{ width: '24px', height: '24px', marginRight: '12px' }} />
                        <span style={{
                            fontSize: '0.85rem', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.15em'
                        }}>Wi-Fi Gratuito</span>
                    </div>
                    <div>
                        <p style={{
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontSize: '0.75rem', textTransform: 'uppercase',
                            fontWeight: 700, marginBottom: '0.5rem'
                        }}>Rede</p>
                        <p style={{
                            fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                            fontWeight: 700, color: 'white', lineHeight: 1.2
                        }}>
                            {settings?.wifiSsid || 'GMAD Madville'}
                        </p>
                        <p style={{
                            fontSize: 'clamp(1.2rem, 2.5vw, 2rem)',
                            fontWeight: 700, color: 'white',
                            marginTop: '0.25rem'
                        }}>
                            Visitantes
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
