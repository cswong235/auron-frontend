import { test, expect } from 'vitest'
import { convertCurrency, currencySymbol, formatMoney } from './currencies'

// How much of each currency 1 MYR buys
const USD = 0.24606
const SGD = 0.31444

test('converts ringgit to another currency', () => {
  expect(convertCurrency(100, 1, USD)).toBeCloseTo(24.606)
})

test('converts another currency back to ringgit', () => {
  expect(convertCurrency(24.606, USD, 1)).toBeCloseTo(100)
})

test('converts between two other currencies by going through ringgit', () => {
  // US$100 is RM406.40, which is S$127.79
  expect(convertCurrency(100, USD, SGD)).toBeCloseTo(127.79, 2)
})

test('formats money with its symbol, two decimal places and a minus sign when negative', () => {
  expect(formatMoney(-5, 'RM')).toBe('-RM5.00')
  expect(formatMoney('24.606', '$')).toBe('$24.61')
})

test('finds the symbol for a currency code', () => {
  expect(currencySymbol('MYR')).toBe('RM')
  expect(currencySymbol('SGD')).toBe('S$')
})
