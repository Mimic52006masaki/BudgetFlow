import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, query, where, orderBy, runTransaction, writeBatch, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { SalaryPeriod, MonthlyFixedCost } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const useSalaryPeriods = () => {
  const { user } = useAuth();
  const [salaryPeriods, setSalaryPeriods] = useState<SalaryPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePeriod, setActivePeriod] = useState<SalaryPeriod | null>(null);

  useEffect(() => {
    if (!user) {
      setSalaryPeriods([]);
      setActivePeriod(null);
      setLoading(false);
      return;
    }

    const periodsRef = collection(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'salaryPeriods');
    const periodsQuery = query(periodsRef, orderBy('startDate', 'desc'));

    const unsubscribe = onSnapshot(periodsQuery, (snapshot) => {
      const periodsData: SalaryPeriod[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: doc.data().startDate.toDate(),
        endDate: doc.data().endDate?.toDate(),
      })) as SalaryPeriod[];
      setSalaryPeriods(periodsData);
      const active = periodsData.find(p => p.status === 'active') || null;
      setActivePeriod(active);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const startNewPeriod = async (startDate: Date, templates: any[]) => {
    if (!user) return;

    const batch = writeBatch(db);
    const periodRef = doc(collection(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'salaryPeriods'));
    const costsRef = collection(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'monthlyFixedCosts');

    // Close previous active period if exists
    if (activePeriod) {
      const prevPeriodRef = doc(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'salaryPeriods', activePeriod.id);
      batch.update(prevPeriodRef, { status: 'closed', endDate: startDate });
    }

    // Create new period
    const newPeriod = {
      startDate,
      status: 'active',
    };
    batch.set(periodRef, newPeriod);

    // Generate monthly costs from templates
    const currentYear = startDate.getFullYear();
    const currentMonth = startDate.getMonth();
    const costs: Omit<MonthlyFixedCost, 'id'>[] = templates.map((template, index) => ({
      name: template.name,
      budget: template.defaultBudget,
      bankAccountId: template.bankAccountId,
      paymentDate: new Date(currentYear, currentMonth, template.paymentDay),
      order: template.order || index,
      status: 'pending',
      salaryPeriodId: periodRef.id,
    }));

    costs.forEach(cost => {
      const costRef = doc(costsRef);
      batch.set(costRef, cost);
    });

    await batch.commit();
  };

  const closePeriod = async (summary?: any) => {
    if (!user || !activePeriod) return;

    const batch = writeBatch(db);
    const periodRef = doc(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'salaryPeriods', activePeriod.id);
    const costsRef = collection(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'monthlyFixedCosts');
    const recordsRef = collection(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'fixedCostRecords');

    const costsQuery = query(costsRef, where('salaryPeriodId', '==', activePeriod.id));
    const costsSnapshot = await getDocs(costsQuery);

    const costs = costsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MonthlyFixedCost[];

    // Archive costs to records
    costs.forEach(cost => {
      const record = {
        name: cost.name,
        amount: cost.actualAmount || 0,
        budget: cost.budget,
        bankAccountId: cost.temporaryAccountId || cost.bankAccountId,
        status: cost.status === 'paid' ? 'paid' : cost.status === 'skipped' ? 'skipped' : 'unpaid',
        paidAt: cost.paidAt || new Date(),
        salaryPeriodId: cost.salaryPeriodId,
        isArchivedItem: true,
      };
      const recordRef = doc(recordsRef);
      batch.set(recordRef, record);
    });

    // Delete monthly costs
    costsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // Update period
    batch.update(periodRef, {
      status: 'closed',
      endDate: new Date(),
      lastSummary: summary,
    });

    await batch.commit();
  };

  return { salaryPeriods, activePeriod, loading, startNewPeriod, closePeriod };
};