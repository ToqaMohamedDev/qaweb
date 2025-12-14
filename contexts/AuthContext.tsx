"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { handleError } from "@/lib/errorHandler";

const googleProvider = new GoogleAuthProvider();

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// دالة لحفظ/تحديث بيانات المستخدم في Firestore
const saveUserToFirestore = async (user: User, isNewUser: boolean = false) => {
  if (!user || !db) return;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  const userData = {
    email: user.email,
    displayName: user.displayName || "",
    photoURL: user.photoURL || "",
    emailVerified: user.emailVerified,
    provider: user.providerData[0]?.providerId || "password",
    lastLoginAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (isNewUser || !userSnap.exists()) {
    // إنشاء مستخدم جديد
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      uid: user.uid,
    });
  } else {
    // تحديث بيانات المستخدم الموجود
    await setDoc(userRef, userData, { merge: true });
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if auth is available before using it
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      setLoading(false);

      // حفظ بيانات المستخدم عند تسجيل الدخول
      if (user && db) {
        try {
          await saveUserToFirestore(user, false);
        } catch (error) {
          // Use centralized error handler for logging
          const { message } = handleError(error, "AuthContext.onAuthStateChanged");
          console.error("Error saving user to Firestore:", message);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    if (!auth) {
      throw new Error("Firebase Auth is not initialized. Please check your environment variables.");
    }
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      // Use centralized error handler for consistent error messages
      const { message } = handleError(error, "AuthContext.signIn");
      throw new Error(message);
    }
  };

  const signUp = async (email: string, password: string, displayName: string): Promise<void> => {
    if (!auth) {
      throw new Error("Firebase Auth is not initialized. Please check your environment variables.");
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName });

      if (db) {
        await saveUserToFirestore(userCredential.user, true);
      }
    } catch (error) {
      // Use centralized error handler for consistent error messages
      const { message } = handleError(error, "AuthContext.signUp");
      throw new Error(message);
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    if (!auth) {
      throw new Error("Firebase Auth is not initialized. Please check your environment variables.");
    }
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);

      if (db) {
        const userRef = doc(db, "users", userCredential.user.uid);
        const userSnap = await getDoc(userRef);
        const isNewUser = !userSnap.exists();

        await saveUserToFirestore(userCredential.user, isNewUser);
      }
    } catch (error) {
      // Use centralized error handler for consistent error messages
      const { message } = handleError(error, "AuthContext.signInWithGoogle");
      throw new Error(message);
    }
  };

  const logout = async () => {
    if (!auth) {
      throw new Error("Firebase Auth is not initialized. Please check your environment variables.");
    }
    try {
      await signOut(auth);
    } catch (error) {
      // Use centralized error handler for consistent error messages
      const { message } = handleError(error, "AuthContext.logout");
      throw new Error(message);
    }
  };

  const resetPassword = async (email: string) => {
    if (!auth) {
      throw new Error("Firebase Auth is not initialized. Please check your environment variables.");
    }
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      // Use centralized error handler for consistent error messages
      const { message } = handleError(error, "AuthContext.resetPassword");
      throw new Error(message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signInWithGoogle, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
