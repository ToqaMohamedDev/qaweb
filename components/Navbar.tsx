"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  LogIn,
  UserPlus,
  Menu,
  X,
  Home,
  User,
  LogOut,
  Mail,
  Shield,
  FileText,
  BookOpen,
  Gamepad2
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "الرئيسية", icon: Home },
  { href: "/arabic", label: "اللغة العربية", icon: FileText },
  { href: "/english", label: "English", icon: BookOpen },
  { href: "/game", label: "Quiz Battle", icon: Gamepad2 },
] as const;

const SCROLL_THRESHOLD = 20;
const THROTTLE_DELAY = 100;
const PATHNAME_UPDATE_DELAY = 300; // Delay to allow page transition to start first

// Hook to detect mobile devices - safe for SSR
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };

    checkMobile();
    const handler = checkMobile;
    window.addEventListener("resize", handler, { passive: true });
    return () => window.removeEventListener("resize", handler);
  }, []);

  return isMobile;
};

// Helper function to check if a path is active
const isPathActive = (pathname: string, href: string): boolean => {
  if (href === "/") {
    return pathname === href;
  }
  return pathname.startsWith(href);
};

// Throttle function for performance optimization
const throttle = <T extends (...args: unknown[]) => void>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

export function Navbar() {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();
  const { isAdmin } = useAdmin();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
  const [isMounted, setIsMounted] = useState(() => typeof window !== 'undefined');

  // Track deferred pathname to prevent updates during transition
  // Initialize with current pathname, then defer updates on navigation
  const [deferredPathname, setDeferredPathname] = useState(pathname);
  const pathnameUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousPathnameRef = useRef(pathname);
  const isInitialMountRef = useRef(true);

  // Defer pathname updates to allow page transition to start smoothly
  // Only defer when pathname actually changes (not on initial mount)
  useEffect(() => {
    // On initial mount, update immediately without deferring
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      previousPathnameRef.current = pathname;
      // Use requestAnimationFrame to avoid synchronous setState warning
      requestAnimationFrame(() => {
        setDeferredPathname(pathname);
      });
      return;
    }

    // If pathname hasn't changed, don't do anything
    if (previousPathnameRef.current === pathname) {
      return;
    }

    // Update the ref immediately
    previousPathnameRef.current = pathname;

    // Clear any pending update
    if (pathnameUpdateTimeoutRef.current) {
      clearTimeout(pathnameUpdateTimeoutRef.current);
    }

    // Defer the update to allow page exit animation to start first
    pathnameUpdateTimeoutRef.current = setTimeout(() => {
      setDeferredPathname(pathname);
    }, PATHNAME_UPDATE_DELAY);

    return () => {
      if (pathnameUpdateTimeoutRef.current) {
        clearTimeout(pathnameUpdateTimeoutRef.current);
      }
    };
  }, [pathname]);

  // Memoize active path calculation using deferred pathname
  const activePaths = useMemo(
    () => new Set(navItems.filter(item => isPathActive(deferredPathname, item.href)).map(item => item.href)),
    [deferredPathname]
  );

  // Throttled scroll handler - memoized to persist across renders
  // Use requestAnimationFrame for smoother updates
  const throttledScrollHandler = useMemo(
    () => throttle(() => {
      requestAnimationFrame(() => {
        setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
      });
    }, THROTTLE_DELAY),
    []
  );

  // Calculate menu position when it opens
  useEffect(() => {
    if (showUserMenu && userMenuButtonRef.current && isMounted) {
      const updatePosition = () => {
        if (userMenuButtonRef.current) {
          const buttonRect = userMenuButtonRef.current.getBoundingClientRect();
          setMenuPosition({
            top: buttonRect.bottom + 8, // 8px = mt-2 equivalent
            right: window.innerWidth - buttonRect.right,
          });
        }
      };

      updatePosition();

      // Update position on scroll/resize
      window.addEventListener('scroll', updatePosition, { passive: true });
      window.addEventListener('resize', updatePosition, { passive: true });

      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [showUserMenu, isMounted]);

  // Scroll event listener - fully passive to avoid blocking main thread
  useEffect(() => {
    const handler = throttledScrollHandler;
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [throttledScrollHandler]);

  // Close mobile menu when pathname changes - deferred to allow transition to start
  useEffect(() => {
    // Only close if menu is actually open
    if (!isMobileMenuOpen) return;

    // Defer closing menu to allow page exit animation to start smoothly
    const timeoutId = setTimeout(() => {
      setIsMobileMenuOpen(false);
    }, PATHNAME_UPDATE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [pathname, isMobileMenuOpen]);

  // Unified click outside handler with useCallback for better performance
  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;

    // Handle user menu
    if (
      showUserMenu &&
      userMenuRef.current &&
      !userMenuRef.current.contains(target)
    ) {
      setShowUserMenu(false);
    }

    // Handle mobile menu
    if (
      isMobileMenuOpen &&
      mobileMenuRef.current &&
      !mobileMenuRef.current.contains(target) &&
      mobileButtonRef.current &&
      !mobileButtonRef.current.contains(target)
    ) {
      setIsMobileMenuOpen(false);
    }
  }, [showUserMenu, isMobileMenuOpen]);

  // Single effect for both click outside handlers
  useEffect(() => {
    if (showUserMenu || isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showUserMenu, isMobileMenuOpen, handleClickOutside]);

  // Memoized handlers
  const handleLogout = useCallback(async () => {
    await logout();
    setShowUserMenu(false);
  }, [logout]);

  const handleToggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const handleToggleUserMenu = useCallback(() => {
    setShowUserMenu((prev) => !prev);
  }, []);

  const handleCloseMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Navigation Item Component
  const NavItem = useCallback(({ item }: { item: typeof navItems[number] }) => {
    const Icon = item.icon;
    const isActive = activePaths.has(item.href);

    return (
      <Link
        href={item.href}
        scroll={false}
        aria-label={item.label}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 relative group/nav",
          isActive
            ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/40"
            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/90 dark:hover:bg-[#252530]/90"
        )}
      >
        <motion.div
          whileHover={{ transform: "translate3d(0, 0, 0) scale(1.1)" }}
          style={{
            willChange: "transform",
            display: "inline-flex",
            transform: "translate3d(0, 0, 0)",
            backfaceVisibility: "hidden",
          }}
          transition={{ duration: 0.2, type: "spring", stiffness: 400, damping: 17 }}
        >
          <Icon className={cn("h-4 w-4 transition-colors duration-200", isActive ? "text-white" : "")} />
        </motion.div>
        <span>{item.label}</span>
      </Link>
    );
  }, [activePaths]);

  // Mobile Navigation Item Component
  const MobileNavItem = useCallback(({ item }: { item: typeof navItems[number] }) => {
    const Icon = item.icon;
    const isActive = activePaths.has(item.href);

    return (
      <Link
        href={item.href}
        scroll={false}
        aria-label={item.label}
        aria-current={isActive ? "page" : undefined}
        onClick={handleCloseMobileMenu}
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300",
          isActive
            ? "bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/40"
            : "text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-[#1c1c24]/80"
        )}
      >
        <Icon className={cn("h-4 w-4 transition-all", isActive ? "text-white" : "")} />
        <span>{item.label}</span>
      </Link>
    );
  }, [activePaths, handleCloseMobileMenu]);

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-[60]",
          isScrolled
            ? "bg-white/98 dark:bg-[#121218]/98 shadow-lg border-b border-gray-200/50 dark:border-[#2e2e3a]/50"
            : "bg-transparent"
        )}
        style={{
          transform: "translate3d(0, 0, 0)",
          willChange: isScrolled ? (isMobile ? "transform, background-color, box-shadow" : "transform, background-color, box-shadow, backdrop-filter") : "transform",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          paddingTop: isScrolled ? "0.75rem" : "1.25rem",
          paddingBottom: isScrolled ? "0.75rem" : "1.25rem",
          transition: "background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), padding 0.15s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)" + (isMobile ? "" : ", backdrop-filter 0.2s cubic-bezier(0.4, 0, 0.2, 1)"),
          // On mobile, use opacity instead of backdrop-filter to avoid expensive repaints
          backdropFilter: isMobile ? "none" : (isScrolled ? "blur(12px)" : "none"),
          WebkitBackdropFilter: isMobile ? "none" : (isScrolled ? "blur(12px)" : "none"),
          // Layout isolation to prevent reflow of content underneath
          contain: "layout style paint",
        }}
        dir="rtl"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex items-center justify-between gap-4" dir="rtl">
            {/* Logo */}
            <Link
              href="/"
              scroll={false}
              className="flex items-center gap-3 group flex-shrink-0"
              aria-label="QAlaa - الصفحة الرئيسية"
            >
              <motion.div
                whileHover={{ transform: "translate3d(0, 0, 0) rotate(180deg) scale(1.05)" }}
                style={{
                  willChange: "transform",
                  transform: "translate3d(0, 0, 0)",
                  backfaceVisibility: "hidden",
                }}
                transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 20 }}
                className="p-2.5 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-100 dark:from-primary-900/40 dark:to-primary-900/40 group-hover:from-primary-200 group-hover:to-primary-200 dark:group-hover:from-primary-900/60 dark:group-hover:to-primary-900/60 transition-colors duration-200 shadow-sm group-hover:shadow-md"
              >
                <Sparkles className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </motion.div>
              <span className="text-xl font-extrabold bg-gradient-to-r from-primary-600 via-primary-600 to-pink-600 bg-clip-text text-transparent hidden sm:block tracking-tight">
                QAlaa
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center flex-1 justify-center">
              <div
                className="flex items-center gap-1 bg-white/95 dark:bg-[#1c1c24]/95 rounded-full px-2 py-2 border border-gray-200/80 dark:border-[#2e2e3a]/80 shadow-lg"
                style={{
                  transform: "translate3d(0, 0, 0)",
                  willChange: "transform",
                  backfaceVisibility: "hidden",
                  // Only use backdrop-filter on desktop (non-mobile)
                  backdropFilter: isMobile ? "none" : "blur(12px)",
                  WebkitBackdropFilter: isMobile ? "none" : "blur(12px)",
                }}
              >
                {navItems.map((item) => (
                  <NavItem key={item.href} item={item} />
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5 flex-shrink-0">
              <ThemeToggle />

              {/* Desktop Auth Buttons */}
              {user ? (
                <div className="hidden md:block relative" ref={userMenuRef}>
                  <button
                    ref={userMenuButtonRef}
                    onClick={handleToggleUserMenu}
                    className="flex items-center gap-2.5 px-4 py-2.5 rounded-full text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-[#1c1c24]/80 transition-all duration-300 border border-gray-200/50 dark:border-[#2e2e3a]/50 hover:border-gray-300 dark:hover:border-[#2e2e3a]"
                    aria-label="User menu"
                    aria-expanded={showUserMenu}
                  >
                    <div className="p-1.5 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                      <User className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                    </div>
                    <span className="max-w-[120px] truncate">{user.displayName || user.email}</span>
                  </button>

                  {isMounted && createPortal(
                    <AnimatePresence>
                      {showUserMenu && (
                        <motion.div
                          initial={{ opacity: 0, transform: "translate3d(0, -10px, 0) scale(0.95)" }}
                          animate={{ opacity: 1, transform: "translate3d(0, 0, 0) scale(1)" }}
                          exit={{ opacity: 0, transform: "translate3d(0, -10px, 0) scale(0.95)" }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          style={{
                            position: "fixed",
                            top: `${menuPosition.top}px`,
                            right: `${menuPosition.right}px`,
                            width: "208px", // w-52 = 13rem = 208px
                            willChange: "transform, opacity",
                            backfaceVisibility: "hidden",
                            zIndex: 9999,
                            // Only use backdrop-filter on desktop
                            backdropFilter: isMobile ? "none" : "blur(12px)",
                            WebkitBackdropFilter: isMobile ? "none" : "blur(12px)",
                          }}
                          className="bg-white/98 dark:bg-[#1c1c24]/98 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-[#2e2e3a]/80 overflow-hidden"
                          dir="rtl"
                        >
                          <div className="p-2">
                            <Link
                              href="/profile"
                              onClick={() => setShowUserMenu(false)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-200"
                            >
                              <User className="h-4 w-4" />
                              <span>الملف الشخصي</span>
                            </Link>
                            {isAdmin && (
                              <>
                                <div className="border-t border-gray-200/50 dark:border-gray-700/50 my-2" />
                                <Link
                                  href="/admin"
                                  onClick={() => setShowUserMenu(false)}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50/80 dark:hover:bg-primary-900/20 rounded-xl transition-all duration-200"
                                >
                                  <Shield className="h-4 w-4" />
                                  <span>لوحة التحكم</span>
                                </Link>
                              </>
                            )}
                            <div className="border-t border-gray-200/50 dark:border-gray-700/50 my-2" />
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200"
                            >
                              <LogOut className="h-4 w-4" />
                              <span>تسجيل الخروج</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>,
                    document.body
                  )}
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2.5">
                  <Link
                    href="/login"
                    aria-label="تسجيل الدخول"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-[#1c1c24]/80 transition-all duration-300 border border-gray-200/50 dark:border-[#2e2e3a]/50"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>تسجيل الدخول</span>
                  </Link>
                  <Link
                    href="/signup"
                    aria-label="إنشاء حساب جديد"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    style={{ willChange: "transform" }}
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>إنشاء حساب</span>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                ref={mobileButtonRef}
                onClick={handleToggleMobileMenu}
                className="md:hidden flex items-center justify-center h-10 w-10 rounded-xl bg-gray-100/80 dark:bg-[#1c1c24]/80 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#252530] transition-all duration-300 border border-gray-200/50 dark:border-[#2e2e3a]/50"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMobileMenuOpen}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseMobileMenu}
              className="fixed inset-0 bg-black/20 dark:bg-black/40 z-30 md:hidden"
              style={{
                transform: "translate3d(0, 0, 0)",
                willChange: "opacity",
                backfaceVisibility: "hidden",
                // Remove backdrop-filter on mobile to avoid expensive repaints
                backdropFilter: "none",
                WebkitBackdropFilter: "none",
              }}
            />
            <motion.div
              initial={{ opacity: 0, transform: "translate3d(0, -20px, 0)" }}
              animate={{ opacity: 1, transform: "translate3d(0, 0, 0)" }}
              exit={{ opacity: 0, transform: "translate3d(0, -20px, 0)" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{ willChange: "transform, opacity", backfaceVisibility: "hidden" }}
              className="fixed inset-x-0 top-[72px] z-40 md:hidden"
              ref={mobileMenuRef}
            >
              <div
                className="bg-white/98 dark:bg-[#1c1c24]/98 mx-4 p-5 rounded-2xl shadow-2xl border border-gray-200/80 dark:border-[#2e2e3a]/80"
                style={{
                  transform: "translate3d(0, 0, 0)",
                  willChange: "transform",
                  backfaceVisibility: "hidden",
                  // Remove backdrop-filter on mobile to avoid expensive repaints
                  backdropFilter: "none",
                  WebkitBackdropFilter: "none",
                }}
              >
                <div className="flex flex-col gap-3">
                  {/* Navigation Items Group */}
                  <div className="bg-gray-50/80 dark:bg-[#252530]/80 rounded-xl p-2.5 border border-gray-200/50 dark:border-[#2e2e3a]/50">
                    <div className="flex flex-col gap-1.5">
                      {navItems.map((item) => (
                        <MobileNavItem key={item.href} item={item} />
                      ))}
                    </div>
                  </div>

                  {user && (
                    <>
                      <div className="border-t border-gray-200/50 dark:border-[#2e2e3a]/50" />
                      <div className="flex flex-col gap-1.5">
                        <Link
                          href="/profile"
                          onClick={handleCloseMobileMenu}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-[#252530]/80 transition-all duration-200"
                        >
                          <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                            <User className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                          </div>
                          <span>الملف الشخصي</span>
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={handleCloseMobileMenu}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-primary-600 dark:text-primary-400 hover:bg-primary-50/80 dark:hover:bg-primary-900/20 transition-all duration-200"
                          >
                            <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30">
                              <Shield className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                            </div>
                            <span>لوحة التحكم</span>
                          </Link>
                        )}
                      </div>
                    </>
                  )}

                  {!user && (
                    <>
                      <div className="border-t border-gray-200/50 dark:border-[#2e2e3a]/50" />
                      <div className="flex flex-col gap-2">
                        <Link
                          href="/login"
                          onClick={handleCloseMobileMenu}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-[#252530]/80 transition-all duration-200"
                        >
                          <LogIn className="h-5 w-5" />
                          <span>تسجيل الدخول</span>
                        </Link>
                        <Link
                          href="/signup"
                          onClick={handleCloseMobileMenu}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-semibold shadow-lg transition-all duration-200"
                        >
                          <UserPlus className="h-5 w-5" />
                          <span>إنشاء حساب</span>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="h-20" />
    </>
  );
}
