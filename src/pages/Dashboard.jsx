import { useState, useEffect } from 'react';
import { Alert } from 'react-bootstrap';
import { apiFetch, todayString } from '../services/helpers';
import { useAuth } from '../context/AuthContext';
import SetupModal from '../components/SetupModal';
import DayScroller from '../components/DayScroller';

export default function Dashboard() {
  const { session } = useAuth();
  const token = session.access_token;

  const [plan, setPlan] = useState(null);
  // The allowance from the user's last plan, or null for brand new users
  const [previous, setPrevious] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Get this month's plan. "2026-10-31" becomes "2026-10-01"
  function fetchPlan() {
    const month = todayString().slice(0, 8) + '01';
    return apiFetch(`/monthly-plans/current?month=${month}`, { token })
      .then((data) => {
        setPlan(data);
        // No plan this month, so check for an earlier one
        if (!data) {
          return apiFetch(`/monthly-plans/previous?month=${month}`, { token }).then(setPrevious);
        }
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    fetchPlan().finally(() => setLoading(false));
  }, []);

  return (
    <>
      {loading && <p>Loading...</p>}
      {error && <Alert variant="danger">{error}</Alert>}
      {plan && <DayScroller token={token} currency={plan.allowance_input_currency} />}

      {/* If there's no plan for the month yet, show the setup.
          It's only added once loading is done, so it can start with the last allowance filled in */}
      {!loading && !error && !plan && (
        <SetupModal token={token} previous={previous} onDone={fetchPlan} />
      )}
    </>
  );
}
