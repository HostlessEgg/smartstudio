import React from 'react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CohortManagement from '../../pages/CohortManagement';

describe('CohortManagement', () => {
  afterEach(() => { vi.restoreAllMocks(); });

  test('renders header and seeded cohorts list and can create a new cohort', () => {
    render(<CohortManagement />);
    expect(screen.getByText(/Cohortes/i)).toBeInTheDocument();
    // one of the seeded cohort names
    expect(screen.getByText(/Cohorte Noviembre/i)).toBeInTheDocument();

    const promptSpy = vi.spyOn(window, 'prompt').mockImplementation(() => 'Nueva Cohorte');
    const btn = screen.getByRole('button', { name: /Crear Cohorte/i });
    fireEvent.click(btn);
    expect(screen.getByText(/Nueva Cohorte/i)).toBeInTheDocument();
    promptSpy.mockRestore();
  });
});
