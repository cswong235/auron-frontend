import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from './Login.jsx'
import { supabase } from '../supabaseClient'
import { apiFetch } from '../services/helpers'

// Mock Supabase, the backend and the logged out state
vi.mock('../supabaseClient', () => ({ supabase: { auth: { setSession: vi.fn() } } }))
vi.mock('../services/helpers', () => ({ apiFetch: vi.fn() }))
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ session: null }) }))
// The animated background needs WebGL, which the test browser doesn't have
vi.mock('../components/Aurora', () => ({ default: () => null }))

const SESSION = { access_token: 'fake-token', refresh_token: 'fake-refresh-token' }

beforeEach(() => {
  vi.clearAllMocks()
})

function fillIn(email, password) {
  fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: email } })
  fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: password } })
}

test('shows a confirm password field in sign up mode', () => {
  render(<Login />, { wrapper: MemoryRouter })
  fireEvent.click(screen.getByText("Don't have an account? Sign up"))
  expect(screen.getByPlaceholderText('Confirm password')).toBeTruthy()
})

test('rejects sign up when the passwords do not match', () => {
  render(<Login />, { wrapper: MemoryRouter })
  fireEvent.click(screen.getByText("Don't have an account? Sign up"))
  fillIn('tester@example.com', 'password123')
  fireEvent.change(screen.getByPlaceholderText('Confirm password'), { target: { value: 'password456' } })
  fireEvent.click(screen.getByText('Sign up'))
  expect(screen.getByText('Passwords do not match.')).toBeTruthy()
  expect(apiFetch).not.toHaveBeenCalled()
})

test('logging in sends the details to the backend and saves the session', async () => {
  apiFetch.mockResolvedValue({ session: SESSION })
  render(<Login />, { wrapper: MemoryRouter })
  fillIn('tester@example.com', 'password123')
  fireEvent.click(screen.getByText('Log in'))

  // Wait for the async submit to finish before checking
  await waitFor(() => expect(supabase.auth.setSession).toHaveBeenCalledWith(SESSION))
  expect(apiFetch).toHaveBeenCalledWith('/login', {
    method: 'POST',
    body: { email: 'tester@example.com', password: 'password123' },
  })
})

test('signing up sends the details to the sign up route', async () => {
  apiFetch.mockResolvedValue({ session: SESSION })
  render(<Login />, { wrapper: MemoryRouter })
  fireEvent.click(screen.getByText("Don't have an account? Sign up"))
  fillIn('tester@example.com', 'password123')
  fireEvent.change(screen.getByPlaceholderText('Confirm password'), { target: { value: 'password123' } })
  fireEvent.click(screen.getByText('Sign up'))

  await waitFor(() => expect(supabase.auth.setSession).toHaveBeenCalledWith(SESSION))
  expect(apiFetch).toHaveBeenCalledWith('/signup', {
    method: 'POST',
    body: { email: 'tester@example.com', password: 'password123' },
  })
})

test('shows the error from the backend when logging in fails', async () => {
  apiFetch.mockRejectedValue(new Error('Invalid login credentials'))
  render(<Login />, { wrapper: MemoryRouter })
  fillIn('tester@example.com', 'wrong')
  fireEvent.click(screen.getByText('Log in'))

  expect(await screen.findByText('Invalid login credentials')).toBeTruthy()
  expect(supabase.auth.setSession).not.toHaveBeenCalled()
})
