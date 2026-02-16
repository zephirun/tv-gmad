import React, { useState, useEffect, useRef } from 'react';

export default function Player({ currentItem, playlist, currentIndex, next }) {
    const [isLoading, setIsLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);
    const ytPlayerRef = useRef(null);
    const containerRef = useRef(null);

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

    const initYouTubePlayer = () => {
        if (ytPlayerRef.current) {
            ytPlayerRef.current.destroy();
            ytPlayerRef.current = null;
        }

        const videoId = currentItem.src;
        ytPlayerRef.current = new window.YT.Player(`yt-player-${videoId}`, {
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
                    // event.data === 0 significa que o vídeo acabou
                    if (event.data === window.YT.PlayerState.ENDED) {
                        next();
                    }
                },
                onError: () => next()
            }
        });
    };

    // Anti-travamento de carregamento (WebOS)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isLoading && currentItem?.type !== 'image') {
                console.warn("[PLAYER] Mídia demorou demais para carregar. Pulando...");
                next();
            }
        }, 20000);
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
                    onError={() => {
                        if (retryCount < 1) {
                            setRetryCount(prev => prev + 1);
                        } else {
                            next();
                        }
                    }}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            )}

            {currentItem.type === 'youtube' && (
                <div
                    key={currentItem.src}
                    id={`yt-player-${currentItem.src}`}
                    style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                />
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
