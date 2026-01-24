import { MonthlySummary, ChartPoint } from '../types';

export function buildMonthlyChartData(
  summaries: MonthlySummary[],
  monthsToDisplay: number = 6
): ChartPoint[] {
  const chartData: ChartPoint[] = [];
  const today = new Date();

  // 1. 直近 monthsToDisplay ヶ月の期間を特定し、マップを作成
  const summaryMap = new Map<string, MonthlySummary>();
  summaries.forEach(s => {
    const key = `${s.year}/${String(s.month).padStart(2, '0')}`;
    summaryMap.set(key, s);
  });

  // 2. 過去 monthsToDisplay ヶ月分の ChartPoint を生成
  for (let i = monthsToDisplay - 1; i >= 0; i--) {
    const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1; // 1-indexed
    const key = `${year}/${String(month).padStart(2, '0')}`;
    const label = `${month}月`; // X軸表示用

    const existingSummary = summaryMap.get(key);

    if (existingSummary) {
      chartData.push({
        key,
        label,
        year,
        month,
        totalPaid: existingSummary.totalPaid,
        hasNoItems: !existingSummary.items || existingSummary.items.length === 0,
      });
    } else {
      // 欠損月の補完
      chartData.push({
        key,
        label,
        year,
        month,
        totalPaid: 0,
        hasNoItems: true, // データがないので項目なしとマーク
      });
    }
  }

  return chartData;
}

// 既存の groupRecordsByMonth と getLast6MonthsData は、
// FixedCostRecord[] を使用しているため、MonthlySummary[] を使うチャートには不要。
// App.tsx や他の場所で FixedCostRecord[] を使っている箇所がなければ削除可能。
// 現状、HistoryTable.tsx では使用されていないため、コメントアウトまたは削除を検討。
// export const groupRecordsByMonth = (records: FixedCostRecord[]): MonthlyRecord[] => { ... };
// export const getLast6MonthsData = (records: FixedCostRecord[]): MonthlyRecord[] => { ... };