import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import UserAdminPage from '../UserAdminPage';
import mockApi from '../../lib/mockApi';

vi.mock('../../lib/mockApi', () => ({
  default: {
    getUsers: vi.fn().mockResolvedValue([{ id: 1, name: 'Admin SmartStudio', email: 'admin@smartstudio.com', role: 'admin' }]),
    createUser: vi.fn().mockResolvedValue({ id: 99, name: 'Test User', email: 'test@example.com', role: 'student' }),
    updateUser: vi.fn().mockResolvedValue({ id:1, name: 'Admin SmartStudio', email: 'admin@smartstudio.com', role: 'admin' }),
    deleteUser: vi.fn().mockResolvedValue({ success: true })
  }
}));

describe('UserAdminPage', () => {
  it('renders existing users and can create a new user (mock)', async () => {
    render(<UserAdminPage />);

    // wait for initial user to appear
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

    fireEvent.click(createButton);

    // new user should appear in the table
    await waitFor(() => expect(screen.getByText('Test User')).toBeInTheDocument());
  });

  it('can edit and delete a user', async () => {
    // ensure updateUser will return the edited name
    mockApi.updateUser.mockResolvedValue({ id:1, name: 'Admin Edited', email: 'admin@smartstudio.com', role: 'admin', active: true });

    render(<UserAdminPage />);
    await waitFor(() => expect(screen.getByText('Admin SmartStudio')).toBeInTheDocument());

    // open edit for the first user
    const editButtons = screen.getAllByRole('button', { name: /Editar usuario/i });
    fireEvent.click(editButtons[0]);

    const dialog = await screen.findByRole('dialog');
    const nameInput = within(dialog).getByLabelText('Nombre');
    const saveBtn = within(dialog).getByRole('button', { name: /Guardar cambios|Crear usuario/ });

    fireEvent.change(nameInput, { target: { value: 'Admin Edited' } });
    fireEvent.click(saveBtn);

    await waitFor(() => expect(screen.getByText('Admin Edited')).toBeInTheDocument());

    // delete flow: confirm and delete
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
    const deleteButtons = screen.getAllByRole('button', { name: /Eliminar usuario/i });
    fireEvent.click(deleteButtons[0]);
    await waitFor(() => expect(screen.queryByText('Admin Edited')).not.toBeInTheDocument());
    window.confirm.mockRestore && window.confirm.mockRestore();
  });
});
