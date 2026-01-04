"use client";

/**
 * Admin Messages Page - إدارة الرسائل الواردة
 * 
 * Displays and manages contact messages from users.
 * Uses the messages table from the database.
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Mail,
    MailOpen,
    Search,
    Star,
    StarOff,
    Archive,
    Trash2,
    Reply,
    Clock,
    User,
    Filter,
    Loader2,
    CheckCircle2,
    X,
    Send,
    RefreshCw,
    Inbox,
    AlertCircle,
    Eye,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import {
    getMessages,
    markMessageAsRead,
    toggleMessageStarred,
    archiveMessage,
    deleteMessage,
    replyToMessage,
} from "@/lib/services/message.service";
import type { Message } from "@/lib/database.types";

// ==========================================
// Types
// ==========================================
type FilterType = "all" | "unread" | "starred" | "archived";

// ==========================================
// Animation Variants
// ==========================================
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } },
};

// ==========================================
// Message Card Component
// ==========================================
function MessageCard({
    message,
    isSelected,
    onSelect,
    onToggleStar,
    onMarkRead,
}: {
    message: Message;
    isSelected: boolean;
    onSelect: () => void;
    onToggleStar: () => void;
    onMarkRead: () => void;
}) {
    const formatDate = (date: string) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (days === 0) {
            return d.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
        } else if (days === 1) {
            return "أمس";
        } else if (days < 7) {
            return `منذ ${days} أيام`;
        } else {
            return d.toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
        }
    };

    return (
        <motion.div
            variants={itemVariants}
            onClick={onSelect}
            className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50 ${isSelected ? "bg-primary-50 dark:bg-primary-900/20 border-r-4 border-r-primary-500" : ""
                } ${!message.is_read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}
        >
            <div className="flex items-start gap-3">
                {/* Status Indicator */}
                <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${message.is_read ? "bg-gray-300 dark:bg-gray-600" : "bg-blue-500"
                    }`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className={`font-medium truncate ${message.is_read
                            ? "text-gray-700 dark:text-gray-300"
                            : "text-gray-900 dark:text-white font-semibold"
                            }`}>
                            {message.from_name}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                            {formatDate(message.created_at || "")}
                        </span>
                    </div>
                    <p className={`text-sm truncate mb-1 ${message.is_read
                        ? "text-gray-500 dark:text-gray-400"
                        : "text-gray-700 dark:text-gray-300"
                        }`}>
                        {message.subject}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                        {message.message}
                    </p>

                    {/* Tags */}
                    <div className="flex items-center gap-2 mt-2">
                        {message.is_replied && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs">
                                <Reply className="w-3 h-3" />
                                تم الرد
                            </span>
                        )}
                        {message.is_archived && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs">
                                <Archive className="w-3 h-3" />
                                مؤرشف
                            </span>
                        )}
                    </div>
                </div>

                {/* Star Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleStar();
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    {message.is_starred ? (
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    ) : (
                        <StarOff className="w-4 h-4 text-gray-400" />
                    )}
                </button>
            </div>
        </motion.div>
    );
}

// ==========================================
// Message Detail Component
// ==========================================
function MessageDetail({
    message,
    onClose,
    onReply,
    onArchive,
    onDelete,
    onMarkRead,
}: {
    message: Message;
    onClose: () => void;
    onReply: (text: string) => Promise<void>;
    onArchive: () => void;
    onDelete: () => void;
    onMarkRead: () => void;
}) {
    const [isReplying, setIsReplying] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [isSending, setIsSending] = useState(false);

    // Mark as read when opened
    useEffect(() => {
        if (!message.is_read) {
            onMarkRead();
        }
    }, [message.id]);

    const handleSendReply = async () => {
        if (!replyText.trim()) return;
        setIsSending(true);
        try {
            await onReply(replyText);
            setReplyText("");
            setIsReplying(false);
        } catch (error) {
            console.error("Error sending reply:", error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="h-full flex flex-col"
        >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium">
                        {message.from_name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                            {message.from_name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {message.from_email}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onArchive}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        title="أرشفة"
                    >
                        <Archive className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-500"
                        title="حذف"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                        <Clock className="w-4 h-4" />
                        {new Date(message.created_at || "").toLocaleString("ar-EG", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                        {message.subject}
                    </h2>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {message.message}
                        </p>
                    </div>
                </div>

                {/* Previous Reply */}
                {message.is_replied && message.reply_text && (
                    <div className="mt-6 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-2">
                            <Reply className="w-4 h-4" />
                            <span className="font-medium text-sm">ردك السابق</span>
                            <span className="text-xs text-green-500">
                                {message.replied_at && new Date(message.replied_at).toLocaleDateString("ar-EG")}
                            </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm">
                            {message.reply_text}
                        </p>
                    </div>
                )}
            </div>

            {/* Reply Section */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                {!isReplying ? (
                    <button
                        onClick={() => setIsReplying(true)}
                        className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-primary-500 hover:text-primary-500 transition-colors flex items-center justify-center gap-2"
                    >
                        <Reply className="w-5 h-5" />
                        {message.is_replied ? "إرسال رد آخر" : "الرد على الرسالة"}
                    </button>
                ) : (
                    <div className="space-y-3">
                        <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="اكتب ردك هنا..."
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-gray-900 dark:text-white placeholder-gray-400 resize-none"
                            autoFocus
                        />
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleSendReply}
                                disabled={!replyText.trim() || isSending}
                                className="flex-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium flex items-center justify-center gap-2 transition-colors"
                            >
                                {isSending ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Send className="w-5 h-5" />
                                )}
                                إرسال الرد
                            </button>
                            <button
                                onClick={() => {
                                    setIsReplying(false);
                                    setReplyText("");
                                }}
                                className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

// ==========================================
// Main Component
// ==========================================
export default function AdminMessagesPage() {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [filter, setFilter] = useState<FilterType>("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch messages
    const fetchMessages = async () => {
        setIsLoading(true);
        try {
            const data = await getMessages();
            setMessages(data);
        } catch (error) {
            console.error("Error fetching messages:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    // Filter messages
    const filteredMessages = messages.filter((msg) => {
        // Apply filter
        if (filter === "unread" && msg.is_read) return false;
        if (filter === "starred" && !msg.is_starred) return false;
        if (filter === "archived" && !msg.is_archived) return false;
        if (filter === "all" && msg.is_archived) return false;

        // Apply search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                msg.from_name.toLowerCase().includes(query) ||
                msg.from_email.toLowerCase().includes(query) ||
                msg.subject.toLowerCase().includes(query) ||
                msg.message.toLowerCase().includes(query)
            );
        }

        return true;
    });

    // Stats
    const stats = {
        total: messages.filter((m) => !m.is_archived).length,
        unread: messages.filter((m) => !m.is_read).length,
        starred: messages.filter((m) => m.is_starred).length,
        archived: messages.filter((m) => m.is_archived).length,
    };

    // Handlers
    const handleToggleStar = async (id: string, current: boolean) => {
        try {
            await toggleMessageStarred(id, !current);
            setMessages((prev) =>
                prev.map((m) => (m.id === id ? { ...m, is_starred: !current } : m))
            );
            if (selectedMessage?.id === id) {
                setSelectedMessage((prev) => prev ? { ...prev, is_starred: !current } : null);
            }
        } catch (error) {
            console.error("Error toggling star:", error);
        }
    };

    const handleMarkRead = async (id: string) => {
        try {
            await markMessageAsRead(id);
            setMessages((prev) =>
                prev.map((m) => (m.id === id ? { ...m, is_read: true } : m))
            );
            if (selectedMessage?.id === id) {
                setSelectedMessage((prev) => prev ? { ...prev, is_read: true } : null);
            }
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const handleArchive = async (id: string) => {
        try {
            await archiveMessage(id);
            setMessages((prev) =>
                prev.map((m) => (m.id === id ? { ...m, is_archived: true } : m))
            );
            setSelectedMessage(null);
        } catch (error) {
            console.error("Error archiving:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return;
        try {
            await deleteMessage(id);
            setMessages((prev) => prev.filter((m) => m.id !== id));
            setSelectedMessage(null);
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    const handleReply = async (id: string, text: string) => {
        if (!user) return;
        try {
            await replyToMessage(id, text, user.id);
            setMessages((prev) =>
                prev.map((m) =>
                    m.id === id
                        ? { ...m, is_replied: true, reply_text: text, replied_at: new Date().toISOString() }
                        : m
                )
            );
            if (selectedMessage?.id === id) {
                setSelectedMessage((prev) =>
                    prev
                        ? { ...prev, is_replied: true, reply_text: text, replied_at: new Date().toISOString() }
                        : null
                );
            }
        } catch (error) {
            console.error("Error replying:", error);
            throw error;
        }
    };

    const filterButtons: { key: FilterType; label: string; count: number; icon: typeof Mail }[] = [
        { key: "all", label: "الوارد", count: stats.total, icon: Inbox },
        { key: "unread", label: "غير مقروء", count: stats.unread, icon: Mail },
        { key: "starred", label: "المميزة", count: stats.starred, icon: Star },
        { key: "archived", label: "الأرشيف", count: stats.archived, icon: Archive },
    ];

    return (
        <div className="h-[calc(100vh-80px)] flex" dir="rtl">
            {/* Sidebar - Message List */}
            <div className={`w-full lg:w-[400px] bg-white dark:bg-[#0f172a] border-l border-gray-100 dark:border-gray-800 flex flex-col ${selectedMessage ? "hidden lg:flex" : ""}`}>
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Mail className="w-6 h-6 text-primary-500" />
                            الرسائل
                        </h1>
                        <button
                            onClick={fetchMessages}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="بحث في الرسائل..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-gray-900 dark:text-white placeholder-gray-400"
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-1 mt-3 overflow-x-auto scrollbar-hide pb-1">
                        {filterButtons.map(({ key, label, count, icon: Icon }) => (
                            <button
                                key={key}
                                onClick={() => setFilter(key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${filter === key
                                    ? "bg-primary-500 text-white"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {label}
                                {count > 0 && (
                                    <span className={`px-1.5 py-0.5 rounded-full text-xs ${filter === key
                                        ? "bg-white/20"
                                        : "bg-gray-200 dark:bg-gray-700"
                                        }`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Message List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                        </div>
                    ) : filteredMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                                <Inbox className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                                لا توجد رسائل
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {searchQuery ? "جرب البحث بكلمات مختلفة" : "لم تصلك أي رسائل بعد"}
                            </p>
                        </div>
                    ) : (
                        <motion.div variants={containerVariants} initial="hidden" animate="visible">
                            {filteredMessages.map((msg) => (
                                <MessageCard
                                    key={msg.id}
                                    message={msg}
                                    isSelected={selectedMessage?.id === msg.id}
                                    onSelect={() => setSelectedMessage(msg)}
                                    onToggleStar={() => handleToggleStar(msg.id, msg.is_starred || false)}
                                    onMarkRead={() => handleMarkRead(msg.id)}
                                />
                            ))}
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Message Detail */}
            <div className={`flex-1 bg-gray-50 dark:bg-[#0a0f1a] ${!selectedMessage ? "hidden lg:flex items-center justify-center" : ""}`}>
                <AnimatePresence mode="wait">
                    {selectedMessage ? (
                        <MessageDetail
                            key={selectedMessage.id}
                            message={selectedMessage}
                            onClose={() => setSelectedMessage(null)}
                            onReply={(text) => handleReply(selectedMessage.id, text)}
                            onArchive={() => handleArchive(selectedMessage.id)}
                            onDelete={() => handleDelete(selectedMessage.id)}
                            onMarkRead={() => handleMarkRead(selectedMessage.id)}
                        />
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center p-8"
                        >
                            <div className="w-24 h-24 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
                                <Eye className="w-12 h-12 text-gray-300 dark:text-gray-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
                                اختر رسالة لعرضها
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                اختر رسالة من القائمة لقراءة محتواها والرد عليها
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
