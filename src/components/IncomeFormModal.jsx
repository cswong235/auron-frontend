import { useEffect, useState } from 'react';
import { Alert, Button, Col, Form, InputGroup, Modal, Row } from 'react-bootstrap';
import { HugeiconsIcon } from '@hugeicons/react';
import { CalendarCheckIn01Icon, DistributeHorizontalCenterIcon, Tick02Icon } from '@hugeicons/core-free-icons';
import { apiFetch } from '../services/helpers';
import { CURRENCIES, formatMoney } from '../services/currencies';
import './Expenses.css';

// Adds an income to today's budget
// day is today's row, since income can only be added on today
export default function IncomeFormModal({ token, day, displayCurrency, symbol, onClose, onSaved }) {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState(displayCurrency);
  const [distribution, setDistribution] = useState('today');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Days left in this month
  const [year, month, date] = day.date.split('-').map(Number);
  const daysLeft = new Date(year, month, 0).getDate() - date + 1;
  const isLastDay = daysLeft === 1;

  // The least that each day gets when the income is distributed
  // The amount is calculated in cents (x100) and divided by days left
  // It gets rounded to the nearest number before dividing by 100 to restore it back to the 2 decimal display
  const sharePerDay = Math.floor(Math.round(Number(amount) * 100) / daysLeft) / 100;

  // The live figures only work when the amount is in the same currency as the day's budget
  const canPreview = currency === displayCurrency;

  // The Save button stays disabled until this is true
  const canSave = name.trim() && categoryId && Number(amount) > 0 && !busy;

  function loadForm() {
    return apiFetch('/categories?type=income', { token })
      .then((categoryData) => {
        setCategories(categoryData);

        // Start with the user's saved choices
        return apiFetch('/settings', { token }).then((settings) => {
          setCurrency(settings.default_currency);
          setDistribution(isLastDay ? 'today' : settings.default_income);
        });
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

    try {
      await apiFetch('/incomes', {
        method: 'POST',
        token,
        body: {
          name: name.trim(),
          description,
          category_id: categoryId,
          amount: Number(amount),
          currency,
          distribution,
        },
      });
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
          <Modal.Title className="expense-title">Add an income</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {error && <Alert variant="danger" className="py-2">{error}</Alert>}

          <Form.Group className="mb-2" controlId="incomeName">
            <Form.Label visuallyHidden>Name</Form.Label>
            <Form.Control
              placeholder="Name"
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-2" controlId="incomeDescription">
            <Form.Label visuallyHidden>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-2" controlId="incomeCategory">
            <Form.Label visuallyHidden>Category</Form.Label>
            <Form.Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} disabled={loading}>
              <option value="">Category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3" controlId="incomeAmount">
            <Form.Label visuallyHidden>Amount</Form.Label>
            <InputGroup>
              <Form.Select
                id="incomeCurrency"
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

          <p className="expense-label">Choose addition method</p>
          <Row className="g-2">
            <Col xs={12} sm={6}>
              <button
                type="button"
                className={distribution === 'today' ? 'expense-option selected' : 'expense-option'}
                onClick={() => setDistribution('today')}
              >
                {distribution === 'today' && <HugeiconsIcon icon={Tick02Icon} size={18} className="expense-option-tick" />}
                <HugeiconsIcon icon={CalendarCheckIn01Icon} size={22} />
                <strong>Add to today</strong>
                <span>
                  {canPreview
                    ? `You'll have ${formatMoney(Number(day.remaining) + Number(amount), symbol)} in total`
                    : "Added to today's budget"}
                </span>
              </button>
            </Col>
            <Col xs={12} sm={6}>
              <button
                type="button"
                className={distribution === 'spread' ? 'expense-option selected' : 'expense-option'}
                onClick={() => setDistribution('spread')}
                disabled={isLastDay}
              >
                {distribution === 'spread' && <HugeiconsIcon icon={Tick02Icon} size={18} className="expense-option-tick" />}
                <HugeiconsIcon icon={DistributeHorizontalCenterIcon} size={22} />
                <strong>Distribute income</strong>
                <span>
                  {isLastDay && 'Not available on the last day of the month'}
                  {!isLastDay && canPreview && `Each remaining day's budget will have an additional ${formatMoney(sharePerDay, symbol)}`}
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
