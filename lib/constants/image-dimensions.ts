// =============================================
// Image Dimensions Constants - مقاسات الصور الثابتة
// =============================================

/**
 * مقاسات الصور المعيارية في التطبيق
 * الصور تتعدل على هذه المقاسات وليس العكس
 */

// صورة البروفايل/Avatar - مربعة
export const AVATAR_DIMENSIONS = {
    width: 256,
    height: 256,
    aspectRatio: 1, // 1:1
    maxSizeMB: 0.3,
    quality: 0.85,
} as const;

// صورة الغلاف - مستطيلة عريضة
export const COVER_DIMENSIONS = {
    width: 1200,
    height: 400,
    aspectRatio: 3, // 3:1
    maxSizeMB: 0.8,
    quality: 0.85,
} as const;

// أحجام الـ Avatar المختلفة للعرض (بالـ pixels)
export const AVATAR_DISPLAY_SIZES = {
    xs: 24,   // 24x24
    sm: 32,   // 32x32
    md: 40,   // 40x40
    lg: 56,   // 56x56
    xl: 80,   // 80x80
    '2xl': 112, // 112x112
} as const;

// CSS classes للأحجام
export const AVATAR_SIZE_CLASSES = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-28 h-28',
} as const;

export type AvatarSizeKey = keyof typeof AVATAR_DISPLAY_SIZES;
