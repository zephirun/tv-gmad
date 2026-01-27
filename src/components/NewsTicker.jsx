import React from 'react';

export default function NewsTicker({ newsItems }) {
    if (!newsItems || newsItems.length === 0) return null;

    return (
        <div style={{
            width: '100%',
            height: '60px',
            backgroundColor: '#1a3c3c',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            flexShrink: 0,
            zIndex: 100
        }}>
            {/* Badge INFO GMAD - Laranja */}
            <div style={{
                backgroundColor: '#ea580c',
                color: 'white',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '0 20px',
                fontWeight: 700,
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                flexShrink: 0,
                minWidth: '100px'
            }}>
                <div>
                    <div style={{ fontSize: '10px', opacity: 0.9 }}>INFO</div>
                    <div style={{ fontSize: '16px', fontWeight: 800 }}>GMAD</div>
                </div>
            </div>

            {/* Marquee Container */}
            <div style={{
                flex: 1,
                overflow: 'hidden',
                position: 'relative',
                height: '100%',
                display: 'flex',
                alignItems: 'center'
            }}>
                <div style={{
                    whiteSpace: 'nowrap',
                    animation: 'ticker 45s linear infinite',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: '20px'
                }}>
                    {[...newsItems, ...newsItems].map((item, index) => (
                        <div key={index} style={{
                            display: 'inline-flex',
                            alignItems: 'center'
                        }}>
                            <span style={{
                                color: '#f97316',
                                margin: '0 20px',
                                fontSize: '20px'
                            }}>●</span>
                            <span style={{
                                color: 'white',
                                fontSize: '18px',
                                fontFamily: "'Outfit', sans-serif",
                                fontWeight: 400
                            }}>
                                {item}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @keyframes ticker {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
}
