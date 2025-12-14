"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { MessageSquare, Search, Filter, Mail, Calendar, X, Reply, Trash2, User } from "lucide-react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { Textarea } from "@/components/Textarea";

interface MessageData {
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Timestamp;
  status: "new" | "read" | "replied";
  reply?: string;
  replyDate?: Timestamp;
  repliedBy?: string;
  userId?: string;
}

interface MessageWithId extends MessageData {
  id: string;
}

export default function MessagesManagement() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const router = useRouter();

  const [messages, setMessages] = useState<MessageWithId[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<MessageWithId | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);

  useEffect(() => {
    if (authLoading || adminLoading) {
      return;
    }

    if (!user) {
      router.push("/");
      return;
    }

    if (!isAdmin) {
      router.push("/");
      return;
    }
  }, [user, isAdmin, authLoading, adminLoading, router]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!isAdmin) return;

      setLoadingMessages(true);
      try {
        const messagesRef = collection(db, "contactMessages");
        const q = query(messagesRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        const messagesData: MessageWithId[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          messagesData.push({
            id: doc.id,
            name: data.name || "",
            email: data.email || "",
            subject: data.subject || "",
            message: data.message || "",
            createdAt: data.createdAt || Timestamp.now(),
            status: data.status || "new",
            reply: data.reply || "",
            replyDate: data.replyDate || null,
            repliedBy: data.repliedBy || "",
            userId: data.userId || "",
          });
        });

        setMessages(messagesData);
      } catch (error: unknown) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoadingMessages(false);
      }
    };

    if (isAdmin && !authLoading && !adminLoading) {
      fetchMessages();
    }
  }, [isAdmin, authLoading, adminLoading]);

  const handleMarkAsRead = async (messageId: string) => {
    try {
      const messageRef = doc(db, "contactMessages", messageId);
      await updateDoc(messageRef, {
        status: "read",
      });

      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, status: "read" as const } : msg))
      );
    } catch (error: unknown) {
      console.error("Error marking message as read:", error);
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyText.trim()) {
      return;
    }

    setIsReplying(true);
    try {
      const messageRef = doc(db, "contactMessages", selectedMessage.id);
      await updateDoc(messageRef, {
        reply: replyText.trim(),
        replyDate: Timestamp.now(),
        repliedBy: user?.uid || "",
        status: "replied",
      });

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === selectedMessage.id
            ? {
                ...msg,
                reply: replyText.trim(),
                replyDate: Timestamp.now(),
                repliedBy: user?.uid || "",
                status: "replied" as const,
              }
            : msg
        )
      );

      setReplyText("");
      setSelectedMessage(null);
    } catch (error: unknown) {
      console.error("Error replying to message:", error);
    } finally {
      setIsReplying(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الرسالة؟")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "contactMessages", messageId));
      setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
      }
    } catch (error: unknown) {
      console.error("Error deleting message:", error);
    }
  };

  const filteredMessages = messages.filter((message) => {
    if (filterStatus !== "all" && message.status !== filterStatus) {
      return false;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const name = message.name.toLowerCase();
      const email = message.email.toLowerCase();
      const subject = message.subject.toLowerCase();
      const messageText = message.message.toLowerCase();

      if (
        !name.includes(query) &&
        !email.includes(query) &&
        !subject.includes(query) &&
        !messageText.includes(query)
      ) {
        return false;
      }
    }

    return true;
  });

  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return "غير متاح";
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { text: string; color: string; bg: string }> = {
      new: { text: "جديد", color: "text-primary-700 dark:text-primary-300", bg: "bg-primary-100 dark:bg-primary-900/30" },
      read: { text: "مقروء", color: "text-gray-700 dark:text-gray-300", bg: "bg-gray-100 dark:bg-gray-800" },
      replied: { text: "تم الرد", color: "text-green-700 dark:text-green-300", bg: "bg-green-100 dark:bg-green-900/30" },
    };
    return labels[status] || labels.new;
  };

  const unreadCount = messages.filter((m) => m.status === "new").length;

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#121218] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#121218]" dir="rtl">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
                <MessageSquare className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  إدارة الرسائل
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  عرض وإدارة رسائل التواصل
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <div className="px-4 py-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-semibold">
                {unreadCount} رسالة غير مقروءة
              </div>
            )}
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="ابحث في الرسائل..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>

              {/* Filter Toggle */}
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                الفلاتر
              </Button>
            </div>

            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-gray-200 dark:border-[#2e2e3a]"
                >
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      حالة الرسالة
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="all">الكل</option>
                      <option value="new">جديد</option>
                      <option value="read">مقروء</option>
                      <option value="replied">تم الرد</option>
                    </select>
                  </div>

                  {/* Clear Filters */}
                  <div className="mt-4">
                    <Button
                      onClick={() => {
                        setFilterStatus("all");
                        setSearchQuery("");
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      مسح جميع الفلاتر
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Messages List */}
          <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  الرسائل ({filteredMessages.length})
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {messages.length} رسالة إجمالي
                </p>
              </div>
            </div>

            {loadingMessages ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">جاري تحميل الرسائل...</p>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
                  {searchQuery || filterStatus !== "all"
                    ? "لا توجد نتائج للبحث"
                    : "لا توجد رسائل"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMessages.map((message, index) => {
                  const statusInfo = getStatusLabel(message.status);
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-5 rounded-xl border-2 transition-all cursor-pointer ${
                        message.status === "new"
                          ? "border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10"
                          : "border-gray-200 dark:border-[#2e2e3a] bg-gray-50 dark:bg-[#252530]"
                      } hover:shadow-lg`}
                      onClick={() => {
                        setSelectedMessage(message);
                        if (message.status === "new") {
                          handleMarkAsRead(message.id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className={`px-3 py-1 rounded-lg text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}
                            >
                              {statusInfo.text}
                            </span>
                            {message.status === "new" && (
                              <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                            {message.subject}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              <span>{message.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="h-4 w-4" />
                              <span className="truncate">{message.email}</span>
                            </div>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 line-clamp-2 mb-2">
                            {message.message}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(message.createdAt)}</span>
                          </div>
                          {message.reply && (
                            <div className="mt-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                              <div className="flex items-center gap-2 mb-1">
                                <Reply className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                                  تم الرد
                                </span>
                              </div>
                              <p className="text-sm text-green-700 dark:text-green-300 line-clamp-2">
                                {message.reply}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(message.id);
                            }}
                            className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Message Details Modal */}
      <AnimatePresence>
        {selectedMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedMessage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1c1c24] rounded-3xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">تفاصيل الرسالة</h2>
                <button
                  onClick={() => {
                    setSelectedMessage(null);
                    setReplyText("");
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Message Info */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#252530]">
                  <div className="flex items-center gap-3 mb-4">
                    <span
                      className={`px-3 py-1 rounded-lg text-xs font-medium ${
                        getStatusLabel(selectedMessage.status).bg
                      } ${getStatusLabel(selectedMessage.status).color}`}
                    >
                      {getStatusLabel(selectedMessage.status).text}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                    {selectedMessage.subject}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700 dark:text-gray-300">{selectedMessage.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700 dark:text-gray-300">{selectedMessage.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {formatDate(selectedMessage.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Message Content */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">الرسالة</h4>
                  <div className="p-4 rounded-xl bg-white dark:bg-[#252530] border border-gray-200 dark:border-[#2e2e3a]">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {selectedMessage.message}
                    </p>
                  </div>
                </div>

                {/* Existing Reply */}
                {selectedMessage.reply && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">الرد السابق</h4>
                    <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {selectedMessage.reply}
                      </p>
                      {selectedMessage.replyDate && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          {formatDate(selectedMessage.replyDate)}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Reply Form */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {selectedMessage.reply ? "تعديل الرد" : "إرسال رد"}
                  </h4>
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="اكتب ردك هنا..."
                    rows={6}
                    className="mb-4"
                  />
                  <div className="flex gap-3">
                    <Button
                      onClick={handleReply}
                      isLoading={isReplying}
                      disabled={!replyText.trim() || isReplying}
                      className="flex items-center gap-2"
                    >
                      <Reply className="h-4 w-4" />
                      {selectedMessage.reply ? "تحديث الرد" : "إرسال الرد"}
                    </Button>
                    {selectedMessage.reply && (
                      <Button
                        onClick={() => setReplyText(selectedMessage.reply || "")}
                        variant="outline"
                      >
                        استعادة الرد السابق
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

