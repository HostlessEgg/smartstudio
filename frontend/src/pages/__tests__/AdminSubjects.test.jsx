import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminSubjects from '../AdminSubjects';
import * as api from '../../api/subjects';
import { vi } from 'vitest';

vi.mock('../../api/subjects');

const sample = [ { id: 101, code: 'TST', name: 'Test Materia', grade: 'Primero', hours: 2, sections: 1, teachers: [] } ];

describe('AdminSubjects', () => {
  beforeEach(() => {
    api.fetchSubjects.mockResolvedValue(sample);
    api.createSubject.mockImplementation(async (p) => ({ id: 102, ...p }));
    api.updateSubject.mockImplementation(async (id, p) => ({ id, ...p }));
    api.deleteSubject.mockResolvedValue({ success: true });
  });

  test('renders list and can create a subject', async () => {
    render(<AdminSubjects />);
    expect(await screen.findByText('Administración de Materias')).toBeInTheDocument();
    // existing subject
    expect(await screen.findByText('Test Materia')).toBeInTheDocument();

    // create new
    fireEvent.click(screen.getByText('Crear Materia'));
    const nameInput = screen.getByPlaceholderText('Nombre');
    fireEvent.change(nameInput, { target: { value: 'Nueva Materia' } });
    fireEvent.click(screen.getByText('Guardar'));

    await waitFor(() => expect(api.createSubject).toHaveBeenCalled());
    expect(await screen.findByText('Nueva Materia')).toBeInTheDocument();
  });
});
