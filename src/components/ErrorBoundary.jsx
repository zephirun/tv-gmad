import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);

        // Tenta recuperar automaticamente após 10 segundos
        setTimeout(() => {
            window.location.reload();
        }, 10000);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '40px', color: '#7f1d1d', backgroundColor: '#fef2f2', height: '100vh', fontFamily: 'sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '20px' }}>Opa! Algo deu errado.</h1>
                    <p style={{ fontSize: '18px', marginBottom: '10px' }}>O sistema encontrou um erro inesperado.</p>
                    <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#E35205' }}>Reiniciando o sistema em 10 segundos...</p>

                    <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fff', border: '1px solid #fecaca', borderRadius: '12px', maxWidth: '80%', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <p style={{ fontWeight: 'bold', marginBottom: '10px' }}>{this.state.error && this.state.error.toString()}</p>
                        <div style={{ fontSize: '12px', color: '#666', textAlign: 'left', maxHeight: '100px', overflowY: 'auto' }}>
                            {/* Ocultando stack para limpeza visual, mas mantendo no console */}
                            Detalhes técnicos registrados.
                        </div>
                    </div>
                    <button onClick={() => window.location.reload()} style={{ marginTop: '30px', padding: '12px 24px', backgroundColor: '#166534', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Recarregar Agora
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
