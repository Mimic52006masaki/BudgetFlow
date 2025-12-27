
import React, { useState, useEffect } from 'react';
import { FixedCost, BankAccount, FixedCostTemplate } from '../types';
import { NumberInput } from './NumberInput';

interface ModalProps {
  type: 'ACCOUNT' | 'ACCOUNT_EDIT' | 'COST_EDIT' | 'ITEM_ADD' | 'TEMPLATE' | 'TEMPLATE_EDIT';
  cost?: FixedCost;
  account?: BankAccount;
  template?: FixedCostTemplate;
  accounts?: BankAccount[];
  onClose: () => void;
  onSave?: (data: any) => void;
  onPayCost?: (costId: string, amount: number, accountId: string) => void;
  onDelete?: (action: 'check' | 'delete', accountId: string) => Promise<any>;
}

const BANK_ICONS = ['account_balance', 'credit_card', 'savings', 'wallet', 'account_balance_wallet', 'credit_score'];
const COLORS = [
  { name: 'Primary', class: 'bg-primary', value: 'bg-primary' },
  { name: 'Danger', class: 'bg-accent-danger', value: 'bg-accent-danger' },
  { name: 'Success', class: 'bg-accent-success', value: 'bg-accent-success' },
  { name: 'Purple', class: 'bg-accent-purple', value: 'bg-accent-purple' },
  { name: 'Cyan', class: 'bg-accent-cyan', value: 'bg-accent-cyan' },
  { name: 'Orange', class: 'bg-accent-orange', value: 'bg-accent-orange' },
];

export const Modal: React.FC<ModalProps> = ({ type, cost, account, template, accounts = [], onClose, onSave, onPayCost, onDelete }) => {
  const [formData, setFormData] = useState({
    name: account?.name || template?.name || '',
    balance: account?.balance || 0,
    icon: account?.icon || 'account_balance',
    color: account?.color || 'bg-primary',
    defaultBudget: template?.defaultBudget || '',
    bankAccountId: template?.bankAccountId || accounts[0]?.id || '',
    paymentDay: template?.paymentDay || 1,
    paymentDate: type === 'ITEM_ADD' ? new Date().toISOString().split('T')[0] : (template?.paymentDay ? new Date(new Date().getFullYear(), new Date().getMonth(), template.paymentDay).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
    amount: cost?.amount || '',
    paymentAccountId: cost?.bankId || accounts[0]?.id || ''
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteCheck, setDeleteCheck] = useState<{ canDelete: boolean; reason?: string } | null>(null);

  const handleSave = () => {
    if (type === 'COST_EDIT' && onPayCost && cost) {
      onPayCost(cost.id, typeof formData.amount === 'string' ? 0 : formData.amount, formData.paymentAccountId);
    } else if (onSave) {
      const saveData = {
        ...formData,
        defaultBudget: typeof formData.defaultBudget === 'string' ? 0 : formData.defaultBudget,
        amount: typeof formData.amount === 'string' ? 0 : formData.amount
      };
      onSave(saveData);
    }
    onClose();
  };

  const handleDeleteClick = async () => {
    if (!account || !onDelete) return;
    const check = await onDelete('check', account.id);
    setDeleteCheck(check);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!account || !onDelete) return;
    await onDelete('delete', account.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-neutral-light/20 backdrop-blur-sm" onClick={onClose}></div>
      <div className="hud-panel w-full max-w-lg bg-background-panel shadow-2xl relative z-10 flex flex-col rounded-sm">
        <div className="hud-corner hud-corner-tl"></div><div className="hud-corner hud-corner-tr"></div>
        <div className="hud-corner hud-corner-bl"></div><div className="hud-corner hud-corner-br"></div>
        
        <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-background-panel">
          <h3 className="text-lg font-bold text-neutral-light tracking-wider uppercase flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              {type === 'ACCOUNT' || type === 'ACCOUNT_EDIT' ? 'add_card' : type === 'TEMPLATE' || type === 'TEMPLATE_EDIT' ? 'description' : type === 'COST_EDIT' ? 'edit' : 'add'}
            </span>
            {type === 'ACCOUNT' ? '口座を追加' : type === 'ACCOUNT_EDIT' ? '口座を編集' : type === 'TEMPLATE' ? 'テンプレートを追加' : type === 'TEMPLATE_EDIT' ? 'テンプレートを編集' : type === 'COST_EDIT' ? '支払い情報の編集' : '新しい項目の追加'}
          </h3>
          <button onClick={onClose} className="text-neutral-muted hover:text-accent-danger transition-colors p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-8 flex flex-col gap-6">
          {type === 'COST_EDIT' && (
            <div className="p-3 bg-primary/5 border border-primary/10 rounded-sm flex items-start gap-3">
              <span className="material-symbols-outlined text-primary mt-0.5">info</span>
              <p className="text-xs text-neutral-muted leading-relaxed">
                この項目の支払い実績として記録する金額と日付を入力してください。
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-muted uppercase tracking-wider block">
                {(type === 'ACCOUNT' || type === 'ACCOUNT_EDIT') ? '口座名称' : (type === 'ITEM_ADD') ? '項目名称' : 'テンプレート名称'}
              </label>
              <input
                className="w-full bg-background-element border border-border-subtle p-3 text-sm text-neutral-light focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm transition-all"
                placeholder={(type === 'ACCOUNT' || type === 'ACCOUNT_EDIT') ? '例: メインバンク' : (type === 'ITEM_ADD') ? '例: コーヒー代' : '例: Netflix, 家賃'}
                value={(type === 'ACCOUNT' || type === 'ACCOUNT_EDIT' || type === 'TEMPLATE' || type === 'TEMPLATE_EDIT' || type === 'ITEM_ADD') ? formData.name : (cost?.name || '')}
                onChange={(e) => {
                  if (type === 'ACCOUNT' || type === 'ACCOUNT_EDIT' || type === 'TEMPLATE' || type === 'TEMPLATE_EDIT' || type === 'ITEM_ADD') {
                    setFormData(prev => ({ ...prev, name: e.target.value }));
                  }
                }}
                defaultValue={(type !== 'ACCOUNT' && type !== 'ACCOUNT_EDIT' && type !== 'TEMPLATE' && type !== 'TEMPLATE_EDIT' && type !== 'ITEM_ADD') ? (cost?.name || '') : undefined}
              />
            </div>

            {(type === 'TEMPLATE' || type === 'TEMPLATE_EDIT') && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-muted uppercase tracking-wider block">予算金額</label>
                  <NumberInput
                    value={formData.defaultBudget}
                    onChange={(value) => setFormData(prev => ({ ...prev, defaultBudget: value }))}
                    className="w-full bg-background-element border border-border-subtle p-3 text-sm text-neutral-light font-mono text-right outline-none rounded-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    prefix="¥"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-muted uppercase tracking-wider block">支払予定日</label>
                  <input
                    type="date"
                    className="w-full bg-background-element border border-border-subtle p-3 text-sm text-neutral-light font-mono outline-none rounded-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    value={formData.paymentDate}
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      const day = selectedDate.getDate();
                      setFormData(prev => ({ ...prev, paymentDay: day, paymentDate: e.target.value }));
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-muted uppercase tracking-wider block">引き落とし口座</label>
                  <select
                    className="w-full bg-background-element border border-border-subtle p-3 text-sm text-neutral-light focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm transition-all"
                    value={formData.bankAccountId}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankAccountId: e.target.value }))}
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {(type === 'ACCOUNT' || type === 'ACCOUNT_EDIT') && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-muted uppercase tracking-wider block">
                  {type === 'ACCOUNT' ? '初期残高' : '残高'}
                </label>
                <NumberInput
                  value={formData.balance}
                  onChange={(value) => setFormData(prev => ({ ...prev, balance: value }))}
                  className="w-full bg-background-element border border-border-subtle p-3 text-sm text-neutral-light font-mono text-right outline-none rounded-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  prefix="¥"
                />
              </div>
            )}

            {(type === 'COST_EDIT' || type === 'ITEM_ADD') && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-muted uppercase tracking-wider block">金額</label>
                  <NumberInput
                    value={formData.amount}
                    onChange={(value) => setFormData(prev => ({ ...prev, amount: value }))}
                    className="w-full bg-background-element border border-border-subtle p-3 text-sm text-neutral-light font-mono text-right outline-none rounded-sm focus:border-primary focus:ring-1 focus:ring-primary"
                    prefix="¥"
                  />
                </div>
                {(type === 'COST_EDIT' || type === 'ITEM_ADD') && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-muted uppercase tracking-wider block">支払い口座</label>
                    <select
                      className="w-full bg-background-element border border-border-subtle p-3 text-sm text-neutral-light focus:border-primary focus:ring-1 focus:ring-primary outline-none rounded-sm transition-all"
                      value={formData.paymentAccountId || formData.bankAccountId}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentAccountId: e.target.value, bankAccountId: e.target.value }))}
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {(type === 'ACCOUNT' || type === 'ACCOUNT_EDIT') && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-muted uppercase tracking-wider block">アイコン</label>
                  <div className="grid grid-cols-6 gap-2">
                    {BANK_ICONS.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon }))}
                        className={`p-2 border rounded-sm transition-all ${formData.icon === icon ? 'border-primary bg-primary/10' : 'border-border-subtle hover:border-primary/50'}`}
                      >
                        <span className="material-symbols-outlined text-lg">{icon}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-muted uppercase tracking-wider block">テーマカラー</label>
                  <div className="grid grid-cols-6 gap-2">
                    {COLORS.map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                        className={`p-2 border rounded-sm transition-all ${formData.color === color.value ? 'border-primary' : 'border-border-subtle hover:border-primary/50'}`}
                      >
                        <div className={`w-4 h-4 rounded ${color.class}`}></div>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {type === 'COST_EDIT' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-muted uppercase tracking-wider block">日付</label>
                <input
                  type="date"
                  className="w-full bg-background-element border border-border-subtle p-3 text-sm text-neutral-light font-mono outline-none rounded-sm focus:border-primary"
                  value={cost?.dueDate || ''}
                />
              </div>
            )}
            {type === 'ITEM_ADD' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-muted uppercase tracking-wider block">支払予定日</label>
                <input
                  type="date"
                  className="w-full bg-background-element border border-border-subtle p-3 text-sm text-neutral-light font-mono outline-none rounded-sm focus:border-primary focus:ring-1 focus:ring-primary"
                  value={formData.paymentDate}
                  onChange={(e) => {
                    const selectedDate = new Date(e.target.value);
                    const day = selectedDate.getDate();
                    setFormData(prev => ({ ...prev, paymentDay: day, paymentDate: e.target.value }));
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-border-subtle flex justify-between bg-background-element/30">
          {type === 'TEMPLATE_EDIT' && onDelete && (
            <button onClick={handleDeleteClick} className="px-6 py-2.5 border border-accent-danger text-accent-danger text-xs font-bold uppercase tracking-wider hover:bg-accent-danger/10 rounded-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">delete</span>
              削除
            </button>
          )}
          {type === 'ACCOUNT_EDIT' && onDelete && (
            <button onClick={handleDeleteClick} className="px-6 py-2.5 border border-accent-danger text-accent-danger text-xs font-bold uppercase tracking-wider hover:bg-accent-danger/10 rounded-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">delete</span>
              削除
            </button>
          )}
          <div className="flex gap-3 ml-auto">
            <button onClick={onClose} className="px-6 py-2.5 border border-border-subtle text-neutral-muted text-xs font-bold uppercase tracking-wider hover:bg-background-element rounded-sm">
              キャンセル
            </button>
            <button onClick={handleSave} className="cyber-btn px-8 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-wider hover:bg-primary-dark transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">{type === 'COST_EDIT' ? 'payment' : 'save'}</span>
              {type === 'COST_EDIT' ? '支払実行' : '保存'}
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-neutral-light/50 backdrop-blur-sm" onClick={() => setShowDeleteConfirm(false)}></div>
          <div className="hud-panel w-full max-w-md bg-background-panel shadow-2xl relative z-10 flex flex-col rounded-sm">
            <div className="hud-corner hud-corner-tl"></div><div className="hud-corner hud-corner-tr"></div>
            <div className="hud-corner hud-corner-bl"></div><div className="hud-corner hud-corner-br"></div>

            <div className="flex items-center justify-between p-6 border-b border-border-subtle bg-background-panel">
              <h3 className="text-lg font-bold text-neutral-light tracking-wider uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-accent-danger">warning</span>
                {type === 'TEMPLATE_EDIT' ? 'テンプレートを削除' : '口座を削除'}
              </h3>
              <button onClick={() => setShowDeleteConfirm(false)} className="text-neutral-muted hover:text-accent-danger transition-colors p-1">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-8 flex flex-col gap-4">
              {type === 'TEMPLATE_EDIT' ? (
                <p className="text-sm text-neutral-muted leading-relaxed">
                  このテンプレートを削除してもよろしいですか？<br />
                  この操作は取り消すことができません。
                </p>
              ) : deleteCheck?.canDelete ? (
                <p className="text-sm text-neutral-muted leading-relaxed">
                  この口座を削除してもよろしいですか？<br />
                  この操作は取り消すことができません。
                </p>
              ) : (
                <div className="p-4 bg-accent-danger/10 border border-accent-danger/20 rounded-sm">
                  <p className="text-sm text-accent-danger leading-relaxed">
                    この口座は{deleteCheck?.reason === 'templates' ? 'テンプレート' : 'ToDo'}で使用されているため、削除できません。<br />
                    まず関連する項目を削除または変更してください。
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border-subtle flex justify-end gap-3 bg-background-element/30">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-6 py-2.5 border border-border-subtle text-neutral-muted text-xs font-bold uppercase tracking-wider hover:bg-background-element rounded-sm">
                キャンセル
              </button>
              {type === 'TEMPLATE_EDIT' ? (
                <button onClick={handleConfirmDelete} className="px-6 py-2.5 bg-accent-danger text-white text-xs font-bold uppercase tracking-wider hover:bg-accent-danger-dark transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">delete</span>
                  削除
                </button>
              ) : deleteCheck?.canDelete && (
                <button onClick={handleConfirmDelete} className="px-6 py-2.5 bg-accent-danger text-white text-xs font-bold uppercase tracking-wider hover:bg-accent-danger-dark transition-all flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">delete</span>
                  削除
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
