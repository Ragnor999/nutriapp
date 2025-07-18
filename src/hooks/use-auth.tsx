
'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAuth,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { app, db } from '@/lib/firebase';

const auth = getAuth(app);

type User = {
  uid: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
};

interface AuthContextType {
    user: User | null;
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    isAdmin: boolean;
    login: (email: string, pass: string) => Promise<any>;
    signup: (email: string, pass: string, name: string) => Promise<any>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleAuthStateChanged = useCallback(async (fbUser: FirebaseUser | null) => {
    setFirebaseUser(fbUser);
    if (fbUser) {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setUser({ uid: fbUser.uid, ...userDoc.data() } as User);
      } else {
         // This case handles newly signed up users who don't have a doc yet.
         // It will be created in the signup function.
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChanged);
    return () => unsubscribe();
  }, [handleAuthStateChanged]);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    return signInWithEmailAndPassword(auth, email, pass).finally(() => setLoading(false));
  };
  
  const signup = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const fbUser = userCredential.user;
      const newUser: User = {
        uid: fbUser.uid,
        name,
        email: fbUser.email!,
        role: 'user', // Default role for new signups
      };
      await setDoc(doc(db, 'users', fbUser.uid), {
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      });
      setUser(newUser);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };


  const logout = useCallback(async () => {
    await firebaseSignOut(auth);
    router.push('/login');
  }, [router]);

  const authContextValue = { 
    user, 
    firebaseUser, 
    loading, 
    isAdmin: user?.role === 'admin',
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
