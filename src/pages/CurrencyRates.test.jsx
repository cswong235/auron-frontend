import { test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import CurrencyRates from './CurrencyRates.jsx'
import { apiFetch } from '../services/helpers'

// Mock the logged in user and the backend
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ session: { access_token: 'fake-token' } }) }))
vi.mock('../services/helpers', () => ({ apiFetch: vi.fn() }))

test('shows a card with the rate for each currency', async () => {
  apiFetch.mockResolvedValue([
    { currency: 'MYR', rate: '1.00000000', rate_date: '2026-11-04' },
    { currency: 'BRL', rate: '1.34480000', rate_date: '2026-11-04' },
    { currency: 'SGD', rate: '0.31444000', rate_date: '2026-11-06' },
    { currency: 'IDR', rate: '4460.90000000', rate_date: '2026-11-06' },
  ])
  render(<CurrencyRates />)

  expect(await screen.findByText('S$0.3144')).toBeTruthy()
  expect(screen.getByText('Rp4,460.9')).toBeTruthy()
  expect(screen.getByText('RM1')).toBeTruthy()
  expect(screen.getByText('Rates from 2026-11-06')).toBeTruthy()
  expect(screen.getByText('Currency converter')).toBeTruthy()
  expect(apiFetch).toHaveBeenCalledWith('/exchange-rates', { token: 'fake-token' })
})

test('shows the error if the rates fail to load', async () => {
  apiFetch.mockRejectedValue(new Error('Something went wrong, please check back again later.'))
  render(<CurrencyRates />)
  expect(await screen.findByText('Something went wrong, please check back again later.')).toBeTruthy()
})
