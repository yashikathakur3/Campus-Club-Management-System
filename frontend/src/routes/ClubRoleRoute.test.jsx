import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ClubRoleRoute from './ClubRoleRoute';

describe('ClubRoleRoute', () => {
  it('sends a member without an active president membership to forbidden', () => {
    render(<AuthContext.Provider value={{ user: { role: 'member' }, memberships: [{ club: { _id: 'club-1' }, status: 'active', clubRole: 'member' }] }}><MemoryRouter initialEntries={['/app/clubs/club-1/manage']}><Routes><Route path="/app/clubs/:id/manage" element={<ClubRoleRoute />}><Route index element={<p>Manage club</p>} /></Route><Route path="/forbidden" element={<p>Forbidden</p>} /></Routes></MemoryRouter></AuthContext.Provider>);
    expect(screen.getByText('Forbidden')).toBeInTheDocument();
  });

  it('allows the active president membership for its matching club', () => {
    render(<AuthContext.Provider value={{ user: { role: 'member' }, memberships: [{ club: { _id: 'club-1' }, status: 'active', clubRole: 'president' }] }}><MemoryRouter initialEntries={['/app/clubs/club-1/manage']}><Routes><Route path="/app/clubs/:id/manage" element={<ClubRoleRoute />}><Route index element={<p>Manage club</p>} /></Route><Route path="/forbidden" element={<p>Forbidden</p>} /></Routes></MemoryRouter></AuthContext.Provider>);
    expect(screen.getByText('Manage club')).toBeInTheDocument();
  });
});
