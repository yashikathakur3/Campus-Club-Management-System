import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../context/AuthContext';
import ProfilePage from './ProfilePage';

vi.mock('../api/auth', () => ({ updateMe: vi.fn(), changePassword: vi.fn() }));

describe('ProfilePage', () => {
  it('shows validation errors for invalid profile data', async () => {
    render(<AuthContext.Provider value={{ user: { name: 'Test User', email: 'test@example.test', role: 'member' }, updateUser: vi.fn() }}><MemoryRouter><ProfilePage /></MemoryRouter></AuthContext.Provider>);
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save profile' }));
    expect(await screen.findByText('Name must be 2 to 80 characters.')).toBeInTheDocument();
  });
});
