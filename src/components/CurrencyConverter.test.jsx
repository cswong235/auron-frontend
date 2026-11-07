import { test, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CurrencyConverter from './CurrencyConverter.jsx'

const currencies = [
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', rate: 1 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', rate: 0.31444 },
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 0.24606 },
]

test('shows no result until an amount is typed in', () => {
  render(<CurrencyConverter currencies={currencies} />)
  expect(screen.queryByText(/=/)).toBeNull()
})

test('converts ringgit to US dollars to start with', () => {
  render(<CurrencyConverter currencies={currencies} />)
  fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '100' } })
  expect(screen.getByText('RM100.00 = $24.61')).toBeTruthy()
})

test('converts between the two currencies that are picked', () => {
  render(<CurrencyConverter currencies={currencies} />)
  fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '100' } })
  fireEvent.change(screen.getByLabelText('From'), { target: { value: 'SGD' } })
  expect(screen.getByText('S$100.00 = $78.25')).toBeTruthy()
})
