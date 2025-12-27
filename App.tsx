
import React, { useState } from 'react';
import { View, FixedCost, BankAccount, FixedCostTemplate } from './types';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { HistoryTable } from './components/HistoryTable';
import { Login } from './components/Login';
import { Modal } from './components/Modals';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MOCK_ACCOUNTS } from './constants';
import { useAccounts } from './hooks/useAccounts';
import { useTemplates } from './hooks/useTemplates';
import { useSalaryPeriods } from './hooks/useSalaryPeriods';
import { useMonthlyCosts } from './hooks/useMonthlyCosts';
import { useHistory } from './hooks/useHistory';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ErrorBoundary } from './components/ErrorBoundary';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<View>(View.DASHBOARD);
  const { accounts: firestoreAccounts, addAccount, updateAccount, checkAccountUsage, deleteAccount } = useAccounts();
  const { templates, addTemplate, updateTemplate, archiveTemplate, deleteTemplate } = useTemplates();
  const { activePeriod, startNewPeriod, closePeriod } = useSalaryPeriods();
  const { monthlyCosts, payCost, cancelPayment, skipCost, unskipCost, addItem, deleteItem, updateItem } = useMonthlyCosts(activePeriod?.id);
  const { records } = useHistory();
  const accounts = firestoreAccounts.length > 0 ? firestoreAccounts : MOCK_ACCOUNTS;
  const [modal, setModal] = useState<{ type: 'ACCOUNT' | 'ACCOUNT_EDIT' | 'TEMPLATE' | 'TEMPLATE_EDIT' | 'COST_EDIT' | 'ITEM_ADD', cost?: FixedCost, account?: BankAccount, template?: FixedCostTemplate } | null>(null);

  const handleSaveAccount = async (accountData: Omit<BankAccount, 'id' | 'trend'>) => {
    if (modal?.type === 'ACCOUNT_EDIT' && modal.account) {
      await updateAccount(modal.account.id, accountData);
    } else {
      await addAccount(accountData);
    }
  };

  const handleDeleteAccount = async (action: 'check' | 'delete', accountId: string) => {
    if (action === 'check') {
      return await checkAccountUsage(accountId);
    } else {
      await deleteAccount(accountId);
    }
  };

  const handleSaveTemplate = async (templateData: any) => {
    const { name, defaultBudget, bankAccountId, paymentDay } = templateData;
    const processedData = {
      name,
      defaultBudget: typeof defaultBudget === 'string' ? 0 : defaultBudget,
      bankAccountId,
      paymentDay
    };

    if (modal?.type === 'TEMPLATE_EDIT' && modal.template) {
      await updateTemplate(modal.template.id, processedData);
    } else {
      await addTemplate(processedData);
    }
  };

  const handleDeleteTemplate = async (action: 'check' | 'delete', templateId: string) => {
    if (action === 'delete') {
      await deleteTemplate(templateId);
    }
  };

  const handleDeleteTemplateDirect = async (templateId: string) => {
    await deleteTemplate(templateId);
  };

  const handleSaveItem = async (itemData: any) => {
    const { name, amount, bankAccountId, paymentDate } = itemData;
    await addItem({ name, amount: typeof amount === 'string' ? 0 : amount, bankAccountId, paymentDate: new Date(paymentDate) });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (currentView) {
      case View.DASHBOARD:
        return (
          <Dashboard
            accounts={accounts}
            templates={templates}
            monthlyCosts={monthlyCosts}
            activePeriod={activePeriod}
            onAddAccount={() => setModal({ type: 'ACCOUNT' })}
            onEditAccount={(account) => setModal({ type: 'ACCOUNT_EDIT', account })}
            onDeleteAccount={handleDeleteAccount}
            onAddTemplate={() => setModal({ type: 'TEMPLATE' })}
            onEditTemplate={(template) => setModal({ type: 'TEMPLATE_EDIT', template })}
            onDeleteTemplate={handleDeleteTemplateDirect}
            onAddItem={() => setModal({ type: 'ITEM_ADD' })}
            onEditCost={(cost) => setModal({ type: 'COST_EDIT', cost })}
            onDeleteItem={deleteItem}
            onUpdateItem={updateItem}
            onStartNewPeriod={startNewPeriod}
            onClosePeriod={closePeriod}
            onPayCost={payCost}
            onCancelPayment={cancelPayment}
            onSkipCost={skipCost}
            onUnskipCost={unskipCost}
          />
        );
      case View.HISTORY:
        return <HistoryTable records={records} accounts={accounts} />;
      case View.LOGIN:
        return <Login />;
      default:
        return <Dashboard
          onAddAccount={() => setModal({ type: 'ACCOUNT' })}
          onDeleteAccount={handleDeleteAccount}
          onAddTemplate={() => setModal({ type: 'TEMPLATE' })}
          onDeleteTemplate={handleDeleteTemplateDirect}
          onAddItem={() => setModal({ type: 'ITEM_ADD' })}
          onEditCost={(cost) => setModal({ type: 'COST_EDIT', cost })}
          onDeleteItem={deleteItem}
          onUpdateItem={updateItem}
        />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header currentView={currentView} onViewChange={setCurrentView} />

      <main className="flex-1 w-full max-w-[1920px] mx-auto p-4 md:p-6 lg:p-8">
        {renderContent()}
      </main>

      {modal && (
        <Modal
          type={modal.type}
          cost={modal.cost}
          account={modal.account}
          template={modal.template}
          accounts={accounts}
          onClose={() => setModal(null)}
          onSave={(modal.type === 'ACCOUNT' || modal.type === 'ACCOUNT_EDIT') ? handleSaveAccount : (modal.type === 'TEMPLATE' || modal.type === 'TEMPLATE_EDIT') ? handleSaveTemplate : modal.type === 'ITEM_ADD' ? handleSaveItem : undefined}
          onPayCost={payCost}
          onDelete={(modal.type === 'ACCOUNT_EDIT') ? handleDeleteAccount : (modal.type === 'TEMPLATE_EDIT') ? handleDeleteTemplate : undefined}
        />
      )}

      <footer className="p-6 text-center">
        <div className="flex justify-center gap-4 text-[10px] text-neutral-muted/60 uppercase font-mono tracking-widest">
          <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          <span>•</span>
          <a href="#" className="hover:text-primary transition-colors">Terms</a>
          <span>•</span>
          <a href="#" className="hover:text-primary transition-colors">Help</a>
          <span>•</span>
          <span>© 2023 BudgetFlow CMD v1.0.4</span>
        </div>
      </footer>
      <ToastContainer aria-label="通知" />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
