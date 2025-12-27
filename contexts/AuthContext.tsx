// @refresh reset
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signInAnonymously, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInAnonymously: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (!user) {
        try {
          setLoading(true);
          await signInAnonymously(auth);
        } catch (err) {
          setError(err instanceof Error ? err.message : '自動ログインに失敗しました');
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const handleSignInAnonymously = async () => {
    try {
      setError(null);
      setLoading(true);
      await signInAnonymously(auth);
    } catch (err) {
      setError(err instanceof Error ? err.message : '匿名ログインに失敗しました');
      setLoading(false);
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Googleログインに失敗しました');
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      await auth.signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログアウトに失敗しました');
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    signInAnonymously: handleSignInAnonymously,
    signInWithGoogle: handleSignInWithGoogle,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};