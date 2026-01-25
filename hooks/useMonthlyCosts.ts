import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, where, orderBy, runTransaction, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { MonthlyFixedCost, FixedCostTemplate, MonthlySummary } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

const toDateSafe = (value: any): Date | null => {
  if (!value) return null;
  if (value.toDate) return value.toDate(); // Firestore Timestamp
  if (value instanceof Date) return value; // Date 型
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d; // string/number を Date に
  }
  return null;
};

export const useMonthlyCosts = (periodId?: string) => {
  const { user } = useAuth();
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyFixedCost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !periodId) {
      setMonthlyCosts([]);
      setLoading(false);
      return;
    }

    const costsRef = collection(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'monthlyFixedCosts');
    const costsQuery = query(costsRef, where('periodId', '==', periodId));

    const unsubscribe = onSnapshot(costsQuery, (snapshot) => {
      const costsData: MonthlyFixedCost[] = snapshot.docs.map(doc => {
        const data = doc.data();

        // paymentDate がない場合は paidAt を代わりに使う
        const paidAt = toDateSafe(data.paidAt);
        const paymentDate = toDateSafe(data.paymentDate) || paidAt;

        return {
          id: doc.id,
          ...data,
          paymentDate,
          paidAt,
        };
      }) as MonthlyFixedCost[];
      const sortedCosts = costsData
        .sort((a, b) => {
          const dateA = a.paymentDate || a.paidAt || new Date(0);
          const dateB = b.paymentDate || b.paidAt || new Date(0);
          return dateA.getTime() - dateB.getTime();
        });
      console.log('monthlyCosts updated', sortedCosts);
      setMonthlyCosts(sortedCosts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, periodId]);

  const payCost = async (costId: string, actualAmount: number, accountId: string, paidAt: string | Date) => {
    if (!user) return;

    console.log('payCost called', { costId, actualAmount, accountId, paidAt });

    const costRef = doc(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'monthlyFixedCosts', costId);
    const accountRef = doc(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'bankAccounts', accountId);

    await runTransaction(db, async (transaction) => {
      const costDoc = await transaction.get(costRef);
      const accountDoc = await transaction.get(accountRef);

      if (!costDoc.exists()) throw new Error('Cost not found');
      if (!accountDoc.exists()) throw new Error('Account not found');

      const cost = costDoc.data() as MonthlyFixedCost;
      const account = accountDoc.data();

      console.log('payCost transaction cost status:', cost.status);

      if (cost.status !== 'pending') throw new Error('Cost is not pending');
      if (account.balance < actualAmount) throw new Error('Insufficient balance');

      const paidDate = paidAt instanceof Date ? paidAt : new Date(paidAt);

      const updateData: any = {
        status: 'paid',
        actualAmount,
        paidAt: paidDate,
        paymentDate: paidDate, // 支払日に合わせて paymentDate を更新
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

    const finalUpdates: any = { ...updates };

    // Firestore に Date を保存する場合、Timestamp に変換する必要は基本なし
    if ('paymentDate' in updates && updates.paymentDate instanceof Date) {
      finalUpdates.paymentDate = updates.paymentDate;
    }

    // paymentDay の null リセットは必要ないなら削除
    // if ('paymentDate' in updates) finalUpdates.paymentDay = null;

    await updateDoc(costRef, finalUpdates);
  };

  const addItem = async (itemData: { name: string; amount: number; bankAccountId: string; paymentDate: Date }) => {
    console.log('addItem called', itemData, periodId);
    if (!user) return;
    if (!periodId) {
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
        periodId,
      });
      console.log('addDoc success');
      toast.success('項目を追加しました');
    } catch (error) {
      console.error('addItem error', error);
      toast.error('項目の追加に失敗しました');
    }
  };

  // --- New functions for Monthly Snapshot ---

  const getMonthlySummary = async (targetPeriodId: string): Promise<MonthlySummary | null> => {
    if (!user) return null;
    const summaryRef = collection(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'monthlySummaries');
    const q = query(summaryRef, where('periodId', '==', targetPeriodId));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0].data();
      return {
        id: querySnapshot.docs[0].id,
        ...docData,
        items: docData.items.map((item: any) => ({
          ...item,
          paidAt: toDateSafe(item.paidAt),
        })),
        createdAt: toDateSafe(docData.createdAt),
      } as MonthlySummary;
    }
    return null;
  };

  const getFixedCostTemplates = async (): Promise<FixedCostTemplate[]> => {
    if (!user) return [];
    const templatesRef = collection(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'fixedCostTemplates');
    const q = query(templatesRef, orderBy('order'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      updatedAt: toDateSafe(doc.data().updatedAt),
    })) as FixedCostTemplate[];
  };

  const getMonthlyFixedCostsForPeriod = async (targetPeriodId: string): Promise<MonthlyFixedCost[]> => {
    if (!user) return [];
    const costsRef = collection(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'monthlyFixedCosts');
    const q = query(costsRef, where('periodId', '==', targetPeriodId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        paymentDate: toDateSafe(data.paymentDate),
        paidAt: toDateSafe(data.paidAt),
      };
    }) as MonthlyFixedCost[];
  };

  const buildPaymentDate = (periodIdStr: string, paymentDay: number | undefined): Date | undefined => {
    if (!paymentDay) return undefined;

    const [yearStr, monthStr] = periodIdStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // Month is 0-indexed in Date

    const date = new Date(year, month, paymentDay);

    // Check if the day overflows to the next month
    if (date.getMonth() !== month) {
      // If it overflows, set to the last day of the target month
      return new Date(year, month + 1, 0);
    }
    return date;
  };

  const createMonthlyFixedCostInternal = async (itemData: Omit<MonthlyFixedCost, 'id'>) => {
    if (!user) return;
    const costsRef = collection(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'monthlyFixedCosts');
    await addDoc(costsRef, {
      ...itemData,
      order: itemData.order !== undefined ? itemData.order : monthlyCosts.length, // itemData に order があればそれを使用
    });
  };

  const runMonthlySnapshot = async ({ fromPeriodId, toPeriodId }: { fromPeriodId: string; toPeriodId: string }) => {
    if (!user) {
      toast.error('ユーザーが認証されていません。');
      return;
    }

    try {
      // 1. 先月のサマリー取得
      const prevSummary = await getMonthlySummary(fromPeriodId);
      if (!prevSummary) {
        console.log(`No summary found for previous period: ${fromPeriodId}`);
        toast.info('先月のサマリーが見つかりませんでした。');
        return;
      }

      // 2. FixedCostTemplate 一覧取得
      const templates = await getFixedCostTemplates();

      // 3. 既存ToDo（今月）取得（重複防止用）
      const existing = await getMonthlyFixedCostsForPeriod(toPeriodId);

      for (const item of prevSummary.items) {
        // 4. 重複防止
        const alreadyExists = existing.some(fc =>
          fc.name === item.name &&
          fc.bankAccountId === item.bankAccountId
        );
        if (alreadyExists) {
          console.log(`Skipping existing item: ${item.name} for ${toPeriodId}`);
          continue;
        }

        // 5. テンプレート紐付け
        const template = templates.find(t =>
          t.name === item.name &&
          t.bankAccountId === item.bankAccountId
        );

        // 6. 支払日決定
        const paymentDate = buildPaymentDate(toPeriodId, template?.paymentDay);

        // 7. ToDo生成
        console.log('createMonthlyFixedCostInternal called for:', item.name, 'paymentDate:', paymentDate); // Debug log
        await createMonthlyFixedCostInternal({
          periodId: toPeriodId,
          name: item.name,
          budget: item.amount,
          bankAccountId: item.bankAccountId,
          status: 'pending', // Initial status is 'pending'
          actualAmount: undefined,
          paymentDate,
          isFallback: !template, // UI用フラグ（任意）
          order: template?.order ?? 0,
        });
      }
      toast.success('今月の固定費ToDoを作成しました');
    } catch (error) {
      console.error('Error running monthly snapshot:', error);
      toast.error('月次スナップショットの実行に失敗しました。');
    }
  };

  return { monthlyCosts, loading, payCost, cancelPayment, skipCost, unskipCost, addItem, deleteItem, updateItem, runMonthlySnapshot };
};