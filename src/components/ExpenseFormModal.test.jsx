import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ExpenseFormModal from './ExpenseFormModal.jsx'
import { apiFetch } from '../services/helpers'

vi.mock('../services/helpers', () => ({ apiFetch: vi.fn() }))

// Today is 3 November, so there are 28 days left in the month counting today
const today = { id: 3, date: '2026-11-03', remaining: '30.00' }
const lastDay = { id: 30, date: '2026-11-30', remaining: '30.00' }

beforeEach(() => {
  vi.clearAllMocks()
  apiFetch.mockImplementation(async (path) => {
    if (path === '/categories?type=expense') return [{ id: 1, name: 'Food' }, { id: 5, name: 'Bills' }]
    if (path === '/settings') return { default_currency: 'MYR', default_deduction: 'today' }
    return { message: 'Expense added' }
  })
})

function renderForm(day, onSaved) {
  render(
    <ExpenseFormModal token="fake-token" day={day} displayCurrency="MYR" symbol="RM" onClose={vi.fn()} onSaved={onSaved} />
  )
}

// Fill in the form once the categories and settings have loaded
async function fillIn(amount) {
  await waitFor(() => expect(screen.getByLabelText('Category').disabled).toBe(false))
  fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Noodles' } })
  fireEvent.change(screen.getByLabelText('Category'), { target: { value: '1' } })
  fireEvent.change(screen.getByLabelText('Amount'), { target: { value: amount } })
}

test('Save stays disabled until the form is filled in', async () => {
  renderForm(today, vi.fn())
  expect(screen.getByText('Save').closest('button').disabled).toBe(true)
  await fillIn('10')
  expect(screen.getByText('Save').closest('button').disabled).toBe(false)
})

test('logs an expense that comes out of today', async () => {
  const onSaved = vi.fn()
  renderForm(today, onSaved)
  await fillIn('10')
  expect(screen.getByText("You'll have RM20.00 left")).toBeTruthy()
  fireEvent.click(screen.getByText('Save'))

  await waitFor(() => expect(onSaved).toHaveBeenCalled())
  expect(apiFetch).toHaveBeenCalledWith('/expenses', {
    method: 'POST',
    token: 'fake-token',
    body: { name: 'Noodles', description: '', category_id: '1', amount: 10, currency: 'MYR', deduction_option: 'today' },
  })
})

test('redistributing shows how much each day loses and logs it that way', async () => {
  const onSaved = vi.fn()
  renderForm(today, onSaved)
  await fillIn('100')
  fireEvent.click(screen.getByText('Redistribute cost'))

  // RM100 over 28 days is RM3.57 a day, and the first few days take one cent more
  expect(screen.getByText("Each remaining day's budget will be subtracted by RM3.58")).toBeTruthy()
  fireEvent.click(screen.getByText('Save'))

  await waitFor(() => expect(onSaved).toHaveBeenCalled())
  expect(apiFetch).toHaveBeenCalledWith('/expenses', {
    method: 'POST',
    token: 'fake-token',
    body: { name: 'Noodles', description: '', category_id: '1', amount: 100, currency: 'MYR', deduction_option: 'spread' },
  })
})

test("can't redistribute on the last day of the month", async () => {
  renderForm(lastDay, vi.fn())
  await waitFor(() => expect(screen.getByLabelText('Category').disabled).toBe(false))
  expect(screen.getByText('Redistribute cost').closest('button').disabled).toBe(true)
  expect(screen.getByText('Not available on the last day of the month')).toBeTruthy()
})
