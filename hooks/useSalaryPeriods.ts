import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  writeBatch,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import { SalaryPeriod, MonthlyFixedCost } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useSalaryPeriods = () => {
  const { user } = useAuth();
  const [salaryPeriods, setSalaryPeriods] = useState<SalaryPeriod[]>([]);
  const [activePeriod, setActivePeriod] = useState<SalaryPeriod | null>(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     Period listener
  ========================= */
  useEffect(() => {
    if (!user) {
      setSalaryPeriods([]);
      setActivePeriod(null);
      setLoading(false);
      return;
    }

    const ref = collection(
      db,
      'artifacts',
      'kakeibo-app-v2',
      'users',
      user.uid,
      'salaryPeriods'
    );

    const q = query(ref, orderBy('startDate', 'desc'));

    const unsub = onSnapshot(q, snap => {
      const periods = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate.toDate(),
        endDate: doc.data().endDate?.toDate(),
      })) as SalaryPeriod[];

      setSalaryPeriods(periods);
      setActivePeriod(periods.find(p => p.status === 'active') ?? null);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  /* =========================
     Close → Start next period
  ========================= */
  const closeAndStartNextPeriod = async (
    nextStartDate: Date,
    templates: any[]
  ) => {
    if (!user || !activePeriod) return;

    const batch = writeBatch(db);

    const basePath = ['artifacts', 'kakeibo-app-v2', 'users', user.uid];
    const periodsRef = collection(db, ...basePath, 'salaryPeriods');
    const costsRef = collection(db, ...basePath, 'monthlyFixedCosts');
    const summariesRef = collection(db, ...basePath, 'monthlySummaries');

    /* ---- ① Get paid costs for summary ---- */
    const paidCostsSnap = await getDocs(
      query(
        costsRef,
        where('salaryPeriodId', '==', activePeriod.id),
        where('status', '==', 'paid')
      )
    );
    const paidItems = paidCostsSnap.docs.map(d => {
      const data = d.data() as MonthlyFixedCost; // Cast to MonthlyFixedCost for type safety
      return {
        id: d.id, // Add id
        name: data.name,
        amount: data.actualAmount ?? data.budget ?? 0,
        budget: data.budget, // Add budget
        bankAccountId: data.temporaryAccountId || data.bankAccountId,
        status: data.status, // Add status
        paidAt: data.paidAt?.toDate?.() ?? data.paidAt,
        salaryPeriodId: data.salaryPeriodId, // Add salaryPeriodId
      };
    });

    /* ---- ② Create monthly summary record ---- */
    const summaryRef = doc(summariesRef);
    batch.set(summaryRef, {
      periodId: activePeriod.id,
      year: activePeriod.startDate.getFullYear(),
      month: activePeriod.startDate.getMonth() + 1, // 1-indexed
      totalPaid: paidItems.reduce((sum, i) => sum + i.amount, 0),
      items: paidItems,
      createdAt: serverTimestamp(),
    });

    /* ---- ③ Delete all of this month's costs ---- */
    const allCostsSnap = await getDocs(
      query(costsRef, where('salaryPeriodId', '==', activePeriod.id))
    );
    allCostsSnap.forEach(d => batch.delete(d.ref));

    /* ---- ④ Close current period ---- */
    batch.update(doc(periodsRef, activePeriod.id), {
      status: 'closed',
      endDate: nextStartDate,
    });

    /* ---- ⑤ Create next period ---- */
    const nextPeriodRef = doc(periodsRef);
    batch.set(nextPeriodRef, {
      startDate: nextStartDate,
      status: 'active',
    });

    /* ---- ⑥ Generate next month's costs ---- */
    const y = nextStartDate.getFullYear();
    const m = nextStartDate.getMonth();

    templates.forEach((t: any, i: number) => {
      const costRef = doc(costsRef);
      batch.set(costRef, {
        name: t.name,
        budget: t.defaultBudget,
        bankAccountId: t.bankAccountId,
        paymentDate: new Date(y, m, t.paymentDay),
        order: t.order ?? i,
        status: 'pending',
        salaryPeriodId: nextPeriodRef.id,
      });
    });

    await batch.commit();
  };

  return {
    salaryPeriods,
    activePeriod,
    loading,
    closeAndStartNextPeriod,
  };
};
