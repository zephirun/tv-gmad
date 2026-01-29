import React from 'react';

export default function NewsTicker({ newsItems }) {
    if (!newsItems || newsItems.length === 0) return null;

    return (
        <div style={{
            width: '100%',
            height: '70px',
            background: '#166534',
            display: 'flex',
            WebkitDisplay: 'flex',
            alignItems: 'center',
            WebkitAlignItems: 'center',
            overflow: 'hidden',
            flexShrink: 0,
            WebkitFlexShrink: 0,
            zIndex: 100
        }}>
            {/* Badge INFO GMAD */}
            <div style={{
                background: '#ea580c',
                color: 'white',
                height: '100%',
                display: 'flex',
                WebkitDisplay: 'flex',
                alignItems: 'center',
                WebkitAlignItems: 'center',
                justifyContent: 'center',
                WebkitJustifyContent: 'center',
                padding: '0 28px',
                flexShrink: 0,
                WebkitFlexShrink: 0,
                minWidth: '120px'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: '11px',
                        opacity: 0.9,
                        letterSpacing: '0.12em',
                        fontWeight: 700,
                        marginBottom: '2px',
                        textTransform: 'uppercase'
                    }}>Info</div>
                    <div style={{
                        fontSize: '22px',
                        fontWeight: 800,
                        letterSpacing: '0.03em',
                        fontFamily: "'Outfit', 'Arial', sans-serif"
                    }}>GMAD</div>
                </div>
            </div>

            {/* Marquee Container */}
            <div style={{
                flex: 1,
                WebkitFlex: 1,
                overflow: 'hidden',
                position: 'relative',
                height: '100%',
                display: 'flex',
                WebkitDisplay: 'flex',
                alignItems: 'center',
                WebkitAlignItems: 'center',
                paddingLeft: '20px'
            }}>
                <div style={{
                    whiteSpace: 'nowrap',
                    WebkitAnimation: 'ticker 55s linear infinite',
                    animation: 'ticker 55s linear infinite',
                    display: 'flex',
                    WebkitDisplay: 'flex',
                    alignItems: 'center',
                    WebkitAlignItems: 'center'
                }}>
                    {[...newsItems, ...newsItems].map((item, index) => (
                        <div key={index} style={{
                            display: 'inline-flex',
                            WebkitDisplay: 'inline-flex',
                            alignItems: 'center',
                            WebkitAlignItems: 'center'
                        }}>
                            <span style={{
                                color: '#f97316',
                                margin: '0 28px',
                                fontSize: '22px',
                                fontWeight: 'bold'
                            }}>●</span>
                            <span style={{
                                color: 'white',
                                fontSize: '22px',
                                fontFamily: "'Outfit', 'Arial', sans-serif",
                                fontWeight: 500,
                                letterSpacing: '0.01em'
                            }}>
                                {item}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                @-webkit-keyframes ticker {
                    0% { -webkit-transform: translateX(0); transform: translateX(0); }
                    100% { -webkit-transform: translateX(-50%); transform: translateX(-50%); }
                }
                @keyframes ticker {
                    0% { -webkit-transform: translateX(0); transform: translateX(0); }
                    100% { -webkit-transform: translateX(-50%); transform: translateX(-50%); }
                }
            `}</style>
        </div>
    );
}
