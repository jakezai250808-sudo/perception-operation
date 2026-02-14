import dayjs from 'dayjs';

export const defaultDateRange = (): [string, string] => [
  dayjs().subtract(7, 'day').format('YYYY-MM-DD'),
  dayjs().format('YYYY-MM-DD')
];
