import { useState, useMemo } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

export const PastSummaryForm = () => {
  const now = new Date();
  const { user } = useAuth();

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [items, setItems] = useState([
    { id: crypto.randomUUID(), name: '', amount: 0 },
  ]);
  const [manualTotal, setManualTotal] = useState<number | null>(null);

  const calculatedTotal = useMemo(
    () => items.reduce((sum, i) => sum + (i.amount || 0), 0),
    [items]
  );

  const total = manualTotal ?? calculatedTotal;

  /* ---------- handlers ---------- */

  const updateItem = (id: string, patch: Partial<typeof items[0]>) => {
    setItems(items =>
      items.map(i => (i.id === id ? { ...i, ...patch } : i))
    );
  };

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), name: '', amount: 0 }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const save = async () => {
    if (!user) {
      toast.error('ログインしてください');
      return;
    }

    // Validation
    if (!year || !month) {
      toast.error('年月を入力してください');
      return;
    }
    if (items.length === 0 || !items.some(i => i.name && i.amount > 0)) {
      toast.error('項目を1つ以上入力してください');
      return;
    }
    if (total <= 0) {
      toast.error('合計金額は0より大きくしてください');
      return;
    }

    try {
      const ref = collection(
        db,
        'artifacts',
        'kakeibo-app-v2',
        'users',
        user.uid,
        'monthlySummaries'
      );

      await addDoc(ref, {
        year,
        month,
        totalPaid: total,
        items: items
          .filter(i => i.name && i.amount > 0)
          .map(i => ({
            name: i.name,
            amount: i.amount,
          })),
        salaryPeriodId: null, // Explicitly null for manual entries
        source: 'manual', // Mark as manual entry
        createdAt: serverTimestamp(),
      });
      toast.success('履歴を保存しました');
      // Optionally reset form or navigate
      setItems([{ id: crypto.randomUUID(), name: '', amount: 0 }]);
      setManualTotal(null);
      setYear(now.getFullYear());
      setMonth(now.getMonth() + 1);

    } catch (error) {
      console.error('Error saving past summary:', error);
      toast.error('履歴の保存に失敗しました');
    }
  };

  /* ---------- render ---------- */

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      {/* 年月 */}
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

      {/* items */}
      <div className="flex flex-col gap-3">
        {items.map(item => (
          <div key={item.id} className="flex gap-2">
            <input
              value={item.name}
              onChange={e =>
                updateItem(item.id, { name: e.target.value })
              }
              placeholder="項目名"
              className="input flex-1"
            />
            <input
              type="number"
              value={item.amount}
              onChange={e =>
                updateItem(item.id, { amount: +e.target.value })
              }
              className="input w-32 text-right"
            />
            <button onClick={() => removeItem(item.id)}>×</button>
          </div>
        ))}

        <button onClick={addItem} className="text-sm text-primary">
          ＋ 項目を追加
        </button>
      </div>

      {/* total */}
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

      {/* save */}
      <button className="primary-btn self-end" onClick={save}>
        履歴として保存
      </button>
    </div>
  );
};