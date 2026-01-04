/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                        USER ENTITY - كيان المستخدم                        ║
 * ║                                                                          ║
 * ║  Business Logic Layer - كيانات الأعمال الأساسية                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

// ═══════════════════════════════════════════════════════════════════════════
// 1. USER ENTITY
// ═══════════════════════════════════════════════════════════════════════════

/**
 * كيان المستخدم - يمثل البيانات الأساسية للمستخدم
 */
export class User {
    constructor(
        public readonly id: string,
        public readonly email: string,
        public readonly displayName: string,
        public readonly role: UserRole,
        public readonly avatarUrl?: string,
        public readonly stageId?: string,
        public readonly isActive: boolean = true,
        public readonly emailVerified: boolean = false,
        public readonly createdAt?: Date,
        public readonly updatedAt?: Date,
    ) { }

    // ─── Business Rules ───

    /**
     * هل المستخدم أدمن؟
     */
    get isAdmin(): boolean {
        return this.role === 'admin';
    }

    /**
     * هل المستخدم معلم؟
     */
    get isTeacher(): boolean {
        return this.role === 'teacher';
    }

    /**
     * هل المستخدم طالب؟
     */
    get isStudent(): boolean {
        return this.role === 'student';
    }

    /**
     * هل المستخدم لديه صلاحيات إدارية؟
     */
    get hasAdminAccess(): boolean {
        return this.role === 'admin' || this.role === 'teacher';
    }

    /**
     * هل يمكن للمستخدم إنشاء امتحانات؟
     */
    get canCreateExams(): boolean {
        return this.isAdmin || this.isTeacher;
    }

    /**
     * هل يمكن للمستخدم إدارة الأسئلة؟
     */
    get canManageQuestions(): boolean {
        return this.isAdmin || this.isTeacher;
    }

    /**
     * هل يمكن للمستخدم مشاهدة التحليلات؟
     */
    get canViewAnalytics(): boolean {
        return this.isAdmin;
    }

    /**
     * هل يمكن للمستخدم إدارة المستخدمين؟
     */
    get canManageUsers(): boolean {
        return this.isAdmin;
    }

    /**
     * الحصول على الاسم المختصر (الحرف الأول)
     */
    get initials(): string {
        return this.displayName
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    }

    /**
     * اسم الدور بالعربية
     */
    get roleLabel(): string {
        const labels: Record<UserRole, string> = {
            admin: 'مدير',
            teacher: 'معلم',
            student: 'طالب',
        };
        return labels[this.role] || this.role;
    }

    /**
     * لون الدور
     */
    get roleColor(): string {
        const colors: Record<UserRole, string> = {
            admin: 'red',
            teacher: 'blue',
            student: 'green',
        };
        return colors[this.role] || 'gray';
    }

    /**
     * هل الحساب مفعل بالكامل؟
     */
    get isFullyActivated(): boolean {
        return this.isActive && this.emailVerified;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. SUPPORTING TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type UserRole = 'admin' | 'teacher' | 'student';

// ═══════════════════════════════════════════════════════════════════════════
// 3. FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

export interface CreateUserParams {
    id: string;
    email: string;
    displayName: string;
    role?: UserRole;
    avatarUrl?: string;
    stageId?: string;
    isActive?: boolean;
    emailVerified?: boolean;
}

/**
 * إنشاء كيان مستخدم جديد
 */
export function createUser(params: CreateUserParams): User {
    return new User(
        params.id,
        params.email,
        params.displayName,
        params.role || 'student',
        params.avatarUrl,
        params.stageId,
        params.isActive ?? true,
        params.emailVerified ?? false,
        new Date(),
        new Date(),
    );
}
