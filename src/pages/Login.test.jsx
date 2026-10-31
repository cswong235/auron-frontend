import { test, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from './Login.jsx'

// Mock Supabase client and logged out state
vi.mock('../supabaseClient', () => ({ supabase: { auth: {} } }))
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ session: null }) }))

test('shows a confirm password field in sign up mode', () => {
  render(<Login />, { wrapper: MemoryRouter })
  fireEvent.click(screen.getByText("Don't have an account? Sign up"))
  expect(screen.getByPlaceholderText('Confirm password')).toBeTruthy()
})

test('rejects sign up when the passwords do not match', () => {
  render(<Login />, { wrapper: MemoryRouter })
  fireEvent.click(screen.getByText("Don't have an account? Sign up"))
  fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'tester@example.com' } })
  fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } })
  fireEvent.change(screen.getByPlaceholderText('Confirm password'), { target: { value: 'password456' } })
  fireEvent.click(screen.getByText('Sign up'))
  expect(screen.getByText('Passwords do not match.')).toBeTruthy()
})
