import React from 'react';

export default function EmptyState({ title = 'No hay resultados', description = '', action = null }) {
  return (
    <div style={{ textAlign: 'center', padding: 24 }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
      <h3 style={{ fontSize: 18, marginBottom: 6 }}>{title}</h3>
      {description && <p style={{ color: '#6B7280', marginBottom: 12 }}>{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
