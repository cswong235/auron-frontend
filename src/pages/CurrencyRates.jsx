import { useEffect, useState } from 'react';
import { Alert, Card, Col, Row } from 'react-bootstrap';
import { apiFetch } from '../services/helpers';
import { CURRENCIES } from '../services/currencies';
import { useAuth } from '../context/AuthContext';
import CurrencyConverter from '../components/CurrencyConverter';
import LoadingCard from '../components/LoadingCard';
import './CurrencyRates.css';

export default function CurrencyRates() {
  const { session } = useAuth();
  const token = session.access_token;

  const [rates, setRates] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  function fetchRates() {
    return apiFetch('/exchange-rates', { token })
      .then(setRates)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchRates();
  }, []);

  // Match each currency in the app with its rate
  const currencies = [];
  let ratesDate = '';
  for (const currency of CURRENCIES) {
    const found = rates.find((rate) => rate.currency === currency.code);
    if (found) {
      currencies.push({
        code: currency.code,
        name: currency.name,
        symbol: currency.symbol,
        rate: Number(found.rate),
      });
      if (currency.code !== 'MYR') {
        ratesDate = found.rate_date;
      }
    }
  }

  return (
    <>
      <h1 className="rates-title">Currency rates</h1>
      {loading && <LoadingCard text="Loading rates..." />}
      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && (
        <>
          <Card className="mb-3">
            <Card.Body>
              <Card.Title>1 MYR is worth</Card.Title>
              {ratesDate && <Card.Subtitle className="rates-date">Rates from {ratesDate}</Card.Subtitle>}

              <Row xs={2} md={5} className="g-2">
                {currencies.map((currency) => (
                  <Col key={currency.code}>
                    <Card className="rate-card">
                      <Card.Body>
                        <div className="rate-code">{currency.code}</div>
                        <div className="rate-value">
                          {currency.symbol}{currency.rate.toLocaleString('en-MY', { maximumFractionDigits: 4 })}
                        </div>
                        <div className="rate-name">{currency.name}</div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>

          <CurrencyConverter currencies={currencies} />
        </>
      )}
    </>
  );
}
