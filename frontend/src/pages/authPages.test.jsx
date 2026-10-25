import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../context/AuthContext';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';

function renderWithAuth(page, context) {
  return render(<AuthContext.Provider value={context}><MemoryRouter>{page}</MemoryRouter></AuthContext.Provider>);
}

describe('authentication forms', () => {
  it('shows a server error from a failed login request', async () => {
    const login = vi.fn().mockRejectedValue({ code: 'UNAUTHENTICATED', message: 'Invalid email or password' });
    renderWithAuth(<LoginPage />, { login });
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'student@example.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'WrongPass123' } });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password');
    expect(login).toHaveBeenCalledOnce();
  });

  it('shows field errors for a weak registration password without submitting', async () => {
    const register = vi.fn();
    renderWithAuth(<RegisterPage />, { register });
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Taylor Student' } });
    fireEvent.change(screen.getByLabelText('Email address'), { target: { value: 'taylor@example.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'weak' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument());
    expect(register).not.toHaveBeenCalled();
  });
});
