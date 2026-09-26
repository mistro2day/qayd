"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  Truck,
  Plus,
  Search,
  Phone,
  User,
  CreditCard,
  Trash2,
  Edit2,
  X,
  Package,
  Layers,
  ArrowUpRight,
  TrendingDown,
  Building2,
} from "lucide-react";
import { getSuppliersList, saveSupplier, deleteSupplier } from "@/app/actions";

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [currency, setCurrency] = useState("ج.س");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [supplyType, setSupplyType] = useState("أوراق وزنك وأحبار");
  const [errorMsg, setErrorMsg] = useState("");

  const SUPPLY_TYPES = [
    "أوراق وزنك وأحبار",
    "صيانة قطع غيار وماكينات",
    "مواد تعبئة وتغليف وسلوفان",
    "قرطاسية وأدوات مكتبية",
    "خدمات شحن ولوجستيات",
    "وقود وكهرباء ومحروقات",
    "أخرى ومتنوعة",
  ];

  const loadData = async () => {
    setLoading(true);
    const res = await getSuppliersList();
    if (res.success) {
      setSuppliers(res.suppliers || []);
      if (res.currency) setCurrency(res.currency);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNewSupplierModal = () => {
    setEditingSupplier(null);
    setName("");
    setContactPerson("");
    setPhone("");
    setSupplyType(SUPPLY_TYPES[0]);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditSupplierModal = (sup: any) => {
    setEditingSupplier(sup);
    setName(sup.name);
    setContactPerson(sup.contactPerson || "");
    setPhone(sup.phone || "");
    setSupplyType(sup.supplyType || SUPPLY_TYPES[0]);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("يرجى إدخال اسم المورد أو الشركة");
      return;
    }
    if (!phone.trim()) {
      setErrorMsg("يرجى إدخال رقم الهاتف");
      return;
    }

    startTransition(async () => {
      const res = await saveSupplier({
        id: editingSupplier?.id,
        name: name.trim(),
        contactPerson: contactPerson.trim() || undefined,
        phone: phone.trim(),
        supplyType: supplyType.trim(),
      });

      if (res.success) {
        setIsModalOpen(false);
        loadData();
      } else {
        setErrorMsg(res.error || "حدث خطأ أثناء الحفظ");
      }
    });
  };

  const handleDelete = (sup: any) => {
    if (!confirm(`هل أنت متأكد من رغبتك في حذف المورد: "${sup.name}"؟`)) {
      return;
    }

    startTransition(async () => {
      const res = await deleteSupplier(sup.id);
      if (res.success) {
        loadData();
      } else {
        alert(res.error || "تعذر حذف المورد");
      }
    });
  };

  // KPI Calculations
  const totalSuppliers = suppliers.length;
  const totalSupplied = suppliers.reduce((sum, s) => sum + (s.totalSupplied || 0), 0);
  const totalExpenseBills = suppliers.reduce((sum, s) => sum + (s._count?.expenses || 0), 0);

  // Search filter
  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
      (s.supplyType && s.supplyType.toLowerCase().includes(q)) ||
      (s.phone && s.phone.includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-5 shadow-card-subtle border border-[#2BA8A2]/15">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#D45233] to-[#B83E22] text-white flex items-center justify-center shadow-sm">
            <Truck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#142826]">
              دليل وسجلات الموردين
            </h1>
            <p className="text-xs text-gray-500 font-semibold">
              إدارة موردي الورق، الأحبار، والصيانة مع الربط المباشر بالمخزون والمصروفات
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/inventory"
            className="btn-pill px-4 py-2.5 bg-[#E8F6F5] text-[#1E8C86] text-xs font-bold hover:bg-[#d5eeec] transition-all flex items-center gap-1.5"
          >
            <Package className="w-4 h-4" />
            <span>توريد مخزون</span>
          </Link>
          <button
            onClick={openNewSupplierModal}
            className="btn-pill px-5 py-2.5 bg-gradient-to-r from-[#D45233] to-[#B83E22] text-white text-xs font-black shadow-sm flex items-center gap-2 hover:brightness-105 transition-all"
          >
            <Plus className="w-4 h-4" />
            إضافة مورد جديد
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-card-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 block mb-1">
              إجمالي الموردين المسجلين
            </span>
            <span className="text-2xl font-black text-[#1E8C86] font-mono">
              {totalSuppliers} مورد
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#E8F6F5] flex items-center justify-center text-[#2BA8A2]">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-card-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 block mb-1">
              إجمالي المشتريات والتوريدات
            </span>
            <span className="text-2xl font-black text-[#D45233] font-mono">
              {new Intl.NumberFormat("en-US").format(totalSupplied)} {currency}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-[#D45233]">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-card-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 block mb-1">
              عدد سندات المشتريات والمصروفات
            </span>
            <span className="text-2xl font-black text-gray-900 font-mono">
              {totalExpenseBills} سند
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
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
            placeholder="بحث باسم المورد، الشخص المسؤول، أو نوع التوريد..."
            className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-gray-200 text-xs font-bold bg-[#FAFDFC] focus:outline-none focus:border-[#2BA8A2] transition-colors"
          />
        </div>

        <div className="text-xs text-gray-500 font-bold self-end sm:self-auto">
          عرض {filteredSuppliers.length} من أصل {totalSuppliers} مورد
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl shadow-card-subtle border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-bold text-gray-400 animate-pulse">
            جاري تحميل دليل الموردين...
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-3">
            <Truck className="w-12 h-12 mx-auto stroke-1 text-gray-300" />
            <p className="text-sm font-bold">لا يوجد موردين يطابقون معايير البحث.</p>
            <button
              onClick={openNewSupplierModal}
              className="btn-pill px-4 py-2 bg-[#FFF1EE] text-[#D45233] text-xs font-bold hover:bg-[#ffe3dc]"
            >
              + إضافة أول مورد
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#F4FAF9] text-gray-500 font-bold border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4">اسم المورد / الشركة</th>
                  <th className="py-3.5 px-4">الشخص المسؤول</th>
                  <th className="py-3.5 px-4">رقم الهاتف</th>
                  <th className="py-3.5 px-4">مجال / نوع التوريد</th>
                  <th className="py-3.5 px-4 text-center">سندات المصروفات</th>
                  <th className="py-3.5 px-4">إجمالي المنصرف له</th>
                  <th className="py-3.5 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredSuppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#FFF1EE] text-[#D45233] font-black flex items-center justify-center text-xs shrink-0">
                          {sup.name.slice(0, 1)}
                        </div>
                        <span className="font-bold text-[#142826]">{sup.name}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-gray-600 font-semibold">
                      {sup.contactPerson ? (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>{sup.contactPerson}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-gray-600" dir="ltr">
                      <div className="flex items-center justify-end gap-1.5">
                        <span>{sup.phone}</span>
                        <Phone className="w-3 h-3 text-gray-400" />
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#E8F6F5] text-[#1E8C86] border border-[#2BA8A2]/20">
                        {sup.supplyType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Link
                        href={`/expenses`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#FFF1EE] text-gray-700 hover:text-[#D45233] font-bold text-[11px] transition-colors"
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>{sup._count?.expenses || 0} سند</span>
                      </Link>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-black text-[#D45233]">
                      {new Intl.NumberFormat("en-US").format(sup.totalSupplied || 0)} {currency}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => openEditSupplierModal(sup)}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-[#1E8C86] hover:bg-[#E8F6F5] transition-colors"
                          title="تعديل المورد"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sup)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="حذف المورد"
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

      {/* Create / Edit Supplier Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border-4 border-[#D45233]/30 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#D45233] to-[#B83E22] text-white flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#142826]">
                    {editingSupplier ? "تعديل بيانات المورد" : "إضافة مورد جديد"}
                  </h3>
                  <p className="text-[11px] text-gray-500 font-semibold">
                    تسجيل معلومات المورد لربطها بسندات الصرف وتوريدات المخزن
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
                  اسم المورد أو شركة التوريد *
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مطبعة أو شركة النيل للورق والأحبار"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  الشخص المسؤول / جهة الاتصال (اختياري)
                </label>
                <input
                  type="text"
                  placeholder="مثال: الأستاذ عثمان"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
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
                  نوع / مجال التوريد *
                </label>
                <select
                  value={supplyType}
                  onChange={(e) => setSupplyType(e.target.value)}
                  className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"
                >
                  {SUPPLY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
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
                  className="btn-pill px-6 py-2.5 bg-gradient-to-r from-[#D45233] to-[#B83E22] text-white text-xs font-black shadow-sm hover:brightness-105 disabled:opacity-50"
                >
                  {isPending ? "جاري الحفظ..." : editingSupplier ? "حفظ التعديلات" : "إضافة المورد"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
