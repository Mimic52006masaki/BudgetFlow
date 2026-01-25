import { useState, useMemo, useEffect } from 'react';
import { toast } from 'react-toastify';

// Define PastItem type locally for the form state
type PastItem = {
  id: string;
  name: string;
  amount: number;
};

// Define the data structure that PastSummaryForm will output on save
export type PastSummaryFormData = {
  year: number;
  month: number;
  items: { name: string; amount: number }[];
  totalPaid: number;
};

interface PastSummaryFormProps {
  initialData?: { // Optional initial data for editing
    year: number;
    month: number;
    items: { name: string; amount: number }[];
    totalPaid: number;
  };
  propYear?: number; // New prop for fixed year
  propMonth?: number; // New prop for fixed month
  onSave: (data: PastSummaryFormData) => Promise<void>; // Callback for saving
  onCancel: () => void; // Callback for canceling
}

export const PastSummaryForm = ({ initialData, propYear, propMonth, onSave, onCancel }: PastSummaryFormProps) => {
  const now = new Date();

  const [year, setYear] = useState(propYear ?? initialData?.year ?? now.getFullYear());
  const [month, setMonth] = useState(propMonth ?? initialData?.month ?? now.getMonth() + 1);
  const [items, setItems] = useState<PastItem[]>(
    initialData?.items?.map(item => ({
      id: crypto.randomUUID(), // Generate new IDs for editable items
      name: item.name,
      amount: item.amount,
    })) || [{ id: crypto.randomUUID(), name: '', amount: 0 }]
  );
  const [manualTotal, setManualTotal] = useState<number | null>(initialData?.totalPaid ?? null);

  // Effect to reset form state when initialData or propYear/propMonth changes
  useEffect(() => {
    if (propYear !== undefined) setYear(propYear);
    if (propMonth !== undefined) setMonth(propMonth);

    if (initialData) {
      setYear(propYear ?? initialData.year);
      setMonth(propMonth ?? initialData.month);
      setItems(
        initialData.items?.map(item => ({
          id: crypto.randomUUID(),
          name: item.name,
          amount: item.amount,
        })) || [{ id: crypto.randomUUID(), name: '', amount: 0 }]
      );
      setManualTotal(initialData.totalPaid ?? null);
    } else if (propYear === undefined && propMonth === undefined) {
      // Reset to default for new entry if no initialData and no fixed props
      setYear(now.getFullYear());
      setMonth(now.getMonth() + 1);
      setItems([{ id: crypto.randomUUID(), name: '', amount: 0 }]);
      setManualTotal(null);
    }
  }, [initialData, propYear, propMonth]);


  const calculatedTotal = useMemo(
    () => items.reduce((sum, i) => sum + (i.amount || 0), 0),
    [items]
  );

  const total = manualTotal ?? calculatedTotal;

  /* ---------- handlers ---------- */

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

  const handleSubmit = async () => { // Renamed save to handleSubmit
    // Validation
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

    const formData: PastSummaryFormData = {
      year,
      month,
      totalPaid: total,
      items: filteredItems.map(i => ({
        name: i.name,
        amount: i.amount,
      })),
    };

    await onSave(formData); // Call the onSave prop
  };

  /* ---------- render ---------- */

  const isYearMonthFixed = propYear !== undefined || propMonth !== undefined;

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-8">
      {/* 年月 */}
      <div className="flex gap-4">
        <input
          type="number"
          value={year}
          onChange={e => setYear(+e.target.value)}
          className="input"
          disabled={isYearMonthFixed} // Disable if fixed
        />
        <input
          type="number"
          value={month}
          onChange={e => setMonth(+e.target.value)}
          min={1}
          max={12}
          className="input"
          disabled={isYearMonthFixed} // Disable if fixed
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

      {/* save / cancel buttons */}
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="secondary-btn">
          キャンセル
        </button>
        <button onClick={handleSubmit} className="primary-btn">
          保存
        </button>
      </div>
    </div>
  );
};