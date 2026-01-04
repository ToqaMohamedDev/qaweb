"use client";

// =============================================
// Teacher Analytics Component - رسوم بيانية للمدرس
// =============================================

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";

interface ExamPerformance {
    id: string;
    title: string;
    attempts: number;
    avgScore: number;
}

interface Props {
    examPerformance: ExamPerformance[];
    dailyAttempts?: { day: string; count: number }[];
}

export function TeacherAnalytics({ examPerformance, dailyAttempts = [] }: Props) {
    // حساب أعلى قيمة للمحاولات (للتناسب)
    const maxAttempts = Math.max(...examPerformance.map(e => e.attempts), 1);
    const maxDailyAttempts = Math.max(...dailyAttempts.map(d => d.count), 1);

    // ألوان حسب النسبة
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'bg-green-500';
        if (score >= 60) return 'bg-blue-500';
        if (score >= 40) return 'bg-amber-500';
        return 'bg-red-500';
    };

    const getScoreTextColor = (score: number) => {
        if (score >= 80) return 'text-green-600 dark:text-green-400';
        if (score >= 60) return 'text-blue-600 dark:text-blue-400';
        if (score >= 40) return 'text-amber-600 dark:text-amber-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getTrend = (score: number) => {
        if (score >= 70) return { icon: TrendingUp, color: 'text-green-500' };
        if (score >= 50) return { icon: Minus, color: 'text-gray-500' };
        return { icon: TrendingDown, color: 'text-red-500' };
    };

    if (examPerformance.length === 0) {
        return (
            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 border border-gray-200/60 dark:border-gray-800">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                        <BarChart3 className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white">تحليل الأداء</h3>
                </div>
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>لا توجد بيانات كافية للتحليل</p>
                    <p className="text-sm mt-1">ابدأ بنشر امتحانات ليحلها الطلاب</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* أداء الامتحانات */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 border border-gray-200/60 dark:border-gray-800"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                            <BarChart3 className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">أداء الامتحانات</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">مقارنة بين امتحاناتك</p>
                        </div>
                    </div>
                </div>

                {/* الرسم البياني العمودي */}
                <div className="space-y-4">
                    {examPerformance.slice(0, 6).map((exam, index) => (
                        <motion.div
                            key={exam.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="space-y-2"
                        >
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                                    {exam.title}
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-500 dark:text-gray-400 text-xs">
                                        {exam.attempts} محاولة
                                    </span>
                                    <span className={`font-bold ${getScoreTextColor(exam.avgScore)}`}>
                                        {exam.avgScore.toFixed(0)}%
                                    </span>
                                </div>
                            </div>

                            {/* شريط التقدم */}
                            <div className="relative h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                {/* شريط المحاولات (خلفي) */}
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(exam.attempts / maxAttempts) * 100}%` }}
                                    transition={{ duration: 0.8, delay: index * 0.1 }}
                                    className="absolute inset-y-0 right-0 bg-gray-200 dark:bg-gray-700 rounded-full"
                                />

                                {/* شريط النتيجة (أمامي) */}
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${exam.avgScore}%` }}
                                    transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                                    className={`absolute inset-y-0 right-0 ${getScoreColor(exam.avgScore)} rounded-full`}
                                    style={{ maxWidth: `${(exam.attempts / maxAttempts) * 100}%` }}
                                />

                                {/* أيقونة الاتجاه */}
                                <div className="absolute inset-y-0 left-2 flex items-center">
                                    {(() => {
                                        const trend = getTrend(exam.avgScore);
                                        const TrendIcon = trend.icon;
                                        return <TrendIcon className={`h-4 w-4 ${trend.color}`} />;
                                    })()}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* المفتاح */}
                <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-3 h-3 rounded bg-green-500" />
                        <span>ممتاز (+80%)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-3 h-3 rounded bg-blue-500" />
                        <span>جيد (60-80%)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-3 h-3 rounded bg-amber-500" />
                        <span>متوسط (40-60%)</span>
                    </div>
                </div>
            </motion.div>

            {/* النشاط اليومي */}
            {dailyAttempts.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 border border-gray-200/60 dark:border-gray-800"
                >
                    <h4 className="font-bold text-gray-900 dark:text-white mb-4">النشاط الأسبوعي</h4>

                    {/* رسم بياني شريطي أفقي */}
                    <div className="flex items-end justify-between gap-2 h-32">
                        {dailyAttempts.map((day, index) => (
                            <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${(day.count / maxDailyAttempts) * 100}%` }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="w-full bg-gradient-to-t from-primary-500 to-pink-500 rounded-t-lg min-h-[4px]"
                                    style={{ minHeight: day.count > 0 ? '16px' : '4px' }}
                                />
                                <span className="text-xs text-gray-500 dark:text-gray-400">{day.day}</span>
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{day.count}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* ملخص سريع */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-primary-500 to-pink-500 rounded-2xl p-6 text-white"
            >
                <h4 className="font-bold mb-4">📊 ملخص الأداء</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-3xl font-bold">{examPerformance.length}</p>
                        <p className="text-sm opacity-80">امتحان</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold">
                            {examPerformance.reduce((sum, e) => sum + e.attempts, 0)}
                        </p>
                        <p className="text-sm opacity-80">محاولة</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold">
                            {examPerformance.length > 0
                                ? (examPerformance.reduce((sum, e) => sum + e.avgScore, 0) / examPerformance.length).toFixed(0)
                                : 0}%
                        </p>
                        <p className="text-sm opacity-80">متوسط عام</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
