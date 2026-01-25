"use client";

// =============================================
// Onboarding Page - صفحة اختيار الدور والمرحلة للمستخدمين الجدد
// =============================================

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    GraduationCap,
    BookOpen,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    Users,
    Trophy,
    Clock,
    User,
    School,
    Loader2
} from "lucide-react";
import { Button, Navbar, Footer } from "@/components";
import { createClient } from "@/lib/supabase";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { updateUserRoleAction } from "@/lib/actions/update-user-role";

type SelectedRole = 'student' | 'teacher' | null;
type OnboardingStep = 'name' | 'role' | 'stage';

interface EducationalStage {
    id: string;
    name: string;
    slug: string;
}

export default function OnboardingPage() {
    const router = useRouter();
    const { refreshUser, user } = useAuthStore();
    
    // State
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('name');
    const [userName, setUserName] = useState('');
    const [selectedRole, setSelectedRole] = useState<SelectedRole>(null);
    const [selectedStageId, setSelectedStageId] = useState<string>('');
    const [stages, setStages] = useState<EducationalStage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingStages, setIsLoadingStages] = useState(false);
    const [error, setError] = useState("");

    // جلب المراحل الدراسية
    useEffect(() => {
        const fetchStages = async () => {
            setIsLoadingStages(true);
            try {
                const supabase = createClient();
                // جلب كل المراحل (بدون فلترة is_active لأنها قد تكون null)
                const { data, error } = await supabase
                    .from('educational_stages')
                    .select('id, name, slug')
                    .order('order_index', { ascending: true });
                
                if (error) {
                    console.error('Error fetching stages:', error);
                } else if (data && data.length > 0) {
                    setStages(data);
                } else {
                    console.warn('No educational stages found in database');
                }
            } catch (err) {
                console.error('Error fetching stages:', err);
            } finally {
                setIsLoadingStages(false);
            }
        };
        fetchStages();
    }, []);

    // جلب الاسم والدور والمرحلة من بيانات المستخدم إن وجد (من صفحة signup)
    // وتخطي الخطوات المكتملة أو إكمال التسجيل مباشرة إذا كانت كل البيانات موجودة
    useEffect(() => {
        const fetchUserData = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.user_metadata) {
                const hasName = user.user_metadata.name || user.user_metadata.full_name;
                const hasRole = user.user_metadata.role && ['student', 'teacher'].includes(user.user_metadata.role);
                const hasStage = user.user_metadata.educational_stage_id;
                
                // جلب الاسم
                if (hasName) {
                    setUserName(user.user_metadata.name || user.user_metadata.full_name);
                }
                // جلب الدور إذا كان موجوداً (من صفحة signup)
                if (hasRole) {
                    setSelectedRole(user.user_metadata.role as 'student' | 'teacher');
                }
                // جلب المرحلة إذا كانت موجودة
                if (hasStage) {
                    setSelectedStageId(user.user_metadata.educational_stage_id);
                }
                
                // إذا كانت كل البيانات موجودة، أكمل التسجيل مباشرة
                if (hasName && hasRole && hasStage) {
                    // استدعاء handleComplete مباشرة
                    const completeOnboarding = async () => {
                        setIsLoading(true);
                        try {
                            const result = await updateUserRoleAction({
                                userId: user.id,
                                role: user.user_metadata.role,
                                email: user.email || '',
                                name: user.user_metadata.name || user.user_metadata.full_name,
                                avatarUrl: user.user_metadata?.avatar_url,
                                educationalStageId: user.user_metadata.educational_stage_id,
                            });

                            if (result.success) {
                                await refreshUser();
                                if (user.user_metadata.role === 'teacher') {
                                    router.push('/teacher');
                                } else {
                                    router.push('/');
                                }
                            }
                        } catch (err) {
                            console.error('Auto-complete onboarding error:', err);
                        }
                    };
                    completeOnboarding();
                } else if (hasName && hasRole) {
                    // إذا كان الاسم والدور موجودين فقط، انتقل لخطوة المرحلة
                    setCurrentStep('stage');
                } else if (hasName) {
                    setCurrentStep('role');
                }
            }
        };
        fetchUserData();
    }, [router, refreshUser]);

    // إذا كان المستخدم قد اختار دوره بالفعل، قم بإعادة توجيهه
    useEffect(() => {
        if (user && user.roleSelected) {
            if (user.role === 'admin') {
                router.replace('/admin');
            } else if (user.role === 'teacher') {
                router.replace('/teacher');
            } else {
                router.replace('/');
            }
        }
    }, [user, router]);

    const handleNextStep = () => {
        setError("");
        
        if (currentStep === 'name') {
            if (!userName.trim()) {
                setError("يرجى إدخال اسمك");
                return;
            }
            if (userName.trim().length < 2) {
                setError("الاسم يجب أن يكون حرفين على الأقل");
                return;
            }
            setCurrentStep('role');
        } else if (currentStep === 'role') {
            if (!selectedRole) {
                setError("يرجى اختيار نوع الحساب");
                return;
            }
            // إذا لم توجد مراحل، أكمل التسجيل مباشرة
            if (stages.length === 0) {
                handleComplete();
            } else {
                setCurrentStep('stage');
            }
        }
    };

    const handlePrevStep = () => {
        setError("");
        if (currentStep === 'role') {
            setCurrentStep('name');
        } else if (currentStep === 'stage') {
            setCurrentStep('role');
        }
    };

    const handleComplete = async () => {
        // المرحلة اختيارية إذا لم توجد مراحل في قاعدة البيانات
        if (stages.length > 0 && !selectedStageId) {
            setError("يرجى اختيار المرحلة الدراسية");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("لم يتم العثور على المستخدم");
            }

            const result = await updateUserRoleAction({
                userId: user.id,
                role: selectedRole!,
                email: user.email || '',
                name: userName.trim(),
                avatarUrl: user.user_metadata?.avatar_url,
                educationalStageId: selectedStageId,
            });

            if (!result.success) {
                throw new Error(result.error || 'فشل في حفظ البيانات');
            }

            await refreshUser();

            if (selectedRole === 'teacher') {
                router.push("/profile?tab=settings&welcome=teacher");
            } else {
                router.push("/?welcome=true");
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "حدث خطأ أثناء حفظ الاختيار";
            console.error('Onboarding error:', err);
            setError(errorMessage);
            setIsLoading(false);
        }
    };

    const roleOptions = [
        {
            value: 'student' as const,
            label: "طالب",
            icon: GraduationCap,
            description: "أريد التعلم والمشاركة في الاختبارات والمسابقات",
            features: [
                { icon: Trophy, text: "المشاركة في Quiz Battle" },
                { icon: BookOpen, text: "الوصول لجميع الدروس والاختبارات" },
                { icon: Users, text: "متابعة المدرسين المفضلين" },
            ],
            color: "from-blue-500 to-indigo-600",
            bgColor: "bg-blue-50 dark:bg-blue-900/20",
            borderColor: "border-blue-500",
        },
        {
            value: 'teacher' as const,
            label: "مدرس",
            icon: BookOpen,
            description: "أريد إنشاء المحتوى والاختبارات وبناء قاعدة طلاب",
            features: [
                { icon: BookOpen, text: "إنشاء الامتحانات والأسئلة" },
                { icon: Users, text: "بناء قاعدة مشتركين" },
                { icon: Clock, text: "يتطلب موافقة الإدارة" },
            ],
            color: "from-purple-500 to-pink-600",
            bgColor: "bg-purple-50 dark:bg-purple-900/20",
            borderColor: "border-purple-500",
            note: "ملاحظة: ستحتاج موافقة الإدارة لتفعيل صلاحيات المدرس",
        },
    ];

    // Step titles
    const stepTitles = {
        name: { title: "مرحباً بك في QAlaa! 🎉", subtitle: "أخبرنا باسمك" },
        role: { title: "اختر نوع حسابك", subtitle: "هل أنت طالب أم مدرس؟" },
        stage: { title: "اختر مرحلتك الدراسية", subtitle: "سيتم عرض المحتوى المناسب لك" },
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-[#0a0a0f] dark:via-[#121218] dark:to-[#0a0a0f] flex flex-col" dir="rtl">
            {/* Background decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary-200/20 dark:bg-primary-900/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 left-0 w-[400px] h-[400px] bg-primary-300/15 dark:bg-primary-800/10 rounded-full blur-[80px]" />
            </div>

            <Navbar />

            <main className="flex-1 flex items-center justify-center p-4 py-8 sm:py-12 relative z-10">
                <div className="w-full max-w-2xl">
                    {/* Progress Steps */}
                    <div className="flex items-center justify-center gap-2 mb-8">
                        {(['name', 'role', 'stage'] as OnboardingStep[]).map((step, index) => (
                            <div key={step} className="flex items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                                    currentStep === step 
                                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
                                        : index < ['name', 'role', 'stage'].indexOf(currentStep)
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                                }`}>
                                    {index < ['name', 'role', 'stage'].indexOf(currentStep) ? (
                                        <CheckCircle2 className="h-5 w-5" />
                                    ) : (
                                        index + 1
                                    )}
                                </div>
                                {index < 2 && (
                                    <div className={`w-12 h-1 mx-1 rounded ${
                                        index < ['name', 'role', 'stage'].indexOf(currentStep)
                                            ? 'bg-green-500'
                                            : 'bg-gray-200 dark:bg-gray-700'
                                    }`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Header */}
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-8"
                    >
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1, duration: 0.4 }}
                            className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-xl shadow-primary-500/30 mb-5"
                        >
                            {currentStep === 'name' && <User className="h-8 w-8 text-white" />}
                            {currentStep === 'role' && <Sparkles className="h-8 w-8 text-white" />}
                            {currentStep === 'stage' && <School className="h-8 w-8 text-white" />}
                        </motion.div>

                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
                            {stepTitles[currentStep].title}
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                            {stepTitles[currentStep].subtitle}
                        </p>
                    </motion.div>

                    {/* Error Alert */}
                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                exit={{ opacity: 0, y: -10, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mb-5 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 flex items-start gap-3"
                            >
                                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700 dark:text-red-300 flex-1">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Step Content */}
                    <AnimatePresence mode="wait">
                        {/* Step 1: Name */}
                        {currentStep === 'name' && (
                            <motion.div
                                key="name-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-gray-800 p-6"
                            >
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    اسمك الكامل
                                </label>
                                <div className="relative">
                                    <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={userName}
                                        onChange={(e) => setUserName(e.target.value)}
                                        placeholder="أدخل اسمك هنا"
                                        className="w-full pr-12 pl-4 py-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all text-gray-900 dark:text-white text-lg"
                                        autoFocus
                                    />
                                </div>
                            </motion.div>
                        )}

                        {/* Step 2: Role Selection */}
                        {currentStep === 'role' && (
                            <motion.div
                                key="role-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="grid gap-4 sm:gap-6"
                            >
                                {roleOptions.map((option, index) => {
                                    const Icon = option.icon;
                                    const isSelected = selectedRole === option.value;

                                    return (
                                        <motion.button
                                            key={option.value}
                                            type="button"
                                            onClick={() => {
                                                setSelectedRole(option.value);
                                                setError("");
                                            }}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1, duration: 0.3 }}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            className={`relative w-full p-5 sm:p-6 rounded-2xl border-2 transition-all duration-300 text-right ${isSelected
                                                ? `${option.borderColor} ${option.bgColor} shadow-lg`
                                                : "border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] hover:border-gray-300 dark:hover:border-[#3e3e4a] hover:shadow-md"
                                            }`}
                                        >
                                            {isSelected && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="absolute top-4 left-4"
                                                >
                                                    <div className={`p-1 rounded-full bg-gradient-to-r ${option.color}`}>
                                                        <CheckCircle2 className="h-5 w-5 text-white" />
                                                    </div>
                                                </motion.div>
                                            )}

                                            <div className="flex items-start gap-4">
                                                <div className={`p-3 rounded-xl bg-gradient-to-br ${option.color} shadow-lg shrink-0`}>
                                                    <Icon className="h-6 w-6 text-white" />
                                                </div>

                                                <div className="flex-1">
                                                    <h3 className={`text-lg sm:text-xl font-bold mb-1 ${isSelected
                                                        ? "text-gray-900 dark:text-white"
                                                        : "text-gray-700 dark:text-gray-300"
                                                    }`}>
                                                        {option.label}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                                        {option.description}
                                                    </p>

                                                    <div className="space-y-2">
                                                        {option.features.map((feature, i) => {
                                                            const FeatureIcon = feature.icon;
                                                            return (
                                                                <div key={i} className="flex items-center gap-2 text-sm">
                                                                    <FeatureIcon className={`h-4 w-4 ${isSelected
                                                                        ? "text-primary-600 dark:text-primary-400"
                                                                        : "text-gray-400"
                                                                    }`} />
                                                                    <span className={isSelected
                                                                        ? "text-gray-700 dark:text-gray-300"
                                                                        : "text-gray-500 dark:text-gray-400"
                                                                    }>
                                                                        {feature.text}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>

                                                    {option.note && (
                                                        <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                                                            ⚠️ {option.note}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </motion.div>
                        )}

                        {/* Step 3: Educational Stage */}
                        {currentStep === 'stage' && (
                            <motion.div
                                key="stage-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-gray-800 p-6"
                            >
                                {isLoadingStages ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                                    </div>
                                ) : stages.length === 0 ? (
                                    <div className="text-center py-8">
                                        <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                                        <p className="text-gray-600 dark:text-gray-400 mb-2">
                                            لا توجد مراحل دراسية متاحة حالياً
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            يرجى التواصل مع الإدارة لإضافة المراحل الدراسية
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3">
                                        {stages.map((stage, index) => (
                                            <motion.button
                                                key={stage.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedStageId(stage.id);
                                                    setError("");
                                                }}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className={`w-full p-4 rounded-xl border-2 transition-all text-right flex items-center gap-3 ${
                                                    selectedStageId === stage.id
                                                        ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                                                }`}
                                            >
                                                <div className={`p-2 rounded-lg ${
                                                    selectedStageId === stage.id
                                                        ? "bg-primary-500 text-white"
                                                        : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                                                }`}>
                                                    <School className="h-5 w-5" />
                                                </div>
                                                <span className={`font-medium flex-1 ${
                                                    selectedStageId === stage.id
                                                        ? "text-gray-900 dark:text-white"
                                                        : "text-gray-700 dark:text-gray-300"
                                                }`}>
                                                    {stage.name}
                                                </span>
                                                {selectedStageId === stage.id && (
                                                    <CheckCircle2 className="h-5 w-5 text-primary-500" />
                                                )}
                                            </motion.button>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                        className="mt-8 flex gap-3"
                    >
                        {currentStep !== 'name' && (
                            <Button
                                onClick={handlePrevStep}
                                variant="outline"
                                className="py-4"
                            >
                                <ArrowRight className="h-5 w-5 ml-2" />
                                <span>رجوع</span>
                            </Button>
                        )}
                        
                        {currentStep !== 'stage' ? (
                            <Button
                                onClick={handleNextStep}
                                fullWidth
                                className="py-4"
                            >
                                <span>التالي</span>
                                <ArrowLeft className="h-5 w-5 mr-2" />
                            </Button>
                        ) : (
                            <Button
                                onClick={handleComplete}
                                fullWidth
                                isLoading={isLoading}
                                disabled={!selectedStageId || isLoading}
                                className="py-4"
                            >
                                <span>ابدأ الآن</span>
                                <Sparkles className="h-5 w-5 mr-2" />
                            </Button>
                        )}
                    </motion.div>

                    {/* Info */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400"
                    >
                        يمكنك تغيير إعداداتك لاحقاً من الملف الشخصي
                    </motion.p>
                </div>
            </main>

            <Footer />
        </div>
    );
}
