import React, { useState, useEffect } from 'react';

export default function Player({ currentItem, playlist, currentIndex, next }) {
    const [isLoading, setIsLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);

    // Reset de segurança se o vídeo travar no loading por muito tempo
    useEffect(() => {
        if (currentItem?.type !== 'video' || !isLoading) return;

        const timer = setTimeout(() => {
            console.warn("[PLAYER] Timeout de carregamento (20s). Pulando para o próximo.");
            next();
        }, 20000);

        return () => clearTimeout(timer);
    }, [currentItem, isLoading, next]);

    if (!currentItem) return <div style={{ width: '100%', height: '100%', background: 'black' }} />;

    const isVideo = currentItem.type === 'video';

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative', background: 'black', overflow: 'hidden' }}>

            {/* OVERLAY DE CARREGAMENTO */}
            {isLoading && (
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 50,
                    background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="spinner" style={{
                        width: '50px', height: '50px', border: '4px solid #333',
                        borderTopColor: '#E35205', borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                </div>
            )}

            {/* SLIDE: IMAGEM */}
            {!isVideo && (
                <img
                    key={currentItem.src}
                    src={currentItem.src}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onLoad={() => setIsLoading(false)}
                    onError={() => next()}
                    alt="Slide"
                />
            )}

            {/* SLIDE: VÍDEO */}
            {/* O uso de 'key={currentItem.src}' força o React a destruir e recriar o elemento <video>, 
                o que é a forma mais segura de resetar o decodificador de hardware da TV WebOS. */}
            {isVideo && (
                <video
                    key={currentItem.src}
                    src={currentItem.src}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    autoPlay
                    muted
                    playsInline
                    loop={playlist.length === 1}
                    crossOrigin="anonymous"
                    preload="auto"
                    onPlaying={() => {
                        console.log("[PLAYER] Reproduzindo:", currentItem.title);
                        setIsLoading(false);
                    }}
                    onEnded={() => {
                        console.log("[PLAYER] Vídeo finalizado.");
                        next();
                    }}
                    onError={(e) => {
                        console.error("[PLAYER] Erro de vídeo detectado.");
                        if (retryCount < 1) {
                            setRetryCount(prev => prev + 1);
                            e.target.load();
                        } else {
                            next();
                        }
                    }}
                />
            )}

            {/* INDICADORES DE PROGRESSO */}
            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', gap: '8px', zIndex: 60 }}>
                {playlist.map((_, i) => (
                    <div key={i} style={{
                        height: '8px', borderRadius: '4px', transition: 'all 0.5s ease',
                        width: i === currentIndex ? '40px' : '12px',
                        background: i === currentIndex ? '#E35205' : 'rgba(255,255,255,0.3)',
                    }} />
                ))}
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
