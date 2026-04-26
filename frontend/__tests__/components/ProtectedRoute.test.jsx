import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProtectedRoute from '../../src/components/ProtectedRoute';

const makeStore = ({ user = null, token = null, initialized = true } = {}) =>
  configureStore({
    reducer: {
      auth: () => ({ user, token, initialized }),
    },
  });

const PROTECTED_TEXT = 'Protected content';
const LOGIN_TEXT     = 'Login page';

const renderWithRouter = ({
  store,
  allowedRoles,
  initialPath = '/dashboard',
} = {}) =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
            <Route path="/dashboard" element={<div>{PROTECTED_TEXT}</div>} />
          </Route>
          <Route path="/login"       element={<div>{LOGIN_TEXT}</div>} />
          <Route path="/unauthorized" element={<div>403 Access Denied</div>} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );

describe('ProtectedRoute', () => {
  describe('while auth is not yet initialized', () => {
    it('renders a loading spinner and neither the outlet nor the login page', () => {
      const store = makeStore({ initialized: false, token: null, user: null });
      renderWithRouter({ store });

      expect(screen.queryByText(PROTECTED_TEXT)).not.toBeInTheDocument();
      expect(screen.queryByText(LOGIN_TEXT)).not.toBeInTheDocument();
      // The spinner exists (ProtectedRoute renders it while uninitialized)
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('when the user is not authenticated', () => {
    it('redirects to /login when token is null', () => {
      const store = makeStore({ token: null, user: null });
      renderWithRouter({ store });

      expect(screen.getByText(LOGIN_TEXT)).toBeInTheDocument();
      expect(screen.queryByText(PROTECTED_TEXT)).not.toBeInTheDocument();
    });

    it('redirects to /login when token exists but user is null', () => {
      // Can happen briefly between page load and fetchMe resolving
      const store = makeStore({ token: 'some-jwt', user: null });
      renderWithRouter({ store });

      expect(screen.getByText(LOGIN_TEXT)).toBeInTheDocument();
      expect(screen.queryByText(PROTECTED_TEXT)).not.toBeInTheDocument();
    });

    it('redirects to /login when both token and user are missing', () => {
      const store = makeStore();
      renderWithRouter({ store });

      expect(screen.getByText(LOGIN_TEXT)).toBeInTheDocument();
    });
  });

  describe('when the user is authenticated', () => {
    const candidateUser   = { id: '1', role: 'candidate',  email: 'c@test.com' };
    const recruiterUser   = { id: '2', role: 'recruiter',  email: 'r@test.com' };
    const adminUser       = { id: '3', role: 'admin',      email: 'a@test.com' };

    it('renders the outlet for a candidate accessing a candidate-only route', () => {
      const store = makeStore({ user: candidateUser, token: 'tok' });
      renderWithRouter({ store, allowedRoles: ['candidate'] });

      expect(screen.getByText(PROTECTED_TEXT)).toBeInTheDocument();
      expect(screen.queryByText(LOGIN_TEXT)).not.toBeInTheDocument();
    });

    it('renders the outlet for a recruiter accessing a recruiter-only route', () => {
      const store = makeStore({ user: recruiterUser, token: 'tok' });
      renderWithRouter({ store, allowedRoles: ['recruiter'] });

      expect(screen.getByText(PROTECTED_TEXT)).toBeInTheDocument();
    });

    it('renders the outlet for an admin when both recruiter and admin are allowed', () => {
      const store = makeStore({ user: adminUser, token: 'tok' });
      renderWithRouter({ store, allowedRoles: ['recruiter', 'admin'] });

      expect(screen.getByText(PROTECTED_TEXT)).toBeInTheDocument();
    });

    it('renders the outlet when no allowedRoles are specified (any authenticated user)', () => {
      const store = makeStore({ user: candidateUser, token: 'tok' });
      renderWithRouter({ store }); // no allowedRoles prop

      expect(screen.getByText(PROTECTED_TEXT)).toBeInTheDocument();
    });
  });

  describe('when the user has the wrong role', () => {
    it('redirects a candidate away from a recruiter-only route', () => {
      const store = makeStore({
        user: { id: '1', role: 'candidate', email: 'c@test.com' },
        token: 'tok',
      });
      renderWithRouter({ store, allowedRoles: ['recruiter'] });

      expect(screen.getByText('403 Access Denied')).toBeInTheDocument();
      expect(screen.queryByText(PROTECTED_TEXT)).not.toBeInTheDocument();
    });

    it('redirects a recruiter away from a candidate-only route', () => {
      const store = makeStore({
        user: { id: '2', role: 'recruiter', email: 'r@test.com' },
        token: 'tok',
      });
      renderWithRouter({ store, allowedRoles: ['candidate'] });

      expect(screen.getByText('403 Access Denied')).toBeInTheDocument();
      expect(screen.queryByText(PROTECTED_TEXT)).not.toBeInTheDocument();
    });

    it('does not show the login page on a role mismatch (it is not a 401)', () => {
      const store = makeStore({
        user: { id: '1', role: 'candidate', email: 'c@test.com' },
        token: 'tok',
      });
      renderWithRouter({ store, allowedRoles: ['recruiter'] });

      expect(screen.queryByText(LOGIN_TEXT)).not.toBeInTheDocument();
    });
  });
});