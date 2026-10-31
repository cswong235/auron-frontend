import { test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute.jsx'
import { useAuth } from '../context/AuthContext'

vi.mock('../context/AuthContext', () => ({ useAuth: vi.fn() }))

// Recreated a small fragment of the app containing the login screen and a protected page
function renderApp() {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<p>Feed page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

test('sends logged out users to the login page', () => {
  useAuth.mockReturnValue({ session: null, loading: false })
  renderApp()
  expect(screen.getByText('Login page')).toBeTruthy()
})

test('shows the page to logged in users', () => {
  useAuth.mockReturnValue({ session: { access_token: 'fake-token' }, loading: false })
  renderApp()
  expect(screen.getByText('Feed page')).toBeTruthy()
})
