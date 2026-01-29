import React, { useRef, useEffect } from 'react';
import { Play } from 'lucide-react';

export default function Player({ currentItem, playlist, currentIndex, next }) {
    const videoRef = useRef(null);

    useEffect(() => {
        let playTimer;
        if (currentItem?.type === 'video' && videoRef.current) {
            videoRef.current.load();
            videoRef.current.muted = false;

            // Pequeno delay segurar o play para garantir estabilidade
            playTimer = setTimeout(() => {
                if (!videoRef.current) return;
                const promise = videoRef.current.play();
                if (promise !== undefined) {
                    promise.catch(error => {
                        console.warn("Autoplay bloqueado, tentando mudo...", error);
                        if (videoRef.current) {
                            videoRef.current.muted = true;
                            videoRef.current.play().catch(e => console.error("Falha final play", e));
                        }
                    });
                }
            }, 150);
        }
        return () => clearTimeout(playTimer);
    }, [currentItem]);

    // Estilos base para Smart TV
    const containerStyle = {
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        WebkitDisplay: 'flex',
        flexDirection: 'column',
        WebkitFlexDirection: 'column',
        background: 'linear-gradient(to bottom right, #18181b 0%, #09090b 50%, #000000 100%)'
    };

    const loadingStyle = {
        width: '100%',
        height: '100%',
        display: 'flex',
        WebkitDisplay: 'flex',
        alignItems: 'center',
        WebkitAlignItems: 'center',
        justifyContent: 'center',
        WebkitJustifyContent: 'center',
        background: 'linear-gradient(to bottom right, #14532d 0%, #166534 100%)'
    };

    const spinnerStyle = {
        width: '64px',
        height: '64px',
        border: '4px solid #f97316',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        WebkitAnimation: 'spin 1s linear infinite',
        animation: 'spin 1s linear infinite'
    };

    const titleBarStyle = {
        background: 'linear-gradient(to right, #14532d 0%, #166534 50%, #14532d 100%)',
        borderTop: '4px solid #f97316',
        padding: '1.5rem',
        position: 'relative',
        zIndex: 10,
        flexShrink: 0,
        WebkitFlexShrink: 0,
        boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.3)'
    };

    const progressContainerStyle = {
        position: 'absolute',
        top: '1.5rem',
        right: '1.5rem',
        display: 'flex',
        WebkitDisplay: 'flex',
        gap: '8px',
        zIndex: 50
    };

    const counterStyle = {
        position: 'absolute',
        bottom: '7rem',
        right: '1.5rem',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        paddingTop: '0.5rem',
        paddingBottom: '0.5rem',
        borderRadius: '9999px',
        zIndex: 50
    };

    const handleVideoError = (e) => {
        const err = e.target.error;
        console.error('Erro de reprodução de vídeo:', err);
        // Códigos de erro: 1=Aborted, 2=Network, 3=Decode, 4=SrcNotSupported
        if (err && err.code === 3) console.error("Erro de Decodificação (Codec não suportado?)");
        if (err && err.code === 4) console.error("Formato não suportado pela TV");

        // Pula para o próximo item após erro
        setTimeout(next, 2000);
    };

    if (!currentItem) {
        return (
            <div style={loadingStyle}>
                <div style={{ textAlign: 'center' }}>
                    <div style={spinnerStyle}></div>
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '1.125rem', fontWeight: 300, marginTop: '1rem' }}>Carregando conteúdo...</p>
                </div>
                <style>{`
                    @-webkit-keyframes spin { from { -webkit-transform: rotate(0deg); } to { -webkit-transform: rotate(360deg); } }
                    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    return (
        <div key={currentItem.id} style={containerStyle}>

            {/* ===== SLIDE: IMAGEM ===== */}
            {currentItem.type === 'image' && (
                <>
                    {/* Área da imagem */}
                    <div style={{ flex: 1, WebkitFlex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
                        {/* Background blur da imagem */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            transform: 'scale(1.1)',
                            WebkitTransform: 'scale(1.1)',
                            filter: 'blur(40px)',
                            WebkitFilter: 'blur(40px)',
                            opacity: 0.3,
                            backgroundImage: `url(${currentItem.src})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}></div>

                        {/* Imagem principal */}
                        <img
                            src={currentItem.src}
                            alt={currentItem.title}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                position: 'relative',
                                zIndex: 10
                            }}
                        />

                        {/* Vinheta */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%, rgba(0,0,0,0.2) 100%)',
                            pointerEvents: 'none',
                            zIndex: 20
                        }}></div>
                    </div>

                    {/* Barra de título */}
                    <div style={titleBarStyle}>
                        <div style={{ maxWidth: '896px' }}>
                            <h2 style={{
                                fontSize: '2.5rem',
                                fontWeight: 700,
                                color: 'white',
                                marginBottom: '0.5rem',
                                lineHeight: 1.1,
                                letterSpacing: '-0.025em',
                                fontFamily: "'Outfit', sans-serif"
                            }}>
                                {currentItem.title}
                            </h2>
                            {currentItem.subtitle && (
                                <p style={{ fontSize: '1.25rem', color: 'rgba(134, 239, 172, 0.8)', fontWeight: 300 }}>{currentItem.subtitle}</p>
                            )}
                        </div>

                        {/* Elemento decorativo */}
                        <div style={{
                            position: 'absolute',
                            right: '2rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            WebkitTransform: 'translateY(-50%)',
                            display: 'flex',
                            gap: '6px',
                            opacity: 0.3
                        }}>
                            <div style={{ width: '8px', height: '32px', backgroundColor: '#f97316', borderRadius: '9999px' }}></div>
                            <div style={{ width: '8px', height: '48px', backgroundColor: 'white', borderRadius: '9999px' }}></div>
                            <div style={{ width: '8px', height: '24px', backgroundColor: '#f97316', borderRadius: '9999px' }}></div>
                        </div>
                    </div>
                </>
            )}

            {/* ===== SLIDE: VÍDEO ===== */}
            {currentItem.type === 'video' && (
                <div style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'black',
                    display: 'flex',
                    WebkitDisplay: 'flex',
                    alignItems: 'center',
                    WebkitAlignItems: 'center',
                    justifyContent: 'center',
                    WebkitJustifyContent: 'center',
                    position: 'relative'
                }}>
                    <video
                        ref={videoRef}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        src={currentItem.src}
                        playsInline
                        preload="auto"
                        onEnded={next}
                        onError={handleVideoError}
                    />
                </div>
            )}

            {/* ===== INDICADORES DE PROGRESSO ===== */}
            <div style={progressContainerStyle}>
                {playlist.map((_, i) => (
                    <div
                        key={i}
                        style={{
                            height: '8px',
                            borderRadius: '9999px',
                            transition: 'all 0.5s ease',
                            WebkitTransition: 'all 0.5s ease',
                            width: i === currentIndex ? '40px' : '12px',
                            background: i === currentIndex
                                ? 'linear-gradient(to right, #fb923c 0%, #ea580c 100%)'
                                : 'rgba(255, 255, 255, 0.2)',
                            boxShadow: i === currentIndex ? '0 0 10px rgba(249, 115, 22, 0.3)' : 'none'
                        }}
                    />
                ))}
            </div>

            {/* Contador de slides */}
            <div style={counterStyle}>
                <span style={{ color: 'white', fontWeight: 700, fontSize: '1.125rem' }}>{currentIndex + 1}</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.5)', marginLeft: '4px', marginRight: '4px' }}>/</span>
                <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '1.125rem' }}>{playlist.length}</span>
            </div>

            <style>{`
                @-webkit-keyframes spin { from { -webkit-transform: rotate(0deg); } to { -webkit-transform: rotate(360deg); } }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
