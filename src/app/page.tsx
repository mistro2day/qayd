import Link from "next/link";
import { redirect } from "next/navigation";
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Receipt,
  Layers,
  Sparkles,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Package,
  Printer,
  ChevronLeft,
} from "lucide-react";
import { getCurrentUser, getDashboardData } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);

  if (!user) {
    redirect("/login");
  }

  const result = await getDashboardData();
  const data = result.success ? result.data : null;

  const kpis = data?.kpis || {
    totalSales: 0,
    totalCollected: 0,
    totalUnpaid: 0,
    totalExpenses: 0,
    currency: "ج.س",
  };

  const pipeline = data?.pipeline || {
    design: 0,
    printing: 0,
    finishing: 0,
    delivery: 0,
    urgent: 0,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Hero Banner - Flip7 Card Style */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#2BA8A2] to-[#1E8C86] p-6 sm:p-8 text-white shadow-teal-glow">
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-12 top-4 w-32 h-32 bg-[#FFD23F]/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFF8E7] text-[#1E4D48] text-xs font-black shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#FFD23F]" />
              نظام التشغيل الفوري • قَيْد OS
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              الخواض لخدمات الطباعة
            </h1>
            <p className="text-white/80 text-sm sm:text-base font-medium max-w-xl">
              إدارة خط الإنتاج والطباعة، نقاط البيع السريعة، تتبع المخزون الورقي،
              وعقود التوريد الشهرية في واجهة موحدة.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/invoices?new=1"
              className="btn-pill px-5 py-3 bg-[#FFD23F] hover:bg-[#FFE47A] text-[#1E4D48] text-sm font-black shadow-gold-glow border-2 border-[#E6B800]"
            >
              <Receipt className="w-4 h-4 text-[#D45233]" />
              إصدار فاتورة سريعة
            </Link>
            <Link
              href="/production"
              className="btn-pill px-5 py-3 bg-white hover:bg-[#EFF8F7] text-[#1E8C86] text-sm font-bold shadow-md"
            >
              <Layers className="w-4 h-4 text-[#2BA8A2]" />
              كانبان التشغيل
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Financial Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Total Sales */}
        <div className="bg-white rounded-2xl p-5 shadow-card-subtle border-r-4 border-r-[#FFD23F] border border-gray-100 relative group hover:shadow-teal-glow transition-all">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold text-[#1E8C86]">إجمالي المبيعات</span>
            <div className="w-8 h-8 rounded-full bg-[#FFF8E7] flex items-center justify-center text-[#E6B800]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-[#142826]">
              {formatNumber(kpis.totalSales)}
            </span>
            <span className="text-xs font-bold text-gray-500">{kpis.currency}</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 font-medium">
            شامل المطبوعات والقرطاسية المكتبية
          </p>
        </div>

        {/* Collected */}
        <div className="bg-white rounded-2xl p-5 shadow-card-subtle border-r-4 border-r-[#27AE60] border border-gray-100 relative group hover:shadow-teal-glow transition-all">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold text-[#27AE60]">المقبوض نقداً (الخزينة)</span>
            <div className="w-8 h-8 rounded-full bg-[#E8F8EE] flex items-center justify-center text-[#27AE60]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-[#142826]">
              {formatNumber(kpis.totalCollected)}
            </span>
            <span className="text-xs font-bold text-gray-500">{kpis.currency}</span>
          </div>
          <p className="text-[11px] text-emerald-600 mt-2 font-semibold">
            المبالغ المحصلة والمودعة فعلياً
          </p>
        </div>

        {/* Unpaid Balance */}
        <div className="bg-white rounded-2xl p-5 shadow-card-subtle border-r-4 border-r-[#EF6C4A] border border-gray-100 relative group hover:shadow-coral-glow transition-all">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold text-[#EF6C4A]">الآجل والمستحقات</span>
            <div className="w-8 h-8 rounded-full bg-[#FDF0EC] flex items-center justify-center text-[#EF6C4A]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-[#EF6C4A]">
              {formatNumber(kpis.totalUnpaid)}
            </span>
            <span className="text-xs font-bold text-gray-500">{kpis.currency}</span>
          </div>
          <p className="text-[11px] text-rose-500 mt-2 font-semibold">
            متبقي ذمم فواتير وعقود عملاء
          </p>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-2xl p-5 shadow-card-subtle border-r-4 border-r-[#2BA8A2] border border-gray-100 relative group hover:shadow-teal-glow transition-all">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-bold text-[#1E8C86]">المصروفات والخامات</span>
            <div className="w-8 h-8 rounded-full bg-[#E8F6F5] flex items-center justify-center text-[#2BA8A2]">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-black text-[#142826]">
              {formatNumber(kpis.totalExpenses)}
            </span>
            <span className="text-xs font-bold text-gray-500">{kpis.currency}</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-2 font-medium">
            ورق، أحبار، كهرباء، ونثريات
          </p>
        </div>
      </div>

      {/* Production Pipeline Counter (Live Kanban Summary) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#2BA8A2] animate-pulse" />
            <h2 className="text-lg font-black text-[#1E8C86]">
              خط مراحل الإنتاج الحالية
            </h2>
          </div>
          <Link
            href="/production"
            className="text-xs font-bold text-[#2BA8A2] hover:text-[#1E8C86] flex items-center gap-1 group"
          >
            عرض لوحة الكانبان
            <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Design */}
          <Link
            href="/production?stage=DESIGN"
            className="p-4 rounded-2xl bg-white border border-[#2BA8A2]/15 shadow-sm hover:border-[#2BA8A2] hover:shadow-teal-glow transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1E8C86]">🎨 1. التصميم والإخراج</span>
              <span className="px-2 py-0.5 rounded-full bg-[#E8F6F5] text-[#1E8C86] text-xs font-black">
                {pipeline.design}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-3 font-medium">
              تجهيز ومراجعة البروفات
            </p>
          </Link>

          {/* Printing */}
          <Link
            href="/production?stage=PRINTING"
            className="p-4 rounded-2xl bg-white border border-[#FFD23F]/30 shadow-sm hover:border-[#FFD23F] hover:shadow-gold-glow transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#D45233]">🖨️ 2. سحب الطباعة</span>
              <span className="px-2 py-0.5 rounded-full bg-[#FFF8E7] text-[#D45233] text-xs font-black">
                {pipeline.printing}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-3 font-medium">
              ديجيتال، أوفست، فليكس
            </p>
          </Link>

          {/* Finishing */}
          <Link
            href="/production?stage=FINISHING"
            className="p-4 rounded-2xl bg-white border border-[#5DADE2]/30 shadow-sm hover:border-[#5DADE2] hover:shadow-sky-glow transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#2980B9]">✂️ 3. القص والتشطيب</span>
              <span className="px-2 py-0.5 rounded-full bg-[#EBF5FB] text-[#2980B9] text-xs font-black">
                {pipeline.finishing}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-3 font-medium">
              سلوفان، ريجة، وتجليد
            </p>
          </Link>

          {/* Delivery */}
          <Link
            href="/production?stage=DELIVERY"
            className="p-4 rounded-2xl bg-white border border-[#27AE60]/30 shadow-sm hover:border-[#27AE60] hover:shadow-teal-glow transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#27AE60]">📦 4. جاهز للتسليم</span>
              <span className="px-2 py-0.5 rounded-full bg-[#E8F8EE] text-[#27AE60] text-xs font-black">
                {pipeline.delivery}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-3 font-medium">
              تعبئة واستلام العميل
            </p>
          </Link>
        </div>
      </div>


      {/* Quick Administrative Hub: Reports, Expenses, Employees, Users */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Link
          href="/reports"
          className="p-4 rounded-2xl bg-white border border-[#2BA8A2]/20 shadow-sm hover:shadow-teal-glow hover:border-[#2BA8A2] transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E8F6F5] text-[#2BA8A2] group-hover:bg-[#2BA8A2] group-hover:text-white transition-colors flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-[#142826]">التقارير الشاملة</h3>
            <p className="text-[10px] text-gray-400 font-medium">أرباح ومبيعات وتدفقات</p>
          </div>
        </Link>

        <Link
          href="/expenses"
          className="p-4 rounded-2xl bg-white border border-[#EF6C4A]/20 shadow-sm hover:shadow-coral-glow hover:border-[#EF6C4A] transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FDF0EC] text-[#EF6C4A] group-hover:bg-[#EF6C4A] group-hover:text-white transition-colors flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-[#142826]">المصروفات اليومية</h3>
            <p className="text-[10px] text-gray-400 font-medium">خامات، أحبار، تشغيل</p>
          </div>
        </Link>

        <Link
          href="/employees"
          className="p-4 rounded-2xl bg-white border border-[#FFD23F]/30 shadow-sm hover:shadow-gold-glow hover:border-[#FFD23F] transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FFF8E7] text-[#D45233] group-hover:bg-[#FFD23F] group-hover:text-[#1E4D48] transition-colors flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-[#142826]">الموظفين والرواتب</h3>
            <p className="text-[10px] text-gray-400 font-medium">أجور شهرية، أسبوعية، ويومية</p>
          </div>
        </Link>

        <Link
          href="/settings?tab=users"
          className="p-4 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-400 transition-all flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 group-hover:bg-gray-800 group-hover:text-white transition-colors flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-black text-[#142826]">الإعدادات</h3>
            <p className="text-[10px] text-gray-400 font-medium">المستخدمين، الأسعار، وسجل النشاطات</p>
          </div>
        </Link>
      </div>

      {/* Two Column Grid: Urgent Tasks + Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Tasks */}
        <div className="bg-white rounded-2xl p-6 shadow-card-subtle border border-gray-100 space-y-4">
          <div className="flex items-center justify-between border-b border-dashed border-gray-200 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#EF6C4A] animate-ping" />
              <h3 className="font-black text-[#142826] text-base">
                طلبات عاجلة تتطلب سرعة الإنجاز
              </h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#FDF0EC] text-[#EF6C4A]">
              {data?.urgentTasks?.length || 0} طلب
            </span>
          </div>

          <div className="space-y-3">
            {data?.urgentTasks && data.urgentTasks.length > 0 ? (
              data.urgentTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3.5 rounded-xl bg-[#FFF8E7]/50 border border-[#FFE47A] flex items-center justify-between gap-3 hover:bg-[#FFF8E7] transition-all"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-[#D45233] block">
                      {task.title}
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">
                      فاتورة: {task.invoice?.invoiceCode} • مرحلة: {task.stage}
                    </span>
                  </div>
                  <Link
                    href={`/production?stage=${task.stage}`}
                    className="btn-pill px-3 py-1.5 bg-[#EF6C4A] hover:bg-[#D45233] text-white text-xs font-bold shadow-coral-glow shrink-0"
                  >
                    متابعة
                  </Link>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-gray-400 text-xs font-medium">
                🎉 لا توجد طلبات متأخرة أو حرجة حالياً.
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl p-6 shadow-card-subtle border border-gray-100 space-y-4">
          <div className="flex items-center justify-between border-b border-dashed border-gray-200 pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#2BA8A2]" />
              <h3 className="font-black text-[#142826] text-base">
                تنبيهات نواقص مخزون الورق والخامات
              </h3>
            </div>
            <Link
              href="/inventory"
              className="text-xs font-bold text-[#2BA8A2] hover:underline"
            >
              إدارة المخزون
            </Link>
          </div>

          <div className="space-y-2.5">
            {data?.lowStockItems && data.lowStockItems.length > 0 ? (
              data.lowStockItems.map((prod) => (
                <div
                  key={prod.id}
                  className="p-3 rounded-xl bg-gray-50 hover:bg-[#EFF8F7] border border-gray-100 flex items-center justify-between transition-all"
                >
                  <div>
                    <span className="text-xs font-bold text-[#142826] block">
                      {prod.name}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      الوحدة: {prod.unit} • الكود: {prod.sku}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-[#FDF0EC] text-[#EF6C4A] border border-[#EF6C4A]/20">
                      متبقي {prod.stockQuantity}
                    </span>
                    <Link
                      href="/inventory"
                      className="text-xs font-bold text-[#2BA8A2] hover:underline"
                    >
                      توريد
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-gray-400 text-xs font-medium">
                ✅ مستويات المخزون كافية ومستقرة.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Invoices Table / Mobile Cards */}
      <div className="bg-white rounded-2xl p-6 shadow-card-subtle border border-gray-100 space-y-4">
        <div className="flex items-center justify-between border-b border-dashed border-gray-200 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#2BA8A2]" />
            <h3 className="font-black text-[#142826] text-base">
              أحدث الفواتير وأوامر الشغل الصادرة
            </h3>
          </div>
          <Link
            href="/invoices"
            className="btn-pill px-4 py-1.5 bg-[#FFF8E7] text-[#1E8C86] border border-[#FFE47A] text-xs font-bold hover:bg-[#FFE47A]"
          >
            عرض الكل
          </Link>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold">
                <th className="py-3 px-2">رقم الفاتورة</th>
                <th className="py-3 px-2">العميل</th>
                <th className="py-3 px-2">الإجمالي</th>
                <th className="py-3 px-2">المدفوع</th>
                <th className="py-3 px-2">الحالة</th>
                <th className="py-3 px-2">التاريخ</th>
                <th className="py-3 px-2 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.recentInvoices && data.recentInvoices.length > 0 ? (
                data.recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-[#F4FAF9] transition-colors">
                    <td className="py-3 px-2 font-mono font-bold text-[#1E8C86]">
                      {inv.invoiceCode}
                    </td>
                    <td className="py-3 px-2 font-bold text-gray-800">
                      {inv.clientName}
                    </td>
                    <td className="py-3 px-2 font-black text-gray-900">
                      {formatNumber(inv.totalAmount)} {kpis.currency}
                    </td>
                    <td className="py-3 px-2 font-medium text-emerald-600">
                      {formatNumber(inv.paidAmount)} {kpis.currency}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          inv.status === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : inv.status === "PARTIAL"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {inv.status === "PAID"
                          ? "خالصة"
                          : inv.status === "PARTIAL"
                          ? "سداد جزئي"
                          : "غير مسددة"}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-gray-400">
                      {new Date(inv.createdAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="btn-pill px-3 py-1 bg-[#E8F6F5] hover:bg-[#2BA8A2] hover:text-white text-[#1E8C86] text-xs font-bold transition-all"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        طباعة
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-400">
                    لا توجد فواتير مسجلة بعد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {data?.recentInvoices && data.recentInvoices.length > 0 ? (
            data.recentInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#1E8C86]">
                    {inv.invoiceCode}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      inv.status === "PAID"
                        ? "bg-emerald-50 text-emerald-700"
                        : inv.status === "PARTIAL"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {inv.status === "PAID" ? "خالصة" : "غير مسددة"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{inv.clientName}</span>
                  <span className="text-[#142826] font-black">
                    {formatNumber(inv.totalAmount)} {kpis.currency}
                  </span>
                </div>
                <div className="pt-2 flex items-center justify-between border-t border-gray-200/60">
                  <span className="text-[10px] text-gray-400">
                    {new Date(inv.createdAt).toLocaleDateString("en-GB")}
                  </span>
                  <Link
                    href={`/invoices/${inv.id}`}
                    className="btn-pill px-3 py-1 bg-[#2BA8A2] text-white text-xs font-bold"
                  >
                    عرض وطباعة
                  </Link>
                </div>
              </div>
            ))
          ) : null}
        </div>
      </div>
    </div>
  );
}
