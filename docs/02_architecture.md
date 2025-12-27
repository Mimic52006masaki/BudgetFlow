02_architecture.md: 技術スタック・アーキテクチャ設計

1. 技術スタック

Frontend: React (SPA) + TypeScript

Build Tool: Vite

Styling: Tailwind CSS

Icons: (将来実装予定)

Backend/DB: Firebase (Firestore, Auth) を導入済み

2. データ構造 (Firestore)

/artifacts/{appId}/users/{userId}/

bankAccounts: { name: string, balance: number, icon: string }

fixedCostTemplates: { name: string, defaultBudget: number, paymentDay: number, bankAccountId: string, order: number, isArchived: boolean }

salaryPeriods: { startDate: Timestamp, status: 'active'|'closed', closedAt: Timestamp }

monthlyFixedCosts: { name: string, budget: number, actualAmount: number, paymentDay: number, status: 'pending'|'paid', bankAccountId: string, salaryPeriodId: string, templateId: string, paidAt: Timestamp }

fixedCostRecords: (closedされた履歴データ。構造は monthlyFixedCosts と同様)

3. 重要ロジックの設計方針

Payment Transaction:

対象口座の balance と ToDo の status を同時に更新。

原子性を担保し、残高の不整合を防止。

Cycle Closing Batch:

active な期間に紐づく ToDo を履歴へ退避。

現在の ToDo リストをクリーンアップ。

期間ドキュメントを closed に更新。