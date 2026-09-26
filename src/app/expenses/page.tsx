"use client";

import { useEffect, useState, useTransition } from "react";
import {
  TrendingDown,
  PlusCircle,
  Building2,
  Trash2,
  Calendar,
  Layers,
  Filter,
  ArrowDownRight,
  PieChart,
} from "lucide-react";
import { getExpenses, createExpense, deleteExpense } from "./../actions";

const EXPENSE_CATEGORIES = [
  "مواد خام وأوراق وزنك",
  "أحبار ومذيبات طباعة",
  "صيانة قطع غيار وماكينات",
  "إيجار المطبعة والمقر",
  "كهرباء ومياه ووقود مولدات",
  "نثريات وضيافة ونظافة",
  "نقل وتوصيل وشحن",
  "رواتب وأجور عاملين",
  "أخرى ومصروفات إدارية",
];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [totalExpenseAmount, setTotalExpenseAmount] = useState(0);
  const [currency, setCurrency] = useState("ج.س");
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  // Create Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [supplierId, setSupplierId] = useState("");
  const [expenseDate, setExpenseDate] = useState("");

  const loadData = async () => {
    setLoading(true);
    const res = await getExpenses();
    if (res.success) {
      setExpenses(res.expenses || []);
      setSuppliers(res.suppliers || []);
      setTotalExpenseAmount(res.totalExpenseAmount || 0);
      if (res.currency) setCurrency(res.currency);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateExpense = () => {
    if (amount <= 0 || !description.trim()) {
      alert("يرجى إدخال وصف ومبلغ المصروف");
      return;
    }

    startTransition(async () => {
      const res = await createExpense({
        category,
        description,
        amount,
        supplierId: supplierId || undefined,
        date: expenseDate || undefined,
      });

      if (res.success) {
        setIsModalOpen(false);
        setDescription("");
        setAmount(0);
        setSupplierId("");
        loadData();
      } else {
        alert("فشل تسجيل المصروف: " + res.error);
      }
    });
  };

  const handleDeleteExpense = (id: string, desc: string) => {
    if (confirm(`هل أنت متأكد من حذف سند المصروف: "${desc}"؟`)) {
      startTransition(async () => {
        const res = await deleteExpense(id);
        if (res.success) {
          loadData();
        } else {
          alert("فشل الحذف: " + res.error);
        }
      });
    }
  };

  const filteredExpenses =
    selectedCategory === "ALL"
      ? expenses
      : expenses.filter((e) => e.category === selectedCategory);

  const categoryTotals = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-5 shadow-card-subtle border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D45233] to-[#B83E22] text-white flex items-center justify-center shadow-sm">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#142826]">
              سندات المصروفات والمنصرفات التشغيلية
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              تسجيل وتصنيف تكاليف الإنتاج، شراء المواد الخام، الصيانة، والإيجارات
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setExpenseDate(new Date().toISOString().slice(0, 10));
            setIsModalOpen(true);
          }}
          className="btn-pill px-4 py-2.5 bg-gradient-to-r from-[#D45233] to-[#B83E22] text-white text-xs font-black shadow-sm flex items-center gap-2 hover:brightness-105"
        >
          <PlusCircle className="w-4 h-4" />
          تسجيل سند صرف جديد
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-card-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 block mb-1">
              إجمالي المصروفات المنصرفة
            </span>
            <span className="text-2xl font-black text-[#D45233] font-mono">
              {new Intl.NumberFormat("en-US").format(totalExpenseAmount)} {currency}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-[#D45233]">
            <ArrowDownRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-card-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 block mb-1">
              إجمالي عدد السندات
            </span>
            <span className="text-2xl font-black text-gray-900 font-mono">
              {expenses.length} سند
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#E8F6F5] flex items-center justify-center text-[#2BA8A2]">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-card-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 block mb-1">
              أعلى بند استهلاكاً
            </span>
            <span className="text-sm font-black text-[#1E8C86] truncate max-w-[180px] block">
              {(Object.entries(categoryTotals) as [string, number][]).sort(
                (a, b) => b[1] - a[1]
              )[0]?.[0] || "لا يوجد"}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <PieChart className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory("ALL")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
            selectedCategory === "ALL"
              ? "bg-[#1E8C86] text-white shadow-teal-glow"
              : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          الكل ({expenses.length})
        </button>
        {EXPENSE_CATEGORIES.map((cat) => {
          const count = expenses.filter((e) => e.category === cat).length;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                selectedCategory === cat
                  ? "bg-[#1E8C86] text-white shadow-teal-glow"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl shadow-card-subtle border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xs font-black text-gray-700 flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-[#D45233]" />
            جدول المصروفات والمنصرفات ({filteredExpenses.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#F4FAF9] text-gray-500 font-bold border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">التاريخ</th>
                <th className="py-3 px-4">التصنيف المحاسبي</th>
                <th className="py-3 px-4">بيان وتفاصيل المصروف</th>
                <th className="py-3 px-4">المورد / الجهة المستلمة</th>
                <th className="py-3 px-4">المبلغ المنصرف</th>
                <th className="py-3 px-4 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    لا توجد سندات مصروفات مسجلة ضمن هذا التصنيف.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/50">
                    <td className="py-3.5 px-4 font-mono text-gray-600">
                      {new Date(exp.date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FFF8E7] text-[#D45233] border border-[#FFE47A]">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-gray-800">
                      {exp.description}
                    </td>
                    <td className="py-3.5 px-4 text-gray-600">
                      {exp.supplier?.name || "—"}
                    </td>
                    <td className="py-3.5 px-4 font-black text-[#D45233] font-mono text-sm">
                      {new Intl.NumberFormat("en-US").format(exp.amount)} {currency}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDeleteExpense(exp.id, exp.description)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        title="حذف المصروف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border-4 border-[#D45233]/20 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2 border-b pb-3">
              <TrendingDown className="w-5 h-5 text-[#D45233]" />
              <h3 className="font-black text-sm text-[#142826]">
                تسجيل سند صرف / منصرفات تشغيلية
              </h3>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                بند وتصنيف المصروف
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                البيان وتفاصيل ما تم صرفه
              </label>
              <input
                type="text"
                placeholder="مثال: شراء أحبار رولاند وماسترات أوفست، أو صيانة ماكينة القص"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  المبلغ المنصرف ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full input-cream rounded-xl px-3 py-2 text-sm font-black font-mono text-[#D45233]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  تاريخ الصرف
                </label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                المورد المرتبط (اختياري)
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
              >
                <option value="">-- بدون مورد مباشر --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.supplyType})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn-pill px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold"
              >
                إلغاء
              </button>

              <button
                type="button"
                disabled={isPending || amount <= 0 || !description}
                onClick={handleCreateExpense}
                className="btn-pill px-6 py-2.5 bg-gradient-to-r from-[#D45233] to-[#B83E22] text-white text-xs font-black shadow-sm hover:brightness-105 disabled:opacity-50"
              >
                تسجيل السند
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
