'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import dynamic from 'next/dynamic';

// Types
interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  authError: string | null;
}

// Create the context
const AuthContext = createContext<AuthContextType | null>(null);

// Dynamic import of firebase
const FirebaseAuthProvider = dynamic(
  async () => {
    // Import firebase modules
    const { 
      signInWithEmailAndPassword, 
      createUserWithEmailAndPassword,
      updateProfile, 
      sendPasswordResetEmail,
      onAuthStateChanged,
      GoogleAuthProvider,
      signInWithPopup 
    } = await import('firebase/auth');
    
    // Import firebase config
    const { auth } = await import('../firebase/config');
    
    return function Provider({ children }: { children: ReactNode }) {
      const [user, setUser] = useState<User | null>(null);
      const [loading, setLoading] = useState(true);
      const [authError, setAuthError] = useState<string | null>(null);
      
      useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            // User is signed in
            setUser({
              uid: user.uid,
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL
            });
          } else {
            // User is signed out
            setUser(null);
          }
          setLoading(false);
        });
        
        // Cleanup subscription
        return () => unsubscribe();
      }, []);
      
      // Sign in with email and password
      const signIn = async (email: string, password: string) => {
        setLoading(true);
        setAuthError(null);
        try {
          await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
          setAuthError((error as Error).message);
          throw error;
        } finally {
          setLoading(false);
        }
      };
      
      // Sign up with email and password
      const signUp = async (email: string, password: string, displayName: string) => {
        setLoading(true);
        setAuthError(null);
        try {
          const result = await createUserWithEmailAndPassword(auth, email, password);
          
          // Update profile with display name
          await updateProfile(result.user, {
            displayName
          });
          
          // Update local user state with display name
          if (user) {
            setUser({
              ...user,
              displayName
            });
          }
        } catch (error) {
          setAuthError((error as Error).message);
          throw error;
        } finally {
          setLoading(false);
        }
      };
      
      // Sign out
      const signOut = async () => {
        setLoading(true);
        setAuthError(null);
        try {
          await import('firebase/auth').then(({ signOut }) => signOut(auth));
        } catch (error) {
          setAuthError((error as Error).message);
          throw error;
        } finally {
          setLoading(false);
        }
      };
      
      // Reset password
      const resetPassword = async (email: string) => {
        setLoading(true);
        setAuthError(null);
        try {
          await sendPasswordResetEmail(auth, email);
        } catch (error) {
          setAuthError((error as Error).message);
          throw error;
        } finally {
          setLoading(false);
        }
      };
      
      // Sign in with Google
      const signInWithGoogle = async () => {
        setLoading(true);
        setAuthError(null);
        try {
          const provider = new GoogleAuthProvider();
          await signInWithPopup(auth, provider);
        } catch (error) {
          setAuthError((error as Error).message);
          throw error;
        } finally {
          setLoading(false);
        }
      };
      
      const value = {
        user,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        signInWithGoogle,
        authError
      };
      
      return (
        <AuthContext.Provider value={value}>
          {children}
        </AuthContext.Provider>
      );
    };
  },
  {
    ssr: false,
    loading: ({ error }) => {
      if (error) {
        return <div>Error loading authentication system</div>;
      }
      return <div>Loading authentication system...</div>;
    },
  }
);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  return <FirebaseAuthProvider>{children}</FirebaseAuthProvider>;
}

// Hook for using the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 