"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Contact2,
  Plus,
  Search,
  Phone,
  Building,
  FileText,
  Receipt,
  FileSignature,
  Trash2,
  Edit2,
  X,
  CreditCard,
  UserCheck,
  TrendingUp,
} from "lucide-react";
import { getCustomersList, saveCustomer, deleteCustomer } from "@/app/actions";

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [currency, setCurrency] = useState("ج.س");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    const res = await getCustomersList();
    if (res.success) {
      setCustomers(res.customers || []);
      if (res.currency) setCurrency(res.currency);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewCustomerModal = () => {
    setEditingCustomer(null);
    setName("");
    setCompanyName("");
    setPhone("");
    setTaxNumber("");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditCustomerModal = (customer: any) => {
    setEditingCustomer(customer);
    setName(customer.name);
    setCompanyName(customer.companyName || "");
    setPhone(customer.phone || "");
    setTaxNumber(customer.taxNumber || "");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("يرجى إدخال اسم العميل");
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("يرجى إدخال رقم الهاتف");
      return;
    }

    startTransition(async () => {
      const res = await saveCustomer({
        id: editingCustomer?.id,
        name: name.trim(),
        companyName: companyName.trim() || undefined,
        phone: phone.trim(),
        taxNumber: taxNumber.trim() || undefined,
      });

      if (res.success) {
        setIsModalOpen(false);
        loadData();
      } else {
        setErrorMsg(res.error || "حدث خطأ أثناء الحفظ");
      }
    });
  };

  const handleDelete = (customer: any) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف العميل: "${customer.name}"؟`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteCustomer(customer.id);
      if (res.success) {
        loadData();
      } else {
        alert(res.error || "تعذر حذف العميل");
      }
    });
  };

  // KPI Calculations
  const totalCustomers = customers.length;
  const totalInvoiced = customers.reduce((sum, c) => sum + (c.totalInvoiced || 0), 0);
  const totalOutstanding = customers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);

  // Search filter
  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.companyName && c.companyName.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-5 shadow-card-subtle border border-[#2BA8A2]/15">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#2BA8A2] to-[#1E8C86] text-white flex items-center justify-center shadow-teal-glow">
            <Contact2 className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#142826]">
              دليل وحسابات العملاء
            </h1>
            <p className="text-xs text-gray-500 font-semibold">
              إدارة بيانات العملاء والجهات، متابعة إجمالي المسحوبات، الفواتير، والأرصدة المستحقة
            </p>
          </div>
        </div>

        <button
          onClick={openNewCustomerModal}
          className="btn-pill px-5 py-2.5 bg-gradient-to-r from-[#2BA8A2] to-[#1E8C86] text-white text-xs font-black shadow-teal-glow flex items-center gap-2 hover:brightness-105 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          إضافة عميل جديد
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-card-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 block mb-1">
              إجمالي العملاء المسجلين
            </span>
            <span className="text-2xl font-black text-[#1E8C86] font-mono">
              {totalCustomers} عميل
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#E8F6F5] flex items-center justify-center text-[#2BA8A2]">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-card-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 block mb-1">
              إجمالي قيمة المبيعات للعملاء
            </span>
            <span className="text-2xl font-black text-gray-900 font-mono">
              {new Intl.NumberFormat("en-US").format(totalInvoiced)} {currency}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-card-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 block mb-1">
              إجمالي المديونيات والمستحقات
            </span>
            <span className="text-2xl font-black text-[#D45233] font-mono">
              {new Intl.NumberFormat("en-US").format(totalOutstanding)} {currency}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-[#D45233]">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-card-subtle border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم، اسم الشركة، أو رقم الهاتف..."
            className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-gray-200 text-xs font-bold bg-[#FAFDFC] focus:outline-none focus:border-[#2BA8A2] transition-colors"
          />
        </div>

        <div className="text-xs text-gray-500 font-bold self-end sm:self-auto">
          عرض {filteredCustomers.length} من أصل {totalCustomers} عميل
        </div>
      </div>

      {/* Customers Table / Grid */}
      <div className="bg-white rounded-2xl shadow-card-subtle border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-gray-400 animate-pulse">
            جاري تحميل دليل العملاء...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-3">
            <Contact2 className="w-12 h-12 mx-auto stroke-1 text-gray-300" />
            <p className="text-sm font-bold">لا يوجد عملاء يطابقون معايير البحث.</p>
            <button
              onClick={openNewCustomerModal}
              className="btn-pill px-4 py-2 bg-[#E8F6F5] text-[#1E8C86] text-xs font-bold hover:bg-[#d8f0ee]"
            >
              + إضافة أول عميل
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#F4FAF9] text-gray-500 font-bold border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4">اسم العميل / الجهة</th>
                  <th className="py-3.5 px-4">رقم الهاتف / واتساب</th>
                  <th className="py-3.5 px-4 text-center">الفواتير</th>
                  <th className="py-3.5 px-4 text-center">العقود</th>
                  <th className="py-3.5 px-4">إجمالي المسحوبات</th>
                  <th className="py-3.5 px-4">الرصيد المتبقي</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#E8F6F5] text-[#1E8C86] font-black flex items-center justify-center text-xs shrink-0">
                          {cust.name.slice(0, 1)}
                        </div>
                        <div>
                          <span className="font-bold text-[#142826] block">{cust.name}</span>
                          {cust.companyName && (
                            <span className="text-[11px] text-gray-500 flex items-center gap-1">
                              <Building className="w-3 h-3 text-gray-400" />
                              {cust.companyName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-gray-600" dir="ltr">
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{cust.phone}</span>
                        <Phone className="w-3 h-3 text-gray-400" />
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Link
                        href={`/invoices?search=${encodeURIComponent(cust.name)}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#E8F6F5] text-gray-700 hover:text-[#1E8C86] font-bold text-[11px] transition-colors"
                      >
                        <Receipt className="w-3 h-3" />
                        <span>{cust._count?.invoices || 0}</span>
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Link
                        href={`/contracts?search=${encodeURIComponent(cust.name)}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#E8F6F5] text-gray-700 hover:text-[#1E8C86] font-bold text-[11px] transition-colors"
                      >
                        <FileSignature className="w-3 h-3" />
                        <span>{cust._count?.contracts || 0}</span>
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-black text-gray-800">
                      {new Intl.NumberFormat("en-US").format(cust.totalInvoiced || 0)} {currency}
                    </td>

                    <td className="py-3.5 px-4 font-mono">
                      {cust.outstandingBalance > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-[#D45233] border border-rose-200">
                          {new Intl.NumberFormat("en-US").format(cust.outstandingBalance)} {currency}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700">
                          خالص (0)
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditCustomerModal(cust)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-[#1E8C86] hover:bg-[#E8F6F5] transition-colors"
                          title="تعديل العميل"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cust)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="حذف العميل"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border-4 border-[#2BA8A2]/30 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2BA8A2] to-[#1E8C86] text-white flex items-center justify-center">
                  <Contact2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#142826]">
                    {editingCustomer ? "تعديل بيانات العميل" : "إضافة عميل جديد"}
                  </h3>
                  <p className="text-[11px] text-gray-500 font-semibold">
                    تسجيل معلومات التواصل وحساب العميل في النظام
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  اسم العميل أو الشخص المسؤول *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: محمد أحمد علي"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  اسم الشركة / المنظمة (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="مثال: شركة النيلين للخدمات"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  رقم الهاتف / واتساب *
                </label>
                <input
                  type="text"
                  required
                  placeholder="09XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full input-cream rounded-xl px-3 py-2 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  الرقم الضريبي / السجل (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="مثال: 123456789"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  className="w-full input-cream rounded-xl px-3 py-2 text-xs font-mono font-bold"
                />
              </div>

              <div className="pt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-pill px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-pill px-6 py-2.5 bg-gradient-to-r from-[#2BA8A2] to-[#1E8C86] text-white text-xs font-black shadow-teal-glow hover:brightness-105 disabled:opacity-50"
                >
                  {isPending ? "جاري الحفظ..." : editingCustomer ? "حفظ التعديلات" : "إضافة العميل"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
