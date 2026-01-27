"use client";

/**
 * Support Page - صفحة الدعم الفني
 * 
 * Allows users to create and view their support chats.
 * Uses support_chats and chat_messages tables.
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
    MessageSquare,
    Send,
    Plus,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    Loader2,
    Headphones,
    Sparkles,
    User,
    Bot,
    X,
    ChevronDown,
    HelpCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

// ==========================================
// Types
// ==========================================
interface SupportChat {
    id: string;
    user_id: string | null;
    subject: string | null;
    status: string | null;
    created_at: string | null;
    updated_at: string | null;
}

interface ChatMessage {
    id: string;
    chat_id: string;
    sender_id: string | null;
    sender_type: "user" | "admin" | "system";
    message: string;
    is_ai_response: boolean | null;
    created_at: string | null;
}

// ==========================================
// Status Config
// ==========================================
const statusConfig = {
    open: {
        label: "مفتوحة",
        color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
        icon: MessageSquare,
    },
    pending: {
        label: "قيد الانتظار",
        color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
        icon: Clock,
    },
    closed: {
        label: "مغلقة",
        color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
        icon: CheckCircle2,
    },
};

// ==========================================
// FAQ Data
// ==========================================
const quickFaqs = [
    {
        question: "كيف يمكنني تغيير كلمة المرور؟",
        answer: "للحفاظ على أمان حسابك، يرجى التواصل مع الأدمن لتغيير كلمة المرور.",
    },
    {
        question: "كيف أشترك مع معلم؟",
        answer: "اذهب إلى صفحة المعلم واضغط على زر 'اشترك' للمتابعة.",
    },
    {
        question: "هل يمكنني إعادة الامتحان؟",
        answer: "بعض الامتحانات تسمح بإعادة المحاولة، تحقق من إعدادات الامتحان.",
    },
];

// ==========================================
// Chat List Item Component
// ==========================================
function ChatListItem({
    chat,
    isSelected,
    onClick,
}: {
    chat: SupportChat;
    isSelected: boolean;
    onClick: () => void;
}) {
    const statusKey = (chat.status || "open") as keyof typeof statusConfig;
    const status = statusConfig[statusKey];
    const StatusIcon = status.icon;

    return (
        <motion.div
            whileHover={{ x: -4 }}
            onClick={onClick}
            className={`p-4 rounded-xl cursor-pointer transition-all ${isSelected
                ? "bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500"
                : "bg-white dark:bg-[#0f172a]/80 border border-gray-100 dark:border-gray-800 hover:border-primary-500/30"
                }`}
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {chat.subject || "محادثة دعم"}
                </h4>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${status.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(chat.updated_at || Date.now()).toLocaleDateString("ar-EG", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                })}
            </p>
        </motion.div>
    );
}

// ==========================================
// Message Bubble Component
// ==========================================
function MessageBubble({ message, isOwn }: { message: ChatMessage; isOwn: boolean }) {
    const isSystem = message.sender_type === "system" || message.is_ai_response;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${isOwn ? "justify-start" : "justify-end"}`}
        >
            <div className={`flex items-end gap-2 max-w-[80%] ${isOwn ? "flex-row" : "flex-row-reverse"}`}>
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isOwn
                    ? "bg-primary-100 dark:bg-primary-900/30"
                    : isSystem
                        ? "bg-purple-100 dark:bg-purple-900/30"
                        : "bg-green-100 dark:bg-green-900/30"
                    }`}>
                    {isOwn ? (
                        <User className="w-4 h-4 text-primary-500" />
                    ) : isSystem ? (
                        <Bot className="w-4 h-4 text-purple-500" />
                    ) : (
                        <Headphones className="w-4 h-4 text-green-500" />
                    )}
                </div>

                {/* Message */}
                <div className={`px-4 py-3 rounded-2xl ${isOwn
                    ? "bg-primary-500 text-white rounded-br-sm"
                    : isSystem
                        ? "bg-purple-50 dark:bg-purple-900/20 text-gray-800 dark:text-gray-200 rounded-bl-sm"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-sm"
                    }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    <p className={`text-xs mt-1 ${isOwn ? "text-white/70" : "text-gray-400"}`}>
                        {new Date(message.created_at || Date.now()).toLocaleTimeString("ar-EG", {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </p>
                </div>
            </div>
        </motion.div>
    );
}

// ==========================================
// New Chat Modal Component
// ==========================================
function NewChatModal({
    isOpen,
    onClose,
    onCreate,
}: {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (subject: string, message: string) => Promise<void>;
}) {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!subject.trim() || !message.trim()) return;
        setIsCreating(true);
        try {
            await onCreate(subject, message);
            setSubject("");
            setMessage("");
            onClose();
        } catch (error) {
            console.error("Error creating chat:", error);
        } finally {
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-white dark:bg-[#0f172a] rounded-3xl shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                                <Plus className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                    محادثة جديدة
                                </h3>
                                <p className="text-sm text-gray-500">
                                    أخبرنا كيف يمكننا مساعدتك
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            موضوع المحادثة
                        </label>
                        <select
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-gray-900 dark:text-white"
                        >
                            <option value="">اختر الموضوع</option>
                            <option value="مشكلة تقنية">مشكلة تقنية</option>
                            <option value="استفسار عن الحساب">استفسار عن الحساب</option>
                            <option value="مشكلة في الامتحان">مشكلة في الامتحان</option>
                            <option value="اقتراح أو ملاحظة">اقتراح أو ملاحظة</option>
                            <option value="أخرى">أخرى</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            رسالتك
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="اشرح مشكلتك أو استفسارك بالتفصيل..."
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-gray-900 dark:text-white placeholder-gray-400 resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!subject.trim() || !message.trim() || isCreating}
                        className="flex-1 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                    >
                        {isCreating ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                إرسال
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ==========================================
// Main Component
// ==========================================
export default function SupportPage() {
    const { user } = useAuth();
    const router = useRouter();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [chats, setChats] = useState<SupportChat[]>([]);
    const [selectedChat, setSelectedChat] = useState<SupportChat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [newMessage, setNewMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    // Fetch user's chats
    useEffect(() => {
        if (!user) return;

        const fetchChats = async () => {
            setIsLoading(true);
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from("support_chats")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("updated_at", { ascending: false });

                if (error) throw error;
                setChats(data || []);

                // Auto-select first chat if exists
                if (data && data.length > 0 && !selectedChat) {
                    setSelectedChat(data[0]);
                }
            } catch (error) {
                console.error("Error fetching chats:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchChats();
    }, [user]);

    // Fetch messages when chat is selected
    useEffect(() => {
        if (!selectedChat) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            setIsLoadingMessages(true);
            try {
                const supabase = createClient();
                const { data, error } = await supabase
                    .from("chat_messages")
                    .select("*")
                    .eq("chat_id", selectedChat.id)
                    .order("created_at", { ascending: true });

                if (error) throw error;
                setMessages(data || []);
            } catch (error) {
                console.error("Error fetching messages:", error);
            } finally {
                setIsLoadingMessages(false);
            }
        };

        fetchMessages();
    }, [selectedChat?.id]);

    // Scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Create new chat
    const handleCreateChat = async (subject: string, message: string) => {
        if (!user) return;

        const supabase = createClient();

        // Create chat
        const { data: chat, error: chatError } = await supabase
            .from("support_chats")
            .insert({
                user_id: user.id,
                subject,
                status: "open",
            })
            .select()
            .single();

        if (chatError) throw chatError;

        // Send first message
        const { error: msgError } = await supabase.from("chat_messages").insert({
            chat_id: chat.id,
            sender_id: user.id,
            sender_type: "user",
            message,
        });

        if (msgError) throw msgError;

        // Update state
        setChats((prev) => [chat, ...prev]);
        setSelectedChat(chat);
    };

    // Send message
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedChat || !user) return;

        setIsSending(true);
        try {
            const supabase = createClient();

            const { data, error } = await supabase
                .from("chat_messages")
                .insert({
                    chat_id: selectedChat.id,
                    sender_id: user.id,
                    sender_type: "user",
                    message: newMessage,
                })
                .select()
                .single();

            if (error) throw error;

            setMessages((prev) => [...prev, data]);
            setNewMessage("");

            // Update chat's updated_at
            await supabase
                .from("support_chats")
                .update({ updated_at: new Date().toISOString() })
                .eq("id", selectedChat.id);
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsSending(false);
        }
    };

    // Not logged in
    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-[#0a0f1a] dark:via-[#0f172a] dark:to-[#0a0f1a]" dir="rtl">
                <Navbar />
                <section className="pt-32 pb-16 px-4">
                    <div className="container mx-auto max-w-lg text-center">
                        <div className="w-20 h-20 rounded-3xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-6">
                            <Headphones className="w-10 h-10 text-primary-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            الدعم الفني
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            سجل دخولك للتواصل مع فريق الدعم
                        </p>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
                        >
                            تسجيل الدخول
                        </Link>
                    </div>
                </section>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-[#0a0f1a] dark:via-[#0f172a] dark:to-[#0a0f1a]" dir="rtl">
            <Navbar />

            <section className="pt-24 pb-8 px-4">
                <div className="container mx-auto max-w-6xl">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6"
                    >
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                                <Headphones className="w-8 h-8 text-primary-500" />
                                الدعم الفني
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                نحن هنا لمساعدتك
                            </p>
                        </div>
                        <button
                            onClick={() => setShowNewChatModal(true)}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                            محادثة جديدة
                        </button>
                    </motion.div>

                    {/* Main Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid lg:grid-cols-3 gap-6"
                    >
                        {/* Chat List */}
                        <div className="lg:col-span-1">
                            <div className="bg-white dark:bg-[#0f172a]/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                                    محادثاتي ({chats.length})
                                </h3>

                                {isLoading ? (
                                    <div className="flex items-center justify-center h-32">
                                        <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                                    </div>
                                ) : chats.length === 0 ? (
                                    <div className="text-center py-8">
                                        <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            لا توجد محادثات بعد
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {chats.map((chat) => (
                                            <ChatListItem
                                                key={chat.id}
                                                chat={chat}
                                                isSelected={selectedChat?.id === chat.id}
                                                onClick={() => setSelectedChat(chat)}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Quick FAQs */}
                            <div className="bg-white dark:bg-[#0f172a]/80 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mt-4">
                                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <HelpCircle className="w-5 h-5 text-amber-500" />
                                    أسئلة شائعة
                                </h3>
                                <div className="space-y-3">
                                    {quickFaqs.map((faq, idx) => (
                                        <div key={idx} className="p-3 rounded-xl bg-gray-50 dark:bg-[#1e293b]/50">
                                            <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                                                {faq.question}
                                            </h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {faq.answer}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Chat Window */}
                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-[#0f172a]/80 rounded-2xl border border-gray-100 dark:border-gray-800 h-[600px] flex flex-col">
                                {selectedChat ? (
                                    <>
                                        {/* Chat Header */}
                                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                                    {selectedChat.subject || "محادثة دعم"}
                                                </h3>
                                                <span className={`inline-flex items-center gap-1 text-xs mt-1 ${statusConfig[(selectedChat.status || "open") as keyof typeof statusConfig].color
                                                    } px-2 py-0.5 rounded-full`}>
                                                    {statusConfig[(selectedChat.status || "open") as keyof typeof statusConfig].label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Messages */}
                                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                            {isLoadingMessages ? (
                                                <div className="flex items-center justify-center h-full">
                                                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                                                </div>
                                            ) : messages.length === 0 ? (
                                                <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                                    <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                                                    <p>لا توجد رسائل بعد</p>
                                                </div>
                                            ) : (
                                                messages.map((msg) => (
                                                    <MessageBubble
                                                        key={msg.id}
                                                        message={msg}
                                                        isOwn={msg.sender_id === user.id}
                                                    />
                                                ))
                                            )}
                                            <div ref={messagesEndRef} />
                                        </div>

                                        {/* Input */}
                                        {selectedChat.status !== "closed" && (
                                            <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="text"
                                                        value={newMessage}
                                                        onChange={(e) => setNewMessage(e.target.value)}
                                                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                                                        placeholder="اكتب رسالتك..."
                                                        className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1e293b] border border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-gray-900 dark:text-white placeholder-gray-400"
                                                    />
                                                    <button
                                                        onClick={handleSendMessage}
                                                        disabled={!newMessage.trim() || isSending}
                                                        className="p-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                    >
                                                        {isSending ? (
                                                            <Loader2 className="w-5 h-5 animate-spin" />
                                                        ) : (
                                                            <Send className="w-5 h-5" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {selectedChat.status === "closed" && (
                                            <div className="p-4 border-t border-gray-100 dark:border-gray-800 text-center">
                                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                                    تم إغلاق هذه المحادثة
                                                </p>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                                        <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                                            <MessageSquare className="w-10 h-10 text-gray-400" />
                                        </div>
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                            اختر محادثة أو ابدأ محادثة جديدة
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                                            فريق الدعم سيرد عليك في أقرب وقت
                                        </p>
                                        <button
                                            onClick={() => setShowNewChatModal(true)}
                                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-medium transition-colors"
                                        >
                                            <Plus className="w-5 h-5" />
                                            محادثة جديدة
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* New Chat Modal */}
            <AnimatePresence>
                {showNewChatModal && (
                    <NewChatModal
                        isOpen={showNewChatModal}
                        onClose={() => setShowNewChatModal(false)}
                        onCreate={handleCreateChat}
                    />
                )}
            </AnimatePresence>

            <Footer />
        </div>
    );
}
