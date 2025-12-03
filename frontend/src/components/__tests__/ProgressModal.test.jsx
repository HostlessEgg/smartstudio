import React from 'react';
import { render, screen } from '@testing-library/react';
import ProgressModal from '../ProgressModal';
import axe from 'axe-core';

describe('ProgressModal', () => {
  test('renders and has dialog role and aria-modal', () => {
    const { container } = render(<ProgressModal open={true} onClose={() => {}} studentId={123} progress={[{ course_id: 'C1', completed_lessons: 2 }]} />);
    const dialog = container.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  test('focuses close button when opened', async () => {
    render(<ProgressModal open={true} onClose={() => {}} studentId={456} progress={[]} />);
    // close button should be focused by effect
    const closeBtn = screen.getByLabelText('Cerrar modal');
    expect(document.activeElement).toBe(closeBtn);
  });

  test('has no obvious accessibility violations (axe)', async () => {
    const { container } = render(<ProgressModal open={true} onClose={() => {}} studentId={789} progress={[{ course_id: 'C2', completed_lessons: 1 }]} />);
    // run axe on the document body; axe returns a Promise
    const results = await axe.run(container);
    expect(results.violations.length).toBe(0);
  });
});
