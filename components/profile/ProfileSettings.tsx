'use client';

// =============================================
// ProfileSettings Component - إعدادات الملف الشخصي
// =============================================

import { useRef } from 'react';
import { motion } from 'framer-motion';
import {
    User,
    Camera,
    Loader2,
    Save,
    Settings,
    Upload,
    Image as ImageIcon,
} from 'lucide-react';
import { Avatar } from '@/components/common';
import type { ProfileFormData, Stage } from './types';

interface ProfileSettingsProps {
    formData: ProfileFormData;
    stages: Stage[];
    isSaving: boolean;
    isUploadingImage: boolean;
    canEditImage?: boolean; // للتحكم في إمكانية تغيير الصورة (فقط المدرسين)
    onFormChange: (data: Partial<ProfileFormData>) => void;
    onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onSave: () => void;
}

export function ProfileSettings({
    formData,
    stages,
    isSaving,
    isUploadingImage,
    canEditImage = false,
    onFormChange,
    onImageUpload,
    onSave,
}: ProfileSettingsProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Profile Settings */}
            <div className="bg-white/80 dark:bg-[#1c1c24]/80 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-6 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-violet-500" />
                    إعدادات الحساب
                </h3>

                <div className="space-y-6">
                    {/* Avatar Upload */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            صورة الملف الشخصي
                        </label>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                                    <Avatar
                                        src={formData.avatar_url}
                                        name={formData.name}
                                        size="2xl"
                                        rounded="2xl"
                                        showIcon={!formData.name}
                                        customGradient="from-violet-500 to-purple-600"
                                    />
                                </div>
                                {isUploadingImage && (
                                    <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                                        <Loader2 className="h-6 w-6 text-white animate-spin" />
                                    </div>
                                )}
                            </div>
                            <div>
                                {canEditImage ? (
                                    <>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={onImageUpload}
                                            className="hidden"
                                        />
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploadingImage}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors font-medium text-sm disabled:opacity-50"
                                        >
                                            <Upload className="h-4 w-4" />
                                            تحميل صورة
                                        </button>
                                        <p className="text-xs text-gray-500 mt-2">
                                            JPG, PNG أو GIF. الحد الأقصى 5 ميجابايت
                                        </p>
                                    </>
                                ) : (
                                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            تغيير صورة الملف الشخصي متاح للمدرسين فقط.
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                            يمكنك التسجيل كمدرس لتفعيل هذه الميزة.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            الاسم
                        </label>
                        <div className="relative">
                            <User className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => onFormChange({ name: e.target.value })}
                                placeholder="أدخل اسمك"
                                className="w-full pr-12 pl-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Bio Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            نبذة عنك
                        </label>
                        <textarea
                            value={formData.bio}
                            onChange={(e) => onFormChange({ bio: e.target.value })}
                            placeholder="أخبرنا قليلاً عن نفسك..."
                            rows={4}
                            className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all text-gray-900 dark:text-white resize-none"
                        />
                    </div>

                    {/* Educational Stage Select */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            المرحلة الدراسية
                        </label>
                        <select
                            value={formData.educational_stage_id}
                            onChange={(e) => onFormChange({ educational_stage_id: e.target.value })}
                            className="w-full px-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all text-gray-900 dark:text-white"
                        >
                            <option value="">اختر المرحلة الدراسية</option>
                            {stages.map((stage) => (
                                <option key={stage.id} value={stage.id}>
                                    {stage.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={onSave}
                        disabled={isSaving}
                        className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                جاري الحفظ...
                            </>
                        ) : (
                            <>
                                <Save className="h-5 w-5" />
                                حفظ التغييرات
                            </>
                        )}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
