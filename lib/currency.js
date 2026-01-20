// Currency configuration for Pakistan
export const CURRENCY_CONFIG = {
  code: 'PKR',
  symbol: 'Rs.',
  name: 'Pakistani Rupee',
  decimals: 2,
  symbolPosition: 'before', // 'before' or 'after'
}

// Format amount in PKR
export function formatCurrency(amount, showSymbol = true) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? `${CURRENCY_CONFIG.symbol} 0.00` : '0.00'
  }

  const formattedAmount = parseFloat(amount).toFixed(CURRENCY_CONFIG.decimals)

  if (!showSymbol) {
    return formattedAmount
  }

  if (CURRENCY_CONFIG.symbolPosition === 'before') {
    return `${CURRENCY_CONFIG.symbol} ${formattedAmount}`
  } else {
    return `${formattedAmount} ${CURRENCY_CONFIG.symbol}`
  }
}

// Format amount with thousands separator (Pakistani style: 1,00,000.00)
export function formatCurrencyPK(amount, showSymbol = true) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? `${CURRENCY_CONFIG.symbol} 0.00` : '0.00'
  }

  const num = parseFloat(amount).toFixed(CURRENCY_CONFIG.decimals)
  const [integer, decimal] = num.split('.')

  // Pakistani number formatting: last 3 digits, then groups of 2
  let formattedInteger = integer
  if (integer.length > 3) {
    const lastThree = integer.slice(-3)
    const remaining = integer.slice(0, -3)
    formattedInteger = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree
  }

  const formattedAmount = `${formattedInteger}.${decimal}`

  if (!showSymbol) {
    return formattedAmount
  }

  if (CURRENCY_CONFIG.symbolPosition === 'before') {
    return `${CURRENCY_CONFIG.symbol} ${formattedAmount}`
  } else {
    return `${formattedAmount} ${CURRENCY_CONFIG.symbol}`
  }
}

// Parse currency string to number
export function parseCurrency(currencyString) {
  if (typeof currencyString === 'number') {
    return currencyString
  }

  if (!currencyString) {
    return 0
  }

  // Remove currency symbol and spaces
  const cleaned = currencyString.toString().replace(/[Rs.,\s]/g, '')
  return parseFloat(cleaned) || 0
}

// Validate currency amount
export function isValidAmount(amount, min = 0, max = Infinity) {
  const num = typeof amount === 'string' ? parseCurrency(amount) : parseFloat(amount)
  return !isNaN(num) && num >= min && num <= max
}
