import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../context/AuthContext';

const api = vi.hoisted(() => ({ listUsers: vi.fn(), updateUser: vi.fn() }));
vi.mock('../api/users', () => api);

import AdminUsersPage from './AdminUsersPage';

function renderPage() {
  return render(<AuthContext.Provider value={{ user: { _id: 'admin-1', role: 'super_admin' } }}><MemoryRouter><AdminUsersPage /></MemoryRouter></AuthContext.Provider>);
}

describe('AdminUsersPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders users returned by the API', async () => {
    api.listUsers.mockResolvedValue({ data: [{ _id: 'member-1', name: 'Avery Student', email: 'avery@example.test', role: 'member', isActive: true, createdAt: '2025-01-01' }], meta: { total: 1, totalPages: 1 } });
    renderPage();
    expect(await screen.findAllByText('Avery Student')).toHaveLength(2);
    expect(screen.getAllByText('Active')).toHaveLength(3);
  });

  it('shows the empty state when no users match', async () => {
    api.listUsers.mockResolvedValue({ data: [], meta: { total: 0, totalPages: 0 } });
    renderPage();
    expect(await screen.findByText('No users found')).toBeInTheDocument();
  });

  it('asks for confirmation before deactivation', async () => {
    api.listUsers.mockResolvedValue({ data: [{ _id: 'member-1', name: 'Avery Student', email: 'avery@example.test', role: 'member', isActive: true, createdAt: '2025-01-01' }], meta: { total: 1, totalPages: 1 } });
    renderPage();
    await screen.findAllByText('Avery Student');
    fireEvent.click(screen.getAllByLabelText('Actions for Avery Student')[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /Deactivate account/ })[0]);
    expect(await screen.findByRole('dialog')).toHaveTextContent('Deactivate this account?');
    expect(api.updateUser).not.toHaveBeenCalled();
  });
});
