import React, { useState, useEffect, useRef } from 'react';

export default function Player({ currentItem, playlist, currentIndex, next }) {
    const [isLoading, setIsLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);
    const ytPlayerRef = useRef(null);
    const containerRef = useRef(null);
    const videoRef = useRef(null);
    const stalledTimerRef = useRef(null);

    // Reseta estado ao trocar de item
    useEffect(() => {
        setIsLoading(true);
        setRetryCount(0);
    }, [currentItem?.src]);

    // Efeito para carregar o próximo item
    useEffect(() => {
        if (!currentItem) return;

        // Se for imagem, define um timer para trocar
        if (currentItem.type === 'image') {
            const timer = setTimeout(() => {
                next();
            }, currentItem.duration || 10000);
            return () => clearTimeout(timer);
        }

        // Se for YouTube, carregar a API se não existir
        if (currentItem.type === 'youtube') {
            if (!window.YT) {
                const tag = document.createElement('script');
                tag.src = "https://www.youtube.com/iframe_api";
                const firstScriptTag = document.getElementsByTagName('script')[0];
                firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

                window.onYouTubeIframeAPIReady = () => {
                    initYouTubePlayer();
                };
            } else {
                initYouTubePlayer();
            }
        }
    }, [currentItem, next]);

    // Polling fallback para WebOS: verifica se o vídeo chegou ao fim
    // (WebOS frequentemente não dispara onEnded)
    useEffect(() => {
        if (currentItem?.type !== 'video') return;

        const interval = setInterval(() => {
            const vid = videoRef.current;
            if (!vid) return;
            if (vid.duration > 0 && vid.currentTime >= vid.duration - 0.5) {
                console.log("[PLAYER] Polling detectou fim do vídeo. Chamando next().");
                clearInterval(interval);
                next();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [currentItem, next]);

    const initYouTubePlayer = () => {
        // Cleanup anterior
        if (ytPlayerRef.current) {
            try {
                ytPlayerRef.current.destroy();
            } catch (e) {
                console.warn("[PLAYER] Erro ao destruir player antigo:", e);
            }
            ytPlayerRef.current = null;
        }

        const videoId = currentItem.src;
        // Esperar um micro-tick para garantir que o elemento id=`yt-player-${videoId}` existe no DOM
        setTimeout(() => {
            const targetId = `yt-player-${videoId}`;
            const targetEl = document.getElementById(targetId);
            if (!targetEl) {
                console.warn("[PLAYER] Elemento alvo do YouTube não encontrado:", targetId);
                return;
            }

            try {
                ytPlayerRef.current = new window.YT.Player(targetId, {
                    videoId: videoId,
                    playerVars: {
                        autoplay: 1,
                        controls: 0,
                        mute: 1,
                        modestbranding: 1,
                        rel: 0,
                        showinfo: 0,
                        iv_load_policy: 3,
                        playsinline: 1
                    },
                    events: {
                        onReady: (event) => {
                            event.target.playVideo();
                            setIsLoading(false);
                        },
                        onStateChange: (event) => {
                            if (event.data === window.YT.PlayerState.ENDED) {
                                next();
                            }
                        },
                        onError: () => next()
                    }
                });
            } catch (err) {
                console.error("[PLAYER] Falha ao inicializar YouTube:", err);
                next();
            }
        }, 50);
    };

    // Anti-travamento de carregamento (WebOS) — 25s para vídeos, 30s para YouTube
    useEffect(() => {
        if (!currentItem || currentItem.type === 'image') return;
        const timeout = currentItem.type === 'youtube' ? 30000 : 25000;
        const timer = setTimeout(() => {
            if (isLoading) {
                console.warn("[PLAYER] Mídia demorou demais para carregar. Pulando...");
                next();
            }
        }, timeout);
        return () => clearTimeout(timer);
    }, [currentItem, isLoading, next]);

    if (!currentItem) return <div style={{ width: '100%', height: '100%', background: 'black' }} />;

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', background: 'black', overflow: 'hidden' }}>

            {isLoading && (
                <div style={{
                    position: 'absolute', inset: 0, zIndex: 50,
                    background: 'black', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div className="spinner" style={{ animation: 'spin 1s linear infinite' }}></div>
                </div>
            )}

            {currentItem.type === 'image' && (
                <img
                    key={currentItem.src}
                    src={currentItem.src}
                    onLoad={() => setIsLoading(false)}
                    onError={() => next()}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            )}

            {currentItem.type === 'video' && (
                <video
                    key={currentItem.src}
                    ref={videoRef}
                    src={currentItem.src}
                    autoPlay
                    muted
                    playsInline
                    preload="auto"
                    onPlaying={() => {
                        setIsLoading(false);
                        setRetryCount(0);
                    }}
                    onEnded={() => next()}
                    onError={(e) => {
                        console.warn('[PLAYER] Erro no vídeo:', currentItem.src, e.target.error?.code);
                        if (retryCount < 1) {
                            // Recarrega o src de verdade (simples incremento de estado não é suficiente no WebOS)
                            setRetryCount(prev => prev + 1);
                            const vid = videoRef.current;
                            if (vid) {
                                const src = vid.src;
                                vid.src = '';
                                setTimeout(() => { vid.src = src; vid.load(); vid.play().catch(() => { }); }, 500);
                            }
                        } else {
                            next();
                        }
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            )}

            {currentItem.type === 'youtube' && (
                <div key={`yt-wrap-${currentItem.src}`} style={{ width: '100%', height: '100%' }}>
                    <div
                        id={`yt-player-${currentItem.src}`}
                        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                    />
                </div>
            )}

            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', gap: '8px', zIndex: 60 }}>
                {playlist.map((_, i) => (
                    <div key={i} style={{
                        height: '6px', width: i === currentIndex ? '30px' : '10px',
                        borderRadius: '3px', background: i === currentIndex ? '#E35205' : 'rgba(255,255,255,0.2)',
                        transition: 'all 0.5s ease'
                    }} />
                ))}
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spinner { width: 40px; height: 40px; border: 3px solid #333; border-top-color: #E35205; border-radius: 50%; }
                iframe { width: 100%; height: 100%; border: none; pointer-events: none; transform: scale(1.1); }
            `}</style>
        </div>
    );
}
