"use client";

// =============================================
// Profile Page - الملف الشخصي (Refactored)
// =============================================

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle } from "lucide-react";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
    ProfileSidebar,
    ProfileTabs,
    StatsGrid,
    ProgressSummary,
    AchievementsGrid,
    ProfileSettings,
} from "@/components/profile";
import { StudentProgressDashboard } from "@/components/profile/StudentProgressDashboard";
import type { ProfileTab } from "@/components/profile";
import { useProfile } from "@/hooks/useProfile";
import { useState } from "react";

// ============================================
// Loading Skeleton Component
// ============================================

function ProfileSkeleton() {
    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 dark:from-[#0d0d14] dark:via-[#13131a] dark:to-[#0d0d14] pt-4">
                {/* Decorative Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
                </div>

                <div className="relative max-w-6xl mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Sidebar Skeleton */}
                        <div className="lg:col-span-1">
                            <div className="bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl rounded-3xl border border-gray-200/60 dark:border-gray-800/60 overflow-hidden shadow-xl">
                                <div className="h-32 bg-gradient-to-br from-violet-400/50 via-purple-400/50 to-fuchsia-400/50 animate-pulse" />
                                <div className="relative px-5 pb-5">
                                    <div className="absolute -top-14 right-5">
                                        <div className="w-28 h-28 rounded-3xl bg-white dark:bg-[#1c1c24] p-1.5 shadow-2xl">
                                            <div className="w-full h-full rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="pt-16 space-y-3">
                                        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                                        <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                                        <div className="mt-5 pt-5 border-t border-gray-200/60 dark:border-gray-800/60 space-y-2">
                                            <div className="h-12 w-full bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                                            <div className="h-12 w-full bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Skeleton */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex gap-1 bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl p-1.5 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 shadow-lg overflow-x-auto">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="flex-1 h-11 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                                ))}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-5 shadow-lg">
                                        <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700 mb-4 animate-pulse" />
                                        <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg mb-2 animate-pulse" />
                                        <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}

// ============================================
// Main Profile Component
// ============================================

export default function ProfilePage() {
    const [activeTab, setActiveTab] = useState<ProfileTab>('overview');

    const {
        user,
        profile,
        isLoading,
        isSaving,
        isUploadingImage,
        saveSuccess,
        stats,
        stages,
        achievements,
        recentActivity,
        formData,
        userLevel,
        levelProgress,
        setFormData,
        handleSave,
        handleLogout,
        handleImageUpload,
        formatRelativeDate,
    } = useProfile();

    if (isLoading) {
        return <ProfileSkeleton />;
    }

    if (!user) {
        return null;
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-blue-50/30 dark:from-[#0d0d14] dark:via-[#13131a] dark:to-[#0d0d14] pt-4">
                {/* Decorative Background */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
                </div>

                {/* Success Toast */}
                <AnimatePresence>
                    {saveSuccess && (
                        <motion.div
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            className="fixed top-20 right-4 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-xl shadow-green-500/25"
                        >
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                                <CheckCircle className="h-5 w-5" />
                            </div>
                            <span className="font-medium">تم حفظ التغييرات بنجاح</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="relative max-w-6xl mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Sidebar */}
                        <div className="lg:col-span-1">
                            <ProfileSidebar
                                user={user}
                                profile={profile}
                                userLevel={userLevel}
                                levelProgress={levelProgress}
                                onEditClick={() => setActiveTab('settings')}
                                onLogout={handleLogout}
                            />
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Tabs */}
                            <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    <StatsGrid stats={stats} />
                                    <ProgressSummary stats={stats} />
                                </motion.div>
                            )}

                            {/* Exams Tab */}
                            {activeTab === 'exams' && (
                                <StudentProgressDashboard language="arabic" />
                            )}

                            {/* Achievements Tab */}
                            {activeTab === 'achievements' && (
                                <AchievementsGrid achievements={achievements} />
                            )}

                            {/* Settings Tab */}
                            {activeTab === 'settings' && (
                                <ProfileSettings
                                    formData={formData}
                                    stages={stages}
                                    isSaving={isSaving}
                                    isUploadingImage={isUploadingImage}
                                    canEditImage={profile?.role === 'teacher'}
                                    onFormChange={(data) =>
                                        setFormData((prev) => ({ ...prev, ...data }))
                                    }
                                    onImageUpload={handleImageUpload}
                                    onSave={handleSave}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}
