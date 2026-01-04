"use client";

/**
 * TeacherRating Component
 * 
 * Displays and allows rating of teachers
 * Uses the teacher_ratings table from the database
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Star,
    Loader2,
    Send,
    MessageSquare,
    ChevronDown,
    ChevronUp,
    User,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { Avatar } from "@/components/common";
import { formatRelativeDate } from "@/lib/utils/formatters";

// ==========================================
// Types
// ==========================================

interface Rating {
    id: string;
    user_id: string;
    teacher_id: string;
    rating: number;
    review: string | null;
    created_at: string | null;
    updated_at: string | null;
    user?: {
        id: string;
        name: string | null;
        avatar_url: string | null;
    };
}

interface TeacherRatingProps {
    teacherId: string;
    teacherName: string;
    initialRating?: number;
    initialRatingCount?: number;
    currentUserId?: string | null;
    isOwnProfile?: boolean;
    onRatingChange?: (newAverage: number, newCount: number) => void;
}

// ==========================================
// Star Rating Component
// ==========================================

function StarRating({
    rating,
    onRatingChange,
    readonly = false,
    size = "md",
}: {
    rating: number;
    onRatingChange?: (rating: number) => void;
    readonly?: boolean;
    size?: "sm" | "md" | "lg";
}) {
    const [hoverRating, setHoverRating] = useState(0);

    const sizes = {
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
    };

    const containerSizes = {
        sm: "gap-0.5",
        md: "gap-1",
        lg: "gap-1.5",
    };

    return (
        <div className={`flex ${containerSizes[size]}`}>
            {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= (hoverRating || rating);
                return (
                    <motion.button
                        key={star}
                        type="button"
                        whileHover={!readonly ? { scale: 1.1 } : {}}
                        whileTap={!readonly ? { scale: 0.95 } : {}}
                        onClick={() => !readonly && onRatingChange?.(star)}
                        onMouseEnter={() => !readonly && setHoverRating(star)}
                        onMouseLeave={() => !readonly && setHoverRating(0)}
                        disabled={readonly}
                        className={`transition-colors ${readonly ? "cursor-default" : "cursor-pointer"}`}
                    >
                        <Star
                            className={`${sizes[size]} ${filled
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-gray-300 dark:text-gray-600"
                                }`}
                        />
                    </motion.button>
                );
            })}
        </div>
    );
}

// ==========================================
// Rating Distribution Bar
// ==========================================

function RatingDistribution({
    distribution,
    total,
}: {
    distribution: Record<number, number>;
    total: number;
}) {
    return (
        <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star] || 0;
                const percentage = total > 0 ? (count / total) * 100 : 0;

                return (
                    <div key={star} className="flex items-center gap-2 text-sm">
                        <span className="w-3 text-gray-600 dark:text-gray-400">{star}</span>
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.5, delay: (5 - star) * 0.1 }}
                                className="h-full bg-yellow-500"
                            />
                        </div>
                        <span className="w-8 text-right text-gray-500 dark:text-gray-400">
                            {count}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

// ==========================================
// Single Review Card
// ==========================================

function ReviewCard({ rating }: { rating: Rating }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700"
        >
            <div className="flex items-start gap-3">
                <Avatar
                    src={rating.user?.avatar_url}
                    name={rating.user?.name || "مستخدم"}
                    size="sm"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="font-medium text-gray-900 dark:text-white">
                            {rating.user?.name || "مستخدم"}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            {rating.created_at ? formatRelativeDate(rating.created_at) : ""}
                        </span>
                    </div>
                    <StarRating rating={rating.rating} readonly size="sm" />
                    {rating.review && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            {rating.review}
                        </p>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

// ==========================================
// Main Component
// ==========================================

export default function TeacherRating({
    teacherId,
    teacherName,
    initialRating = 0,
    initialRatingCount = 0,
    currentUserId,
    isOwnProfile = false,
    onRatingChange,
}: TeacherRatingProps) {
    // State
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [userRating, setUserRating] = useState<Rating | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state
    const [selectedRating, setSelectedRating] = useState(0);
    const [reviewText, setReviewText] = useState("");
    const [showReviewInput, setShowReviewInput] = useState(false);
    const [showAllReviews, setShowAllReviews] = useState(false);

    // Stats
    const [averageRating, setAverageRating] = useState(initialRating);
    const [totalRatings, setTotalRatings] = useState(initialRatingCount);
    const [distribution, setDistribution] = useState<Record<number, number>>({
        1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
    });

    // ==========================================
    // Fetch Data
    // ==========================================

    useEffect(() => {
        fetchRatings();
    }, [teacherId, currentUserId]);

    const fetchRatings = async () => {
        setIsLoading(true);
        try {
            const supabase = createClient();

            // Fetch ratings first
            const { data: ratingsData, error: ratingsError } = await supabase
                .from("teacher_ratings")
                .select("*")
                .eq("teacher_id", teacherId)
                .order("created_at", { ascending: false });

            if (ratingsError) {
                console.error("Error fetching ratings:", ratingsError.message);
                return;
            }

            if (!ratingsData || ratingsData.length === 0) {
                setRatings([]);
                setDistribution({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
                setTotalRatings(0);
                setAverageRating(0);
                return;
            }

            // Get unique user IDs
            const userIds = [...new Set(ratingsData.map(r => r.user_id))];

            // Fetch user profiles
            const { data: usersData } = await supabase
                .from("profiles")
                .select("id, name, avatar_url")
                .in("id", userIds);

            // Create a map of user data
            const usersMap = new Map(
                (usersData || []).map(u => [u.id, u])
            );

            // Combine ratings with user data
            const fetchedRatings: Rating[] = ratingsData.map(r => ({
                ...r,
                user: usersMap.get(r.user_id) || undefined,
            }));

            setRatings(fetchedRatings);

            // Calculate stats
            const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
            let sum = 0;
            fetchedRatings.forEach((r) => {
                if (r.rating >= 1 && r.rating <= 5) {
                    dist[r.rating]++;
                    sum += r.rating;
                }
            });
            setDistribution(dist);
            setTotalRatings(fetchedRatings.length);
            setAverageRating(fetchedRatings.length > 0 ? sum / fetchedRatings.length : 0);

            // Find current user's rating
            if (currentUserId) {
                const userRatingData = fetchedRatings.find((r) => r.user_id === currentUserId);
                if (userRatingData) {
                    setUserRating(userRatingData);
                    setSelectedRating(userRatingData.rating);
                    setReviewText(userRatingData.review || "");
                }
            }
        } catch (err) {
            console.error("Error fetching ratings:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // ==========================================
    // Submit Rating
    // ==========================================

    const handleSubmitRating = async () => {
        if (!currentUserId || selectedRating === 0) return;

        setIsSubmitting(true);
        try {
            const supabase = createClient();

            if (userRating) {
                // Update existing rating
                console.log("Updating rating:", { id: userRating.id, rating: selectedRating });
                const { error } = await supabase
                    .from("teacher_ratings")
                    .update({
                        rating: selectedRating,
                        review: reviewText.trim() || null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", userRating.id);

                if (error) {
                    console.error("Update error details:", error.message, error.code, error.details);
                    throw error;
                }
            } else {
                // Create new rating
                console.log("Creating new rating:", { user_id: currentUserId, teacher_id: teacherId, rating: selectedRating });
                const { error } = await supabase
                    .from("teacher_ratings")
                    .insert({
                        user_id: currentUserId,
                        teacher_id: teacherId,
                        rating: selectedRating,
                        review: reviewText.trim() || null,
                    });

                if (error) {
                    console.error("Insert error details:", error.message, error.code, error.details);
                    throw error;
                }
            }

            // Refresh ratings
            await fetchRatings();

            // Update teacher's average
            await updateTeacherAverage();

            setShowReviewInput(false);
        } catch (err: any) {
            console.error("Error submitting rating:", err?.message || err);
        } finally {
            setIsSubmitting(false);
        }
    };

    const updateTeacherAverage = async () => {
        try {
            const supabase = createClient();

            // Calculate new average
            const { data: ratingsData } = await supabase
                .from("teacher_ratings")
                .select("rating")
                .eq("teacher_id", teacherId);

            if (ratingsData && ratingsData.length > 0) {
                const sum = ratingsData.reduce((acc, r) => acc + r.rating, 0);
                const avg = sum / ratingsData.length;

                // Update teacher profile
                await supabase
                    .from("profiles")
                    .update({
                        rating_average: avg,
                        rating_count: ratingsData.length,
                        updated_at: new Date().toISOString(),
                    })
                    .eq("id", teacherId);

                // Notify parent
                onRatingChange?.(avg, ratingsData.length);
            }
        } catch (err) {
            console.error("Error updating teacher average:", err);
        }
    };

    // ==========================================
    // Render
    // ==========================================

    const reviewsWithText = ratings.filter((r) => r.review);
    const displayedReviews = showAllReviews ? reviewsWithText : reviewsWithText.slice(0, 3);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-gray-100 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-slate-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    تقييمات المعلم
                </h3>
            </div>

            <div className="p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Rating Summary */}
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Average Score */}
                            <div className="text-center md:text-right">
                                <div className="text-5xl font-bold text-gray-900 dark:text-white">
                                    {averageRating.toFixed(1)}
                                </div>
                                <StarRating rating={Math.round(averageRating)} readonly size="md" />
                                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                    {totalRatings} تقييم
                                </p>
                            </div>

                            {/* Distribution */}
                            <div className="flex-1">
                                <RatingDistribution distribution={distribution} total={totalRatings} />
                            </div>
                        </div>

                        {/* User Rating Section */}
                        {currentUserId && !isOwnProfile && (
                            <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    {userRating ? "تقييمك" : "قيّم هذا المعلم"}
                                </h4>

                                <div className="flex items-center gap-4 flex-wrap">
                                    <StarRating
                                        rating={selectedRating}
                                        onRatingChange={(rating) => {
                                            setSelectedRating(rating);
                                            setShowReviewInput(true);
                                        }}
                                        size="lg"
                                    />

                                    {selectedRating > 0 && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            onClick={() => setShowReviewInput(!showReviewInput)}
                                            className="flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 hover:underline"
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                            {showReviewInput ? "إخفاء" : "أضف تعليق"}
                                        </motion.button>
                                    )}
                                </div>

                                {/* Review Input */}
                                <AnimatePresence>
                                    {showReviewInput && selectedRating > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-4 space-y-3"
                                        >
                                            <textarea
                                                value={reviewText}
                                                onChange={(e) => setReviewText(e.target.value)}
                                                placeholder="اكتب تعليقك هنا (اختياري)..."
                                                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                                                rows={3}
                                            />
                                            <motion.button
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleSubmitRating}
                                                disabled={isSubmitting}
                                                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                                            >
                                                {isSubmitting ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Send className="h-4 w-4" />
                                                )}
                                                {userRating ? "تحديث التقييم" : "إرسال التقييم"}
                                            </motion.button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Reviews List */}
                        {reviewsWithText.length > 0 && (
                            <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                                    التعليقات ({reviewsWithText.length})
                                </h4>

                                <div className="space-y-3">
                                    <AnimatePresence>
                                        {displayedReviews.map((rating) => (
                                            <ReviewCard key={rating.id} rating={rating} />
                                        ))}
                                    </AnimatePresence>
                                </div>

                                {reviewsWithText.length > 3 && (
                                    <button
                                        onClick={() => setShowAllReviews(!showAllReviews)}
                                        className="mt-4 flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 hover:underline mx-auto"
                                    >
                                        {showAllReviews ? (
                                            <>
                                                <ChevronUp className="h-4 w-4" />
                                                عرض أقل
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="h-4 w-4" />
                                                عرض الكل ({reviewsWithText.length})
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Empty State */}
                        {totalRatings === 0 && (
                            <div className="text-center py-8">
                                <Star className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                <p className="text-gray-500 dark:text-gray-400">
                                    لا توجد تقييمات بعد
                                </p>
                                {currentUserId && !isOwnProfile && (
                                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                        كن أول من يقيّم هذا المعلم!
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
