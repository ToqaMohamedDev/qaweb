'use client';

// =============================================
// RecentUsersTable Component - جدول المستخدمين الجدد
// =============================================

import Link from 'next/link';
import { Users, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import type { RecentUser } from './types';
import { itemVariants } from '@/lib/animations';
import { getTimeAgo, getRoleBadge } from './utils';
import { Avatar } from '@/components/common';

interface RecentUsersTableProps {
    users: RecentUser[];
}

export function RecentUsersTable({ users }: RecentUsersTableProps) {
    return (
        <motion.div
            variants={itemVariants}
            className="lg:col-span-2 bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">المستخدمين الجدد</h2>
                </div>
                <Link
                    href="/admin/users"
                    className="flex items-center gap-1 text-sm text-primary-600 font-medium hover:underline"
                >
                    <span>عرض الكل</span>
                    <ArrowUpRight className="h-4 w-4" />
                </Link>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                        <tr>
                            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                                المستخدم
                            </th>
                            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                                الدور
                            </th>
                            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                                الحالة
                            </th>
                            <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                                التسجيل
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-5 py-12 text-center">
                                    <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                    <p className="text-gray-500">لا يوجد مستخدمين جدد</p>
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr
                                    key={user.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                                >
                                    <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar
                                                src={user.avatar_url}
                                                name={user.name}
                                                email={user.email}
                                                size="md"
                                                customGradient="from-primary-400 to-primary-600"
                                            />
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {user.name || 'بدون اسم'}
                                                </p>
                                                <p className="text-xs text-gray-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4">{getRoleBadge(user.role)}</td>
                                    <td className="px-5 py-4">
                                        <span
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${user.is_verified
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
                                                }`}
                                        >
                                            {user.is_verified ? (
                                                <>
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    موثق
                                                </>
                                            ) : (
                                                <>
                                                    <Clock className="h-3 w-3" />
                                                    قيد المراجعة
                                                </>
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-500">
                                        {getTimeAgo(user.created_at)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </motion.div>
    );
}
