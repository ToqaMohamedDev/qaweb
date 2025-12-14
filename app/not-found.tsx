"use client";

import { motion } from "framer-motion";
import { Home, Search, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a] px-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        {/* 404 Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="flex items-center justify-center mb-8"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-xl" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
              <Search className="h-12 w-12 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-6xl font-extrabold text-gray-900 dark:text-gray-100 mb-4"
        >
          404
        </motion.h1>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4"
        >
          الصفحة غير موجودة
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-gray-600 dark:text-gray-400 mb-8"
        >
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/" aria-label="العودة للصفحة الرئيسية">
            <Button>
              <Home className="h-5 w-5 ml-2" aria-hidden="true" />
              العودة للرئيسية
            </Button>
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-3 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="العودة للصفحة السابقة"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            العودة للخلف
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
