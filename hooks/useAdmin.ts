"use client";

import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";

export function useAdmin() {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      // انتظر حتى ينتهي تحميل المصادقة
      if (authLoading) {
        return;
      }

      // إذا لم يكن هناك مستخدم، ليس admin
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // ابدأ التحقق من الصلاحيات
      setLoading(true);
      
      try {
        const roleRef = doc(db, "roles", user.uid);
        const roleSnap = await getDoc(roleRef);
        
        if (roleSnap.exists()) {
          const roleData = roleSnap.data();
          setIsAdmin(roleData.role === "admin");
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Error checking admin role:", error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [user, authLoading]);

  return { isAdmin, loading };
}

