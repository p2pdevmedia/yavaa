export type LocalDateTimeFormatOptions = {
  locale?: string;
  timeZone?: string;
};

export function formatLocalDateTime(value: string, options: LocalDateTimeFormatOptions = {}): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(options.locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...(options.timeZone ? { timeZone: options.timeZone } : {})
  }).format(date);
}
