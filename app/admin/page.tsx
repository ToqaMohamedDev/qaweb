"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Shield, Settings, Users, FileText, ArrowRight, MessageSquare, Activity, Clock, BarChart3 } from "lucide-react";
import { collection, getDocs, query, orderBy, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { safeAsync } from "@/lib/errorHandler";

// Types
type QuestionType = "multipleChoice" | "trueFalse" | "essay";
type Language = "arabic" | "english";

interface QuestionData {
  lessonId: string;
  language: Language;
  type: QuestionType;
  question: string;
  createdAt: Timestamp;
  createdBy: string | undefined;
  options?: string[];
  correctAnswer?: number | boolean;
}

interface QuestionWithId extends QuestionData {
  id: string;
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionWithId[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [messagesCount, setMessagesCount] = useState(0);

  useEffect(() => {
    // انتظر حتى ينتهي تحميل المصادقة والصلاحيات
    if (authLoading || adminLoading) {
      return;
    }

    // إذا لم يكن المستخدم مسجل دخول، إعادة توجيه للصفحة الرئيسية
    if (!user) {
      router.push("/");
      return;
    }

    // إذا لم يكن المستخدم أدمن، إعادة توجيه للصفحة الرئيسية
    if (!isAdmin) {
      router.push("/");
      return;
    }
  }, [user, isAdmin, authLoading, adminLoading, router]);

  // جلب الأسئلة من Firestore
  useEffect(() => {
    const fetchQuestions = async () => {
      if (!isAdmin) return;

      // Use safeAsync for Firestore operation
      const { data, error } = await safeAsync(async () => {
        const questionsRef = collection(db, "questions");
        const q = query(questionsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        const questionsData: QuestionWithId[] = [];
        querySnapshot.forEach((doc) => {
          questionsData.push({
            id: doc.id,
            ...(doc.data() as QuestionData),
          });
        });
        return questionsData;
      }, []);

      if (error) {
        console.error("Error fetching questions:", error);
      } else if (data) {
        setQuestions(data);
      }
    };

    if (isAdmin && !authLoading && !adminLoading) {
      fetchQuestions();
    }
  }, [isAdmin, authLoading, adminLoading]);

  // جلب عدد المستخدمين والرسائل
  useEffect(() => {
    const fetchCounts = async () => {
      if (!isAdmin) return;

      // Use safeAsync for Firestore operations
      const { data: usersData, error: usersError } = await safeAsync(async () => {
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        return usersSnapshot.size;
      }, 0);

      if (usersError) {
        console.error("Error fetching users count:", usersError);
      } else {
        setUsersCount(usersData || 0);
      }

      const { data: messagesData, error: messagesError } = await safeAsync(async () => {
        const messagesRef = collection(db, "contactMessages");
        const messagesSnapshot = await getDocs(messagesRef);
        return messagesSnapshot.size;
      }, 0);

      if (messagesError) {
        console.error("Error fetching messages count:", messagesError);
      } else {
        setMessagesCount(messagesData || 0);
      }
    };

    if (isAdmin && !authLoading && !adminLoading) {
      fetchCounts();
    }
  }, [isAdmin, authLoading, adminLoading]);

  // عرض شاشة التحميل أثناء التحقق من الصلاحيات
  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#121218] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // إذا لم يكن المستخدم أدمن، لا تعرض الصفحة (سيتم إعادة التوجيه)
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#121218]" dir="rtl">
      <Navbar />

      <main className="container mx-auto px-4 py-6 sm:py-8 lg:py-10 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 sm:space-y-8"
        >
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden bg-white dark:bg-[#1c1c24] rounded-2xl sm:rounded-3xl border border-primary-200/60 dark:border-primary-900/30 p-6 sm:p-8 lg:p-10 shadow-sm"
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgb(139, 92, 246) 1px, transparent 0)`,
                backgroundSize: '40px 40px'
              }}></div>
            </div>

            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex items-center gap-4 sm:gap-5">
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 border border-primary-200 dark:border-primary-800/50 shadow-sm"
                  >
                    <Shield className="h-7 w-7 sm:h-8 sm:w-8 text-primary-600 dark:text-primary-400" />
                  </motion.div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      لوحة التحكم
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                      إدارة النظام والتحكم في المحتوى
                    </p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50">
                    <Activity className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    <span className="text-sm font-medium text-primary-700 dark:text-primary-300">نشط</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]">
                    <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Dashboard Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {/* Questions Card */}
            <Link href="/admin/questions">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, type: "spring", stiffness: 100 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="group relative bg-white dark:bg-[#1c1c24] rounded-xl sm:rounded-2xl border border-primary-200/60 dark:border-primary-900/30 p-5 sm:p-6 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-800/50 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-all duration-300 cursor-pointer h-full overflow-hidden"
              >
                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-primary-500/0 group-hover:from-primary-500/5 group-hover:to-primary-500/10 transition-all duration-300"></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5 sm:mb-6">
                    <motion.div
                      whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                      className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 border border-primary-200 dark:border-primary-800/50 shadow-sm"
                    >
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 dark:text-primary-400" />
                    </motion.div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
                      <span className="text-xs font-medium text-primary-600 dark:text-primary-400 hidden sm:inline">نشط</span>
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    الأسئلة
                  </h3>
                  <div className="flex items-baseline gap-2 mb-3 sm:mb-4">
                    <motion.p
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="text-3xl sm:text-4xl font-bold text-primary-600 dark:text-primary-400"
                    >
                      {questions.length}
                    </motion.p>
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">سؤال</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-5 leading-relaxed">
                    إدارة وتنظيم الأسئلة
                  </p>
                  <div className="flex items-center text-primary-600 dark:text-primary-400 text-xs sm:text-sm font-medium group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                    <span>عرض التفاصيل</span>
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            </Link>

            {/* Users Card */}
            <Link href="/admin/users">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 100 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="group relative bg-white dark:bg-[#1c1c24] rounded-xl sm:rounded-2xl border border-primary-200/60 dark:border-primary-900/30 p-5 sm:p-6 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-800/50 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-all duration-300 cursor-pointer h-full overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-primary-500/0 group-hover:from-primary-500/5 group-hover:to-primary-500/10 transition-all duration-300"></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5 sm:mb-6">
                    <motion.div
                      whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                      className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 border border-primary-200 dark:border-primary-800/50 shadow-sm"
                    >
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 dark:text-primary-400" />
                    </motion.div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
                      <span className="text-xs font-medium text-primary-600 dark:text-primary-400 hidden sm:inline">نشط</span>
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    المستخدمين
                  </h3>
                  <div className="flex items-baseline gap-2 mb-3 sm:mb-4">
                    <motion.p
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                      className="text-3xl sm:text-4xl font-bold text-primary-600 dark:text-primary-400"
                    >
                      {usersCount}
                    </motion.p>
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">مستخدم</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-5 leading-relaxed">
                    إدارة المستخدمين والصلاحيات
                  </p>
                  <div className="flex items-center text-primary-600 dark:text-primary-400 text-xs sm:text-sm font-medium group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                    <span>عرض التفاصيل</span>
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            </Link>

            {/* Settings Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="group relative bg-white dark:bg-[#1c1c24] rounded-xl sm:rounded-2xl border border-gray-200/60 dark:border-[#2e2e3a] p-5 sm:p-6 hover:shadow-xl hover:border-gray-300 dark:hover:border-[#3a3a4a] transition-all duration-300 cursor-pointer h-full overflow-hidden opacity-60"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5 sm:mb-6">
                  <div className="p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]">
                    <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-500 hidden sm:inline">قريباً</span>
                  </div>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  الإعدادات
                </h3>
                <div className="flex items-baseline gap-2 mb-3 sm:mb-4">
                  <p className="text-3xl sm:text-4xl font-bold text-gray-400 dark:text-gray-600">
                    -
                  </p>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">إعداد</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 leading-relaxed">
                  إعدادات النظام والتكوين
                </p>
              </div>
            </motion.div>

            {/* Statistics Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="group relative bg-white dark:bg-[#1c1c24] rounded-xl sm:rounded-2xl border border-gray-200/60 dark:border-[#2e2e3a] p-5 sm:p-6 hover:shadow-xl hover:border-gray-300 dark:hover:border-[#3a3a4a] transition-all duration-300 cursor-pointer h-full overflow-hidden opacity-60"
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5 sm:mb-6">
                  <div className="p-3 sm:p-4 rounded-xl bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]">
                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400 dark:text-gray-500" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-500 hidden sm:inline">قريباً</span>
                  </div>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  الإحصائيات
                </h3>
                <div className="flex items-baseline gap-2 mb-3 sm:mb-4">
                  <p className="text-3xl sm:text-4xl font-bold text-gray-400 dark:text-gray-600">
                    -
                  </p>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">إحصائية</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 leading-relaxed">
                  تحليل البيانات والإحصائيات
                </p>
              </div>
            </motion.div>

            {/* Messages Card */}
            <Link href="/admin/messages">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="group relative bg-white dark:bg-[#1c1c24] rounded-xl sm:rounded-2xl border border-primary-200/60 dark:border-primary-900/30 p-5 sm:p-6 hover:shadow-xl hover:border-primary-300 dark:hover:border-primary-800/50 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-all duration-300 cursor-pointer h-full overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-primary-500/0 group-hover:from-primary-500/5 group-hover:to-primary-500/10 transition-all duration-300"></div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5 sm:mb-6">
                    <motion.div
                      whileHover={{ rotate: [0, -5, 5, -5, 0] }}
                      className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 border border-primary-200 dark:border-primary-800/50 shadow-sm"
                    >
                      <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600 dark:text-primary-400" />
                    </motion.div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
                      <span className="text-xs font-medium text-primary-600 dark:text-primary-400 hidden sm:inline">نشط</span>
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    الرسائل
                  </h3>
                  <div className="flex items-baseline gap-2 mb-3 sm:mb-4">
                    <motion.p
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6, type: "spring" }}
                      className="text-3xl sm:text-4xl font-bold text-primary-600 dark:text-primary-400"
                    >
                      {messagesCount}
                    </motion.p>
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">رسالة</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-5 leading-relaxed">
                    إدارة الرسائل والتواصل
                  </p>
                  <div className="flex items-center text-primary-600 dark:text-primary-400 text-xs sm:text-sm font-medium group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                    <span>عرض التفاصيل</span>
                    <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 mr-2 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            </Link>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

