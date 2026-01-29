import { Sun, CloudSun, CloudRain, Cloud } from 'lucide-react';
import React from 'react';

export const CITY_CONFIG = { name: "Joinville, SC", lat: -26.3044, lon: -48.8456 };

export const DEFAULT_PLAYLIST = [
    { id: 1, type: 'image', src: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=1920', title: 'MDF e Ferragens', subtitle: 'A maior variedade da região', duration: 8000 },
    { id: 3, type: 'video', src: 'https://cdn.coverr.co/videos/coverr-carpenter-working-with-wood-5154/1080p.mp4', title: 'Soluções GMAD', subtitle: 'Qualidade garantida em cada detalhe', duration: null }
];

export const DEFAULT_NEWS = ["Bem-vindo à GMAD Madville", "Oferta da Semana: MDF Branco TX com preço especial", "Siga @gmadmadville no Instagram"];

export const LOGO_URL = "https://drive.google.com/thumbnail?id=1YKoygMti92eG-g2v6GKHDn9MsfVQv6Vu&sz=w1000";

export const getWeatherDescription = (code) => {
    if (code === 0) return { label: 'Céu Limpo', icon: <Sun className="w-16 h-16 text-orange-500" /> };
    if (code >= 1 && code <= 3) return { label: 'Nublado', icon: <CloudSun className="w-16 h-16 text-gray-400" /> };
    if (code >= 51) return { label: 'Chuva', icon: <CloudRain className="w-16 h-16 text-blue-500" /> };
    return { label: 'Nublado', icon: <Cloud className="w-16 h-16 text-gray-400" /> };
};
