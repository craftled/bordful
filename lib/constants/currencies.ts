// Currency constants and utilities

// Currency type definition - 50 common currencies
export type CurrencyCode =
  | 'USD'
  | 'EUR'
  | 'JPY'
  | 'GBP'
  | 'AUD'
  | 'CAD'
  | 'CHF'
  | 'CNY'
  | 'SEK'
  | 'NZD'
  | 'MXN'
  | 'SGD'
  | 'HKD'
  | 'NOK'
  | 'KRW'
  | 'TRY'
  | 'RUB'
  | 'INR'
  | 'BRL'
  | 'ZAR'
  | 'PHP'
  | 'CZK'
  | 'IDR'
  | 'MYR'
  | 'HUF'
  | 'ISK'
  | 'BGN'
  | 'THB'
  | 'ILS'
  | 'CLP'
  | 'NGN'
  | 'COP'
  | 'PKR'
  | 'BDT'
  | 'VND'
  | 'EGP'
  | 'PEN'
  | 'KWD'
  | 'SAR'
  | 'ARS'
  | 'UAH'
  | 'RON'
  | 'DKK'
  | 'PLN'
  | 'QAR'
  | 'BHD'
  | 'OMR'
  | 'JOD'
  | 'USDT'
  | 'USDC'
  | 'USDS'
  | 'PYUSD'
  | 'TUSD'
  | 'BTC'
  | 'ETH'
  | 'XRP'
  | 'BNB'
  | 'SOL'
  | 'ADA'
  | 'DOGE'
  | 'TRX'
  | 'XLM'
  | 'AVAX'
  | 'SHIB'
  | 'LTC'
  | 'BCH'
  | 'DOT'
  | 'XMR';

// Export a list of all currency codes for programmatic use
export const CURRENCY_CODES: CurrencyCode[] = [
  'USD',
  'EUR',
  'JPY',
  'GBP',
  'AUD',
  'CAD',
  'CHF',
  'CNY',
  'SEK',
  'NZD',
  'MXN',
  'SGD',
  'HKD',
  'NOK',
  'KRW',
  'TRY',
  'RUB',
  'INR',
  'BRL',
  'ZAR',
  'PHP',
  'CZK',
  'IDR',
  'MYR',
  'HUF',
  'ISK',
  'BGN',
  'THB',
  'ILS',
  'CLP',
  'NGN',
  'COP',
  'PKR',
  'BDT',
  'VND',
  'EGP',
  'PEN',
  'KWD',
  'SAR',
  'ARS',
  'UAH',
  'RON',
  'DKK',
  'PLN',
  'QAR',
  'BHD',
  'OMR',
  'JOD',
  'USDT',
  'USDC',
  'USDS',
  'PYUSD',
  'TUSD',
  'BTC',
  'ETH',
  'XRP',
  'BNB',
  'SOL',
  'ADA',
  'DOGE',
  'TRX',
  'XLM',
  'AVAX',
  'SHIB',
  'LTC',
  'BCH',
  'DOT',
  'XMR',
];

// Currency information structure
export type Currency = {
  code: CurrencyCode;
  name: string;
  symbol: string;
  needsSpace?: boolean; // Whether to add a space after the currency symbol
};

// Full currency data with names and symbols
export const CURRENCIES: Currency[] = [
  { name: 'United States Dollar', symbol: '$', code: 'USD', needsSpace: false },
  { name: 'Euro', symbol: '€', code: 'EUR', needsSpace: false },
  { name: 'Japanese Yen', symbol: '¥', code: 'JPY', needsSpace: false },
  {
    name: 'British Pound Sterling',
    symbol: '£',
    code: 'GBP',
    needsSpace: false,
  },
  { name: 'Australian Dollar', symbol: '$', code: 'AUD', needsSpace: false },
  { name: 'Canadian Dollar', symbol: '$', code: 'CAD', needsSpace: false },
  { name: 'Swiss Franc', symbol: 'CHF', code: 'CHF', needsSpace: true },
  {
    name: 'Chinese Yuan Renminbi',
    symbol: '¥',
    code: 'CNY',
    needsSpace: false,
  },
  { name: 'Swedish Krona', symbol: 'kr', code: 'SEK', needsSpace: false },
  { name: 'New Zealand Dollar', symbol: '$', code: 'NZD', needsSpace: false },
  { name: 'Mexican Peso', symbol: '$', code: 'MXN', needsSpace: false },
  { name: 'Singapore Dollar', symbol: '$', code: 'SGD', needsSpace: false },
  { name: 'Hong Kong Dollar', symbol: '$', code: 'HKD', needsSpace: false },
  { name: 'Norwegian Krone', symbol: 'kr', code: 'NOK', needsSpace: false },
  { name: 'South Korean Won', symbol: '₩', code: 'KRW', needsSpace: false },
  { name: 'Turkish Lira', symbol: '₺', code: 'TRY', needsSpace: false },
  { name: 'Russian Ruble', symbol: '₽', code: 'RUB', needsSpace: false },
  { name: 'Indian Rupee', symbol: '₹', code: 'INR', needsSpace: false },
  { name: 'Brazilian Real', symbol: 'R$', code: 'BRL', needsSpace: false },
  { name: 'South African Rand', symbol: 'R', code: 'ZAR', needsSpace: false },
  { name: 'Philippine Peso', symbol: '₱', code: 'PHP', needsSpace: false },
  { name: 'Czech Koruna', symbol: 'Kč', code: 'CZK', needsSpace: true },
  { name: 'Indonesian Rupiah', symbol: 'Rp', code: 'IDR', needsSpace: true },
  { name: 'Malaysian Ringgit', symbol: 'RM', code: 'MYR', needsSpace: true },
  { name: 'Hungarian Forint', symbol: 'Ft', code: 'HUF', needsSpace: true },
  { name: 'Icelandic Krona', symbol: 'kr', code: 'ISK', needsSpace: false },
  { name: 'Bulgarian Lev', symbol: 'лв', code: 'BGN', needsSpace: true },
  { name: 'Thai Baht', symbol: '฿', code: 'THB', needsSpace: false },
  { name: 'Israeli New Shekel', symbol: '₪', code: 'ILS', needsSpace: false },
  { name: 'Chilean Peso', symbol: '$', code: 'CLP', needsSpace: false },
  { name: 'Nigerian Naira', symbol: '₦', code: 'NGN', needsSpace: false },
  { name: 'Colombian Peso', symbol: '$', code: 'COP', needsSpace: false },
  { name: 'Pakistani Rupee', symbol: 'Rs.', code: 'PKR', needsSpace: true },
  { name: 'Bangladeshi Taka', symbol: 'Tk', code: 'BDT', needsSpace: true },
  { name: 'Vietnamese Dong', symbol: '₫', code: 'VND', needsSpace: false },
  { name: 'Egyptian Pound', symbol: '£', code: 'EGP', needsSpace: false },
  { name: 'Peruvian Sol', symbol: 'S/', code: 'PEN', needsSpace: true },
  { name: 'Kuwaiti Dinar', symbol: 'د.ك', code: 'KWD', needsSpace: true },
  { name: 'Saudi Riyal', symbol: 'ر.س', code: 'SAR', needsSpace: true },
  { name: 'Argentine Peso', symbol: '$', code: 'ARS', needsSpace: false },
  { name: 'Ukrainian Hryvnia', symbol: '₴', code: 'UAH', needsSpace: false },
  { name: 'Romanian Leu', symbol: 'lei', code: 'RON', needsSpace: true },
  { name: 'Danish Krone', symbol: 'kr', code: 'DKK', needsSpace: false },
  { name: 'Polish Zloty', symbol: 'zł', code: 'PLN', needsSpace: false },
  { name: 'Qatari Riyal', symbol: 'ر.ق', code: 'QAR', needsSpace: true },
  { name: 'Bahraini Dinar', symbol: '.د.ب', code: 'BHD', needsSpace: true },
  { name: 'Omani Rial', symbol: 'ر.ع.', code: 'OMR', needsSpace: true },
  { name: 'Jordanian Dinar', symbol: 'JD', code: 'JOD', needsSpace: false },
  { name: 'Tether USD', symbol: '$', code: 'USDT', needsSpace: false },
  { name: 'USD Coin', symbol: '$', code: 'USDC', needsSpace: false },
  { name: 'USDS Stablecoin', symbol: '$', code: 'USDS', needsSpace: false },
  { name: 'PayPal USD', symbol: '$', code: 'PYUSD', needsSpace: false },
  { name: 'True USD', symbol: '$', code: 'TUSD', needsSpace: false },
  { name: 'Bitcoin', symbol: '₿', code: 'BTC', needsSpace: false },
  { name: 'Ethereum', symbol: 'Ξ', code: 'ETH', needsSpace: false },
  { name: 'Ripple', symbol: '$', code: 'XRP', needsSpace: false },
  { name: 'BNB', symbol: '$', code: 'BNB', needsSpace: false },
  { name: 'Solana', symbol: '$', code: 'SOL', needsSpace: false },
  { name: 'Cardano', symbol: '$', code: 'ADA', needsSpace: false },
  { name: 'Dogecoin', symbol: '$', code: 'DOGE', needsSpace: false },
  { name: 'Tron', symbol: '$', code: 'TRX', needsSpace: false },
  { name: 'Stellar', symbol: '$', code: 'XLM', needsSpace: false },
  { name: 'Avalanche', symbol: '$', code: 'AVAX', needsSpace: false },
  { name: 'Shiba Inu', symbol: '$', code: 'SHIB', needsSpace: false },
  { name: 'Litecoin', symbol: '$', code: 'LTC', needsSpace: false },
  { name: 'Bitcoin Cash', symbol: '$', code: 'BCH', needsSpace: false },
  { name: 'Polkadot', symbol: '$', code: 'DOT', needsSpace: false },
  { name: 'Monero', symbol: '$', code: 'XMR', needsSpace: false },
];

// Currency lookup map for quick access
export const CURRENCY_MAP: Record<CurrencyCode, Currency> = CURRENCIES.reduce(
  (acc, currency) => {
    acc[currency.code] = currency;
    return acc;
  },
  {} as Record<CurrencyCode, Currency>
);

// Get currency by code
export function getCurrencyByCode(code: string): Currency | undefined {
  if (CURRENCY_CODES.includes(code as CurrencyCode)) {
    return CURRENCY_MAP[code as CurrencyCode];
  }
  return;
}

// Get currency by name
export function getCurrencyByName(name: string): Currency | undefined {
  return CURRENCIES.find(
    (currency) => currency.name.toLowerCase() === name.toLowerCase()
  );
}

// Get symbol for currency code
export function getCurrencySymbol(code: CurrencyCode): string {
  return CURRENCY_MAP[code]?.symbol || code;
}

// Format a currency symbol with proper spacing based on currency configuration
export function formatCurrencySymbol(code: CurrencyCode): string {
  const currency = CURRENCY_MAP[code];
  if (!currency) {
    return code;
  }

  const symbol = currency.symbol;
  const needsSpace = currency.needsSpace ?? false;

  return needsSpace ? `${symbol} ` : symbol;
}

// Approximate exchange rates for normalizing salaries
// These are simplified rates for comparison purposes only
// In a production app, you would use a real-time exchange rate API
export const CURRENCY_RATES: Record<CurrencyCode, number> = {
  USD: 1.0, // Base currency
  EUR: 1.1,
  JPY: 0.007,
  GBP: 1.28,
  AUD: 0.69,
  CAD: 0.75,
  CHF: 1.09,
  CNY: 0.14,
  SEK: 0.1,
  NZD: 0.63,
  MXN: 0.051,
  SGD: 0.738,
  HKD: 0.13,
  NOK: 0.102,
  KRW: 0.000_75,
  TRY: 0.07,
  RUB: 0.011,
  INR: 0.012,
  BRL: 0.18,
  ZAR: 0.059,
  PHP: 0.018,
  CZK: 0.044,
  IDR: 0.000_067,
  MYR: 0.22,
  HUF: 0.0029,
  ISK: 0.0072,
  BGN: 0.56,
  THB: 0.029,
  ILS: 0.287,
  CLP: 0.0011,
  NGN: 0.000_68,
  COP: 0.000_25,
  PKR: 0.0036,
  BDT: 0.0091,
  VND: 0.000_04,
  EGP: 0.021,
  PEN: 0.27,
  KWD: 3.26,
  SAR: 0.27,
  ARS: 0.0011,
  UAH: 0.025,
  RON: 0.22,
  DKK: 0.148,
  PLN: 0.2459,
  QAR: 0.27,
  BHD: 2.65,
  OMR: 2.6,
  JOD: 1.41,
  USDT: 1.0, // Tether is pegged to USD
  USDC: 1.0, // USD Coin is pegged to USD
  USDS: 1.0, // USDS is pegged to USD
  PYUSD: 1.0, // PayPal USD is pegged to USD
  TUSD: 1.0, // True USD is pegged to USD
  BTC: 83_000,
  ETH: 1900,
  XRP: 2.36,
  BNB: 604,
  SOL: 134,
  ADA: 0.73,
  DOGE: 0.17,
  TRX: 0.21,
  XLM: 0.27,
  AVAX: 19.22,
  SHIB: 0.000_013_01,
  LTC: 91.88,
  BCH: 336,
  DOT: 4.29,
  XMR: 213,
};
