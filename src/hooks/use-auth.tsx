
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
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
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

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      setFirebaseUser(fbUser);

      if (fbUser) {
        const token = await fbUser.getIdToken();
        setIdToken(token);

        const userDocRef = doc(db, 'users', fbUser.uid);
        const unsubscribeFirestore = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            const dbUser = userDoc.data();
            const userIsAdmin = dbUser.role === 'admin';
            setIsAdmin(userIsAdmin);
            
            const appUser: User = { 
              uid: fbUser.uid, 
              name: dbUser.name || fbUser.displayName || '',
              email: dbUser.email || fbUser.email || '',
              role: userIsAdmin ? 'admin' : 'user',
            };
            setUser(appUser);
          } else {
            setUser(null);
            setIsAdmin(false);
          }
          setLoading(false);
        });
        
        return () => unsubscribeFirestore();
      } else {
        // No user is logged in
        setUser(null);
        setIdToken(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    // Clean up auth listener on component unmount
    return () => unsubscribeAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };
  
  const signup = async (email: string, pass: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const fbUser = userCredential.user;
    const newUser = {
      name,
      email: fbUser.email!,
      role: 'user', // Default role for new signups
    };
    await setDoc(doc(db, 'users', fbUser.uid), newUser);
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
