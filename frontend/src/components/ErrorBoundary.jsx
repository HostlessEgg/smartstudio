import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null, showDetails: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // log to console for now; can be extended to send to Sentry
    console.error('Uncaught error:', error, info);
    this.setState({ info });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{ padding: 24 }}>
        <div style={{ maxWidth: 900, margin: '40px auto', background: '#fff', borderRadius: 8, padding: 24, boxShadow: '0 6px 18px rgba(0,0,0,0.08)' }}>
          <h2 style={{ marginTop: 0 }}>Ha ocurrido un error inesperado</h2>
          <p>La aplicación encontró un problema. Puedes recargar la página o contactar al soporte.</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button onClick={() => window.location.reload()} style={{ padding: '8px 12px', background: '#4f46e5', color: '#fff', borderRadius: 6, border: 'none' }}>Recargar</button>
            <button onClick={() => this.setState(s => ({ showDetails: !s.showDetails }))} style={{ padding: '8px 12px', borderRadius: 6 }}>Detalles</button>
          </div>

          {this.state.showDetails && (
            <pre style={{ marginTop: 16, maxHeight: 300, overflow: 'auto', background: '#f7f7f7', padding: 12, borderRadius: 6 }}>
              {String(this.state.error && this.state.error.stack) || 'Sin stack disponible'}
              {'\n'}
              {this.state.info ? JSON.stringify(this.state.info.componentStack, null, 2) : ''}
            </pre>
          )}
        </div>
      </div>
    );
  }
}
