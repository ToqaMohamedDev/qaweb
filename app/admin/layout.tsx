"use client";

// =============================================
// Admin Layout - استخدام DashboardLayout الموحد
// =============================================

import { ReactNode } from "react";
import { DashboardLayout } from "@/components/shared/layout/dashboard";
import { adminConfig } from "@/components/shared/layout/dashboard/configs";

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <DashboardLayout config={adminConfig}>
            {children}
        </DashboardLayout>
    );
}
