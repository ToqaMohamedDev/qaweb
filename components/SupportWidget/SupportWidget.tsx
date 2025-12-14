"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    MessageCircle,
    X,
    Send,
    Mail,
    Bot,
    User,
    ChevronLeft,
    Sparkles,
    ArrowLeft,
    CheckCircle,
    AlertCircle,
    Loader2,
} from "lucide-react";
import "./SupportWidget.css";

// Types
interface Message {
    id: string;
    content: string;
    sender: "user" | "bot";
    timestamp: Date;
}

interface EmailFormData {
    name: string;
    email: string;
    subject: string;
    message: string;
}

// Quick reply suggestions
const QUICK_REPLIES = [
    "كيف أبدأ في استخدام المنصة؟",
    "ما هي الدورات المتاحة؟",
    "كيف أتواصل مع المعلم؟",
    "ما هي طرق الدفع المتاحة؟",
];

// Bot responses simulation
const BOT_RESPONSES: Record<string, string> = {
    "كيف أبدأ في استخدام المنصة؟":
        "مرحباً! 🎉 للبدء في استخدام المنصة:\n\n1️⃣ قم بإنشاء حساب جديد\n2️⃣ اختر الدورة المناسبة لك\n3️⃣ ابدأ التعلم واستمتع!\n\nهل تحتاج مساعدة إضافية؟",
    "ما هي الدورات المتاحة؟":
        "لدينا مجموعة متنوعة من الدورات:\n\n📚 اللغة العربية\n📖 اللغة الإنجليزية\n🎯 دورات متخصصة\n\nيمكنك تصفح جميع الدورات من الصفحة الرئيسية!",
    "كيف أتواصل مع المعلم؟":
        "يمكنك التواصل مع المعلم من خلال:\n\n💬 نظام الرسائل الداخلي\n📧 البريد الإلكتروني\n🎥 جلسات الفيديو المباشرة\n\nستجد خيارات التواصل في صفحة كل دورة.",
    "ما هي طرق الدفع المتاحة؟":
        "نقبل عدة طرق للدفع:\n\n💳 البطاقات الائتمانية (Visa/Mastercard)\n📱 Apple Pay و Google Pay\n🏦 التحويل البنكي\n\nجميع المعاملات آمنة ومشفرة!",
    default:
        "شكراً لتواصلك! 😊 أنا مساعدك الذكي وسأحاول مساعدتك.\n\nإذا لم أتمكن من الإجابة على سؤالك، يمكنك إرسال رسالة لفريق الدعم وسيردون عليك في أقرب وقت.",
};

export function SupportWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [showEmailForm, setShowEmailForm] = useState(false);
    const [emailFormData, setEmailFormData] = useState<EmailFormData>({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [emailStatus, setEmailStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
    const [isMounted, setIsMounted] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Mount check for SSR
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Show welcome message after delay
    useEffect(() => {
        if (!isMounted) return;

        // Check if welcome was already shown in this session
        const welcomeShown = sessionStorage.getItem("supportWidgetWelcomeShown");
        if (welcomeShown) return;

        const showTimeout = setTimeout(() => {
            setShowWelcome(true);
            sessionStorage.setItem("supportWidgetWelcomeShown", "true");
        }, 3000);

        const hideTimeout = setTimeout(() => {
            setShowWelcome(false);
        }, 8000);

        return () => {
            clearTimeout(showTimeout);
            clearTimeout(hideTimeout);
        };
    }, [isMounted]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen && !showEmailForm) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen, showEmailForm]);

    // Add initial bot message when chat opens
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            const initialMessage: Message = {
                id: "initial",
                content: "مرحباً! 👋 أنا مساعد QAlaa الذكي. كيف يمكنني مساعدتك اليوم؟",
                sender: "bot",
                timestamp: new Date(),
            };
            setMessages([initialMessage]);
        }
    }, [isOpen, messages.length]);

    const handleOpen = useCallback(() => {
        setIsOpen(true);
        setShowWelcome(false);
    }, []);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setShowEmailForm(false);
    }, []);

    const dismissWelcome = useCallback(() => {
        setShowWelcome(false);
    }, []);

    const getBotResponse = (userMessage: string): string => {
        const normalizedMessage = userMessage.trim();
        return BOT_RESPONSES[normalizedMessage] || BOT_RESPONSES.default;
    };

    const handleSendMessage = useCallback(
        (content: string = inputValue) => {
            if (!content.trim()) return;

            const userMessage: Message = {
                id: Date.now().toString(),
                content: content.trim(),
                sender: "user",
                timestamp: new Date(),
            };

            setMessages((prev) => [...prev, userMessage]);
            setInputValue("");
            setIsTyping(true);

            // Simulate bot typing and response
            setTimeout(() => {
                const botResponse: Message = {
                    id: (Date.now() + 1).toString(),
                    content: getBotResponse(content),
                    sender: "bot",
                    timestamp: new Date(),
                };
                setMessages((prev) => [...prev, botResponse]);
                setIsTyping(false);
            }, 1500);
        },
        [inputValue]
    );

    const handleQuickReply = useCallback(
        (reply: string) => {
            handleSendMessage(reply);
        },
        [handleSendMessage]
    );

    const handleKeyPress = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        },
        [handleSendMessage]
    );

    const handleEmailSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            setEmailStatus("sending");

            // Simulate email sending
            await new Promise((resolve) => setTimeout(resolve, 2000));

            // Simulate success (in production, this would be an API call)
            setEmailStatus("success");

            // Reset form after delay
            setTimeout(() => {
                setEmailFormData({ name: "", email: "", subject: "", message: "" });
                setEmailStatus("idle");
                setShowEmailForm(false);
            }, 3000);
        },
        []
    );

    const handleEmailFormChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            const { name, value } = e.target;
            setEmailFormData((prev) => ({ ...prev, [name]: value }));
        },
        []
    );

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("ar-EG", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (!isMounted) return null;

    return createPortal(
        <div
            className="support-widget-container"
            dir="rtl"
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 99999,
                pointerEvents: 'auto',
                transform: 'none',
                willChange: 'auto',
            }}
        >
            {/* Floating Action Button */}
            <motion.button
                onClick={handleOpen}
                className="support-fab"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                animate={!isOpen ? { scale: [1, 1.05, 1] } : {}}
                transition={{
                    duration: 2,
                    repeat: !isOpen ? Infinity : 0,
                    repeatType: "reverse",
                }}
                aria-label="فتح الدعم والمساعدة"
            >
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {isOpen ? (
                        <X className="w-6 h-6" />
                    ) : (
                        <MessageCircle className="w-6 h-6" />
                    )}
                </motion.div>
                <span className="fab-pulse" />
            </motion.button>

            {/* Welcome Nudge */}
            <AnimatePresence>
                {showWelcome && !isOpen && (
                    <motion.div
                        className="welcome-nudge"
                        initial={{ opacity: 0, x: 20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        <button
                            onClick={dismissWelcome}
                            className="welcome-close"
                            aria-label="إغلاق"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                        <div className="welcome-content" onClick={handleOpen}>
                            <span className="welcome-emoji">👋</span>
                            <div>
                                <p className="welcome-title">مرحباً!</p>
                                <p className="welcome-text">كيف يمكنني مساعدتك؟</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="chat-window"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                    >
                        {/* Header */}
                        <div className="chat-header">
                            <div className="chat-header-content">
                                <div className="chat-avatar">
                                    <Bot className="w-5 h-5" />
                                    <span className="online-indicator" />
                                </div>
                                <div className="chat-header-info">
                                    <h3 className="chat-title">
                                        <Sparkles className="w-4 h-4" />
                                        مساعد QAlaa
                                    </h3>
                                    <p className="chat-status">متصل الآن</p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                className="chat-close-btn"
                                aria-label="إغلاق المحادثة"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages Area or Email Form */}
                        {showEmailForm ? (
                            <motion.div
                                className="email-form-container"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                            >
                                <button
                                    onClick={() => setShowEmailForm(false)}
                                    className="back-to-chat"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    العودة للمحادثة
                                </button>

                                <div className="email-form-header">
                                    <Mail className="w-6 h-6" />
                                    <h4>تواصل مع فريق الدعم</h4>
                                    <p>سنرد عليك في أقرب وقت ممكن</p>
                                </div>

                                {emailStatus === "success" ? (
                                    <motion.div
                                        className="email-success"
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                    >
                                        <CheckCircle className="w-12 h-12 text-green-500" />
                                        <h4>تم الإرسال بنجاح!</h4>
                                        <p>سنتواصل معك قريباً</p>
                                    </motion.div>
                                ) : (
                                    <form onSubmit={handleEmailSubmit} className="email-form">
                                        <div className="form-group">
                                            <label htmlFor="name">الاسم *</label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={emailFormData.name}
                                                onChange={handleEmailFormChange}
                                                required
                                                placeholder="أدخل اسمك"
                                                disabled={emailStatus === "sending"}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="email">البريد الإلكتروني *</label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={emailFormData.email}
                                                onChange={handleEmailFormChange}
                                                required
                                                placeholder="example@email.com"
                                                disabled={emailStatus === "sending"}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="subject">الموضوع</label>
                                            <input
                                                type="text"
                                                id="subject"
                                                name="subject"
                                                value={emailFormData.subject}
                                                onChange={handleEmailFormChange}
                                                placeholder="موضوع الرسالة (اختياري)"
                                                disabled={emailStatus === "sending"}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="message">وصف المشكلة *</label>
                                            <textarea
                                                id="message"
                                                name="message"
                                                value={emailFormData.message}
                                                onChange={handleEmailFormChange}
                                                required
                                                placeholder="اشرح المشكلة أو استفسارك بالتفصيل..."
                                                rows={4}
                                                disabled={emailStatus === "sending"}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            className="submit-btn"
                                            disabled={emailStatus === "sending"}
                                        >
                                            {emailStatus === "sending" ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    جاري الإرسال...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-4 h-4" />
                                                    إرسال الرسالة
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}
                            </motion.div>
                        ) : (
                            <>
                                {/* Messages */}
                                <div className="messages-container">
                                    {messages.map((message) => (
                                        <motion.div
                                            key={message.id}
                                            className={`message ${message.sender}`}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {message.sender === "bot" && (
                                                <div className="message-avatar">
                                                    <Bot className="w-4 h-4" />
                                                </div>
                                            )}
                                            <div className="message-content">
                                                <div className="message-bubble">
                                                    {message.content.split("\n").map((line, i) => (
                                                        <span key={i}>
                                                            {line}
                                                            {i < message.content.split("\n").length - 1 && <br />}
                                                        </span>
                                                    ))}
                                                </div>
                                                <span className="message-time">
                                                    {formatTime(message.timestamp)}
                                                </span>
                                            </div>
                                            {message.sender === "user" && (
                                                <div className="message-avatar user">
                                                    <User className="w-4 h-4" />
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}

                                    {/* Typing Indicator */}
                                    {isTyping && (
                                        <motion.div
                                            className="message bot"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                        >
                                            <div className="message-avatar">
                                                <Bot className="w-4 h-4" />
                                            </div>
                                            <div className="typing-indicator">
                                                <span />
                                                <span />
                                                <span />
                                            </div>
                                        </motion.div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Quick Replies */}
                                {messages.length === 1 && (
                                    <div className="quick-replies">
                                        {QUICK_REPLIES.map((reply, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleQuickReply(reply)}
                                                className="quick-reply-btn"
                                            >
                                                {reply}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Input Area */}
                                <div className="input-area">
                                    <div className="input-wrapper">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={inputValue}
                                            onChange={(e) => setInputValue(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="اكتب رسالتك..."
                                            className="message-input"
                                        />
                                        <button
                                            onClick={() => handleSendMessage()}
                                            disabled={!inputValue.trim()}
                                            className="send-btn"
                                            aria-label="إرسال"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setShowEmailForm(true)}
                                        className="email-fallback-btn"
                                    >
                                        <Mail className="w-4 h-4" />
                                        لم أجد حلاً - تواصل مع الدعم
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>,
        document.body
    );
}

export default SupportWidget;
