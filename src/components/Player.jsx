import React, { useRef, useEffect, useState, useCallback } from 'react';

export default function Player({ currentItem, playlist, currentIndex, next }) {
    const videoRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    // Estado para controlar mute (inicia mudo se navegador bloquear autoplay com som)
    const [isMuted, setIsMuted] = useState(false);

    // Resetar estados quando o slide mudar
    useEffect(() => {
        setIsLoading(true);
        // Tenta desmutar ao trocar de slide, mas navegador pode bloquear
        setIsMuted(false);
    }, [currentItem]);

    // WATCHDOG: Se ficar carregando por mais de 15 segundos, pula para o próximo
    useEffect(() => {
        if (!isLoading) return;

        const watchdog = setTimeout(() => {
            console.warn(`Watchdog: Item ${currentItem?.id} demorou muito para carregar. Pulando...`);
            next();
        }, 15000);

        return () => clearTimeout(watchdog);
    }, [isLoading, next, currentItem]); // Adicionado currentItem para garantir log correto

    // FORCE LOAD: Como usamos preload="none", precisamos mandar carregar explicitamente
    useEffect(() => {
        const vid = videoRef.current;
        if (currentItem?.type === 'video' && vid) {
            console.log(`Forçando carregamento do vídeo: ${currentItem.id}`);
            vid.load();

            const p = vid.play();
            if (p !== undefined) {
                p.catch(e => {
                    console.log("Play imediato falhou (normal, esperando carregar):", e);
                });
            }
        }

        // LIMPEZA AGRESSIVA DE MEMÓRIA
        return () => {
            if (vid) {
                console.log("Limpando recursos de vídeo...");
                vid.pause();
                vid.removeAttribute('src'); // Remove referência do DOM
                vid.load(); // Força o browser a liberar o buffer
            }
        };
    }, [currentItem]);


    // Estilos base
    const containerStyle = {
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        WebkitDisplay: 'flex',
        flexDirection: 'column',
        WebkitFlexDirection: 'column',
        background: 'black',
        overflow: 'hidden'
    };

    const loadingOverlayStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'black',
        zIndex: 50,
        transition: 'opacity 0.3s ease',
        opacity: isLoading ? 1 : 0,
        pointerEvents: 'none'
    };

    const spinnerStyle = {
        width: '50px',
        height: '50px',
        border: '4px solid #333',
        borderTopColor: '#E35205',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
    };

    const progressContainerStyle = {
        position: 'absolute',
        top: '1.5rem',
        right: '1.5rem',
        display: 'flex',
        gap: '8px',
        zIndex: 60
    };

    // Handler para iniciar playback apenas quando seguro
    const handleCanPlayThrough = useCallback((e) => {
        const video = e.target;

        // Se já está tocando, ignora
        if (!video.paused) {
            setIsLoading(false);
            return;
        }

        // Tenta reproduzir com som
        const playPromise = video.play();

        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    // Sucesso com som
                    setIsLoading(false);
                })
                .catch(error => {
                    console.warn("Autoplay com som bloqueado. Tentando mudo...", error);
                    // Fallback: Muta e tenta de novo
                    setIsMuted(true);
                    video.muted = true;
                    video.play()
                        .then(() => setIsLoading(false))
                        .catch(e => console.error("Autoplay falhou totalmente:", e));
                });
        }
    }, []);

    const handleVideoError = (e) => {
        console.error("Erro no vídeo:", e.target.error, e.target.currentSrc);
        // Tentar próximo slide após erro (mais rápido que 3s para evitar tela preta longa)
        const timer = setTimeout(next, 2000);
        return () => clearTimeout(timer);
    };

    if (!currentItem) return <div style={containerStyle}></div>;

    return (
        <div style={containerStyle}>

            {/* OVERLAY DE LOADING */}
            {isLoading && (
                <div style={loadingOverlayStyle}>
                    <div style={spinnerStyle}></div>
                </div>
            )}

            {/* SLIDE: IMAGEM */}
            {currentItem.type === 'image' && (
                <div style={{ width: '100%', height: '100%', position: 'relative', background: 'black' }}>
                    <img
                        key={`img-${currentItem.id}`} // Força recriação do DOM
                        src={currentItem.src}
                        alt="Slide"
                        decoding="async" // Otimização: Decodifica fora da main thread
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onLoad={() => setIsLoading(false)}
                        onError={(e) => {
                            console.error("Erro na imagem:", e);
                            next();
                        }}
                    />
                </div>
            )}

            {/* SLIDE: VÍDEO */}
            {currentItem.type === 'video' && (
                <div style={{ width: '100%', height: '100%', background: 'black' }}>
                    <video
                        key={`vid-${currentItem.id}`} // Recriação do DOM
                        ref={videoRef}
                        src={currentItem.src}
                        muted={isMuted} // Controlado pelo React
                        playsInline
                        preload="none" // ECONOMIA DE RAM: Não carregar vídeo até ser necessário
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onEnded={next}
                        onError={handleVideoError}

                        // NÃO usar autoPlay no HTML, controlamos via JS no canplaythrough
                        // para garantir que não trave no meio
                        onCanPlayThrough={handleCanPlayThrough}

                        // Fallback: se travar no meio (buffer underrun), mostra loading
                        onWaiting={() => setIsLoading(true)}
                        onPlaying={() => setIsLoading(false)}
                    />
                </div>
            )}

            {/* INDICADORES */}
            <div style={progressContainerStyle}>
                {playlist.map((_, i) => (
                    <div
                        key={i}
                        style={{
                            height: '8px',
                            borderRadius: '4px',
                            transition: 'all 0.5s ease',
                            width: i === currentIndex ? '40px' : '12px',
                            background: i === currentIndex ? '#E35205' : 'rgba(255,255,255,0.3)',
                        }}
                    />
                ))}
            </div>

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}
