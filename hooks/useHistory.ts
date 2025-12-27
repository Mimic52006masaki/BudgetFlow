import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { FixedCostRecord } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useHistory = (limitCount: number = 50) => {
  const { user } = useAuth();
  const [records, setRecords] = useState<FixedCostRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRecords([]);
      setLoading(false);
      return;
    }

    const recordsRef = collection(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'fixedCostRecords');
    const recordsQuery = query(recordsRef, orderBy('paidAt', 'desc'), limit(limitCount));

    const unsubscribe = onSnapshot(recordsQuery, (snapshot) => {
      const recordsData: FixedCostRecord[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        paidAt: doc.data().paidAt?.toDate() || new Date(),
      })) as FixedCostRecord[];
      setRecords(recordsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, limitCount]);

  return { records, loading };
};