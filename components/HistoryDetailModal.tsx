import React, { useState, useMemo, useEffect } from 'react';
import { MonthlySummary } from '../types';
import { collection, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

type Props = {
  summary: MonthlySummary | null;
  onClose: () => void;
};

// Define PastItem type locally for the form state
type PastItem = {
  id: string;
  name: string;
  amount: number;
};

export const HistoryDetailModal = ({ summary, onClose }: Props) => {
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [year, setYear] = useState(summary?.year || new Date().getFullYear());
  const [month, setMonth] = useState(summary?.month || new Date().getMonth() + 1);
  const [items, setItems] = useState<PastItem[]>(
    summary?.items?.map(item => ({
      id: crypto.randomUUID(),
      name: item.name,
      amount: item.amount,
    })) || [{ id: crypto.randomUUID(), name: '', amount: 0 }]
  );
  const [manualTotal, setManualTotal] = useState<number | null>(null);

  // Effect to reset form state when summary changes or modal opens/closes
  useEffect(() => {
    if (summary) {
      setYear(summary.year);
      setMonth(summary.month);
      setItems(
        summary.items?.map(item => ({
          id: crypto.randomUUID(),
          name: item.name,
          amount: item.amount,
        })) || [{ id: crypto.randomUUID(), name: '', amount: 0 }]
      );
      setManualTotal(null); // Reset manual total on new summary
      setIsEditing(false); // Always start in view mode
    }
  }, [summary]);

  const calculatedTotal = useMemo(
    () => items.reduce((sum, i) => sum + (i.amount || 0), 0),
    [items]
  );

  const total = manualTotal ?? calculatedTotal;

  /* ---------- handlers for editing ---------- */
  const updateItem = (id: string, patch: Partial<PastItem>) => {
    setItems(currentItems =>
      currentItems.map(i => (i.id === id ? { ...i, ...patch } : i))
    );
  };

  const addItem = () => {
    setItems(currentItems => [...currentItems, { id: crypto.randomUUID(), name: '', amount: 0 }]);
  };

  const removeItem = (id: string) => {
    setItems(currentItems => currentItems.filter(i => i.id !== id));
  };

  const handleSave = async () => {
    if (!user || !summary) {
      toast.error('ログインしてください');
      return;
    }

    // Validation (similar to PastSummaryForm)
    if (!year || !month) {
      toast.error('年月を入力してください');
      return;
    }
    const filteredItems = items.filter(i => i.name && i.amount > 0);
    if (filteredItems.length === 0) {
      toast.error('項目を1つ以上入力してください');
      return;
    }
    if (total <= 0) {
      toast.error('合計金額は0より大きくしてください');
      return;
    }

    try {
      const summaryRef = doc(
        db,
        'artifacts',
        'kakeibo-app-v2',
        'users',
        user.uid,
        'monthlySummaries',
        summary.id
      );

      await updateDoc(summaryRef, {
        year,
        month,
        totalPaid: total,
        items: filteredItems.map(i => ({
          name: i.name,
          amount: i.amount,
        })),
        updatedAt: serverTimestamp(), // Add an updatedAt timestamp
      });
      toast.success('履歴を更新しました');
      setIsEditing(false); // Exit edit mode
      // onClose(); // Optionally close modal after save
    } catch (error) {
      console.error('Error updating summary:', error);
      toast.error('履歴の更新に失敗しました');
    }
  };

  if (!summary) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 flex flex-col gap-4">
        {/* header */}
        <div className="flex justify-between items-center">
          <div className="text-lg font-bold">
            {summary.year}年 {summary.month}月
          </div>
          <div className="flex gap-2">
            {summary.source === 'manual' && !isEditing && (
              <button onClick={() => setIsEditing(true)} className="text-sm text-primary">
                編集
              </button>
            )}
            <button onClick={onClose}>✕</button>
          </div>
        </div>

        {/* badge */}
        {summary.source === 'manual' && (
          <div className="text-xs text-primary">
            手動入力
          </div>
        )}

        {isEditing ? (
          /* ---------- Edit Mode ---------- */
          <div className="flex flex-col gap-4">
            {/* Year/Month inputs */}
            <div className="flex gap-4">
              <input
                type="number"
                value={year}
                onChange={e => setYear(+e.target.value)}
                className="input"
              />
              <input
                type="number"
                value={month}
                onChange={e => setMonth(+e.target.value)}
                min={1}
                max={12}
                className="input"
              />
            </div>

            {/* Items editor */}
            <div className="flex flex-col gap-3">
              {items.map(item => (
                <div key={item.id} className="flex gap-2">
                  <input
                    value={item.name}
                    onChange={e => updateItem(item.id, { name: e.target.value })}
                    placeholder="項目名"
                    className="input flex-1"
                  />
                  <input
                    type="number"
                    value={item.amount}
                    onChange={e => updateItem(item.id, { amount: +e.target.value })}
                    className="input w-32 text-right"
                  />
                  <button onClick={() => removeItem(item.id)}>×</button>
                </div>
              ))}
              <button onClick={addItem} className="text-sm text-primary">
                ＋ 項目を追加
              </button>
            </div>

            {/* Total input */}
            <div className="border-t pt-4 flex flex-col gap-2">
              <div className="text-sm text-neutral-muted">合計金額</div>
              <input
                type="number"
                value={total}
                onChange={e => setManualTotal(+e.target.value)}
                className="input text-right text-lg font-bold"
              />
              <div className="text-xs text-neutral-muted">
                ※ 自動計算されます（手動で修正可）
              </div>
            </div>

            {/* Save/Cancel buttons */}
            <div className="flex justify-end gap-2">
              <button onClick={() => setIsEditing(false)} className="secondary-btn">
                キャンセル
              </button>
              <button onClick={handleSave} className="primary-btn">
                保存
              </button>
            </div>
          </div>
        ) : (
          /* ---------- View Mode ---------- */
          <div className="flex flex-col gap-4">
            {/* items */}
            {summary.items?.length ? (
              <div className="flex flex-col gap-2">
                {summary.items.map((i, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between border-b py-1"
                  >
                    <div>{i.name}</div>
                    <div className="font-mono">
                      ¥{i.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-neutral-muted">
                項目データがありません（過去データの可能性）
              </div>
            )}

            {/* total */}
            <div className="border-t pt-3 flex justify-between font-bold">
              <div>合計</div>
              <div>¥{summary.totalPaid.toLocaleString()}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
