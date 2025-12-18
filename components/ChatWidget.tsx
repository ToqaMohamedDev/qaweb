"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Loader2, Minimize2, Maximize2, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase";

interface Message {
    id: string;
    sender_type: "user" | "ai" | "admin";
    message: string;
    created_at: string;
}

// ردود الذكاء الاصطناعي المبرمجة
const aiResponses: Record<string, string[]> = {
    مرحبا: ["مرحباً بك! كيف يمكنني مساعدتك اليوم؟ 😊"],
    اهلا: ["أهلاً وسهلاً! أنا هنا لمساعدتك. ما الذي تحتاجه؟"],
    سلام: ["وعليكم السلام! كيف يمكنني خدمتك؟ 😊"],
    تسجيل: ["للتسجيل في المنصة، اضغط على زر 'إنشاء حساب' في الأعلى واتبع الخطوات. هل تحتاج مساعدة في شيء آخر؟"],
    دخول: ["لتسجيل الدخول، اضغط على زر 'تسجيل الدخول' في الأعلى وأدخل بريدك الإلكتروني وكلمة المرور."],
    نسيت: ["إذا نسيت كلمة المرور، اضغط على 'نسيت كلمة المرور' في صفحة تسجيل الدخول وسيتم إرسال رابط إعادة التعيين لبريدك."],
    كلمة: ["إذا نسيت كلمة المرور، اضغط على 'نسيت كلمة المرور' في صفحة تسجيل الدخول."],
    امتحان: ["يمكنك الوصول للامتحانات من الصفحة الرئيسية. اختر المادة ثم الامتحان الذي تريده. هل تحتاج مساعدة في شيء محدد؟"],
    اختبار: ["الاختبارات متاحة بعد تسجيل الدخول. اذهب للمادة واختر الاختبار المناسب."],
    درس: ["الدروس متاحة في كل مادة. اختر المادة من القائمة الرئيسية لعرض الدروس المتاحة."],
    معلم: ["يمكنك تصفح المعلمين من قسم 'المدرسين'. اختر المعلم لعرض امتحاناته ودروسه."],
    مدرس: ["قسم المدرسين يعرض جميع المعلمين المتميزين. يمكنك اختيار أي معلم لعرض محتواه."],
    اشتراك: ["المنصة مجانية حالياً! استمتع بجميع الميزات بدون رسوم."],
    مجاني: ["نعم، المنصة مجانية تماماً! سجل الآن واستمتع بجميع الميزات."],
    مشكلة: ["أنا آسف لسماع ذلك. يرجى وصف المشكلة بالتفصيل وسأحاول مساعدتك أو تحويلك للدعم الفني."],
    عربي: ["قسم اللغة العربية يحتوي على دروس وامتحانات متنوعة في النحو والصرف والبلاغة."],
    انجليزي: ["قسم اللغة الإنجليزية يحتوي على دروس Grammar و Vocabulary وامتحانات متنوعة."],
    لعبة: ["يمكنك الدخول للعبة Quiz Battle من القائمة الرئيسية واختبار معلوماتك مع منافس!"],
    نتيجة: ["يمكنك الاطلاع على نتائجك من صفحة الملف الشخصي بعد تسجيل الدخول."],
    حساب: ["لإنشاء حساب جديد، اضغط على 'إنشاء حساب' في الأعلى وأدخل بياناتك."],
    شكرا: ["على الرحب والسعة! هل هناك شيء آخر يمكنني مساعدتك به؟ 😊"],
    default: ["شكراً لتواصلك! سأقوم بتحويل سؤالك للدعم الفني وسيتم الرد عليك قريباً. هل هناك شيء آخر يمكنني مساعدتك به؟"],
};

const getAIResponse = (message: string): { response: string; needsHuman: boolean } => {
    const lowerMsg = message.toLowerCase();

    for (const [key, responses] of Object.entries(aiResponses)) {
        if (key !== "default" && lowerMsg.includes(key)) {
            return { response: responses[Math.floor(Math.random() * responses.length)], needsHuman: false };
        }
    }

    return { response: aiResponses.default[0], needsHuman: true };
};

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [chatId, setChatId] = useState<string | null>(null);
    const [userName, setUserName] = useState("");
    const [userEmail, setUserEmail] = useState("");
    const [showForm, setShowForm] = useState(true);
    const [useLocalMode, setUseLocalMode] = useState(false);
    const [showWelcomeBubble, setShowWelcomeBubble] = useState(false);
    const [welcomeDismissed, setWelcomeDismissed] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // إظهار رسالة الترحيب بعد 3 ثواني
    useEffect(() => {
        const dismissed = localStorage.getItem("chat_welcome_dismissed");
        if (dismissed) {
            setWelcomeDismissed(true);
            return;
        }

        const timer = setTimeout(() => {
            if (!isOpen && !welcomeDismissed) {
                setShowWelcomeBubble(true);
            }
        }, 3000);

        return () => clearTimeout(timer);
    }, [isOpen, welcomeDismissed]);

    // إخفاء رسالة الترحيب عند فتح الدردشة
    useEffect(() => {
        if (isOpen) {
            setShowWelcomeBubble(false);
        }
    }, [isOpen]);

    // جلب بيانات المستخدم إذا كان مسجل دخول
    useEffect(() => {
        const checkUser = async () => {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase.from("profiles").select("name, email").eq("id", user.id).single();
                    if (profile) {
                        setUserName(profile.name || "");
                        setUserEmail(profile.email || user.email || "");
                        setShowForm(false);
                    }
                }
            } catch (err) {
                console.error(err);
            }
        };
        checkUser();
    }, []);

    const dismissWelcome = () => {
        setShowWelcomeBubble(false);
        setWelcomeDismissed(true);
        localStorage.setItem("chat_welcome_dismissed", "true");
    };

    const startChat = async () => {
        if (!userName.trim() || !userEmail.trim()) return;
        setIsLoading(true);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            const { data, error } = await supabase.from("support_chats").insert({
                user_id: user?.id || null,
                user_name: userName,
                user_email: userEmail,
            }).select().single();

            if (error) {
                console.log("Using local mode:", error.message);
                setUseLocalMode(true);
                setChatId("local-" + Date.now());
            } else {
                setChatId(data.id);
            }

            setShowForm(false);

            const welcomeMsg: Message = {
                id: Date.now().toString(),
                sender_type: "ai",
                message: `مرحباً ${userName}! 👋\nأنا مساعدك الذكي. كيف يمكنني مساعدتك اليوم؟\n\nيمكنني مساعدتك في:\n• التسجيل وتسجيل الدخول\n• الامتحانات والدروس\n• المعلمين والمحتوى\n• أي استفسار آخر`,
                created_at: new Date().toISOString(),
            };
            setMessages([welcomeMsg]);

        } catch (err) {
            console.error(err);
            setUseLocalMode(true);
            setChatId("local-" + Date.now());
            setShowForm(false);
            setMessages([{
                id: Date.now().toString(),
                sender_type: "ai",
                message: `مرحباً ${userName}! كيف يمكنني مساعدتك؟`,
                created_at: new Date().toISOString(),
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const sendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            sender_type: "user",
            message: inputValue.trim(),
            created_at: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputValue("");
        setIsLoading(true);

        try {
            if (!useLocalMode && chatId) {
                const supabase = createClient();
                await supabase.from("chat_messages").insert({
                    chat_id: chatId,
                    sender_type: "user",
                    message: userMessage.message,
                });
            }

            await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

            const { response, needsHuman } = getAIResponse(userMessage.message);

            const aiMessage: Message = {
                id: (Date.now() + 1).toString(),
                sender_type: "ai",
                message: response,
                created_at: new Date().toISOString(),
            };

            setMessages(prev => [...prev, aiMessage]);

            if (!useLocalMode && chatId) {
                const supabase = createClient();
                await supabase.from("chat_messages").insert({
                    chat_id: chatId,
                    sender_type: "ai",
                    message: response,
                    is_ai_response: true,
                });

                if (needsHuman) {
                    await supabase.from("support_chats").update({ status: "pending", updated_at: new Date().toISOString() }).eq("id", chatId);
                }
            }

        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (showForm) startChat();
            else sendMessage();
        }
    };

    return (
        <>
            {/* رسالة الترحيب العائمة */}
            <AnimatePresence>
                {showWelcomeBubble && !isOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: 50, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.8 }}
                        className="fixed bottom-24 right-6 z-50 max-w-xs"
                    >
                        <div className="relative bg-white dark:bg-[#1c1c24] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 p-4">
                            {/* زر الإغلاق */}
                            <button
                                onClick={dismissWelcome}
                                className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                <X className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                            </button>

                            {/* المحتوى */}
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shrink-0">
                                    <Bot className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                        👋 مرحباً! محتاج مساعدة؟
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        أنا مساعدك الذكي. اضغط هنا للدردشة!
                                    </p>
                                </div>
                            </div>

                            {/* السهم */}
                            <div className="absolute bottom-4 -right-2 w-4 h-4 bg-white dark:bg-[#1c1c24] border-r border-b border-gray-200 dark:border-gray-800 transform rotate-[-45deg]" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* زر الدردشة العائم - على اليمين */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => { setIsOpen(true); dismissWelcome(); }}
                        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/40 flex items-center justify-center hover:shadow-xl transition-shadow"
                    >
                        <MessageCircle className="h-6 w-6" />
                        <span className="absolute -top-1 -left-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* نافذة الدردشة - على اليمين */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className={`fixed z-50 bg-white dark:bg-[#1c1c24] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden ${isMinimized ? "bottom-6 right-6 w-80 h-14" : "bottom-6 right-6 w-[380px] h-[550px]"} transition-all duration-300`}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                    <Bot className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold">المساعد الذكي</h3>
                                    <p className="text-white/80 text-xs flex items-center gap-1">
                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                        متصل الآن
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 rounded-lg hover:bg-white/20 transition-colors">
                                    {isMinimized ? <Maximize2 className="h-4 w-4 text-white" /> : <Minimize2 className="h-4 w-4 text-white" />}
                                </button>
                                <button onClick={() => setIsOpen(false)} className="p-2 rounded-lg hover:bg-white/20 transition-colors">
                                    <X className="h-4 w-4 text-white" />
                                </button>
                            </div>
                        </div>

                        {!isMinimized && (
                            <>
                                {showForm ? (
                                    <div className="p-6 space-y-4">
                                        <div className="text-center mb-6">
                                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center mx-auto mb-4">
                                                <Sparkles className="h-8 w-8 text-primary-500" />
                                            </div>
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">أهلاً بك!</h4>
                                            <p className="text-sm text-gray-500 mt-1">أخبرنا عن نفسك للبدء</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">الاسم</label>
                                            <input
                                                type="text"
                                                value={userName}
                                                onChange={(e) => setUserName(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                placeholder="اسمك الكريم"
                                                className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none text-sm focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">البريد الإلكتروني</label>
                                            <input
                                                type="email"
                                                value={userEmail}
                                                onChange={(e) => setUserEmail(e.target.value)}
                                                onKeyPress={handleKeyPress}
                                                placeholder="email@example.com"
                                                className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none text-sm focus:ring-2 focus:ring-primary-500"
                                            />
                                        </div>
                                        <button
                                            onClick={startChat}
                                            disabled={isLoading || !userName.trim() || !userEmail.trim()}
                                            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>ابدأ المحادثة<MessageCircle className="h-5 w-5" /></>}
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex-1 p-4 overflow-y-auto h-[380px] space-y-4">
                                            {messages.map((msg) => (
                                                <motion.div
                                                    key={msg.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className={`flex ${msg.sender_type === "user" ? "justify-end" : "justify-start"}`}
                                                >
                                                    <div className={`flex items-end gap-2 max-w-[85%] ${msg.sender_type === "user" ? "flex-row-reverse" : "flex-row"}`}>
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender_type === "user" ? "bg-gray-200 dark:bg-gray-700" : msg.sender_type === "ai" ? "bg-gradient-to-br from-primary-400 to-primary-600" : "bg-green-500"}`}>
                                                            {msg.sender_type === "user" ? <User className="h-4 w-4 text-gray-600 dark:text-gray-300" /> : <Bot className="h-4 w-4 text-white" />}
                                                        </div>
                                                        <div className={`p-3 rounded-2xl ${msg.sender_type === "user" ? "bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-tr-sm" : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-sm"}`}>
                                                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                                            <p className={`text-xs mt-1 ${msg.sender_type === "user" ? "text-white/70" : "text-gray-400"}`}>
                                                                {new Date(msg.created_at).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                            {isLoading && (
                                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                                                            <Bot className="h-4 w-4 text-white" />
                                                        </div>
                                                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-2xl rounded-tl-sm">
                                                            <div className="flex items-center gap-1">
                                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                            <div ref={messagesEndRef} />
                                        </div>

                                        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={inputValue}
                                                    onChange={(e) => setInputValue(e.target.value)}
                                                    onKeyPress={handleKeyPress}
                                                    placeholder="اكتب رسالتك..."
                                                    disabled={isLoading}
                                                    className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 outline-none text-sm focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                                                />
                                                <button
                                                    onClick={sendMessage}
                                                    disabled={isLoading || !inputValue.trim()}
                                                    className="p-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white disabled:opacity-50 hover:shadow-lg transition-shadow"
                                                >
                                                    <Send className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
