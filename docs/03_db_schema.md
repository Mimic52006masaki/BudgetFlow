03_db_schema.md: データ構造設計

1. Firestoreコレクション構造

全て /artifacts/{appId}/users/{userId}/ 配下に格納。

bankAccounts (口座)

name: string

balance: number

color: string (UI表示用)

icon: string (Material Symbol名)

fixedCostTemplates (テンプレート)

name: string

defaultBudget: number

bankAccountId: string (基本の引き落とし口座)

paymentDay: number (1-31)

order: number (カスタム並び替え順)

isArchived: boolean (テンプレートから外されたか。履歴保持用)

updatedAt: timestamp

salaryPeriods (給料期間)

startDate: timestamp

endDate: timestamp (nullable)

status: "active" | "closed"

lastSummary: map (確定時の統計情報などをオプションで保持)

monthlyFixedCosts (当月ToDo)

name: string

budget: number (今月の予算額。開始時に前月実績を反映可能)

bankAccountId: string (基本口座)

temporaryAccountId: string (nullable。今回のみ変更された場合の口座ID)

paymentDay: number

order: number

status: "pending" | "paid" | "skipped" (isPaidの代わりに詳細なステータス管理)

paidAt: timestamp (nullable)

actualAmount: number (実際に支払った金額。確定時に記録)

salaryPeriodId: string

fixedCostRecords (履歴)

name: string

amount: number (実費)

budget: number (本来の予算。スキップ時の記録用)

bankAccountId: string (実際に支払いに使用した口座)

status: "paid" | "skipped" | "unpaid" (未完了で確定した場合)

isArchivedItem: boolean (アーカイブ済みの項目かどうかのフラグ。履歴表示のグレーアウト用)

paidAt: timestamp

salaryPeriodId: string