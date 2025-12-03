import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('../../lib/mockApi', () => ({
  default: {
    getCourseStructure: vi.fn().mockResolvedValue({
      courseId: 'course-101',
      title: 'Curso de Prueba',
      modules: [
        { id: 'm1', title: 'Módulo A', lessons: [{ id: 'l1', title: 'L1' }] },
        { id: 'm2', title: 'Módulo B', lessons: [{ id: 'l2', title: 'L2' }] }
      ],
      versions: []
    }),
    updateCourseStructure: vi.fn().mockResolvedValue({})
  }
}));

import CourseStructureEditor from '../CourseStructureEditor';
import mockApi from '../../lib/mockApi';

describe('CourseStructureEditor', () => {
  it('loads and displays course title and calls save', async () => {
    render(<CourseStructureEditor />);
    expect(await screen.findByText('Editor de Estructura de Curso')).toBeInTheDocument();
    expect(await screen.findByText('Curso de Prueba')).toBeInTheDocument();

    // click save and assert updateCourseStructure called
    const saveBtn = screen.getByRole('button', { name: /Guardar/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(mockApi.updateCourseStructure).toHaveBeenCalled();
    });
  });
});
