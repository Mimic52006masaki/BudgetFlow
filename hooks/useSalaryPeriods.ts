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
} from 'firebase/firestore';
import { db } from '../firebase';
import { SalaryPeriod, MonthlyFixedCost } from '../types';
import { useAuth } from '../contexts/AuthContext';

const formatMonth = (date: Date) =>
  `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}`;

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

    const basePath = [
      'artifacts',
      'kakeibo-app-v2',
      'users',
      user.uid,
    ];

    const periodsRef = collection(db, ...basePath, 'salaryPeriods');
    const costsRef = collection(db, ...basePath, 'monthlyFixedCosts');
    const summariesRef = collection(db, ...basePath, 'monthlySummaries');

    /* ---- ① paid costs ---- */
    const paidSnap = await getDocs(
      query(
        costsRef,
        where('salaryPeriodId', '==', activePeriod.id),
        where('status', '==', 'paid')
      )
    );

    const paidCosts = paidSnap.docs.map(
      d => ({ id: d.id, ...d.data() } as MonthlyFixedCost)
    );

    /* ---- ② monthly summary ---- */
    const totalAmount = paidCosts.reduce(
      (sum, c) => sum + (c.actualAmount ?? 0),
      0
    );

    batch.set(doc(summariesRef), {
      salaryPeriodId: activePeriod.id,
      month: formatMonth(activePeriod.startDate),
      startDate: activePeriod.startDate,
      endDate: nextStartDate,
      totalAmount,
      items: paidCosts.map(c => ({
        name: c.name,
        amount: c.actualAmount,
        paidAt: c.paidAt,
        bankAccountId: c.temporaryAccountId || c.bankAccountId,
      })),
      createdAt: new Date(),
    });

    /* ---- ③ delete this month costs ---- */
    const allSnap = await getDocs(
      query(costsRef, where('salaryPeriodId', '==', activePeriod.id))
    );
    allSnap.forEach(d => batch.delete(d.ref));

    /* ---- ④ close current period ---- */
    batch.update(doc(periodsRef, activePeriod.id), {
      status: 'closed',
      endDate: nextStartDate,
    });

    /* ---- ⑤ create next period ---- */
    const nextPeriodRef = doc(periodsRef);
    batch.set(nextPeriodRef, {
      startDate: nextStartDate,
      status: 'active',
    });

    /* ---- ⑥ generate next month costs ---- */
    const y = nextStartDate.getFullYear();
    const m = nextStartDate.getMonth();

    templates.forEach((t: any, i: number) => {
      batch.set(doc(costsRef), {
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
