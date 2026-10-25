import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';

describe('ProtectedRoute', () => {
  it('redirects unauthenticated visitors to login', () => {
    render(
      <AuthContext.Provider value={{ user: null }}>
        <MemoryRouter initialEntries={['/app/dashboard']}>
          <Routes>
            <Route path="/app" element={<ProtectedRoute />}><Route path="dashboard" element={<p>Private dashboard</p>} /></Route>
            <Route path="/login" element={<p>Login screen</p>} />
          </Routes>
        </MemoryRouter>
      </AuthContext.Provider>,
    );
    expect(screen.getByText('Login screen')).toBeInTheDocument();
    expect(screen.queryByText('Private dashboard')).not.toBeInTheDocument();
  });
});
