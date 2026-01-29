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
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', color: '#7f1d1d', backgroundColor: '#fef2f2', height: '100vh', fontFamily: 'sans-serif' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>Algo deu errado.</h1>
                    <p>Por favor, recarregue a página ou contate o suporte.</p>
                    <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff', border: '1px solid #fecaca', borderRadius: '8px', overflow: 'auto' }}>
                        <p style={{ fontWeight: 'bold' }}>{this.state.error && this.state.error.toString()}</p>
                        <pre style={{ fontSize: '12px', marginTop: '10px' }}>
                            {this.state.errorInfo && this.state.errorInfo.componentStack}
                        </pre>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
