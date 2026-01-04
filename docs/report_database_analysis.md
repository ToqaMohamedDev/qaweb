# 📊 Database Report: Comprehensive Schema & Integrity

> **📅 Date**: 2026-01-03
> **🔍 Source of Truth**: `docs/database_xray_output.json`
> **🎯 Purpose**: Provide a "boringly detailed" overview of the database state, issues, and integrity.

## 1. 🏗️ High-Level Architecture
- **Total Tables**: 20
- **Schemas**: `public`, `auth`, `storage`, `graphql`, `graphql_public`
- **Extensions**:
  - `pg_graphql` (1.5.11)
  - `pg_stat_statements` (1.11)
  - `pgcrypto` (1.3)
  - `plpgsql` (1.0)
  - `supabase_vault` (0.3.1)
  - `uuid-ossp` (1.1)

---

## 2. 📂 Detailed Table & Integrity Analysis

### `comprehensive_exams` (Critical Issue)
- **Status**: 🛑 **100% Bloat** (Performance Risk)
- **Description**: Stores comprehensive exams created by admins.
- **Columns**: 22 Columns (All correct).
- **Triggers**:
  - `update_comp_exam_count_on_delete` (Active)
  - `update_comp_exam_count_on_insert` (Active)
- **RLS**: 6 Policies.
- **Indices**: 6 Indices.
- **Issues**:
  - Table reports 100% bloat. Needs `VACUUM FULL`.

### `lessons`
- **Status**: ✅ Healthy
- **Columns**: 15 Columns.
- **Foreign Keys**: Correctly links to `subjects`, `educational_stages`, `profiles`.
- **Integrity**: `idx_lessons_subject_id` and `idx_lessons_stage_id` indices are active.

### `teacher_subscriptions` (High Maintenance)
- **Status**: 🟠 **89.5% Bloat**
- **Triggers**:
  - `update_subscriber_count_on_delete` (Active)
  - `update_subscriber_count_on_insert` (Active)
- **Constraint**: Unique constraint on `(user_id, teacher_id)` is active.

### `teacher_ratings` (Missing in Docs)
- **Status**: 🟠 **71.4% Bloat**
- **Constraint Issue**:
  - `teacher_ratings_rating_check` (CHECK constraint) exists in DB to enforce rating range, but was missing in previous documentation.

### `support_chats`
- **Status**: ✅ Healthy (No data?)
- **Usage**: Heavily referenced in `lib/services/support.service.ts` and `ChatWidget.tsx` (AI Chat).
- **Missing**: No "Human Support Dashboard" UI code found, only Admin and AI widget.

---

## 3. 🛡️ Security & Access Control (RLS Audit)

**Total Policies**: 68 (Confirmed)

| Table | Policies Found | Status |
|-------|----------------|--------|
| `profiles` | 6 | ✅ Secured |
| `lessons` | 2 | ✅ Public Read / Admin Write |
| `teacher_exams` | 4 | ✅ Secured |
| `support_chats` | 3 | ✅ Secured |
| ... | ... | ... |

**Note**: All tables have RLS enabled (`rls_enabled: true`).

---

## 4. 🔗 Foreign Key Integrity

**Status**: ✅ 100% Consistent
- No `fkey` constraints are missing or "orphan".
- All deletion rules (`CASCADE` vs `SET NULL`) match the application logic found in `database.types.ts`.

---

## 5. 📉 Storage Health Report (Action Required)

The following tables require immediate maintenance (`VACUUM FULL`):

| Table Name | Bloat % | Dead Rows | Action |
|------------|---------|-----------|--------|
| `comprehensive_exams` | **100.0%** | 5 | 🔧 Fix Immediately |
| `teacher_subscriptions` | **89.5%** | 17 | 🔧 Fix Immediately |
| `user_devices` | **86.7%** | 13 | 🔧 Fix |
| `teacher_exam_attempts` | **84.6%** | 11 | 🔧 Fix |
| `visitor_devices` | **82.1%** | 46 | 🔧 Fix |

---

## 6. 📋 Missing Schema Documentation Items

The following items are **present in the Database** but were previously valid "missing" items in documentation:

- **ENUMs**: `exam_type`, `notification_target_role`, `sender_type`.
- **Triggers**: `update_comp_exam_count_*` on `comprehensive_exams`.
- **Constraint**: `rating_check` on `teacher_ratings`.

These must be officially added to any generated schema documentation.
