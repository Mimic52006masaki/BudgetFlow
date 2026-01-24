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
      const data = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as MonthlySummary[];

      console.log('history loaded', data); // ← 必ず入れる
      setRecords(data);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  return { records, loading };
};
