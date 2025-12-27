
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FixedCostRecord, BankAccount, MonthlyRecord } from '../types';
import { groupRecordsByMonth, getLast6MonthsData } from '../utils/analytics';

interface HistoryTableProps {
  records: FixedCostRecord[];
  accounts: BankAccount[];
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ records, accounts }) => {
  const monthlyData = groupRecordsByMonth(records);
  const chartData = getLast6MonthsData(records).reverse(); // 古い順に並べる
  const categories = ['家賃', '電気代', 'ガス代', '水道代', '通信費', '携帯代', 'サブスク', '保険料', '貯蓄・投資'];

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

      {/* Expense Trend Chart */}
      <div className="hud-panel rounded-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-1 h-6 bg-accent-cyan"></div>
          <div>
            <h3 className="text-xl font-bold text-neutral-light tracking-wide uppercase">支出推移</h3>
            <p className="text-[10px] text-neutral-muted font-mono uppercase tracking-widest font-bold">直近6ヶ月の推移</p>
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="month" stroke="#999" />
              <YAxis stroke="#999" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #333',
                  borderRadius: '4px',
                }}
                formatter={(value: any) => [`¥${value.toLocaleString()}`, '合計支出']}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#00d4aa"
                strokeWidth={2}
                dot={{ fill: '#00d4aa', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="hud-panel rounded-sm border border-border-subtle flex flex-col overflow-hidden bg-background-panel">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="bg-background-element border-b border-border-subtle">
              <tr>
                <th className="py-3 px-4 text-xs font-bold text-neutral-muted uppercase tracking-wider min-w-[110px]">対象月</th>
                <th className="py-3 px-4 text-xs font-bold text-primary uppercase tracking-wider text-right min-w-[140px]">合計</th>
                {categories.map(cat => (
                  <th key={cat} className="py-3 px-4 text-[10px] font-bold text-neutral-muted uppercase tracking-wider text-right min-w-[100px]">{cat}</th>
                ))}
                <th className="py-3 px-4 text-[10px] font-bold text-neutral-muted uppercase tracking-wider text-center min-w-[80px]">詳細</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-sm">
              {monthlyData.map(row => (
                <tr key={row.month} className="hover:bg-background-element transition-colors">
                  <td className="py-4 px-4 font-mono font-bold text-neutral-light">
                    <div className="flex items-center gap-2">
                      {row.isForecast && <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse"></span>}
                      {row.month}
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono font-bold text-neutral-light text-right">
                    ¥{row.total.toLocaleString()} {row.isForecast && <span className="text-[10px] text-neutral-muted font-normal">/ 予</span>}
                  </td>
                  {categories.map(cat => (
                    <td key={cat} className="py-4 px-4 font-mono text-neutral-muted text-right">
                      {row.costs[cat] ? `¥${row.costs[cat].toLocaleString()}` : '-'}
                    </td>
                  ))}
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
      </div>
    </div>
  );
};
