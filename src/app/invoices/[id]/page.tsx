import { getInvoiceById } from "../../actions";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Printer,
  ArrowRight,
  Receipt,
  Phone,
  MapPin,
  Mail,
  CheckCircle2,
  Clock,
  Layers,
} from "lucide-react";
import PrintButton from "./print-button";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);
  const { id } = await params;
  const res = await getInvoiceById(id);

  if (!res.success || !res.invoice) {
    notFound();
  }

  const { invoice, settings } = res;
  const remaining = invoice.totalAmount - invoice.paidAmount;
  const paymentHistory = invoice.payments || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Actions Bar (Hidden when printing) */}
      <div className="flex items-center justify-between no-print bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <Link
          href="/invoices"
          className="btn-pill px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold"
        >
          <ArrowRight className="w-4 h-4" />
          العودة لقائمة الفواتير
        </Link>

        <div className="flex items-center gap-3">
          <PrintButton />
        </div>
      </div>

      {/* Official Printable Invoice Sheet */}
      <div className="print-page bg-white p-8 sm:p-12 rounded-3xl shadow-card-subtle border border-gray-200 text-[#142826] space-y-8">
        {/* Letterhead Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b-2 border-[#2BA8A2]">
          <div className="flex items-center gap-4 text-center sm:text-right">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings?.logoUrl || "/logo.svg"}
              alt={settings?.shopName || "شعار المطبعة"}
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-2xl border border-gray-100 p-1 bg-white shadow-sm shrink-0"
            />
            <div className="space-y-1.5">
              <h1 className="text-2xl sm:text-3xl font-black text-[#1E8C86]">
                {settings?.shopName || "الخواض لخدمات الطباعة"}
              </h1>
              <p className="text-xs font-bold text-gray-500">
                ديجيتال • أوفست • دعاية وإعلان • لوحات وزنك وفليكس • تجليد وتغليف
              </p>
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-600 pt-1">
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5 text-[#2BA8A2]" />
                  {settings?.phone || "0912345678"}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#2BA8A2]" />
                  {settings?.address || "الخرطوم - أم درمان"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center sm:items-end space-y-1">
            <div className="px-4 py-1.5 rounded-full bg-[#FFF8E7] border border-[#FFE47A] text-[#D45233] text-xs font-black shadow-sm">
              فاتورة ضريبية مبسطة / أمر شغل
            </div>
            <span className="font-mono text-sm font-bold text-[#1E8C86]">
              {invoice.invoiceCode}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              التاريخ: {new Date(invoice.createdAt).toLocaleDateString("en-GB")}
            </span>
          </div>
        </div>

        {/* Client & Bill Info Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#F4FAF9] border border-[#2BA8A2]/15">
          <div className="space-y-1">
            <span className="text-xs text-gray-400 font-bold block">مطلوب من السادة:</span>
            <span className="text-base font-black text-[#142826] block">
              {invoice.clientName}
            </span>
            {invoice.clientPhone && (
              <span className="text-xs text-gray-600 font-mono block">
                الهاتف: {invoice.clientPhone}
              </span>
            )}
          </div>

          <div className="space-y-1 sm:text-left">
            <span className="text-xs text-gray-400 font-bold block">حالة السداد:</span>
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-black ${
                invoice.status === "PAID"
                  ? "bg-emerald-100 text-emerald-800"
                  : invoice.status === "PARTIAL"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {invoice.status === "PAID"
                ? "مسددة بالكامل (خالصة) ✓"
                : invoice.status === "PARTIAL"
                ? "سداد جزئي (متبقي رصيد)"
                : "غير مسددة (آجل)"}
            </span>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#E8F6F5] text-[#1E8C86] font-black border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">البيان وتفاصيل المطبوعات</th>
                <th className="py-3 px-4 w-24 text-center">الكمية</th>
                <th className="py-3 px-4 w-32 text-center">سعر الوحدة</th>
                <th className="py-3 px-4 w-32 text-left">الإجمالي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.items.map((it: any, idx: number) => (
                <tr key={it.id} className="hover:bg-gray-50/50">
                  <td className="py-3.5 px-4 text-center font-bold text-gray-400">
                    {idx + 1}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-bold text-gray-900 block">
                      {it.description}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {it.itemType === "PRINT" ? "طباعة مخصصة" : "بضاعة قرطاسية"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-gray-800">
                    {it.quantity}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-gray-800">
                    {formatNumber(it.unitPrice)} ج.س
                  </td>
                  <td className="py-3.5 px-4 text-left font-black text-gray-900">
                    {formatNumber(it.total)} ج.س
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pt-2">
          {/* Terms and notes */}
          <div className="max-w-md text-xs text-gray-500 space-y-1.5 border-r-2 border-[#2BA8A2] pr-3">
            <span className="font-bold text-gray-700 block">شروط وأحكام المطبعة:</span>
            <p className="leading-relaxed">
              {settings?.invoiceFooter ||
                "شكراً لتعاملكم معنا. المطبوعات المعتمدة لا تُرد ولا تُستبدل. يرجى مراجعة وتدقيق العمل عند الاستلام."}
            </p>
          </div>

          {/* Totals Table */}
          <div className="w-full sm:w-72 bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-2.5 text-xs">
            <div className="flex justify-between text-gray-600 font-medium">
              <span>المجموع الجزئي:</span>
              <span className="font-bold">{formatNumber(invoice.subtotal)} ج.س</span>
            </div>

            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-[#D45233] font-medium">
                <span>الخصم ({invoice.discountRate}%):</span>
                <span className="font-bold">
                  -{formatNumber(invoice.discountAmount)} ج.س
                </span>
              </div>
            )}

            <div className="flex justify-between text-sm font-black text-[#1E8C86] pt-2 border-t border-gray-200">
              <span>الإجمالي الكلي:</span>
              <span>{formatNumber(invoice.totalAmount)} ج.س</span>
            </div>

            <div className="flex justify-between text-emerald-700 font-bold pt-1">
              <span>المدفوع نقداً:</span>
              <span>{formatNumber(invoice.paidAmount)} ج.س</span>
            </div>

            <div className="flex justify-between text-rose-600 font-black pt-1 border-t border-dashed border-gray-300">
              <span>المتبقي ذمة:</span>
              <span>{formatNumber(remaining)} ج.س</span>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-[#F9FCFC]">
          <div className="bg-[#E8F6F5] px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-black text-[#1E8C86]">سجل المدفوعات</h3>
            <span className="text-[11px] font-bold text-gray-500">
              {paymentHistory.length} دفعة مسجلة
            </span>
          </div>

          {paymentHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-white text-gray-500 font-bold">
                  <tr>
                    <th className="py-3 px-4">التاريخ</th>
                    <th className="py-3 px-4">المبلغ</th>
                    <th className="py-3 px-4">الطريقة</th>
                    <th className="py-3 px-4">ملاحظات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paymentHistory.map((payment: any) => (
                    <tr key={payment.id}>
                      <td className="py-3 px-4 text-gray-600 font-mono">
                        {new Date(payment.createdAt).toLocaleString("en-GB")}
                      </td>
                      <td className="py-3 px-4 font-black text-emerald-700">
                        {new Intl.NumberFormat("en-US").format(Number(payment.amount))} ج.س
                      </td>
                      <td className="py-3 px-4 text-gray-700">
                        {payment.method === "CASH" ? "نقدي" : payment.method}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {payment.note || "دفعة تسجيلية"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5 text-center text-xs text-gray-500">
              لا توجد دفعات مسجلة حتى الآن في هذه الفاتورة.
            </div>
          )}
        </div>

        {/* Signatures & Stamp Area */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-12 border-t border-gray-200 text-center text-xs text-gray-600 font-bold">
          <div className="space-y-8">
            <span>توقيع المستلم / العميل</span>
            <div className="border-b border-dashed border-gray-400 w-36 mx-auto" />
          </div>

          <div className="space-y-8">
            <span>المحاسب المسؤول</span>
            <div className="border-b border-dashed border-gray-400 w-36 mx-auto" />
          </div>

          <div className="space-y-8 col-span-2 sm:col-span-1">
            <span>ختم واعتماد المطبعة</span>
            <div className="w-24 h-24 mx-auto border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center text-[10px] text-gray-400">
              الختم الرسمي
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
