import React from 'react';

export default function Spinner({ size = 24, message = 'Cargando...' }) {
  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8
  };
  const dotStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    border: '3px solid rgba(0,0,0,0.1)',
    borderTopColor: '#2563EB',
    animation: 'spin 0.8s linear infinite'
  };
  return (
    <div style={style} role="status" aria-live="polite">
      <div style={dotStyle} />
      <span>{message}</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
