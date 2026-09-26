import { getContractById } from "../../actions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Printer, FileSignature, Phone, MapPin } from "lucide-react";
import PrintButton from "../../invoices/[id]/print-button";

export const dynamic = "force-dynamic";

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getContractById(id);

  if (!res.success || !res.contract) {
    notFound();
  }

  const { contract, settings } = res;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Actions Bar (Hidden when printing) */}
      <div className="flex items-center justify-between no-print bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <Link
          href="/contracts"
          className="btn-pill px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold"
        >
          <ArrowRight className="w-4 h-4" />
          العودة لقائمة العقود
        </Link>

        <div className="flex items-center gap-3">
          <PrintButton />
        </div>
      </div>

      {/* Official Printable Contract Sheet (A4 format) */}
      <div className="print-page bg-white p-10 sm:p-14 rounded-3xl shadow-card-subtle border border-gray-200 text-[#142826] space-y-8">
        {/* Contract Title & Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b-2 border-[#2BA8A2]">
          <div className="flex items-center gap-4 text-center sm:text-right">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={settings?.logoUrl || "/logo.svg"}
              alt={settings?.shopName || "شعار المطبعة"}
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-2xl border border-gray-100 p-1 bg-white shadow-sm shrink-0"
            />
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-[#1E8C86]">
                {settings?.shopName || "الخواض لخدمات الطباعة"}
              </h2>
              <p className="text-xs font-bold text-gray-500">
                إدارة التعاقدات والطباعة الدورية • هاتف: {settings?.phone || "0912345678"}
              </p>
            </div>
          </div>

          <div className="text-center sm:text-left space-y-1">
            <span className="text-xs font-bold text-gray-400 font-mono block">
              وثيقة عقد رقم: {contract.contractCode}
            </span>
            <div className="px-3 py-1 rounded-full bg-[#FFF8E7] border border-[#FFE47A] text-[#D45233] text-xs font-black inline-block">
              عقــد اتفــاق وتوريــد
            </div>
          </div>
        </div>

        {/* Preamble / Parties */}
        <div className="space-y-4 text-xs leading-relaxed text-gray-800">
          <p className="font-bold">
            إنه في يوم{" "}
            {new Date(contract.startDate).toLocaleDateString("en-GB", {
              weekday: "long",
            })}{" "}
            الموافق {new Date(contract.startDate).toLocaleDateString("en-GB")}, تم
            الاتفاق والتراضي بين كلٍ من:
          </p>

          <div className="p-4 rounded-2xl bg-[#F4FAF9] border border-[#2BA8A2]/20 space-y-2">
            <div>
              <span className="font-black text-[#1E8C86] ml-2">1. الطرف الأول:</span>
              <span>
                {settings?.shopName || "الخواض لخدمات الطباعة"} - ويمثلها في هذا العقد
                الإدارة العامة للمطبعة (هاتف: {settings?.phone || "0912345678"}).
              </span>
            </div>
            <div>
              <span className="font-black text-[#1E8C86] ml-2">2. الطرف الثاني:</span>
              <span>
                السيد/السادة: {contract.customer?.name}
                {contract.customer?.companyName
                  ? ` ممثلاً عن (${contract.customer.companyName})`
                  : ""}{" "}
                - (هاتف: {contract.customer?.phone}).
              </span>
            </div>
          </div>

          <p>
            لما كان الطرف الأول مطبعة متخصصة في خدمات التصميم والطباعة الديجيتال
            والأوفست والتجليد، وكان الطرف الثاني بحاجة إلى توريد مطبوعات بصورة دورية،
            فقد اتفق الطرفان على البنود والشروط التالية:
          </p>
        </div>

        {/* Contract Scope & Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs">
          <div>
            <span className="text-gray-400 font-bold block">موضوع الاتفاق:</span>
            <span className="font-bold text-gray-800">{contract.title}</span>
          </div>
          <div>
            <span className="text-gray-400 font-bold block">مدة وسريان العقد:</span>
            <span className="font-bold text-gray-800">
              من {new Date(contract.startDate).toLocaleDateString("en-GB")} إلى{" "}
              {new Date(contract.endDate).toLocaleDateString("en-GB")}
            </span>
          </div>
          <div>
            <span className="text-gray-400 font-bold block">دورة المحاسبة والفوترة:</span>
            <span className="font-bold text-[#1E8C86]">{contract.billingCycle}</span>
          </div>
        </div>

        {/* Committed Items Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-black text-[#1E8C86]">
            جدول المطبوعات والكميات الدورية المتفق على توريدها:
          </h3>
          <div className="border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#E8F6F5] text-[#1E8C86] font-black border-b border-gray-200">
                <tr>
                  <th className="py-2.5 px-3 w-12 text-center">#</th>
                  <th className="py-2.5 px-3">بيان المطبوعات والمواصفات الفنية</th>
                  <th className="py-2.5 px-3 w-28 text-center">الكمية الدورية</th>
                  <th className="py-2.5 px-3 w-32 text-center">سعر الوحدة</th>
                  <th className="py-2.5 px-3 w-36 text-left">إجمالي الدورة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contract.items.map((it: any, idx: number) => (
                  <tr key={it.id}>
                    <td className="py-3 px-3 text-center text-gray-400 font-bold">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 font-bold text-gray-800">
                      {it.description}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-gray-700">
                      {it.periodicQuantity}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-gray-700">
                      {new Intl.NumberFormat("en-US").format(it.unitPrice)} ج.س
                    </td>
                    <td className="py-3 px-3 text-left font-black text-[#1E8C86]">
                      {new Intl.NumberFormat("en-US").format(it.total)} ج.س
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Terms Section */}
        <div className="space-y-2 border-t border-gray-200 pt-4">
          <h3 className="text-xs font-black text-gray-800">الشروط والالتزامات العامة:</h3>
          <div className="text-xs leading-relaxed text-gray-700 whitespace-pre-line bg-[#FFF8E7]/40 p-4 rounded-2xl border border-[#FFE47A]">
            {contract.terms}
          </div>
        </div>

        {/* Total Value Summary */}
        <div className="flex justify-between items-center p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs">
          <span className="font-bold text-gray-700">
            إجمالي التكلفة المالية المقررة للدورة ({contract.billingCycle}):
          </span>
          <span className="text-lg font-black text-[#1E8C86]">
            {new Intl.NumberFormat("en-US").format(contract.totalValue)} ج.س
          </span>
        </div>

        {/* Bilateral Signatures & Stamp Zones */}
        <div className="pt-8 border-t-2 border-gray-200 grid grid-cols-2 gap-10 text-center text-xs">
          <div className="space-y-12">
            <div>
              <span className="font-black text-gray-800 block">
                توقيع الطرف الأول (المطبعة)
              </span>
              <span className="text-[11px] text-gray-500">
                عن / {settings?.shopName || "الخواض لخدمات الطباعة"}
              </span>
            </div>
            <div className="w-48 border-b-2 border-dashed border-gray-400 mx-auto" />
            <div className="w-24 h-24 mx-auto border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center text-[10px] text-gray-400">
              الختم الرسمي
            </div>
          </div>

          <div className="space-y-12">
            <div>
              <span className="font-black text-gray-800 block">
                توقيع الطرف الثاني (العميل المتعاقد)
              </span>
              <span className="text-[11px] text-gray-500">
                عن / {contract.customer?.name}
              </span>
            </div>
            <div className="w-48 border-b-2 border-dashed border-gray-400 mx-auto" />
            <div className="w-24 h-24 mx-auto border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center text-[10px] text-gray-400">
              ختم أو توقيع المفوض
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
