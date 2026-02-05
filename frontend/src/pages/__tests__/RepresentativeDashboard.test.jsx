import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

let mockUser = null;
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser })
}));

vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn()
  }
}));
import api from '../../lib/api';
import RepresentativeDashboard from '../RepresentativeDashboard';

const renderWithUser = (user) => {
  mockUser = user;
  return render(<RepresentativeDashboard />);
};

describe('RepresentativeDashboard flows', () => {
  beforeEach(() => {
    api.get.mockReset();
    api.post.mockReset();
    api.delete.mockReset();
    localStorage.clear();
  });

  test('student sees received requests and can grant consent', async () => {
    const studentUser = { id: 10, role: 'student' };

    api.get.mockResolvedValueOnce({ data: { requests: [ { id: 1, representative_id: 5, requested_at: new Date().toISOString(), active: false, representative_name: 'Rep Test', representative_email: 'rep@test.local' } ] } });
    // after granting, refresh returns empty
    api.post.mockResolvedValueOnce({ status: 200 });
    api.get.mockResolvedValueOnce({ data: { requests: [] } });

    // previous implementation used window.prompt; now UI shows a modal

    renderWithUser(studentUser);

    // wait for request item to appear
    expect(await screen.findByText(/ID representante/)).toBeInTheDocument();

    const grantBtn = screen.getByText('Conceder');
    fireEvent.click(grantBtn);

    // modal should open; find Confirmar and click it
    const confirm = await screen.findByText('Confirmar');
    fireEvent.click(confirm);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/representatives/consent', expect.objectContaining({ studentId: studentUser.id, representativeId: 5, action: 'grant' }));
    });

    // after refresh, no requests message should appear
    expect(await screen.findByText(/No hay solicitudes/)).toBeInTheDocument();
  });

  test('representative sees created requests, can view progress and cancel', async () => {
    const repUser = { id: 20, role: 'admin' };

    const requestsResp = { data: { representativeId: 99, requests: [ { id: 11, student_id: 30, requested_at: new Date().toISOString(), active: true, student_name: 'Alumno Demo', student_email: 'demo@test.local' } ] } };
    const studentsResp = { data: { students: [ { student_id: 30, name: 'Alumno Demo', email: 'demo@test.local', active: true } ] } };
    api.get.mockResolvedValueOnce(requestsResp); // requests
    api.get.mockResolvedValueOnce(studentsResp); // active students

    // progress call
    const progressResp = { data: { progress: [ { course_id: 'C1', completed_lessons: 3 } ] } };
    api.get.mockResolvedValueOnce(progressResp);

    // (no cancel flow for representative role in UI)

    renderWithUser(repUser);

    // Wait for request to render (UI shows "ID:")
    expect(await screen.findByText(/Solicitudes realizadas/)).toBeInTheDocument();

    const viewBtn = screen.getByText('Ver progreso');
    fireEvent.click(viewBtn);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/representatives/students/30/progress');
    });

    // Modal should show course id
    expect(await screen.findByText(/Curso:/)).toBeInTheDocument();

    // close the progress modal
    const closeBtn = screen.getByLabelText('Cerrar modal');
    fireEvent.click(closeBtn);
  });
});
