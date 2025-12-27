import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { BankAccount } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

export const useAccounts = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setLoading(false);
      return;
    }

    const accountsRef = collection(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'bankAccounts');

    const unsubscribe = onSnapshot(accountsRef, (snapshot) => {
      const accountsData: BankAccount[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        trend: 0, // TODO: Calculate trend based on historical data
      })) as BankAccount[];
      setAccounts(accountsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addAccount = async (accountData: Omit<BankAccount, 'id' | 'trend'>) => {
    if (!user) return;

    const accountsRef = collection(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'bankAccounts');
    await addDoc(accountsRef, accountData);
    toast.success('口座を追加しました');
  };

  const updateAccount = async (accountId: string, accountData: Omit<BankAccount, 'id' | 'trend'>) => {
    if (!user) return;

    const accountRef = doc(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'bankAccounts', accountId);
    await updateDoc(accountRef, accountData);
    toast.success('口座を更新しました');
  };

  const checkAccountUsage = async (accountId: string) => {
    if (!user) return { canDelete: false, reason: 'auth' };

    // Check fixedCostTemplates
    const templatesQuery = query(collection(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'fixedCostTemplates'), where('bankAccountId', '==', accountId));
    const templatesSnapshot = await getDocs(templatesQuery);
    if (!templatesSnapshot.empty) return { canDelete: false, reason: 'templates' };

    // Check monthlyFixedCosts
    const costsQuery = query(collection(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'monthlyFixedCosts'), where('bankAccountId', '==', accountId));
    const costsSnapshot = await getDocs(costsQuery);
    if (!costsSnapshot.empty) return { canDelete: false, reason: 'costs' };

    const tempCostsQuery = query(collection(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'monthlyFixedCosts'), where('temporaryAccountId', '==', accountId));
    const tempCostsSnapshot = await getDocs(tempCostsQuery);
    if (!tempCostsSnapshot.empty) return { canDelete: false, reason: 'costs' };

    return { canDelete: true };
  };

  const deleteAccount = async (accountId: string) => {
    if (!user) return;

    const accountRef = doc(db, 'artifacts', 'kakeibo-app-v2', 'users', user.uid, 'bankAccounts', accountId);
    await deleteDoc(accountRef);
    toast.success('口座を削除しました');
  };

  return { accounts, loading, addAccount, updateAccount, checkAccountUsage, deleteAccount };
};