
import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const Login: React.FC = () => {
  const { signInAnonymously, signInWithGoogle, loading, error } = useAuth();
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-6">
      <div className="flex flex-col items-center gap-3 mb-2">
        <div className="size-12 bg-background-panel border border-primary/30 rounded flex items-center justify-center text-primary shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-3xl">dataset</span>
        </div>
        <h1 className="text-2xl font-black tracking-widest uppercase text-neutral-light">
          BudgetFlow <span className="text-primary text-xs ml-1 align-top opacity-70">ID</span>
        </h1>
      </div>

      <div className="hud-panel rounded-sm p-8 w-full max-w-[420px] flex flex-col gap-6 shadow-xl">
        <div className="hud-corner hud-corner-tl"></div><div className="hud-corner hud-corner-tr"></div>
        <div className="hud-corner hud-corner-bl"></div><div className="hud-corner hud-corner-br"></div>
        
        <div className="text-center">
          <h2 className="text-lg font-bold text-neutral-light">おかえりなさい</h2>
          <p className="text-xs text-neutral-muted mt-1">アカウントにログインして家計管理を続けましょう</p>
        </div>

        <form className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-muted uppercase tracking-wider block">メールアドレス</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-muted group-focus-within:text-primary transition-colors text-lg">mail</span>
              <input 
                className="w-full bg-background-element border border-border-subtle rounded-sm text-sm text-neutral-light focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all pl-10 pr-3 py-2.5" 
                placeholder="example@budgetflow.jp" 
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-neutral-muted uppercase tracking-wider block">パスワード</label>
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-muted group-focus-within:text-primary transition-colors text-lg">lock</span>
              <input 
                type="password"
                className="w-full bg-background-element border border-border-subtle rounded-sm text-sm text-neutral-light focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all pl-10 pr-3 py-2.5" 
                placeholder="••••••••" 
              />
            </div>
          </div>
          <div className="flex justify-end">
            <a href="#" className="text-xs text-primary hover:underline">パスワードを忘れた場合</a>
          </div>
          {error && (
            <div className="text-red-500 text-xs text-center">{error}</div>
          )}
          <button
            type="button"
            onClick={signInAnonymously}
            disabled={loading}
            className="cyber-btn mt-2 w-full py-3 bg-primary text-white text-sm font-bold uppercase tracking-wider hover:bg-primary-dark transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">login</span>
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
          <p className="text-xs text-neutral-muted text-center">
            匿名ログインでは、ブラウザのデータをクリアするとデータが失われる可能性があります。
          </p>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-border-subtle"></div>
          <span className="flex-shrink-0 mx-4 text-xs text-neutral-muted font-mono">または</span>
          <div className="flex-grow border-t border-border-subtle"></div>
        </div>

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full py-2.5 bg-white border border-border-subtle hover:bg-background-element rounded-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5" alt="Google" />
          <span className="text-sm font-bold text-neutral-light">新規登録してはじめる</span>
        </button>
      </div>
      
      <p className="text-xs text-neutral-muted">
        アカウントをお持ちでない場合は <a href="#" className="text-primary font-bold hover:underline">新規登録</a>
      </p>
    </div>
  );
};
