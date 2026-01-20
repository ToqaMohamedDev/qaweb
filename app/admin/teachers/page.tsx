// =============================================
// Teachers Admin Page - إدارة المعلمين
// =============================================

"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    GraduationCap,
    Search,
    Edit2,
    Trash2,
    CheckCircle2,
    XCircle,
    Users,
    FileText,
    Loader2,
    AlertCircle,
    RefreshCw,
    X,
    Download,
    ChevronLeft,
    ChevronRight,
    Shield,
} from "lucide-react";
import { Database } from "@/lib/database.types";
import { DeleteConfirmModal } from "@/components/admin";
import {
    AdminPageHeader,
    AdminStatsGrid,
    FormField,
    CheckboxField,
    FormSection,
} from "@/components/admin/shared";
import { useTeachersAPI, useUpdateUserAPI, useDeleteUserAPI } from "@/lib/queries/adminQueries";
import { useUIStore } from "@/lib/stores";
import type { StatItem } from "@/components/admin/shared";

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface TeacherFormData {
    name: string;
    specialization: string;
    bio: string;
    is_verified: boolean;
    is_teacher_approved: boolean;
    teacher_title: string;
    years_of_experience: number;
    education: string;
    phone: string;
    website: string;
    teaching_style: string;
}

interface DeleteModalState {
    isOpen: boolean;
    teacherId: string | null;
    teacherName: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════════════

const ITEMS_PER_PAGE = 10;

const INITIAL_FORM_DATA: TeacherFormData = {
    name: "",
    specialization: "",
    bio: "",
    is_verified: false,
    is_teacher_approved: false,
    teacher_title: "",
    years_of_experience: 0,
    education: "",
    phone: "",
    website: "",
    teaching_style: "",
};

const FILTER_OPTIONS = {
    verified: [
        { value: "all", label: "الكل" },
        { value: "verified", label: "موثق" },
        { value: "pending", label: "غير موثق" },
    ],
    approval: [
        { value: "all", label: "الكل (الاعتماد)" },
        { value: "approved", label: "معتمد" },
        { value: "pending", label: "بانتظار الاعتماد" },
    ],
};

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

function mapProfileToFormData(teacher: Profile): TeacherFormData {
    const t = teacher as any;
    return {
        name: teacher.name || "",
        specialization: t.specialization || "",
        bio: teacher.bio || "",
        is_verified: t.is_verified || false,
        is_teacher_approved: t.is_teacher_approved || false,
        teacher_title: t.teacher_title || "",
        years_of_experience: t.years_of_experience || 0,
        education: t.education || "",
        phone: teacher.phone || "",
        website: t.website || "",
        teaching_style: t.teaching_style || "",
    };
}

function buildStatsItems(teachers: Profile[]): StatItem[] {
    return [
        {
            label: "إجمالي المعلمين",
            value: teachers.length,
            icon: GraduationCap,
            color: "from-purple-500 to-purple-600",
        },
        {
            label: "معلم موثق",
            value: teachers.filter((t) => (t as any).is_verified).length,
            icon: CheckCircle2,
            color: "from-green-500 to-green-600",
        },
        {
            label: "معتمد (مفعّل)",
            value: teachers.filter((t) => (t as any).is_teacher_approved).length,
            icon: Shield,
            color: "from-emerald-500 to-emerald-600",
        },
        {
            label: "بانتظار الاعتماد",
            value: teachers.filter((t) => !(t as any).is_teacher_approved).length,
            icon: Shield,
            color: "from-amber-500 to-amber-600",
        },
    ];
}

// ═══════════════════════════════════════════════════════════════════════════
// Main Component
// ═══════════════════════════════════════════════════════════════════════════

export default function TeachersPage() {
    const { addToast } = useUIStore();

    // Queries & Mutations
    const { data: teachers = [], isLoading, error: queryError, refetch } = useTeachersAPI();
    const updateMutation = useUpdateUserAPI();
    const deleteMutation = useDeleteUserAPI();

    // Local State
    const [search, setSearch] = useState("");
    const [verifiedFilter, setVerifiedFilter] = useState("all");
    const [approvalFilter, setApprovalFilter] = useState("all");
    const [page, setPage] = useState(1);

    // Modals State
    const [showModal, setShowModal] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState<Profile | null>(null);
    const [deleteModal, setDeleteModal] = useState<DeleteModalState>({
        isOpen: false,
        teacherId: null,
        teacherName: "",
    });
    const [isDeleting, setIsDeleting] = useState(false);

    // Form State
    const [formData, setFormData] = useState<TeacherFormData>(INITIAL_FORM_DATA);

    // ═══════════════════════════════════════════════════════════════════════
    // Memoized Values
    // ═══════════════════════════════════════════════════════════════════════

    const filtered = useMemo(() => {
        return teachers.filter((t: any) => {
            const matchSearch =
                t.name?.toLowerCase().includes(search.toLowerCase()) ||
                t.specialization?.toLowerCase().includes(search.toLowerCase());
            const matchVerified =
                verifiedFilter === "all" ||
                (verifiedFilter === "verified" ? t.is_verified : !t.is_verified);
            const matchApproval =
                approvalFilter === "all" ||
                (approvalFilter === "approved"
                    ? t.is_teacher_approved
                    : !t.is_teacher_approved);
            return matchSearch && matchVerified && matchApproval;
        });
    }, [teachers, search, verifiedFilter, approvalFilter]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const stats = useMemo(() => buildStatsItems(teachers), [teachers]);

    // ═══════════════════════════════════════════════════════════════════════
    // Handlers
    // ═══════════════════════════════════════════════════════════════════════

    const handleEdit = useCallback((teacher: Profile) => {
        setSelectedTeacher(teacher);
        setFormData(mapProfileToFormData(teacher));
        setShowModal(true);
    }, []);

    const handleSave = useCallback(async () => {
        if (!selectedTeacher) return;

        try {
            await updateMutation.mutateAsync({
                teacherId: selectedTeacher.id,
                updates: {
                    name: formData.name,
                    specialization: formData.specialization,
                    bio: formData.bio,
                    is_verified: formData.is_verified,
                    is_teacher_approved: formData.is_teacher_approved,
                    teacher_title: formData.teacher_title,
                    years_of_experience: formData.years_of_experience,
                    education: formData.education,
                    phone: formData.phone,
                    website: formData.website,
                    teaching_style: formData.teaching_style,
                },
            });
            setShowModal(false);
            addToast({ type: "success", message: "تم تحديث بيانات المعلم بنجاح" });
        } catch (err: any) {
            addToast({ type: "error", message: err.message || "حدث خطأ أثناء التحديث" });
        }
    }, [selectedTeacher, formData, updateMutation, addToast]);

    const handleVerify = useCallback(
        async (teacherId: string, verified: boolean) => {
            try {
                await updateMutation.mutateAsync({
                    teacherId,
                    updates: { is_verified: verified },
                });
                addToast({
                    type: "success",
                    message: verified ? "تم توثيق المعلم" : "تم إلغاء توثيق المعلم",
                });
            } catch (err: any) {
                addToast({ type: "error", message: err.message || "حدث خطأ" });
            }
        },
        [updateMutation, addToast]
    );

    const handleApprove = useCallback(
        async (teacherId: string, approved: boolean) => {
            try {
                await updateMutation.mutateAsync({
                    teacherId,
                    updates: { is_teacher_approved: approved },
                });
                addToast({
                    type: "success",
                    message: approved
                        ? "تم اعتماد المدرس وتفعيل صلاحياته"
                        : "تم إلغاء اعتماد المدرس",
                });
            } catch (err: any) {
                addToast({ type: "error", message: err.message || "حدث خطأ" });
            }
        },
        [updateMutation, addToast]
    );

    const openDeleteModal = useCallback((teacher: Profile) => {
        setDeleteModal({
            isOpen: true,
            teacherId: teacher.id,
            teacherName: teacher.name || "هذا المعلم",
        });
    }, []);

    const handleDelete = useCallback(async () => {
        if (!deleteModal.teacherId) return;
        setIsDeleting(true);
        try {
            await deleteMutation.mutateAsync(deleteModal.teacherId);
            setDeleteModal({ isOpen: false, teacherId: null, teacherName: "" });
            addToast({ type: "success", message: "تم حذف المعلم بنجاح" });
        } catch (err: any) {
            addToast({ type: "error", message: err.message || "حدث خطأ أثناء الحذف" });
        } finally {
            setIsDeleting(false);
        }
    }, [deleteModal.teacherId, deleteMutation, addToast]);

    const updateFormField = useCallback(
        (field: keyof TeacherFormData, value: string | number | boolean) => {
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
                title="إدارة المعلمين"
                subtitle="إدارة وتوثيق المعلمين"
                count={teachers.length}
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
                        placeholder="بحث بالاسم أو التخصص..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 border-none text-sm outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <select
                    value={verifiedFilter}
                    onChange={(e) => setVerifiedFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm outline-none"
                >
                    {FILTER_OPTIONS.verified.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <select
                    value={approvalFilter}
                    onChange={(e) => setApprovalFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm outline-none"
                >
                    {FILTER_OPTIONS.approval.map((opt) => (
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
                                    المعلم
                                </th>
                                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                                    التخصص
                                </th>
                                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                                    الامتحانات
                                </th>
                                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                                    الطلاب
                                </th>
                                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                                    التوثيق
                                </th>
                                <th className="px-5 py-4 text-right text-xs font-semibold text-gray-500 uppercase">
                                    الاعتماد
                                </th>
                                <th className="px-5 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                            {paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                                        لا توجد نتائج
                                    </td>
                                </tr>
                            ) : (
                                paginated.map((teacher: any) => (
                                    <TeacherRow
                                        key={teacher.id}
                                        teacher={teacher}
                                        onEdit={() => handleEdit(teacher)}
                                        onDelete={() => openDeleteModal(teacher)}
                                        onVerify={(verified) => handleVerify(teacher.id, verified)}
                                        onApprove={(approved) => handleApprove(teacher.id, approved)}
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
                {showModal && selectedTeacher && (
                    <EditTeacherModal
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
                title="حذف المعلم"
                itemName={deleteModal.teacherName}
                isDeleting={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteModal({ isOpen: false, teacherId: null, teacherName: "" })}
            />
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// Sub Components
// ═══════════════════════════════════════════════════════════════════════════

interface TeacherRowProps {
    teacher: any;
    onEdit: () => void;
    onDelete: () => void;
    onVerify: (verified: boolean) => void;
    onApprove: (approved: boolean) => void;
}

function TeacherRow({ teacher, onEdit, onDelete, onVerify, onApprove }: TeacherRowProps) {
    return (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
            <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold">
                        {teacher.name?.charAt(0) || "?"}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {teacher.name}
                        </p>
                        <p className="text-xs text-gray-500">{teacher.email}</p>
                    </div>
                </div>
            </td>
            <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                {teacher.specialization || "-"}
            </td>
            <td className="px-5 py-4">
                <div className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {teacher.stats?.exams || 0}
                    </span>
                </div>
            </td>
            <td className="px-5 py-4">
                <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {teacher.stats?.students || 0}
                    </span>
                </div>
            </td>
            <td className="px-5 py-4">
                <VerifyButton
                    isVerified={teacher.is_verified}
                    onClick={() => onVerify(!teacher.is_verified)}
                />
            </td>
            <td className="px-5 py-4">
                <ApprovalButton
                    isApproved={teacher.is_teacher_approved}
                    onClick={() => onApprove(!teacher.is_teacher_approved)}
                />
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

function VerifyButton({ isVerified, onClick }: { isVerified: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isVerified
                ? "bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-amber-100 hover:text-amber-600"
                }`}
        >
            {isVerified ? (
                <>
                    <CheckCircle2 className="h-4 w-4" />
                    موثق
                </>
            ) : (
                <>
                    <XCircle className="h-4 w-4" />
                    غير موثق
                </>
            )}
        </button>
    );
}

function ApprovalButton({ isApproved, onClick }: { isApproved: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isApproved
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-200"
                : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 hover:bg-amber-200"
                }`}
        >
            <Shield className="h-4 w-4" />
            {isApproved ? "معتمد" : "بانتظار"}
        </button>
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

interface EditTeacherModalProps {
    formData: TeacherFormData;
    onClose: () => void;
    onSave: () => void;
    onChange: (field: keyof TeacherFormData, value: string | number | boolean) => void;
    isSaving: boolean;
}

function EditTeacherModal({ formData, onClose, onSave, onChange, isSaving }: EditTeacherModalProps) {
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
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">تعديل المعلم</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
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
                    <CheckboxField
                        id="verified"
                        label="معلم موثق (شارة التوثيق)"
                        checked={formData.is_verified}
                        onChange={(v) => onChange("is_verified", v)}
                    />
                    <CheckboxField
                        id="approved"
                        label="معتمد (تفعيل صلاحيات المدرس)"
                        checked={formData.is_teacher_approved}
                        onChange={(v) => onChange("is_teacher_approved", v)}
                        accentColor="accent-emerald-500"
                    />

                    <FormSection title="بيانات إضافية">
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
