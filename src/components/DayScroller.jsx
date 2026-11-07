import { useEffect, useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import InfiniteScroll from 'react-infinite-scroll-component';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { apiFetch, todayString } from '../services/helpers';
import { currencySymbol, formatMoney } from '../services/currencies';
import ExpenseFormModal from './ExpenseFormModal';
import ExpenseListModal from './ExpenseListModal';
import IncomeFormModal from './IncomeFormModal';
import './DayScroller.css';
function BigRemaining({ day, symbol }) {
  return (
    <div className="day-big">
      <div className="day-big-amount">{formatMoney(day.remaining, symbol)}</div>
      <div className="day-muted">remaining</div>
    </div>
  );
}

// The selected day's latest 3 expenses, with a button to open all of them
// expenses is undefined until they've loaded
function DayExpenses({ expenses, symbol, isToday, onAddExpense, onAddIncome, onOpenList }) {
  const latestExpenses = expenses ? expenses.slice(0, 3) : [];

  return (
    <div className="day-actions">
      {/* The user can only add expenses for today */}
      {isToday && (
        <div className="d-flex gap-2 justify-content-center">
          <Button variant="outline-light" size="sm" onClick={onAddExpense}>Expense</Button>
          <Button variant="outline-light" size="sm" onClick={onAddIncome}>Income</Button>
        </div>
      )}

      {expenses && expenses.length === 0 && (
        <p className="day-muted mt-2">{isToday ? 'No expenses yet' : 'No expenses'}</p>
      )}

      {latestExpenses.map((expense) => (
        <div key={expense.id} className="day-expense-row">
          <span>{expense.category_name}</span>
          <span className="day-expense-amount">{formatMoney(-Number(expense.amount_myr), symbol)}</span>
        </div>
      ))}

      {latestExpenses.length > 0 && (
        <button type="button" className="day-expand" onClick={onOpenList} aria-label="See all expenses">
          <HugeiconsIcon icon={ArrowDown01Icon} size={20} />
        </button>
      )}
    </div>
  );
}

export default function DayScroller({ token, currency }) {
  const [days, setDays] = useState([]);
  // The oldest month loaded so far, e.g. "2026-10-01"
  const [oldestMonth, setOldestMonth] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayString());
  // Each day's expenses, stored under the day's id, e.g. { 12: [...], 13: [...] }
  const [expensesByDay, setExpensesByDay] = useState({});
  // The date of the day whose expense list is open, if any
  const [listDate, setListDate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  // The expense being edited. It stays null when adding a new one
  const [editingExpense, setEditingExpense] = useState(null);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
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

  // Load one day's expenses
  function fetchExpenses(dayId) {
    return apiFetch(`/expenses?day_id=${dayId}`, { token })
      .then((data) => setExpensesByDay((current) => ({ ...current, [dayId]: data })))
      .catch((err) => setError(err.message));
  }

  // After an expense changes or an income is added, reload today's expenses and this month's days
  // Older months can't have changed, so they stay as they are
  function refreshAfterChange() {
    fetchExpenses(todayRow.id);

    const month = today.slice(0, 8) + '01';
    return apiFetch(`/daily-budgets?month=${month}`, { token })
      .then((data) => {
        const olderDays = days.filter((day) => day.date < month);
        setDays([...data, ...olderDays]);
      })
      .catch((err) => setError(err.message));
  }

  function openAddForm() {
    setEditingExpense(null);
    setShowForm(true);
  }

  function openEditForm(expense) {
    setEditingExpense(expense);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingExpense(null);
  }

  function handleFormSaved() {
    closeForm();
    refreshAfterChange();
  }

  function handleIncomeSaved() {
    setShowIncomeForm(false);
    refreshAfterChange();
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
  const selectedDayId = selectedDay ? selectedDay.id : null;
  const todayRow = days.find((day) => day.date === today);
  const listDay = days.find((day) => day.date === listDate);

  // Load the selected day's expenses whenever a different day is picked
  useEffect(() => {
    if (selectedDayId) {
      fetchExpenses(selectedDayId);
    }
  }, [selectedDayId]);

  if (loading) {
    return <p className="day-muted">Loading days...</p>;
  }

  // Shown in the selected column on desktop, and in the panel under the strip on mobile
  const selectedExpenses = selectedDay && (
    <DayExpenses
      expenses={expensesByDay[selectedDay.id]}
      symbol={symbol}
      isToday={selectedDay.date === today}
      onAddExpense={openAddForm}
      onAddIncome={() => setShowIncomeForm(true)}
      onOpenList={() => setListDate(selectedDay.date)}
    />
  );

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

              {isSelected && <div className="d-none d-md-block w-100">{selectedExpenses}</div>}

              {/* Desktop: other days up to today have a button to open their expenses.
              On mobile, tapping the day shows them in the panel instead */}
              {!isSelected && day.date <= today && (
                <button
                  type="button"
                  className="day-expand d-none d-md-block"
                  onClick={() => setListDate(day.date)}
                  aria-label={`See expenses for ${date} ${monthName}`}
                >
                  <HugeiconsIcon icon={ArrowDown01Icon} size={20} />
                </button>
              )}
            </div>
          );
        })}
      </InfiniteScroll>

      {selectedDay && (
        <div className="day-details-mobile d-md-none">
          <BigRemaining day={selectedDay} symbol={symbol} />
          {selectedExpenses}
        </div>
      )}

      {showForm && (
        <ExpenseFormModal
          token={token}
          day={todayRow}
          expense={editingExpense}
          displayCurrency={currency}
          symbol={symbol}
          onClose={closeForm}
          onSaved={handleFormSaved}
        />
      )}

      {showIncomeForm && (
        <IncomeFormModal
          token={token}
          day={todayRow}
          displayCurrency={currency}
          symbol={symbol}
          onClose={() => setShowIncomeForm(false)}
          onSaved={handleIncomeSaved}
        />
      )}

      {listDay && !showForm && (
        <ExpenseListModal
          token={token}
          day={listDay}
          isToday={listDay.date === today}
          symbol={symbol}
          onClose={() => setListDate(null)}
          onEdit={openEditForm}
          onChanged={refreshAfterChange}
        />
      )}
    </>
  );
}
