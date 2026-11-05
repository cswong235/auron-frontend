import { useEffect, useState } from 'react';
import { Alert, Button, Modal } from 'react-bootstrap';
import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon, PencilEdit02Icon } from '@hugeicons/core-free-icons';
import { apiFetch } from '../services/helpers';
import { formatMoney } from '../services/currencies';
import './Expenses.css';

// Shows all of a day's expenses. They can only be edited or deleted on today
export default function ExpenseListModal({ token, day, isToday, symbol, onClose, onEdit, onChanged }) {
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // e.g. "2026-11-03" becomes "3 November"
  const [year, month, date] = day.date.split('-').map(Number);
  const dayName = new Date(year, month - 1, date).toLocaleDateString('en-MY', { day: 'numeric', month: 'long' });

  function fetchExpenses() {
    return apiFetch(`/expenses?day_id=${day.id}`, { token })
      .then(setExpenses)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchExpenses();
  }, []);

  async function handleDelete(expense) {
    if (!window.confirm(`Delete "${expense.name}"?`)) {
      return;
    }

    setError('');
    try {
      await apiFetch(`/expenses/${expense.id}`, { method: 'DELETE', token });
      fetchExpenses();
      onChanged();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <Modal show onHide={onClose} centered scrollable>
      <Modal.Header>
        <Modal.Title className="expense-title">
          {isToday ? "Today's expenses" : `${dayName}'s expenses`}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && <Alert variant="danger" className="py-2">{error}</Alert>}
        {loading && <p className="expense-label">Loading expenses...</p>}
        {!loading && expenses.length === 0 && <p className="expense-label">No expenses on this day.</p>}

        {expenses.map((expense) => (
          <div key={expense.id} className="expense-card">
            <div className="expense-card-row">
              <div>
                <strong>{expense.name}</strong>
                <span className="expense-tag">{expense.category_name}</span>
                {/* The full amount won't match what left this day, so point out that it was split */}
                {expense.deduction_option === 'spread' && <span className="expense-tag">Spread</span>}
              </div>

              {/* Greyed out once the day is over, since the expense is locked */}
              <div className="expense-card-buttons">
                <button
                  type="button"
                  className="expense-icon-button"
                  onClick={() => onEdit(expense)}
                  disabled={!isToday}
                  aria-label={`Edit ${expense.name}`}
                >
                  <HugeiconsIcon icon={PencilEdit02Icon} size={18} />
                </button>
                <button
                  type="button"
                  className="expense-icon-button"
                  onClick={() => handleDelete(expense)}
                  disabled={!isToday}
                  aria-label={`Delete ${expense.name}`}
                >
                  <HugeiconsIcon icon={Delete02Icon} size={18} />
                </button>
              </div>
            </div>

            <p className="expense-description">{expense.description || <em>No description</em>}</p>

            <div className="expense-card-row">
              <span className="expense-time">
                {new Date(expense.created_at).toLocaleTimeString('en-MY', { hour: 'numeric', minute: '2-digit' })}
              </span>
              <span className="expense-amount">{formatMoney(-Number(expense.amount_myr), symbol)}</span>
            </div>
          </div>
        ))}
      </Modal.Body>

      <Modal.Footer className="flex-column align-items-stretch">
        <div className="expense-card-row">
          <span className="expense-label mb-0">Remaining amount</span>
          <span className="expense-amount">{formatMoney(day.remaining, symbol)}</span>
        </div>
        <Button variant="outline-secondary" className="align-self-end" onClick={onClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
