import React, { useState, useEffect } from 'react';
import { MapPin, Wifi, Instagram } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { LOGO_URL, CITY_CONFIG, getWeatherDescription } from '../constants';

/**
 * InfoSlide – Slide de informações em tela cheia (grid 2×2).
 * Mostra: Relógio, Clima, Instagram e Wi-Fi.
 */

const Clock = () => {
    const [dateTime, setDateTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setDateTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <>
            <img
                src={LOGO_URL}
                alt="GMAD"
                style={{
                    maxWidth: '200px', maxHeight: '70px',
                    objectFit: 'contain',
                    display: 'block',
                    marginTop: '24px',
                    marginBottom: '16px'
                }}
                onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div style={{
                fontSize: 'clamp(4rem, 9vw, 7rem)',
                lineHeight: 1,
                fontWeight: 200,
                color: '#275D38',
                letterSpacing: '-0.03em',
                fontFamily: 'var(--font-display)',
                marginBottom: '12px'
            }}>
                {dateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                backgroundColor: '#E35205',
                color: 'white',
                padding: '0.6rem 1.5rem',
                borderRadius: '9999px',
                fontSize: 'clamp(0.9rem, 1.5vw, 1.2rem)',
                fontWeight: 500,
                textTransform: 'capitalize',
                marginTop: '8px'
            }}>
                {dateTime.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
        </>
    );
};

export default function InfoSlide({ weather, settings }) {
    const currentInsta = { user: '@grupogmad', url: 'https://instagram.com/grupogmad' };

    const cardBase = {
        height: '100%',
        boxSizing: 'border-box',
        borderRadius: '24px',
        position: 'relative',
        overflow: 'hidden'
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#f8f9fa',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: '1.5rem',
            padding: '1.5rem',
            fontFamily: 'var(--font-primary)',
            boxSizing: 'border-box',
            overflow: 'hidden'
        }}>
            {/* Card Relógio [0,0] */}
            <div style={{
                ...cardBase,
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2.5rem',
                paddingTop: '2rem'
            }}>
                <div style={{
                    position: 'absolute', top: '-40px', left: '-40px',
                    width: '120px', height: '120px', borderRadius: '50%',
                    backgroundColor: 'rgba(39, 93, 56, 0.05)'
                }} />
                <Clock />
            </div>

            {/* Card Clima [0,1] */}
            <div style={{
                ...cardBase,
                backgroundColor: '#275D38',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '2rem',
                boxShadow: '0 4px 24px rgba(39, 93, 56, 0.15)'
            }}>
                <div style={{
                    position: 'absolute', bottom: '-60px', right: '-60px',
                    width: '200px', height: '200px', borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.06)'
                }} />

                <div style={{
                    display: 'flex', alignItems: 'center',
                    color: 'rgba(134, 239, 172, 0.7)',
                    fontSize: '1.2rem', textTransform: 'uppercase',
                    fontWeight: 700, letterSpacing: '0.15em',
                    position: 'relative', zIndex: 10
                }}>
                    <MapPin style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                    {settings?.weatherCity || CITY_CONFIG.name}
                </div>

                <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    position: 'relative', zIndex: 10,
                    flex: 1, marginTop: '1rem'
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
                            fontSize: 'clamp(1.5rem, 2.5vw, 1.8rem)',
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

            {/* Card Instagram [1,0] */}
            <div style={{
                ...cardBase,
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                paddingLeft: '24px',
                paddingRight: '24px',
                paddingTop: '20px',
                paddingBottom: '20px'
            }}>
                <div style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '12px',
                    backgroundColor: '#ffffff',
                    padding: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #e5e7eb',
                    flexShrink: 0,
                    marginRight: '20px',
                    marginLeft: '8px'
                }}>
                    <QRCodeSVG
                        value={currentInsta.url}
                        size={120}
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
                            fontSize: '1.1rem', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.1em',
                            color: '#6b7280'
                        }}>Siga-nos</span>
                    </div>
                    <p style={{
                        fontSize: 'clamp(1.8rem, 3vw, 2.5rem)',
                        fontWeight: 800, color: '#275D38',
                        marginBottom: '0.25rem', lineHeight: 1.2
                    }}>{currentInsta.user}</p>
                    <p style={{
                        fontSize: 'clamp(1rem, 1.5vw, 1.1rem)',
                        color: '#6b7280', fontWeight: 500
                    }}>
                        Escaneie o QR Code para seguir
                    </p>
                </div>
            </div>

            {/* Card Wi-Fi [1,1] */}
            <div style={{
                ...cardBase,
                backgroundColor: '#E35205',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '2rem',
                boxShadow: '0 4px 24px rgba(227, 82, 5, 0.2)'
            }}>
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
                            fontSize: '1.1rem', fontWeight: 700,
                            textTransform: 'uppercase', letterSpacing: '0.15em'
                        }}>Wi-Fi Gratuito</span>
                    </div>
                    <div>
                        <p style={{
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontSize: '1rem', textTransform: 'uppercase',
                            fontWeight: 700, marginBottom: '0.5rem'
                        }}>Rede</p>
                        <p style={{
                            fontSize: 'clamp(2rem, 3vw, 2.5rem)',
                            fontWeight: 700, color: 'white', lineHeight: 1.2
                        }}>
                            {settings?.wifiSsid || 'GMAD Madville'}
                        </p>
                        <p style={{
                            fontSize: 'clamp(2rem, 2.5vw, 2rem)',
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
