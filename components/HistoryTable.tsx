
import React from 'react';
import { MonthlySummary, BankAccount } from '../types';

interface HistoryTableProps {
  records: MonthlySummary[];
  accounts: BankAccount[];
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ records, accounts }) => {
  // TODO: Chart data needs to be recalculated based on MonthlySummary
  // const chartData = getLast6MonthsData(records).reverse(); 

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-border-subtle">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-xs font-mono text-primary mb-1 uppercase tracking-widest font-bold">Fixed Cost History</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-neutral-light uppercase font-display">
              固定費履歴
            </h2>
          </div>
          <div className="h-12 w-px bg-border-subtle hidden md:block"></div>
          <div className="hidden md:flex flex-col justify-center gap-1 text-xs text-neutral-muted max-w-sm">
            <p>過去の固定費実績を月次サイクルで一覧表示します。</p>
            <p>月ごとの変動を確認し、家計の最適化に役立ててください。</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-muted text-lg pointer-events-none">calendar_month</span>
            <select className="pl-10 pr-8 py-2.5 bg-background-element border border-border-subtle rounded-sm text-xs font-bold uppercase tracking-wider text-neutral-light hover:border-primary outline-none appearance-none cursor-pointer transition-colors">
              <option>2023年度</option>
              <option>2022年度</option>
            </select>
            <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-neutral-muted pointer-events-none text-sm">expand_more</span>
          </div>
          <button className="cyber-btn flex items-center gap-2 px-5 py-2.5 bg-background-panel border border-border-subtle text-xs font-bold uppercase tracking-wider text-neutral-muted hover:border-primary hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-sm">download</span> CSV出力
          </button>
        </div>
      </div>

      {/* TODO: Re-implement chart with new data structure */}
      {/* <div className="hud-panel rounded-sm p-6"> ... </div> */}

      <div className="hud-panel rounded-sm border border-border-subtle flex flex-col overflow-hidden bg-background-panel">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead className="bg-background-element border-b border-border-subtle">
              <tr>
                <th className="py-3 px-4 text-xs font-bold text-neutral-muted uppercase tracking-wider">対象月</th>
                <th className="py-3 px-4 text-xs font-bold text-primary uppercase tracking-wider text-right">合計支払額</th>
                <th className="py-3 px-4 text-xs font-bold text-neutral-muted uppercase tracking-wider text-right">項目数</th>
                <th className="py-3 px-4 text-xs font-bold text-neutral-muted uppercase tracking-wider text-center">詳細</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-sm">
              {records.map(r => (
                <tr key={r.id} className="hover:bg-background-element transition-colors">
                  <td className="py-4 px-4 font-mono font-bold text-neutral-light">
                    {r.year}/{String(r.month).padStart(2, '0')}
                  </td>
                  <td className="py-4 px-4 font-mono font-bold text-neutral-light text-right">
                    ¥{r.totalPaid.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 font-mono text-neutral-muted text-right">
                    {r.items.length} 件
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button className="text-primary hover:text-primary-dark transition-colors">
                      <span className="material-symbols-outlined text-lg">open_in_new</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {records.length === 0 && (
          <div className="text-center py-12">
            <p className="text-neutral-muted">履歴データがありません。</p>
            <p className="text-xs text-neutral-dark mt-2">「今月を確定」すると、ここに履歴が追加されます。</p>
          </div>
        )}
      </div>
    </div>
  );
};
