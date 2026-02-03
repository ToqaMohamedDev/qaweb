"use client";

// =============================================
// Onboarding Page - Production Ready (v2)
// Fixed: Uses auth store instead of getUser() to avoid Vercel hang
// =============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    GraduationCap,
    BookOpen,
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    Users,
    Trophy,
    User,
    School,
    Loader2
} from "lucide-react";
import { Button } from "@/components";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { updateUserRoleAction } from "@/lib/actions/update-user-role";
import { getEducationalStagesAction } from "@/lib/actions/get-educational-stages";

type SelectedRole = 'student' | 'teacher' | null;
type OnboardingStep = 'name' | 'role' | 'stage';

interface EducationalStage {
    id: string;
    name: string;
    slug: string;
}

export default function OnboardingPage() {
    // Get user from auth store (already loaded by AuthProvider - avoids getUser() hang on Vercel)
    const { user: authUser } = useAuthStore();

    // State
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('name');
    const [userName, setUserName] = useState('');
    const [selectedRole, setSelectedRole] = useState<SelectedRole>(null);
    const [selectedStageId, setSelectedStageId] = useState<string>('');
    const [stages, setStages] = useState<EducationalStage[]>([]);

    // Status State
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingStages, setIsLoadingStages] = useState(false);
    const [error, setError] = useState("");

    // جلب المراحل الدراسية مع retry mechanism
    useEffect(() => {
        let retryCount = 0;
        const maxRetries = 2;
        
        const fetchStages = async () => {
            setIsLoadingStages(true);
            console.log('[Onboarding] Fetching educational stages...');
            
            try {
                const data = await getEducationalStagesAction();
                
                if (data && data.length > 0) {
                    setStages(data);
                    console.log(`[Onboarding] ✓ Loaded ${data.length} stages`);
                } else if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`[Onboarding] No stages returned, retrying (${retryCount}/${maxRetries})...`);
                    setTimeout(fetchStages, 1500);
                    return;
                } else {
                    console.warn('[Onboarding] Could not load stages after retries');
                }
            } catch (err) {
                console.error('[Onboarding] Error fetching stages:', err);
                
                if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`[Onboarding] Retrying (${retryCount}/${maxRetries})...`);
                    setTimeout(fetchStages, 1500);
                    return;
                }
            } finally {
                setIsLoadingStages(false);
            }
        };
        
        fetchStages();
    }, []);

    // Pre-fill user data from auth store
    useEffect(() => {
        if (authUser) {
            // Pre-fill name if available
            if (authUser.name && !userName) {
                setUserName(authUser.name);
            }
        }
    }, [authUser, userName]);

    // Navigation Handlers
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
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (currentStep === 'role') {
            if (!selectedRole) {
                setError("يرجى اختيار نوع الحساب");
                return;
            }
            if (stages.length === 0 && !isLoadingStages) {
                // If no stages available, allow completion immediately
                handleComplete();
            } else {
                setCurrentStep('stage');
                window.scrollTo({ top: 0, behavior: 'smooth' });
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
        if (stages.length > 0 && !selectedStageId) {
            setError("يرجى اختيار المرحلة الدراسية");
            return;
        }

        // Use authUser from store instead of calling getUser() - this fixes Vercel hang
        if (!authUser?.id) {
            setError("لم يتم العثور على المستخدم. يرجى إعادة تحميل الصفحة.");
            console.error('[Onboarding] No user in auth store');
            return;
        }

        setIsLoading(true);
        setError("");
        console.log('[Onboarding] Starting completion for user:', authUser.id);

        try {
            console.log('[Onboarding] Calling updateUserRoleAction...');

            const result = await updateUserRoleAction({
                userId: authUser.id,
                role: selectedRole!,
                email: authUser.email || '',
                name: userName.trim(),
                avatarUrl: authUser.avatarUrl || undefined,
                educationalStageId: selectedStageId,
            });

            console.log('[Onboarding] Action result:', result);

            if (!result.success) {
                throw new Error(result.error || 'فشل في حفظ البيانات');
            }

            console.log('[Onboarding] Success! Redirecting...');

            // Redirect immediately - no artificial delay needed
            const targetUrl = selectedRole === 'teacher' ? "/teacher?welcome=true" : "/?welcome=true";
            window.location.href = targetUrl;

        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
            console.error('[Onboarding] Error:', msg);
            setError(msg);
            setIsLoading(false);
        }
    };

    const roleOptions = [
        {
            value: 'student' as const,
            label: "طالب",
            icon: GraduationCap,
            description: "أريد التعلم والمشاركة في الاختبارات",
            features: [
                { icon: Trophy, text: "المشاركة في المسابقات" },
                { icon: BookOpen, text: "الوصول لجميع الدروس" },
            ],
            color: "from-blue-500 to-indigo-600",
            bgColor: "bg-blue-50 dark:bg-blue-900/20",
            borderColor: "border-blue-500",
        },
        {
            value: 'teacher' as const,
            label: "مدرس",
            icon: BookOpen,
            description: "أريد إنشاء المحتوى وبناء قاعدة طلاب",
            features: [
                { icon: BookOpen, text: "إنشاء الامتحانات" },
                { icon: Users, text: "بناء قاعدة مشتركين" },
            ],
            color: "from-purple-500 to-pink-600",
            bgColor: "bg-purple-50 dark:bg-purple-900/20",
            borderColor: "border-purple-500",
            note: "يتطلب موافقة الإدارة",
        },
    ];

    const stepTitles = {
        name: { title: "مرحباً بك! 👋", subtitle: "عرفنا بنفسك" },
        role: { title: "اختر نوع حسابك", subtitle: "طالب أم مدرس؟" },
        stage: { title: "المرحلة الدراسية", subtitle: "اختر مرحلتك" },
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0f] flex flex-col pt-8" dir="rtl">
            <main className="flex-1 flex flex-col items-center p-4 pb-40 max-w-2xl mx-auto w-full">
                {/* Progress Steps */}
                <div className="flex items-center gap-2 mb-8 w-full justify-center">
                    {(['name', 'role', 'stage'] as OnboardingStep[]).map((step, index) => (
                        <div key={step} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${currentStep === step
                                ? 'bg-primary-500 text-white shadow-lg'
                                : index < ['name', 'role', 'stage'].indexOf(currentStep)
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                                }`}>
                                {index < ['name', 'role', 'stage'].indexOf(currentStep) ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                            </div>
                            {index < 2 && (
                                <div className={`w-8 h-1 mx-1 rounded ${index < ['name', 'role', 'stage'].indexOf(currentStep) ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-800'
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Header */}
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{stepTitles[currentStep].title}</h1>
                    <p className="text-gray-500 dark:text-gray-400">{stepTitles[currentStep].subtitle}</p>
                </div>

                {/* Error */}
                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="w-full mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm flex items-center gap-2 border border-red-200 dark:border-red-800">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {/* Step 1: Name */}
                    {currentStep === 'name' && (
                        <motion.div key="name" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full">
                            <div className="relative">
                                <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    placeholder="أدخل اسمك هنا"
                                    className="w-full pr-12 pl-4 py-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all dark:text-white"
                                    autoFocus
                                />
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Role Selection */}
                    {currentStep === 'role' && (
                        <motion.div key="role" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full space-y-3">
                            {roleOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => { setSelectedRole(option.value); setError(""); }}
                                    className={`w-full p-4 rounded-xl border-2 transition-all flex items-start gap-4 text-right relative overflow-hidden ${selectedRole === option.value
                                        ? `${option.borderColor} ${option.bgColor}`
                                        : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
                                        }`}
                                >
                                    <div className={`p-3 rounded-lg bg-gradient-to-br ${option.color} text-white shadow-lg`}>
                                        <option.icon className="h-6 w-6" />
                                    </div>
                                    <div className="flex-1 z-10">
                                        <h3 className="font-bold text-gray-900 dark:text-white mb-1">{option.label}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{option.description}</p>
                                    </div>
                                    {selectedRole === option.value && (
                                        <div className="absolute top-4 left-4 text-primary-600 dark:text-primary-400">
                                            <CheckCircle2 className="h-6 w-6" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </motion.div>
                    )}

                    {/* Step 3: Stage Selection */}
                    {currentStep === 'stage' && (
                        <motion.div key="stage" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="w-full">
                            {isLoadingStages ? (
                                <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>
                            ) : (
                                <div className="grid gap-3">
                                    {stages.map((stage) => (
                                        <button
                                            key={stage.id}
                                            onClick={() => setSelectedStageId(stage.id)}
                                            className={`w-full p-4 rounded-xl border transition-all flex items-center gap-3 ${selectedStageId === stage.id
                                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                                : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
                                                }`}
                                        >
                                            <School className="h-5 w-5 text-gray-500" />
                                            <span className="flex-1 text-right font-medium dark:text-white">{stage.name}</span>
                                            {selectedStageId === stage.id && <CheckCircle2 className="h-5 w-5 text-primary-500" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Sticky Action Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 dark:bg-[#0a0a0f]/90 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-50 safe-area-bottom">
                <div className="max-w-2xl mx-auto flex gap-3">
                    {currentStep !== 'name' && (
                        <Button onClick={handlePrevStep} variant="outline" className="flex-1 py-6 text-lg rounded-xl">
                            رجوع
                        </Button>
                    )}

                    {currentStep !== 'stage' ? (
                        <Button
                            onClick={handleNextStep}
                            disabled={currentStep === 'role' && !selectedRole}
                            className="flex-[2] py-6 text-lg font-bold rounded-xl"
                        >
                            تأكيد واختيار
                            <ArrowLeft className="h-5 w-5 mr-2" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleComplete}
                            isLoading={isLoading}
                            disabled={!selectedStageId || isLoading}
                            className="flex-[2] py-6 text-lg font-bold bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl"
                        >
                            <Sparkles className="h-5 w-5 ml-2" />
                            ابدأ رحلتك
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
