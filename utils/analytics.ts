import { FixedCostRecord, MonthlyRecord } from '../types';

export const groupRecordsByMonth = (records: FixedCostRecord[]): MonthlyRecord[] => {
  const monthMap = new Map<string, { total: number; costs: Record<string, number> }>();

  records.forEach(record => {
    if (record.status !== 'paid') return;

    const date = record.paidAt;
    const monthKey = `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, { total: 0, costs: {} });
    }

    const monthData = monthMap.get(monthKey)!;
    monthData.total += record.amount;
    monthData.costs[record.name] = (monthData.costs[record.name] || 0) + record.amount;
  });

  // Convert to array and sort by month (descending)
  return Array.from(monthMap.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([month, data]) => ({
      month,
      total: data.total,
      costs: data.costs,
    }));
};

export const getLast6MonthsData = (records: FixedCostRecord[]): MonthlyRecord[] => {
  const monthGroups = groupRecordsByMonth(records);
  return monthGroups.slice(0, 6);
};