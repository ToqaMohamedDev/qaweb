'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Smartphone,
    Monitor,
    Tablet,
    Globe,
    Clock,
    MapPin,
    Trash2,
    RefreshCw,
    Shield,
    AlertCircle,
    CheckCircle2,
    Search,
    User,
    Eye
} from 'lucide-react';

// Types
interface VisitorDevice {
    id: string;
    visitor_id: string;
    device_type: 'mobile' | 'desktop' | 'tablet' | 'unknown';
    os_name: string | null;
    os_version: string | null;
    browser: string | null;
    browser_version: string | null;
    ip_address: string | null;
    country: string | null;
    city: string | null;
    user_agent: string | null;
    page_url: string | null;
    referrer: string | null;
    first_seen_at: string;
    last_seen_at: string;
    visit_count: number;
}

interface VisitorDevicesListProps {
    devices: VisitorDevice[];
    isLoading?: boolean;
    onRefresh?: () => void;
    onDelete?: (deviceId: string) => Promise<void>;
}

// Helper: Check if device was active recently (within 5 minutes)
function isRecentlyActive(lastSeenAt: string): boolean {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    return new Date(lastSeenAt).getTime() > fiveMinutesAgo;
}

// Helper: Format relative time with high precision
function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffSecs < 10) return 'الآن';
    if (diffSecs < 60) return `منذ ${diffSecs} ثانية`;
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسبوع`;
    return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Device Icon Component
function DeviceIcon({ type, className = '' }: { type: string; className?: string }) {
    switch (type) {
        case 'mobile':
            return <Smartphone className={className} />;
        case 'tablet':
            return <Tablet className={className} />;
        case 'desktop':
            return <Monitor className={className} />;
        default:
            return <Globe className={className} />;
    }
}

// OS Icon/Badge
function OSBadge({ osName }: { osName: string | null }) {
    if (!osName) return null;

    const getOSColor = () => {
        if (osName.includes('Windows')) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        if (osName.includes('Mac') || osName.includes('iOS')) return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
        if (osName.includes('Android')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        if (osName.includes('Linux')) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    };

    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getOSColor()}`}>
            {osName}
        </span>
    );
}

// Single Device Card
function VisitorDeviceCard({
    device,
    onDelete,
}: {
    device: VisitorDevice;
    onDelete?: (id: string) => Promise<void>;
}) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const isActive = isRecentlyActive(device.last_seen_at);

    const handleDelete = async () => {
        if (!onDelete) return;
        setIsDeleting(true);
        try {
            await onDelete(device.id);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`relative bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a] overflow-hidden hover:shadow-lg transition-shadow`}
        >
            <div className="p-4">
                <div className="flex items-start gap-4">
                    {/* Device Icon */}
                    <div className={`p-3 rounded-xl ${isActive
                        ? 'bg-orange-100 dark:bg-orange-900/30'
                        : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                        <DeviceIcon
                            type={device.device_type}
                            className={`h-6 w-6 ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500'}`}
                        />
                    </div>

                    {/* Device Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                {device.browser || 'متصفح غير معروف'}
                            </h4>
                            {/* Activity Indicator */}
                            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-orange-500 animate-pulse' : 'bg-gray-300'
                                }`} title={isActive ? 'نشط الآن' : 'غير نشط'} />
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <OSBadge osName={device.os_name} />
                            {device.browser_version && (
                                <span className="text-xs text-gray-400">v{device.browser_version}</span>
                            )}
                            <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-400 font-mono" title="Visitor ID">
                                {device.visitor_id.substring(0, 8)}...
                            </span>
                        </div>

                        {/* Details */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                            {device.ip_address && (
                                <span className="flex items-center gap-1" title="IP Address">
                                    <Globe className="h-3 w-3" />
                                    {device.ip_address}
                                </span>
                            )}
                            {(device.city || device.country) && (
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {[device.city, device.country].filter(Boolean).join(', ')}
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatRelativeTime(device.last_seen_at)}
                            </span>
                        </div>

                        {/* Actions Row */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                            {/* Stats */}
                            <div className="flex items-center gap-4 text-xs">
                                <span className="text-gray-400">
                                    الزيارات: <span className="font-semibold text-gray-600 dark:text-gray-300">{device.visit_count}</span>
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="text-xs text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                                >
                                    {isExpanded ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
                                </button>
                                {onDelete && (
                                    <button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                                        title="إزالة الجهاز"
                                    >
                                        {isDeleting ? (
                                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-gray-50 dark:bg-[#111] border-t border-gray-200 dark:border-[#2a2a2a]"
                    >
                        <div className="p-4 space-y-3 text-xs text-gray-600 dark:text-gray-300">
                            {/* Page Info */}
                            {(device.page_url || device.referrer) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {device.page_url && (
                                        <div>
                                            <span className="block font-semibold mb-1">آخر صفحة:</span>
                                            <a href={device.page_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline break-all">
                                                {device.page_url}
                                            </a>
                                        </div>
                                    )}
                                    {device.referrer && (
                                        <div>
                                            <span className="block font-semibold mb-1">المصدر (Referrer):</span>
                                            <a href={device.referrer} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline break-all">
                                                {device.referrer}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Technical Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-gray-200 dark:border-gray-800">
                                <div>
                                    <span className="block font-semibold text-gray-500 mb-1">نظام التشغيل:</span>
                                    {device.os_name} {device.os_version}
                                </div>
                                <div>
                                    <span className="block font-semibold text-gray-500 mb-1">المتصفح:</span>
                                    {device.browser} {device.browser_version}
                                </div>
                                <div>
                                    <span className="block font-semibold text-gray-500 mb-1">IP Address:</span>
                                    {device.ip_address}
                                </div>
                                <div>
                                    <span className="block font-semibold text-gray-500 mb-1">أول زيارة:</span>
                                    {new Date(device.first_seen_at).toLocaleString('ar-EG')}
                                </div>
                            </div>

                            {/* Map Link */}
                            {(device.city || device.country) && (
                                <div className="pt-2">
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${device.city},${device.country}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                                    >
                                        <MapPin className="h-3 w-3" />
                                        عرض الموقع على الخريطة
                                    </a>
                                </div>
                            )}

                            {/* User Agent */}
                            <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                                <span className="block font-semibold text-gray-500 mb-1">User Agent String:</span>
                                <code className="block bg-gray-100 dark:bg-black p-2 rounded text-[10px] break-all font-mono text-gray-500">
                                    {device.user_agent}
                                </code>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// Main Component
export function VisitorDevicesList({
    devices,
    isLoading = false,
    onRefresh,
    onDelete,
}: VisitorDevicesListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<string>('all');

    // Filter devices
    const filteredDevices = devices.filter((device) => {
        const matchesSearch =
            device.browser?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            device.os_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            device.ip_address?.includes(searchQuery) ||
            device.visitor_id.includes(searchQuery);

        const matchesType = filterType === 'all' || device.device_type === filterType;

        return matchesSearch && matchesType;
    });

    // Stats
    const stats = {
        total: devices.length,
        active: devices.filter((d) => isRecentlyActive(d.last_seen_at)).length,
        mobile: devices.filter((d) => d.device_type === 'mobile').length,
        desktop: devices.filter((d) => d.device_type === 'desktop').length,
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-xl h-32" />
                ))}
            </div>
        );
    }

    if (devices.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 dark:bg-[#1a1a1a] rounded-2xl">
                <Eye className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    لا يوجد زوار مسجلين
                </h3>
                <p className="text-gray-500">سيظهر هنا سجل أجهزة الزوار غير المسجلين</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-4 border border-gray-200 dark:border-[#2a2a2a]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <Eye className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                            <p className="text-xs text-gray-500">إجمالي الزوار</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-4 border border-gray-200 dark:border-[#2a2a2a]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.active}</p>
                            <p className="text-xs text-gray-500">نشط الآن</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-4 border border-gray-200 dark:border-[#2a2a2a]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.mobile}</p>
                            <p className="text-xs text-gray-500">موبايل</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#1a1a1a] rounded-xl p-4 border border-gray-200 dark:border-[#2a2a2a]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Monitor className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.desktop}</p>
                            <p className="text-xs text-gray-500">كمبيوتر</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="بحث عن زائر، متصفح، IP..."
                        className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] outline-none text-sm focus:border-primary-500"
                    />
                </div>

                <div className="flex gap-2">
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-sm outline-none focus:border-primary-500"
                    >
                        <option value="all">كل الأجهزة</option>
                        <option value="mobile">موبايل</option>
                        <option value="desktop">كمبيوتر</option>
                        <option value="tablet">تابلت</option>
                    </select>

                    {onRefresh && (
                        <button
                            onClick={onRefresh}
                            className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#222] transition-colors"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Results count */}
            <p className="text-sm text-gray-500">
                عرض {filteredDevices.length} من {devices.length} زائر
            </p>

            {/* Devices List */}
            <AnimatePresence mode="popLayout">
                <div className="space-y-3">
                    {filteredDevices.map((device) => (
                        <VisitorDeviceCard
                            key={device.id}
                            device={device}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            </AnimatePresence>

            {filteredDevices.length === 0 && devices.length > 0 && (
                <div className="text-center py-8 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl">
                    <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">لا توجد نتائج مطابقة للبحث</p>
                </div>
            )}
        </div>
    );
}

export default VisitorDevicesList;
