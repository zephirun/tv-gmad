import React from 'react';

export default function NewsTicker({ newsItems }) {
    const [currentIndex, setCurrentIndex] = React.useState(0);

    React.useEffect(() => {
        if (!newsItems || newsItems.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % newsItems.length);
        }, 8000);
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
            {/* Badge INFO GMAD */}
            <div style={{
                background: '#E35205',
                color: 'white',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 28px',
                flexShrink: 0,
                minWidth: '160px'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        marginBottom: '2px',
                        textTransform: 'uppercase'
                    }}>Info</div>
                    <div style={{
                        fontSize: '22px',
                        fontWeight: 800,
                        fontFamily: "var(--font-display)"
                    }}>GMAD</div>
                </div>
            </div>

            {/* Texto da Notícia */}
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
                    fontSize: '24px',
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
