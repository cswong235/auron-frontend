import { useState } from 'react';
import { Card, Col, Form, Row } from 'react-bootstrap';
import { convertCurrency, formatMoney } from '../services/currencies';

export default function CurrencyConverter({ currencies }) {
  const [amount, setAmount] = useState('');
  const [fromCode, setFromCode] = useState('MYR');
  const [toCode, setToCode] = useState('USD');

  // Finds the first currency in the array that matches the currency code
  const from = currencies.find((currency) => currency.code === fromCode);
  const to = currencies.find((currency) => currency.code === toCode);
  // This condition means that if there are "from", "to" currencies and an input higher than 0, its value is true
  // It's used to show a result card at the bottom when it's true
  const canConvert = from && to && Number(amount) > 0;

  return (
    <Card>
      <Card.Body>
        <Card.Title>Currency converter</Card.Title>

        <Row className="g-2">
          <Col xs={12} md={4}>
            <Form.Group controlId="converterAmount">
              <Form.Label>Amount</Form.Label>
              <Form.Control
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col xs={6} md={4}>
            <Form.Group controlId="converterFrom">
              <Form.Label>From</Form.Label>
              <Form.Select value={fromCode} onChange={(e) => setFromCode(e.target.value)}>
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>{currency.code} - {currency.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col xs={6} md={4}>
            <Form.Group controlId="converterTo">
              <Form.Label>To</Form.Label>
              <Form.Select value={toCode} onChange={(e) => setToCode(e.target.value)}>
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>{currency.code} - {currency.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        {canConvert && (
          <p className="converter-result">
            {formatMoney(amount, from.symbol)} = {formatMoney(convertCurrency(Number(amount), from.rate, to.rate), to.symbol)}
          </p>
        )}
      </Card.Body>
    </Card>
  );
}
