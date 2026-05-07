export const DEFAULT_DATE_FORMAT_KEY = 'weekdayMonthDay';

export const DATE_FORMAT_OPTIONS = [
  {
    key: 'weekdayMonthDay',
    label: 'Weekday, Month Day',
    example: 'Thursday, Apr 24',
  },
  {
    key: 'monthDayYear',
    label: 'Month Day, Year',
    example: 'Apr 24, 2026',
  },
  {
    key: 'dayMonthYear',
    label: 'Day Month Year',
    example: '24 Apr 2026',
  },
  {
    key: 'monthDayNumeric',
    label: 'MM/DD/YYYY',
    example: '04/24/2026',
  },
  {
    key: 'dayMonthNumeric',
    label: 'DD/MM/YYYY',
    example: '24/04/2026',
  },
  {
    key: 'iso',
    label: 'YYYY-MM-DD',
    example: '2026-04-24',
  },
];

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function isDateFormatKey(key) {
  return DATE_FORMAT_OPTIONS.some(option => option.key === key);
}

function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  const [year, month, day] = String(dateStr).split('-').map(Number);
  if (!year || !month || !day) return null;

  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return {
    date,
    year,
    month,
    day,
    monthShort: MONTHS_SHORT[month - 1],
    weekdayLong: WEEKDAYS_LONG[date.getDay()],
    mm: String(month).padStart(2, '0'),
    dd: String(day).padStart(2, '0'),
  };
}

export function formatDisplayDate(dateStr, dateFormatKey = DEFAULT_DATE_FORMAT_KEY) {
  const parts = parseLocalDate(dateStr);
  if (!parts) return dateStr || '';

  switch (dateFormatKey) {
    case 'monthDayYear':
      return `${parts.monthShort} ${parts.day}, ${parts.year}`;
    case 'dayMonthYear':
      return `${parts.day} ${parts.monthShort} ${parts.year}`;
    case 'monthDayNumeric':
      return `${parts.mm}/${parts.dd}/${parts.year}`;
    case 'dayMonthNumeric':
      return `${parts.dd}/${parts.mm}/${parts.year}`;
    case 'iso':
      return `${parts.year}-${parts.mm}-${parts.dd}`;
    case 'weekdayMonthDay':
    default:
      return `${parts.weekdayLong}, ${parts.monthShort} ${parts.day}`;
  }
}

export function formatChartDate(dateStr, dateFormatKey = DEFAULT_DATE_FORMAT_KEY) {
  const parts = parseLocalDate(dateStr);
  if (!parts) return dateStr || '';

  switch (dateFormatKey) {
    case 'dayMonthYear':
      return `${parts.day} ${parts.monthShort}`;
    case 'monthDayNumeric':
      return `${parts.mm}/${parts.dd}`;
    case 'dayMonthNumeric':
      return `${parts.dd}/${parts.mm}`;
    case 'iso':
      return `${parts.year}-${parts.mm}-${parts.dd}`;
    case 'monthDayYear':
    case 'weekdayMonthDay':
    default:
      return `${parts.monthShort} ${parts.day}`;
  }
}
