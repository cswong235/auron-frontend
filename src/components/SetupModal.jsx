import { useState } from 'react';
import { Alert, Col, Form, InputGroup, Modal, Row } from 'react-bootstrap';
import Stepper, { Step } from './Stepper';
import { apiFetch, todayString } from '../services/helpers';
import { CURRENCIES, currencySymbol } from '../services/currencies';
import './SetupModal.css';

// previous is the allowance and currency from the user's last plan, or null for a brand new user
export default function SetupModal({ token, previous, onDone }) {
  const isNewUser = !previous;

  const [step, setStep] = useState(1);
  const [currency, setCurrency] = useState(isNewUser ? 'MYR' : previous.currency);
  const [allowance, setAllowance] = useState(isNewUser ? '' : String(previous.allowance));
  const [budgetMode, setBudgetMode] = useState('auto');
  const [dailyAmount, setDailyAmount] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const symbol = currencySymbol(currency);

  // Days left in this month, counting today
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - now.getDate() + 1;

  // The allowance split evenly, rounded down to the cent.
  // This is also the most a manual daily budget can be.
  const allowanceCents = Math.round(Number(allowance) * 100);
  const maxDaily = Math.floor(allowanceCents / daysLeft) / 100;

  const allowanceValid = Number(allowance) > 0;
  const manualValid = Number(dailyAmount) > 0 && Number(dailyAmount) <= maxDaily;

  // Returning users don't get the currency step, so the steps after it move up by one
  const allowanceStep = isNewUser ? 3 : 2;
  const lastStep = isNewUser ? 4 : 3;

  // Decide whether the Continue / Finish button can be pressed
  let canContinue = true;
  if (step === allowanceStep) canContinue = allowanceValid;
  if (step === lastStep && budgetMode === 'manual') canContinue = manualValid;

  async function finishSetup() {
    setError('');
    setBusy(true);
    try {
      // Only new users picked a currency
      if (isNewUser) {
        await apiFetch('/settings', { method: 'PATCH', token, body: { default_currency: currency } });
      }
      await apiFetch('/monthly-plans', {
        method: 'POST',
        token,
        body: {
          allowance: Number(allowance),
          currency,
          budget_mode: budgetMode,
          daily_amount: budgetMode === 'manual' ? Number(dailyAmount) : null,
          today: todayString(),
        },
      });
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  // On the last step, save instead of letting the Stepper move on
  function handleNext(e) {
    if (step === lastStep) {
      e.preventDefault();
      finishSetup();
    }
  }

  return (
    <Modal show centered backdrop="static" keyboard={false} contentClassName="setup-modal-content">
      <Stepper
        step={step}
        onStepChange={setStep}
        theme="dark"
        className="setup-stepper"
        style={{ '--stepper-frame': 'rgba(20, 22, 40, 0.6)', '--stepper-frame-edge': 'rgba(255, 255, 255, 0.16)' }}
        accentColor="#4a90c2"
        width="100%"
        disableStepIndicators
        completeButtonText={busy ? 'Saving...' : 'Finish'}
        nextButtonProps={{ disabled: !canContinue || busy, onClick: handleNext }}
      >
        <Step>
          {isNewUser ? (
            <>
              <h4 className="setup-heading">Welcome to Auron!</h4>
              <p className="setup-text">Got some money to save? Let's get started!</p>
            </>
          ) : (
            <>
              <h4 className="setup-heading">Welcome back!</h4>
              <p className="setup-text">A new month has started, let's set your budget.</p>
            </>
          )}
        </Step>

        {/* Only new users pick a currency. The Stepper skips this step when it isn't rendered */}
        {isNewUser && (
          <Step>
            <h4 className="setup-heading">Pick your currency</h4>
            <Form.Group controlId="setupCurrency">
              <Form.Label className="setup-text">Which currency do you use the most?</Form.Label>
              <Form.Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </Form.Select>
              <Form.Text>You can change this later in Settings.</Form.Text>
            </Form.Group>
          </Step>
        )}

        <Step>
          <h4 className="setup-heading">Your monthly allowance</h4>
          <Form.Group controlId="setupAllowance">
            <Form.Label className="setup-text">How much spare money do you have this month?</Form.Label>
            <InputGroup>
              <InputGroup.Text>{symbol}</InputGroup.Text>
              <Form.Control
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={allowance}
                onChange={(e) => setAllowance(e.target.value)}
              />
            </InputGroup>
            <Form.Text>
              For Auron to work best, only enter what you have left <strong>after</strong> paying for must-haves
              like rent, insurance, bills, instalments, your allocated grocery budget and other mandatory payments.
            </Form.Text>
          </Form.Group>
        </Step>

        <Step>
          <h4 className="setup-heading">Your daily budget</h4>
          <p className="setup-text">You have {daysLeft} days left this month.</p>
          <Row className="g-2">
            <Col xs={12} sm={6}>
              <button
                type="button"
                className={budgetMode === 'auto' ? 'setup-option selected' : 'setup-option'}
                onClick={() => setBudgetMode('auto')}
              >
                <strong>Split it for me</strong>
                <span>Each day will have a budget of {symbol}{maxDaily.toFixed(2)}</span>
              </button>
            </Col>
            <Col xs={12} sm={6}>
              <button
                type="button"
                className={budgetMode === 'manual' ? 'setup-option selected' : 'setup-option'}
                onClick={() => setBudgetMode('manual')}
              >
                <strong>I'll set it myself</strong>
                <span>Up to {symbol}{maxDaily.toFixed(2)} per day</span>
              </button>
            </Col>
          </Row>

          {budgetMode === 'manual' && (
            <Form.Group className="mt-3" controlId="setupDailyAmount">
              <Form.Label className="setup-text">Daily budget</Form.Label>
              <InputGroup>
                <InputGroup.Text>{symbol}</InputGroup.Text>
                <Form.Control
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={dailyAmount}
                  onChange={(e) => setDailyAmount(e.target.value)}
                />
              </InputGroup>
              {dailyAmount && !manualValid && (
                <Form.Text className="text-danger">
                  Your daily budget must be more than 0 and at most {symbol}{maxDaily.toFixed(2)}.
                </Form.Text>
              )}
            </Form.Group>
          )}

          {error && <Alert variant="danger" className="mt-3 py-2">{error}</Alert>}
        </Step>
      </Stepper>
    </Modal>
  );
}
