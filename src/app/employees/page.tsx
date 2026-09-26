"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Users,
  Briefcase,
  DollarSign,
  UserPlus,
  PlusCircle,
  Clock,
  Phone,
  Trash2,
  Calendar,
  CheckCircle2,
  History,
  FileText,
} from "lucide-react";
import {
  getEmployeesAndSalaries,
  saveEmployee,
  deleteEmployee,
  recordSalaryPayment,
} from "./../actions";

const PAY_TYPES = [
  { key: "MONTHLY", label: "راتب شهري ثابـت" },
  { key: "WEEKLY", label: "أجر أسبوعي" },
  { key: "DAILY", label: "يومية (أجر يومي)" },
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [salaryHistory, setSalaryHistory] = useState<any[]>([]);
  const [currency, setCurrency] = useState("ج.س");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [payingSalaryFor, setPayingSalaryFor] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payPeriod, setPayPeriod] = useState<string>("");
  const [payNotes, setPayNotes] = useState<string>("");

  const loadData = async () => {
    setLoading(true);
    const res = await getEmployeesAndSalaries();
    if (res.success) {
      setEmployees(res.employees || []);
      setSalaryHistory(res.salaryTransactions || []);
      if (res.currency) setCurrency(res.currency);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveEmployee = (empData: any) => {
    startTransition(async () => {
      const res = await saveEmployee(empData);
      if (res.success) {
        setEditingEmployee(null);
        loadData();
      } else {
        alert("فشل الحفظ: " + res.error);
      }
    });
  };

  const handleDeleteEmployee = (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف الموظف (${name}) وكل سجلاته؟`)) {
      startTransition(async () => {
        const res = await deleteEmployee(id);
        if (res.success) {
          loadData();
        } else {
          alert("فشل الحذف: " + res.error);
        }
      });
    }
  };

  const handlePaySalary = () => {
    if (!payingSalaryFor || payAmount <= 0) return;
    startTransition(async () => {
      const res = await recordSalaryPayment({
        employeeId: payingSalaryFor.id,
        amountPaid: payAmount,
        payPeriod: payPeriod || new Date().toISOString().slice(0, 7),
        notes: payNotes,
      });

      if (res.success) {
        setPayingSalaryFor(null);
        setPayAmount(0);
        setPayNotes("");
        loadData();
      } else {
        alert("فشل تسجيل سند الصرف: " + res.error);
      }
    });
  };

  // Open salary modal
  const openPaySalary = (emp: any) => {
    setPayingSalaryFor(emp);
    setPayAmount(emp.baseRate || 0);
    const date = new Date();
    const defaultPeriod =
      emp.payType === "MONTHLY"
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        : `${new Date().toLocaleDateString("en-GB")}`;
    setPayPeriod(defaultPeriod);
    setPayNotes("");
  };

  const totalMonthlyPayroll = employees
    .filter((e) => e.status === "ACTIVE" && e.payType === "MONTHLY")
    .reduce((acc, e) => acc + e.baseRate, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-5 shadow-card-subtle border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2BA8A2] to-[#1E8C86] text-white flex items-center justify-center shadow-teal-glow">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#142826]">
              الموظفين وإدارة الرواتب والأجور
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              متابعة طاقم المطبعة، الرواتب الشهرية واليوميات، وسندات صرف المستحقات
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setEditingEmployee({
              name: "",
              jobTitle: "فني طباعة",
              payType: "MONTHLY",
              baseRate: 0,
              phone: "",
              status: "ACTIVE",
            })
          }
          className="btn-pill px-4 py-2.5 bg-gradient-to-r from-[#2BA8A2] to-[#1E8C86] text-white text-xs font-black shadow-teal-glow flex items-center gap-2 hover:brightness-105"
        >
          <UserPlus className="w-4 h-4" />
          إضافة موظف / فني جديد
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-card-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 block mb-1">
              إجمالي الكادر النشط
            </span>
            <span className="text-2xl font-black text-[#1E8C86]">
              {employees.filter((e) => e.status === "ACTIVE").length} موظف
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#E8F6F5] flex items-center justify-center text-[#2BA8A2]">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-card-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 block mb-1">
              فاتورة الرواتب الشهرية الثابتة
            </span>
            <span className="text-2xl font-black text-gray-900">
              {new Intl.NumberFormat("en-US").format(totalMonthlyPayroll)} {currency}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-card-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 block mb-1">
              عدد سندات الصرف المسجلة
            </span>
            <span className="text-2xl font-black text-[#D45233]">
              {salaryHistory.length} سند
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-[#D45233]">
            <History className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Employees Grid / Table */}
      <div className="bg-white rounded-2xl shadow-card-subtle border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xs font-black text-gray-700 flex items-center gap-2">
            <Users className="w-4 h-4 text-[#2BA8A2]" />
            طاقم العمل والرواتب التعاقدية
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#F4FAF9] text-gray-500 font-bold border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">اسم الموظف</th>
                <th className="py-3 px-4">المسمى الوظيفي</th>
                <th className="py-3 px-4">نوع الأجر</th>
                <th className="py-3 px-4">المعدل التعاقدي</th>
                <th className="py-3 px-4">رقم الهاتف</th>
                <th className="py-3 px-4">المهام الموكلة</th>
                <th className="py-3 px-4 text-center">صرف الراتب / أجر</th>
                <th className="py-3 px-4 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    لم تتم إضافة موظفين بعد. اضغط على "إضافة موظف" للبدء.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const payTypeObj = PAY_TYPES.find((p) => p.key === emp.payType);
                  return (
                    <tr key={emp.id} className="hover:bg-[#F9FCFC] transition-colors">
                      <td className="py-3.5 px-4 font-black text-[#142826]">
                        {emp.name}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-gray-700">
                        {emp.jobTitle}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#E8F6F5] text-[#1E8C86] border border-[#2BA8A2]/20">
                          {payTypeObj?.label || emp.payType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-gray-900 font-mono">
                        {new Intl.NumberFormat("en-US").format(emp.baseRate)} {currency}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-600">
                        {emp.phone || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">
                        {emp._count?.tasks || 0} مهمة تشغيل
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => openPaySalary(emp)}
                          className="btn-pill px-3 py-1.5 bg-[#FFF8E7] hover:bg-[#FFE47A] text-[#1E4D48] text-xs font-black border border-[#FFE47A] shadow-sm inline-flex items-center gap-1.5"
                        >
                          <DollarSign className="w-3.5 h-3.5 text-[#2BA8A2]" />
                          صرف مستحق
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingEmployee(emp)}
                            className="p-1.5 text-gray-400 hover:text-[#2BA8A2]"
                            title="تعديل"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                            className="p-1.5 text-gray-400 hover:text-red-600"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Disbursement History */}
      <div className="bg-white rounded-2xl shadow-card-subtle border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xs font-black text-gray-700 flex items-center gap-2">
            <History className="w-4 h-4 text-[#D45233]" />
            سجل سندات صرف الرواتب والأجور الأخيرة
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#F4FAF9] text-gray-500 font-bold border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">تاريخ الصرف</th>
                <th className="py-3 px-4">الموظف المستلم</th>
                <th className="py-3 px-4">الفترة / الشهر</th>
                <th className="py-3 px-4">المبلغ المنصرف</th>
                <th className="py-3 px-4">ملاحظات وسند الصرف</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {salaryHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    لا توجد سندات صرف رواتب مسجلة حتى الآن.
                  </td>
                </tr>
              ) : (
                salaryHistory.map((trx) => (
                  <tr key={trx.id} className="hover:bg-gray-50/50">
                    <td className="py-3.5 px-4 font-mono text-gray-600">
                      {new Date(trx.paidAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-3.5 px-4 font-black text-gray-900">
                      {trx.employee?.name}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#1E8C86]">
                      {trx.payPeriod}
                    </td>
                    <td className="py-3.5 px-4 font-black text-emerald-700 font-mono text-sm">
                      {new Intl.NumberFormat("en-US").format(trx.amountPaid)} {currency}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">
                      {trx.notes || "صرف راتب دوري مسجل تلقائياً بالمصروفات"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: PAY SALARY */}
      {payingSalaryFor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border-4 border-[#2BA8A2]/30 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2 border-b pb-3">
              <DollarSign className="w-5 h-5 text-[#2BA8A2]" />
              <h3 className="font-black text-sm text-[#142826]">
                سند صرف راتب / مستحقات مالية
              </h3>
            </div>

            <div className="p-3 rounded-2xl bg-[#E8F6F5] text-xs space-y-1">
              <span className="text-gray-500 font-bold block">المستفيد:</span>
              <span className="text-sm font-black text-[#1E8C86] block">
                {payingSalaryFor.name} ({payingSalaryFor.jobTitle})
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                المبلغ المراد صرفه ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={payAmount}
                onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                className="w-full input-cream rounded-xl px-3 py-2 text-sm font-black font-mono text-emerald-700"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                الفترة أو الشهر المحاسبي
              </label>
              <input
                type="text"
                placeholder="مثال: شهر 2026-09 أو أسبوع 38"
                value={payPeriod}
                onChange={(e) => setPayPeriod(e.target.value)}
                className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                ملاحظات الصرف (حوافز، بدلات، خصومات)
              </label>
              <textarea
                rows={2}
                placeholder="ملاحظات توثيقية إضافية..."
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="w-full input-cream rounded-xl p-3 text-xs"
              />
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800">
              * سيتم إدراج هذا المبلغ تلقائياً في دفتر المصروفات والتقارير المالية تحت بند
              (رواتب وأجور عاملين).
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-gray-100">
              <button
                type="button"
                onClick={() => setPayingSalaryFor(null)}
                className="btn-pill px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold"
              >
                إلغاء
              </button>

              <button
                type="button"
                disabled={isPending || payAmount <= 0}
                onClick={handlePaySalary}
                className="btn-pill px-6 py-2.5 bg-gradient-to-r from-[#2BA8A2] to-[#1E8C86] text-white text-xs font-black shadow-teal-glow hover:brightness-105 disabled:opacity-50"
              >
                تأكيد صرف الراتب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT EMPLOYEE */}
      {editingEmployee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border-4 border-[#2BA8A2]/30 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2 border-b pb-3">
              <UserPlus className="w-5 h-5 text-[#2BA8A2]" />
              <h3 className="font-black text-sm text-[#142826]">
                {editingEmployee.id ? "تعديل بيانات الموظف" : "إضافة موظف / فني جديد"}
              </h3>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                اسم الموظف بالكامل
              </label>
              <input
                type="text"
                placeholder="محمد عثمان أحمد"
                value={editingEmployee.name}
                onChange={(e) =>
                  setEditingEmployee({ ...editingEmployee, name: e.target.value })
                }
                className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                المسمى الوظيفي
              </label>
              <input
                type="text"
                placeholder="فني ماكينة أوفست / مصمم / مسؤول تشطيب"
                value={editingEmployee.jobTitle}
                onChange={(e) =>
                  setEditingEmployee({ ...editingEmployee, jobTitle: e.target.value })
                }
                className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  نظام الأجر
                </label>
                <select
                  value={editingEmployee.payType}
                  onChange={(e) =>
                    setEditingEmployee({ ...editingEmployee, payType: e.target.value })
                  }
                  className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
                >
                  {PAY_TYPES.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  المبلغ التعاقدي ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  value={editingEmployee.baseRate}
                  onChange={(e) =>
                    setEditingEmployee({
                      ...editingEmployee,
                      baseRate: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full input-cream rounded-xl px-3 py-2 text-xs font-black font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                رقم هاتف الموظف
              </label>
              <input
                type="text"
                dir="ltr"
                placeholder="09XXXXXXXX"
                value={editingEmployee.phone || ""}
                onChange={(e) =>
                  setEditingEmployee({ ...editingEmployee, phone: e.target.value })
                }
                className="w-full input-cream rounded-xl px-3 py-2 text-xs font-mono font-bold"
              />
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditingEmployee(null)}
                className="btn-pill px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold"
              >
                إلغاء
              </button>

              <button
                type="button"
                disabled={isPending || !editingEmployee.name}
                onClick={() => handleSaveEmployee(editingEmployee)}
                className="btn-pill px-6 py-2.5 bg-gradient-to-r from-[#2BA8A2] to-[#1E8C86] text-white text-xs font-black shadow-teal-glow hover:brightness-105 disabled:opacity-50"
              >
                حفظ بيانات الموظف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
