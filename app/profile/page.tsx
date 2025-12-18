"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    User,
    Mail,
    Camera,
    Loader2,
    Save,
    LogOut,
    Shield,
    Award,
    BookOpen,
    Trophy,
    Calendar,
    Edit3,
    Settings,
    Lock,
    ChevronLeft,
    Clock,
    Target,
    Zap,
    Star,
    TrendingUp,
    CheckCircle,
    AlertCircle,
    Home
} from "lucide-react";
import { supabase, getUserProfile, updateUserProfile } from "@/lib/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { UserProfile } from "@/lib/definitions";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface Stage {
    id: string;
    name: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'settings'>('overview');
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [stages, setStages] = useState<Stage[]>([]);
    const [formData, setFormData] = useState({
        name: "",
        avatar_url: "",
        bio: "",
        educational_stage_id: ""
    });

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    router.push("/login");
                    return;
                }

                setUser(user);

                const userProfile = await getUserProfile(user.id);
                if (userProfile) {
                    setProfile(userProfile);
                    setFormData({
                        name: userProfile.name || "",
                        avatar_url: userProfile.avatar_url || "",
                        bio: userProfile.bio || "",
                        educational_stage_id: userProfile.educational_stage_id || ""
                    });
                }

                // Fetch stages
                const { data: stagesData } = await supabase
                    .from("educational_stages")
                    .select("id, name")
                    .order("order_index", { ascending: true });
                setStages(stagesData || []);
            } catch (error) {
                console.error("Error fetching user:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    const handleSave = async () => {
        if (!user) return;

        try {
            setIsSaving(true);
            await updateUserProfile(user.id, {
                name: formData.name,
                avatar_url: formData.avatar_url,
                bio: formData.bio,
                educational_stage_id: formData.educational_stage_id || null
            });

            // Refresh profile
            const updatedProfile = await getUserProfile(user.id);
            setProfile(updatedProfile);
            setIsEditing(false);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (error) {
            console.error("Error updating profile:", error);
            alert("حدث خطأ أثناء حفظ البيانات");
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#13131a]">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 text-primary-500 animate-spin mx-auto" />
                    <p className="mt-4 text-gray-500 dark:text-gray-400">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    // Mock data for activity (to be replaced with real data)
    const recentActivity = [
        { id: 1, type: 'exam', title: 'امتحان اللغة العربية', score: 85, date: 'منذ 2 ساعة', icon: Award, color: 'green' },
        { id: 2, type: 'lesson', title: 'درس النحو - الفاعل', date: 'منذ يوم', icon: BookOpen, color: 'blue' },
        { id: 3, type: 'achievement', title: 'حصلت على شارة المتميز', date: 'منذ 3 أيام', icon: Star, color: 'amber' },
    ];

    const achievements = [
        { id: 1, name: 'المتعلم النشط', description: 'أكمل 10 دروس', icon: Zap, unlocked: true },
        { id: 2, name: 'البطل', description: 'احصل على 100% في امتحان', icon: Trophy, unlocked: false },
        { id: 3, name: 'المثابر', description: 'ادخل 7 أيام متتالية', icon: Target, unlocked: true },
        { id: 4, name: 'النجم', description: 'كن ضمن أفضل 10 طلاب', icon: Star, unlocked: false },
    ];

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 dark:bg-[#13131a] pt-4">

                {/* Success Toast */}
                <AnimatePresence>
                    {saveSuccess && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500 text-white shadow-lg"
                        >
                            <CheckCircle className="h-5 w-5" />
                            <span>تم حفظ التغييرات بنجاح</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Sidebar - Profile Card */}
                        <div className="lg:col-span-1">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden sticky top-24"
                            >
                                {/* Cover */}
                                <div className="h-24 bg-gradient-to-br from-primary-500 via-primary-600 to-purple-600 relative">
                                    <div className="absolute inset-0 bg-black/10" />
                                </div>

                                {/* Avatar */}
                                <div className="relative px-5 pb-5">
                                    <div className="absolute -top-12 right-5">
                                        <div className="relative group">
                                            <div className="w-24 h-24 rounded-2xl bg-white dark:bg-[#1c1c24] p-1 shadow-xl">
                                                {profile?.avatar_url ? (
                                                    <img
                                                        src={profile.avatar_url}
                                                        alt={profile.name || "User"}
                                                        className="w-full h-full rounded-xl object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                                                        <span className="text-3xl font-bold text-white">
                                                            {(profile?.name || user.email || "U")[0].toUpperCase()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            {profile?.role === 'admin' && (
                                                <div className="absolute -bottom-1 -left-1 w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center shadow-lg">
                                                    <Shield className="h-3.5 w-3.5 text-white" />
                                                </div>
                                            )}
                                            {profile?.is_verified && (
                                                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
                                                    <CheckCircle className="h-3.5 w-3.5 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-14">
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                            {profile?.name || "مستخدم جديد"}
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                                            <Mail className="h-3.5 w-3.5" />
                                            {user.email}
                                        </p>

                                        {profile?.bio && (
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 leading-relaxed">
                                                {profile.bio}
                                            </p>
                                        )}

                                        <div className="flex flex-wrap gap-2 mt-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${profile?.role === 'admin'
                                                ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                                                : profile?.role === 'teacher'
                                                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                                }`}>
                                                {profile?.role === 'admin' ? (
                                                    <><Shield className="h-3 w-3" /> مسؤول</>
                                                ) : profile?.role === 'teacher' ? (
                                                    <><BookOpen className="h-3 w-3" /> معلم</>
                                                ) : (
                                                    <><User className="h-3 w-3" /> طالب</>
                                                )}
                                            </span>
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                                                <Calendar className="h-3 w-3" />
                                                منذ {new Date(profile?.created_at || user.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short' })}
                                            </span>
                                        </div>

                                        {/* Quick Actions */}
                                        <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-800 space-y-2">
                                            {/* Teacher Setup Link */}
                                            <Link
                                                href="/profile/teacher-setup"
                                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-700 dark:text-blue-300 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 transition-colors text-sm border border-blue-200/50 dark:border-blue-800/50"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <BookOpen className="h-4 w-4" />
                                                    <span>وضع المدرس</span>
                                                </div>
                                                <ChevronLeft className="h-4 w-4" />
                                            </Link>
                                            <button
                                                onClick={() => {
                                                    setActiveTab('settings');
                                                    setIsEditing(true);
                                                }}
                                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Edit3 className="h-4 w-4" />
                                                    <span>تعديل الملف الشخصي</span>
                                                </div>
                                                <ChevronLeft className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <LogOut className="h-4 w-4" />
                                                    <span>تسجيل الخروج</span>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Tabs */}
                            <div className="flex gap-2 bg-white dark:bg-[#1c1c24] p-1.5 rounded-xl border border-gray-200/60 dark:border-gray-800">
                                {[
                                    { id: 'overview', label: 'نظرة عامة', icon: TrendingUp },
                                    { id: 'activity', label: 'النشاط', icon: Clock },
                                    { id: 'settings', label: 'الإعدادات', icon: Settings },
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                            ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                            }`}
                                    >
                                        <tab.icon className="h-4 w-4" />
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {/* Stats */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {[
                                            { label: 'دروس مكتملة', value: 0, icon: BookOpen, color: 'blue' },
                                            { label: 'امتحانات ناجحة', value: 0, icon: Award, color: 'green' },
                                            { label: 'نقاط مكتسبة', value: 0, icon: Trophy, color: 'amber' },
                                            { label: 'أيام نشاط', value: 1, icon: Zap, color: 'purple' },
                                        ].map((stat, index) => (
                                            <motion.div
                                                key={stat.label}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className="bg-white dark:bg-[#1c1c24] rounded-xl border border-gray-200/60 dark:border-gray-800 p-4"
                                            >
                                                <div className={`w-10 h-10 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30 flex items-center justify-center mb-3`}>
                                                    <stat.icon className={`h-5 w-5 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                                                </div>
                                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.label}</p>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Achievements */}
                                    <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 p-5">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <Trophy className="h-5 w-5 text-amber-500" />
                                            الإنجازات
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                            {achievements.map((achievement) => (
                                                <div
                                                    key={achievement.id}
                                                    className={`relative p-4 rounded-xl border-2 text-center transition-all ${achievement.unlocked
                                                        ? "border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20"
                                                        : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60"
                                                        }`}
                                                >
                                                    <div className={`w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center ${achievement.unlocked
                                                        ? "bg-amber-100 dark:bg-amber-900/30"
                                                        : "bg-gray-100 dark:bg-gray-800"
                                                        }`}>
                                                        <achievement.icon className={`h-6 w-6 ${achievement.unlocked
                                                            ? "text-amber-600 dark:text-amber-400"
                                                            : "text-gray-400"
                                                            }`} />
                                                    </div>
                                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{achievement.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{achievement.description}</p>
                                                    {achievement.unlocked && (
                                                        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                                            <CheckCircle className="h-4 w-4 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Activity Tab */}
                            {activeTab === 'activity' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 p-5"
                                >
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-primary-500" />
                                        النشاط الأخير
                                    </h3>

                                    {recentActivity.length > 0 ? (
                                        <div className="space-y-3">
                                            {recentActivity.map((activity, index) => (
                                                <motion.div
                                                    key={activity.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: index * 0.1 }}
                                                    className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50"
                                                >
                                                    <div className={`w-10 h-10 rounded-lg bg-${activity.color}-100 dark:bg-${activity.color}-900/30 flex items-center justify-center`}>
                                                        <activity.icon className={`h-5 w-5 text-${activity.color}-600 dark:text-${activity.color}-400`} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900 dark:text-white">{activity.title}</p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{activity.date}</p>
                                                    </div>
                                                    {activity.score && (
                                                        <div className="text-right">
                                                            <span className="text-lg font-bold text-green-600">{activity.score}%</span>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10">
                                            <Clock className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                            <p className="text-gray-500 dark:text-gray-400">لا يوجد نشاط حتى الآن</p>
                                        </div>
                                    )}
                                </motion.div>
                            )}

                            {/* Settings Tab */}
                            {activeTab === 'settings' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    {/* Edit Profile */}
                                    <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 p-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <Edit3 className="h-5 w-5 text-primary-500" />
                                            تعديل الملف الشخصي
                                        </h3>

                                        <div className="space-y-4">
                                            {/* Name */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    الاسم الكامل
                                                </label>
                                                <div className="relative">
                                                    <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={formData.name}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                        className="w-full pr-10 pl-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                                        placeholder="اسمك الكامل"
                                                    />
                                                </div>
                                            </div>

                                            {/* Bio */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    نبذة عنك
                                                </label>
                                                <textarea
                                                    value={formData.bio}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                                    rows={3}
                                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
                                                    placeholder="اكتب نبذة مختصرة عنك..."
                                                />
                                            </div>

                                            {/* Avatar URL */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    رابط صورة الملف الشخصي
                                                </label>
                                                <div className="relative">
                                                    <Camera className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                                    <input
                                                        type="url"
                                                        value={formData.avatar_url}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                                                        className="w-full pr-10 pl-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
                                                        placeholder="https://example.com/avatar.jpg"
                                                        dir="ltr"
                                                    />
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">أدخل رابط صورة من الإنترنت</p>
                                            </div>

                                            {/* Educational Stage */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    المرحلة التعليمية <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={formData.educational_stage_id}
                                                    onChange={(e) => setFormData(prev => ({ ...prev, educational_stage_id: e.target.value }))}
                                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                                                >
                                                    <option value="">اختر المرحلة التعليمية</option>
                                                    {stages.map((stage) => (
                                                        <option key={stage.id} value={stage.id}>
                                                            {stage.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <p className="text-xs text-gray-500 mt-1">سيتم عرض دروس هذه المرحلة في الصفحة الرئيسية</p>
                                            </div>

                                            {/* Save Button */}
                                            <div className="flex justify-end pt-4">
                                                <button
                                                    onClick={handleSave}
                                                    disabled={isSaving}
                                                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/25"
                                                >
                                                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                                    <span>حفظ التغييرات</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Account Settings */}
                                    <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 p-6">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                            <Settings className="h-5 w-5 text-gray-500" />
                                            إعدادات الحساب
                                        </h3>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                                <div className="flex items-center gap-3">
                                                    <Mail className="h-5 w-5 text-gray-500" />
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">البريد الإلكتروني</p>
                                                        <p className="text-sm text-gray-500">{user.email}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs text-gray-400">لا يمكن تغييره</span>
                                            </div>

                                            <button className="w-full flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <Lock className="h-5 w-5 text-gray-500" />
                                                    <div className="text-right">
                                                        <p className="font-medium text-gray-900 dark:text-white">تغيير كلمة المرور</p>
                                                        <p className="text-sm text-gray-500">آخر تغيير: غير معروف</p>
                                                    </div>
                                                </div>
                                                <ChevronLeft className="h-5 w-5 text-gray-400" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-6">
                                        <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                                            <AlertCircle className="h-5 w-5" />
                                            منطقة الخطر
                                        </h3>
                                        <p className="text-sm text-red-600/70 dark:text-red-400/70 mb-4">
                                            هذه الإجراءات لا يمكن التراجع عنها. يرجى التأكد قبل المتابعة.
                                        </p>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600 font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            <span>تسجيل الخروج من جميع الأجهزة</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}
