"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  FileText,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Users,
  Award,
  Zap,
  Star,
  TrendingUp,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

// Optimized variants for mobile - using transform instead of y
const itemVariantsOptimized = {
  hidden: {
    opacity: 0,
    transform: "translate3d(0, 20px, 0)" // Hardware accelerated
  },
  visible: {
    opacity: 1,
    transform: "translate3d(0, 0, 0)", // Hardware accelerated
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

const floatingAnimation = {
  transform: ["translate3d(0, 0, 0)", "translate3d(0, -20px, 0)", "translate3d(0, 0, 0)"],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

const pulseAnimation = {
  transform: [
    "translate3d(0, 0, 0) scale(1)",
    "translate3d(0, 0, 0) scale(1.1)",
    "translate3d(0, 0, 0) scale(1)"
  ],
  opacity: [0.5, 0.8, 0.5],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Only initialize scroll animations after mount
  const { scrollYProgress } = useScroll({
    target: isMounted ? containerRef : undefined,
    offset: ["start start", "end start"],
    layoutEffect: false,
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Add structured data for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "name": "QAlaa",
      "description": "منصة تعليمية حديثة للأسئلة والأجوبة",
      "url": window.location.origin,
      "logo": `${window.location.origin}/logo.png`,
      "sameAs": [],
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EGP",
      },
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      try {
        if (script.parentNode) {
          document.head.removeChild(script);
        }
      } catch (error) {
        // Ignore errors during cleanup
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-[#121218] dark:via-[#0d0d12] dark:to-[#121218] relative overflow-hidden"
      style={{
        minHeight: "100dvh", // Dynamic viewport height for mobile
        willChange: "scroll-position",
      }}
      dir="rtl"
    >
      {/* Animated Background Elements with Framer Motion */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-20 right-20 w-72 h-72 bg-primary-200/20 dark:bg-primary-900/20 rounded-full blur-3xl"
          animate={pulseAnimation}
          style={isMounted ? {
            y: backgroundY,
            willChange: "transform",
            transform: "translate3d(0, 0, 0)"
          } : undefined}
        />
        <motion.div
          className="absolute bottom-20 left-20 w-96 h-96 bg-primary-300/15 dark:bg-primary-800/15 rounded-full blur-3xl"
          animate={{
            ...pulseAnimation,
            transition: { ...pulseAnimation.transition, delay: 1 },
          }}
          style={isMounted ? {
            y: backgroundY,
            willChange: "transform",
            transform: "translate3d(0, 0, 0)"
          } : undefined}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-[500px] h-[500px] bg-primary-200/10 dark:bg-primary-900/10 rounded-full blur-3xl"
          animate={{
            ...pulseAnimation,
            transition: { ...pulseAnimation.transition, delay: 2 },
          }}
          style={isMounted ? {
            x: "-50%",
            y: backgroundY,
            willChange: "transform",
            transform: "translate3d(-50%, 0, 0)"
          } : undefined}
        />
      </div>

      <Navbar />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 max-w-6xl relative z-10">
        {/* Enhanced Hero Section */}
        <motion.div
          initial={{ opacity: 0, transform: "translate3d(0, 30px, 0)" }}
          animate={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ willChange: "transform, opacity" }}
          className="text-center mb-16 sm:mb-20 lg:mb-24"
        >
          {/* Badge with enhanced animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, transform: "translate3d(0, -20px, 0)" }}
            animate={{ opacity: 1, scale: 1, transform: "translate3d(0, 0, 0)" }}
            transition={{
              delay: 0.2,
              duration: 0.6,
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
            whileHover={{ scale: 1.05, transform: "translate3d(0, -2px, 0)" }}
            style={{ willChange: "transform, opacity, scale" }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-gradient-to-r from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-800/20 border border-primary-200/50 dark:border-primary-700/30 shadow-sm"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.2, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            </motion.div>
            <motion.span
              className="text-sm font-semibold text-primary-700 dark:text-primary-300"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              منصة تعليمية متطورة
            </motion.span>
          </motion.div>


        </motion.div>

        {/* Enhanced Language Cards with stagger animation */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto mb-20 sm:mb-24"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Arabic Language Card */}
          <Link
            href="/arabic"
            scroll={false}
            className="h-full group"
            aria-label="الانتقال إلى صفحة اللغة العربية"
          >
            <motion.div
              variants={itemVariantsOptimized}
              whileHover={{
                transform: "translate3d(0, -8px, 0) scale(1.01)",
                transition: { type: "spring", stiffness: 400, damping: 17 }
              }}
              whileTap={{ transform: "translate3d(0, 0, 0) scale(0.98)" }}
              style={{ willChange: "transform" }}
              className="relative h-full bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl rounded-3xl p-6 sm:p-7 lg:p-8 border-2 border-primary-200/50 dark:border-primary-800/30 shadow-xl hover:shadow-2xl hover:shadow-primary-500/20 dark:hover:shadow-primary-500/10 hover:border-primary-400/70 dark:hover:border-primary-600/50 transition-all duration-300 cursor-pointer overflow-hidden"
            >
              {/* Animated Gradient Background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-primary-100/30 dark:from-primary-950/40 dark:via-transparent dark:to-primary-900/20"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />

              {/* Glowing Orbs */}
              <motion.div
                className="absolute -top-20 -right-20 w-64 h-64 bg-primary-400/30 dark:bg-primary-700/20 rounded-full blur-3xl"
                initial={{ transform: "translate3d(0, 0, 0) scale(1)" }}
                whileHover={{ transform: "translate3d(0, 0, 0) scale(1.2)" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{ willChange: "transform", filter: "blur(48px)" }}
              />
              <motion.div
                className="absolute -bottom-16 -left-16 w-48 h-48 bg-primary-300/25 dark:bg-primary-800/15 rounded-full blur-2xl"
                initial={{ transform: "translate3d(0, 0, 0) scale(1)" }}
                whileHover={{ transform: "translate3d(0, 0, 0) scale(1.15)" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{ willChange: "transform", filter: "blur(32px)" }}
              />

              {/* Shine Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                initial={{ transform: "translate3d(-100%, 0, 0)" }}
                whileHover={{ transform: "translate3d(100%, 0, 0)" }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                style={{ willChange: "transform" }}
              />

              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-5">
                  {/* Enhanced Icon */}
                  <motion.div
                    whileHover={{ scale: 1.05, rotate: -5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    className="relative mb-5"
                  >
                    <motion.div
                      className="absolute inset-0 bg-primary-500/20 dark:bg-primary-600/20 rounded-2xl blur-xl"
                      whileHover={{ filter: "blur(24px)", scale: 1.1 }}
                      transition={{ duration: 0.3 }}
                    />
                    <motion.div
                      className="relative p-4 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 shadow-2xl shadow-primary-500/50 w-fit"
                      whileHover={{
                        boxShadow: "0 25px 50px -12px rgba(124, 58, 237, 0.5)",
                        scale: 1.05
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <FileText className="h-10 w-10 text-white" />
                    </motion.div>
                  </motion.div>

                  {/* Content */}
                  <motion.div
                    className="text-right space-y-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    <motion.h2
                      className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight"
                      whileHover={{ color: "rgb(124, 58, 237)" }}
                      transition={{ duration: 0.2 }}
                    >
                      اللغة العربية
                    </motion.h2>
                    <p className="text-lg sm:text-xl text-gray-800 dark:text-gray-200 font-bold">
                      مواد اللغة العربية
                    </p>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                      تحليل النصوص والإعراب والكتابة الإبداعية
                    </p>
                  </motion.div>
                </div>

                {/* Enhanced CTA */}
                <motion.div
                  className="mt-auto flex items-center justify-end gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-primary-100/70 to-primary-50/70 dark:from-primary-900/40 dark:to-primary-800/30 border border-primary-200/50 dark:border-primary-700/30"
                  whileHover={{
                    background: "linear-gradient(to right, rgba(196, 181, 253, 0.9), rgba(237, 233, 254, 0.9))",
                    borderColor: "rgba(124, 58, 237, 0.7)",
                    transform: "translate3d(0, 0, 0) scale(1.02)"
                  }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  style={{ willChange: "transform" }}
                >
                  <span className="text-base font-bold text-primary-700 dark:text-primary-300">ابدأ التعلم</span>
                  <motion.div
                    whileHover={{ transform: "translate3d(-6px, 0, 0)" }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    style={{ willChange: "transform" }}
                  >
                    <ArrowLeft className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </Link>

          {/* English Language Card */}
          <Link
            href="/english"
            scroll={false}
            className="h-full group"
            aria-label="Go to English Language page"
          >
            <motion.div
              variants={itemVariantsOptimized}
              whileHover={{
                transform: "translate3d(0, -8px, 0) scale(1.01)",
                transition: { type: "spring", stiffness: 400, damping: 17 }
              }}
              whileTap={{ transform: "translate3d(0, 0, 0) scale(0.98)" }}
              style={{ willChange: "transform" }}
              className="relative h-full bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl rounded-3xl p-6 sm:p-7 lg:p-8 border-2 border-primary-200/50 dark:border-primary-800/30 shadow-xl hover:shadow-2xl hover:shadow-primary-500/20 dark:hover:shadow-primary-500/10 hover:border-primary-400/70 dark:hover:border-primary-600/50 transition-all duration-300 cursor-pointer overflow-hidden"
              dir="ltr"
            >
              {/* Animated Gradient Background */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-transparent to-primary-100/30 dark:from-primary-950/40 dark:via-transparent dark:to-primary-900/20"
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />

              {/* Glowing Orbs */}
              <motion.div
                className="absolute -top-20 -left-20 w-64 h-64 bg-primary-400/30 dark:bg-primary-700/20 rounded-full blur-3xl"
                initial={{ transform: "translate3d(0, 0, 0) scale(1)" }}
                whileHover={{ transform: "translate3d(0, 0, 0) scale(1.2)" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{ willChange: "transform", filter: "blur(48px)" }}
              />
              <motion.div
                className="absolute -bottom-16 -right-16 w-48 h-48 bg-primary-300/25 dark:bg-primary-800/15 rounded-full blur-2xl"
                initial={{ transform: "translate3d(0, 0, 0) scale(1)" }}
                whileHover={{ transform: "translate3d(0, 0, 0) scale(1.15)" }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                style={{ willChange: "transform", filter: "blur(32px)" }}
              />

              {/* Shine Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-l from-transparent via-white/10 to-transparent"
                initial={{ transform: "translate3d(100%, 0, 0)" }}
                whileHover={{ transform: "translate3d(-100%, 0, 0)" }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                style={{ willChange: "transform" }}
              />

              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-5">
                  {/* Enhanced Icon */}
                  <motion.div
                    whileHover={{ transform: "translate3d(0, 0, 0) scale(1.05) rotate(5deg)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    style={{ willChange: "transform" }}
                    className="relative mb-5"
                  >
                    <motion.div
                      className="absolute inset-0 bg-primary-500/20 dark:bg-primary-600/20 rounded-2xl blur-xl"
                      whileHover={{ transform: "translate3d(0, 0, 0) scale(1.1)" }}
                      transition={{ duration: 0.3 }}
                      style={{ willChange: "transform", filter: "blur(24px)" }}
                    />
                    <motion.div
                      className="relative p-4 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 shadow-2xl shadow-primary-500/50 w-fit"
                      whileHover={{
                        boxShadow: "0 25px 50px -12px rgba(124, 58, 237, 0.5)",
                        transform: "translate3d(0, 0, 0) scale(1.05)"
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      style={{ willChange: "transform" }}
                    >
                      <BookOpen className="h-10 w-10 text-white" />
                    </motion.div>
                  </motion.div>

                  {/* Content */}
                  <motion.div
                    className="text-left space-y-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    <motion.h2
                      className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight"
                      dir="ltr"
                      whileHover={{ color: "rgb(124, 58, 237)" }}
                      transition={{ duration: 0.2 }}
                    >
                      English Language
                    </motion.h2>
                    <p className="text-lg sm:text-xl text-gray-800 dark:text-gray-200 font-bold" dir="ltr">
                      English lessons and exercises
                    </p>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed font-medium" dir="ltr">
                      Vocabulary, Grammar, Reading & Writing
                    </p>
                  </motion.div>
                </div>

                {/* Enhanced CTA */}
                <motion.div
                  className="mt-auto flex items-center justify-start gap-3 px-5 py-3 rounded-2xl bg-gradient-to-l from-primary-100/70 to-primary-50/70 dark:from-primary-900/40 dark:to-primary-800/30 border border-primary-200/50 dark:border-primary-700/30"
                  whileHover={{
                    background: "linear-gradient(to left, rgba(196, 181, 253, 0.9), rgba(237, 233, 254, 0.9))",
                    borderColor: "rgba(124, 58, 237, 0.7)",
                    transform: "translate3d(0, 0, 0) scale(1.02)"
                  }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  style={{ willChange: "transform" }}
                >
                  <span className="text-base font-bold text-primary-700 dark:text-primary-300" dir="ltr">Start Learning</span>
                  <motion.div
                    whileHover={{ transform: "translate3d(6px, 0, 0)" }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    style={{ willChange: "transform" }}
                  >
                    <ArrowRight className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {/* Enhanced Features Section */}
        <motion.div
          initial={{ opacity: 0, transform: "translate3d(0, 30px, 0)" }}
          animate={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
          transition={{ delay: 0.6, duration: 0.8 }}
          style={{ willChange: "transform, opacity" }}
          className="max-w-6xl mx-auto"
        >
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-primary-100/50 dark:bg-primary-900/20 border border-primary-200/50 dark:border-primary-700/30"
            >
              <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">المميزات</span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, transform: "translate3d(0, 20px, 0)" }}
              animate={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
              transition={{ delay: 0.8, duration: 0.6 }}
              style={{ willChange: "transform, opacity" }}
              className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-gray-100 mb-4"
            >
              لماذا تختار <span className="bg-gradient-to-r from-primary-600 to-pink-600 dark:from-primary-400 dark:to-pink-400 bg-clip-text text-transparent">QAlaa</span>؟
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, transform: "translate3d(0, 20px, 0)" }}
              animate={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
              transition={{ delay: 0.9, duration: 0.6 }}
              style={{ willChange: "transform, opacity" }}
              className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
            >
              منصة تعليمية شاملة تجمع بين الجودة والسهولة
            </motion.p>
          </div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {/* Feature 1 - Fast Learning */}
            <motion.div
              variants={itemVariantsOptimized}
              whileHover={{
                transform: "translate3d(0, -8px, 0) scale(1.02)",
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              style={{ willChange: "transform" }}
              className="group relative bg-white/70 dark:bg-[#1c1c24]/70 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border-2 border-gray-200/50 dark:border-[#2e2e3a]/50 hover:border-primary-400/70 dark:hover:border-primary-600/50 transition-all duration-500 hover:shadow-xl hover:shadow-primary-500/10 dark:hover:shadow-primary-500/5 overflow-hidden"
            >
              {/* Background Gradient on Hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-950/30 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Decorative Circle */}
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary-200/30 dark:bg-primary-800/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500" />

              <div className="relative z-10">
                <motion.div
                  whileHover={{
                    transform: "translate3d(0, 0, 0) scale(1.1) rotate(-5deg)",
                    transition: { duration: 0.5 }
                  }}
                  animate={floatingAnimation}
                  style={{ willChange: "transform" }}
                  className="p-4 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30 w-fit mb-5 group-hover:shadow-xl group-hover:shadow-primary-500/40 transition-all duration-500"
                >
                  <Zap className="h-7 w-7 text-white" />
                </motion.div>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors duration-300">
                  تعلم سريع
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  أسئلة وأجوبة تفاعلية تساعدك على الفهم بسرعة
                </p>
              </div>
            </motion.div>

            {/* Feature 2 - Multiple Types */}
            <motion.div
              variants={itemVariantsOptimized}
              whileHover={{
                transform: "translate3d(0, -8px, 0) scale(1.02)",
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              style={{ willChange: "transform" }}
              className="group relative bg-white/70 dark:bg-[#1c1c24]/70 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border-2 border-gray-200/50 dark:border-[#2e2e3a]/50 hover:border-primary-400/70 dark:hover:border-primary-600/50 transition-all duration-500 hover:shadow-xl hover:shadow-primary-500/10 dark:hover:shadow-primary-500/5 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-950/30 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary-200/30 dark:bg-primary-800/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500" />

              <div className="relative z-10">
                <motion.div
                  whileHover={{
                    transform: "translate3d(0, 0, 0) scale(1.1) rotate(-5deg)",
                    transition: { duration: 0.5 }
                  }}
                  animate={{
                    ...floatingAnimation,
                    transition: { ...floatingAnimation.transition, delay: 0.5 }
                  }}
                  style={{ willChange: "transform" }}
                  className="p-4 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30 w-fit mb-5 group-hover:shadow-xl group-hover:shadow-primary-500/40 transition-all duration-500"
                >
                  <CheckCircle2 className="h-7 w-7 text-white" />
                </motion.div>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors duration-300">
                  أنواع متعددة
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  اختيار من متعدد، ترجمة، مقالات، وفهم المقروء
                </p>
              </div>
            </motion.div>

            {/* Feature 3 - Comprehensive Exams */}
            <motion.div
              variants={itemVariantsOptimized}
              whileHover={{
                transform: "translate3d(0, -8px, 0) scale(1.02)",
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              style={{ willChange: "transform" }}
              className="group relative bg-white/70 dark:bg-[#1c1c24]/70 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border-2 border-gray-200/50 dark:border-[#2e2e3a]/50 hover:border-primary-400/70 dark:hover:border-primary-600/50 transition-all duration-500 hover:shadow-xl hover:shadow-primary-500/10 dark:hover:shadow-primary-500/5 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-950/30 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary-200/30 dark:bg-primary-800/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500" />

              <div className="relative z-10">
                <motion.div
                  whileHover={{
                    transform: "translate3d(0, 0, 0) scale(1.1) rotate(-5deg)",
                    transition: { duration: 0.5 }
                  }}
                  animate={{
                    ...floatingAnimation,
                    transition: { ...floatingAnimation.transition, delay: 1 }
                  }}
                  style={{ willChange: "transform" }}
                  className="p-4 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30 w-fit mb-5 group-hover:shadow-xl group-hover:shadow-primary-500/40 transition-all duration-500"
                >
                  <Award className="h-7 w-7 text-white" />
                </motion.div>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors duration-300">
                  امتحانات شاملة
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  اختبر معلوماتك من خلال امتحانات متنوعة
                </p>
              </div>
            </motion.div>

            {/* Feature 4 - Completely Free */}
            <motion.div
              variants={itemVariantsOptimized}
              whileHover={{
                transform: "translate3d(0, -8px, 0) scale(1.02)",
                transition: { type: "spring", stiffness: 300, damping: 20 }
              }}
              style={{ willChange: "transform" }}
              className="group relative bg-white/70 dark:bg-[#1c1c24]/70 backdrop-blur-xl rounded-2xl p-6 sm:p-8 border-2 border-gray-200/50 dark:border-[#2e2e3a]/50 hover:border-primary-400/70 dark:hover:border-primary-600/50 transition-all duration-500 hover:shadow-xl hover:shadow-primary-500/10 dark:hover:shadow-primary-500/5 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent dark:from-primary-950/30 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary-200/30 dark:bg-primary-800/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500" />

              <div className="relative z-10">
                <motion.div
                  whileHover={{
                    transform: "translate3d(0, 0, 0) scale(1.1) rotate(-5deg)",
                    transition: { duration: 0.5 }
                  }}
                  animate={{
                    ...floatingAnimation,
                    transition: { ...floatingAnimation.transition, delay: 1.5 }
                  }}
                  style={{ willChange: "transform" }}
                  className="p-4 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30 w-fit mb-5 group-hover:shadow-xl group-hover:shadow-primary-500/40 transition-all duration-500"
                >
                  <Users className="h-7 w-7 text-white" />
                </motion.div>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 mb-3 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors duration-300">
                  مجاني تماماً
                </h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                  جميع المحتويات متاحة للجميع بدون أي رسوم
                </p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
