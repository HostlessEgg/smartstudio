import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CalendarAdmin from '../../pages/CalendarAdmin';

describe('CalendarAdmin', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  test('renders header and seeded events and can add a new event', () => {
    render(<CalendarAdmin />);
    expect(screen.getByText(/Administración de Calendario/i)).toBeInTheDocument();
    expect(screen.getByText(/Inicio de curso: Matemáticas/i)).toBeInTheDocument();

    const btn = screen.getByRole('button', { name: /Agregar Evento/i });
    fireEvent.click(btn);

    const titleInput = screen.getByLabelText(/Título/i);
    const dateInput = screen.getByLabelText(/Fecha/i);
    fireEvent.change(titleInput, { target: { value: 'Evento Prueba' } });
    fireEvent.change(dateInput, { target: { value: '2025-12-20' } });

    const createBtn = screen.getByRole('button', { name: /Crear/i });
    fireEvent.click(createBtn);

    expect(screen.getByText(/Evento Prueba/i)).toBeInTheDocument();
    expect(screen.getByText(/2025-12-20/i)).toBeInTheDocument();
  });
});
