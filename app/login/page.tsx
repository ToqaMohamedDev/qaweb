"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, LogIn } from "lucide-react";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { signInWithEmail, signInWithGoogle } from "@/lib/supabase";
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
} from "@/components/auth";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface LoginFormData {
    email: string;
    password: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshUser, isAuthenticated, user, isLoading: authLoading } = useAuthStore();
    const redirectTo = searchParams.get('redirect') || '/';

    // Form state with validation
    const {
        values: formData,
        errors,
        setFieldValue,
        validateForm,
    } = useFormValidation<LoginFormData>({
        initialValues: {
            email: "",
            password: "",
        },
        validators: {
            email: [rules.required('email'), rules.email()],
            password: [rules.required('password'), rules.password(6)],
        },
    });

    // UI State
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState("");

    // ═══════════════════════════════════════════════════════════════════════
    // EFFECTS
    // ═══════════════════════════════════════════════════════════════════════

    // إذا كان المستخدم مسجل بالفعل، وجهه للصفحة المناسبة
    useEffect(() => {
        if (!authLoading && isAuthenticated && user) {
            if (user.role === 'admin') {
                router.push('/admin');
            } else if (user.role === 'teacher') {
                router.push('/teacher');
            } else {
                router.push(redirectTo);
            }
        }
    }, [authLoading, isAuthenticated, user, router, redirectTo]);

    // ═══════════════════════════════════════════════════════════════════════
    // HANDLERS
    // ═══════════════════════════════════════════════════════════════════════

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) return;

        setIsLoading(true);
        setError("");

        try {
            await signInWithEmail({ email: formData.email, password: formData.password });
            await refreshUser();
            // التوجيه سيتم تلقائياً من useEffect
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : '';

            if (errorMessage.includes("Invalid login credentials")) {
                setError(authMessages.errors.invalidCredentials);
            } else if (errorMessage.includes("Email not confirmed")) {
                setError(authMessages.errors.emailNotConfirmed);
            } else {
                setError(errorMessage || authMessages.errors.loginError);
            }
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
                icon={LogIn}
                title={authMessages.login.title}
                subtitle={authMessages.login.subtitle}
            />

            {/* Form Card */}
            <AuthCard>
                {/* Error Alert */}
                {error && <AuthAlert type="error" message={error} />}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-4">
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
                            autoComplete="current-password"
                        />
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-0 transition-all"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                                {authMessages.login.rememberMe}
                            </span>
                        </label>
                        <Link
                            href="/forgot-password"
                            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline font-medium transition-colors"
                        >
                            {authMessages.login.forgotPassword}
                        </Link>
                    </div>

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        fullWidth
                        isLoading={isLoading}
                        disabled={isLoading || googleLoading}
                        className="mt-2"
                    >
                        {authMessages.login.button}
                    </Button>
                </form>

                {/* Divider */}
                <AuthDivider />

                {/* Google Sign In */}
                <GoogleAuthButton
                    onClick={handleGoogleSignIn}
                    isLoading={googleLoading}
                    disabled={isLoading || googleLoading}
                    loadingText={authMessages.login.loadingGoogle}
                    text={authMessages.login.googleButton}
                />
            </AuthCard>

            {/* Sign Up Link */}
            <AuthFooterLink
                text={authMessages.login.noAccount}
                linkText={authMessages.login.createAccount}
                href="/signup"
            />
        </AuthLayout>
    );
}
