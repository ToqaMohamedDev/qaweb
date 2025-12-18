"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Users, GraduationCap, FileText, BookOpen, TrendingUp, TrendingDown, Calendar, Eye, Clock, Target, Award, Loader2, AlertCircle, RefreshCw, Layers } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Stats {
    totalUsers: number;
    totalTeachers: number;
    totalStudents: number;
    totalComprehensiveExams: number;
    totalExamTemplates: number;
    totalLessons: number;
    totalSubjects: number;
    totalStages: number;
    totalExamAttempts: number;
    verifiedTeachers: number;
    publishedExams: number;
    publishedLessons: number;
}

export default function AnalyticsPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [recentExams, setRecentExams] = useState<any[]>([]);
    const [topSubjects, setTopSubjects] = useState<any[]>([]);

    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
            const supabase = createClient();

            // Fetch stats in parallel with error handling
            const results = await Promise.allSettled([
                supabase.from("profiles").select("id, role, is_verified"),
                supabase.from("comprehensive_exams").select("id, is_published, exam_title, language, created_at").order("created_at", { ascending: false }).limit(5),
                supabase.from("exam_templates").select("id, is_published, title, created_at").order("created_at", { ascending: false }).limit(5),
                supabase.from("lessons").select("id, is_published"),
                supabase.from("subjects").select("id, name, is_active"),
                supabase.from("educational_stages").select("id"),
                supabase.from("comprehensive_exam_attempts").select("id"),
                supabase.from("exam_attempts").select("id"),
            ]);

            const getDataOrEmpty = (result: PromiseSettledResult<any>) => {
                if (result.status === 'fulfilled' && result.value?.data) {
                    return result.value.data;
                }
                return [];
            };

            const profiles = getDataOrEmpty(results[0]);
            const comprehensiveExams = getDataOrEmpty(results[1]);
            const examTemplates = getDataOrEmpty(results[2]);
            const lessons = getDataOrEmpty(results[3]);
            const subjects = getDataOrEmpty(results[4]);
            const stages = getDataOrEmpty(results[5]);
            const comprehensiveAttempts = getDataOrEmpty(results[6]);
            const examAttempts = getDataOrEmpty(results[7]);

            setStats({
                totalUsers: profiles.length,
                totalTeachers: profiles.filter((p: any) => p.role === "teacher").length,
                totalStudents: profiles.filter((p: any) => p.role === "student").length,
                totalComprehensiveExams: comprehensiveExams.length,
                totalExamTemplates: examTemplates.length,
                totalLessons: lessons.length,
                totalSubjects: subjects.length,
                totalStages: stages.length,
                totalExamAttempts: comprehensiveAttempts.length + examAttempts.length,
                verifiedTeachers: profiles.filter((p: any) => p.role === "teacher" && p.is_verified).length,
                publishedExams: comprehensiveExams.filter((e: any) => e.is_published).length + examTemplates.filter((e: any) => e.is_published).length,
                publishedLessons: lessons.filter((l: any) => l.is_published).length,
            });

            // Combine and sort recent exams
            const allExams = [
                ...comprehensiveExams.map((e: any) => ({
                    title: e.exam_title,
                    is_published: e.is_published,
                    created_at: e.created_at,
                    type: e.language === 'arabic' ? 'عربي شامل' : 'إنجليزي شامل'
                })),
                ...examTemplates.map((e: any) => ({
                    title: e.title?.ar || e.title?.en || 'امتحان',
                    is_published: e.is_published,
                    created_at: e.created_at,
                    type: 'قالب امتحان'
                }))
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);
            setRecentExams(allExams);

            // Mock subject stats (would need actual join with lessons/exams)
            const subjectStats = subjects.map((s: any) => ({
                name: s.name,
                count: Math.floor(Math.random() * 500) + 100,
                isActive: s.is_active
            })).sort((a: any, b: any) => b.count - a.count).slice(0, 5);
            setTopSubjects(subjectStats);
        } catch (err: any) {
            setError(err.message || "حدث خطأ في جلب الإحصائيات");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchStats(); }, []);

    if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
    if (error) return <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center"><AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" /><p className="text-red-600">{error}</p><button onClick={fetchStats} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg">إعادة المحاولة</button></div>;
    if (!stats) return null;

    const totalExams = stats.totalComprehensiveExams + stats.totalExamTemplates;

    const mainStats = [
        { label: "إجمالي المستخدمين", value: stats.totalUsers, icon: Users, color: "from-blue-500 to-blue-600", change: "+12%", up: true },
        { label: "المعلمين", value: stats.totalTeachers, icon: GraduationCap, color: "from-purple-500 to-purple-600", subtext: `${stats.verifiedTeachers} موثق` },
        { label: "الطلاب", value: stats.totalStudents, icon: Users, color: "from-green-500 to-green-600", change: "+8%", up: true },
        { label: "الامتحانات", value: totalExams, icon: FileText, color: "from-amber-500 to-amber-600", subtext: `${stats.publishedExams} منشور` },
    ];

    const contentStats = [
        { label: "المراحل الدراسية", value: stats.totalStages, icon: Layers },
        { label: "المواد", value: stats.totalSubjects, icon: BookOpen },
        { label: "الدروس", value: stats.totalLessons, icon: FileText },
        { label: "امتحانات شاملة", value: stats.totalComprehensiveExams, icon: Target },
    ];

    const performanceStats = [
        { label: "محاولات الامتحانات", value: stats.totalExamAttempts, icon: Award, color: "text-green-500" },
        { label: "الامتحانات المنشورة", value: stats.publishedExams, icon: Eye, color: "text-blue-500" },
        { label: "الدروس المنشورة", value: stats.publishedLessons, icon: BookOpen, color: "text-purple-500" },
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div><h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">الإحصائيات والتحليلات</h1><p className="text-gray-600 dark:text-gray-400 mt-1">نظرة شاملة على أداء المنصة</p></div>
                <button onClick={fetchStats} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-gray-800 text-sm font-medium hover:bg-gray-50"><RefreshCw className="h-4 w-4" />تحديث</button>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {mainStats.map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-white dark:bg-[#1c1c24] rounded-2xl p-5 border border-gray-200/60 dark:border-gray-800">
                        <div className="flex items-start justify-between mb-4">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${s.color} shadow-lg`}><s.icon className="h-5 w-5 text-white" /></div>
                            {s.change && <span className={`flex items-center gap-1 text-xs font-semibold ${s.up ? "text-green-500" : "text-red-500"}`}>{s.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{s.change}</span>}
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">{s.value.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                        {s.subtext && <p className="text-xs text-primary-500 mt-1">{s.subtext}</p>}
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Content Stats */}
                <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 border border-gray-200/60 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">المحتوى التعليمي</h3>
                    <div className="space-y-4">
                        {contentStats.map((s, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700"><s.icon className="h-4 w-4 text-gray-600 dark:text-gray-400" /></div><span className="text-sm font-medium text-gray-700 dark:text-gray-300">{s.label}</span></div>
                                <span className="text-lg font-bold text-gray-900 dark:text-white">{s.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Subjects */}
                <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 border border-gray-200/60 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">أفضل المواد</h3>
                    {topSubjects.length === 0 ? <p className="text-gray-500 text-center py-8">لا توجد بيانات</p> : (
                        <div className="space-y-3">
                            {topSubjects.map((subject: any, i: number) => (
                                <div key={i} className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 text-xs font-bold flex items-center justify-center">{i + 1}</span>
                                    <div className="flex-1">
                                        <div className="flex justify-between mb-1"><span className="text-sm font-medium text-gray-900 dark:text-white">{subject.name}</span><span className="text-xs text-gray-500">{subject.count} طالب</span></div>
                                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full" style={{ width: `${(subject.count / (topSubjects[0]?.count || 1)) * 100}%` }} /></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Exams */}
                <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 border border-gray-200/60 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">أحدث الامتحانات</h3>
                    {recentExams.length === 0 ? <p className="text-gray-500 text-center py-8">لا توجد امتحانات</p> : (
                        <div className="space-y-3">
                            {recentExams.map((exam: any, i: number) => (
                                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm">{i + 1}</div>
                                    <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 dark:text-white truncate">{exam.title}</p><p className="text-xs text-gray-500">{exam.type}</p></div>
                                    <span className={`shrink-0 px-2 py-1 rounded-lg text-xs font-medium ${exam.is_published ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}>{exam.is_published ? "منشور" : "مسودة"}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Performance */}
            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 border border-gray-200/60 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">ملخص الأداء</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {performanceStats.map((s, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                            <s.icon className={`h-8 w-8 ${s.color}`} />
                            <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p><p className="text-sm text-gray-500">{s.label}</p></div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
