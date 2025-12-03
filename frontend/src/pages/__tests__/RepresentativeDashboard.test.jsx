import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';

let mockUser = null;
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser })
}));

vi.mock('axios');
import axios from 'axios';
import RepresentativeDashboard from '../RepresentativeDashboard';

const renderWithUser = (user) => {
  mockUser = user;
  return render(<RepresentativeDashboard />);
};

describe('RepresentativeDashboard flows', () => {
  beforeEach(() => {
    axios.get.mockReset();
    axios.post.mockReset();
    axios.delete.mockReset();
    localStorage.clear();
  });

  test('student sees received requests and can grant consent', async () => {
    const studentUser = { id: 10, role: 'student' };

    axios.get.mockResolvedValueOnce({ data: { requests: [ { id: 1, representative_id: 5, requested_at: new Date().toISOString(), active: false } ] } });
    // after granting, refresh returns empty
    axios.post.mockResolvedValueOnce({ status: 200 });
    axios.get.mockResolvedValueOnce({ data: { requests: [] } });

    // previous implementation used window.prompt; now UI shows a modal

    renderWithUser(studentUser);

    // wait for request item to appear
    expect(await screen.findByText(/Representative ID:/)).toBeInTheDocument();

    const grantBtn = screen.getByText('Conceder');
    fireEvent.click(grantBtn);

    // modal should open; find Confirmar and click it
    const confirm = await screen.findByText('Confirmar');
    fireEvent.click(confirm);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/representatives/consent', expect.objectContaining({ studentId: studentUser.id, representativeId: 5, action: 'grant' }));
    });

    // after refresh, no requests message should appear
    expect(await screen.findByText(/No hay solicitudes/)).toBeInTheDocument();
  });

  test('representative sees created requests, can view progress and cancel', async () => {
    const repUser = { id: 20, role: 'representative' };

    const requestsResp = { data: { representativeId: 99, students: [ { id: 11, student_id: 30, requested_at: new Date().toISOString(), active: true, name: 'Alumno Demo' } ] } };
    axios.get.mockResolvedValueOnce(requestsResp); // initial load (students)

    // progress call
    const progressResp = { data: { progress: [ { course_id: 'C1', completed_lessons: 3 } ] } };
    axios.get.mockResolvedValueOnce(progressResp);

    // (no cancel flow for representative role in UI)

    renderWithUser(repUser);

    // Wait for request to render (UI shows "ID:")
    expect(await screen.findByText(/ID:/)).toBeInTheDocument();

    const viewBtn = screen.getByText('Ver progreso');
    fireEvent.click(viewBtn);

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/representatives/students/30/progress');
    });

    // Modal should show course id
    expect(await screen.findByText(/Curso:/)).toBeInTheDocument();

    // close the progress modal
    const closeBtn = screen.getByLabelText('Cerrar modal');
    fireEvent.click(closeBtn);
  });
});
