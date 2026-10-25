import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const api = vi.hoisted(() => ({ listEvents: vi.fn(), getEvent: vi.fn(), registerForEvent: vi.fn(), unregisterFromEvent: vi.fn(), listMyRegistrations: vi.fn(), createEvent: vi.fn(), updateEvent: vi.fn(), changeEventStatus: vi.fn(), listEventRegistrations: vi.fn() }));
vi.mock('../api/events', () => api);
vi.mock('../api/clubs', () => ({ listClubs: vi.fn().mockResolvedValue({ data: [] }) }));
import EventCard from '../components/events/EventCard';
import EventDetailPage from './EventDetailPage';
import EventFormPage from './EventFormPage';
import MyEventsPage from './MyEventsPage';

const event = { _id: 'event-123', title: 'Robotics workshop', description: 'Build a robot', category: 'workshop', startsAt: '2030-06-12T14:00:00.000Z', endsAt: '2030-06-12T16:00:00.000Z', registrationDeadline: '2030-06-12T13:00:00.000Z', location: 'Engineering Hall', capacity: 10, registeredCount: 8, spotsLeft: 2, status: 'published', visibility: 'public', club: { _id: 'club-1', name: 'Robotics', slug: 'robotics' } };

describe('Phase 6 event pages', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('renders available and full capacity states on event cards', () => {
    const { rerender } = render(<MemoryRouter><EventCard event={event} /></MemoryRouter>);
    expect(screen.getByText('2 spots left')).toBeInTheDocument();
    rerender(<MemoryRouter><EventCard event={{ ...event, spotsLeft: 0, registeredCount: 10 }} /></MemoryRouter>);
    expect(screen.getByText('Full')).toBeInTheDocument();
  });

  it('shows the guest sign-in registration state', async () => {
    api.getEvent.mockResolvedValue(event);
    render(<AuthContext.Provider value={{ user: null, memberships: [] }}><MemoryRouter initialEntries={['/events/event-123']}><Routes><Route path="/events/:id" element={<EventDetailPage />} /><Route path="/login" element={<p>Login page</p>} /></Routes></MemoryRouter></AuthContext.Provider>);
    expect(await screen.findByRole('button', { name: 'Sign in to register' })).toBeInTheDocument();
  });

  it('confirms unregister before changing a registered student', async () => {
    api.getEvent.mockResolvedValue({ ...event, myRegistration: { status: 'registered' } });
    render(<AuthContext.Provider value={{ user: { _id: 'student-1', role: 'member' }, memberships: [] }}><MemoryRouter initialEntries={['/events/event-123']}><Routes><Route path="/events/:id" element={<EventDetailPage />} /></Routes></MemoryRouter></AuthContext.Provider>);
    fireEvent.click(await screen.findByRole('button', { name: 'Unregister' }));
    expect(await screen.findByRole('dialog')).toHaveTextContent('Unregister from this event?');
    expect(api.unregisterFromEvent).not.toHaveBeenCalled();
  });

  it('shows required field errors in the event form', async () => {
    render(<AuthContext.Provider value={{ user: { role: 'super_admin' }, memberships: [] }}><MemoryRouter initialEntries={['/app/events/new']}><Routes><Route path="/app/events/new" element={<EventFormPage />} /></Routes></MemoryRouter></AuthContext.Provider>);
    fireEvent.click(screen.getByRole('button', { name: 'Save draft' }));
    expect(await screen.findByText('Enter an event title.')).toBeInTheDocument();
    expect(screen.getByText('Select a club.')).toBeInTheDocument();
  });

  it('switches My Events tabs and displays the empty state', async () => {
    api.listMyRegistrations.mockResolvedValue({ data: [], meta: { total: 0 } });
    render(<AuthContext.Provider value={{ user: { role: 'member' } }}><MemoryRouter><MyEventsPage /></MemoryRouter></AuthContext.Provider>);
    expect(await screen.findByText('No upcoming registrations')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Past' }));
    await waitFor(() => expect(api.listMyRegistrations).toHaveBeenLastCalledWith({ page: 1, limit: 50, status: 'registered', when: 'past' }));
    expect(await screen.findByText('No past events yet')).toBeInTheDocument();
  });
});
