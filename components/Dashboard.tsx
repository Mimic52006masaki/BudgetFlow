import React, { useState } from 'react';
import { MOCK_ACCOUNTS, MOCK_COSTS } from '../constants';
import { BankAccount, FixedCost, FixedCostTemplate, MonthlyFixedCost, SalaryPeriod } from '../types';

interface DashboardProps {
  accounts: BankAccount[];
  templates: FixedCostTemplate[];
  monthlyCosts: MonthlyFixedCost[];
  activePeriod?: SalaryPeriod | null;
  onAddAccount: () => void;
  onEditAccount: (account: BankAccount) => void;
  onDeleteAccount?: (action: 'check' | 'delete', accountId: string) => Promise<any>;
  onAddTemplate: () => void;
  onEditTemplate: (template: FixedCostTemplate) => void;
  onDeleteTemplate?: (templateId: string) => void;
  onAddItem: () => void;
  onEditCost: (cost: FixedCost) => void;
  onDeleteItem?: (costId: string) => void;
  onUpdateItem?: (costId: string, updates: Partial<MonthlyFixedCost>) => void;
  onStartNewPeriod: (startDate: Date, templates: FixedCostTemplate[]) => void;
  onClosePeriod: (summary?: any) => void;
  onPayCost: (costId: string, actualAmount: number, accountId: string) => void;
  onCancelPayment: (costId: string) => void;
  onSkipCost: (costId: string) => void;
  onUnskipCost: (costId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  accounts,
  templates,
  monthlyCosts,
  activePeriod,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onAddTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onAddItem,
  onEditCost,
  onDeleteItem,
  onUpdateItem,
  onStartNewPeriod,
  onClosePeriod,
  onPayCost,
  onCancelPayment,
  onSkipCost,
  onUnskipCost
}) => {
  const [editingField, setEditingField] = useState<{ costId: string; field: 'paymentDay' | 'budget' | 'bankAccountId' } | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const totalAssets = accounts.reduce((acc, curr) => acc + curr.balance, 0);
  const paidAmount = monthlyCosts.filter(c => c.status === 'paid').reduce((acc, curr) => acc + (curr.actualAmount || 0), 0);
  const totalBudget = monthlyCosts.reduce((acc, curr) => acc + curr.budget, 0);
  const progressPercent = totalBudget > 0 ? Math.round((paidAmount / totalBudget) * 100) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border-subtle">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-xs font-mono text-primary mb-1 uppercase tracking-widest font-bold">現在のサイクル</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-neutral-light uppercase font-display">
              {activePeriod ? activePeriod.startDate.getFullYear() : new Date().getFullYear()} <span className="text-neutral-muted font-light">/</span> {activePeriod ? (activePeriod.startDate.getMonth() + 1).toString().padStart(2, '0') : (new Date().getMonth() + 1).toString().padStart(2, '0')}
            </h2>
          </div>
          <div className="h-12 w-px bg-border-subtle hidden md:block"></div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-neutral-muted text-xs font-mono">
              <span className="material-symbols-outlined text-sm text-primary">calendar_month</span>
              <span>期間: {activePeriod ? `${activePeriod.startDate.getMonth() + 1}/${activePeriod.startDate.getDate()} - ${activePeriod.endDate ? (activePeriod.endDate.getMonth() + 1) + '/' + activePeriod.endDate.getDate() : '進行中'}` : '未開始'}</span>
            </div>
            <div className="w-full h-1 bg-background-element rounded-full overflow-hidden border border-border-subtle">
              <div className="h-full bg-primary" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="cyber-btn flex items-center gap-2 px-6 py-2.5 bg-background-element border border-border-subtle text-xs font-bold uppercase tracking-wider text-neutral-light hover:border-primary hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-sm">edit_calendar</span>
            給料日設定
          </button>
          {activePeriod ? (
            <button
              onClick={() => onClosePeriod()}
              className="cyber-btn flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-dark transition-all"
            >
              <span className="material-symbols-outlined text-sm">check_circle</span>
              今月を確定
            </button>
          ) : (
            <button
              onClick={() => onStartNewPeriod(new Date(), templates)}
              className="cyber-btn flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-dark transition-all"
            >
              <span className="material-symbols-outlined text-sm">play_circle</span>
              今月を開始
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Left Column: Stats & Accounts */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
          <div className="hud-panel rounded-sm p-6 group">
            <div className="hud-corner hud-corner-tl"></div><div className="hud-corner hud-corner-tr"></div>
            <div className="hud-corner hud-corner-bl"></div><div className="hud-corner hud-corner-br"></div>
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="text-neutral-muted text-xs font-mono mb-1 font-bold uppercase tracking-wider">総資産</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg text-neutral-muted">¥</span>
                  <span className="text-4xl font-bold tracking-tight text-neutral-light font-mono">{totalAssets.toLocaleString()}</span>
                </div>
              </div>
              <div className="p-2 rounded bg-primary/10 border border-primary/20 text-primary">
                <span className="material-symbols-outlined">account_balance</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {accounts.map(acc => (
                <div key={acc.id} className={`h-1 ${acc.color} opacity-30 rounded-full overflow-hidden`}>
                  <div className={`h-full ${acc.color}`} style={{ width: '80%' }}></div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2 text-[10px] font-mono text-neutral-muted uppercase font-bold">
              {accounts.map(acc => <span key={acc.id}>{acc.name.slice(0, 2)}</span>)}
            </div>
          </div>

          <div className="hud-panel rounded-sm p-6 relative overflow-hidden">
            <div className="data-stream"></div>
            <div className="flex items-center justify-between mb-4 z-10 relative">
              <p className="text-neutral-muted font-mono text-xs uppercase tracking-wider font-bold">支払い状況</p>
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 border border-primary/20">{progressPercent}% 完了</span>
            </div>
            <div className="relative z-10 mb-6">
              <div className="flex items-end gap-2 mb-2">
                <span className="text-2xl font-bold text-neutral-light font-mono">¥{paidAmount.toLocaleString()}</span>
                <span className="text-sm text-neutral-muted font-mono mb-1">/ ¥{totalBudget.toLocaleString()}</span>
              </div>
              <div className="w-full bg-background-element h-1.5 rounded-full overflow-hidden border border-border-subtle">
                <div className="bg-gradient-to-r from-primary-dark to-accent-cyan h-full" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <div className="flex justify-between items-center mt-2 font-mono text-[10px] font-bold uppercase">
                <span className="text-accent-cyan tracking-widest">進行中</span>
                <span className="text-neutral-muted">支払い完了後残金: ¥{(totalAssets - paidAmount).toLocaleString()}</span>
              </div>
              <div className="mt-2 space-y-1">
                {accounts.map(acc => {
                  const pendingCosts = monthlyCosts.filter(cost => cost.status === 'pending' && (cost.temporaryAccountId || cost.bankAccountId) === acc.id);
                  const pendingAmount = pendingCosts.reduce((sum, cost) => sum + cost.budget, 0);
                  const remainingBalance = acc.balance - pendingAmount;
                  return (
                    <div key={acc.id} className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-neutral-muted uppercase">{acc.name}</span>
                      <span className={`text-neutral-light ${remainingBalance < 0 ? 'text-accent-danger' : ''}`}>¥{remainingBalance.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="hud-panel rounded-sm p-6 relative overflow-hidden">
            <div className="data-stream"></div>
            <div className="flex items-center justify-between mb-4 z-10 relative">
              <p className="text-neutral-muted font-mono text-xs uppercase tracking-wider font-bold">固定費テンプレート</p>
              <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 border border-primary/30 rounded-sm">
                {templates.length} 件
              </span>
            </div>
            <div className="relative z-10 space-y-3">
              {templates.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-neutral-muted text-sm mb-4">まだテンプレートがありません</p>
                  <button
                    onClick={onAddTemplate}
                    className="cyber-btn flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-dark transition-all mx-auto"
                  >
                    <span className="material-symbols-outlined text-sm">add</span> テンプレートを作成
                  </button>
                </div>
              ) : (
                <>
                  {templates.map(template => (
                    <div key={template.id} className="bg-background-element border border-border-subtle p-3 hover:border-primary/50 transition-all cursor-pointer group relative">
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTemplate(template);
                          }}
                          className="p-1 hover:bg-background-element rounded-sm"
                        >
                          <span className="material-symbols-outlined text-xs text-neutral-muted hover:text-primary">edit</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTemplate && onDeleteTemplate(template.id);
                          }}
                          className="p-1 hover:bg-background-element rounded-sm"
                        >
                          <span className="material-symbols-outlined text-xs text-neutral-muted hover:text-accent-danger">delete</span>
                        </button>
                      </div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-sm">description</span>
                          <h4 className="text-sm font-bold text-neutral-light">{template.name}</h4>
                        </div>
                        <span className="text-xs text-neutral-muted font-mono">
                          {(() => {
                            const currentDate = new Date();
                            const currentMonth = currentDate.getMonth() + 1;
                            const displayMonth = currentMonth === 12 ? 1 : currentMonth + 1;
                            return `${displayMonth}/${String(template.paymentDay).padStart(2, '0')}`;
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-neutral-muted">
                          {accounts.find(a => a.id === template.bankAccountId)?.name}
                        </p>
                        <p className="text-sm font-mono text-neutral-light">¥{template.defaultBudget.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={onAddTemplate}
                    className="w-full border border-dashed border-neutral-muted/40 p-3 text-xs font-mono text-neutral-muted hover:text-primary hover:border-primary/50 transition-colors flex items-center justify-center gap-2 bg-background-element"
                  >
                    <span className="material-symbols-outlined text-sm">add</span> 新しいテンプレートを追加
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {accounts.map(acc => (
              <div key={acc.id} className="bg-background-panel border border-border-subtle p-3 hover:border-primary/50 transition-all cursor-pointer group relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditAccount(acc);
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-background-element rounded-sm"
                >
                  <span className="material-symbols-outlined text-xs text-neutral-muted hover:text-primary">edit</span>
                </button>
                <div className="flex justify-between items-start mb-2">
                  <div className={`size-6 rounded ${acc.color.replace('bg-', 'bg-')}/10 flex items-center justify-center ${acc.color.replace('bg-', 'text-')} group-hover:text-white group-hover:${acc.color} transition-colors`}>
                    <span className="material-symbols-outlined text-xs">{acc.icon}</span>
                  </div>
                  <span className={`text-[10px] ${acc.trend >= 0 ? 'text-accent-success' : 'text-accent-danger'} font-mono flex items-center font-bold`}>
                    <span className="material-symbols-outlined text-[10px] mr-0.5">{acc.trend >= 0 ? 'trending_up' : 'trending_down'}</span>
                    {Math.abs(acc.trend)}%
                  </span>
                </div>
                <h4 className="text-xs font-bold text-neutral-light mb-0.5">{acc.name}</h4>
                <p className="text-sm font-mono text-neutral-light tracking-tight">¥{acc.balance.toLocaleString()}</p>
              </div>
            ))}
            <button 
              onClick={onAddAccount}
              className="col-span-2 border border-dashed border-neutral-muted/40 p-3 text-xs font-mono text-neutral-muted hover:text-primary hover:border-primary/50 transition-colors flex items-center justify-center gap-2 bg-background-panel"
            >
              <span className="material-symbols-outlined text-sm">add</span> 新しい口座を連携
            </button>
          </div>
        </div>

        {/* Right Column: Fixed Costs */}
        <div className="col-span-12 lg:col-span-8 flex flex-col">
          <div className="hud-panel flex-1 rounded-sm border border-border-subtle flex flex-col relative bg-background-panel">
            <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-background-panel/50 backdrop-blur-sm sticky top-0 z-20">
              <div className="flex items-center gap-4">
                <div className="w-1 h-6 bg-primary"></div>
                <div>
                  <h3 className="text-xl font-bold text-neutral-light tracking-wide uppercase">固定費</h3>
                  <p className="text-[10px] text-neutral-muted font-mono uppercase tracking-widest font-bold">アクティブなキュー管理</p>
                </div>
                <span className="ml-2 bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 border border-primary/30 rounded-sm">
                  {monthlyCosts.filter(c => c.status === 'pending').length} 件保留中
                </span>
              </div>
              <button 
                onClick={onAddItem}
                className="flex items-center gap-2 text-xs font-bold text-primary hover:text-white transition-colors bg-primary/5 hover:bg-primary px-3 py-1.5 rounded-sm border border-transparent hover:border-primary/30"
              >
                <span className="material-symbols-outlined text-sm">add</span> 項目を追加
              </button>
            </div>
            
            <div className="grid grid-cols-12 px-6 py-2 bg-background-element border-b border-border-subtle text-[10px] font-mono font-bold text-neutral-muted uppercase tracking-wider sticky top-0 z-10">
              <div className="col-span-1 text-center">ステータス</div>
              <div className="col-span-4 pl-2">説明 / 期限</div>
              <div className="col-span-3">出所</div>
              <div className="col-span-2">予定日</div>
              <div className="col-span-2 text-right">金額</div>
            </div>

            <div className="overflow-x-auto overflow-y-auto custom-scrollbar max-h-[600px]">
              <div className="divide-y divide-border-subtle min-w-[800px]">
                {monthlyCosts.map(cost => (
                  <div key={cost.id} className={`group grid grid-cols-12 px-6 py-4 items-center hover:bg-background-element transition-colors relative ${cost.status === 'pending' && new Date().getDate() > cost.paymentDay ? 'bg-accent-danger/5 border-l-2 border-accent-danger' : ''}`}>
                    <div className="col-span-1 flex justify-center">
                      {cost.status === 'paid' ? (
                        <button
                          onClick={() => onCancelPayment(cost.id)}
                          className="w-5 h-5 rounded-sm bg-accent-success/20 border border-accent-success/50 text-accent-success hover:bg-accent-success/30 transition-all flex items-center justify-center"
                          title="支払取消"
                        >
                          <span className="material-symbols-outlined text-sm font-bold">undo</span>
                        </button>
                      ) : cost.status === 'skipped' ? (
                        <button
                          onClick={() => onUnskipCost(cost.id)}
                          className="w-5 h-5 rounded-sm bg-neutral-muted/20 border border-neutral-muted/50 text-neutral-muted hover:bg-neutral-muted/30 transition-all flex items-center justify-center"
                          title="スキップ取消"
                        >
                          <span className="material-symbols-outlined text-sm font-bold">refresh</span>
                        </button>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            onClick={() => onEditCost && onEditCost({ id: cost.id, name: cost.name, amount: cost.budget, dueDate: `${cost.paymentDate.getFullYear()}-${String(cost.paymentDate.getMonth() + 1).padStart(2, '0')}-${String(cost.paymentDate.getDate()).padStart(2, '0')}`, bankId: cost.temporaryAccountId || cost.bankAccountId, status: cost.status === 'paid' ? 'PAID' : 'PENDING' } as FixedCost)}
                            className="w-5 h-5 rounded-sm border border-neutral-muted hover:border-primary hover:bg-primary/10 transition-all flex items-center justify-center"
                            title="支払実行"
                          >
                            <span className="material-symbols-outlined text-sm">payment</span>
                          </button>
                          <button
                            onClick={() => onSkipCost(cost.id)}
                            className="w-5 h-5 rounded-sm border border-neutral-muted hover:border-accent-danger hover:bg-accent-danger/10 transition-all flex items-center justify-center"
                            title="スキップ"
                          >
                            <span className="material-symbols-outlined text-sm">block</span>
                          </button>
                          <button
                            onClick={() => onDeleteItem && onDeleteItem(cost.id)}
                            className="w-5 h-5 rounded-sm border border-neutral-muted hover:border-accent-danger hover:bg-accent-danger/10 transition-all flex items-center justify-center"
                            title="削除"
                          >
                            <span className="material-symbols-outlined text-sm text-accent-danger">delete</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="col-span-4 pl-2">
                      <p className={`font-medium text-sm ${cost.status === 'paid' ? 'text-neutral-muted line-through' : cost.status === 'skipped' ? 'text-neutral-muted line-through' : 'text-neutral-light'}`}>{cost.name}</p>
                      {cost.status === 'paid' && <p className="text-[10px] text-accent-success/70 font-mono mt-0.5">実行済み</p>}
                      {cost.status === 'skipped' && <p className="text-[10px] text-neutral-muted/70 font-mono mt-0.5">スキップ済み</p>}
                      {cost.status === 'pending' && cost.paymentDate < new Date() && (
                        <p className="text-[10px] text-accent-danger font-bold mt-0.5 flex items-center gap-1 font-mono uppercase">
                          <span className="material-symbols-outlined text-[10px] filled animate-pulse">warning</span> 期限超過
                        </p>
                      )}
                    </div>
                    <div className="col-span-3 text-xs text-neutral-muted font-mono">
                      {editingField?.costId === cost.id && editingField.field === 'bankAccountId' ? (
                        <select
                          value={editingValue}
                          onChange={(e) => {
                            setEditingValue(e.target.value);
                            onUpdateItem && onUpdateItem(cost.id, { bankAccountId: e.target.value });
                            setEditingField(null);
                          }}
                          className="w-full bg-background-element border border-primary p-1 text-xs"
                          autoFocus
                        >
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                          ))}
                        </select>
                      ) : (
                        <div
                          onClick={() => {
                            setEditingValue(cost.temporaryAccountId || cost.bankAccountId);
                            setEditingField({ costId: cost.id, field: 'bankAccountId' });
                          }}
                          className="cursor-pointer hover:bg-background-element/50 px-1 py-0.5 rounded"
                        >
                          {accounts.find(a => a.id === (cost.temporaryAccountId || cost.bankAccountId))?.name}
                        </div>
                      )}
                    </div>
                    <div className="col-span-2 text-xs text-neutral-muted font-mono">
                      {editingField?.costId === cost.id && editingField.field === 'paymentDay' ? (
                        <input
                          type="date"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={(e) => {
                            onUpdateItem && onUpdateItem(cost.id, { paymentDate: new Date(e.target.value) });
                            setEditingField(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              onUpdateItem && onUpdateItem(cost.id, { paymentDate: new Date(e.currentTarget.value) });
                              setEditingField(null);
                            } else if (e.key === 'Escape') {
                              setEditingField(null);
                            }
                          }}
                          className="w-full bg-background-element border border-primary p-1 text-xs"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => {
                            setEditingValue(cost.paymentDate.toISOString().split('T')[0]);
                            setEditingField({ costId: cost.id, field: 'paymentDay' });
                          }}
                          className="cursor-pointer hover:bg-background-element/50 px-1 py-0.5 rounded"
                        >
                          {(() => {
                            const date = cost.paymentDate;
                            return `${date.getMonth() + 1}/${date.getDate()}`;
                          })()}
                        </div>
                      )}
                    </div>
                    <div className="col-span-2 text-right font-mono font-bold text-neutral-light">
                      {editingField?.costId === cost.id && editingField.field === 'budget' ? (
                        <input
                          type="number"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            onUpdateItem && onUpdateItem(cost.id, { budget: value });
                            setEditingField(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const value = parseInt(e.currentTarget.value) || 0;
                              onUpdateItem && onUpdateItem(cost.id, { budget: value });
                              setEditingField(null);
                            } else if (e.key === 'Escape') {
                              setEditingField(null);
                            }
                          }}
                          className="w-full bg-background-element border border-primary p-1 text-xs font-mono text-right"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={() => {
                            setEditingValue(cost.budget.toString());
                            setEditingField({ costId: cost.id, field: 'budget' });
                          }}
                          className="cursor-pointer hover:bg-background-element/50 px-1 py-0.5 rounded"
                        >
                          ¥{(cost.actualAmount || cost.budget).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-3 bg-background-panel border-t border-border-subtle flex justify-center sticky bottom-0 z-20">
              <button className="text-xs font-mono font-bold text-neutral-muted hover:text-primary transition-colors flex items-center gap-2 px-4 py-2 hover:bg-background-element rounded-sm">
                全履歴を表示 <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
