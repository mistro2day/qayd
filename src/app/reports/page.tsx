"use client";

import { useEffect, useState, useTransition } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Printer,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  FileSpreadsheet,
  Package,
  Clock,
} from "lucide-react";
import { getReportsData } from "./../actions";
import Image from "next/image";

export default function ReportsPage() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "sales" | "expenses" | "salaries" | "inventory" | "management">("overview");
  const [isPending, startTransition] = useTransition();
  const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);
  const formatDate = (value: string | Date) => new Intl.DateTimeFormat("en-GB").format(new Date(value));

  const loadData = async (start?: string, end?: string) => {
    setLoading(true);
    const res = await getReportsData({
      startDate: start || undefined,
      endDate: end || undefined,
    });
    if (res.success) {
      setReportData(res);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFilter = () => {
    startTransition(() => {
      loadData(startDate, endDate);
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const summary = reportData?.summary || {};
    const inventoryMovements = reportData?.inventoryMovements || [];
    const expenseRows = reportData?.expensesByCategory ? Object.entries(reportData.expensesByCategory) : [];
    const salaryRows = employees || [];

    const rows: string[][] = [
      ["اسم المتجر", settings?.shopName || "الخواض لخدمات الطباعة"],
      ["تاريخ التقرير", formatDate(new Date())],
      ["الفترة", `${startDate || "البداية"} إلى ${endDate || "حتى الآن"}`],
      [],
      ["قسم", "العنصر", "القيمة"],
      ["المبيعات", "إجمالي المبيعات", String(summary.totalSales || 0)],
      ["المبيعات", "النقد المحصل", String(summary.totalCollected || 0)],
      ["المبيعات", "المستحقات", String(summary.receivables || 0)],
      ["المصروفات", "إجمالي المصروفات", String(summary.totalExpenses || 0)],
      ["الرواتب", "إجمالي الرواتب", String(salarySummary.totalSalariesPaid || 0)],
      ["المخزون", "قيمة المخزون", String(summary.inventoryValuation || 0)],
      ["الإدارة", "صافي الربح", String(summary.netProfit || 0)],
      ["الإدارة", "عملة", summary.currency || "ج.س"],
      [],
      ["تصنيف المصروفات", "المبلغ"],
      ...expenseRows.map(([key, value]) => [key, String(value)]),
      [],
      ["الموظف", "الراتب الإجمالي", "عدد الحركات"],
      ...salaryRows.map((employee: any) => [
        employee.name,
        String((employee.transactions || []).reduce((sum: number, tx: any) => sum + tx.amountPaid, 0)),
        String((employee.transactions || []).length),
      ]),
      [],
      ["الحركة", "الصنف", "النوع", "السبب", "الكمية", "الرصيد السابق", "الرصيد الجديد", "المستخدم", "التاريخ"],
      ...inventoryMovements.map((movement: any) => [
        movement.id,
        movement.product?.name || "-",
        movement.type,
        movement.reason,
        String(movement.quantity),
        String(movement.previousStock),
        String(movement.newStock),
        movement.user?.fullName || "نظام",
        formatDate(movement.createdAt),
      ]),
    ];

    const csv = rows
      .map((row) =>
        row
          .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `qayd-report-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const summary = reportData?.summary;
  const currency = summary?.currency || "ج.س";
  const settings = reportData?.settings;
  const inventoryMovements = reportData?.inventoryMovements || [];
  const salarySummary = reportData?.salarySummary || { totalSalariesPaid: 0, employeeCount: 0 };
  const inventorySummary = reportData?.inventorySummary || { totalProducts: 0, lowStockCount: 0, inventoryValuation: 0, totalUnits: 0 };
  const employees = reportData?.employees || [];
  const tabs = [
    { id: "overview", label: "الرئيسية" },
    { id: "sales", label: "المبيعات" },
    { id: "expenses", label: "المصروفات" },
    { id: "salaries", label: "الرواتب" },
    { id: "inventory", label: "المخزون" },
    { id: "management", label: "الإدارة" },
  ] as const;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Actions (Hidden in Print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-5 shadow-card-subtle border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2BA8A2] to-[#1E8C86] text-white flex items-center justify-center shadow-teal-glow">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#142826]">
              الصفحة الرئيسية للتقارير
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              ملخص شامل للمبيعات، المصروفات، الرواتب، المخزون، والإدارة في صفحة واحدة قابلة للطباعة والتصدير
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCsv}
            className="btn-pill px-4 py-2.5 bg-[#E8F6F5] hover:bg-[#D8F2EE] text-[#1E8C86] text-xs font-black border border-[#BEEAE6] shadow-sm flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            تصدير CSV
          </button>
          <button
            onClick={handlePrint}
            className="btn-pill px-4 py-2.5 bg-[#FFF8E7] hover:bg-[#FFE47A] text-[#1E4D48] text-xs font-black border border-[#FFE47A] shadow-sm flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-[#2BA8A2]" />
            طباعة تقرير الإدارة
          </button>
        </div>
      </div>

      {/* Date Filter Bar (Hidden in Print) */}
      <div className="no-print bg-white p-4 rounded-2xl border border-gray-100 shadow-card-subtle flex flex-wrap items-center gap-3 text-xs">
        <span className="font-bold text-gray-700 flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-[#2BA8A2]" />
          تصفية الفترة:
        </span>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">من:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-cream rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">إلى:</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input-cream rounded-xl px-3 py-1.5 text-xs font-mono font-bold"
          />
        </div>
        <button
          onClick={handleFilter}
          disabled={isPending}
          className="btn-pill px-4 py-1.5 bg-[#2BA8A2] text-white font-bold hover:brightness-105"
        >
          تطبيق التصفية
        </button>
        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
              loadData();
            }}
            className="text-xs text-gray-400 hover:text-gray-700 underline"
          >
            إعادة تعيين (عرض الكل)
          </button>
        )}
      </div>

      {/* OFFICIAL REPORT CONTAINER (PRINT FRIENDLY) */}
      <div className="print-page bg-white p-8 sm:p-10 rounded-3xl shadow-card-subtle border border-gray-200 text-[#142826] space-y-8">
        {/* Printable Official Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b-2 border-[#2BA8A2]">
          <div className="flex items-center gap-4 text-center sm:text-right">
            {settings?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.logoUrl}
                alt="شعار المطبعة"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-2xl border border-gray-200 p-1 bg-white shadow-sm shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#2BA8A2] to-[#1E8C86] text-white flex items-center justify-center shadow-teal-glow shrink-0">
                <Printer className="w-8 h-8" />
              </div>
            )}
            <div className="space-y-1">
              <h1 className="text-2xl font-black text-[#1E8C86]">
                {settings?.shopName || "الخواض لخدمات الطباعة"}
              </h1>
              <p className="text-xs font-bold text-gray-500">
                الإدارة المالية والحسابات العامة • تقرير المركز المالي والتشغيلي
              </p>
              <p className="text-[11px] text-gray-400 font-mono">
                العنوان: {settings?.address || "الخرطوم - أم درمان"} | هاتف:{" "}
                {settings?.phone || "09XXXXXXXX"}
              </p>
            </div>
          </div>

          <div className="text-center sm:text-left space-y-1">
            <div className="px-3.5 py-1 rounded-full bg-[#FFF8E7] border border-[#FFE47A] text-[#D45233] text-xs font-black shadow-sm">
              تقرير مالي وتدفقات معتمد
            </div>
            <span className="text-xs text-gray-500 font-mono block">
              تاريخ الاستخراج: {new Date().toLocaleDateString("en-GB")}
            </span>
            <span className="text-[11px] text-gray-400 block">
              الفترة: {startDate || "البداية"} إلى {endDate || "تاريخه"}
            </span>
          </div>
        </div>

        <div className="no-print flex flex-wrap gap-2 rounded-2xl border border-gray-100 bg-gray-50 p-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-black transition-all ${
                activeTab === tab.id
                  ? "bg-[#2BA8A2] text-white shadow-teal-glow"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-[#2BA8A2]/30"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <>
            <div className="border-b border-[#2BA8A2]/20 pb-2">
              <h2 className="text-sm font-black text-[#1E8C86]">ملخص الصفحة الرئيسية للتقرير</h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> إجمالي المبيعات
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-900 font-mono block">
                  {formatNumber(summary?.totalSales || 0)}
                </span>
                <span className="text-[11px] text-emerald-700 font-bold block">
                  {currency} (شاملة الآجل والنقدي)
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#E8F6F5] border border-[#2BA8A2]/30 space-y-1">
                <span className="text-xs font-bold text-[#1E8C86] flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5" /> النقد المحصل فعلياً
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#1E8C86] font-mono block">
                  {formatNumber(summary?.totalCollected || 0)}
                </span>
                <span className="text-[11px] text-[#1E8C86] font-bold block">
                  {currency} (داخل الخزينة)
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1">
                <span className="text-xs font-bold text-rose-800 flex items-center gap-1">
                  <ArrowDownRight className="w-3.5 h-3.5" /> إجمالي المصروفات
                </span>
                <span className="text-xl sm:text-2xl font-black text-rose-900 font-mono block">
                  {formatNumber(summary?.totalExpenses || 0)}
                </span>
                <span className="text-[11px] text-rose-700 font-bold block">
                  {currency} (تشغيل ورواتب وخامات)
                </span>
              </div>

              <div
                className={`p-4 rounded-2xl border space-y-1 ${
                  (summary?.netProfit || 0) >= 0
                    ? "bg-[#FFF8E7] border-[#FFE47A]"
                    : "bg-red-100 border-red-300"
                }`}
              >
                <span className="text-xs font-bold text-[#1E4D48] flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> صافي الأرباح المحققة
                </span>
                <span
                  className={`text-xl sm:text-2xl font-black font-mono block ${
                    (summary?.netProfit || 0) >= 0 ? "text-[#1E8C86]" : "text-rose-700"
                  }`}
                >
                  {new Intl.NumberFormat("en-US").format(summary?.netProfit || 0)}
                </span>
                <span className="text-[11px] text-[#D45233] font-bold block">
                  {currency} (المحصل - المنصرف)
                </span>
              </div>
            </div>
          </>
        )}

        {activeTab === "sales" && (
          <div className="space-y-5">
            <h3 className="text-sm font-black text-[#142826]">قسم المبيعات</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[11px] text-emerald-700 font-bold block">إجمالي المبيعات</span>
                <span className="text-xl font-black text-emerald-800 font-mono">{formatNumber(summary?.totalSales || 0)}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#E8F6F5] border border-[#B7E4E1]">
                <span className="text-[11px] text-[#1E8C86] font-bold block">المبيعات النقدية</span>
                <span className="text-xl font-black text-[#1E8C86] font-mono">{formatNumber(summary?.totalCollected || 0)}</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-[11px] text-amber-700 font-bold block">الذمم المستحقة</span>
                <span className="text-xl font-black text-amber-800 font-mono">{formatNumber(summary?.receivables || 0)}</span>
              </div>
            </div>

            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#E8F6F5] text-[#1E8C86] font-black">
                  <tr>
                    <th className="py-2.5 px-4">اسم الخدمة أو المنتج</th>
                    <th className="py-2.5 px-4 text-center">الكمية</th>
                    <th className="py-2.5 px-4 text-left">الإيراد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportData?.topItems?.map((it: any, idx: number) => (
                    <tr key={idx}>
                      <td className="py-3 px-4 font-bold text-gray-800">{it.name}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-gray-700">{it.count}</td>
                      <td className="py-3 px-4 text-left font-mono font-black text-[#1E8C86]">{formatNumber(it.total)} {currency}</td>
                    </tr>
                  )) || (
                    <tr><td colSpan={3} className="py-6 text-center text-gray-400">لا توجد مبيعات في هذه الفترة.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "expenses" && (
          <div className="space-y-5">
            <h3 className="text-sm font-black text-[#142826]">قسم المصروفات</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                <span className="text-[11px] text-rose-700 font-bold block">إجمالي المصروفات</span>
                <span className="text-xl font-black text-rose-800 font-mono">{formatNumber(summary?.totalExpenses || 0)}</span>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <span className="text-[11px] text-gray-600 font-bold block">أعلى تصنيف</span>
                <span className="text-lg font-black text-gray-800">{Object.keys(reportData?.expensesByCategory || {})[0] || "لا توجد"}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#FFF8E7] border border-[#FFE47A]">
                <span className="text-[11px] text-[#D45233] font-bold block">متوسط النفقات</span>
                <span className="text-xl font-black text-[#D45233] font-mono">{formatNumber((summary?.totalExpenses || 0) / Math.max(1, Object.keys(reportData?.expensesByCategory || {}).length))}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {reportData?.expensesByCategory && Object.entries(reportData.expensesByCategory).map(([cat, amount]: [string, any]) => (
                <div key={cat} className="p-3 rounded-xl border border-gray-100 bg-[#F9FCFC] flex justify-between items-center">
                  <span className="font-bold text-gray-700">{cat}</span>
                  <span className="font-black text-[#D45233] font-mono">{new Intl.NumberFormat("en-US").format(amount)} {currency}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "salaries" && (
          <div className="space-y-5">
            <h3 className="text-sm font-black text-[#142826]">قسم الرواتب</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#E8F6F5] border border-[#B7E4E1]">
                <span className="text-[11px] text-[#1E8C86] font-bold block">إجمالي الرواتب</span>
                <span className="text-xl font-black text-[#1E8C86] font-mono">{formatNumber(salarySummary.totalSalariesPaid || 0)}</span>
              </div>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <span className="text-[11px] text-gray-600 font-bold block">عدد الموظفين</span>
                <span className="text-xl font-black text-gray-800">{salarySummary.employeeCount || 0}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#FFF8E7] border border-[#FFE47A]">
                <span className="text-[11px] text-[#D45233] font-bold block">متوسط الراتب</span>
                <span className="text-xl font-black text-[#D45233] font-mono">{formatNumber((salarySummary.totalSalariesPaid || 0) / Math.max(1, salarySummary.employeeCount || 1))}</span>
              </div>
            </div>

            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#E8F6F5] text-[#1E8C86] font-black">
                  <tr>
                    <th className="py-2.5 px-4">الموظف</th>
                    <th className="py-2.5 px-4 text-center">إجمالي المدفوعات</th>
                    <th className="py-2.5 px-4 text-center">عدد الحركات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {employees.map((employee: any) => (
                    <tr key={employee.id}>
                      <td className="py-3 px-4 font-bold text-gray-800">{employee.name}</td>
                      <td className="py-3 px-4 text-center font-mono font-black text-[#1E8C86]">{formatNumber((employee.transactions || []).reduce((sum: number, tx: any) => sum + tx.amountPaid, 0))} {currency}</td>
                      <td className="py-3 px-4 text-center font-mono text-gray-700">{(employee.transactions || []).length}</td>
                    </tr>
                  )) || (
                    <tr><td colSpan={3} className="py-6 text-center text-gray-400">لا توجد بيانات رواتب.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "inventory" && (
          <div className="space-y-5">
            <h3 className="text-sm font-black text-[#142826]">قسم المخزون</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#E8F6F5] border border-[#B7E4E1]">
                <span className="text-[11px] text-[#1E8C86] font-bold block">عدد الأصناف</span>
                <span className="text-xl font-black text-[#1E8C86]">{inventorySummary.totalProducts || 0}</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-[11px] text-amber-700 font-bold block">أصناف منخفضة</span>
                <span className="text-xl font-black text-amber-800">{inventorySummary.lowStockCount || 0}</span>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                <span className="text-[11px] text-rose-700 font-bold block">إجمالي الوحدات</span>
                <span className="text-xl font-black text-rose-800">{inventorySummary.totalUnits || 0}</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[11px] text-emerald-700 font-bold block">قيمة المخزون</span>
                <span className="text-xl font-black text-emerald-800 font-mono">{formatNumber(inventorySummary.inventoryValuation || 0)}</span>
              </div>
            </div>

            <div className="border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#E8F6F5] text-[#1E8C86] font-black">
                  <tr>
                    <th className="py-2.5 px-4">الصنف</th>
                    <th className="py-2.5 px-4">النوع</th>
                    <th className="py-2.5 px-4">السبب</th>
                    <th className="py-2.5 px-4 text-center">الكمية</th>
                    <th className="py-2.5 px-4 text-center">الرصيد السابق</th>
                    <th className="py-2.5 px-4 text-center">الرصيد الجديد</th>
                    <th className="py-2.5 px-4">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inventoryMovements.length > 0 ? inventoryMovements.map((movement: any) => (
                    <tr key={movement.id}>
                      <td className="py-3 px-4 font-bold text-gray-800">{movement.product?.name || "-"}</td>
                      <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${movement.type === "IN" ? "bg-emerald-100 text-emerald-700" : movement.type === "OUT" ? "bg-rose-100 text-rose-700" : movement.type === "RETURN" ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"}`}>{movement.type}</span></td>
                      <td className="py-3 px-4 text-gray-600">{movement.reason}</td>
                      <td className={`py-3 px-4 text-center font-black ${movement.quantity >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{movement.quantity > 0 ? "+" : ""}{movement.quantity}</td>
                      <td className="py-3 px-4 text-center font-mono text-gray-700">{movement.previousStock}</td>
                      <td className="py-3 px-4 text-center font-mono text-gray-700">{movement.newStock}</td>
                      <td className="py-3 px-4 text-gray-500">{new Date(movement.createdAt).toLocaleString("en-GB")}</td>
                    </tr>
                  )) : <tr><td colSpan={7} className="py-6 text-center text-gray-400">لا توجد حركات مخزون في هذه الفترة.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "management" && (
          <div className="space-y-5">
            <h3 className="text-sm font-black text-[#142826]">قسم الإدارة</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <span className="text-gray-500 font-bold block mb-1">المستحقات</span>
                <span className="text-xl font-black text-[#D45233] font-mono">{formatNumber(summary?.receivables || 0)} {currency}</span>
              </div>
              <div className="p-4 rounded-2xl bg-[#E8F6F5] border border-[#B7E4E1]">
                <span className="text-[#1E8C86] font-bold block mb-1">قيمة المخزون</span>
                <span className="text-xl font-black text-[#1E8C86] font-mono">{formatNumber(summary?.inventoryValuation || 0)} {currency}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {reportData?.expensesByCategory && Object.entries(reportData.expensesByCategory).map(([cat, amount]: [string, any]) => (
                <div key={cat} className="p-3 rounded-xl border border-gray-100 bg-[#F9FCFC] flex justify-between items-center">
                  <span className="font-bold text-gray-700">{cat}</span>
                  <span className="font-black text-[#D45233] font-mono">{new Intl.NumberFormat("en-US").format(amount)} {currency}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex justify-between items-center text-xs">
            <div>
              <span className="text-gray-500 font-bold block mb-1">مستحقات وذمم باقية طرف العملاء:</span>
              <span className="text-xl font-black text-[#D45233] font-mono">{new Intl.NumberFormat("en-US").format(summary?.receivables || 0)} {currency}</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 font-black text-[11px]">ديون مستحقة القبض</span>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex justify-between items-center text-xs">
            <div>
              <span className="text-gray-500 font-bold block mb-1">القيمة التقديرية لمخزون القرطاسية والخامات:</span>
              <span className="text-xl font-black text-[#1E8C86] font-mono">{new Intl.NumberFormat("en-US").format(summary?.inventoryValuation || 0)} {currency}</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#E8F6F5] text-[#1E8C86] font-black text-[11px]">أصول مخزنية</span>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-black text-[#1E8C86] border-b pb-2 flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            أكثر خدمات الطباعة والمنتجات طلباً ومبيعات:
          </h3>
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#E8F6F5] text-[#1E8C86] font-black">
                <tr>
                  <th className="py-2.5 px-4 w-12 text-center">#</th>
                  <th className="py-2.5 px-4">اسم الخدمة أو المطبوع</th>
                  <th className="py-2.5 px-4 text-center">الكمية المباعة</th>
                  <th className="py-2.5 px-4 text-left">إجمالي الإيراد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportData?.topItems?.map((it: any, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-4 text-center text-gray-400 font-bold">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-bold text-gray-800">{it.name}</td>
                    <td className="py-2.5 px-4 text-center font-bold text-gray-700 font-mono">{it.count}</td>
                    <td className="py-2.5 px-4 text-left font-black text-[#1E8C86] font-mono">{formatNumber(it.total)} {currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-10 border-t border-gray-200 text-center text-xs text-gray-600 font-bold">
          <div className="space-y-8"><span>المحاسب المالي</span><div className="border-b border-dashed border-gray-400 w-36 mx-auto" /></div>
          <div className="space-y-8"><span>المدير العام للمطبعة</span><div className="border-b border-dashed border-gray-400 w-36 mx-auto" /></div>
          <div className="space-y-8 col-span-2 sm:col-span-1"><span>الختم والاعتماد الرسمي</span><div className="w-24 h-24 mx-auto border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center text-[10px] text-gray-400">ختم المطبعة</div></div>
        </div>
      </div>
    </div>
  );
}
