import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ArrowRight, Delete } from 'lucide-react';

export default function LockScreen({ path, pin, onUnlock }) {
    const [input, setInput] = useState('');
    const [error, setError] = useState(false);
    const [isShake, setIsShake] = useState(false);

    useEffect(() => {
        if (error) {
            setIsShake(true);
            const timer = setTimeout(() => {
                setIsShake(false);
                setError(false);
                setInput('');
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleNumber = (num) => {
        if (input.length < 6) {
            setInput(prev => prev + num);
            setError(false);
        }
    };

    const handleDelete = () => {
        setInput(prev => prev.slice(0, -1));
    };

    const handleSubmit = (e) => {
        e?.preventDefault();
        if (input === pin) {
            onUnlock();
        } else {
            setError(true);
        }
    };

    // Support keyboard input
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key >= '0' && e.key <= '9') {
                handleNumber(e.key);
            } else if (e.key === 'Backspace') {
                handleDelete();
            } else if (e.key === 'Enter') {
                handleSubmit();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [input, pin]);

    // STYLES
    const containerStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#09090b', // Zinc-950
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2147483647, // Max Safe Integer for Z-Index
        color: 'white',
        fontFamily: 'sans-serif'
    };

    const cardStyle = {
        background: 'rgba(30, 30, 30, 0.95)',
        padding: '40px',
        borderRadius: '20px',
        border: '2px solid rgba(255,255,255,0.1)',
        width: '400px',
        maxWidth: '90%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
    };

    const iconContainerStyle = {
        background: error ? 'rgba(220, 38, 38, 0.2)' : 'rgba(34, 197, 94, 0.2)', // Red/Green
        padding: '20px',
        borderRadius: '50%',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease'
    };

    const inputStyle = {
        width: '100%',
        background: 'rgba(0,0,0,0.5)',
        border: error ? '2px solid #ef4444' : '2px solid rgba(255,255,255,0.2)',
        borderRadius: '12px',
        padding: '15px',
        textAlign: 'center',
        fontSize: '32px',
        letterSpacing: '10px',
        color: 'white',
        marginBottom: '30px',
        outline: 'none',
        transform: isShake ? 'translateX(-10px)' : 'none',
        transition: 'transform 0.1s'
    };

    // Keypad using Flexbox instead of Grid for better compatibility
    const keypadStyle = {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '15px',
        width: '100%'
    };

    const buttonStyle = {
        width: '80px',
        height: '80px',
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '16px',
        fontSize: '28px',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'background 0.2s'
    };

    const actionButtonStyle = {
        ...buttonStyle,
        background: 'rgba(255,255,255,0.05)'
    };

    const submitButtonStyle = {
        ...buttonStyle,
        background: '#f97316',
        border: 'none',
        boxShadow: '0 4px 15px rgba(249, 115, 22, 0.4)'
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <div style={iconContainerStyle}>
                    {input === pin ? (
                        <Unlock size={40} color="#22c55e" />
                    ) : (
                        <Lock size={40} color={error ? "#ef4444" : "#f97316"} />
                    )}
                </div>

                <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>TV Corporativa</h2>
                <p style={{ color: '#a1a1aa', margin: '0 0 30px 0', fontSize: '14px' }}>Acesso Restrito: /{path}</p>

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <input
                        type="password"
                        value={input}
                        readOnly // Prevent native keyboard on touch devices if unwanted
                        style={inputStyle}
                        placeholder="PIN"
                    />
                </form>

                <div style={keypadStyle}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumber(num.toString())}
                            style={buttonStyle}
                            className="hover-effect" // Optional class if we want to add hover via CSS file, but style is primary
                        >
                            {num}
                        </button>
                    ))}

                    {/* Empty spacer or specialized button could go here, but using Delete/0/Enter works best aligned */}
                    <button onClick={handleDelete} style={{ ...actionButtonStyle, color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}>
                        <Delete size={28} />
                    </button>

                    <button onClick={() => handleNumber('0')} style={buttonStyle}>
                        0
                    </button>

                    <button onClick={handleSubmit} style={submitButtonStyle}>
                        <ArrowRight size={32} color="white" />
                    </button>
                </div>
            </div>

            <p style={{ marginTop: '40px', color: '#71717a', fontSize: '14px' }}>
                Digite o PIN para liberar este dispositivo.
            </p>

            {/* Minimal inline style for hover effects if supported */}
            <style>{`
                button:active { transform: scale(0.95); }
            `}</style>
        </div>
    );
}
