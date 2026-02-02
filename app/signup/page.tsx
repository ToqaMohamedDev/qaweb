"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Mail, User, UserPlus, School } from "lucide-react";
import { Input, Button } from "@/components";
import { signUpWithEmail, signInWithGoogle } from "@/lib/supabase";
import type { UserRole } from "@/lib/database.types";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { useFormValidation, rules } from "@/hooks/useFormValidation";
import { authMessages, formLabels, placeholders } from "@/lib/constants/messages";

// Auth Components
import {
    AuthLayout,
    AuthHeader,
    AuthCard,
    AuthAlert,
    AuthDivider,
    AuthFooterLink,
    GoogleAuthButton,
    PasswordInput,
    PasswordStrengthIndicator,
    RoleSelector,
} from "@/components/auth";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface SignUpFormData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    role: UserRole;
    educationalStageId: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function SignUpPage() {
    const router = useRouter();
    const { refreshUser } = useAuthStore();

    // Form state with validation
    const {
        values: formData,
        errors,
        setFieldValue,
        validateForm,
        passwordRequirements,
        passwordStrength,
    } = useFormValidation<SignUpFormData>({
        initialValues: {
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            role: "student" as UserRole,
            educationalStageId: "",
        },
        validators: {
            name: [rules.required('name'), rules.minLength(2, 'الاسم')],
            email: [rules.required('email'), rules.email()],
            password: [rules.required('password'), rules.password(6)],
            confirmPassword: [rules.required('confirmPassword'), rules.match('password', 'password')],
            educationalStageId: [(value: string) => !value ? 'يرجى اختيار المرحلة الدراسية' : ''],
        },
    });

    // UI State
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [stages, setStages] = useState<Array<{ id: string; name: string }>>([]);
    const [isLoadingStages, setIsLoadingStages] = useState(true);

    // ═══════════════════════════════════════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════════════════════════════════════

    // جلب المراحل الدراسية - استخدام API بدل client-side Supabase للتوافق مع الموبايل
    useEffect(() => {
        const fetchStages = async () => {
            try {
                // استخدام API route بدل Supabase client مباشرة
                // لأن الـ client-side Supabase بيفشل على بعض المتصفحات الموبايل
                const response = await fetch('/api/public/data?entity=stages');

                if (response.ok) {
                    const result = await response.json();
                    if (result.data && Array.isArray(result.data)) {
                        setStages(result.data.map((s: { id: string; name: string }) => ({
                            id: s.id,
                            name: s.name
                        })));
                    }
                }
            } catch (err) {
                console.error('Error fetching stages:', err);
            } finally {
                setIsLoadingStages(false);
            }
        };
        fetchStages();
    }, []);

    // ═══════════════════════════════════════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) return;

        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            await signUpWithEmail({
                email: formData.email,
                password: formData.password,
                name: formData.name,
                role: formData.role,
                educationalStageId: formData.educationalStageId
            });

            // تحديث حالة المستخدم في التطبيق
            await refreshUser();

            // توجيه المستخدم
            // ننتظر قليلاً للتأكد من أن التريجر قد عمل (اختياري، لكن آمن)
            // في الواقع، بمجرد نجاح signUp، المستخدم موجود.

            if (formData.role === 'teacher') {
                router.push('/teacher');
            } else {
                router.push('/');
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : '';

            if (errorMessage.includes("User already registered")) {
                setError(authMessages.errors.userExists);
            } else if (errorMessage.includes("Password should be")) {
                setError(authMessages.errors.weakPassword);
            } else {
                setError(errorMessage || authMessages.errors.signupError);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        setError("");

        try {
            await signInWithGoogle();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : '';
            setError(errorMessage || authMessages.errors.googleError);
            setGoogleLoading(false);
        }
    };

    // ═══════════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════════

    return (
        <AuthLayout>
            {/* Header */}
            <AuthHeader
                icon={UserPlus}
                title={authMessages.signup.title}
                subtitle={authMessages.signup.subtitle}
            />

            {/* Form Card */}
            <AuthCard>
                {/* Alerts */}
                {error && <AuthAlert type="error" message={error} />}
                {success && <AuthAlert type="success" message={success} />}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-4">
                        {/* Role Selector */}
                        <RoleSelector
                            selectedRole={formData.role}
                            onRoleSelect={(role: UserRole) => setFieldValue('role', role)}
                        />

                        {/* Name Input */}
                        <Input
                            type="text"
                            label={formLabels.name}
                            placeholder={placeholders.name}
                            value={formData.name}
                            onChange={(e) => setFieldValue('name', e.target.value)}
                            error={errors.name}
                            icon={<User className="h-5 w-5" />}
                            autoComplete="name"
                        />

                        {/* Email Input */}
                        <Input
                            type="email"
                            label={formLabels.email}
                            placeholder={placeholders.email}
                            value={formData.email}
                            onChange={(e) => setFieldValue('email', e.target.value)}
                            error={errors.email}
                            icon={<Mail className="h-5 w-5" />}
                            dir="ltr"
                            autoComplete="email"
                        />

                        {/* Password Input */}
                        <PasswordInput
                            label={formLabels.password}
                            value={formData.password}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('password', e.target.value)}
                            error={errors.password}
                            showPassword={showPassword}
                            onTogglePassword={() => setShowPassword(!showPassword)}
                            autoComplete="new-password"
                        />

                        {/* Password Strength Indicator */}
                        <PasswordStrengthIndicator
                            password={formData.password}
                            requirements={passwordRequirements}
                            strength={passwordStrength}
                        />

                        {/* Confirm Password Input */}
                        <PasswordInput
                            label={formLabels.confirmPassword}
                            value={formData.confirmPassword}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFieldValue('confirmPassword', e.target.value)}
                            error={errors.confirmPassword}
                            showPassword={showConfirmPassword}
                            onTogglePassword={() => setShowConfirmPassword(!showConfirmPassword)}
                            autoComplete="new-password"
                        />

                        {/* Educational Stage Select */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                المرحلة الدراسية <span className="text-red-500">*</span>
                            </label>
                            {isLoadingStages ? (
                                <div className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                                    جاري التحميل...
                                </div>
                            ) : (
                                <div className="relative">
                                    <School className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
                                    <select
                                        value={formData.educationalStageId}
                                        onChange={(e) => setFieldValue('educationalStageId', e.target.value)}
                                        className={`w-full pr-12 pl-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border transition-all text-gray-900 dark:text-white appearance-none cursor-pointer ${errors.educationalStageId
                                                ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                                                : 'border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
                                            }`}
                                    >
                                        <option value="">اختر المرحلة الدراسية</option>
                                        {stages.map((stage) => (
                                            <option key={stage.id} value={stage.id}>
                                                {stage.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {errors.educationalStageId && (
                                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                                    {errors.educationalStageId}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        fullWidth
                        isLoading={isLoading}
                        disabled={isLoading || googleLoading}
                    >
                        {authMessages.signup.button}
                    </Button>
                </form>

                {/* Divider */}
                <AuthDivider />

                {/* Google Sign Up */}
                <GoogleAuthButton
                    onClick={handleGoogleSignIn}
                    isLoading={googleLoading}
                    disabled={isLoading || googleLoading}
                    loadingText={authMessages.signup.loadingGoogle}
                    text={authMessages.signup.googleButton}
                />
            </AuthCard>

            {/* Login Link */}
            <AuthFooterLink
                text={authMessages.signup.hasAccount}
                linkText={authMessages.signup.loginLink}
                href="/login"
            />
        </AuthLayout>
    );
}
