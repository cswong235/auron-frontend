import { useEffect, useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import InfiniteScroll from 'react-infinite-scroll-component';
import { apiFetch, todayString } from '../services/helpers';
import { currencySymbol, formatMoney } from '../services/currencies';
import './DayScroller.css';

// The big "RM30.00 remaining" for the selected day
function BigRemaining({ day, symbol }) {
  return (
    <div className="day-big">
      <div className="day-big-amount">{formatMoney(day.remaining, symbol)}</div>
      <div className="day-muted">remaining</div>
    </div>
  );
}

// Expense / income buttons and the day's expenses (to be hooked up later)
function DayActions() {
  return (
    <div className="day-actions">
      <div className="d-flex gap-2 justify-content-center">
        <Button variant="outline-light" size="sm">Expense</Button>
        <Button variant="outline-light" size="sm">Income</Button>
      </div>
      <p className="day-muted mt-2">No expenses yet</p>
    </div>
  );
}

export default function DayScroller({ token, currency }) {
  const [days, setDays] = useState([]);
  // The oldest month loaded so far, e.g. "2026-10-01"
  const [oldestMonth, setOldestMonth] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const symbol = currencySymbol(currency);
  const today = todayString();

  // Load this month's days, newest first
  function fetchDays() {
    const month = today.slice(0, 8) + '01';
    return apiFetch(`/daily-budgets?month=${month}`, { token })
      .then((data) => {
        setDays(data);
        setOldestMonth(month);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  // When the user scrolls to the left end, add the latest month with a plan before the oldest one loaded.
  // The backend skips any months the user didn't set up
  function loadOlderDays() {
    return apiFetch(`/daily-budgets/older?before=${oldestMonth}`, { token })
      .then((data) => {
        // Append the older days to the list of fetched days
        setDays([...days, ...data]);
        if (data.length > 0) {
          // The last day in the list is the oldest, e.g. "2026-08-01" is in "2026-08-01"
          setOldestMonth(data[data.length - 1].date.slice(0, 8) + '01');
        } else {
          // Nothing older means there's nothing left to load
          setHasMore(false);
        }
      })
      .catch((err) => setError(err.message));
  }

  // Scroll the strip so this day sits in the middle
  function scrollToDay(date, behavior) {
    const element = document.getElementById(`day-${date}`);
    if (element) {
      element.scrollIntoView({ behavior, inline: 'center', block: 'nearest' });
    }
  }

  function selectDay(date) {
    setSelectedDate(date);
    scrollToDay(date, 'smooth');
  }

  useEffect(() => {
    fetchDays();
  }, []);

  // Once the days are on screen, put today in the middle
  useEffect(() => {
    if (!loading) {
      scrollToDay(selectedDate, 'auto');
    }
  }, [loading]);

  const selectedDay = days.find((day) => day.date === selectedDate);

  if (loading) {
    return <p className="day-muted">Loading days...</p>;
  }

  return (
    <>
      {error && <Alert variant="danger">{error}</Alert>}

      {/* The row is reversed so the newest day is on the right
      and older months load in on the left when the user scrolls there */}
      <InfiniteScroll
        dataLength={days.length}
        next={loadOlderDays}
        hasMore={hasMore}
        loader={<div className="day-loading">Loading...</div>}
        endMessage={<div className="day-spacer"></div>}
        className="day-scroller"
      >
        <div className="day-spacer"></div>

        {/* Map out each day fetched from the database */}
        {days.map((day) => {
          // Destructure each day's date into year, month and date
          const [year, month, date] = day.date.split('-').map(Number);
          // Get the month's name in short form (ex: Nov)
          const monthName = new Date(year, month - 1, date).toLocaleDateString('en-MY', { month: 'short' });
          // If a day is selected, set isSelected to true
          const isSelected = day.date === selectedDate;
          // Set to true for today
          const isToday = day.date === today;

          return (
            <div key={day.id} id={`day-${day.date}`} className={isSelected ? 'day-column selected' : 'day-column'}>
              {/* Draw out each day in a list, and for the selected day, show a differently styled card */}
              {/* If selected, show some extra layouts, like a remaining amount for the day */}
              {isSelected && (
                <div className="d-none d-md-block">
                  <BigRemaining day={day} symbol={symbol} />
                </div>
              )}
              {/* Colour code the remaining amount, red for negative */}
              <div className={Number(day.remaining) < 0 ? 'day-amount negative' : 'day-amount'}>
                {formatMoney(day.remaining, symbol)}
              </div>

              <button type="button" className="day-box" onClick={() => selectDay(day.date)}>
                {date}
              </button>
              <div className="day-month">{isToday ? 'Today' : monthName}</div>

              {/* Only on today that a user can add income or expenses for the day */}
              {isSelected && isToday && (
                <div className="d-none d-md-block">
                  <DayActions />
                </div>
              )}
            </div>
          );
        })}
      </InfiniteScroll>

      {/* Mobile: the selected day's details go under the strip instead */}
      {selectedDay && (
        <div className="day-details-mobile d-md-none">
          <BigRemaining day={selectedDay} symbol={symbol} />
          {selectedDay.date === today && <DayActions />}
        </div>
      )}
    </>
  );
}
