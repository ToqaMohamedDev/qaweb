"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageSquare,
    Search,
    CheckCircle2,
    Clock,
    AlertCircle,
    User,
    Bot,
    Send,
    Loader2,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    X,
    Headphones,
    Shield,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuthStore } from "@/lib/stores/useAuthStore";
import { logger } from "@/lib/utils/logger";
import { Database } from "@/lib/database.types";
import { useUIStore } from "@/lib/stores";

type SupportChat = Database["public"]["Tables"]["support_chats"]["Row"];
type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];

const statusTypes: Record<string, { label: string; color: string; bgColor: string; icon: typeof CheckCircle2 }> = {
    open: { label: "مفتوحة", color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/30", icon: MessageSquare },
    pending: { label: "بانتظار الرد", color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/30", icon: Clock },
    resolved: { label: "مُنتهية", color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/30", icon: CheckCircle2 },
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function SupportChatsPage() {
    const [chats, setChats] = useState<SupportChat[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedChat, setSelectedChat] = useState<SupportChat | null>(null);
    const [replyText, setReplyText] = useState("");
    const [sending, setSending] = useState(false);
    const [page, setPage] = useState(1);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [admins, setAdmins] = useState<{ id: string; name: string | null; email: string }[]>([]);
    const [assigningAdmin, setAssigningAdmin] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { addToast } = useUIStore();
    const itemsPerPage = 10;

    const fetchChats = async () => {
        setLoading(true);
        setError(null);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("support_chats")
                .select("*")
                .order("updated_at", { ascending: false });

            if (error) {
                if (error.code === "42P01") {
                    setError("جدول المحادثات غير موجود. يرجى تنفيذ الـ migration أولاً.");
                    return;
                }
                throw error;
            }
            setChats(data || []);
        } catch (err: any) {
            setError(err.message || "حدث خطأ في جلب البيانات");
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (chatId: string) => {
        setLoadingMessages(true);
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("chat_messages")
                .select("*")
                .eq("chat_id", chatId)
                .order("created_at", { ascending: true });

            if (error) throw error;
            setMessages(data || []);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        } catch (err) {
            logger.error('Error fetching messages', { context: 'AdminSupport', data: err });
        } finally {
            setLoadingMessages(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchChats();
        fetchAdmins();
    }, []);

    // Fetch messages when chat selected
    useEffect(() => {
        if (selectedChat) fetchMessages(selectedChat.id);
    }, [selectedChat]);

    // Real-time subscription
    useEffect(() => {
        const supabase = createClient();

        const chatsChannel = supabase
            .channel('admin-support-chats')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'support_chats' },
                () => fetchChats()
            )
            .subscribe();

        const messagesChannel = supabase
            .channel('admin-chat-messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_messages' },
                (payload) => {
                    if (selectedChat && payload.new.chat_id === selectedChat.id) {
                        setMessages(prev => [...prev, payload.new as ChatMessage]);
                        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(chatsChannel);
            supabase.removeChannel(messagesChannel);
        };
    }, [selectedChat]);

    const filtered = chats.filter((c) => {
        const matchSearch = (c.subject || '').toLowerCase().includes(search.toLowerCase()) ||
            (c.user_id || '').toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || c.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const stats = [
        { label: "إجمالي المحادثات", value: chats.length, icon: MessageSquare, color: "primary" },
        { label: "بانتظار الرد", value: chats.filter(c => c.status === "pending").length, icon: Clock, color: "amber" },
        { label: "مُنتهية", value: chats.filter(c => c.status === "resolved").length, icon: CheckCircle2, color: "green" },
    ];

    const handleSelectChat = (chat: SupportChat) => {
        setSelectedChat(chat);
        setReplyText("");
    };

    const handleSendReply = async () => {
        if (!selectedChat || !replyText.trim()) return;
        setSending(true);
        try {
            const supabase = createClient();
            const authUser = useAuthStore.getState().user;

            // إرسال الرد
            const { error: msgError } = await supabase.from("chat_messages").insert({
                chat_id: selectedChat.id,
                sender_type: "admin",
                sender_id: authUser?.id || null,
                message: replyText.trim(),
            });

            if (msgError) throw msgError;

            // تحديث حالة المحادثة
            await supabase.from("support_chats").update({
                status: "resolved",
                updated_at: new Date().toISOString()
            }).eq("id", selectedChat.id);

            setReplyText("");
            await fetchMessages(selectedChat.id);
            await fetchChats();
            addToast({ type: 'success', message: 'تم إرسال الرد بنجاح' });
        } catch (err: any) {
            addToast({ type: 'error', message: err.message || 'حدث خطأ' });
        } finally {
            setSending(false);
        }
    };

    const handleUpdateStatus = async (chatId: string, status: SupportChat["status"]) => {
        try {
            const supabase = createClient();
            await supabase.from("support_chats").update({
                status,
                updated_at: new Date().toISOString()
            }).eq("id", chatId);

            await fetchChats();
            if (selectedChat?.id === chatId) {
                setSelectedChat({ ...selectedChat, status });
            }
            addToast({ type: 'success', message: 'تم تحديث الحالة' });
        } catch (err: any) {
            addToast({ type: 'error', message: err.message || 'حدث خطأ' });
        }
    };

    // Fetch admins for assignment
    const fetchAdmins = async () => {
        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("profiles")
                .select("id, name, email")
                .eq("role", "admin");

            if (error) throw error;
            setAdmins(data || []);
        } catch (err) {
            logger.error('Error fetching admins', { context: 'AdminSupport', data: err });
        }
    };

    // Assign chat to admin
    const handleAssignChat = async (chatId: string, adminId: string | null) => {
        setAssigningAdmin(true);
        try {
            const supabase = createClient();
            await supabase.from("support_chats").update({
                assigned_to: adminId,
                updated_at: new Date().toISOString()
            }).eq("id", chatId);

            await fetchChats();
            if (selectedChat?.id === chatId) {
                setSelectedChat({ ...selectedChat, assigned_to: adminId });
            }
            addToast({
                type: 'success',
                message: adminId ? 'تم تعيين المحادثة للمسؤول' : 'تم إلغاء تعيين المحادثة'
            });
        } catch (err: any) {
            addToast({ type: 'error', message: err.message || 'حدث خطأ في التعيين' });
        } finally {
            setAssigningAdmin(false);
        }
    };

    // Get assigned admin name
    const getAssignedAdminName = (adminId: string | null) => {
        if (!adminId) return null;
        const admin = admins.find(a => a.id === adminId);
        return admin?.name || admin?.email || 'غير معروف';
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'الآن';
        if (diffMins < 60) return `منذ ${diffMins} د`;
        if (diffHours < 24) return `منذ ${diffHours} س`;
        if (diffDays < 7) return `منذ ${diffDays} يوم`;
        return date.toLocaleDateString('ar-SA');
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500 mb-4" />
                <p className="text-gray-500">جاري تحميل المحادثات...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-8 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-red-600 mb-2">حدث خطأ</h3>
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={fetchChats}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
                >
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
            {/* Header */}
            <motion.div variants={itemVariants} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 p-6 text-white">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                </div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                            <Headphones className="h-7 w-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">محادثات الدعم الفني</h1>
                            <p className="text-white/70 text-sm">إدارة محادثات المستخدمين مع الذكاء الاصطناعي</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchChats}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-medium transition-colors"
                    >
                        <RefreshCw className="h-4 w-4" />
                        <span>تحديث</span>
                    </button>
                </div>
            </motion.div>

            {/* Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-3 gap-4">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white dark:bg-[#1c1c24] rounded-xl p-4 border border-gray-200 dark:border-[#2e2e3a]">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg bg-${s.color}-100 dark:bg-${s.color}-900/30`}>
                                <s.icon className={`h-5 w-5 text-${s.color}-600 dark:text-${s.color}-400`} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                                <p className="text-xs text-gray-500">{s.label}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </motion.div>

            <motion.div variants={itemVariants} className="flex flex-col lg:flex-row gap-6">
                {/* Chats List */}
                <div className="w-full lg:w-96">
                    {/* Filters */}
                    <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-4 border border-gray-200 dark:border-[#2e2e3a] mb-4 space-y-3">
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="بحث بالاسم أو البريد..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-gray-50 dark:bg-[#252530] text-sm focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] text-sm focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">جميع الحالات</option>
                            <option value="open">مفتوحة</option>
                            <option value="pending">بانتظار الرد</option>
                            <option value="resolved">مُنتهية</option>
                        </select>
                    </div>

                    {/* List */}
                    <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] overflow-hidden">
                        <div className="divide-y divide-gray-200 dark:divide-[#2e2e3a] max-h-[500px] overflow-y-auto">
                            {paginated.length === 0 ? (
                                <div className="p-8 text-center">
                                    <MessageSquare className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-500">لا توجد محادثات</p>
                                </div>
                            ) : paginated.map(chat => {
                                const status = statusTypes[chat.status || 'open'] || statusTypes.open;
                                return (
                                    <button
                                        key={chat.id}
                                        onClick={() => handleSelectChat(chat)}
                                        className={`w-full text-right p-4 hover:bg-gray-50 dark:hover:bg-[#252530] transition-colors ${selectedChat?.id === chat.id ? "bg-primary-50 dark:bg-primary-900/20 border-r-4 border-primary-500" : ""
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                {(chat.subject || 'مستخدم').charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                        {chat.subject || 'محادثة دعم'}
                                                    </span>
                                                    <span className="text-xs text-gray-400 shrink-0">
                                                        {formatTimeAgo(chat.updated_at || chat.created_at || new Date().toISOString())}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 truncate">ID: {chat.user_id?.slice(0, 8) || 'غير معروف'}</p>
                                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium ${status.bgColor} ${status.color}`}>
                                                        <status.icon className="h-3 w-3" />
                                                        {status.label}
                                                    </span>
                                                    {chat.assigned_to && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                                                            <Shield className="h-3 w-3" />
                                                            {getAssignedAdminName(chat.assigned_to)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-[#2e2e3a]">
                                <span className="text-sm text-gray-500">{page}/{totalPages}</span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#252530] disabled:opacity-50 transition-colors"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-[#252530] disabled:opacity-50 transition-colors"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Detail */}
                <div className="flex-1 bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200 dark:border-[#2e2e3a] overflow-hidden flex flex-col min-h-[600px]">
                    {selectedChat ? (
                        <>
                            {/* Header */}
                            <div className="p-4 border-b border-gray-200 dark:border-[#2e2e3a] flex items-center justify-between bg-gray-50 dark:bg-[#252530]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                                        {(selectedChat.subject || 'محادثة دعم').charAt(0)}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{selectedChat.subject || 'محادثة دعم'}</p>
                                        <p className="text-xs text-gray-500">ID: {selectedChat.user_id?.slice(0, 8) || 'غير معروف'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Assign to Admin */}
                                    <select
                                        value={selectedChat.assigned_to || ''}
                                        onChange={e => handleAssignChat(selectedChat.id, e.target.value || null)}
                                        disabled={assigningAdmin}
                                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] text-sm disabled:opacity-50"
                                        title="تعيين لمسؤول"
                                    >
                                        <option value="">غير معيّن</option>
                                        {admins.map(admin => (
                                            <option key={admin.id} value={admin.id}>
                                                {admin.name || admin.email}
                                            </option>
                                        ))}
                                    </select>
                                    {/* Status */}
                                    <select
                                        value={selectedChat.status || 'open'}
                                        onChange={e => handleUpdateStatus(selectedChat.id, e.target.value as SupportChat["status"])}
                                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24] text-sm"
                                    >
                                        <option value="open">مفتوحة</option>
                                        <option value="pending">بانتظار الرد</option>
                                        <option value="resolved">مُنتهية</option>
                                    </select>
                                    <button
                                        onClick={() => setSelectedChat(null)}
                                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#1c1c24] transition-colors"
                                    >
                                        <X className="h-5 w-5 text-gray-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50 dark:bg-[#0f0f12]/50">
                                {loadingMessages ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                                        <p>لا توجد رسائل بعد</p>
                                    </div>
                                ) : (
                                    messages.map((msg) => (
                                        <motion.div
                                            key={msg.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`flex ${msg.sender_type === "user" ? "justify-start" : "justify-end"}`}
                                        >
                                            <div className={`flex items-end gap-2 max-w-[80%] ${msg.sender_type === "user" ? "flex-row" : "flex-row-reverse"}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender_type === "user"
                                                    ? "bg-gray-200 dark:bg-gray-700"
                                                    : msg.sender_type === "system"
                                                        ? "bg-gradient-to-br from-primary-400 to-primary-600"
                                                        : "bg-green-500"
                                                    }`}>
                                                    {msg.sender_type === "user" ? (
                                                        <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                                                    ) : msg.sender_type === "admin" ? (
                                                        <Shield className="h-4 w-4 text-white" />
                                                    ) : (
                                                        <Bot className="h-4 w-4 text-white" />
                                                    )}
                                                </div>
                                                <div className={`p-3 rounded-2xl ${msg.sender_type === "user"
                                                    ? "bg-white dark:bg-[#1c1c24] text-gray-900 dark:text-white rounded-br-sm shadow-sm"
                                                    : msg.sender_type === "system"
                                                        ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-bl-sm shadow-lg"
                                                        : "bg-green-500 text-white rounded-bl-sm shadow-lg"
                                                    }`}>
                                                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                                    <p className={`text-xs mt-1 ${msg.sender_type === "user" ? "text-gray-400" : "text-white/70"
                                                        }`}>
                                                        {new Date(msg.created_at || new Date()).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                                                        {msg.sender_type === "system" && " • AI"}
                                                        {msg.sender_type === "admin" && " • أدمن"}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply */}
                            <div className="p-4 border-t border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#1c1c24]">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        onKeyPress={e => e.key === "Enter" && handleSendReply()}
                                        placeholder="اكتب ردك..."
                                        disabled={sending}
                                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-gray-50 dark:bg-[#252530] text-sm disabled:opacity-50 focus:ring-2 focus:ring-primary-500"
                                    />
                                    <button
                                        onClick={handleSendReply}
                                        disabled={sending || !replyText.trim()}
                                        className="px-5 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium disabled:opacity-50 flex items-center gap-2 transition-colors"
                                    >
                                        {sending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4" />
                                                <span>رد</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium">اختر محادثة لعرضها</p>
                                <p className="text-sm mt-1">ستظهر هنا تفاصيل المحادثة</p>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
