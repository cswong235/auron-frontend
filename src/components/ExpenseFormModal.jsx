import { useEffect, useState } from 'react';
import { Alert, Button, Col, Form, InputGroup, Modal, Row } from 'react-bootstrap';
import { HugeiconsIcon } from '@hugeicons/react';
import { CalendarCheckIn01Icon, DistributeHorizontalCenterIcon, Tick02Icon } from '@hugeicons/core-free-icons';
import { apiFetch } from '../services/helpers';
import { CURRENCIES, formatMoney } from '../services/currencies';
import './Expenses.css';

// Adds a new expense, or edits one if an expense is passed in
// day is today's row, since expenses can only be added or changed on today
export default function ExpenseFormModal({ token, day, expense, displayCurrency, symbol, onClose, onSaved }) {
  // New expense means that there's no expense passed through, which = true
  // If there's an expense, it's false, and other fields that detect isNew will be in edit mode
  const isNew = !expense;

  const [categories, setCategories] = useState([]);
  const [name, setName] = useState(isNew ? '' : expense.name);
  const [description, setDescription] = useState(isNew ? '' : expense.description || '');
  const [categoryId, setCategoryId] = useState(isNew ? '' : expense.category_id);
  const [amount, setAmount] = useState(isNew ? '' : expense.input_amount);
  const [currency, setCurrency] = useState(isNew ? displayCurrency : expense.input_currency);
  const [deduction, setDeduction] = useState(isNew ? 'today' : expense.deduction_option);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Days left in this month, counting today
  const [year, month, date] = day.date.split('-').map(Number);
  const daysLeft = new Date(year, month, 0).getDate() - date + 1;
  const isLastDay = daysLeft === 1;

  // The most that redistributing this expense takes from a single day
  const sharePerDay = Math.ceil(Math.round(Number(amount) * 100) / daysLeft) / 100;

  // What today has left without this expense. When editing, the old amount gets added back on
  let remainingBefore = Number(day.remaining);
  if (!isNew && expense.deduction_option === 'today') {
    remainingBefore += Number(expense.amount_myr);
  }
  if (!isNew && expense.deduction_option === 'spread') {
    remainingBefore += Math.ceil(Math.round(Number(expense.amount_myr) * 100) / daysLeft) / 100;
  }

  // The live figures only work when the amount is in the same currency as the day's budget
  const canPreview = currency === displayCurrency;

  //Determines if the form can be save with the current inputs
  // Requires a name, a selected category, a numerical amount and is not busy/loading. If all conditions are met, it means true
  // If one of them isn't met, it means false, which is used by the Save button to disable itself when it's false
  const canSave = name.trim() && categoryId && Number(amount) > 0 && !busy;

  function loadForm() {
    return apiFetch('/categories?type=expense', { token })
      .then((categoryData) => {
        setCategories(categoryData);

        // New expenses start with the user's saved choices
        if (isNew) {
          return apiFetch('/settings', { token }).then((settings) => {
            setCurrency(settings.default_currency);
            setDeduction(isLastDay ? 'today' : settings.default_deduction);
          });
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadForm();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);

    const body = {
      name: name.trim(),
      description,
      category_id: categoryId,
      amount: Number(amount),
      currency,
      deduction_option: deduction,
    };

    try {
      if (isNew) {
        await apiFetch('/expenses', { method: 'POST', token, body });
      } else {
        await apiFetch(`/expenses/${expense.id}`, { method: 'PATCH', token, body });
      }
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal show onHide={onClose} centered backdrop="static">
      <Form onSubmit={handleSubmit}>
        <Modal.Header>
          <Modal.Title className="expense-title">{isNew ? 'Add an expense' : 'Edit expense'}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && <Alert variant="danger" className="py-2">{error}</Alert>}

          <Form.Group className="mb-2" controlId="expenseName">
            <Form.Label visuallyHidden>Name</Form.Label>
            <Form.Control
              placeholder="Name"
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-2" controlId="expenseDescription">
            <Form.Label visuallyHidden>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-2" controlId="expenseCategory">
            <Form.Label visuallyHidden>Category</Form.Label>
            <Form.Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={loading}>
              <option value="">Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3" controlId="expenseAmount">
            <Form.Label visuallyHidden>Amount</Form.Label>
            <InputGroup>
              <Form.Select
                id="expenseCurrency"
                className="expense-currency"
                aria-label="Currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </Form.Select>
              <Form.Control
                type="number"
                min="0"
                step="0.01"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </InputGroup>
          </Form.Group>

          <p className="expense-label">Choose deduction method</p>
          <Row className="g-2">
            <Col xs={12} sm={6}>
              <button
                type="button"
                className={deduction === 'today' ? 'expense-option selected' : 'expense-option'}
                onClick={() => setDeduction('today')}
              >
                {deduction === 'today' && <HugeiconsIcon icon={Tick02Icon} size={18} className="expense-option-tick" />}
                <HugeiconsIcon icon={CalendarCheckIn01Icon} size={22} />
                <strong>Deduct from today</strong>
                <span>
                  {canPreview
                    ? `You'll have ${formatMoney(remainingBefore - Number(amount), symbol)} left`
                    : "Taken from today's budget"}
                </span>
              </button>
            </Col>
            <Col xs={12} sm={6}>
              <button
                type="button"
                className={deduction === 'spread' ? 'expense-option selected' : 'expense-option'}
                onClick={() => setDeduction('spread')}
                disabled={isLastDay}
              >
                {deduction === 'spread' && <HugeiconsIcon icon={Tick02Icon} size={18} className="expense-option-tick" />}
                <HugeiconsIcon icon={DistributeHorizontalCenterIcon} size={22} />
                <strong>Redistribute cost</strong>
                <span>
                  {isLastDay && 'Not available on the last day of the month'}
                  {!isLastDay && canPreview && `Each remaining day's budget will be subtracted by ${formatMoney(sharePerDay, symbol)}`}
                  {!isLastDay && !canPreview && `Split across the ${daysLeft} days left`}
                </span>
              </button>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline-secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!canSave}>{busy ? 'Saving...' : 'Save'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
