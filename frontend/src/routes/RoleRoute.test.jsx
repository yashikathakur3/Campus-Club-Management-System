import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import RoleRoute from './RoleRoute';

describe('RoleRoute', () => {
  it('redirects an authenticated member to forbidden', () => {
    render(<AuthContext.Provider value={{ user: { role: 'member' } }}><MemoryRouter initialEntries={['/app/admin/users']}><Routes><Route element={<RoleRoute allowedRoles={['super_admin']} />}><Route path="/app/admin/users" element={<p>Admin users</p>} /></Route><Route path="/forbidden" element={<p>Forbidden page</p>} /></Routes></MemoryRouter></AuthContext.Provider>);
    expect(screen.getByText('Forbidden page')).toBeInTheDocument();
    expect(screen.queryByText('Admin users')).not.toBeInTheDocument();
  });
});
