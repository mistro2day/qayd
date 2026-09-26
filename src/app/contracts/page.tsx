"use client";

import { useEffect, useState, useTransition } from "react";
import {
  FileSignature,
  Plus,
  Search,
  Printer,
  Calendar,
  User,
  Sparkles,
  CheckCircle2,
  Trash2,
  X,
  FileText,
} from "lucide-react";
import { getContracts, createContract } from "./../actions";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [nextCode, setNextCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10)
  );
  const [billingCycle, setBillingCycle] = useState("شهري");
  const [terms, setTerms] = useState("");
  const [notes, setNotes] = useState("");

  // Items
  const [items, setItems] = useState<
    { description: string; periodicQuantity: number; unitPrice: number; total: number }[]
  >([
    {
      description: "توريد مطبوعات دورية وأكياس ورقية مطبوعة",
      periodicQuantity: 10,
      unitPrice: 15000,
      total: 150000,
    },
  ]);

  const loadData = async () => {
    setLoading(true);
    const res = await getContracts();
    if (res.success) {
      setContracts(res.contracts || []);
      setCustomers(res.customers || []);
      setSettings(res.settings || null);
      setNextCode(res.nextCode || `KHW-CNT-${Date.now()}`);
      if (!terms && res.settings?.defaultContractTerms) {
        setTerms(res.settings.defaultContractTerms);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { description: "", periodicQuantity: 1, unitPrice: 0, total: 0 },
    ]);
  };

  const updateItem = (
    index: number,
    field: "description" | "periodicQuantity" | "unitPrice",
    val: any
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index] };
      if (field === "description") target.description = val;
      if (field === "periodicQuantity") target.periodicQuantity = Math.max(1, parseInt(val) || 1);
      if (field === "unitPrice") target.unitPrice = Math.max(0, parseFloat(val) || 0);
      target.total = target.periodicQuantity * target.unitPrice;
      updated[index] = target;
      return updated;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalValue = items.reduce((acc, it) => acc + it.total, 0);

  const handleCreateContract = () => {
    if (!selectedCustomerId) {
      alert("يرجى اختيار العميل أو الجهة أولاً");
      return;
    }
    if (!title.trim()) {
      alert("يرجى كتابة عنوان أو موضوع العقد");
      return;
    }
    if (items.length === 0) {
      alert("يرجى إضافة بند دوري واحد على الأقل");
      return;
    }

    startTransition(async () => {
      const res = await createContract({
        contractCode: nextCode,
        customerId: selectedCustomerId,
        title,
        startDate,
        endDate,
        billingCycle,
        totalValue,
        terms: terms || settings?.defaultContractTerms || "",
        notes: notes || undefined,
        items,
      });

      if (res.success && res.contractId) {
        setIsModalOpen(false);
        router.push(`/contracts/${res.contractId}`);
      } else {
        alert("فشل في حفظ العقد: " + res.error);
      }
    });
  };

  const filteredContracts = contracts.filter((c) => {
    if (
      searchQuery &&
      !c.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.contractCode.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.customer?.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-5 shadow-card-subtle border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2BA8A2] to-[#1E8C86] text-white flex items-center justify-center shadow-teal-glow">
            <FileSignature className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#142826]">
              إدارة العقود والاشتراكات الدورية
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              عقود توريد المطبوعات للمدارس، الشركات، المطاعم، والمنظمات
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (customers[0]) setSelectedCustomerId(customers[0].id);
            if (!terms && settings?.defaultContractTerms) {
              setTerms(settings.defaultContractTerms);
            }
            setIsModalOpen(true);
          }}
          className="btn-pill px-5 py-2.5 bg-gradient-to-r from-[#2BA8A2] to-[#1E8C86] text-white text-sm font-black shadow-teal-glow hover:brightness-110"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          تحرير عقد جديد
        </button>
      </div>

      {/* Contracts Table */}
      <div className="bg-white rounded-2xl p-5 shadow-card-subtle border border-gray-100">
        <div className="overflow-x-hidden">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold">
                <th className="py-3 px-2 whitespace-nowrap">رقم العقد</th>
                <th className="py-3 px-2 whitespace-nowrap">موضوع العقد</th>
                <th className="py-3 px-2 whitespace-nowrap">العميل / الجهة</th>
                <th className="py-3 px-2 whitespace-nowrap">الدورة</th>
                <th className="py-3 px-2 whitespace-nowrap">القيمة الإجمالية</th>
                <th className="py-3 px-2 whitespace-nowrap">تاريخ البداية</th>
                <th className="py-3 px-2 whitespace-nowrap">تاريخ الانتهاء</th>
                <th className="py-3 px-2 whitespace-nowrap text-center">الحالة</th>
                <th className="py-3 px-2 whitespace-nowrap text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredContracts.length > 0 ? (
                filteredContracts.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F4FAF9] transition-colors">
                    <td className="py-3.5 px-3 font-mono font-bold text-[#1E8C86] whitespace-nowrap min-w-[150px]">
                      {c.contractCode}
                    </td>
                    <td className="py-3.5 px-3 font-bold text-gray-900 min-w-[220px]">{c.title}</td>
                    <td className="py-3.5 px-3 font-medium text-gray-700">
                      {c.customer?.name}
                      {c.customer?.companyName ? ` (${c.customer.companyName})` : ""}
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold text-[11px]">
                        {c.billingCycle}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-black text-[#1E8C86]">
                      {new Intl.NumberFormat("en-US").format(c.totalValue)} ج.س
                    </td>
                    <td className="py-3.5 px-3 text-gray-500">
                      {new Date(c.startDate).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-3.5 px-3 text-gray-500">
                      {new Date(c.endDate).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-3.5 px-2 text-center whitespace-nowrap">
                      <div className="flex justify-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {c.status === "ACTIVE" ? "ساري المفعول" : c.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-center whitespace-nowrap">
                      <div className="flex justify-center">
                        <Link
                          href={`/contracts/${c.id}`}
                          className="btn-pill px-3 py-1 bg-[#E8F6F5] hover:bg-[#2BA8A2] hover:text-white text-[#1E8C86] text-xs font-bold transition-all"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          عرض وطباعة
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    لا توجد عقود مسجلة حتى الآن.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE CONTRACT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl border-4 border-[#2BA8A2]/30 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-[#2BA8A2] to-[#1E8C86] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSignature className="w-6 h-6 text-[#FFD23F]" />
                <h3 className="text-lg font-black">
                  تحرير عقد توريد مطبوعات دوري • {nextCode}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    العميل / المؤسسة المتعاقدة *
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"
                  >
                    <option value="">(اختر العميل)</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.companyName ? `(${c.companyName})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    عنوان أو موضوع العقد *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: توريد أكياس ودفاتر مطبوعة دورية"
                    className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    دورة الفوترة
                  </label>
                  <select
                    value={billingCycle}
                    onChange={(e) => setBillingCycle(e.target.value)}
                    className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="شهري">شهري</option>
                    <option value="ربع سنوي">ربع سنوي (3 أشهر)</option>
                    <option value="نصف سنوي">نصف سنوي (6 أشهر)</option>
                    <option value="سنوي">سنوي</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    تاريخ بدء السريان
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    تاريخ انتهاء السريان
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-2 border border-gray-200 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1E8C86]">
                    بنود ومطبوعات التوريد الدورية المتفق عليها:
                  </span>
                  <button
                    type="button"
                    onClick={addItem}
                    className="btn-pill px-3 py-1 bg-[#FFF8E7] text-[#1E4D48] text-xs font-bold border border-[#FFE47A]"
                  >
                    + إضافة بند
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2.5 rounded-xl border border-gray-100"
                    >
                      <div className="col-span-5">
                        <input
                          type="text"
                          value={it.description}
                          placeholder="وصف المطبوعات أو الخدمة الدورية..."
                          onChange={(e) => updateItem(idx, "description", e.target.value)}
                          className="w-full input-cream rounded-lg px-2.5 py-1 text-xs font-bold"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          value={it.periodicQuantity}
                          onChange={(e) =>
                            updateItem(idx, "periodicQuantity", e.target.value)
                          }
                          className="w-full input-cream rounded-lg px-2 py-1 text-xs text-center font-bold"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          value={it.unitPrice}
                          onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                          className="w-full input-cream rounded-lg px-2 py-1 text-xs text-center font-bold"
                        />
                      </div>
                      <div className="col-span-2 text-xs font-black text-[#1E8C86]">
                        {new Intl.NumberFormat("en-US").format(it.total)} ج.س
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="text-gray-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Terms and conditions */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  شروط وبنود العقد:
                </label>
                <textarea
                  rows={4}
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full input-cream rounded-xl p-3 text-xs leading-relaxed font-medium"
                />
              </div>

              {/* Total Card */}
              <div className="p-3 bg-[#E8F6F5] rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E8C86]">
                  إجمالي قيمة العقد الدورية:
                </span>
                <span className="text-lg font-black text-[#1E8C86]">
                  {new Intl.NumberFormat("en-US").format(totalValue)} ج.س
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn-pill px-4 py-2 bg-gray-200 text-gray-700 text-xs font-bold"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleCreateContract}
                disabled={isPending}
                className="btn-pill px-6 py-2.5 bg-gradient-to-r from-[#2BA8A2] to-[#1E8C86] text-white text-xs font-black shadow-teal-glow hover:brightness-110"
              >
                اعتماد وحفظ العقد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
