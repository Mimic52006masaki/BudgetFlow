import { renderHook, waitFor } from '@testing-library/react';
import { useMonthlyCosts } from './useMonthlyCosts';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs as firestoreGetDocs, addDoc as firestoreAddDoc, orderBy } from 'firebase/firestore';
import { MonthlySummary, FixedCostTemplate, MonthlyFixedCost } from '../types';
import { toast } from 'react-toastify';

jest.mock('../firebase');

// firebase/firestore の関数をモック
jest.mock('firebase/firestore', () => {
  const originalModule = jest.requireActual('firebase/firestore');

  const mockCollectionRef = {
    id: 'mockCollectionId',
    path: 'mock/path',
    doc: jest.fn((docId) => ({
      id: docId,
      path: `mock/path/${docId}`,
    })),
  };

  const mockAddDoc = jest.fn((collectionRef, data) => {
    if (collectionRef === undefined) {
      console.error('addDoc called with undefined collectionRef!');
    }
    return Promise.resolve({ id: 'mockDocId' });
  });

  const mockGetDocs = jest.fn();
  const mockCollection = jest.fn((firestoreInstance, ...pathSegments) => {
    // __mocks__/firebase.ts の db.collection を呼び出すようにする
    const { db: mockDb } = jest.requireMock('../firebase');
    if (firestoreInstance === mockDb) {
      return mockDb.collection(...pathSegments);
    }
    return mockCollectionRef;
  });
  const mockQuery = jest.fn();
  const mockWhere = jest.fn();
  const mockOrderBy = jest.fn();


  return {
    ...originalModule,
    collection: mockCollection,
    query: mockQuery,
    where: mockWhere,
    orderBy: mockOrderBy,
    getDocs: mockGetDocs,
    addDoc: mockAddDoc,
    onSnapshot: jest.fn((_query, callback) => {
      callback({
        empty: true,
        docs: [],
        forEach: jest.fn(),
      });
      return jest.fn();
    }),
    doc: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    runTransaction: jest.fn(),
    getFirestore: jest.fn(() => ({
      collection: mockCollection,
    })),
  };
});

// Mock useAuth hook
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock toast
jest.mock('react-toastify', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

describe('useMonthlyCosts - runMonthlySnapshot', () => {
  const mockUser = { uid: 'test-user-id' };

  // 共通のテストデータ
  const defaultPrevSummary: MonthlySummary = {
    id: 'summary-id-01',
    periodId: '2023-01',
    year: 2023,
    month: 1,
    totalPaid: 200000,
    items: [
      { name: 'Rent', amount: 100000, paidAt: new Date(), bankAccountId: 'bank-a' },
      { name: 'Utilities', amount: 20000, paidAt: new Date(), bankAccountId: 'bank-b' },
    ],
    createdAt: new Date(),
  };

  const defaultTemplates: FixedCostTemplate[] = [
    { id: 'tpl-1', name: 'Rent', defaultBudget: 100000, bankAccountId: 'bank-a', paymentDay: 25, order: 0, isArchived: false, updatedAt: new Date() },
    { id: 'tpl-2', name: 'Utilities', defaultBudget: 20000, bankAccountId: 'bank-b', paymentDay: 10, order: 1, isArchived: false, updatedAt: new Date() },
  ];

  // ヘルパー関数
  const runSnapshotTest = async (
    currentPeriodId: string,
    fromPeriodId: string,
    toPeriodId: string
  ) => {
    const { result } = renderHook(() => useMonthlyCosts(currentPeriodId));
    await result.current.runMonthlySnapshot({ fromPeriodId, toPeriodId });
  };

  // mockGetDocs の設定を簡潔にするヘルパー関数
  const setupMockGetDocs = (
    prevSummary: MonthlySummary | null,
    templates: FixedCostTemplate[],
    existingCosts: MonthlyFixedCost[]
  ) => {
    firestoreGetDocs.mockReset();
    firestoreGetDocs
      .mockResolvedValueOnce({ // getMonthlySummary
        empty: !prevSummary,
        docs: prevSummary ? [{ id: prevSummary.id, data: () => prevSummary }] : [],
      })
      .mockResolvedValueOnce({ // getFixedCostTemplates
        empty: templates.length === 0,
        docs: templates.map(t => ({ id: t.id, data: () => t })),
      })
      .mockResolvedValueOnce({ // getMonthlyFixedCostsForPeriod
        empty: existingCosts.length === 0,
        docs: existingCosts.map(c => ({ id: c.id, data: () => c })),
      });
  };

  beforeEach(() => {
    jest.clearAllMocks(); // 全てのモックをリセット
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser, loading: false });

    // デフォルトのモック設定をヘルパー関数で設定
    setupMockGetDocs(defaultPrevSummary, defaultTemplates, []);
  });

  it('should not run snapshot if user is not authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null, loading: false });
    await runSnapshotTest('2023-02', '2023-01', '2023-02');

    expect(toast.error).toHaveBeenCalledWith('ユーザーが認証されていません。');
    expect(firestoreGetDocs).not.toHaveBeenCalled();
    expect(firestoreAddDoc).not.toHaveBeenCalled();
  });

  it('should not create items if previous month summary does not exist', async () => {
    setupMockGetDocs(null, [], []); // 前月サマリーがないケース

    await runSnapshotTest('2023-02', '2023-01', '2023-02');

    expect(toast.info).toHaveBeenCalledWith('先月のサマリーが見つかりませんでした。');
    expect(firestoreAddDoc).not.toHaveBeenCalled();
  });

  it('should create new monthly fixed costs from previous summary items', async () => {
    await runSnapshotTest('2023-02', '2023-01', '2023-02');

    expect(firestoreAddDoc).toHaveBeenCalledTimes(2); // 2つの固定費が追加されることを確認

    // First call: Rent
    expect(firestoreAddDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      periodId: '2023-02',
      name: 'Rent',
      budget: 100000,
      bankAccountId: 'bank-a',
      status: 'pending',
      actualAmount: undefined,
      paymentDate: expect.any(Date),
      isFallback: false,
      order: 0,
    }));
    const rentCall = firestoreAddDoc.mock.calls[0][1];
    expect(rentCall.paymentDate.getTime()).toBeCloseTo(new Date(2023, 1, 25, 0, 0, 0).getTime(), -2);

    // Second call: Utilities
    expect(firestoreAddDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      periodId: '2023-02',
      name: 'Utilities',
      budget: 20000,
      bankAccountId: 'bank-b',
      status: 'pending',
      actualAmount: undefined,
      paymentDate: expect.any(Date),
      isFallback: false,
      order: 1,
    }));
    const utilitiesCall = firestoreAddDoc.mock.calls[1][1];
    expect(utilitiesCall.paymentDate.getTime()).toBeCloseTo(new Date(2023, 1, 10, 0, 0, 0).getTime(), -2);
    expect(toast.success).toHaveBeenCalledWith('今月の固定費ToDoを作成しました');
  });

  it('should prevent duplicate items from being created', async () => {
    const existingMonthlyCost: MonthlyFixedCost = {
      id: 'existing-cost-1',
      periodId: '2023-02',
      name: 'Rent',
      budget: 100000,
      bankAccountId: 'bank-a',
      status: 'pending',
      paymentDate: new Date(2023, 1, 25),
      order: 0,
    };

    setupMockGetDocs(defaultPrevSummary, defaultTemplates, [existingMonthlyCost]); // 既存アイテムがあるケース

    await runSnapshotTest('2023-02', '2023-01', '2023-02');

    expect(firestoreAddDoc).toHaveBeenCalledTimes(1); // Rentは既存なので、Utilitiesのみが追加されることを確認
    expect(firestoreAddDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      periodId: '2023-02',
      name: 'Utilities',
      budget: 20000,
      bankAccountId: 'bank-b',
      status: 'pending',
      actualAmount: undefined,
      paymentDate: expect.any(Date),
      isFallback: false,
      order: 1,
    }));
    const utilitiesCall = firestoreAddDoc.mock.calls[0][1];
    expect(utilitiesCall.paymentDate.getTime()).toBeCloseTo(new Date(2023, 1, 10, 0, 0, 0).getTime(), -2);
    expect(toast.success).toHaveBeenCalledWith('今月の固定費ToDoを作成しました');
  });

  it('should set isFallback to true if no template is found for an item', async () => {
    const prevSummaryWithNewExpense: MonthlySummary = {
      ...defaultPrevSummary,
      items: [
        { name: 'New Expense', amount: 5000, paidAt: new Date(), bankAccountId: 'bank-c' },
      ],
    };

    setupMockGetDocs(prevSummaryWithNewExpense, [], []); // テンプレートがないケース

    await runSnapshotTest('2023-02', '2023-01', '2023-02');

    expect(firestoreAddDoc).toHaveBeenCalledTimes(1);
    expect(firestoreAddDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      periodId: '2023-02',
      name: 'New Expense',
      budget: 5000,
      bankAccountId: 'bank-c',
      status: 'pending',
      actualAmount: undefined,
      paymentDate: undefined, // No template, so no paymentDate
      isFallback: true,
      order: 0,
    }));
    expect(toast.success).toHaveBeenCalledWith('今月の固定費ToDoを作成しました');
  });

  it('should handle paymentDay overflowing to next month correctly', async () => {
    const prevSummaryWithRent: MonthlySummary = {
      ...defaultPrevSummary,
      items: [
        { name: 'Rent', amount: 100000, paidAt: new Date(), bankAccountId: 'bank-a' },
      ],
    };

    const templatesWithOverflowDay: FixedCostTemplate[] = [
      { id: 'tpl-1', name: 'Rent', defaultBudget: 100000, bankAccountId: 'bank-a', paymentDay: 31, order: 0, isArchived: false, updatedAt: new Date() },
    ];

    setupMockGetDocs(prevSummaryWithRent, templatesWithOverflowDay, []); // 日付オーバーフローケース

    await runSnapshotTest('2023-02', '2023-01', '2023-02');

    expect(firestoreAddDoc).toHaveBeenCalledTimes(1);
    expect(firestoreAddDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      periodId: '2023-02',
      name: 'Rent',
      budget: 100000,
      bankAccountId: 'bank-a',
      status: 'pending',
      actualAmount: undefined,
      paymentDate: expect.any(Date),
      isFallback: false,
      order: 0,
    }));
    const rentOverflowCall = firestoreAddDoc.mock.calls[0][1];
    expect(rentOverflowCall.paymentDate.getTime()).toBeCloseTo(new Date(2023, 1, 28, 0, 0, 0).getTime(), -2);
  });
});