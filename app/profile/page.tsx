"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import {
  User,
  Mail,
  Calendar,
  Edit3,
  Save,
  X,
  LogOut,
  MessageSquare,
  Send,
  CheckCircle2
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { updateProfile } from "firebase/auth";
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, orderBy, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { getAvatarColor, getAvatarInitials } from "@/lib/avatarUtils";
import { validateDisplayName } from "@/lib/validation";
import { safeAsync } from "@/lib/errorHandler";

interface ContactMessage {
  id: string;
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  createdAt?: Timestamp | Date;
  reply?: string;
  replyDate?: Timestamp | Date;
  repliedBy?: string;
  status?: "new" | "read" | "replied";
}

// Component for User Avatar with fallback
function UserAvatar({ photoURL, displayName, email, size = "md" }: { photoURL: string; displayName?: string; email?: string; size?: "sm" | "md" | "lg" }) {
  const [imageError, setImageError] = useState(false);
  const initials = getAvatarInitials(displayName, email);
  const color = getAvatarColor(initials);

  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-lg",
    lg: "h-24 w-24 text-3xl",
  };

  if (imageError || !photoURL) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-linear-to-br ${color} flex items-center justify-center text-white font-bold`}>
        {initials}
      </div>
    );
  }

  return (
    <Image
      src={photoURL}
      alt={displayName || email || "User"}
      width={size === "lg" ? 96 : size === "md" ? 48 : 32}
      height={size === "lg" ? 96 : size === "md" ? 48 : 32}
      className={`${sizeClasses[size]} rounded-full object-cover`}
      onError={() => setImageError(true)}
    />
  );
}

export default function ProfilePage() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!user) return;

      const fetchWithRetry = async (retries = 3): Promise<void> => {
        setLoadingMessages(true);

        // Use safeAsync for Firestore operation
        const { data, error } = await safeAsync(async () => {
          const messagesQuery = query(
            collection(db, "contactMessages"),
            where("email", "==", user.email),
            orderBy("createdAt", "desc")
          );
          const snapshot = await getDocs(messagesQuery);
          const messagesData: ContactMessage[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name,
              email: data.email,
              subject: data.subject,
              message: data.message,
              createdAt: data.createdAt,
              reply: data.reply,
              replyDate: data.replyDate,
              repliedBy: data.repliedBy,
              status: data.status,
            };
          });
          return messagesData;
        }, []);

        if (error) {
          console.error("Error fetching messages:", error);
          // Retry logic for offline/network errors
          if (error.code === 'NETWORK_ERROR' && retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchWithRetry(retries - 1);
          }
        } else if (data) {
          setMessages(data);
        }

        setLoadingMessages(false);
      };

      if (user) {
        fetchWithRetry();
      }
    };

    fetchMessages();
  }, [user]);

  // Redirect if not logged in
  if (!authLoading && !user) {
    router.push("/");
    return null;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#121218] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  const handleUpdateProfile = async () => {
    if (!user) return;

    // Validate display name using centralized validation
    const validationResult = validateDisplayName(displayName);
    if (!validationResult.isValid) {
      setError(validationResult.error || "الاسم غير صالح");
      return;
    }

    setUpdating(true);
    setError("");

    // Use safeAsync for Firebase Auth and Firestore operations
    const { error: updateError } = await safeAsync(async () => {
      // تحديث الاسم في Firebase Auth
      await updateProfile(auth.currentUser!, {
        displayName: displayName,
      });

      // تحديث الاسم في Firestore
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        displayName: displayName,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    });

    if (updateError) {
      setError(updateError.message);
    } else {
      setIsEditing(false);
    }

    setUpdating(false);
  };

  const handleLogout = async () => {
    // Use safeAsync for logout operation
    await safeAsync(() => logout());
    router.push("/");
  };

  const formatDate = (date: Timestamp | Date | null | undefined) => {
    if (!date) return "غير محدد";

    try {
      let dateObj: Date;
      if (date instanceof Timestamp) {
        dateObj = date.toDate();
      } else if (date instanceof Date) {
        dateObj = date;
      } else {
        return "غير محدد";
      }

      return new Intl.DateTimeFormat("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(dateObj);
    } catch {
      return "غير محدد";
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#121218]" dir="rtl">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              الملف الشخصي
            </h1>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>

          {/* Profile Card */}
          <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] p-8">
            <div className="flex items-start gap-6 mb-6">
              {/* Avatar */}
              <div className="shrink-0">
                {user?.photoURL ? (
                  <UserAvatar
                    photoURL={user.photoURL}
                    displayName={user.displayName || undefined}
                    email={user.email || undefined}
                    size="lg"
                  />
                ) : (
                  <div className={`h-24 w-24 rounded-full bg-linear-to-br ${getAvatarColor(getAvatarInitials(user?.displayName || undefined, user?.email || undefined))} flex items-center justify-center text-white text-3xl font-bold`}>
                    {getAvatarInitials(user?.displayName || undefined, user?.email || undefined)}
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <Input
                      type="text"
                      label="الاسم"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      icon={<User className="h-5 w-5" />}
                      placeholder="أدخل اسمك"
                    />
                    {error && (
                      <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                    )}
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleUpdateProfile}
                        isLoading={updating}
                        disabled={updating}
                        className="flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        حفظ
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false);
                          setDisplayName(user?.displayName || "");
                          setError("");
                        }}
                        disabled={updating}
                        className="flex items-center gap-2"
                      >
                        <X className="h-4 w-4" />
                        إلغاء
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {user?.displayName || "مستخدم"}
                      </h2>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        title="تعديل"
                      >
                        <Edit3 className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                    <div className="space-y-2 text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{user?.email}</span>
                      </div>
                      {user?.metadata?.creationTime && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            تاريخ التسجيل: {new Date(user.metadata.creationTime).toLocaleDateString("ar-EG", {
                              year: "numeric",
                              month: "long",
                              day: "numeric"
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* My Messages */}
          <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                  <MessageSquare className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  الرسائل المرسلة
                </h3>
              </div>
              <Link
                href="/contact"
                className="px-4 py-2 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors text-sm"
              >
                إرسال رسالة جديدة
              </Link>
            </div>

            {loadingMessages ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">جاري تحميل الرسائل...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لم تقم بإرسال أي رسائل بعد</p>
                <Link
                  href="/contact"
                  className="mt-4 inline-block px-6 py-2 rounded-lg bg-primary-500 text-white font-semibold hover:bg-primary-600 transition-colors"
                >
                  إرسال رسالة جديدة
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 rounded-xl bg-gray-50 dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a] hover:bg-gray-100 dark:hover:bg-[#2e2e3a] transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                            {message.subject}
                          </h4>
                          {message.reply && (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              تم الرد
                            </span>
                          )}
                          {!message.reply && (message.status === "read" || message.status === "new") && (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                              {message.status === "new" ? "جديدة" : "مقروءة"}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">
                          {message.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(message.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reply Section */}
                    {message.reply && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#2e2e3a]">
                        <div className="flex items-center gap-2 mb-2">
                          <Send className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                          <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                            الرد من الإدارة:
                          </span>
                        </div>
                        <div className="p-3 rounded-lg bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800">
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {message.reply}
                          </p>
                          {message.replyDate && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              {formatDate(message.replyDate)}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}

