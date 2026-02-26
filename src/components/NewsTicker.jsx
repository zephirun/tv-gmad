import React from 'react';
import { LOGO_URL } from '../constants';

export default function NewsTicker({ newsItems }) {
    const [currentIndex, setCurrentIndex] = React.useState(0);

    // Rotação de notícias estática (sem animação de scroll contínuo)
    React.useEffect(() => {
        if (!newsItems || newsItems.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % newsItems.length);
        }, 8000); // Troca a cada 8 segundos
        return () => clearInterval(interval);
    }, [newsItems]);

    if (!newsItems || newsItems.length === 0) return null;

    const currentItem = newsItems[currentIndex];

    return (
        <div style={{
            width: '100%',
            height: '70px',
            background: '#275D38',
            display: 'flex',
            WebkitDisplay: 'flex',
            alignItems: 'center',
            WebkitAlignItems: 'center',
            overflow: 'hidden',
            flexShrink: 0,
            WebkitFlexShrink: 0,
            zIndex: 100,
            borderTop: '2px solid #E35205'
        }}>
            {/* Logo GMAD */}
            <div style={{
                background: '#ffffff',
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
                minWidth: '180px',
                boxShadow: '4px 0 12px rgba(0,0,0,0.15)'
            }}>
                <img
                    src={LOGO_URL}
                    alt="GMAD"
                    style={{ maxWidth: '130px', maxHeight: '42px', objectFit: 'contain' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                />
            </div>

            {/* Separador laranja */}
            <div style={{ width: '4px', height: '100%', background: '#E35205', flexShrink: 0 }} />

            {/* Container da Notícia (Estático) */}
            <div style={{
                flex: 1,
                WebkitFlex: 1,
                padding: '0 30px',
                display: 'flex',
                WebkitDisplay: 'flex',
                alignItems: 'center',
                WebkitAlignItems: 'center',
                justifyContent: 'flex-start',
                WebkitJustifyContent: 'flex-start'
            }}>
                <span style={{
                    color: 'white',
                    fontSize: '24px', // Aumentei um pouco para legibilidade
                    fontFamily: "var(--font-display)",
                    fontWeight: 500,
                    letterSpacing: '0.01em',
                    lineHeight: 1.2
                }}>
                    {currentItem}
                </span>
            </div>
        </div>
    );
}
