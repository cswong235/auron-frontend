import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import DayScroller from './DayScroller.jsx'
import { apiFetch } from '../services/helpers'

// Mock the backend
vi.mock('../services/helpers', () => ({ apiFetch: vi.fn(), todayString: () => '2026-11-03' }))

// The test browser can't scroll, so moving a day to the middle does nothing
Element.prototype.scrollIntoView = vi.fn()

// Newest first, the same way the backend sends them
const days = [
  { id: 5, date: '2026-11-05', remaining: '50.00' },
  { id: 4, date: '2026-11-04', remaining: '40.00' },
  { id: 3, date: '2026-11-03', remaining: '30.00' },
  { id: 2, date: '2026-11-02', remaining: '-5.00' },
]
const todaysExpenses = [
  { id: 14, category_name: 'Food', amount_myr: '4.00' },
  { id: 13, category_name: 'Transportation', amount_myr: '3.00' },
  { id: 12, category_name: 'Bills', amount_myr: '2.00' },
  { id: 11, category_name: 'Shopping', amount_myr: '1.00' },
]

beforeEach(() => {
  vi.clearAllMocks()
  apiFetch.mockImplementation(async (path) => {
    if (path === '/daily-budgets?month=2026-11-01') return days
    if (path === '/expenses?day_id=3') return todaysExpenses
    return []
  })
})

// The day's box shows its date number, and the column around it gets the "selected" class
function columnOf(dayNumber) {
  return screen.getByRole('button', { name: dayNumber }).closest('.day-column')
}

test('shows each day, with today selected', async () => {
  render(<DayScroller token="fake-token" currency="MYR" />)
  await screen.findByText('Today')

  expect(columnOf('3').className).toContain('selected')
  expect(columnOf('4').className).not.toContain('selected')
  expect(screen.getByRole('button', { name: '5' })).toBeTruthy()
  expect(screen.getByRole('button', { name: '2' })).toBeTruthy()
})

test('shows a day that went over budget in red', async () => {
  render(<DayScroller token="fake-token" currency="MYR" />)
  const overspent = await screen.findByText('-RM5.00')
  expect(overspent.className).toContain('negative')
})

test("shows only today's 3 newest expenses", async () => {
  render(<DayScroller token="fake-token" currency="MYR" />)

  // Each one shows up twice: in the selected column for desktop, and under the strip for mobile
  expect(await screen.findAllByText('Food')).toHaveLength(2)
  expect(screen.getAllByText('Transportation')).toHaveLength(2)
  expect(screen.getAllByText('Bills')).toHaveLength(2)
  expect(screen.queryByText('Shopping')).toBeNull()
})

test('picking another day selects it and loads its expenses', async () => {
  render(<DayScroller token="fake-token" currency="MYR" />)
  await screen.findByText('Today')
  fireEvent.click(screen.getByRole('button', { name: '2' }))

  expect(columnOf('2').className).toContain('selected')
  await waitFor(() => expect(apiFetch).toHaveBeenCalledWith('/expenses?day_id=2', { token: 'fake-token' }))
  // Expenses can only be added on today
  expect(screen.queryByText('Expense')).toBeNull()
})
