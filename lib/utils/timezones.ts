// Common timezones with global time codes
export const TIMEZONES = [
  { code: 'UTC', label: 'UTC (UTC ±0)', offset: 0 },
  { code: 'GMT', label: 'GMT (UTC ±0)', offset: 0 },
  { code: 'WET', label: 'WET (UTC ±0)', offset: 0 },
  { code: 'CET', label: 'CET - Central European (UTC +1)', offset: 1 },
  { code: 'EET', label: 'EET - Eastern European (UTC +2)', offset: 2 },
  { code: 'MSK', label: 'MSK - Moscow (UTC +3)', offset: 3 },
  { code: 'GST', label: 'GST - Gulf (UTC +4)', offset: 4 },
  { code: 'IST', label: 'IST - India (UTC +5:30)', offset: 5.5 },
  { code: 'PKT', label: 'PKT - Pakistan (UTC +5)', offset: 5 },
  { code: 'BDT', label: 'BDT - Bangladesh (UTC +6)', offset: 6 },
  { code: 'ICT', label: 'ICT - Indochina (UTC +7)', offset: 7 },
  { code: 'SGT', label: 'SGT - Singapore (UTC +8)', offset: 8 },
  { code: 'JST', label: 'JST - Japan (UTC +9)', offset: 9 },
  { code: 'AEST', label: 'AEST - Australian Eastern (UTC +10)', offset: 10 },
  { code: 'AEDT', label: 'AEDT - Australian Eastern (UTC +11)', offset: 11 },
  { code: 'NZST', label: 'NZST - New Zealand (UTC +12)', offset: 12 },
  { code: 'NZDT', label: 'NZDT - New Zealand (UTC +13)', offset: 13 },
  // US and Americas
  { code: 'AST', label: 'AST - Atlantic (UTC -4)', offset: -4 },
  { code: 'EST', label: 'EST - Eastern (UTC -5)', offset: -5 },
  { code: 'ET', label: 'ET - Eastern Time (UTC -5/-4)', offset: -5 },
  { code: 'CST', label: 'CST - Central (UTC -6)', offset: -6 },
  { code: 'CT', label: 'CT - Central Time (UTC -6/-5)', offset: -6 },
  { code: 'MST', label: 'MST - Mountain (UTC -7)', offset: -7 },
  { code: 'MT', label: 'MT - Mountain Time (UTC -7/-6)', offset: -7 },
  { code: 'PST', label: 'PST - Pacific (UTC -8)', offset: -8 },
  { code: 'PT', label: 'PT - Pacific Time (UTC -8/-7)', offset: -8 },
  { code: 'AKST', label: 'AKST - Alaska (UTC -9)', offset: -9 },
  { code: 'HST', label: 'HST - Hawaii (UTC -10)', offset: -10 },
  // Americas
  { code: 'BRT', label: 'BRT - Brazil (UTC -3)', offset: -3 },
  { code: 'CLST', label: 'CLST - Chile (UTC -3)', offset: -3 },
  { code: 'ARST', label: 'ARST - Argentina (UTC -3)', offset: -3 },
  { code: 'AMST', label: 'AMST - Amazon (UTC -4)', offset: -4 },
  { code: 'VET', label: 'VET - Venezuela (UTC -4)', offset: -4 },
  { code: 'COT', label: 'COT - Colombia (UTC -5)', offset: -5 },
  { code: 'PET', label: 'PET - Peru (UTC -5)', offset: -5 },
];

export function formatTimezone(code: string): string {
  const tz = TIMEZONES.find(t => t.code === code);
  return tz ? tz.label : code;
}

export function getTimezoneCode(label: string): string {
  const tz = TIMEZONES.find(t => t.label === label);
  return tz ? tz.code : label;
}
