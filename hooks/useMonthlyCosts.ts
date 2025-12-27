import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, where, orderBy, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { MonthlyFixedCost } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

export const useMonthlyCosts = (salaryPeriodId?: string) => {
  const { user } = useAuth();
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyFixedCost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !salaryPeriodId) {
      setMonthlyCosts([]);
      setLoading(false);
      return;
    }

    const costsRef = collection(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'monthlyFixedCosts');
    const costsQuery = query(costsRef, where('salaryPeriodId', '==', salaryPeriodId));

    const unsubscribe = onSnapshot(costsQuery, (snapshot) => {
      const costsData: MonthlyFixedCost[] = snapshot.docs.map(doc => {
        const data = doc.data();
        const paymentDate = data.paymentDate?.toDate() || (data.paymentDay ? new Date(new Date().getFullYear(), new Date().getMonth(), data.paymentDay) : new Date());
        return {
          id: doc.id,
          ...data,
          paymentDate,
          paidAt: data.paidAt?.toDate(),
        };
      }) as MonthlyFixedCost[];
      const sortedCosts = costsData.sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime());
      console.log('monthlyCosts updated', sortedCosts);
      setMonthlyCosts(sortedCosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, salaryPeriodId]);

  const payCost = async (costId: string, actualAmount: number, accountId: string) => {
    if (!user) return;

    const costRef = doc(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'monthlyFixedCosts', costId);
    const accountRef = doc(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'bankAccounts', accountId);

    await runTransaction(db, async (transaction) => {
      const costDoc = await transaction.get(costRef);
      const accountDoc = await transaction.get(accountRef);

      if (!costDoc.exists()) throw new Error('Cost not found');
      if (!accountDoc.exists()) throw new Error('Account not found');

      const cost = costDoc.data() as MonthlyFixedCost;
      const account = accountDoc.data();

      if (cost.status !== 'pending') throw new Error('Cost is not pending');
      if (account.balance < actualAmount) throw new Error('Insufficient balance');

      const updateData: any = {
        status: 'paid',
        actualAmount,
        paidAt: new Date(),
      };
      if (accountId !== cost.bankAccountId) {
        updateData.temporaryAccountId = accountId;
      }
      transaction.update(costRef, updateData);

      transaction.update(accountRef, {
        balance: account.balance - actualAmount,
      });
    });
    toast.success('支払を実行しました');
  };

  const cancelPayment = async (costId: string) => {
    if (!user) return;

    const costRef = doc(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'monthlyFixedCosts', costId);

    await runTransaction(db, async (transaction) => {
      const costSnap = await transaction.get(costRef);
      if (!costSnap.exists()) throw new Error('Cost not found');

      const costData = costSnap.data() as MonthlyFixedCost;

      if (costData.status !== 'paid') throw new Error('Cost is not paid');

      const accountId = costData.temporaryAccountId || costData.bankAccountId;
      const accountRef = doc(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'bankAccounts', accountId);
      const accountSnap = await transaction.get(accountRef);

      if (!accountSnap.exists()) throw new Error('Account not found');

      const accountData = accountSnap.data();

      transaction.update(costRef, {
        status: 'pending',
        paidAt: null,
        actualAmount: null,
        temporaryAccountId: null,
      });

      transaction.update(accountRef, {
        balance: accountData.balance + (costData.actualAmount || 0),
      });
    });
    toast.success('支払を取消しました');
  };

  const skipCost = async (costId: string) => {
    if (!user) return;

    const costRef = doc(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'monthlyFixedCosts', costId);
    await updateDoc(costRef, {
      status: 'skipped',
    });
    toast.success('項目をスキップしました');
  };

  const unskipCost = async (costId: string) => {
    if (!user) return;

    const costRef = doc(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'monthlyFixedCosts', costId);
    await updateDoc(costRef, {
      status: 'pending',
    });
    toast.success('スキップを解除しました');
  };

  const deleteItem = async (costId: string) => {
    if (!user) return;

    const costRef = doc(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'monthlyFixedCosts', costId);
    await deleteDoc(costRef);
    toast.success('項目を削除しました');
  };

  const updateItem = async (costId: string, updates: Partial<MonthlyFixedCost>) => {
    if (!user) return;

    const costRef = doc(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'monthlyFixedCosts', costId);
    await updateDoc(costRef, updates);
  };

  const addItem = async (itemData: { name: string; amount: number; bankAccountId: string; paymentDate: Date }) => {
    console.log('addItem called', itemData, salaryPeriodId);
    if (!user) return;
    if (!salaryPeriodId) {
      toast.error('月を開始してから項目を追加してください');
      return;
    }

    try {
      const costsRef = collection(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'monthlyFixedCosts');
      await addDoc(costsRef, {
        name: itemData.name,
        budget: itemData.amount,
        bankAccountId: itemData.bankAccountId,
        paymentDate: itemData.paymentDate,
        order: monthlyCosts.length,
        status: 'pending',
        salaryPeriodId,
      });
      console.log('addDoc success');
      toast.success('項目を追加しました');
    } catch (error) {
      console.error('addItem error', error);
      toast.error('項目の追加に失敗しました');
    }
  };

  return { monthlyCosts, loading, payCost, cancelPayment, skipCost, unskipCost, addItem, deleteItem, updateItem };
};