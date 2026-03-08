'use client';

import React, { useContext, useEffect, type ReactNode } from 'react';
import type { FirebaseApp } from 'firebase/app';
import type { Auth, User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// Create separate contexts for each Firebase service
const FirebaseAppContext = React.createContext<FirebaseApp | undefined>(undefined);
const AuthContext = React.createContext<Auth | undefined>(undefined);
const FirestoreContext = React.createContext<Firestore | undefined>(undefined);
const UserContext = React.createContext<User | null>(null);

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

export function FirebaseProvider({ children, firebaseApp, auth, firestore }: FirebaseProviderProps) {
  const [user, setUser] = React.useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, [auth]);

  return (
    <FirebaseAppContext.Provider value={firebaseApp}>
      <AuthContext.Provider value={auth}>
        <FirestoreContext.Provider value={firestore}>
          <UserContext.Provider value={user}>{children}</UserContext.Provider>
        </FirestoreContext.Provider>
      </AuthContext.Provider>
    </FirebaseAppContext.Provider>
  );
}

// Custom hooks to access Firebase services and user state
export const useFirebaseApp = () => useContext(FirebaseAppContext);
export const useAuth = () => useContext(AuthContext);
export const useFirestore = () => useContext(FirestoreContext);
export const useUser = () => useContext(UserContext);
