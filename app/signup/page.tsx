"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { validateEmail, validatePassword, validateDisplayName, ValidationResult } from "@/lib/validation";
import { safeAsync } from "@/lib/errorHandler";

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, signInWithGoogle, user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  const passwordRequirements = useMemo(() => [
    { text: "6 أحرف على الأقل", met: formData.password.length >= 6, key: "length" },
    { text: "حرف كبير", met: /[A-Z]/.test(formData.password), key: "uppercase" },
    { text: "حرف صغير", met: /[a-z]/.test(formData.password), key: "lowercase" },
    { text: "رقم", met: /\d/.test(formData.password), key: "number" },
  ], [formData.password]);

  // Custom validator for confirm password
  const validateConfirmPassword = (value: string): ValidationResult => {
    if (!value) {
      return { isValid: false, error: "تأكيد كلمة المرور مطلوب" };
    }
    if (value !== formData.password) {
      return { isValid: false, error: "كلمة المرور غير متطابقة" };
    }
    return { isValid: true };
  };

  const validate = useCallback(() => {
    // Use centralized validation from lib/validation.ts
    const newErrors: Record<string, string> = {};

    const nameResult = validateDisplayName(formData.name);
    if (!nameResult.isValid && nameResult.error) {
      newErrors.name = nameResult.error;
    }

    const emailResult = validateEmail(formData.email);
    if (!emailResult.isValid && emailResult.error) {
      newErrors.email = emailResult.error;
    }

    const passwordResult = validatePassword(formData.password);
    if (!passwordResult.isValid && passwordResult.error) {
      newErrors.password = passwordResult.error;
    }

    const confirmResult = validateConfirmPassword(formData.confirmPassword);
    if (!confirmResult.isValid && confirmResult.error) {
      newErrors.confirmPassword = confirmResult.error;
    }

    setErrors(newErrors);
    setError("");
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    setError("");

    // Use safeAsync wrapper for error handling
    const { error: authError } = await safeAsync(
      () => signUp(formData.email, formData.password, formData.name)
    );

    if (authError) {
      // Use centralized error handler for consistent error messages
      setError(authError.message);
    } else {
      router.push("/");
    }

    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);

    // Use safeAsync wrapper for error handling
    const { error: authError } = await safeAsync(
      () => signInWithGoogle()
    );

    if (authError) {
      // Use centralized error handler for consistent error messages
      setError(authError.message);
    } else {
      router.push("/");
    }

    setGoogleLoading(false);
  };

  const passwordStrength = useMemo(() => {
    const metCount = passwordRequirements.filter(req => req.met).length;
    if (metCount === 0) return { strength: 0, label: "", color: "" };
    if (metCount === 1) return { strength: 25, label: "ضعيفة", color: "bg-red-500" };
    if (metCount === 2) return { strength: 50, label: "متوسطة", color: "bg-yellow-500" };
    if (metCount === 3) return { strength: 75, label: "جيدة", color: "bg-blue-500" };
    return { strength: 100, label: "قوية", color: "bg-green-500" };
  }, [passwordRequirements]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-[#121218] dark:via-[#1a1a24] dark:to-[#121218] flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-1/4 w-96 h-96 bg-primary-500/10 dark:bg-primary-400/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-1/4 w-96 h-96 bg-primary-600/10 dark:bg-primary-500/5 rounded-full blur-3xl" />
      </div>

      <Navbar />
      <div className="flex-1 flex items-center justify-center p-4 pt-16 md:pt-24 pb-8 relative z-10">
        <ThemeToggle fixed />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Form Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
            className="relative rounded-3xl p-8 bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl border border-gray-200/50 dark:border-[#2e2e3a]/50 shadow-2xl"
          >
            {/* Card glow effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-500/5 to-transparent pointer-events-none" />

            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-6 p-4 rounded-xl bg-red-50/90 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/50 flex items-start gap-3 backdrop-blur-sm"
                >
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-300 text-right flex-1">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
              <div className="space-y-4">
                <Input
                  type="text"
                  label="الاسم الكامل"
                  placeholder="أدخل اسمك الكامل"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errors.name) {
                      setErrors({ ...errors, name: "" });
                    }
                  }}
                  error={errors.name}
                  icon={<User className="h-5 w-5" />}
                  autoComplete="name"
                />

                <Input
                  type="email"
                  label="البريد الإلكتروني"
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) {
                      setErrors({ ...errors, email: "" });
                    }
                  }}
                  error={errors.email}
                  icon={<Mail className="h-5 w-5" />}
                  dir="ltr"
                  autoComplete="email"
                />

                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    label="كلمة المرور"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => {
                      setFormData({ ...formData, password: e.target.value });
                      if (errors.password) {
                        setErrors({ ...errors, password: "" });
                      }
                    }}
                    error={errors.password}
                    icon={<Lock className="h-5 w-5" />}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-4 top-[2.75rem] p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Password Requirements */}
                <AnimatePresence>
                  {formData.password && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-2 p-4 rounded-xl bg-gray-50/80 dark:bg-[#252530]/80 backdrop-blur-sm border border-gray-200/50 dark:border-[#2e2e3a]/50"
                    >
                      {passwordStrength.strength > 0 && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              قوة كلمة المرور
                            </span>
                            <span className={`text-xs font-semibold ${passwordStrength.color.replace('bg-', 'text-')}`}>
                              {passwordStrength.label}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 dark:bg-[#2e2e3a] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${passwordStrength.strength}%` }}
                              transition={{ duration: 0.3 }}
                              className={`h-full ${passwordStrength.color} transition-colors`}
                            />
                          </div>
                        </div>
                      )}
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        متطلبات كلمة المرور:
                      </p>
                      <div className="space-y-1.5">
                        {passwordRequirements.map((req) => (
                          <motion.div
                            key={req.key}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 text-sm"
                          >
                            <CheckCircle2
                              className={`h-4 w-4 transition-colors ${req.met
                                  ? "text-primary-500 dark:text-primary-400"
                                  : "text-gray-300 dark:text-gray-600"
                                }`}
                            />
                            <span
                              className={`transition-colors ${req.met
                                  ? "text-primary-600 dark:text-primary-400 font-medium"
                                  : "text-gray-500 dark:text-gray-400"
                                }`}
                            >
                              {req.text}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    label="تأكيد كلمة المرور"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value });
                      if (errors.confirmPassword) {
                        setErrors({ ...errors, confirmPassword: "" });
                      }
                    }}
                    error={errors.confirmPassword}
                    icon={<Lock className="h-5 w-5" />}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-4 top-[2.75rem] p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                    aria-label={showConfirmPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="terms"
                  className="mt-1 w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-2 focus:ring-primary-500/20 focus:ring-offset-0 transition-all"
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer leading-relaxed"
                >
                  أوافق على{" "}
                  <Link
                    href="/terms"
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline font-medium transition-colors"
                  >
                    الشروط والأحكام
                  </Link>{" "}
                  و{" "}
                  <Link
                    href="/privacy"
                    className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:underline font-medium transition-colors"
                  >
                    سياسة الخصوصية
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                fullWidth
                isLoading={isLoading}
                disabled={isLoading || googleLoading}
                className="mt-6"
              >
                إنشاء الحساب
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-[#2e2e3a]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white/80 dark:bg-[#1c1c24]/80 text-gray-500 dark:text-gray-400 font-medium">
                  أو
                </span>
              </div>
            </div>

            {/* Google Sign Up */}
            <motion.button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading || googleLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border-2 border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] hover:bg-gray-50 dark:hover:bg-[#252530] hover:border-gray-300 dark:hover:border-[#3e3e4a] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-gray-700 dark:text-gray-300 font-semibold">
                {googleLoading ? "جاري التسجيل..." : "التسجيل بـ Google"}
              </span>
            </motion.button>
          </motion.div>

          {/* Login Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center"
          >
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              لديك حساب بالفعل؟{" "}
              <Link
                href="/login"
                className="text-primary-600 dark:text-primary-400 font-semibold hover:text-primary-700 dark:hover:text-primary-300 hover:underline inline-flex items-center gap-1.5 transition-colors group"
              >
                تسجيل الدخول
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
