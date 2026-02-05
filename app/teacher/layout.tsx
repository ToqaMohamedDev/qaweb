"use client";

// =============================================
// Teacher Layout - استخدام DashboardLayout الموحد
// =============================================

import { ReactNode } from "react";
import { DashboardLayout } from "@/components/shared/layout/dashboard";
import { teacherConfig } from "@/components/shared/layout/dashboard/configs";

export default function TeacherLayout({ children }: { children: ReactNode }) {
    return (
        <DashboardLayout config={teacherConfig}>
            {children}
        </DashboardLayout>
    );
}
