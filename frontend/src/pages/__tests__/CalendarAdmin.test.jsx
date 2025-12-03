import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CalendarAdmin from '../../pages/CalendarAdmin';

describe('CalendarAdmin', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  test('renders header and seeded events and can add a new event', () => {
    render(<CalendarAdmin />);
    expect(screen.getByText(/Administración de Calendario/i)).toBeInTheDocument();
    expect(screen.getByText(/Inicio de curso: Matemáticas/i)).toBeInTheDocument();

    const prompts = ['Evento Prueba', '2025-12-20'];
    const promptSpy = vi.spyOn(window, 'prompt').mockImplementation(() => prompts.shift());
    const btn = screen.getByRole('button', { name: /Agregar Evento/i });
    fireEvent.click(btn);
    expect(screen.getByText(/Evento Prueba/i)).toBeInTheDocument();
    expect(screen.getByText(/2025-12-20/i)).toBeInTheDocument();
    promptSpy.mockRestore();
  });
});
