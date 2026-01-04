'use client';

// =============================================
// Avatar Component - مكون الصورة الشخصية الموحد
// يعالج جميع حالات الصور:
// 1. صور Google OAuth (قد تنتهي صلاحيتها)
// 2. صور محفوظة في R2/قاعدة البيانات
// 3. عدم وجود صورة (يظهر أول حرف من الاسم)
// =============================================

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { UserCircle } from 'lucide-react';

// مجموعة ألوان متناسقة للخلفية
const AVATAR_COLORS = [
    'from-violet-500 to-purple-600',
    'from-blue-500 to-cyan-500',
    'from-emerald-500 to-teal-500',
    'from-orange-500 to-amber-500',
    'from-pink-500 to-rose-500',
    'from-indigo-500 to-blue-600',
    'from-red-500 to-pink-500',
    'from-fuchsia-500 to-purple-500',
    'from-cyan-500 to-blue-500',
    'from-green-500 to-emerald-500',
];

// Hash function لتعيين لون ثابت لكل اسم
function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

// الحصول على لون بناءً على الاسم
function getColorFromName(name: string): string {
    const index = hashCode(name) % AVATAR_COLORS.length;
    return AVATAR_COLORS[index];
}

// الحصول على أول حرف (يدعم العربية والإنجليزية)
function getInitial(name: string): string {
    const cleanName = name.trim();
    if (!cleanName) return '?';

    // للأسماء العربية والإنجليزية
    const firstChar = cleanName.charAt(0);
    return firstChar.toUpperCase();
}

// التحقق مما إذا كان الرابط من Google
function isGoogleAvatar(url: string): boolean {
    return url.includes('googleusercontent.com') ||
        url.includes('google.com') ||
        url.includes('lh3.google') ||
        url.includes('lh4.google') ||
        url.includes('lh5.google') ||
        url.includes('lh6.google');
}

// التحقق من صحة رابط الصورة
function isValidImageUrl(url: string | null | undefined): boolean {
    if (!url || typeof url !== 'string') return false;
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return false;

    // التحقق من أن الرابط يبدأ بـ http أو https
    return trimmedUrl.startsWith('http://') ||
        trimmedUrl.startsWith('https://') ||
        trimmedUrl.startsWith('/');
}

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface AvatarProps {
    /** رابط الصورة */
    src?: string | null;
    /** اسم المستخدم (لعرض الحرف الأول كبديل) */
    name?: string | null;
    /** البريد الإلكتروني (بديل للاسم) */
    email?: string | null;
    /** الحجم */
    size?: AvatarSize;
    /** شكل مربع بدلاً من دائري */
    rounded?: 'full' | 'xl' | '2xl' | '3xl';
    /** رنة/إطار */
    ring?: boolean;
    /** لون الرنة */
    ringColor?: string;
    /** كلاس إضافي */
    className?: string;
    /** كلاس للحاوية الخارجية */
    containerClassName?: string;
    /** عرض أيقونة المستخدم بدلاً من الحرف */
    showIcon?: boolean;
    /** لون خلفية مخصص */
    customGradient?: string;
    /** onClick handler */
    onClick?: () => void;
}

// تحويل Size إلى pixel values
const sizeStyles: Record<AvatarSize, { container: string; text: string; icon: string }> = {
    xs: { container: 'w-6 h-6 min-w-6 min-h-6', text: 'text-xs', icon: 'w-3 h-3' },
    sm: { container: 'w-8 h-8 min-w-8 min-h-8', text: 'text-sm', icon: 'w-4 h-4' },
    md: { container: 'w-10 h-10 min-w-10 min-h-10', text: 'text-base', icon: 'w-5 h-5' },
    lg: { container: 'w-14 h-14 min-w-14 min-h-14', text: 'text-xl', icon: 'w-7 h-7' },
    xl: { container: 'w-20 h-20 min-w-20 min-h-20', text: 'text-3xl', icon: 'w-10 h-10' },
    '2xl': { container: 'w-28 h-28 min-w-28 min-h-28', text: 'text-4xl', icon: 'w-14 h-14' },
};

const roundedStyles: Record<string, string> = {
    full: 'rounded-full',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    '3xl': 'rounded-3xl',
};

export function Avatar({
    src,
    name,
    email,
    size = 'md',
    rounded = 'full',
    ring = false,
    ringColor = 'ring-white dark:ring-gray-900',
    className = '',
    containerClassName = '',
    showIcon = false,
    customGradient,
    onClick,
}: AvatarProps) {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    // تحديد الاسم للعرض والألوان
    const displayName = useMemo(() => {
        return name || email?.split('@')[0] || 'User';
    }, [name, email]);

    // الحرف الأول
    const initial = useMemo(() => getInitial(displayName), [displayName]);

    // لون الخلفية
    const gradientColor = useMemo(() => {
        return customGradient || getColorFromName(displayName);
    }, [customGradient, displayName]);

    // هل الصورة صالحة؟
    const hasValidImage = isValidImageUrl(src) && !imageError;

    // معالجة خطأ تحميل الصورة
    const handleImageError = useCallback(() => {
        console.warn('Avatar image failed to load:', src);
        setImageError(true);
    }, [src]);

    // معالجة نجاح تحميل الصورة
    const handleImageLoad = useCallback(() => {
        setImageLoaded(true);
    }, []);

    // Reset error state when src changes و التحقق من الصور المخزنة في cache
    useEffect(() => {
        setImageError(false);
        setImageLoaded(false);

        // للصور المخزنة في cache - نحتاج انتظار قليل حتى يتم render العنصر
        const checkCached = setTimeout(() => {
            if (imgRef.current && imgRef.current.complete && imgRef.current.naturalWidth > 0) {
                setImageLoaded(true);
            }
        }, 50);

        return () => clearTimeout(checkCached);
    }, [src]);

    const { container, text, icon } = sizeStyles[size];
    const roundedClass = roundedStyles[rounded];
    const ringClass = ring ? `ring-2 ring-offset-2 ${ringColor}` : '';

    // Fallback content (حرف أو أيقونة)
    const fallbackContent = showIcon ? (
        <UserCircle className={`${icon} text-white drop-shadow-lg`} />
    ) : (
        <span className={`${text} font-bold text-white drop-shadow-sm`}>
            {initial}
        </span>
    );

    return (
        <div
            className={`avatar relative shrink-0 overflow-hidden ${container} ${roundedClass} ${ringClass} ${containerClassName}`}
            style={{ aspectRatio: '1/1' }}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
        >
            {/* الخلفية الملونة (fallback) - تظهر دائماً */}
            <div
                className={`absolute inset-0 bg-gradient-to-br ${gradientColor} ${roundedClass} flex items-center justify-center`}
            >
                {fallbackContent}
            </div>

            {/* الصورة كـ background-image - لا تتأثر بقواعد img */}
            {hasValidImage && (
                <div
                    className={`absolute inset-0 ${roundedClass} ${className}`}
                    style={{
                        backgroundImage: `url(${src})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        opacity: imageLoaded ? 1 : 0,
                        transition: 'opacity 200ms',
                    }}
                />
            )}

            {/* img مخفية لأغراض الـ onLoad و onError فقط */}
            {hasValidImage && (
                <img
                    ref={imgRef}
                    src={src!}
                    alt={displayName}
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                    style={{
                        position: 'absolute',
                        width: '1px',
                        height: '1px',
                        opacity: 0,
                        pointerEvents: 'none',
                    }}
                    referrerPolicy="no-referrer"
                />
            )}
        </div>
    );
}

// =============================================
// AvatarGroup - لعرض مجموعة صور
// =============================================

export interface AvatarGroupProps {
    avatars: Array<{
        src?: string | null;
        name?: string | null;
        email?: string | null;
    }>;
    max?: number;
    size?: AvatarSize;
    className?: string;
}

export function AvatarGroup({
    avatars,
    max = 4,
    size = 'sm',
    className = '',
}: AvatarGroupProps) {
    const visibleAvatars = avatars.slice(0, max);
    const remaining = avatars.length - max;

    return (
        <div className={`flex -space-x-2 rtl:space-x-reverse ${className}`}>
            {visibleAvatars.map((avatar, index) => (
                <Avatar
                    key={index}
                    src={avatar.src}
                    name={avatar.name}
                    email={avatar.email}
                    size={size}
                    ring
                    containerClassName="relative z-[1] hover:z-10 transition-all"
                />
            ))}
            {remaining > 0 && (
                <div
                    className={`
                        ${sizeStyles[size].container}
                        rounded-full bg-gray-200 dark:bg-gray-700
                        ring-2 ring-white dark:ring-gray-900
                        flex items-center justify-center
                        ${sizeStyles[size].text}
                        font-medium text-gray-600 dark:text-gray-300
                    `}
                >
                    +{remaining}
                </div>
            )}
        </div>
    );
}

export default Avatar;
