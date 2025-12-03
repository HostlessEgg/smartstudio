import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MessagingComponent from '../../components/MessagingComponent';

describe('MessagingComponent', () => {
  test('renders header and existing messages and can send a new message', () => {
    render(<MessagingComponent />);

    // header and seed message present
    expect(screen.getByText(/Mensajes/i)).toBeInTheDocument();
    expect(screen.getByText(/Hola, ¿cómo estás\?/i)).toBeInTheDocument();

    const input = screen.getByPlaceholderText(/Escribe un mensaje/i);
    fireEvent.change(input, { target: { value: 'Prueba unit' } });
    const btn = screen.getByRole('button', { name: /Enviar/i });
    fireEvent.click(btn);

    // new message should appear
    expect(screen.getByText(/Prueba unit/i)).toBeInTheDocument();
  });
});
