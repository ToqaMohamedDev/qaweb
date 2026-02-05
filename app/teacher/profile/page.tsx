"use client";

// =============================================
// Teacher Profile Settings - إعدادات الملف الشخصي العام للمدرس
// =============================================

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Camera,
    Save,
    Loader2,
    CheckCircle,
    Check,
    Globe,
    Phone,
    BookOpen,
    GraduationCap,
    Link as LinkIcon,
    Facebook,
    Instagram,
    Eye,
    EyeOff,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Avatar, ImageCropper } from "@/components/common";
import { useAuthStore, selectIsApprovedTeacher } from "@/lib/stores/useAuthStore";
import { createClient } from "@/lib/supabase";

interface TeacherProfileData {
    name: string;
    bio: string;
    avatar_url: string;
    cover_image_url: string;
    specialization: string;
    teacher_title: string;
    years_of_experience: number;
    education: string;
    phone: string;
    whatsapp: string;
    website: string;
    teaching_style: string;
    subjects: string[];
    stages: string[];
    is_teacher_profile_public: boolean;
    social_links: {
        youtube?: string;
        facebook?: string;
        tiktok?: string;
        instagram?: string;
    };
}

export default function TeacherProfilePage() {
    const router = useRouter();
    const { user, isLoading: authLoading, refreshUser } = useAuthStore();
    const isApprovedTeacher = useAuthStore(selectIsApprovedTeacher);

    const [formData, setFormData] = useState<TeacherProfileData>({
        name: "",
        bio: "",
        avatar_url: "",
        cover_image_url: "",
        specialization: "",
        teacher_title: "",
        years_of_experience: 0,
        education: "",
        phone: "",
        whatsapp: "",
        website: "",
        teaching_style: "",
        subjects: [],
        stages: [],
        is_teacher_profile_public: false,
        social_links: {},
    });

    const [isLoading, setIsLoading] = useState(true);
    const [mounted, setMounted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isUploadingCover, setIsUploadingCover] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [availableSubjects, setAvailableSubjects] = useState<{ id: string; name: string }[]>([]);
    const [availableStages, setAvailableStages] = useState<{ id: string; name: string }[]>([]);

    // Image Cropper state
    const [cropperImage, setCropperImage] = useState<File | null>(null);
    const [cropperType, setCropperType] = useState<'avatar' | 'cover'>('avatar');

    // Wait for hydration
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (authLoading) return;

        if (!user || user.role !== 'teacher') {
            router.push("/");
            return;
        }

        if (!isApprovedTeacher) {
            router.push("/teacher");
            return;
        }

        fetchAllData();
    }, [user, authLoading, isApprovedTeacher]);

    const fetchAllData = async () => {
        // Safety timeout - 5 seconds
        const timeoutId = setTimeout(() => setIsLoading(false), 5000);

        const supabase = createClient();

        try {
            // CRITICAL: Get user from session, NOT from Zustand (Zustand may have stale data on Vercel)
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData.session?.user) {
                console.log('No session found');
                setIsLoading(false);
                return;
            }

            const userId = sessionData.session.user.id; // Use session user ID!

            // Fetch all data in parallel
            const [profileResult, subjectsResult, stagesResult] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', userId).single(), // Use session user ID!
                supabase.from('subjects').select('id, name').eq('is_active', true).order('order_index'),
                supabase.from('educational_stages').select('id, name').order('order_index'),
            ]);

            // Set subjects and stages
            setAvailableSubjects(subjectsResult.data || []);
            setAvailableStages(stagesResult.data || []);

            // Set profile data
            if (profileResult.data) {
                const data = profileResult.data;
                setFormData({
                    name: data.name || "",
                    bio: data.bio || "",
                    avatar_url: data.avatar_url || "",
                    cover_image_url: (data as any).cover_image_url || "",
                    specialization: (data as any).specialization || "",
                    teacher_title: (data as any).teacher_title || "",
                    years_of_experience: (data as any).years_of_experience || 0,
                    education: (data as any).education || "",
                    phone: data.phone || "",
                    whatsapp: (data as any).social_links?.whatsapp || (data as any).whatsapp || "",
                    website: (data as any).website || "",
                    teaching_style: (data as any).teaching_style || "",
                    subjects: (data as any).subjects || [],
                    stages: (data as any).stages || [],
                    is_teacher_profile_public: (data as any).is_teacher_profile_public || false,
                    social_links: ((data as any).social_links as TeacherProfileData['social_links']) || {},
                });
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            clearTimeout(timeoutId);
            setIsLoading(false);
        }
    };

    // فتح الـ cropper عند اختيار صورة
    const handleImageSelect = (
        event: React.ChangeEvent<HTMLInputElement>,
        type: 'avatar' | 'cover'
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setCropperType(type);
        setCropperImage(file);

        // Reset input
        event.target.value = '';
    };

    // رفع الصورة بعد القص
    const handleCroppedImageUpload = async (croppedFile: File) => {
        if (!user) return;

        setCropperImage(null);

        const type = cropperType;
        const setLoading = type === 'avatar' ? setIsUploadingAvatar : setIsUploadingCover;
        setLoading(true);

        try {
            // رفع الصورة عبر الخادم
            const uploadResponse = await fetch(
                `/api/upload/teacher-image?type=${type}&fileName=${encodeURIComponent(croppedFile.name)}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': croppedFile.type,
                    },
                    body: croppedFile,
                }
            );

            const result = await uploadResponse.json();

            if (!uploadResponse.ok) {
                throw new Error(result.error || 'فشل في رفع الصورة');
            }

            // تحديث الـ state
            const field = type === 'avatar' ? 'avatar_url' : 'cover_image_url';
            setFormData(prev => ({ ...prev, [field]: result.url }));
        } catch (error: any) {
            console.error('Error uploading image:', error);
            const errorMsg = error.message || 'فشل في رفع الصورة';
            alert(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        const supabase = createClient();

        try {
            // CRITICAL: Get user from session, NOT from Zustand (Zustand may have stale data on Vercel)
            const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !sessionData.session?.user) {
                throw new Error('الجلسة منتهية - يرجى تسجيل الدخول مرة أخرى');
            }

            const userId = sessionData.session.user.id; // Use session user ID!

            const { error } = await supabase
                .from('profiles')
                .update({
                    name: formData.name,
                    bio: formData.bio,
                    avatar_url: formData.avatar_url,
                    cover_image_url: formData.cover_image_url,
                    specialization: formData.specialization,
                    teacher_title: formData.teacher_title,
                    years_of_experience: formData.years_of_experience,
                    education: formData.education,
                    phone: formData.phone,
                    website: formData.website,
                    teaching_style: formData.teaching_style,
                    subjects: formData.subjects,
                    stages: formData.stages,
                    is_teacher_profile_public: formData.is_teacher_profile_public,
                    social_links: { ...formData.social_links, whatsapp: formData.whatsapp },
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userId); // Use session user ID!

            if (error) {
                console.error('Supabase update error:', error);
                throw new Error(error.message || 'فشل في تحديث البيانات');
            }

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
            await refreshUser();
        } catch (error: any) {
            console.error('Error saving profile:', error);
            alert(`فشل الحفظ: ${error.message || 'حدث خطأ غير متوقع'}`);
        } finally {
            setIsSaving(false);
        }
    };

    if (!mounted || authLoading || isLoading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 dark:from-[#0d0d14] dark:via-[#13131a] dark:to-[#0d0d14] flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 dark:from-[#0d0d14] dark:via-[#13131a] dark:to-[#0d0d14]" dir="rtl">
                {/* Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
                </div>

                {/* Success Toast */}
                <AnimatePresence>
                    {saveSuccess && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed top-20 right-4 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-xl"
                        >
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium">تم حفظ التغييرات بنجاح</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <main className="relative container mx-auto px-4 py-8 max-w-4xl">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                        <Link href="/teacher" className="hover:text-primary-500">لوحة التحكم</Link>
                        <span>/</span>
                        <span className="text-gray-900 dark:text-white">الملف الشخصي العام</span>
                    </div>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between mb-8"
                    >
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">
                                الملف الشخصي العام
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                هذه البيانات ستظهر للطلاب في صفحتك العامة
                            </p>
                        </div>
                        {formData.is_teacher_profile_public && (
                            <Link
                                href={`/teachers/${user?.id}`}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium text-sm hover:bg-primary-200"
                            >
                                <Eye className="h-4 w-4" />
                                معاينة الصفحة
                            </Link>
                        )}
                    </motion.div>

                    <div className="space-y-6">
                        {/* Cover & Avatar Section */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden"
                        >
                            {/* 
                                Cover Image
                                - نسبة 2.5:1 (عرض:ارتفاع)
                                - حد أدنى 160px وحد أقصى 300px
                            */}
                            <div
                                className="relative w-full bg-gradient-to-br from-primary-400 to-pink-400 overflow-hidden"
                                style={{
                                    aspectRatio: '2.5/1',
                                    minHeight: '160px',
                                    maxHeight: '300px'
                                }}
                            >
                                {formData.cover_image_url && (
                                    <img
                                        src={formData.cover_image_url}
                                        alt="Cover"
                                        className="absolute inset-0 w-full h-full object-cover object-center"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                )}
                                {/* زر تغيير الغلاف */}
                                <label className="absolute bottom-4 left-4 z-10 flex items-center gap-2 px-4 py-2 rounded-xl bg-black/50 text-white text-sm font-medium cursor-pointer hover:bg-black/70 transition-colors backdrop-blur-sm">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleImageSelect(e, 'cover')}
                                        className="hidden"
                                    />
                                    {isUploadingCover ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Camera className="h-4 w-4" />
                                    )}
                                    تغيير صورة الغلاف
                                </label>
                            </div>

                            {/* Avatar & Form Section */}
                            <div className="px-6 pb-6">
                                <div className="flex gap-6">
                                    {/* Avatar - على اليمين، يخرج من الغلاف */}
                                    <div className="relative shrink-0 -mt-16">
                                        <div className="w-32 h-32 rounded-full bg-white dark:bg-[#1c1c24] p-1 shadow-xl ring-4 ring-white dark:ring-[#1c1c24]">
                                            <div className="w-full h-full rounded-full overflow-hidden">
                                                <Avatar
                                                    src={formData.avatar_url}
                                                    name={formData.name}
                                                    size="2xl"
                                                    rounded="full"
                                                    showIcon={!formData.name}
                                                    customGradient="from-primary-500 to-pink-500"
                                                    containerClassName="!w-full !h-full !rounded-full"
                                                />
                                            </div>
                                        </div>
                                        {/* زر تغيير الصورة الشخصية */}
                                        <label className="absolute bottom-0 right-0 p-2.5 rounded-full bg-primary-500 text-white cursor-pointer hover:bg-primary-600 transition-colors shadow-lg ring-2 ring-white dark:ring-[#1c1c24]">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleImageSelect(e, 'avatar')}
                                                className="hidden"
                                            />
                                            {isUploadingAvatar ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Camera className="h-4 w-4" />
                                            )}
                                        </label>
                                    </div>

                                    {/* Name & Title - بجانب الـ Avatar */}
                                    <div className="flex-1 pt-4 space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                الاسم
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                اللقب المهني
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.teacher_title}
                                                onChange={(e) => setFormData(prev => ({ ...prev, teacher_title: e.target.value }))}
                                                placeholder="مثال: أستاذ أول لغة عربية"
                                                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Visibility Toggle */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    {formData.is_teacher_profile_public ? (
                                        <Eye className="h-6 w-6 text-green-500" />
                                    ) : (
                                        <EyeOff className="h-6 w-6 text-gray-400" />
                                    )}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            ظهور الملف الشخصي
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {formData.is_teacher_profile_public
                                                ? 'ملفك ظاهر للطلاب ويمكنهم الاشتراك معك'
                                                : 'ملفك مخفي ولن يظهر في قائمة المدرسين'
                                            }
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setFormData(prev => ({
                                        ...prev,
                                        is_teacher_profile_public: !prev.is_teacher_profile_public
                                    }))}
                                    className={`relative w-14 h-8 rounded-full transition-colors ${formData.is_teacher_profile_public
                                        ? 'bg-green-500'
                                        : 'bg-gray-300 dark:bg-gray-600'
                                        }`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${formData.is_teacher_profile_public ? 'right-1' : 'left-1'
                                        }`} />
                                </button>
                            </div>
                        </motion.div>

                        {/* Bio & Specialization */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 p-6 space-y-6"
                        >
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-primary-500" />
                                معلومات تعريفية
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    نبذة عنك
                                </label>
                                <textarea
                                    value={formData.bio}
                                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                    rows={4}
                                    placeholder="اكتب نبذة مختصرة عن نفسك وخبراتك..."
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        التخصص
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.specialization}
                                        onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                                        placeholder="مثال: اللغة العربية"
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        سنوات الخبرة
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.years_of_experience}
                                        onChange={(e) => setFormData(prev => ({ ...prev, years_of_experience: parseInt(e.target.value) || 0 }))}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    المؤهل العلمي
                                </label>
                                <input
                                    type="text"
                                    value={formData.education}
                                    onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                                    placeholder="مثال: ليسانس آداب - قسم اللغة العربية"
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    أسلوب التدريس
                                </label>
                                <textarea
                                    value={formData.teaching_style}
                                    onChange={(e) => setFormData(prev => ({ ...prev, teaching_style: e.target.value }))}
                                    rows={3}
                                    placeholder="صف أسلوبك في التدريس..."
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 resize-none"
                                />
                            </div>
                        </motion.div>

                        {/* المادة والصفوف الدراسية */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 p-6 space-y-6"
                        >
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <GraduationCap className="h-5 w-5 text-primary-500" />
                                المادة والصفوف الدراسية
                            </h3>

                            {/* المادة - اختيار واحد فقط */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    المادة التي تدرسها
                                </label>
                                <select
                                    value={formData.subjects[0] || ''}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        subjects: e.target.value ? [e.target.value] : []
                                    }))}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                >
                                    <option value="">اختر المادة</option>
                                    {availableSubjects.map((subject) => (
                                        <option key={subject.id} value={subject.name}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* الصفوف الدراسية - متعدد */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    الصفوف التي تدرسها
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {availableStages.map((stage) => (
                                        <label
                                            key={stage.id}
                                            className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${formData.stages.includes(stage.name)
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.stages.includes(stage.name)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setFormData(prev => ({ ...prev, stages: [...prev.stages, stage.name] }));
                                                    } else {
                                                        setFormData(prev => ({ ...prev, stages: prev.stages.filter(s => s !== stage.name) }));
                                                    }
                                                }}
                                                className="hidden"
                                            />
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${formData.stages.includes(stage.name)
                                                ? 'bg-primary-500 border-primary-500'
                                                : 'border-gray-300 dark:border-gray-600'
                                                }`}>
                                                {formData.stages.includes(stage.name) && (
                                                    <Check className="w-3 h-3 text-white" />
                                                )}
                                            </div>
                                            <span className="text-sm">{stage.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Contact Info */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25 }}
                            className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 p-6 space-y-6"
                        >
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Phone className="h-5 w-5 text-primary-500" />
                                معلومات التواصل
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        رقم الهاتف (للاتصال)
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="01XXXXXXXXX"
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                        dir="ltr"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        رقم الواتساب
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.whatsapp}
                                        onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                                        placeholder="201XXXXXXXXX"
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                        dir="ltr"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">أدخل الرقم بالكود الدولي (مثال: 201001234567)</p>
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        الموقع الإلكتروني
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.website}
                                        onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                                        placeholder="https://..."
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Social Links */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 p-6 space-y-6"
                        >
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <LinkIcon className="h-5 w-5 text-primary-500" />
                                روابط التواصل الاجتماعي
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* YouTube */}
                                <div className="relative">
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="url"
                                        value={(formData.social_links as any)?.youtube || ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            social_links: { ...prev.social_links, youtube: e.target.value }
                                        }))}
                                        placeholder="رابط YouTube"
                                        className="w-full pr-12 pl-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                        dir="ltr"
                                    />
                                </div>

                                {/* Facebook */}
                                <div className="relative">
                                    <Facebook className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-600" />
                                    <input
                                        type="url"
                                        value={(formData.social_links as any)?.facebook || ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            social_links: { ...prev.social_links, facebook: e.target.value }
                                        }))}
                                        placeholder="رابط Facebook"
                                        className="w-full pr-12 pl-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                        dir="ltr"
                                    />
                                </div>

                                {/* TikTok */}
                                <div className="relative">
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                        <svg className="h-5 w-5 text-gray-800 dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="url"
                                        value={(formData.social_links as any)?.tiktok || ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            social_links: { ...prev.social_links, tiktok: e.target.value }
                                        }))}
                                        placeholder="رابط TikTok"
                                        className="w-full pr-12 pl-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                        dir="ltr"
                                    />
                                </div>

                                {/* Instagram */}
                                <div className="relative">
                                    <Instagram className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-pink-500" />
                                    <input
                                        type="url"
                                        value={(formData.social_links as any)?.instagram || ''}
                                        onChange={(e) => setFormData(prev => ({
                                            ...prev,
                                            social_links: { ...prev.social_links, instagram: e.target.value }
                                        }))}
                                        placeholder="رابط Instagram"
                                        className="w-full pr-12 pl-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                                        dir="ltr"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Save Button */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-pink-500 hover:from-primary-600 hover:to-pink-600 text-white font-semibold shadow-lg shadow-primary-500/25 transition-all disabled:opacity-50"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        جاري الحفظ...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5" />
                                        حفظ التغييرات
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </div>
                </main >
            </div >
            <Footer />

            {/* Image Cropper Modal */}
            {cropperImage && (
                <ImageCropper
                    imageFile={cropperImage}
                    aspectRatio={cropperType === 'avatar' ? 1 : 2.5}
                    maxWidth={cropperType === 'avatar' ? 256 : 1200}
                    maxSizeMB={cropperType === 'avatar' ? 0.3 : 0.8}
                    title={cropperType === 'avatar' ? 'قص صورة الملف الشخصي (256×256)' : 'قص صورة الغلاف (1200×480)'}
                    onCancel={() => setCropperImage(null)}
                    onComplete={handleCroppedImageUpload}
                />
            )}
        </>
    );
}
