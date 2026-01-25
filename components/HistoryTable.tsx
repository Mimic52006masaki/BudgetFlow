
import React, { useState, useMemo } from 'react';
import { MonthlySummary, BankAccount, ChartPoint } from '../types';
import { HistoryDetailModal } from './HistoryDetailModal';
import { buildMonthlyChartData } from '../utils/analytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MonthlyComparisonChart } from './MonthlyComparisonChart';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { PastSummaryForm, PastSummaryFormData } from './PastSummaryForm';

interface HistoryTableProps {
  records: MonthlySummary[];
  accounts: BankAccount[];
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ records, accounts }) => {
  const [selectedSummary, setSelectedSummary] = useState<MonthlySummary | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const chartData = useMemo(() => buildMonthlyChartData(records), [records]);

  const { user } = useAuth();

  const handleCreatePastSummary = async (data: PastSummaryFormData) => {
    if (!user) {
      toast.error('ログインしてください');
      return;
    }

    const summariesRef = collection(
      db,
      'artifacts',
      'kakeibo-app-v2',
      'users',
      user.uid,
      'monthlySummaries'
    );

    const docId = `${data.year}-${String(data.month).padStart(2, '0')}`;
    const docRef = doc(summariesRef, docId);
    const docSnap = await getDoc(docRef); // Check if document exists

    let isOverwriting = false;
    if (docSnap.exists()) {
      const confirmOverwrite = window.confirm(
        `${data.year}年${data.month}月のデータは既に存在します。上書きしますか？`
      );
      if (!confirmOverwrite) {
        toast.info('上書きをキャンセルしました');
        return;
      }
      isOverwriting = true;
    }

    await setDoc(docRef, { // Use docRef here
      ...data,
      source: 'manual',
      salaryPeriodId: null,
      createdAt: serverTimestamp(),
    });

    if (isOverwriting) {
      toast.success(`${data.year}年${data.month}月のデータを上書きしました`);
    } else {
      toast.success('過去の月を追加しました');
    }
    setIsCreateModalOpen(false);
  };

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
          <button
            className="cyber-btn flex items-center gap-2 px-5 py-2.5 bg-background-panel border border-border-subtle text-xs font-bold uppercase tracking-wider text-primary hover:border-primary hover:text-primary transition-colors"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <span className="material-symbols-outlined text-sm">add</span> 過去の月を追加
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
              <XAxis dataKey="label" stroke="#999" />
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
                dataKey="totalPaid"
                stroke="#00d4aa"
                strokeWidth={2}
                dot={({ cx, cy, stroke, payload }) => {
                  if (payload.hasNoItems) {
                    return <circle cx={cx} cy={cy} r={5} fill="#ffcc00" stroke="#ffcc00" strokeWidth={2} />;
                  }
                  return <circle cx={cx} cy={cy} r={4} fill="#00d4aa" stroke="#00d4aa" strokeWidth={2} />;
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Comparison Chart */}
      <MonthlyComparisonChart records={records} />

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
              {records.map(r => {
                const hasNoItems = !r.items || r.items.length === 0;
                return (
                  <tr key={r.id} className="hover:bg-background-element transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-neutral-light">
                      <div className="flex items-center gap-2">
                        {r.year}/{String(r.month).padStart(2, '0')}
                        {hasNoItems && (
                          <span
                            title="項目が保存されていません"
                            className="text-yellow-500 ml-2"
                          >
                            ⚠
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-neutral-light text-right">
                      ¥{(r.totalPaid ?? 0).toLocaleString()}
                    </td>
                    <td className="py-4 px-4 font-mono text-neutral-muted text-right">
                      {(r.items?.length ?? 0)} 件
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => setSelectedSummary(r)}
                        className="text-primary hover:text-primary-dark transition-colors"
                      >
                        <span className="material-symbols-outlined text-lg">open_in_new</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
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

      {selectedSummary && (
        <HistoryDetailModal
          summary={selectedSummary}
          onClose={() => setSelectedSummary(null)}
        />
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-neutral-900">
                過去の月を追加
              </h3>
              <p className="text-xs text-neutral-muted mt-1">
                過去の固定費実績を手動で入力します
              </p>
            </div>
            <PastSummaryForm
              onSave={handleCreatePastSummary}
              onCancel={() => setIsCreateModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
