
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
    idToken: string | null;
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
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  const handleAuthStateChanged = useCallback(async (fbUser: FirebaseUser | null) => {
    setLoading(true);
    setFirebaseUser(fbUser);

    if (fbUser) {
      const tokenResult = await fbUser.getIdTokenResult();
      const userIsAdmin = tokenResult.claims.admin === true;

      setIdToken(tokenResult.token);
      setIsAdmin(userIsAdmin);

      const userDocRef = doc(db, 'users', fbUser.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        const dbUser = userDoc.data();
        const appUser: User = { 
          uid: fbUser.uid, 
          name: dbUser.name,
          email: dbUser.email,
          // Trust the custom claim for the role, but fallback to firestore
          role: userIsAdmin ? 'admin' : (dbUser.role || 'user'),
        };
        setUser(appUser);
        // If the role in DB is out of sync with claim, update it
        if (appUser.role !== dbUser.role) {
            await setDoc(userDocRef, { role: appUser.role }, { merge: true });
        }
      } else {
        setUser(null);
      }
    } else {
      setUser(null);
      setIdToken(null);
      setIsAdmin(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChanged);
    return () => unsubscribe();
  }, [handleAuthStateChanged]);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const signup = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      const fbUser = userCredential.user;
      const newUser: Omit<User, 'uid' | 'role'> & {role: 'user'} = {
        name,
        email: fbUser.email!,
        role: 'user', // Default role for new signups
      };
      await setDoc(doc(db, 'users', fbUser.uid), newUser);

      // We don't set user state directly, onAuthStateChanged will handle it
      // which ensures custom claims are also processed on first login.
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
    idToken,
    loading, 
    isAdmin,
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
