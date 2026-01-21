"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, User, UserPlus } from "lucide-react";
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
        },
        validators: {
            name: [rules.required('name'), rules.minLength(2, 'الاسم')],
            email: [rules.required('email'), rules.email()],
            password: [rules.required('password'), rules.password(6)],
            confirmPassword: [rules.required('confirmPassword'), rules.match('password', 'password')],
        },
    });

    // UI State
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

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
                role: formData.role
            });

            await refreshUser();

            // توجيه المستخدم حسب الدور
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
                    </div>

                    {/* Terms Checkbox */}
                    <div className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            id="terms"
                            className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-0 transition-all"
                        />
                        <label htmlFor="terms" className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer leading-relaxed">
                            {authMessages.signup.terms}{" "}
                            <Link href="/terms" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                                {authMessages.signup.termsLink}
                            </Link>{" "}
                            {" و "}
                            <Link href="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                                {authMessages.signup.privacyLink}
                            </Link>
                        </label>
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
