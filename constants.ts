
import { BankAccount, FixedCost, MonthlyRecord } from './types';

export const MOCK_ACCOUNTS: BankAccount[] = [
  { id: '1', name: 'みずほ銀行', balance: 2450000, trend: 2.4, color: 'bg-primary', icon: 'account_balance' },
  { id: '2', name: '三菱UFJ銀行', balance: 845000, trend: -5.1, color: 'bg-accent-danger', icon: 'account_balance' },
  { id: '3', name: '三井住友銀行', balance: 1120500, trend: 0.8, color: 'bg-accent-success', icon: 'account_balance' },
  { id: '4', name: '楽天カード', balance: 500000, trend: 0, color: 'bg-accent-purple', icon: 'credit_card' },
];

export const MOCK_COSTS: FixedCost[] = [
  { id: 'c1', name: 'クレジットカード支払い', amount: 127500, dueDate: '10/27', bankId: '1', status: 'PAID', category: 'サブスク' },
  { id: 'c2', name: 'アパート家賃', amount: 85000, dueDate: '10/27', bankId: '2', status: 'PAID', category: '住宅費' },
  { id: 'c3', name: '電気代', amount: 12000, dueDate: '11/05', bankId: '3', status: 'PENDING', category: '通信・光熱費' },
  { id: 'c4', name: '携帯電話料金', amount: 8000, dueDate: '11/10', bankId: '3', status: 'PENDING', category: '通信・光熱費' },
  { id: 'c5', name: 'ガス代', amount: 5000, dueDate: '11/12', bankId: '3', status: 'PENDING', category: '通信・光熱費' },
  { id: 'c6', name: '貯蓄 / 投資', amount: 95000, dueDate: '11/25', bankId: '4', status: 'PENDING', category: '投資' },
];

export const MOCK_HISTORY: MonthlyRecord[] = [
  { month: '2023/10', total: 230000, costs: { '家賃': 85000, '電気代': 12000, 'ガス代': 5000, '通信費': 5500, '携帯代': 8000, 'サブスク': 4500, '保険料': 15000, '貯蓄・投資': 95000 }, isForecast: true },
  { month: '2023/09', total: 248500, costs: { '家賃': 85000, '電気代': 15000, 'ガス代': 4500, '通信費': 5500, '携帯代': 8200, 'サブスク': 4500, '保険料': 15000, '貯蓄・投資': 106800 } },
  { month: '2023/08', total: 252100, costs: { '家賃': 85000, '電気代': 18500, 'ガス代': 3800, '通信費': 5500, '携帯代': 7800, 'サブスク': 4500, '保険料': 15000, '貯蓄・投資': 112000 } },
  { month: '2023/07', total: 241800, costs: { '家賃': 85000, '電気代': 14200, 'ガス代': 3500, '通信費': 5500, '携帯代': 8000, 'サブスク': 4500, '保険料': 15000, '貯蓄・投資': 102000 } },
];
