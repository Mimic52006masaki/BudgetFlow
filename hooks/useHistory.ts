// hooks/useHistory.ts
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { MonthlySummary } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useHistory = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRecords([]);
      setLoading(false);
      return;
    }

    const ref = collection(
      db,
      'artifacts',
      'kakeibo-app-v2',
      'users',
      user.uid,
      'monthlySummaries'
    );

    const q = query(ref, orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, snap => {
      const data: MonthlySummary[] = snap.docs.map(doc => {
        const docData = doc.data();
        return {
          id: doc.id,
          year: docData.year,
          month: docData.month,
          totalPaid: docData.totalPaid ?? 0, // Ensure totalPaid is always a number
          items: Array.isArray(docData.items)
            ? docData.items.map((item: any) => ({
                ...item,
                paidAt: item.paidAt?.toDate?.() ?? item.paidAt, // Convert Timestamp to Date
              }))
            : [], // Ensure items is always an array
          createdAt: docData.createdAt?.toDate?.() ?? docData.createdAt, // Convert Timestamp to Date
        };
      });

      console.log('history loaded', data); // ← 必ず入れる
      setRecords(data);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  return { records, loading };
};
