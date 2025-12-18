'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone, Tablet, RefreshCw, ArrowLeft, Users, Eye } from 'lucide-react';
import Link from 'next/link';
import { UserDevicesList } from '@/components/admin/UserDevicesList';
import { VisitorDevicesList } from '@/components/admin/VisitorDevicesList';
import { getAllDevices, deleteDevice } from '@/lib/actions/track-device';
import { getAllVisitorDevices, deleteVisitorDevice } from '@/lib/actions/track-visitor';

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

export default function DevicesPage() {
    const [activeTab, setActiveTab] = useState<'users' | 'visitors'>('users');

    // User Devices State
    const [userDevices, setUserDevices] = useState<UserDevice[]>([]);
    const [isUsersLoading, setIsUsersLoading] = useState(true);
    const [userTotal, setUserTotal] = useState(0);

    // Visitor Devices State
    const [visitorDevices, setVisitorDevices] = useState<VisitorDevice[]>([]);
    const [isVisitorsLoading, setIsVisitorsLoading] = useState(true);
    const [visitorTotal, setVisitorTotal] = useState(0);

    const [error, setError] = useState<string | null>(null);

    const fetchUserDevices = useCallback(async () => {
        setIsUsersLoading(true);
        setError(null);
        try {
            const result = await getAllDevices({ limit: 100 });
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

    const fetchVisitorDevices = useCallback(async () => {
        setIsVisitorsLoading(true);
        setError(null);
        try {
            const result = await getAllVisitorDevices({ limit: 100 });
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
        fetchUserDevices();
        fetchVisitorDevices();
    }, [fetchUserDevices, fetchVisitorDevices]);

    const handleUserDelete = async (deviceId: string) => {
        const result = await deleteDevice(deviceId);
        if (result.success) {
            setUserDevices((prev) => prev.filter((d) => d.id !== deviceId));
        }
    };

    const handleVisitorDelete = async (deviceId: string) => {
        const result = await deleteVisitorDevice(deviceId);
        if (result.success) {
            setVisitorDevices((prev) => prev.filter((d) => d.id !== deviceId));
        }
    };

    const handleRefresh = () => {
        if (activeTab === 'users') {
            fetchUserDevices();
        } else {
            fetchVisitorDevices();
        }
    };

    const isLoading = activeTab === 'users' ? isUsersLoading : isVisitorsLoading;

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
                            onRefresh={fetchUserDevices}
                            onDelete={handleUserDelete}
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
                            onRefresh={fetchVisitorDevices}
                            onDelete={handleVisitorDelete}
                        />
                    </motion.div>
                )}
            </div>
        </div>
    );
}
