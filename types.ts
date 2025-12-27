
export enum View {
  DASHBOARD = 'DASHBOARD',
  HISTORY = 'HISTORY',
  LOGIN = 'LOGIN',
  SETUP = 'SETUP'
}

export interface BankAccount {
  id: string;
  name: string;
  balance: number;
  trend: number;
  color: string;
  icon: string;
}

export interface FixedCost {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  bankId: string;
  status: 'PENDING' | 'PAID';
  category: string;
}

export interface FixedCostTemplate {
  id: string;
  name: string;
  defaultBudget: number;
  bankAccountId: string;
  paymentDay: number;
  order: number;
  isArchived: boolean;
  updatedAt: Date;
}

export interface MonthlyRecord {
  month: string;
  total: number;
  costs: Record<string, number>;
  isForecast?: boolean;
}

export interface MonthlyFixedCost {
  id: string;
  name: string;
  budget: number;
  bankAccountId: string;
  temporaryAccountId?: string;
  paymentDate: Date;
  order: number;
  status: 'pending' | 'paid' | 'skipped';
  paidAt?: Date;
  actualAmount?: number;
  salaryPeriodId: string;
}

export interface SalaryPeriod {
  id: string;
  startDate: Date;
  endDate?: Date;
  status: 'active' | 'closed';
  lastSummary?: any;
}

export interface FixedCostRecord {
  id: string;
  name: string;
  amount: number;
  budget: number;
  bankAccountId: string;
  status: 'paid' | 'skipped' | 'unpaid';
  isArchivedItem: boolean;
  paidAt: Date;
  salaryPeriodId: string;
}
