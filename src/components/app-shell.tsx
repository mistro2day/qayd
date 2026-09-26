"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Receipt,
  Layers,
  Package,
  FileSignature,
  Settings,
  Printer,
  Sparkles,
  CreditCard,
  Bell,
  CheckCircle2,
  Clock3,
  MoreHorizontal,
  X,
  Users,
  Database,
} from "lucide-react";
import { getRecentActivities } from "../app/actions";
import { canAccessAction, canAccessPage, getEffectivePermissions } from "@/lib/permissions";
import { LogoutButton } from "./logout-button";

export function AppShell({
  children,
  sessionUser,
}: {
  children: React.ReactNode;
  sessionUser: { id: string; fullName: string; username: string; role?: string } | null;
}) {
  const pathname = usePathname();
  const isLoginRoute = pathname === "/login";
  const permissions = getEffectivePermissions(sessionUser);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; title: string; details?: string | null; createdAt: Date; type: string }>>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);

  useEffect(() => {
    const savedIds = JSON.parse(localStorage.getItem("qayd_read_notifications") ?? "[]") as string[];
    setReadNotificationIds(savedIds);
  }, []);

  useEffect(() => {
    localStorage.setItem("qayd_read_notifications", JSON.stringify(readNotificationIds));
  }, [readNotificationIds]);

  useEffect(() => {
    async function loadActivities() {
      const result = await getRecentActivities(20);
      if (result.success && Array.isArray(result.activities)) {
        setNotifications(
          result.activities.map((item: any) => ({
            id: item.id,
            title: item.title,
            details: item.details,
            createdAt: new Date(item.createdAt),
            type: item.type,
          }))
        );
      }
    }

    void loadActivities();
  }, []);

  useEffect(() => {
    if (!showNotifications || notifications.length === 0) return;

    const nextIds = Array.from(new Set([...readNotificationIds, ...notifications.map((item) => item.id)]));
    const sameIds =
      nextIds.length === readNotificationIds.length &&
      nextIds.every((id) => readNotificationIds.includes(id));

    if (!sameIds) {
      setReadNotificationIds(nextIds);
    }
  }, [showNotifications, notifications, readNotificationIds]);

  const unreadCount = notifications.filter((item) => !readNotificationIds.includes(item.id)).length;
  const showNewInvoiceButton = canAccessAction(sessionUser, "newInvoice");
  const showSettingsShortcut = canAccessPage(sessionUser, "settings");

  if (isLoginRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex" dir="rtl">
      <aside className="hidden xl:flex w-72 shrink-0 flex-col border-r border-[#2BA8A2]/15 bg-white/85 backdrop-blur-md fixed right-0 top-0 h-screen shadow-[0_0_24px_rgba(0,0,0,0.04)] no-print order-1 z-30">
        <div className="px-5 py-5 border-b border-[#2BA8A2]/10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2BA8A2] to-[#1E8C86] flex items-center justify-center text-white shadow-teal-glow transition-transform group-hover:scale-105">
              <Printer className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl text-[#1E8C86] tracking-wide">قَيْـد</span>
              <span className="text-[11px] text-[#2BA8A2] font-semibold">الخواض لخدمات الطباعة</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-1.5">
            {canAccessPage(sessionUser, "dashboard") && (
              <Link href="/" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 font-bold text-[#1E8C86] hover:bg-[#E8F6F5] hover:shadow-sm transition-all">
                <LayoutDashboard className="w-4 h-4" />
                الرئيسية
              </Link>
            )}
            {canAccessPage(sessionUser, "invoices") && (
              <Link href="/invoices" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 font-bold text-[#1E8C86] hover:bg-[#E8F6F5] hover:shadow-sm transition-all">
                <Receipt className="w-4 h-4" />
                الفواتير و POS
              </Link>
            )}
            {canAccessPage(sessionUser, "production") && (
              <Link href="/production" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 font-bold text-[#1E8C86] hover:bg-[#E8F6F5] hover:shadow-sm transition-all">
                <Layers className="w-4 h-4" />
                خط التشغيل
              </Link>
            )}
            {canAccessPage(sessionUser, "inventory") && (
              <Link href="/inventory" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 font-bold text-[#1E8C86] hover:bg-[#E8F6F5] hover:shadow-sm transition-all">
                <Package className="w-4 h-4" />
                المخزون
              </Link>
            )}
            {canAccessPage(sessionUser, "contracts") && (
              <Link href="/contracts" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 font-bold text-[#1E8C86] hover:bg-[#E8F6F5] hover:shadow-sm transition-all">
                <FileSignature className="w-4 h-4" />
                العقود
              </Link>
            )}
            {canAccessPage(sessionUser, "expenses") && (
              <Link href="/expenses" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 font-bold text-[#D45233] hover:bg-[#FFF1EE] hover:shadow-sm transition-all">
                <CreditCard className="w-4 h-4" />
                المصروفات
              </Link>
            )}
            {canAccessPage(sessionUser, "employees") && (
              <Link href="/employees" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 font-bold text-[#1E8C86] hover:bg-[#E8F6F5] hover:shadow-sm transition-all">
                <FileSignature className="w-4 h-4" />
                الموظفين والرواتب
              </Link>
            )}
            {canAccessPage(sessionUser, "reports") && (
              <Link href="/reports" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 font-bold text-[#1E8C86] hover:bg-[#E8F6F5] hover:shadow-sm transition-all">
                <Layers className="w-4 h-4" />
                التقارير
              </Link>
            )}
            {canAccessPage(sessionUser, "settings") && (
              <Link href="/settings" className="flex items-center gap-3 rounded-2xl px-3 py-2.5 font-bold text-gray-700 hover:bg-gray-100 hover:shadow-sm transition-all">
                <Settings className="w-4 h-4" />
                الإعدادات
              </Link>
            )}
          </div>
        </nav>

        {showNewInvoiceButton && (
          <div className="p-4 border-t border-[#2BA8A2]/10">
            <Link href="/invoices?new=1" className="btn-pill w-full justify-center px-4 py-3 bg-gradient-to-r from-[#FFD23F] to-[#FFE47A] text-[#1E4D48] text-xs shadow-gold-glow hover:brightness-105 font-black inline-flex">
              <Sparkles className="w-4 h-4 text-[#D45233]" />
              فاتورة جديدة
            </Link>
          </div>
        )}
      </aside>

      <div className="flex-1 min-w-0 order-2 xl:mr-72">
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#2BA8A2]/15 shadow-sm no-print">
          <div className="max-w-7xl mx-auto px-[5px] sm:px-[10px] lg:px-[10px] h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 xl:hidden">
              <Link href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#2BA8A2] to-[#1E8C86] flex items-center justify-center text-white shadow-teal-glow transition-transform group-hover:scale-105">
                  <Printer className="w-5 h-5 stroke-[2.2]" />
                </div>
                <span className="font-black text-xl text-[#1E8C86] tracking-wide">قَيْـد</span>
              </Link>
            </div>

            <div className="flex items-center gap-2 mr-auto">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications((prev) => !prev)}
                  className="relative p-2.5 rounded-full bg-[#FFF8E7] text-[#1E8C86] hover:bg-[#FFE47A] transition-all border border-[#E2D9C3] shadow-sm"
                  aria-label="الإشعارات"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -left-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D45233] px-0.5 text-[9px] font-black text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute left-0 top-12 z-50 w-80 rounded-2xl border border-[#2BA8A2]/10 bg-white p-3 shadow-[0_20px_45px_rgba(0,0,0,0.12)]">
                    <div className="mb-2 flex items-center justify-between px-1">
                      <span className="text-sm font-black text-[#1E8C86]">آخر العمليات</span>
                      <span className="text-[10px] font-bold text-gray-500">{notifications.length} إشعارات</span>
                    </div>

                    <div className="space-y-2">
                      {notifications.length === 0 ? (
                        <div className="rounded-xl bg-[#F7FBFB] p-3 text-center text-[11px] font-bold text-gray-500">
                          لا توجد عمليات حديثة
                        </div>
                      ) : (
                        notifications.map((item) => (
                          <div key={item.id} className="flex items-start gap-2 rounded-xl bg-[#F7FBFB] p-2">
                            <div className="mt-0.5 rounded-full bg-[#E8F6F5] p-1 text-[#2BA8A2]">
                              {item.type === "SUCCESS" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
                            </div>
                            <div className="flex-1">
                              <p className="text-[11px] font-bold text-[#142826]">{item.title}</p>
                              {item.details && <p className="text-[10px] text-gray-500">{item.details}</p>}
                              <p className="text-[10px] text-gray-500">
                                {new Intl.DateTimeFormat("ar-SA", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }).format(new Date(item.createdAt))}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {sessionUser ? (
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex items-center rounded-full bg-[#E8F6F5] px-2.5 py-1 text-[11px] font-black text-[#1E8C86] border border-[#2BA8A2]/20">
                    {sessionUser.fullName || sessionUser.username}
                  </span>
                  <LogoutButton />
                </div>
              ) : (
                <Link href="/login" className="btn-pill px-4 py-2 bg-gradient-to-r from-[#2BA8A2] to-[#1E8C86] text-white text-xs shadow-teal-glow font-black">
                  تسجيل الدخول
                </Link>
              )}

              {showSettingsShortcut && (
                <Link href="/settings" className="p-2.5 rounded-full bg-[#FFF8E7] text-[#1E8C86] hover:bg-[#FFE47A] transition-all border border-[#E2D9C3] shadow-sm" title="إعدادات النظام والأسعار والش.logo">
                  <Settings className="w-5 h-5" />
                </Link>
              )}
              {showNewInvoiceButton && (
                <Link href="/invoices?new=1" className="btn-pill px-4 py-2 bg-gradient-to-r from-[#FFD23F] to-[#FFE47A] text-[#1E4D48] text-xs shadow-gold-glow hover:brightness-105 font-black hidden sm:inline-flex">
                  <Sparkles className="w-4 h-4 text-[#D45233]" />
                  فاتورة جديدة
                </Link>
              )}
            </div>
          </div>
        </header>

        <main className="w-full mx-auto px-[5px] py-0 pb-28 md:pb-10">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar (< 1280px) */}
        <nav
          aria-label="التنقل السفلي للهواتف"
          className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-[#2BA8A2]/20 shadow-[0_-4px_25px_rgba(0,0,0,0.07)] xl:hidden no-print"
        >
          <div className="flex items-center justify-around h-16 px-1">
            {/* 1. الرئيسية */}
            <Link
              href="/"
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                pathname === "/"
                  ? "text-[#1E8C86] font-black"
                  : "text-gray-500 font-bold hover:text-[#1E8C86]"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  pathname === "/" ? "bg-[#E8F6F5] text-[#1E8C86]" : ""
                }`}
              >
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5">الرئيسية</span>
            </Link>

            {/* 2. الفواتير */}
            <Link
              href="/invoices"
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                pathname.startsWith("/invoices")
                  ? "text-[#1E8C86] font-black"
                  : "text-gray-500 font-bold hover:text-[#1E8C86]"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  pathname.startsWith("/invoices") ? "bg-[#E8F6F5] text-[#1E8C86]" : ""
                }`}
              >
                <Receipt className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5">الفواتير</span>
            </Link>

            {/* 3. خط التشغيل */}
            <Link
              href="/production"
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                pathname.startsWith("/production")
                  ? "text-[#1E8C86] font-black"
                  : "text-gray-500 font-bold hover:text-[#1E8C86]"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  pathname.startsWith("/production") ? "bg-[#E8F6F5] text-[#1E8C86]" : ""
                }`}
              >
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5">التشغيل</span>
            </Link>

            {/* 4. المخزون */}
            <Link
              href="/inventory"
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                pathname.startsWith("/inventory")
                  ? "text-[#1E8C86] font-black"
                  : "text-gray-500 font-bold hover:text-[#1E8C86]"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  pathname.startsWith("/inventory") ? "bg-[#E8F6F5] text-[#1E8C86]" : ""
                }`}
              >
                <Package className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5">المخزون</span>
            </Link>

            {/* 5. المزيد (قائمة منبثقة لباقي الشاشات) */}
            <button
              type="button"
              onClick={() => setShowMobileMenu((prev) => !prev)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                showMobileMenu ||
                ["/contracts", "/expenses", "/employees", "/reports", "/settings"].some((p) =>
                  pathname.startsWith(p)
                )
                  ? "text-[#1E8C86] font-black"
                  : "text-gray-500 font-bold hover:text-[#1E8C86]"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  showMobileMenu ||
                  ["/contracts", "/expenses", "/employees", "/reports", "/settings"].some((p) =>
                    pathname.startsWith(p)
                  )
                    ? "bg-[#E8F6F5] text-[#1E8C86]"
                    : ""
                }`}
              >
                <MoreHorizontal className="w-5 h-5" />
              </div>
              <span className="text-[10px] mt-0.5">المزيد</span>
            </button>
          </div>
        </nav>

        {/* Mobile "More" Drawer / Modal */}
        {showMobileMenu && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs xl:hidden flex flex-col justify-end animate-in fade-in duration-200">
            <div
              className="bg-white rounded-t-3xl border-t border-[#2BA8A2]/20 shadow-2xl p-5 pb-8 space-y-4 max-h-[80vh] overflow-y-auto"
              dir="rtl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2BA8A2] to-[#1E8C86] flex items-center justify-center text-white">
                    <Printer className="w-4 h-4" />
                  </div>
                  <span className="font-black text-sm text-[#1E8C86]">أقسام النظام الإضافية</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobileMenu(false)}
                  className="p-1.5 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {canAccessPage(sessionUser, "contracts") && (
                  <Link
                    href="/contracts"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-[#F4FAF9] border border-[#2BA8A2]/10 hover:border-[#2BA8A2]/40 transition-all font-bold text-xs text-[#1E8C86]"
                  >
                    <FileSignature className="w-4 h-4" />
                    <span>العقود والتوريد</span>
                  </Link>
                )}

                {canAccessPage(sessionUser, "expenses") && (
                  <Link
                    href="/expenses"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-[#FFF1EE] border border-[#D45233]/15 hover:border-[#D45233]/40 transition-all font-bold text-xs text-[#D45233]"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>المصروفات</span>
                  </Link>
                )}

                {canAccessPage(sessionUser, "employees") && (
                  <Link
                    href="/employees"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-[#F4FAF9] border border-[#2BA8A2]/10 hover:border-[#2BA8A2]/40 transition-all font-bold text-xs text-[#1E8C86]"
                  >
                    <Users className="w-4 h-4" />
                    <span>الموظفين والرواتب</span>
                  </Link>
                )}

                {canAccessPage(sessionUser, "reports") && (
                  <Link
                    href="/reports"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-[#F4FAF9] border border-[#2BA8A2]/10 hover:border-[#2BA8A2]/40 transition-all font-bold text-xs text-[#1E8C86]"
                  >
                    <Layers className="w-4 h-4" />
                    <span>التقارير والأرباح</span>
                  </Link>
                )}

                {canAccessPage(sessionUser, "settings") && (
                  <Link
                    href="/settings"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-200 hover:border-[#2BA8A2]/40 transition-all font-bold text-xs text-gray-800"
                  >
                    <Settings className="w-4 h-4" />
                    <span>الإعدادات والأسعار</span>
                  </Link>
                )}

                {canAccessAction(sessionUser, "backupDatabase") && (
                  <Link
                    href="/settings?tab=backup"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-[#FFF8E7] border border-[#FFE47A] transition-all font-bold text-xs text-[#1E4D48]"
                  >
                    <Database className="w-4 h-4 text-[#2BA8A2]" />
                    <span>النسخ الاحتياطي</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
