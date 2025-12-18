"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Search, CheckCircle2, Clock, AlertCircle, User, Bot, Send, Loader2, RefreshCw, ChevronLeft, ChevronRight, X } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

type SupportChat = Database["public"]["Tables"]["support_chats"]["Row"];
type ChatMessage = Database["public"]["Tables"]["chat_messages"]["Row"];

const statusTypes: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
    open: { label: "مفتوحة", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600", icon: MessageSquare },
    pending: { label: "بانتظار الرد", color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600", icon: Clock },
    resolved: { label: "مُنتهية", color: "bg-green-100 dark:bg-green-900/30 text-green-600", icon: CheckCircle2 },
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
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const itemsPerPage = 10;

    const fetchChats = async () => {
        setLoading(true);
        setError(null);
        try {
            const supabase = createClient();
            const { data, error } = await supabase.from("support_chats").select("*").order("updated_at", { ascending: false });
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
        try {
            const supabase = createClient();
            const { data, error } = await supabase.from("chat_messages").select("*").eq("chat_id", chatId).order("created_at", { ascending: true });
            if (error) throw error;
            setMessages(data || []);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => { fetchChats(); }, []);

    useEffect(() => {
        if (selectedChat) fetchMessages(selectedChat.id);
    }, [selectedChat]);

    const filtered = chats.filter((c) => {
        const matchSearch = c.user_name.toLowerCase().includes(search.toLowerCase()) || c.user_email.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "all" || c.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    const stats = [
        { label: "إجمالي المحادثات", value: chats.length, icon: MessageSquare, color: "from-blue-500 to-blue-600" },
        { label: "بانتظار الرد", value: chats.filter(c => c.status === "pending").length, icon: Clock, color: "from-amber-500 to-amber-600" },
        { label: "مُنتهية", value: chats.filter(c => c.status === "resolved").length, icon: CheckCircle2, color: "from-green-500 to-green-600" },
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
            const { data: { user } } = await supabase.auth.getUser();

            // إرسال الرد
            await supabase.from("chat_messages").insert({
                chat_id: selectedChat.id,
                sender_type: "admin",
                sender_id: user?.id || null,
                message: replyText.trim(),
            });

            // تحديث حالة المحادثة
            await supabase.from("support_chats").update({ status: "resolved", updated_at: new Date().toISOString() }).eq("id", selectedChat.id);

            setReplyText("");
            await fetchMessages(selectedChat.id);
            await fetchChats();
        } catch (err: any) {
            alert("خطأ: " + err.message);
        } finally {
            setSending(false);
        }
    };

    const handleUpdateStatus = async (chatId: string, status: SupportChat["status"]) => {
        try {
            const supabase = createClient();
            await supabase.from("support_chats").update({ status, updated_at: new Date().toISOString() }).eq("id", chatId);
            await fetchChats();
            if (selectedChat?.id === chatId) {
                setSelectedChat({ ...selectedChat, status });
            }
        } catch (err: any) {
            alert("خطأ: " + err.message);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
    if (error) return <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center"><AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" /><p className="text-red-600">{error}</p><button onClick={fetchChats} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg">إعادة المحاولة</button></div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div><h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">محادثات الدعم</h1><p className="text-gray-600 dark:text-gray-400 mt-1">إدارة محادثات المستخدمين مع الذكاء الاصطناعي</p></div>
                <button onClick={fetchChats} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-gray-800 text-sm font-medium"><RefreshCw className="h-4 w-4" /></button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {stats.map((s, i) => (
                    <div key={i} className="bg-white dark:bg-[#1c1c24] rounded-2xl p-5 border border-gray-200/60 dark:border-gray-800">
                        <div className="flex items-center gap-3">
                            <div className={`p-3 rounded-xl bg-gradient-to-br ${s.color} shadow-lg`}><s.icon className="h-5 w-5 text-white" /></div>
                            <div><p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p><p className="text-sm text-gray-500">{s.label}</p></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Chats List */}
                <div className="w-full lg:w-96">
                    {/* Filters */}
                    <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-4 border border-gray-200/60 dark:border-gray-800 mb-4 space-y-3">
                        <div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="text" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pr-9 pl-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm outline-none" /></div>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm outline-none"><option value="all">جميع الحالات</option><option value="open">مفتوحة</option><option value="pending">بانتظار الرد</option><option value="resolved">مُنتهية</option></select>
                    </div>

                    {/* List */}
                    <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
                        <div className="divide-y divide-gray-200 dark:divide-gray-800 max-h-[500px] overflow-y-auto">
                            {paginated.length === 0 ? (<div className="p-8 text-center text-gray-500">لا توجد محادثات</div>) : paginated.map(chat => {
                                const status = statusTypes[chat.status] || statusTypes.open;
                                return (
                                    <button key={chat.id} onClick={() => handleSelectChat(chat)} className={`w-full text-right p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedChat?.id === chat.id ? "bg-primary-50 dark:bg-primary-900/20" : ""}`}>
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm shrink-0">{chat.user_name.charAt(0)}</div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium text-gray-900 dark:text-white truncate">{chat.user_name}</span><span className="text-xs text-gray-400 shrink-0">{new Date(chat.updated_at).toLocaleDateString("ar-SA")}</span></div>
                                                <p className="text-xs text-gray-500 truncate">{chat.user_email}</p>
                                                <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-xs font-medium ${status.color}`}><status.icon className="h-3 w-3" />{status.label}</span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        {totalPages > 1 && <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-800"><span className="text-sm text-gray-500">{page}/{totalPages}</span><div className="flex gap-1"><button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button><button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button></div></div>}
                    </div>
                </div>

                {/* Chat Detail */}
                <div className="flex-1 bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden flex flex-col min-h-[600px]">
                    {selectedChat ? (
                        <>
                            {/* Header */}
                            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">{selectedChat.user_name.charAt(0)}</div>
                                    <div><p className="font-semibold text-gray-900 dark:text-white">{selectedChat.user_name}</p><p className="text-xs text-gray-500">{selectedChat.user_email}</p></div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select value={selectedChat.status} onChange={e => handleUpdateStatus(selectedChat.id, e.target.value as SupportChat["status"])} className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm outline-none"><option value="open">مفتوحة</option><option value="pending">بانتظار الرد</option><option value="resolved">مُنتهية</option></select>
                                    <button onClick={() => setSelectedChat(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><X className="h-5 w-5 text-gray-500" /></button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                                {messages.map((msg) => (
                                    <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.sender_type === "user" ? "justify-start" : "justify-end"}`}>
                                        <div className={`flex items-end gap-2 max-w-[80%] ${msg.sender_type === "user" ? "flex-row" : "flex-row-reverse"}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender_type === "user" ? "bg-gray-200 dark:bg-gray-700" : msg.sender_type === "ai" ? "bg-gradient-to-br from-primary-400 to-primary-600" : "bg-green-500"}`}>
                                                {msg.sender_type === "user" ? <User className="h-4 w-4 text-gray-600 dark:text-gray-300" /> : <Bot className="h-4 w-4 text-white" />}
                                            </div>
                                            <div className={`p-3 rounded-2xl ${msg.sender_type === "user" ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-tr-sm" : msg.sender_type === "ai" ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-tl-sm" : "bg-green-500 text-white rounded-tl-sm"}`}>
                                                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                                <p className={`text-xs mt-1 ${msg.sender_type === "user" ? "text-gray-400" : "text-white/70"}`}>{new Date(msg.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })} {msg.sender_type === "ai" && "• AI"}{msg.sender_type === "admin" && "• أنت"}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Reply */}
                            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                                <div className="flex gap-2">
                                    <input type="text" value={replyText} onChange={e => setReplyText(e.target.value)} onKeyPress={e => e.key === "Enter" && handleSendReply()} placeholder="اكتب ردك..." disabled={sending} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none text-sm disabled:opacity-50" />
                                    <button onClick={handleSendReply} disabled={sending || !replyText.trim()} className="px-4 py-2.5 rounded-xl bg-green-500 text-white disabled:opacity-50 flex items-center gap-2">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" />رد</>}</button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400"><div className="text-center"><MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" /><p>اختر محادثة لعرضها</p></div></div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
