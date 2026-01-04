// =============================================
// Formatter Utilities - دوال التنسيق
// =============================================

/**
 * تنسيق الأرقام الكبيرة (مثل عدد المشتركين)
 * @example formatCount(1500000) => "1.5 مليون"
 * @example formatCount(1500) => "1.5K"
 */
export function formatCount(count: number): string {
    if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)} مليون`;
    }
    if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
}

/**
 * تنسيق التاريخ بالعربية - بتوقيت مصر
 * @example formatDate('2024-12-20') => "20 ديسمبر 2024"
 */
export function formatDate(dateString: string, locale: string = 'ar-EG'): string {
    const date = new Date(dateString);
    return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Africa/Cairo',
    });
}

/**
 * تنسيق الوقت النسبي
 * @example formatRelativeTime('2024-12-19') => "منذ يوم"
 */
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'الآن';
    if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسبوع`;
    if (diffDays < 365) return `منذ ${Math.floor(diffDays / 30)} شهر`;
    return `منذ ${Math.floor(diffDays / 365)} سنة`;
}

/**
 * تنسيق تاريخ الامتحان بدقة - يظهر اليوم والساعة
 * @example formatExamDate('2024-12-20T14:30:00') => "الجمعة 20 ديسمبر - 2:30 م"
 * @example formatExamDate('today') => "اليوم - 2:30 م"
 */
export function formatExamDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();

    // Get time in Arabic format with Egypt timezone
    const timeOptions: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Africa/Cairo',
    };
    const time = date.toLocaleTimeString('ar-EG', timeOptions);

    // Get date parts in Egypt timezone for accurate day calculation
    const egyptOptions: Intl.DateTimeFormatOptions = { timeZone: 'Africa/Cairo' };
    const egyptDate = new Date(date.toLocaleString('en-US', egyptOptions));
    const egyptNow = new Date(now.toLocaleString('en-US', egyptOptions));

    // Calculate days difference based on Egypt timezone
    const startOfToday = new Date(egyptNow.getFullYear(), egyptNow.getMonth(), egyptNow.getDate());
    const startOfDate = new Date(egyptDate.getFullYear(), egyptDate.getMonth(), egyptDate.getDate());
    const diffDays = Math.floor((startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24));

    // Get day name in Egypt timezone
    const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const dayName = dayNames[egyptDate.getDay()];

    // Today
    if (diffDays === 0) {
        return `اليوم - ${time}`;
    }

    // Yesterday
    if (diffDays === 1) {
        return `أمس - ${time}`;
    }

    // This week (within 7 days)
    if (diffDays < 7) {
        return `${dayName} - ${time}`;
    }

    // This month or recent
    if (diffDays < 30) {
        const day = egyptDate.getDate();
        return `${dayName} ${day} - ${time}`;
    }

    // Older dates - show full date with Egypt timezone
    const dateOptions: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'short',
        year: egyptDate.getFullYear() !== egyptNow.getFullYear() ? 'numeric' : undefined,
        timeZone: 'Africa/Cairo',
    };
    const dateFormatted = date.toLocaleDateString('ar-EG', dateOptions);
    return `${dateFormatted} - ${time}`;
}

/**
 * تنسيق النسبة المئوية
 * @example formatPercentage(0.856) => "86%"
 */
export function formatPercentage(value: number, decimals: number = 0): string {
    return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * تنسيق المدة الزمنية بالدقائق
 * @example formatDuration(90) => "1 ساعة و 30 دقيقة"
 */
export function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) return `${hours} ساعة`;
    return `${hours} ساعة و ${remainingMinutes} دقيقة`;
}

/**
 * اختصار النص الطويل
 * @example truncateText('نص طويل جداً', 10) => "نص طويل..."
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
}

/**
 * تنسيق رقم الهاتف
 * @example formatPhoneNumber('01234567890') => "0123 456 7890"
 */
export function formatPhoneNumber(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
        return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
    }
    return phone;
}

/**
 * Alias for formatRelativeTime for backwards compatibility
 */
export const formatRelativeDate = formatRelativeTime;

/**
 * تحويل تاريخ ISO إلى صيغة datetime-local بتوقيت مصر
 * @example isoToDatetimeLocal('2026-03-01T04:56:00.000Z') => '2026-03-01T06:56'
 */
export function isoToDatetimeLocal(isoString: string | null | undefined): string {
    if (!isoString) return '';

    try {
        const date = new Date(isoString);

        // تحويل إلى توقيت مصر
        const egyptDate = new Date(date.toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));

        // تنسيق كـ datetime-local (YYYY-MM-DDTHH:mm)
        const year = egyptDate.getFullYear();
        const month = String(egyptDate.getMonth() + 1).padStart(2, '0');
        const day = String(egyptDate.getDate()).padStart(2, '0');
        const hours = String(egyptDate.getHours()).padStart(2, '0');
        const minutes = String(egyptDate.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch {
        return '';
    }
}

/**
 * تحويل صيغة datetime-local إلى تاريخ ISO بتوقيت مصر
 * @example datetimeLocalToIso('2026-03-01T06:56') => '2026-03-01T04:56:00.000Z'
 */
export function datetimeLocalToIso(datetimeLocal: string | null | undefined): string | null {
    if (!datetimeLocal) return null;

    try {
        // datetime-local format: YYYY-MM-DDTHH:mm
        // نعتبر أن المستخدم أدخل الوقت بتوقيت مصر
        // توقيت مصر: UTC+2 (أو UTC+3 في التوقيت الصيفي)

        // إنشاء التاريخ مع افتراض أنه بتوقيت مصر
        const [datePart, timePart] = datetimeLocal.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        const [hours, minutes] = timePart.split(':').map(Number);

        // إنشاء تاريخ UTC (سنضيف الفرق لاحقاً)
        // Egypt is UTC+2 (or UTC+3 in summer)
        const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));

        // نحتاج لطرح ساعتين (أو 3 في الصيف) للتحويل من توقيت مصر إلى UTC
        // للتبسيط، نطرح ساعتين (التوقيت الشتوي)
        // TODO: يمكن تحسين هذا للتعامل مع التوقيت الصيفي
        date.setUTCHours(date.getUTCHours() - 2);

        return date.toISOString();
    } catch {
        return null;
    }
}

/**
 * تنسيق التاريخ والوقت بتوقيت مصر للعرض
 * @example formatDateTimeEgypt('2026-03-01T04:56:00.000Z') => '2026/03/01, 06:56 ص'
 */
export function formatDateTimeEgypt(isoString: string | null | undefined, locale: 'ar-EG' | 'en-US' = 'ar-EG'): string {
    if (!isoString) return '';

    try {
        const date = new Date(isoString);
        return date.toLocaleString(locale, {
            timeZone: 'Africa/Cairo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    } catch {
        return '';
    }
}

/**
 * الحصول على التاريخ والوقت الحالي بتوقيت مصر
 * @returns { date: 'YYYY-MM-DD', time: 'HH:MM', hours: number, minutes: number }
 */
export function getEgyptNow(): { date: string; time: string; hours: number; minutes: number; fullDatetime: string } {
    const now = new Date();

    // تحويل إلى توقيت مصر
    const egyptDate = new Date(now.toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));

    const year = egyptDate.getFullYear();
    const month = String(egyptDate.getMonth() + 1).padStart(2, '0');
    const day = String(egyptDate.getDate()).padStart(2, '0');
    const hours = egyptDate.getHours();
    const minutes = egyptDate.getMinutes();
    const hoursStr = String(hours).padStart(2, '0');
    const minutesStr = String(minutes).padStart(2, '0');

    return {
        date: `${year}-${month}-${day}`,
        time: `${hoursStr}:${minutesStr}`,
        hours,
        minutes,
        fullDatetime: `${year}-${month}-${day}T${hoursStr}:${minutesStr}`,
    };
}

/**
 * تحويل تاريخ ووقت منفصلين إلى ISO بتوقيت مصر
 * @example dateTimeToIso('2026-03-01', '14:30') => '2026-03-01T12:30:00.000Z'
 */
export function dateTimeToIso(dateStr: string, timeStr: string): string | null {
    if (!dateStr || !timeStr) return null;

    try {
        const [year, month, day] = dateStr.split('-').map(Number);
        const [hours, minutes] = timeStr.split(':').map(Number);

        // إنشاء تاريخ UTC
        const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));

        // طرح ساعتين للتحويل من توقيت مصر إلى UTC
        date.setUTCHours(date.getUTCHours() - 2);

        return date.toISOString();
    } catch {
        return null;
    }
}

/**
 * تحويل تاريخ ISO إلى تاريخ ووقت منفصلين بتوقيت مصر
 * @example isoToDateTime('2026-03-01T12:30:00.000Z') => { date: '2026-03-01', time: '14:30' }
 */
export function isoToDateTime(isoString: string | null | undefined): { date: string; time: string } {
    if (!isoString) return { date: '', time: '' };

    try {
        const date = new Date(isoString);

        // تحويل إلى توقيت مصر
        const egyptDate = new Date(date.toLocaleString('en-US', { timeZone: 'Africa/Cairo' }));

        const year = egyptDate.getFullYear();
        const month = String(egyptDate.getMonth() + 1).padStart(2, '0');
        const day = String(egyptDate.getDate()).padStart(2, '0');
        const hours = String(egyptDate.getHours()).padStart(2, '0');
        const minutes = String(egyptDate.getMinutes()).padStart(2, '0');

        return {
            date: `${year}-${month}-${day}`,
            time: `${hours}:${minutes}`,
        };
    } catch {
        return { date: '', time: '' };
    }
}

/**
 * تنسيق الوقت بتوقيت مصر (12 ساعة)
 * @example formatTimeEgypt('14:30') => '2:30 م'
 */
export function formatTimeEgypt(timeStr: string, locale: 'ar-EG' | 'en-US' = 'ar-EG'): string {
    if (!timeStr) return '';

    try {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const period = hours >= 12 ? (locale === 'ar-EG' ? 'م' : 'PM') : (locale === 'ar-EG' ? 'ص' : 'AM');
        const hour12 = hours % 12 || 12;

        return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
    } catch {
        return '';
    }
}

/**
 * تنسيق التاريخ بالعربي بشكل جميل
 * @example formatDateArabic('2026-03-01') => 'الأحد 1 مارس 2026'
 */
export function formatDateArabic(dateStr: string): string {
    if (!dateStr) return '';

    try {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);

        const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const dayName = dayNames[date.getDay()];
        const monthName = monthNames[month - 1];

        return `${dayName} ${day} ${monthName} ${year}`;
    } catch {
        return dateStr;
    }
}

