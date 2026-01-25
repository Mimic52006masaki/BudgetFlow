import React, { useState, useEffect } from 'react';
import { MonthlySummary } from '../types';
import { collection, doc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { PastSummaryForm, PastSummaryFormData } from './PastSummaryForm';

type Props = {
  summary: MonthlySummary | null;
  onClose: () => void;
};

export const HistoryDetailModal = ({ summary, onClose }: Props) => {
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Effect to reset modes when summary changes
  useEffect(() => {
    if (summary) {
      setIsEditing(false);
      setIsCreatingNew(false);
    }
  }, [summary]);

  const handleSave = async (formData: PastSummaryFormData) => {
    if (!user) {
      toast.error('ログインしてください');
      return;
    }

    try {
      const summariesRef = collection(
        db,
        'artifacts',
        'kakeibo-app-v2',
        'users',
        user.uid,
        'monthlySummaries'
      );

      if (isCreatingNew) {
        // Create new summary using setDoc with year-month as docId
        const docId = `${formData.year}-${String(formData.month).padStart(2,'0')}`;
        const summaryDocRef = doc(summariesRef, docId);

        await setDoc(summaryDocRef, {
          ...formData,
          salaryPeriodId: null, // Explicitly null for manual entries
          source: 'manual', // Mark as manual entry
          createdAt: serverTimestamp(),
        });
        toast.success('新しい履歴を作成しました');
        setIsCreatingNew(false); // Exit create mode
        onClose(); // Close modal after creating new
      } else if (summary) {
        // Update existing summary
        const summaryRef = doc(summariesRef, summary.id);
        await updateDoc(summaryRef, {
          ...formData,
          updatedAt: serverTimestamp(), // Add an updatedAt timestamp
        });
        toast.success('履歴を更新しました');
        setIsEditing(false); // Exit edit mode
      }
    } catch (error) {
      console.error('Error saving summary:', error);
      toast.error('履歴の保存に失敗しました');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreatingNew(false);
  };

  if (!summary) return null;

  // Determine if the current summary has no items (for "入力する" button)
  const hasNoItems = !summary.items || summary.items.length === 0;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg p-6 flex flex-col gap-4">
        {/* header */}
        <div className="flex justify-between items-center">
          <div className="text-lg font-bold">
            {summary.year}年 {summary.month}月
          </div>
          <div className="flex gap-2">
            {summary.source === 'manual' && !isEditing && !isCreatingNew && (
              <button onClick={() => setIsEditing(true)} className="text-sm text-primary">
                編集
              </button>
            )}
            {hasNoItems && !isEditing && !isCreatingNew && ( // Show "入力する" button if no items
              <button onClick={() => setIsCreatingNew(true)} className="text-sm text-primary">
                入力する
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

        {(isEditing || isCreatingNew) ? (
          /* ---------- Edit/Create Mode ---------- */
          <PastSummaryForm
            propYear={summary.year} // Pass year as prop
            propMonth={summary.month} // Pass month as prop
            initialData={isCreatingNew ? undefined : summary} // Pass undefined for new creation
            onSave={handleSave}
            onCancel={handleCancel}
          />
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
