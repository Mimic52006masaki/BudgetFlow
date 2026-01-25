export const getPreviousPeriodId = (currentPeriodId: string): string => {
  const [yearStr, monthStr] = currentPeriodId.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);

  month -= 1;
  if (month === 0) {
    month = 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
};
