import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const authMocks = vi.hoisted(() => ({ getMe: vi.fn(), login: vi.fn(), register: vi.fn() }));
vi.mock('../api/auth', () => authMocks);

import { AuthProvider, useAuth } from './AuthContext';
import { AUTH_STORAGE_KEY } from '../auth/storage';

function SessionStatus() {
  const { loading, user, logout } = useAuth();
  return <div>{loading ? <span>Loading session</span> : <span>{user?.name || 'Signed out'}</span>}<button type="button" onClick={logout}>Log out</button></div>;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
  });
  afterEach(() => window.localStorage.clear());

  it('restores a stored token from /me on app load', async () => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, 'persisted-session-token');
    authMocks.getMe.mockResolvedValue({ user: { name: 'Jordan Member' }, memberships: [] });
    render(<AuthProvider><SessionStatus /></AuthProvider>);
    expect(await screen.findByText('Jordan Member')).toBeInTheDocument();
    expect(authMocks.getMe).toHaveBeenCalledOnce();
    expect(window.localStorage.length).toBe(1);
  });

  it('clears the stored token on logout', async () => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, 'session-token');
    authMocks.getMe.mockResolvedValue({ user: { name: 'Jordan Member' }, memberships: [] });
    render(<AuthProvider><SessionStatus /></AuthProvider>);
    expect(await screen.findByText('Jordan Member')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Log out' }));
    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(await screen.findByText('Signed out')).toBeInTheDocument();
  });
});
