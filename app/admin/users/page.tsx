// =============================================
// Users Admin Page - إدارة المستخدمين
// =============================================

"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Search,
    Edit2,
    Trash2,
    Download,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    ChevronRight,
    X,
    User,
    GraduationCap,
    Crown,
    Loader2,
    AlertCircle,
    RefreshCw,
} from "lucide-react";
import { Database } from "@/lib/database.types";
import { DeleteConfirmModal } from "@/components/admin";
import {
    AdminPageHeader,
    AdminStatsGrid,
    FormField,
    FormSection,
} from "@/components/admin/shared";
import { useUsersAPI, useUpdateUserAPI, useDeleteUserAPI } from "@/lib/queries/adminQueries";
import { useUIStore } from "@/lib/stores";
import type { StatItem } from "@/components/admin/shared";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface UserFormData {
    name: string;
    email: string;
    role: Profile["role"];
    bio: string;
    specialization: string;
    teacher_title: string;
    years_of_experience: number;
    education: string;
    phone: string;
    website: string;
    teaching_style: string;
}

interface DeleteModalState {
    isOpen: boolean;
    userId: string | null;
    userName: string;
}

interface RoleConfig {
    label: string;
    color: string;
    icon: typeof User;
}

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const ITEMS_PER_PAGE = 10;

const ROLES: Record<string, RoleConfig> = {
    student: {
        label: "طالب",
        color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
        icon: User,
    },
    teacher: {
        label: "معلم",
        color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
        icon: GraduationCap,
    },
    admin: {
        label: "أدمن",
        color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
        icon: Crown,
    },
};

const ROLE_OPTIONS = [
    { value: "student", label: "طالب" },
    { value: "teacher", label: "معلم" },
    { value: "admin", label: "مشرف" },
];

const FILTER_OPTIONS = [
    { value: "all", label: "جميع الأدوار" },
    { value: "student", label: "طلاب" },
    { value: "teacher", label: "معلمين" },
    { value: "admin", label: "مشرفين" },
];

const INITIAL_FORM_DATA: UserFormData = {
    name: "",
    email: "",
    role: "student",
    bio: "",
    specialization: "",
    teacher_title: "",
    years_of_experience: 0,
    education: "",
    phone: "",
    website: "",
    teaching_style: "",
};

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

function mapProfileToFormData(user: Profile): UserFormData {
    const u = user as any;
    return {
        name: user.name || "",
        email: user.email || "",
        role: user.role,
        bio: user.bio || "",
        specialization: u.specialization || "",
        teacher_title: u.teacher_title || "",
        years_of_experience: u.years_of_experience || 0,
        education: u.education || "",
        phone: user.phone || "",
        website: u.website || "",
        teaching_style: u.teaching_style || "",
    };
}

function buildStatsItems(users: Profile[]): StatItem[] {
    return [
        {
            label: "إجمالي",
            value: users.length,
            icon: Users,
            color: "from-blue-500 to-blue-600",
        },
        {
            label: "طلاب",
            value: users.filter((u) => u.role === "student").length,
            icon: User,
            color: "from-green-500 to-green-600",
        },
        {
            label: "معلمين",
            value: users.filter((u) => u.role === "teacher").length,
            icon: GraduationCap,
            color: "from-purple-500 to-purple-600",
        },
        {
            label: "مشرفين",
            value: users.filter((u) => u.role === "admin").length,
            icon: Crown,
            color: "from-amber-500 to-amber-600",
        },
    ];
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function UsersPage() {
    const { addToast } = useUIStore();

    // Queries & Mutations (API-based for Vercel compatibility)
    const { data: users = [], isLoading, error: queryError, refetch } = useUsersAPI();
    const updateMutation = useUpdateUserAPI();
    const deleteMutation = useDeleteUserAPI();

    // Local State
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [page, setPage] = useState(1);

    // Modals State
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
        isOpen: false,
        userId: null,
        userName: "",
    });
    const [isDeleting, setIsDeleting] = useState(false);

    // Form State
    const [formData, setFormData] = useState<UserFormData>(INITIAL_FORM_DATA);

    // ═══════════════════════════════════════════════════════════════════════
    // Memoized Values
    // ═══════════════════════════════════════════════════════════════════════

    const filtered = useMemo(() => {
        return users.filter((u) => {
            const matchSearch =
                u.name?.toLowerCase().includes(search.toLowerCase()) ||
                u.email?.toLowerCase().includes(search.toLowerCase());
            const matchRole = roleFilter === "all" || u.role === roleFilter;
            return matchSearch && matchRole;
        });
    }, [users, search, roleFilter]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const stats = useMemo(() => buildStatsItems(users), [users]);

    // ═══════════════════════════════════════════════════════════════════════
    // Handlers
    // ═══════════════════════════════════════════════════════════════════════

    const handleEdit = useCallback((user: Profile) => {
        setSelectedUser(user);
        setFormData(mapProfileToFormData(user));
        setShowModal(true);
    }, []);

    const handleSave = useCallback(async () => {
        if (!selectedUser) return;

        try {
            const updates: any = {
                name: formData.name,
                role: formData.role,
                bio: formData.bio,
                specialization: formData.specialization,
            };

            // Add teacher-specific fields
            if (formData.role === "teacher") {
                updates.teacher_title = formData.teacher_title;
                updates.years_of_experience = formData.years_of_experience;
                updates.education = formData.education;
                updates.phone = formData.phone;
                updates.website = formData.website;
                updates.teaching_style = formData.teaching_style;
            }

            await updateMutation.mutateAsync({
                userId: selectedUser.id,
                updates,
            });
            setShowModal(false);
            addToast({ type: "success", message: "تم تحديث بيانات المستخدم بنجاح" });
        } catch (err: any) {
            addToast({ type: "error", message: err.message || "حدث خطأ أثناء التحديث" });
        }
    }, [selectedUser, formData, updateMutation, addToast]);

    const openDeleteModal = useCallback((user: Profile) => {
        setDeleteModal({
            isOpen: true,
            userId: user.id,
            userName: user.name || "هذا المستخدم",
        });
    }, []);

    const handleDelete = useCallback(async () => {
        if (!deleteModal.userId) return;
        setIsDeleting(true);
        try {
            await deleteMutation.mutateAsync(deleteModal.userId);
            setDeleteModal({ isOpen: false, userId: null, userName: "" });
            addToast({ type: "success", message: "تم حذف المستخدم بنجاح" });
        } catch (err: any) {
            addToast({ type: "error", message: err.message || "حدث خطأ أثناء الحذف" });
        } finally {
            setIsDeleting(false);
        }
    }, [deleteModal.userId, deleteMutation, addToast]);

    const updateFormField = useCallback(
        (field: keyof UserFormData, value: string | number) => {
            setFormData((prev) => ({ ...prev, [field]: value }));
        },
        []
    );

    // ═══════════════════════════════════════════════════════════════════════
    // Loading & Error States
    // ═══════════════════════════════════════════════════════════════════════

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            </div>
        );
    }

    if (queryError) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-6 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 dark:text-red-400">
                    {(queryError as any)?.message || queryError || "حدث خطأ في جلب البيانات"}
                </p>
                <button
                    onClick={() => refetch()}
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                    إعادة المحاولة
                </button>
            </div>
        );
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Render
    // ═══════════════════════════════════════════════════════════════════════

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* Header */}
            <AdminPageHeader
                title="إدارة المستخدمين"
                subtitle="إدارة جميع المستخدمين"
                count={users.length}
                onRefresh={() => refetch()}
                onExport={() => { }}
                isLoading={isLoading}
            />

            {/* Stats */}
            <AdminStatsGrid stats={stats} columns={4} />

            {/* Filters */}
            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl p-4 border border-gray-200/60 dark:border-gray-800 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="بحث بالاسم أو البريد..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-none text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm outline-none"
                >
                    {FILTER_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-[#1c1c24] rounded-2xl border border-gray-200/60 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                                    المستخدم
                                </th>
                                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                                    الدور
                                </th>
                                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                                    التخصص
                                </th>
                                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                                    موثق
                                </th>
                                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                                    التسجيل
                                </th>
                                <th className="px-5 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center text-gray-500">
                                        لا توجد نتائج
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((user) => (
                                    <UserRow
                                        key={user.id}
                                        user={user}
                                        onEdit={() => handleEdit(user)}
                                        onDelete={() => openDeleteModal(user)}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                )}
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {showModal && selectedUser && (
                    <EditUserModal
                        formData={formData}
                        onClose={() => setShowModal(false)}
                        onSave={handleSave}
                        onChange={updateFormField}
                        isSaving={updateMutation.isPending}
                    />
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={deleteModal.isOpen}
                title="حذف المستخدم"
                itemName={deleteModal.userName}
                isDeleting={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteModal({ isOpen: false, userId: null, userName: "" })}
            />
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub Components
// ═══════════════════════════════════════════════════════════════════════════

interface UserRowProps {
    user: Profile;
    onEdit: () => void;
    onDelete: () => void;
}

function UserRow({ user, onEdit, onDelete }: UserRowProps) {
    const role = ROLES[user.role || 'student'] || ROLES.student;
    const RoleIcon = role.icon;

    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
            <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold">
                        {user.name?.charAt(0) || "?"}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                </div>
            </td>
            <td className="px-5 py-4">
                <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${role.color}`}
                >
                    <RoleIcon className="h-3.5 w-3.5" />
                    {role.label}
                </span>
            </td>
            <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                {(user as any).specialization || "-"}
            </td>
            <td className="px-5 py-4">
                {(user as any).is_verified ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                    <XCircle className="h-5 w-5 text-gray-400" />
                )}
            </td>
            <td className="px-5 py-4 text-sm text-gray-500">
                {new Date(user.created_at || new Date()).toLocaleDateString("ar-SA")}
            </td>
            <td className="px-5 py-4">
                <div className="flex gap-1">
                    <button
                        onClick={onEdit}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <Edit2 className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                        onClick={onDelete}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                        <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    const visiblePages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1);

    return (
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-500">
                صفحة {currentPage} من {totalPages}
            </p>
            <div className="flex gap-2">
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
                {visiblePages.map((p) => (
                    <button
                        key={p}
                        onClick={() => onPageChange(p)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium ${currentPage === p
                            ? "bg-primary-500 text-white"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                    >
                        {p}
                    </button>
                ))}
                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}

interface EditUserModalProps {
    formData: UserFormData;
    onClose: () => void;
    onSave: () => void;
    onChange: (field: keyof UserFormData, value: string | number) => void;
    isSaving: boolean;
}

function EditUserModal({ formData, onClose, onSave, onChange, isSaving }: EditUserModalProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-[#1c1c24] rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">تعديل المستخدم</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        label="الاسم"
                        value={formData.name}
                        onChange={(v) => onChange("name", v)}
                    />
                    <FormField
                        label="البريد الإلكتروني"
                        value={formData.email}
                        onChange={() => { }}
                        type="email"
                        disabled
                    />
                    <FormField
                        label="الدور"
                        value={formData.role || 'student'}
                        onChange={(v) => onChange("role", v)}
                        type="select"
                        options={ROLE_OPTIONS}
                    />
                    <FormField
                        label="التخصص"
                        value={formData.specialization}
                        onChange={(v) => onChange("specialization", v)}
                    />
                    <FormField
                        label="نبذة"
                        value={formData.bio}
                        onChange={(v) => onChange("bio", v)}
                        type="textarea"
                        fullWidth
                    />

                    {/* Teacher-specific fields */}
                    {formData.role === "teacher" && (
                        <FormSection title="بيانات المعلم">
                            <FormField
                                label="اللقب الوظيفي"
                                value={formData.teacher_title}
                                onChange={(v) => onChange("teacher_title", v)}
                                placeholder="مثال: أستاذ أول فيزياء"
                            />
                            <FormField
                                label="سنوات الخبرة"
                                value={formData.years_of_experience}
                                onChange={(v) => onChange("years_of_experience", parseInt(v) || 0)}
                                type="number"
                            />
                            <FormField
                                label="المؤهل العلمي"
                                value={formData.education}
                                onChange={(v) => onChange("education", v)}
                            />
                            <FormField
                                label="رقم الهاتف"
                                value={formData.phone}
                                onChange={(v) => onChange("phone", v)}
                            />
                            <FormField
                                label="الموقع الإلكتروني"
                                value={formData.website}
                                onChange={(v) => onChange("website", v)}
                            />
                            <FormField
                                label="أسلوب التدريس"
                                value={formData.teaching_style}
                                onChange={(v) => onChange("teaching_style", v)}
                                type="textarea"
                                rows={2}
                                fullWidth
                            />
                        </FormSection>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={onSave}
                        disabled={isSaving}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 text-white font-medium disabled:opacity-50 hover:bg-primary-600 transition-colors"
                    >
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "حفظ"}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
