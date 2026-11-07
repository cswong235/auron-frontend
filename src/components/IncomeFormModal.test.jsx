import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import IncomeFormModal from './IncomeFormModal.jsx'
import { apiFetch } from '../services/helpers'

vi.mock('../services/helpers', () => ({ apiFetch: vi.fn() }))

// Today is 3 November, so there are 28 days left in the month counting today
const today = { id: 3, date: '2026-11-03', remaining: '30.00' }
const lastDay = { id: 30, date: '2026-11-30', remaining: '30.00' }

beforeEach(() => {
  vi.clearAllMocks()
  apiFetch.mockImplementation(async (path) => {
    if (path === '/categories?type=income') return [{ id: 8, name: 'Other' }, { id: 9, name: 'Salary' }]
    if (path === '/settings') return { default_currency: 'MYR', default_income: 'today' }
    return { message: 'Income added' }
  })
})

function renderForm(day, onSaved) {
  render(<IncomeFormModal token="fake-token" day={day} displayCurrency="MYR" symbol="RM" onClose={vi.fn()} onSaved={onSaved} />)
}

// Fill in the form once the categories and settings have loaded
async function fillIn(amount) {
  await waitFor(() => expect(screen.getByLabelText('Category').disabled).toBe(false))
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Freelance' } })
  fireEvent.change(screen.getByLabelText('Category'), { target: { value: '9' } })
  fireEvent.change(screen.getByLabelText('Amount'), { target: { value: amount } })
}

test("logs an income that's added to today", async () => {
  const onSaved = vi.fn()
  renderForm(today, onSaved)
  await fillIn('10')
  expect(screen.getByText("You'll have RM40.00 in total")).toBeTruthy()
  fireEvent.click(screen.getByText('Save'))

  await waitFor(() => expect(onSaved).toHaveBeenCalled())
  expect(apiFetch).toHaveBeenCalledWith('/incomes', {
    method: 'POST',
    token: 'fake-token',
    body: { name: 'Freelance', description: '', category_id: '9', amount: 10, currency: 'MYR', distribution: 'today' },
  })
})

test('distributing shows how much each day gains and logs it that way', async () => {
  const onSaved = vi.fn()
  renderForm(today, onSaved)
  await fillIn('100')
  fireEvent.click(screen.getByText('Distribute income'))

  // RM100 over 28 days is at least RM3.57 a day
  expect(screen.getByText("Each remaining day's budget will have an additional RM3.57")).toBeTruthy()
  fireEvent.click(screen.getByText('Save'))

  await waitFor(() => expect(onSaved).toHaveBeenCalled())
  expect(apiFetch).toHaveBeenCalledWith('/incomes', {
    method: 'POST',
    token: 'fake-token',
    body: { name: 'Freelance', description: '', category_id: '9', amount: 100, currency: 'MYR', distribution: 'spread' },
  })
})

test("can't distribute on the last day of the month", async () => {
  renderForm(lastDay, vi.fn())
  await waitFor(() => expect(screen.getByLabelText('Category').disabled).toBe(false))
  expect(screen.getByText('Distribute income').closest('button').disabled).toBe(true)
})
