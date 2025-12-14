"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { validateEmail, validateRequired, validateLength } from "@/lib/validation";
import { safeAsync } from "@/lib/errorHandler";

export default function ContactPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.displayName || "",
    email: user?.email || "",
    subject: "",
    message: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // تحديث البيانات تلقائياً عند تسجيل الدخول
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.displayName || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"success" | "error" | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validate form using centralized validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate name
    const nameResult = validateRequired(formData.name, "الاسم");
    if (!nameResult.isValid && nameResult.error) {
      errors.name = nameResult.error;
    }

    // Validate email
    const emailResult = validateEmail(formData.email);
    if (!emailResult.isValid && emailResult.error) {
      errors.email = emailResult.error;
    }

    // Validate subject
    const subjectResult = validateLength(formData.subject, 3, 200, "الموضوع");
    if (!subjectResult.isValid && subjectResult.error) {
      errors.subject = subjectResult.error;
    }

    // Validate message
    const messageResult = validateLength(formData.message, 10, 5000, "الرسالة");
    if (!messageResult.isValid && messageResult.error) {
      errors.message = messageResult.error;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form before submitting
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setErrorMessage("");

    // Use safeAsync for Firestore operation
    const { error } = await safeAsync(async () => {
      await addDoc(collection(db, "contactMessages"), {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        userId: user?.uid || null,
        createdAt: serverTimestamp(),
        status: "new",
      });
    });

    if (error) {
      setSubmitStatus("error");
      setErrorMessage(error.message);
    } else {
      setSubmitStatus("success");
      setFormData({
        name: user?.displayName || "",
        email: user?.email || "",
        subject: "",
        message: "",
      });
      setFieldErrors({});
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#121218]" dir="rtl">
      <Navbar />

      <main className="container mx-auto px-4 py-12 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              تواصل معنا
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              نحن هنا للإجابة على جميع استفساراتك ومساعدتك في أي وقت
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info Cards */}
            <div className="lg:col-span-1 space-y-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 border border-gray-200 dark:border-[#2e2e3a] shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      البريد الإلكتروني
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      info@example.com
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 border border-gray-200 dark:border-[#2e2e3a] shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                    <Phone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      الهاتف
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      +20 123 456 7890
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 border border-gray-200 dark:border-[#2e2e3a] shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      العنوان
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      القاهرة، مصر
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-[#1c1c24] rounded-2xl p-8 border border-gray-200 dark:border-[#2e2e3a] shadow-lg"
              >
                <div className="flex items-center gap-3 mb-6">
                  <MessageSquare className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    أرسل لنا رسالة
                  </h2>
                </div>

                {submitStatus === "success" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3"
                  >
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                    <p className="text-green-700 dark:text-green-300">
                      تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.
                    </p>
                  </motion.div>
                )}

                {submitStatus === "error" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3"
                  >
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
                    <p className="text-red-700 dark:text-red-300">
                      {errorMessage || "حدث خطأ أثناء إرسال الرسالة. يرجى المحاولة مرة أخرى."}
                    </p>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      type="text"
                      name="name"
                      label="الاسم"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      icon={<Mail className="h-5 w-5" />}
                      placeholder="أدخل اسمك"
                    />
                    <Input
                      type="email"
                      name="email"
                      label="البريد الإلكتروني"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      icon={<Mail className="h-5 w-5" />}
                      placeholder="example@email.com"
                    />
                  </div>

                  <Input
                    type="text"
                    name="subject"
                    label="الموضوع"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    icon={<MessageSquare className="h-5 w-5" />}
                    placeholder="موضوع الرسالة"
                  />

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      الرسالة
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-[#2e2e3a] bg-white dark:bg-[#121218] text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-all"
                      placeholder="اكتب رسالتك هنا..."
                    />
                  </div>

                  <Button
                    type="submit"
                    isLoading={isSubmitting}
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Send className="h-5 w-5" />
                    <span>إرسال الرسالة</span>
                  </Button>
                </form>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

