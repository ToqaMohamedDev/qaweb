"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
    GraduationCap,
    User,
    Mail,
    Camera,
    Loader2,
    Save,
    CheckCircle,
    AlertCircle,
    ChevronLeft,
    Globe,
    Phone,
    BookOpen,
    Award,
    Star,
    Clock,
    Users,
    Eye,
    EyeOff,
    Sparkles,
    Crown,
    Zap,
    TrendingUp,
    ExternalLink,
    Youtube,
    Facebook,
    Instagram,
    MessageCircle,
    Image as ImageIcon,
    FileText,
    Target,
    Settings,
    Edit3,
    ArrowRight,
    Shield,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface TeacherProfile {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar_url: string | null;
    bio: string | null;
    specialization: string | null;
    is_verified: boolean;
    is_teacher_profile_public: boolean;
    teacher_title: string | null;
    years_of_experience: number;
    education: string | null;
    phone: string | null;
    website: string | null;
    social_links: {
        tiktok?: string;
        youtube?: string;
        facebook?: string;
        instagram?: string;
        whatsapp?: string;
    };
    subjects: string[];
    stages: string[];
    teaching_style: string | null;
    cover_image_url: string | null;
    is_featured: boolean;
    featured_until: string | null;
    subscriber_count: number;
    total_views: number;
    rating_average: number;
    rating_count: number;
}

// Subject from database
interface Subject {
    id: string;
    name: string;
    slug: string;
}

// Stage from database
interface Stage {
    id: string;
    name: string;
}

export default function TeacherSetupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'basic' | 'professional' | 'social' | 'preview'>('basic');
    const [profile, setProfile] = useState<TeacherProfile | null>(null);
    const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
    const [availableStages, setAvailableStages] = useState<Stage[]>([]);

    const [formData, setFormData] = useState({
        name: "",
        avatar_url: "",
        bio: "",
        specialization: "",
        teacher_title: "",
        years_of_experience: 0,
        education: "",
        phone: "",
        website: "",
        cover_image_url: "",
        teaching_style: "",
        is_teacher_profile_public: false,
        social_links: {
            tiktok: "",
            youtube: "",
            facebook: "",
            instagram: "",
            whatsapp: "",
        },
        subject: "",  // Single subject - required
        stages: [] as string[],
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push("/login");
                return;
            }

            // Fetch subjects from database
            const { data: subjectsData, error: subjectsError } = await supabase
                .from("subjects")
                .select("id, name, slug")
                .eq("is_active", true)
                .order("order_index", { ascending: true });

            if (subjectsError) {
                console.error("Error fetching subjects:", subjectsError);
            } else if (subjectsData) {
                setAvailableSubjects(subjectsData);
            }

            // Fetch stages from database
            const { data: stagesData, error: stagesError } = await supabase
                .from("educational_stages")
                .select("id, name")
                .order("order_index", { ascending: true });

            if (stagesError) {
                console.error("Error fetching stages:", stagesError);
            } else if (stagesData) {
                setAvailableStages(stagesData);
            }

            const { data: profileData, error: profileError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (profileError) throw profileError;

            if (profileData) {
                // Use any type to handle new fields that may not be in Supabase types yet
                const data = profileData as any;
                setProfile(data as TeacherProfile);
                setFormData({
                    name: data.name || "",
                    avatar_url: data.avatar_url || "",
                    bio: data.bio || "",
                    specialization: data.specialization || "",
                    teacher_title: data.teacher_title || "",
                    years_of_experience: data.years_of_experience || 0,
                    education: data.education || "",
                    phone: data.phone || "",
                    website: data.website || "",
                    cover_image_url: data.cover_image_url || "",
                    teaching_style: data.teaching_style || "",
                    is_teacher_profile_public: data.is_teacher_profile_public || false,
                    social_links: data.social_links || {
                        twitter: "",
                        youtube: "",
                        facebook: "",
                        instagram: "",
                        linkedin: "",
                    },
                    subject: data.subjects?.[0] || data.subject || "",
                    stages: data.stages || [],
                });
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
            setError("حدث خطأ في جلب البيانات");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!profile) return;

        // Validate required fields
        if (!formData.subject) {
            setError("يجب اختيار المادة التي تدرسها");
            return;
        }

        if (!formData.name.trim()) {
            setError("يجب إدخال الاسم");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            const { error: updateError } = await supabase
                .from("profiles")
                .update({
                    name: formData.name,
                    avatar_url: formData.avatar_url || null,
                    bio: formData.bio || null,
                    specialization: formData.specialization || null,
                    teacher_title: formData.teacher_title || null,
                    years_of_experience: formData.years_of_experience,
                    education: formData.education || null,
                    phone: formData.phone || null,
                    website: formData.website || null,
                    cover_image_url: formData.cover_image_url || null,
                    teaching_style: formData.teaching_style || null,
                    is_teacher_profile_public: formData.is_teacher_profile_public,
                    social_links: formData.social_links,
                    subjects: formData.subject ? [formData.subject] : [],
                    stages: formData.stages,
                    role: "teacher", // Ensure role is teacher
                    updated_at: new Date().toISOString(),
                })
                .eq("id", profile.id);

            if (updateError) throw updateError;

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);

            // Refresh profile
            await fetchProfile();
        } catch (err) {
            console.error("Error saving profile:", err);
            setError("حدث خطأ أثناء حفظ البيانات");
        } finally {
            setIsSaving(false);
        }
    };

    const selectSubject = (subject: string) => {
        setFormData(prev => ({
            ...prev,
            subject: prev.subject === subject ? "" : subject
        }));
    };

    const toggleStage = (stage: string) => {
        setFormData(prev => ({
            ...prev,
            stages: prev.stages.includes(stage)
                ? prev.stages.filter(s => s !== stage)
                : [...prev.stages, stage]
        }));
    };

    if (isLoading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#13131a]">
                    <div className="text-center">
                        <Loader2 className="h-10 w-10 text-primary-500 animate-spin mx-auto" />
                        <p className="mt-4 text-gray-500 dark:text-gray-400">جاري التحميل...</p>
                    </div>
                </div>
            </>
        );
    }

    const completionPercentage = () => {
        const fields = [
            formData.name,
            formData.avatar_url,
            formData.bio,
            formData.specialization,
            formData.teacher_title,
            formData.education,
            formData.subject ? true : false,
            formData.stages.length > 0,
        ];
        const filled = fields.filter(Boolean).length;
        return Math.round((filled / fields.length) * 100);
    };

    const tabs = [
        { id: 'basic', label: 'المعلومات الأساسية', icon: User },
        { id: 'professional', label: 'المعلومات المهنية', icon: GraduationCap },
        { id: 'social', label: 'التواصل الاجتماعي', icon: Globe },
        { id: 'preview', label: 'معاينة', icon: Eye },
    ];

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 dark:bg-[#13131a] pt-4" dir="rtl">
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

                {/* Error Toast */}
                <AnimatePresence>
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed top-20 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500 text-white shadow-lg"
                        >
                            <AlertCircle className="h-5 w-5" />
                            <span>{error}</span>
                            <button onClick={() => setError(null)} className="mr-2">×</button>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="max-w-5xl mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500">
                                <GraduationCap className="h-8 w-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إعداد ملف المعلم</h1>
                                <p className="text-gray-500 dark:text-gray-400">قم بإعداد ملفك الشخصي ليظهر في صفحة المعلمين</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">اكتمال الملف الشخصي</span>
                                <span className="text-sm font-bold text-primary-600">{completionPercentage()}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${completionPercentage()}%` }}
                                    className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 bg-white dark:bg-[#1c1c24] p-1.5 rounded-xl border border-gray-200 dark:border-gray-800 mb-6 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? "bg-primary-500 text-white shadow-lg shadow-primary-500/25"
                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="space-y-6">
                        {/* Basic Info Tab */}
                        {activeTab === 'basic' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-gray-800 p-6"
                            >
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary-500" />
                                    المعلومات الأساسية
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Name */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            الاسم الكامل *
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="اسمك الكامل"
                                        />
                                    </div>

                                    {/* Title */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            اللقب المهني
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.teacher_title}
                                            onChange={(e) => setFormData(prev => ({ ...prev, teacher_title: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="مثال: أستاذ اللغة العربية"
                                        />
                                    </div>

                                    {/* Avatar URL */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            صورة الملف الشخصي (URL)
                                        </label>
                                        <div className="flex gap-3">
                                            <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0">
                                                {formData.avatar_url ? (
                                                    <img src={formData.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Camera className="h-6 w-6 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                type="url"
                                                value={formData.avatar_url}
                                                onChange={(e) => setFormData(prev => ({ ...prev, avatar_url: e.target.value }))}
                                                className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                                placeholder="https://example.com/photo.jpg"
                                                dir="ltr"
                                            />
                                        </div>
                                    </div>

                                    {/* Cover Image */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            صورة الغلاف (URL)
                                        </label>
                                        <input
                                            type="url"
                                            value={formData.cover_image_url}
                                            onChange={(e) => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                            placeholder="https://example.com/cover.jpg"
                                            dir="ltr"
                                        />
                                    </div>

                                    {/* Bio */}
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            نبذة عنك *
                                        </label>
                                        <textarea
                                            value={formData.bio}
                                            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                            rows={4}
                                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                            placeholder="اكتب نبذة مختصرة عنك وعن خبرتك في التدريس..."
                                        />
                                        <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/500 حرف</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Professional Info Tab */}
                        {activeTab === 'professional' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                        <GraduationCap className="h-5 w-5 text-blue-500" />
                                        المعلومات المهنية
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Specialization */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                التخصص الرئيسي *
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.specialization}
                                                onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="مثال: اللغة العربية والنحو"
                                            />
                                        </div>

                                        {/* Years of Experience */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                سنوات الخبرة
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.years_of_experience}
                                                onChange={(e) => setFormData(prev => ({ ...prev, years_of_experience: parseInt(e.target.value) || 0 }))}
                                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                min="0"
                                                max="50"
                                            />
                                        </div>

                                        {/* Education */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                المؤهل العلمي
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.education}
                                                onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="مثال: ماجستير في اللغة العربية - جامعة القاهرة"
                                            />
                                        </div>

                                        {/* Teaching Style */}
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                أسلوب التدريس
                                            </label>
                                            <textarea
                                                value={formData.teaching_style}
                                                onChange={(e) => setFormData(prev => ({ ...prev, teaching_style: e.target.value }))}
                                                rows={3}
                                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                                placeholder="صف أسلوبك في التدريس وطريقتك في توصيل المعلومة..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Subject - Single Selection Required */}
                                <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-md font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            المادة التي تدرسها
                                            <span className="text-red-500">*</span>
                                        </h3>
                                        {!formData.subject && (
                                            <span className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg">
                                                إجباري - اختر مادة واحدة
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {availableSubjects.length > 0 ? (
                                            availableSubjects.map((subj) => (
                                                <button
                                                    key={subj.id}
                                                    onClick={() => selectSubject(subj.name)}
                                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${formData.subject === subj.name
                                                        ? "bg-primary-500 text-white ring-2 ring-primary-300 shadow-lg shadow-primary-500/25"
                                                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                        }`}
                                                >
                                                    {formData.subject === subj.name && <CheckCircle className="inline-block h-4 w-4 mr-1" />}
                                                    {subj.name}
                                                </button>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-sm">جاري تحميل المواد...</p>
                                        )}
                                    </div>
                                    {formData.subject && (
                                        <div className="mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                                            <CheckCircle className="h-4 w-4" />
                                            <span>تم اختيار: {formData.subject}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Stages */}
                                <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                                    <h3 className="text-md font-bold text-gray-900 dark:text-white mb-4">المراحل الدراسية</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {availableStages.length > 0 ? (
                                            availableStages.map((stage) => (
                                                <button
                                                    key={stage.id}
                                                    onClick={() => toggleStage(stage.name)}
                                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${formData.stages.includes(stage.name)
                                                        ? "bg-blue-500 text-white"
                                                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                                        }`}
                                                >
                                                    {stage.name}
                                                </button>
                                            ))
                                        ) : (
                                            <p className="text-gray-500 text-sm">جاري تحميل المراحل...</p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Social Tab */}
                        {activeTab === 'social' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-gray-800 p-6"
                            >
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-green-500" />
                                    معلومات التواصل
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Phone */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            رقم الهاتف
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                                className="w-full pr-10 pl-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="+20 xxx xxx xxxx"
                                                dir="ltr"
                                            />
                                        </div>
                                    </div>

                                    {/* Website */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            الموقع الإلكتروني
                                        </label>
                                        <div className="relative">
                                            <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                            <input
                                                type="url"
                                                value={formData.website}
                                                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                                className="w-full pr-10 pl-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                placeholder="https://yourwebsite.com"
                                                dir="ltr"
                                            />
                                        </div>
                                    </div>

                                    {/* Social Links */}
                                    <div className="md:col-span-2">
                                        <h3 className="text-md font-bold text-gray-900 dark:text-white mb-4">حسابات التواصل الاجتماعي</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {[
                                                { key: 'youtube', icon: Youtube, label: 'YouTube', color: 'text-red-500' },
                                                { key: 'facebook', icon: Facebook, label: 'Facebook', color: 'text-blue-600' },
                                                { key: 'tiktok', icon: null, label: 'TikTok', color: 'text-gray-900 dark:text-white' },
                                                { key: 'instagram', icon: Instagram, label: 'Instagram', color: 'text-pink-500' },
                                                { key: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', color: 'text-green-500' },
                                            ].map((social) => (
                                                <div key={social.key} className="relative">
                                                    {social.icon ? (
                                                        <social.icon className={`absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 ${social.color}`} />
                                                    ) : (
                                                        <svg className={`absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 ${social.color}`} viewBox="0 0 24 24" fill="currentColor">
                                                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                                                        </svg>
                                                    )}
                                                    <input
                                                        type="url"
                                                        value={(formData.social_links as any)[social.key] || ""}
                                                        onChange={(e) => setFormData(prev => ({
                                                            ...prev,
                                                            social_links: { ...prev.social_links, [social.key]: e.target.value }
                                                        }))}
                                                        className="w-full pr-10 pl-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                                                        placeholder={`رابط ${social.label}`}
                                                        dir="ltr"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Preview Tab */}
                        {activeTab === 'preview' && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-6"
                            >
                                {/* Preview Card */}
                                <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                                    {/* Cover */}
                                    <div
                                        className="h-32 bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500"
                                        style={formData.cover_image_url ? { backgroundImage: `url(${formData.cover_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                                    />

                                    <div className="relative px-6 pb-6">
                                        {/* Avatar */}
                                        <div className="absolute -top-12 right-6">
                                            <div className="w-24 h-24 rounded-2xl bg-white dark:bg-[#1c1c24] p-1 shadow-xl">
                                                {formData.avatar_url ? (
                                                    <img src={formData.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
                                                ) : (
                                                    <div className="w-full h-full rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                                                        <span className="text-3xl font-bold text-white">
                                                            {(formData.name || "م")[0]}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="pt-14">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                        {formData.name || "اسم المعلم"}
                                                        {profile?.is_verified && <CheckCircle className="h-5 w-5 text-blue-500" />}
                                                    </h2>
                                                    {formData.teacher_title && (
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">{formData.teacher_title}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-3 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium">
                                                        {formData.years_of_experience} سنة خبرة
                                                    </span>
                                                </div>
                                            </div>

                                            {formData.bio && (
                                                <p className="text-gray-600 dark:text-gray-300 mt-4 leading-relaxed">
                                                    {formData.bio}
                                                </p>
                                            )}

                                            {/* Tags */}
                                            <div className="flex flex-wrap gap-2 mt-4">
                                                {formData.subject && (
                                                    <span className="px-3 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-medium">
                                                        {formData.subject}
                                                    </span>
                                                )}
                                                {formData.stages.map((stage) => (
                                                    <span key={stage} className="px-3 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-medium">
                                                        {stage}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Stats Mock */}
                                            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                                                <div className="text-center">
                                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.subscriber_count || 0}</p>
                                                    <p className="text-xs text-gray-500">مشترك</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.rating_average?.toFixed(1) || "0.0"}</p>
                                                    <p className="text-xs text-gray-500">تقييم</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.total_views || 0}</p>
                                                    <p className="text-xs text-gray-500">مشاهدة</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Visibility Toggle */}
                                <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {formData.is_teacher_profile_public ? (
                                                <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30">
                                                    <Eye className="h-6 w-6 text-green-600 dark:text-green-400" />
                                                </div>
                                            ) : (
                                                <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800">
                                                    <EyeOff className="h-6 w-6 text-gray-500" />
                                                </div>
                                            )}
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white">
                                                    {formData.is_teacher_profile_public ? "الملف الشخصي مرئي" : "الملف الشخصي مخفي"}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    {formData.is_teacher_profile_public
                                                        ? "ملفك الشخصي يظهر في صفحة المعلمين"
                                                        : "قم بتفعيل العرض ليظهر ملفك في صفحة المعلمين"
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setFormData(prev => ({ ...prev, is_teacher_profile_public: !prev.is_teacher_profile_public }))}
                                            className={`relative w-14 h-7 rounded-full transition-colors ${formData.is_teacher_profile_public
                                                ? "bg-green-500"
                                                : "bg-gray-300 dark:bg-gray-600"
                                                }`}
                                        >
                                            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${formData.is_teacher_profile_public ? "right-1" : "right-8"
                                                }`} />
                                        </button>
                                    </div>
                                </div>

                                {/* Exams Management Section */}
                                <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                                                <FileText className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white">إدارة الامتحانات</h3>
                                                <p className="text-sm text-gray-500">أنشئ امتحانات جديدة وأدرها</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <Link
                                            href="/admin/exams"
                                            className="flex items-center gap-4 p-4 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl text-white hover:from-violet-600 hover:to-purple-700 transition-all shadow-lg shadow-violet-500/25 group"
                                        >
                                            <div className="p-3 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors">
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold">إنشاء امتحان جديد</p>
                                                <p className="text-sm text-white/80">أضف امتحان أو اختبار جديد</p>
                                            </div>
                                        </Link>

                                        <Link
                                            href="/admin/questions"
                                            className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-[#252530] rounded-xl text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-[#2e2e3a] transition-all group"
                                        >
                                            <div className="p-3 bg-gray-200 dark:bg-gray-700 rounded-xl group-hover:bg-gray-300 dark:group-hover:bg-gray-600 transition-colors">
                                                <BookOpen className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                                            </div>
                                            <div>
                                                <p className="font-bold">بنك الأسئلة</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">إدارة الأسئلة</p>
                                            </div>
                                        </Link>
                                    </div>

                                    {/* Teacher Profile Link */}
                                    {profile && (
                                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <Link
                                                href={`/teachers/${profile.id}`}
                                                className="flex items-center gap-2 text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium text-sm"
                                            >
                                                <Eye className="h-4 w-4" />
                                                معاينة ملفك الشخصي العام
                                            </Link>
                                        </div>
                                    )}
                                </div>

                                {/* Premium Section */}
                                <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 rounded-2xl p-6 text-white">
                                    <div className="absolute top-0 left-0 w-full h-full opacity-20">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Crown className="h-8 w-8" />
                                            <h3 className="text-xl font-bold">اشتراك المعلم المميز</h3>
                                        </div>
                                        <p className="text-white/80 mb-4">
                                            اشترك لتظهر في أعلى قائمة المعلمين في الشريط الجانبي وتحصل على شارة التميز!
                                        </p>
                                        <ul className="space-y-2 mb-6">
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4" />
                                                <span>ظهور أول في قائمة الاشتراكات</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4" />
                                                <span>شارة المعلم المميز الذهبية</span>
                                            </li>
                                            <li className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4" />
                                                <span>إشعارات مميزة للمشتركين</span>
                                            </li>
                                        </ul>
                                        <button className="w-full py-3 rounded-xl bg-white text-amber-600 font-bold hover:bg-gray-100 transition-colors">
                                            ترقية للاشتراك المميز
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Save Button */}
                    <div className="mt-8 flex items-center justify-between">
                        <Link
                            href="/profile"
                            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                        >
                            <ArrowRight className="h-4 w-4" />
                            <span>العودة للملف الشخصي</span>
                        </Link>

                        <div className="flex items-center gap-4">
                            {/* Validation Warning */}
                            {!formData.subject && (
                                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                                    <AlertCircle className="h-4 w-4" />
                                    <span>اختر المادة أولاً</span>
                                </div>
                            )}

                            {/* Save/Confirm Button */}
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !formData.subject}
                                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${formData.subject
                                    ? "bg-gradient-to-r from-primary-500 to-purple-500 hover:from-primary-600 hover:to-purple-600 text-white shadow-primary-500/25"
                                    : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                    } disabled:opacity-50`}
                            >
                                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                                <span>تأكيد وحفظ التغييرات</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}
