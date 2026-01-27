import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import UserAdminPage from '../UserAdminPage';
import api from '../../lib/api';

vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe('UserAdminPage', () => {
  it('renders existing users and can create a new user (mock)', async () => {
    // initial fetch returns existing users
    api.get.mockResolvedValueOnce({ data: { data: [ { id: 1, name: 'Admin SmartStudio', email: 'admin@smartstudio.com', role: 'admin' } ], meta: { total: 1, total_pages: 1, page: 1, per_page: 20 } } });
    render(<UserAdminPage />);

    await waitFor(() => expect(screen.getByText('Admin SmartStudio')).toBeInTheDocument());

    // open create modal (the header button)
    const openBtn = screen.getByRole('button', { name: 'Crear usuario' });
    fireEvent.click(openBtn);

    // find dialog and then the form controls within it
    const dialog = await screen.findByRole('dialog');
    const nameInput = within(dialog).getByLabelText('Nombre');
    const emailInput = within(dialog).getByLabelText('Email');
    const createButton = within(dialog).getByRole('button', { name: 'Crear usuario' });

    fireEvent.change(nameInput, { target: { value: 'Test User' } });
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    const pwdInput = within(dialog).getByLabelText('Password');
    fireEvent.change(pwdInput, { target: { value: 'password123' } });

    // mock register call and subsequent refetch including the new user
    api.post.mockResolvedValueOnce({ data: { id: 99, name: 'Test User', email: 'test@example.com', role: 'student' } });
    api.get.mockResolvedValueOnce({ data: { data: [
      { id: 1, name: 'Admin SmartStudio', email: 'admin@smartstudio.com', role: 'admin' },
      { id: 99, name: 'Test User', email: 'test@example.com', role: 'student' }
    ], meta: { total: 2, total_pages: 1, page: 1, per_page: 20 } } });

    fireEvent.click(createButton);

    // new user should appear in the table
    await waitFor(() => expect(screen.getByText('Test User')).toBeInTheDocument());
  });

  it('can edit and delete a user', async () => {
    // initial list
    api.get.mockResolvedValueOnce({ data: { data: [ { id: 1, name: 'Admin SmartStudio', email: 'admin@smartstudio.com', role: 'admin', active: true } ], meta: { total: 1, total_pages: 1, page: 1, per_page: 20 } } });
    render(<UserAdminPage />);
    await waitFor(() => expect(screen.getByText('Admin SmartStudio')).toBeInTheDocument());

    // open edit for the first user
    const editButtons = screen.getAllByRole('button', { name: /Editar usuario/i });
    fireEvent.click(editButtons[0]);

    const dialog = await screen.findByRole('dialog');
    const nameInput = within(dialog).getByLabelText('Nombre');
    const saveBtn = within(dialog).getByRole('button', { name: /Guardar cambios|Crear usuario/ });

    fireEvent.change(nameInput, { target: { value: 'Admin Edited' } });
    // mock edit calls and subsequent refetch
    api.put.mockResolvedValueOnce({ data: { id: 1 } });
    api.post.mockResolvedValueOnce({ data: { ok: true } }); // role update
    api.get.mockResolvedValueOnce({ data: { data: [ { id: 1, name: 'Admin Edited', email: 'admin@smartstudio.com', role: 'admin', active: true } ], meta: { total: 1 } } });
    fireEvent.click(saveBtn);

    await waitFor(() => expect(screen.getByText('Admin Edited')).toBeInTheDocument());

    // delete flow: confirm and delete
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
    const deleteButtons = screen.getAllByRole('button', { name: /Eliminar usuario/i });
    // mock bulk-deactivate and subsequent refetch with empty list
    api.post.mockResolvedValueOnce({ data: { affected: 1 } });
    api.get.mockResolvedValueOnce({ data: { data: [], meta: { total: 0 } } });
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => expect(screen.queryByText('Admin Edited')).not.toBeInTheDocument());
    window.confirm.mockRestore && window.confirm.mockRestore();
  });
});
