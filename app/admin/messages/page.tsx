"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Search, Inbox, Send, Star, Trash2, Archive, CheckCheck, Reply, X, Loader2, RefreshCw, Mail, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Database } from "@/lib/database.types";

type Message = Database["public"]["Tables"]["messages"]["Row"];

const folders = [
    { id: "inbox", label: "الوارد", icon: Inbox },
    { id: "starred", label: "المميز", icon: Star },
    { id: "replied", label: "المردود", icon: Send },
    { id: "archive", label: "الأرشيف", icon: Archive },
];

export default function MessagesPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [activeFolder, setActiveFolder] = useState("inbox");
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [replyText, setReplyText] = useState("");
    const [sending, setSending] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const supabase = createClient();
            const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: false });
            if (error) {
                if (error.code === "42P01") {
                    setError("جدول الرسائل غير موجود. يرجى تنفيذ الـ migration أولاً.");
                    return;
                }
                throw error;
            }
            setMessages(data || []);
        } catch (err: any) {
            setError(err.message || "حدث خطأ في جلب البيانات");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const getFilteredMessages = () => {
        let filtered = messages;
        switch (activeFolder) {
            case "inbox": filtered = messages.filter(m => !m.is_archived); break;
            case "starred": filtered = messages.filter(m => m.is_starred && !m.is_archived); break;
            case "replied": filtered = messages.filter(m => m.is_replied); break;
            case "archive": filtered = messages.filter(m => m.is_archived); break;
            default: filtered = messages;
        }
        if (search) {
            filtered = filtered.filter(m => m.subject.toLowerCase().includes(search.toLowerCase()) || m.from_name.toLowerCase().includes(search.toLowerCase()) || m.message.toLowerCase().includes(search.toLowerCase()));
        }
        return filtered;
    };

    const filteredMessages = getFilteredMessages();
    const unreadCount = messages.filter(m => !m.is_read && !m.is_archived).length;

    const handleSelect = async (message: Message) => {
        setSelectedMessage(message);
        if (!message.is_read) {
            try {
                const supabase = createClient();
                await supabase.from("messages").update({ is_read: true }).eq("id", message.id);
                setMessages(prev => prev.map(m => m.id === message.id ? { ...m, is_read: true } : m));
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleStar = async (messageId: string) => {
        try {
            const supabase = createClient();
            const message = messages.find(m => m.id === messageId);
            if (!message) return;
            await supabase.from("messages").update({ is_starred: !message.is_starred }).eq("id", messageId);
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_starred: !m.is_starred } : m));
            if (selectedMessage?.id === messageId) setSelectedMessage({ ...selectedMessage, is_starred: !selectedMessage.is_starred });
        } catch (err: any) {
            alert("خطأ: " + err.message);
        }
    };

    const handleArchive = async (messageId: string) => {
        try {
            const supabase = createClient();
            await supabase.from("messages").update({ is_archived: true }).eq("id", messageId);
            setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_archived: true } : m));
            setSelectedMessage(null);
        } catch (err: any) {
            alert("خطأ: " + err.message);
        }
    };

    const handleDelete = async (messageId: string) => {
        if (!confirm("هل أنت متأكد من حذف هذه الرسالة؟")) return;
        try {
            const supabase = createClient();
            await supabase.from("messages").delete().eq("id", messageId);
            setMessages(prev => prev.filter(m => m.id !== messageId));
            setSelectedMessage(null);
        } catch (err: any) {
            alert("خطأ: " + err.message);
        }
    };

    const handleReply = async () => {
        if (!selectedMessage || !replyText.trim()) return;
        setSending(true);
        try {
            const supabase = createClient();
            await supabase.from("messages").update({ is_replied: true, reply_text: replyText, replied_at: new Date().toISOString() }).eq("id", selectedMessage.id);
            setMessages(prev => prev.map(m => m.id === selectedMessage.id ? { ...m, is_replied: true, reply_text: replyText } : m));
            setShowReplyModal(false);
            setReplyText("");
            alert("تم إرسال الرد بنجاح");
        } catch (err: any) {
            alert("خطأ: " + err.message);
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>;
    if (error) return <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center"><AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" /><p className="text-red-600">{error}</p><button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg">إعادة المحاولة</button></div>;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div><h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white">الرسائل</h1><p className="text-gray-600 dark:text-gray-400 mt-1">إدارة رسائل المستخدمين ({messages.length})</p></div>
                <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#1c1c24] border border-gray-200 dark:border-gray-800 text-sm font-medium"><RefreshCw className="h-4 w-4" /></button>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar */}
                <div className="w-full lg:w-64 space-y-2">
                    {folders.map(folder => {
                        const count = folder.id === "inbox" ? unreadCount : folder.id === "starred" ? messages.filter(m => m.is_starred).length : 0;
                        return (
                            <button key={folder.id} onClick={() => { setActiveFolder(folder.id); setSelectedMessage(null); }} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${activeFolder === folder.id ? "bg-primary-100 dark:bg-primary-900/30 text-primary-600" : "bg-white dark:bg-[#1c1c24] hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"}`}>
                                <div className="flex items-center gap-3"><folder.icon className="h-5 w-5" /><span className="font-medium">{folder.label}</span></div>
                                {count > 0 && <span className="bg-primary-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{count}</span>}
                            </button>
                        );
                    })}
                </div>

                {/* Messages List & Detail */}
                <div className="flex-1 flex flex-col lg:flex-row gap-4">
                    {/* List */}
                    <div className="w-full lg:w-80 bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-800"><div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="text" placeholder="بحث..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pr-9 pl-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-sm outline-none" /></div></div>
                        <div className="divide-y divide-gray-200 dark:divide-gray-800 max-h-[500px] overflow-y-auto">
                            {filteredMessages.length === 0 ? (<div className="p-8 text-center text-gray-500">لا توجد رسائل</div>) : filteredMessages.map(message => (
                                <button key={message.id} onClick={() => handleSelect(message)} className={`w-full text-right p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedMessage?.id === message.id ? "bg-primary-50 dark:bg-primary-900/20" : ""} ${!message.is_read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}>
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm shrink-0">{message.from_name.charAt(0)}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2"><span className={`text-sm truncate ${!message.is_read ? "font-bold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>{message.from_name}</span><span className="text-xs text-gray-400 shrink-0">{new Date(message.created_at).toLocaleDateString("ar-SA")}</span></div>
                                            <p className={`text-sm truncate ${!message.is_read ? "font-semibold text-gray-800 dark:text-gray-200" : "text-gray-600 dark:text-gray-400"}`}>{message.subject}</p>
                                            <p className="text-xs text-gray-500 truncate">{message.message}</p>
                                        </div>
                                        {message.is_starred && <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Detail */}
                    <div className="flex-1 bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
                        {selectedMessage ? (
                            <div className="h-full flex flex-col">
                                <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                                    <h3 className="font-bold text-gray-900 dark:text-white">{selectedMessage.subject}</h3>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleStar(selectedMessage.id)} className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${selectedMessage.is_starred ? "text-amber-500" : "text-gray-400"}`}><Star className={`h-5 w-5 ${selectedMessage.is_starred ? "fill-current" : ""}`} /></button>
                                        <button onClick={() => handleArchive(selectedMessage.id)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><Archive className="h-5 w-5" /></button>
                                        <button onClick={() => handleDelete(selectedMessage.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 className="h-5 w-5" /></button>
                                    </div>
                                </div>
                                <div className="flex-1 p-6 overflow-y-auto">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">{selectedMessage.from_name.charAt(0)}</div>
                                        <div><p className="font-semibold text-gray-900 dark:text-white">{selectedMessage.from_name}</p><p className="text-sm text-gray-500">{selectedMessage.from_email}</p></div>
                                        <div className="mr-auto text-sm text-gray-400">{new Date(selectedMessage.created_at).toLocaleString("ar-SA")}</div>
                                    </div>
                                    <div className="prose dark:prose-invert max-w-none"><p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{selectedMessage.message}</p></div>
                                    {selectedMessage.is_replied && <div className="mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"><div className="flex items-center gap-2 text-green-600 text-sm mb-2"><CheckCheck className="h-4 w-4" />تم الرد</div><p className="text-gray-700 dark:text-gray-300 text-sm">{selectedMessage.reply_text}</p></div>}
                                </div>
                                {!selectedMessage.is_replied && <div className="p-4 border-t border-gray-200 dark:border-gray-800"><button onClick={() => setShowReplyModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600"><Reply className="h-4 w-4" />رد</button></div>}
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400"><div className="text-center"><Mail className="h-16 w-16 mx-auto mb-4 opacity-50" /><p>اختر رسالة لعرضها</p></div></div>
                        )}
                    </div>
                </div>
            </div>

            {/* Reply Modal */}
            <AnimatePresence>
                {showReplyModal && selectedMessage && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowReplyModal(false)}>
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 w-full max-w-lg">
                            <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">الرد على: {selectedMessage.from_name}</h2><button onClick={() => setShowReplyModal(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button></div>
                            <div className="mb-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"><p className="text-sm text-gray-500">الموضوع: {selectedMessage.subject}</p></div>
                            <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={6} placeholder="اكتب ردك هنا..." className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none resize-none" />
                            <div className="flex gap-3 mt-4"><button onClick={() => setShowReplyModal(false)} className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 font-medium">إلغاء</button><button onClick={handleReply} disabled={sending || !replyText.trim()} className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2">{sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="h-4 w-4" />إرسال</>}</button></div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
