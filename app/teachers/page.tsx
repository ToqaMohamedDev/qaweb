// =============================================
// Teachers Page - صفحة المعلمين (Clean Architecture)
// =============================================

'use client';

import { useState, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Users, Award, Zap, Star, TrendingUp } from 'lucide-react';

// Layout Components
import { Navbar } from '@/components/Navbar';

// Teachers Components
import { TeacherGrid, TeacherSidebar } from '@/components/teachers';

// Common Components
import {
    SearchBar,
    CategoryDropdown,
    TeacherGridSkeleton,
    EmptyState,
    SectionHeader
} from '@/components/common';

// Custom Hooks
import { useAuth } from '@/hooks/useAuth';
import { useTeachers } from '@/hooks/useTeachers';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useSubjects } from '@/hooks/useSubjects';

// Animations removed to fix flickering

export default function TeachersPage() {
    const pathname = usePathname();

    // State
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showSubjectsDropdown, setShowSubjectsDropdown] = useState(false);

    // Custom Hooks for State Management
    const { user } = useAuth();
    const {
        teachers,
        filteredTeachers,
        featuredTeachers,
        regularTeachers,
        status: teachersStatus,
        searchQuery,
        selectedCategory,
        setSearchQuery,
        setSelectedCategory,
        clearFilters,
        updateTeacher,
    } = useTeachers();

    const {
        subscriptions,
        subscribingTo,
        toggle: toggleSubscription,
        error: subscriptionError,
        clearError: clearSubscriptionError
    } = useSubscriptions(user?.id || null);

    const { subjects, status: subjectsStatus } = useSubjects();

    // Derived State
    const subscribedTeachers = useMemo(() =>
        teachers.filter(t => subscriptions.has(t.id)),
        [teachers, subscriptions]
    );

    // ✅ FIX: Decouple loading states - teachers load independently of subjects
    // Teachers are the primary content, subjects are just for filtering
    const isTeachersLoading = teachersStatus === 'loading';
    const isSubjectsLoading = subjectsStatus === 'loading';

    // Category options for dropdown
    const categoryOptions = useMemo(() =>
        subjects.map(s => ({ id: s.id, name: s.name })),
        [subjects]
    );

    // Handlers
    const handleSubscribe = async (teacherId: string) => {
        const result = await toggleSubscription(teacherId);
        if (result.success && result.newCount !== undefined) {
            // Update both snake_case and camelCase to ensure UI updates
            updateTeacher(teacherId, {
                subscriber_count: result.newCount,
                subscriberCount: result.newCount,
            });
        }
    };

    const handleCategorySelect = (categoryId: string) => {
        // Find subject name to filter by
        if (categoryId === 'all') {
            setSelectedCategory('all');
        } else {
            const subject = subjects.find(s => s.id === categoryId);
            setSelectedCategory(subject?.name || categoryId);
        }
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[#0a0a0a] dark:to-[#0f0f0f] transition-colors duration-300 overflow-x-hidden"
            dir="rtl"
        >
            <Navbar />

            <div className="flex w-full">
                {/* Sidebar */}
                <TeacherSidebar
                    isOpen={sidebarOpen}
                    onToggle={() => setSidebarOpen(!sidebarOpen)}
                    subscribedTeachers={subscribedTeachers}
                    currentPath={pathname}
                />

                {/* Main Content */}
                <main className={`flex-1 w-full min-w-0 transition-all duration-300 ease-out ${sidebarOpen ? 'md:mr-64' : 'md:mr-[72px]'}`}>

                    {/* Search Bar with Subject Filter */}
                    <div className="sticky top-16 z-30 bg-white/90 dark:bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-gray-200/80 dark:border-[#1f1f1f] shadow-sm">
                        <div className="px-3 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-center gap-3 max-w-3xl mx-auto">
                                {/* Subject Filter Dropdown - loads independently */}
                                <CategoryDropdown
                                    options={categoryOptions}
                                    selectedId={subjects.find(s => s.name === selectedCategory)?.id || 'all'}
                                    onSelect={handleCategorySelect}
                                    isOpen={showSubjectsDropdown}
                                    onToggle={() => setShowSubjectsDropdown(!showSubjectsDropdown)}
                                    allLabel="كل المواد"
                                    isLoading={isSubjectsLoading}
                                />

                                {/* Search Input */}
                                <SearchBar
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    placeholder="ابحث عن معلم..."
                                />
                            </div>
                        </div>

                        {/* Mobile Subscriptions - horizontal scroll */}
                        {subscribedTeachers.length > 0 && (
                            <div className="md:hidden px-3 py-2 border-t border-gray-100 dark:border-[#1f1f1f]">
                                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
                                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">اشتراكاتي:</span>
                                    {subscribedTeachers.map((teacher) => (
                                        <a
                                            key={teacher.id}
                                            href={`/teachers/${teacher.id}`}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-[#1a1a1a] rounded-full whitespace-nowrap text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#252525] transition-colors shrink-0"
                                        >
                                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-[10px] font-bold">
                                                {((teacher as any).displayName || (teacher as any).name || 'م').charAt(0)}
                                            </div>
                                            {(teacher as any).displayName || (teacher as any).name || 'معلم'}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Subscription Error Toast */}
                    {subscriptionError && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
                        >
                            <span>{subscriptionError}</span>
                            <button
                                onClick={clearSubscriptionError}
                                className="p-1 hover:bg-white/20 rounded"
                            >
                                ✕
                            </button>
                        </motion.div>
                    )}

                    {/* Results Info */}
                    <div className="px-3 sm:px-6 pb-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white dark:bg-[#1a1a1a] rounded-xl text-xs sm:text-sm text-gray-700 dark:text-gray-200 font-semibold border border-gray-200 dark:border-[#2a2a2a] shadow-sm">
                                    <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-500 dark:text-red-500" />
                                    {filteredTeachers?.length || 0} نتيجة
                                </span>

                                {featuredTeachers.length > 0 && (
                                    <span className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-500/20 dark:to-orange-500/20 rounded-xl text-xs sm:text-sm text-amber-700 dark:text-amber-300 font-semibold border border-amber-200/50 dark:border-amber-500/30">
                                        <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-yellow-500 text-yellow-500" />
                                        {featuredTeachers.length} مميز
                                    </span>
                                )}
                            </div>

                            <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-[#aaa] hover:bg-gray-100 dark:hover:bg-[#272727] rounded-lg transition-colors">
                                <TrendingUp className="h-4 w-4" />
                                ترتيب حسب الأكثر متابعة
                            </button>
                        </div>
                    </div>

                    {/* Content Grid */}
                    <div className="px-3 sm:px-6 pb-28 md:pb-10">
                        {isTeachersLoading ? (
                            <TeacherGridSkeleton count={8} />
                        ) : filteredTeachers.length === 0 ? (
                            <EmptyState
                                title="لا توجد نتائج"
                                description="جرب البحث بكلمات مختلفة أو تصفح جميع الفئات"
                                actionLabel="عرض الكل"
                                onAction={clearFilters}
                            />
                        ) : (
                            <>
                                {/* Featured Teachers */}
                                {featuredTeachers.length > 0 && (
                                    <div className="mb-12">
                                        <SectionHeader
                                            icon={Award}
                                            title="المعلمون المميزون"
                                            subtitle="أفضل المعلمين المُوصى بهم"
                                            iconGradient="from-yellow-500/20 via-orange-500/15 to-red-500/10"
                                        />

                                        <TeacherGrid
                                            teachers={featuredTeachers}
                                            subscriptions={subscriptions}
                                            subscribingTo={subscribingTo}
                                            currentUserId={user?.id || null}
                                            onSubscribe={handleSubscribe}
                                            isFeatured
                                        />
                                    </div>
                                )}

                                {/* All Teachers */}
                                <div>
                                    <SectionHeader
                                        icon={Users}
                                        title="جميع المعلمين"
                                        subtitle="تصفح واكتشف المعلمين"
                                    />

                                    <TeacherGrid
                                        teachers={featuredTeachers.length > 0 ? regularTeachers : filteredTeachers}
                                        subscriptions={subscriptions}
                                        subscribingTo={subscribingTo}
                                        currentUserId={user?.id || null}
                                        onSubscribe={handleSubscribe}
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
