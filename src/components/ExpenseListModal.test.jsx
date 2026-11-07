import { test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ExpenseListModal from './ExpenseListModal.jsx'
import { apiFetch } from '../services/helpers'

vi.mock('../services/helpers', () => ({ apiFetch: vi.fn() }))

const expense = {
  id: 1,
  name: 'Noodles',
  category_name: 'Food',
  description: null,
  amount_myr: '10.00',
  deduction_option: 'today',
  created_at: '2026-11-02T08:35:00Z',
}
const pastDay = { id: 2, date: '2026-11-02', remaining: '20.00' }
const today = { id: 3, date: '2026-11-03', remaining: '30.00' }

beforeEach(() => {
  vi.clearAllMocks()
  apiFetch.mockImplementation(async (path) => {
    if (path.startsWith('/expenses?day_id=')) return [expense]
    return { message: 'Expense deleted' }
  })
})

function renderList(day, isToday, onEdit, onChanged) {
  render(
    <ExpenseListModal token="fake-token" day={day} isToday={isToday} symbol="RM" onClose={vi.fn()} onEdit={onEdit} onChanged={onChanged} />
  )
}

test("shows a past day's expenses with edit and delete greyed out", async () => {
  renderList(pastDay, false, vi.fn(), vi.fn())

  expect(await screen.findByText('Noodles')).toBeTruthy()
  expect(screen.getByText("2 November's expenses")).toBeTruthy()
  expect(screen.getByText('No description')).toBeTruthy()
  expect(screen.getByLabelText('Edit Noodles').disabled).toBe(true)
  expect(screen.getByLabelText('Delete Noodles').disabled).toBe(true)
})

test("editing today's expense opens it in the form", async () => {
  const onEdit = vi.fn()
  renderList(today, true, onEdit, vi.fn())
  fireEvent.click(await screen.findByLabelText('Edit Noodles'))
  expect(onEdit).toHaveBeenCalledWith(expense)
})

test("deleting today's expense asks first, then deletes it", async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  const onChanged = vi.fn()
  renderList(today, true, vi.fn(), onChanged)
  fireEvent.click(await screen.findByLabelText('Delete Noodles'))

  await waitFor(() => expect(onChanged).toHaveBeenCalled())
  expect(window.confirm).toHaveBeenCalledWith('Delete "Noodles"?')
  expect(apiFetch).toHaveBeenCalledWith('/expenses/1', { method: 'DELETE', token: 'fake-token' })
})

test('cancelling the delete leaves the expense alone', async () => {
  vi.spyOn(window, 'confirm').mockReturnValue(false)
  const onChanged = vi.fn()
  renderList(today, true, vi.fn(), onChanged)
  fireEvent.click(await screen.findByLabelText('Delete Noodles'))

  expect(apiFetch).not.toHaveBeenCalledWith('/expenses/1', { method: 'DELETE', token: 'fake-token' })
  expect(onChanged).not.toHaveBeenCalled()
})
