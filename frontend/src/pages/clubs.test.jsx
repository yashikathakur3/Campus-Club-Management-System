import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../context/AuthContext';

const api = vi.hoisted(() => ({ listClubs: vi.fn(), getClub: vi.fn(), joinClub: vi.fn(), leaveClub: vi.fn(), listClubMembers: vi.fn(), updateClubMember: vi.fn(), setClubStatus: vi.fn(), transferPresidency: vi.fn() }));
vi.mock('../api/clubs', () => api);

import ClubCard from '../components/clubs/ClubCard';
import ClubDirectoryPage from './ClubDirectoryPage';
import ClubDetailPage from './ClubDetailPage';
import ManageClubPage from './ManageClubPage';

const club = { _id: 'club-1', slug: 'makers', name: 'Makers Club', category: 'technical', description: 'Build things together', joinPolicy: 'open', memberCount: 4, isActive: true };

describe('Phase 5 club pages', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a pending membership state on a club card', () => {
    render(<AuthContext.Provider value={{ user: { _id: 'user-1' }, memberships: [] }}><MemoryRouter><ClubCard club={club} membership={{ status: 'pending' }} /></MemoryRouter></AuthContext.Provider>);
    expect(screen.getByRole('button', { name: 'Request pending' })).toBeInTheDocument();
  });

  it('joins an open club from its card and refreshes the session memberships', async () => {
    const refreshMe = vi.fn().mockResolvedValue({});
    api.joinClub.mockResolvedValue({ status: 'active', clubRole: 'member' });
    render(<AuthContext.Provider value={{ user: { _id: 'user-1' }, memberships: [], refreshMe }}><MemoryRouter><ClubCard club={club} /></MemoryRouter></AuthContext.Provider>);
    fireEvent.click(screen.getByRole('button', { name: 'Join club' }));
    await vi.waitFor(() => expect(api.joinClub).toHaveBeenCalledWith('club-1'));
    expect(refreshMe).toHaveBeenCalledOnce();
    expect(await screen.findByRole('button', { name: 'Joined' })).toBeInTheDocument();
  });

  it('sends a guest from Join to login with the club detail as the return path', async () => {
    api.getClub.mockResolvedValue({ club, president: null, coordinators: [], myMembership: null });
    render(<AuthContext.Provider value={{ user: null, refreshMe: vi.fn() }}><MemoryRouter initialEntries={['/clubs/makers']}><Routes><Route path="/clubs/:id" element={<ClubDetailPage />} /><Route path="/login" element={<p>Login return: {window.location.pathname}</p>} /></Routes></MemoryRouter></AuthContext.Provider>);
    fireEvent.click(await screen.findByRole('button', { name: 'Join club' }));
    expect(await screen.findByText(/Login return/)).toBeInTheDocument();
  });

  it('shows directory empty and error states', async () => {
    api.listClubs.mockResolvedValueOnce({ data: [], meta: { total: 0, totalPages: 0 } }).mockRejectedValueOnce({ message: 'Directory unavailable' });
    const { unmount } = render(<AuthContext.Provider value={{ user: null, memberships: [] }}><MemoryRouter><ClubDirectoryPage /></MemoryRouter></AuthContext.Provider>);
    expect(await screen.findByText('No clubs match those filters')).toBeInTheDocument();
    unmount();
    render(<AuthContext.Provider value={{ user: null, memberships: [] }}><MemoryRouter><ClubDirectoryPage /></MemoryRouter></AuthContext.Provider>);
    expect(await screen.findByRole('alert')).toHaveTextContent('Directory unavailable');
  });

  it('confirms removal before calling the membership API', async () => {
    api.getClub.mockResolvedValue({ club, myMembership: { clubRole: 'president', status: 'active' } });
    const row = { _id: 'membership-1', user: { _id: 'member-1', name: 'Member One', email: 'member@example.test' }, clubRole: 'member', canAnnounce: false };
    api.listClubMembers.mockResolvedValue({ data: [row], meta: { total: 1, totalPages: 1 } });
    api.updateClubMember.mockResolvedValue({ ...row, status: 'removed' });
    render(<AuthContext.Provider value={{ user: { role: 'super_admin' }, refreshMe: vi.fn() }}><MemoryRouter initialEntries={['/app/clubs/makers/manage']}><Routes><Route path="/app/clubs/:id/manage" element={<ManageClubPage />} /></Routes></MemoryRouter></AuthContext.Provider>);
    fireEvent.click(await screen.findByRole('button', { name: 'Remove' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent('Remove this member?');
    expect(api.updateClubMember).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Remove member' }));
    await vi.waitFor(() => expect(api.updateClubMember).toHaveBeenCalledOnce());
    expect(api.updateClubMember).toHaveBeenCalledWith('makers', 'member-1', { status: 'removed' });
  });
});
