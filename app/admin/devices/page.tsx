'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Users, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { UserDevicesList } from '@/components/admin/UserDevicesList';
import { VisitorDevicesList } from '@/components/admin/VisitorDevicesList';
import { getAllDevices, deleteDevice } from '@/lib/actions/track-device';
import { getAllVisitorDevices, deleteVisitorDevice } from '@/lib/actions/track-visitor';

const ITEMS_PER_PAGE = 20;

// Types
interface UserDevice {
    id: string;
    user_id: string;
    device_type: 'mobile' | 'desktop' | 'tablet' | 'unknown';
    os_name: string | null;
    os_version: string | null;
    browser: string | null;
    browser_version: string | null;
    ip_address: string | null;
    country: string | null;
    city: string | null;
    user_agent: string | null;
    first_seen_at: string;
    last_seen_at: string;
    login_count: number;
    is_current_device: boolean;
    profiles?: {
        id: string;
        name: string;
        email: string;
        avatar_url: string | null;
        role: string;
    };
}

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

// Pagination Component
function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage,
}: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
}) {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between mt-6 p-4 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-[#2a2a2a]">
            <div className="text-sm text-gray-500">
                عرض {startItem} - {endItem} من {totalItems}
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                            pageNum = i + 1;
                        } else if (currentPage <= 3) {
                            pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                        } else {
                            pageNum = currentPage - 2 + i;
                        }

                        return (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === pageNum
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333]'
                                    }`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-[#2a2a2a] hover:bg-gray-200 dark:hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

export default function DevicesPage() {
    const [activeTab, setActiveTab] = useState<'users' | 'visitors'>('users');

    // User Devices State
    const [userDevices, setUserDevices] = useState<UserDevice[]>([]);
    const [isUsersLoading, setIsUsersLoading] = useState(true);
    const [userTotal, setUserTotal] = useState(0);
    const [userPage, setUserPage] = useState(1);

    // Visitor Devices State
    const [visitorDevices, setVisitorDevices] = useState<VisitorDevice[]>([]);
    const [isVisitorsLoading, setIsVisitorsLoading] = useState(true);
    const [visitorTotal, setVisitorTotal] = useState(0);
    const [visitorPage, setVisitorPage] = useState(1);

    const [error, setError] = useState<string | null>(null);

    const fetchUserDevices = useCallback(async (page: number = 1) => {
        setIsUsersLoading(true);
        setError(null);
        try {
            const offset = (page - 1) * ITEMS_PER_PAGE;
            const result = await getAllDevices({ limit: ITEMS_PER_PAGE, offset });
            if (result.success) {
                setUserDevices(result.devices as UserDevice[]);
                setUserTotal(result.total || 0);
            } else {
                setError(result.error || 'فشل في جلب أجهزة المستخدمين');
            }
        } catch (err) {
            setError('حدث خطأ في الاتصال');
        } finally {
            setIsUsersLoading(false);
        }
    }, []);

    const fetchVisitorDevices = useCallback(async (page: number = 1) => {
        setIsVisitorsLoading(true);
        setError(null);
        try {
            const offset = (page - 1) * ITEMS_PER_PAGE;
            const result = await getAllVisitorDevices({ limit: ITEMS_PER_PAGE, offset });
            if (result.success) {
                setVisitorDevices(result.devices as VisitorDevice[]);
                setVisitorTotal(result.total || 0);
            } else {
                setError(result.error || 'فشل في جلب أجهزة الزوار');
            }
        } catch (err) {
            setError('حدث خطأ في الاتصال');
        } finally {
            setIsVisitorsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserDevices(userPage);
    }, [fetchUserDevices, userPage]);

    useEffect(() => {
        fetchVisitorDevices(visitorPage);
    }, [fetchVisitorDevices, visitorPage]);

    const handleUserDelete = async (deviceId: string) => {
        const result = await deleteDevice(deviceId);
        if (result.success) {
            setUserDevices((prev) => prev.filter((d) => d.id !== deviceId));
            setUserTotal((prev) => prev - 1);
        }
    };

    const handleVisitorDelete = async (deviceId: string) => {
        const result = await deleteVisitorDevice(deviceId);
        if (result.success) {
            setVisitorDevices((prev) => prev.filter((d) => d.id !== deviceId));
            setVisitorTotal((prev) => prev - 1);
        }
    };

    const handleRefresh = () => {
        if (activeTab === 'users') {
            fetchUserDevices(userPage);
        } else {
            fetchVisitorDevices(visitorPage);
        }
    };

    const handleUserPageChange = (page: number) => {
        setUserPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleVisitorPageChange = (page: number) => {
        setVisitorPage(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const isLoading = activeTab === 'users' ? isUsersLoading : isVisitorsLoading;
    const userTotalPages = Math.ceil(userTotal / ITEMS_PER_PAGE);
    const visitorTotalPages = Math.ceil(visitorTotal / ITEMS_PER_PAGE);

    return (
        <div className="max-w-6xl mx-auto space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        تتبع الأجهزة
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        مراقبة أجهزة المستخدمين والزوار
                    </p>
                </div>

                <button
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    تحديث
                </button>
            </div>

            {/* Error State */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400"
                >
                    {error}
                </motion.div>
            )}

            {/* Custom Tabs */}
            <div className="flex p-1 bg-gray-100 dark:bg-[#1a1a1a] rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'users'
                        ? 'bg-white dark:bg-[#2a2a2a] text-primary-600 dark:text-primary-400 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                >
                    <Users className="h-4 w-4" />
                    المسجلين
                    <span className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs">
                        {userTotal}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('visitors')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'visitors'
                        ? 'bg-white dark:bg-[#2a2a2a] text-primary-600 dark:text-primary-400 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                >
                    <Eye className="h-4 w-4" />
                    الزوار
                    <span className="bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full text-xs">
                        {visitorTotal}
                    </span>
                </button>
            </div>

            {/* Devices Lists */}
            <div className="min-h-[400px]">
                {activeTab === 'users' ? (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <UserDevicesList
                            devices={userDevices}
                            isLoading={isUsersLoading}
                            isAdmin={true}
                            showUserInfo={true}
                            onRefresh={() => fetchUserDevices(userPage)}
                            onDelete={handleUserDelete}
                        />
                        <Pagination
                            currentPage={userPage}
                            totalPages={userTotalPages}
                            onPageChange={handleUserPageChange}
                            totalItems={userTotal}
                            itemsPerPage={ITEMS_PER_PAGE}
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <VisitorDevicesList
                            devices={visitorDevices}
                            isLoading={isVisitorsLoading}
                            onRefresh={() => fetchVisitorDevices(visitorPage)}
                            onDelete={handleVisitorDelete}
                        />
                        <Pagination
                            currentPage={visitorPage}
                            totalPages={visitorTotalPages}
                            onPageChange={handleVisitorPageChange}
                            totalItems={visitorTotal}
                            itemsPerPage={ITEMS_PER_PAGE}
                        />
                    </motion.div>
                )}
            </div>
        </div>
    );
}
