import React from 'react';
import { Wrench } from 'lucide-react';

export default function MaintenanceScreen() {
    return (
        <div style={{
            height: '100%',
            width: '100%',
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-primary)',
            color: '#275D38'
        }}>
            <div style={{
                marginBottom: '3rem',
                animation: 'pulse 4s infinite ease-in-out',
                color: '#E35205'
            }}>
                <Wrench size={120} strokeWidth={1.5} />
            </div>

            <h1 style={{
                fontSize: '4rem',
                fontWeight: '800',
                color: '#275D38',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                margin: 0
            }}>
                Em manutenção
            </h1>

            <div style={{
                width: '120px',
                height: '6px',
                backgroundColor: '#E35205',
                marginTop: '1.5rem',
                borderRadius: '3px'
            }} />

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 0.9; }
                    50% { transform: scale(1.02); opacity: 1; }
                    100% { transform: scale(1); opacity: 0.9; }
                }
            `}</style>
        </div>
    );
}
