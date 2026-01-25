// =============================================
// Home Page - الصفحة الرئيسية (Redesign 2025 - Clean & Professional)
// =============================================

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  AlertCircle,
  Sparkles,
  BookOpen,
  GraduationCap,
  Zap,
  Search,
  Trophy,
  Users,
  Clock,
  Star,
  ChevronLeft,
  Target,
  FileText,
  ArrowUpRight,
  Brain,
  Lightbulb,
  Award
} from "lucide-react";

// Layout Components
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StructuredData, homeStructuredData } from "@/components/StructuredData";

// Home Components
import {
  SubjectCard,
  SubjectCardSkeleton,
  HomeExamCard,
  HomeExamCardSkeleton,
  HowItWorksSection,
  TestimonialsSection,
  CTASection,
} from "@/components/home";

import { CountUp } from "@/components/ui/CountUp";

// Custom Hooks
import { useDashboard } from "@/hooks/useDashboard";

// =============================================
// Design Tokens (Consistent across page)
// =============================================
const SECTION_SPACING = "py-16 sm:py-20"; // Unified vertical spacing
const CONTAINER_CLASS = "container mx-auto px-4 sm:px-6 max-w-6xl";

// Animation variants - Subtle and professional
const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1
    }
  }
};

// =============================================
// Reusable Components
// =============================================

// Stats Bar Component - Compact horizontal stats
interface StatItemProps {
  icon: React.ElementType;
  value: number | string;
  label: string;
  suffix?: string;
  decimals?: number;
  isLarge?: boolean;
}

function StatItem({ icon: Icon, value, label, suffix = "", decimals = 0, isLarge = false }: StatItemProps) {
  let displayValue = value;
  let displaySuffix = suffix;
  let displayDecimals = decimals;

  if (typeof value === 'number' && value >= 1000 && !suffix) {
    displayValue = value / 1000;
    displaySuffix = "K+";
    displayDecimals = 1;
  }

  return (
    <div className={`flex items-center gap-3 ${isLarge ? 'p-4' : 'p-3'}`}>
      <div className="w-10 h-10 rounded-xl bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
      </div>
      <div className="min-w-0">
        <div className="text-xl font-bold text-gray-900 dark:text-white leading-none">
          {typeof displayValue === 'number' ? (
            <CountUp value={displayValue} suffix={displaySuffix} decimals={displayDecimals} duration={2} />
          ) : (
            <span>{displayValue}{displaySuffix}</span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// Section Header Component
interface SectionHeaderProps {
  icon: React.ElementType;
  badge?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  centered?: boolean;
}

function SectionHeader({ icon: Icon, badge, title, description, action, centered = false }: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`flex flex-col ${centered ? 'items-center text-center' : 'sm:flex-row sm:items-center sm:justify-between'} gap-4 mb-10`}
    >
      <div className={centered ? 'max-w-xl' : ''}>
        {badge && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 mb-3">
            <Icon className="w-3.5 h-3.5 text-primary-500" />
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-400">{badge}</span>
          </div>
        )}
        {!badge && (
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <Icon className="w-4.5 h-4.5 text-primary-500" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{title}</h2>
          </div>
        )}
        {badge && <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>}
        {description && <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base">{description}</p>}
      </div>
      {action}
    </motion.div>
  );
}

// =============================================
// Main Component
// =============================================

export default function Home() {
  const {
    subjects,
    exams,
    stageName,
    stageId,
    currentSemester,
    stats,
    isLoading,
    error
  } = useDashboard();

  const semesterLabel = currentSemester === 'first'
    ? 'الترم الأول'
    : currentSemester === 'second'
      ? 'الترم الثاني'
      : '';

  const subjectsCount = subjects?.length || 0;

  // Stats data - unified across Hero and CTA
  const statsData = [
    { icon: Users, value: stats.totalUsers, label: "طالب نشط" },
    { icon: BookOpen, value: stats.totalLessons, label: "درس متاح" },
    { icon: Trophy, value: stats.successRate, label: "نسبة النجاح", suffix: "%" },
    { icon: Star, value: stats.averageRating, label: "التقييم", decimals: 1 },
  ];

  return (
    <>
      <StructuredData data={homeStructuredData} />
      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f]" dir="rtl">
        <Navbar />

        <main className="relative">
          {/* ========== HERO SECTION - Compact & Clean ========== */}
          <section className="relative pt-8 pb-12 sm:pt-12 sm:pb-16 overflow-hidden">
            {/* Subtle Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary-50/50 via-transparent to-transparent dark:from-primary-950/20 dark:via-transparent" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />

            <div className={`relative ${CONTAINER_CLASS}`}>
              {/* Main Content */}
              <div className="max-w-3xl mx-auto text-center">
                {/* Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 mb-6"
                >
                  <Sparkles className="w-4 h-4 text-primary-500" />
                  <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">منصة التعلم الذكي #1</span>
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight"
                >
                  تعلّم بذكاء مع{" "}
                  <span className="text-primary-600 dark:text-primary-400">QAlaa</span>
                </motion.h1>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.15 }}
                  className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-6 max-w-xl mx-auto"
                >
                  منصة تعليمية تفاعلية تساعدك على التفوق في دراستك من خلال دروس مبسطة واختبارات ذكية
                </motion.p>

                {/* User Stage Badge */}
                {!isLoading && stageName && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm mb-8"
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary-500 flex items-center justify-center">
                      <GraduationCap className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">مرحلتك الدراسية</p>
                      <p className="font-bold text-sm text-gray-900 dark:text-white">{stageName}</p>
                    </div>
                    {semesterLabel && (
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">
                        {semesterLabel}
                      </span>
                    )}
                  </motion.div>
                )}

                {/* CTA Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                  className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10"
                >
                  <Link
                    href={subjects.length > 0 ? `/${subjects[0].slug}` : "/arabic"}
                    className="group w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/25 transition-all duration-200"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>ابدأ التعلم الآن</span>
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform rtl:rotate-180" />
                  </Link>
                  <Link
                    href="/game"
                    className="group w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-semibold hover:border-primary-300 dark:hover:border-primary-700 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all duration-200"
                  >
                    <Zap className="w-5 h-5 text-amber-500" />
                    <span>Quiz Battle</span>
                  </Link>
                </motion.div>

                {/* Stats Bar - Horizontal Compact */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden"
                >
                  <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-gray-100 dark:divide-white/10 rtl:divide-x-reverse">
                    {statsData.map((stat, i) => (
                      <StatItem key={i} {...stat} />
                    ))}
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* ========== ERROR STATE ========== */}
          {error && (
            <div className={CONTAINER_CLASS + " py-4"}>
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50"
              >
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="font-semibold text-red-700 dark:text-red-300">حدث خطأ</p>
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              </motion.div>
            </div>
          )}

          {/* ========== SUBJECTS SECTION ========== */}
          <section className={SECTION_SPACING}>
            <div className={CONTAINER_CLASS}>
              <SectionHeader
                icon={BookOpen}
                title="المواد الدراسية"
                description="اختر المادة التي تريد دراستها"
                action={
                  !isLoading && (
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                      <Target className="w-4 h-4 text-primary-500" />
                      <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                        {subjectsCount} {subjectsCount === 1 ? 'مادة' : 'مواد'} متاحة
                      </span>
                    </div>
                  )
                }
              />

              {/* Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <SubjectCardSkeleton />
                    </motion.div>
                  ))}
                </div>
              ) : subjects.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-5">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">لا توجد مواد متاحة</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md mb-5">
                    {stageName
                      ? `لم يتم إضافة دروس لـ "${stageName}" في الوقت الحالي. سيتم إضافة محتوى جديد قريباً!`
                      : 'لا توجد مواد متاحة لمرحلتك الدراسية حالياً'
                    }
                  </p>
                  <Link href="/settings" className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors">
                    <span>تغيير المرحلة</span>
                    <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                  </Link>
                </motion.div>
              ) : (
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={staggerContainer}
                >
                  {subjects.map((subject, index) => (
                    <SubjectCard
                      key={subject.id}
                      id={subject.id}
                      name={subject.name}
                      slug={subject.slug}
                      icon={subject.icon}
                      color={subject.color}
                      lessonsCount={subject.lessonsCount}
                      index={index}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </section>

          {/* ========== FEATURES SECTION ========== */}
          <section className={`${SECTION_SPACING} bg-gray-50/50 dark:bg-white/[0.02]`}>
            <div className={CONTAINER_CLASS}>
              <SectionHeader
                icon={Zap}
                badge="لماذا QAlaa؟"
                title="مميزات تجعل التعلم أسهل"
                description="نوفر لك أدوات وميزات متقدمة لتسهيل رحلتك التعليمية"
                centered
              />

              {/* Features Grid */}
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={staggerContainer}
              >
                {[
                  { icon: Brain, title: "تعلم ذكي", description: "نظام ذكي يتكيف مع مستواك" },
                  { icon: Clock, title: "دروس مختصرة", description: "محتوى مركز يوفر وقتك" },
                  { icon: Lightbulb, title: "شرح مبسط", description: "أسلوب سهل وواضح" },
                  { icon: Award, title: "اختبارات تفاعلية", description: "تقييم مستمر لمستواك" },
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    variants={fadeInUp}
                    className="group"
                  >
                    <div className="h-full p-6 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-lg hover:shadow-gray-100 dark:hover:shadow-none transition-all duration-200 text-center">
                      <div className="w-12 h-12 mx-auto rounded-xl bg-primary-500/10 dark:bg-primary-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-200">
                        <feature.icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">{feature.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* ========== EXAMS SECTION ========== */}
          {!isLoading && (
            <section className={SECTION_SPACING}>
              <div className={CONTAINER_CLASS}>
                <SectionHeader
                  icon={FileText}
                  title="الامتحانات المتاحة"
                  description="اختبر نفسك في امتحانات مصممة لمرحلتك الدراسية"
                  action={
                    <Link
                      href={stageId ? `/arabic?stage=${stageId}` : '/arabic'}
                      className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                    >
                      <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">عرض الكل</span>
                      <ArrowUpRight className="w-4 h-4 text-primary-500" />
                    </Link>
                  }
                />

                {/* Exams Grid */}
                {exams.length > 0 ? (
                  <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={staggerContainer}
                  >
                    {exams.slice(0, 8).map((exam, index) => (
                      <HomeExamCard
                        key={exam.id}
                        id={exam.id}
                        examTitle={exam.examTitle}
                        subjectName={exam.subjectName}
                        questionsCount={exam.questionsCount}
                        duration={exam.duration}
                        index={index}
                      />
                    ))}
                  </motion.div>
                ) : (
                  <div className="text-center py-12 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary-500/10 mb-4">
                      <FileText className="w-7 h-7 text-primary-500" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">لا توجد امتحانات متاحة حالياً</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {stageId ? `لم يتم إضافة امتحانات لـ ${stageName} بعد` : 'لم يتم إضافة امتحانات بعد'}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Loading state for exams */}
          {isLoading && (
            <section className={SECTION_SPACING}>
              <div className={CONTAINER_CLASS}>
                <div className="flex items-center gap-2 mb-10">
                  <div className="w-9 h-9 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  <div className="h-7 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <HomeExamCardSkeleton key={i} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ========== HOW IT WORKS ========== */}
          <HowItWorksSection />

          {/* ========== TESTIMONIALS ========== */}
          <TestimonialsSection />

          {/* ========== CTA ========== */}
          <CTASection />
        </main>

        <Footer />
      </div>
    </>
  );
}
