"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Users, Search, Filter, Mail, Calendar, CheckCircle2, XCircle, X, Eye, UserCheck } from "lucide-react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  Timestamp,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import Image from "next/image";

interface UserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  emailVerified: boolean;
  provider: string;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
  updatedAt: Timestamp;
  isAdmin?: boolean;
}

interface UserWithId extends UserData {
  id: string;
}

export default function UsersManagement() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const router = useRouter();

  const [users, setUsers] = useState<UserWithId[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProvider, setFilterProvider] = useState<string>("all");
  const [filterVerified, setFilterVerified] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithId | null>(null);
  const [roleUpdating, setRoleUpdating] = useState(false);

  useEffect(() => {
    if (authLoading || adminLoading) {
      return;
    }

    if (!user) {
      router.push("/");
      return;
    }

    if (!isAdmin) {
      router.push("/");
      return;
    }
  }, [user, isAdmin, authLoading, adminLoading, router]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin) return;

      setLoadingUsers(true);
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);

        // load roles map once to avoid per-user reads
        const rolesSnap = await getDocs(collection(db, "roles"));
        const rolesMap = new Map<string, string>();
        rolesSnap.forEach((roleDoc) => {
          const data = roleDoc.data() as { role?: string };
          if (data.role) {
            rolesMap.set(roleDoc.id, data.role);
          }
        });

        const usersData: UserWithId[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          usersData.push({
            id: doc.id,
            uid: data.uid || doc.id,
            email: data.email || "",
            displayName: data.displayName || "بدون اسم",
            photoURL: data.photoURL || "",
            emailVerified: data.emailVerified || false,
            provider: data.provider || "password",
            createdAt: data.createdAt || Timestamp.now(),
            lastLoginAt: data.lastLoginAt || data.createdAt || Timestamp.now(),
            updatedAt: data.updatedAt || data.createdAt || Timestamp.now(),
            isAdmin: rolesMap.get(data.uid || doc.id) === "admin",
          });
        });

        setUsers(usersData);
      } catch (error: unknown) {
        console.error("Error fetching users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };

    if (isAdmin && !authLoading && !adminLoading) {
      fetchUsers();
    }
  }, [isAdmin, authLoading, adminLoading]);

  const filteredUsers = users.filter((user) => {
    if (filterProvider !== "all" && user.provider !== filterProvider) {
      return false;
    }

    if (filterVerified !== "all") {
      const isVerified = filterVerified === "verified";
      if (user.emailVerified !== isVerified) {
        return false;
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const email = user.email.toLowerCase();
      const displayName = user.displayName.toLowerCase();

      if (!email.includes(query) && !displayName.includes(query)) {
        return false;
      }
    }

    if (filterRole !== "all") {
      const shouldBeAdmin = filterRole === "admin";
      if ((user.isAdmin ?? false) !== shouldBeAdmin) {
        return false;
      }
    }

    return true;
  });

  const formatDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return "غير متاح";
    const date = timestamp.toDate();
    return new Intl.DateTimeFormat("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getProviderLabel = (provider: string) => {
    const labels: Record<string, string> = {
      password: "بريد إلكتروني",
      "google.com": "Google",
      "facebook.com": "Facebook",
    };
    return labels[provider] || provider;
  };

  const updateUserRole = async (targetUser: UserWithId, makeAdmin: boolean) => {
    setRoleUpdating(true);
    try {
      const roleRef = doc(db, "roles", targetUser.uid);
      if (makeAdmin) {
        await setDoc(roleRef, { role: "admin" });
      } else {
        await deleteDoc(roleRef);
      }

      setUsers((prev) =>
        prev.map((u) => (u.uid === targetUser.uid ? { ...u, isAdmin: makeAdmin } : u))
      );
      setSelectedUser((prev) =>
        prev && prev.uid === targetUser.uid ? { ...prev, isAdmin: makeAdmin } : prev
      );
    } catch (error: unknown) {
      console.error("Error updating role:", error);
      alert("حدث خطأ أثناء تحديث صلاحيات المستخدم");
    } finally {
      setRoleUpdating(false);
    }
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#121218] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#121218]" dir="rtl">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary-100 dark:bg-primary-900/30">
                <Users className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  إدارة المستخدمين
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  عرض وإدارة جميع المستخدمين
                </p>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>

              {/* Filter Toggle */}
              <Button
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Filter className="h-4 w-4" />
                الفلاتر
              </Button>
            </div>

            {/* Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-gray-200 dark:border-[#2e2e3a]"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Provider Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        طريقة التسجيل
                      </label>
                      <select
                        value={filterProvider}
                        onChange={(e) => setFilterProvider(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">الكل</option>
                        <option value="password">بريد إلكتروني</option>
                        <option value="google.com">Google</option>
                        <option value="facebook.com">Facebook</option>
                      </select>
                    </div>

                    {/* Verification Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        حالة التحقق
                      </label>
                      <select
                        value={filterVerified}
                        onChange={(e) => setFilterVerified(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">الكل</option>
                        <option value="verified">متحقق</option>
                        <option value="unverified">غير متحقق</option>
                      </select>
                    </div>

                    {/* Role Filter */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        الصلاحيات
                      </label>
                      <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-white dark:bg-[#252530] text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">الكل</option>
                        <option value="admin">أدمن</option>
                        <option value="user">مستخدم عادي</option>
                      </select>
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <div className="mt-4">
                    <Button
                      onClick={() => {
                        setFilterProvider("all");
                        setFilterVerified("all");
                        setFilterRole("all");
                        setSearchQuery("");
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      مسح جميع الفلاتر
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Users List */}
          <div className="bg-white dark:bg-[#1c1c24] rounded-2xl shadow-lg border border-gray-200 dark:border-[#2e2e3a] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  المستخدمين ({filteredUsers.length})
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {users.length} مستخدم إجمالي
                </p>
              </div>
            </div>

            {loadingUsers ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">جاري تحميل المستخدمين...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
                  {searchQuery || filterProvider !== "all" || filterVerified !== "all"
                    ? "لا توجد نتائج للبحث"
                    : "لا يوجد مستخدمين"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((userItem, index) => (
                  <motion.div
                    key={userItem.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-5 rounded-xl border border-gray-200 dark:border-[#2e2e3a] bg-gray-50 dark:bg-[#252530] hover:bg-gray-100 dark:hover:bg-[#2a2a35] transition-all cursor-pointer"
                    onClick={() => setSelectedUser(userItem)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {userItem.photoURL ? (
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary-200 dark:border-primary-800">
                            <Image
                              src={userItem.photoURL}
                              alt={userItem.displayName}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center text-white text-xl font-bold border-2 border-primary-200 dark:border-primary-800">
                            {userItem.displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {userItem.emailVerified && (
                          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-white dark:border-[#252530] flex items-center justify-center">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                            {userItem.displayName}
                          </h3>
                          {userItem.isAdmin && (
                            <span className="px-3 py-1 rounded-lg text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                              أدمن
                            </span>
                          )}
                          <span
                            className={`px-3 py-1 rounded-lg text-xs font-medium ${
                              userItem.provider === "google.com"
                                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                                : userItem.provider === "facebook.com"
                                ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            {getProviderLabel(userItem.provider)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            <span className="truncate">{userItem.email}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>انضم: {formatDate(userItem.createdAt)}</span>
                          </div>
                          {userItem.lastLoginAt && (
                            <div className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              <span>آخر دخول: {formatDate(userItem.lastLoginAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status Icons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {userItem.emailVerified ? (
                          <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" title="متحقق">
                            <UserCheck className="h-5 w-5" />
                          </div>
                        ) : (
                          <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" title="غير متحقق">
                            <XCircle className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* User Details Modal */}
      <AnimatePresence>
        {selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedUser(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1c1c24] rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">تفاصيل المستخدم</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Avatar and Name */}
                <div className="flex items-center gap-4">
                  {selectedUser.photoURL ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-200 dark:border-primary-800">
                      <Image
                        src={selectedUser.photoURL}
                        alt={selectedUser.displayName}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-primary-200 dark:border-primary-800">
                      {selectedUser.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                      {selectedUser.displayName}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#252530]">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">حالة التحقق</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {selectedUser.emailVerified ? (
                        <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          متحقق
                        </span>
                      ) : (
                        <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                          <XCircle className="h-4 w-4" />
                          غير متحقق
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#252530]">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">طريقة التسجيل</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {getProviderLabel(selectedUser.provider)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#252530]">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">تاريخ الانضمام</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatDate(selectedUser.createdAt)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#252530]">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">آخر دخول</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {formatDate(selectedUser.lastLoginAt)}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#252530]">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">الصلاحية</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {selectedUser.isAdmin ? "أدمن" : "مستخدم"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Button
                    onClick={() => updateUserRole(selectedUser, !selectedUser.isAdmin)}
                    disabled={roleUpdating}
                    className={selectedUser.isAdmin ? "bg-red-600 hover:bg-red-700 text-white" : "bg-primary-600 hover:bg-primary-700 text-white"}
                  >
                    {roleUpdating ? "جاري الحفظ..." : selectedUser.isAdmin ? "إزالة صلاحية الأدمن" : "ترقية إلى أدمن"}
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedUser(null)}>
                    إغلاق
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

