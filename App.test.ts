import { getPreviousPeriodId } from './utils/period'; // Updated import path

describe('getPreviousPeriodId', () => {
  it('should return the previous month for a given periodId', () => {
    expect(getPreviousPeriodId('2023-03')).toBe('2023-02');
    expect(getPreviousPeriodId('2023-01')).toBe('2022-12'); // 年をまたぐケース
    expect(getPreviousPeriodId('2024-12')).toBe('2024-11');
  });

  it('should handle single digit months correctly', () => {
    expect(getPreviousPeriodId('2023-02')).toBe('2023-01');
    expect(getPreviousPeriodId('2023-10')).toBe('2023-09');
  });
});
