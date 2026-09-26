"use client";

import { Suspense, useEffect, useState, useTransition } from "react";
import {
  Receipt,
  Plus,
  Search,
  Printer,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  User,
  Phone,
  Flame,
  Package,
  Layers,
  X,
  Contact2,
} from "lucide-react";
import {
  getInvoices,
  getPosCatalog,
  createInvoice,
  getInvoiceById,
  updateInvoice,
  addInvoicePayment,
  deleteInvoice,
} from "./../actions";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function InvoicesPage() {
  const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-bold text-gray-400">جاري تحميل الفواتير...</div>}>
      <InvoicesContent />
    </Suspense>
  );
}

function InvoicesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openNewByDefault = searchParams.get("new") === "1";

  const [invoices, setInvoices] = useState<any[]>([]);
  const [catalog, setCatalog] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(openNewByDefault);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isPending, startTransition] = useTransition();
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);
  const [invoiceCode, setInvoiceCode] = useState("");
  const [paymentInvoice, setPaymentInvoice] = useState<any | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const formatNumber = (value: number) => new Intl.NumberFormat("en-US").format(value);

  // New Invoice Form State
  const [activeTab, setActiveTab] = useState<"PRINT" | "RETAIL">("PRINT");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [assignedEmployeeId, setAssignedEmployeeId] = useState("");
  const [createTasks, setCreateTasks] = useState(true);

  // Cart Items
  const [items, setItems] = useState<
    {
      productId?: string;
      itemType: "PRINT" | "RETAIL";
      description: string;
      quantity: number;
      unitPrice: number;
      minPriceFloor: number;
      total: number;
    }[]
  >([]);

  // Payment
  const [discountRate, setDiscountRate] = useState(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [priceWarning, setPriceWarning] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const [invRes, catRes] = await Promise.all([getInvoices(), getPosCatalog()]);
    if (invRes.success) setInvoices(invRes.invoices || []);
    if (catRes.success) setCatalog(catRes);
    setLoading(false);
  };

  const openEditInvoice = async (invoiceId: string) => {
    const res = await getInvoiceById(invoiceId);
    if (!res.success || !res.invoice) {
      alert("تعذر تحميل الفاتورة للتعديل");
      return;
    }

    const invoice = res.invoice;
    setIsEditMode(true);
    setEditingInvoiceId(invoice.id);
    setInvoiceCode(invoice.invoiceCode || "");
    setIsModalOpen(true);
    setClientName(invoice.clientName || "");
    setClientPhone(invoice.clientPhone || "");
    setSelectedCustomerId(invoice.customerId || "");
    setDiscountRate(invoice.discountRate || 0);
    setPaidAmount(invoice.paidAmount || 0);
    setItems(
      (invoice.items || []).map((it: any) => ({
        productId: it.productId || undefined,
        itemType: it.itemType,
        description: it.description,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        minPriceFloor: it.itemType === "PRINT" ? 0 : it.product?.minNegotiablePrice || 0,
        total: it.total,
      }))
    );
    setPriority("NORMAL");
    setActiveTab((invoice.items || []).some((it: any) => it.itemType === "PRINT") ? "PRINT" : "RETAIL");
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const invoiceId = searchParams.get("edit");
    if (invoiceId) {
      void openEditInvoice(invoiceId);
    }
  }, [searchParams]);

  // Add Item from Pricing Matrix (Print)
  const addPrintService = (tier: any) => {
    setItems((prev) => [
      ...prev,
      {
        itemType: "PRINT",
        description: tier.itemName,
        quantity: 1,
        unitPrice: tier.officialPrice,
        minPriceFloor: tier.minNegotiablePrice,
        total: tier.officialPrice,
      },
    ]);
  };

  // Add Item from Retail Product
  const addRetailProduct = (prod: any) => {
    if (prod.stockQuantity <= 0) {
      alert("عذراً، هذا الصنف نفد من المخزون تماماً!");
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        productId: prod.id,
        itemType: "RETAIL",
        description: prod.name,
        quantity: 1,
        unitPrice: prod.sellingPrice,
        minPriceFloor: prod.minNegotiablePrice,
        total: prod.sellingPrice,
      },
    ]);
  };

  // Update item quantity or unit price with cashier floor check
  const updateItem = (index: number, field: "quantity" | "unitPrice", val: number) => {
    setItems((prev) => {
      const updated = [...prev];
      const target = { ...updated[index] };

      if (field === "quantity") {
        target.quantity = Math.max(1, val);
      } else if (field === "unitPrice") {
        target.unitPrice = Math.max(0, val);
      }
      target.total = target.quantity * target.unitPrice;
      updated[index] = target;

      // Check minimum negotiation price floor
      let warning: string | null = null;
      for (const it of updated) {
        if (it.minPriceFloor && it.unitPrice < it.minPriceFloor) {
          warning = `تنبيه أمان مالي: السعر المدخل للبند (${it.description}) أقل من الحد الأدنى المسموح به للمفاوضة (${new Intl.NumberFormat("en-US").format(it.minPriceFloor)} ج.س)!`;
          break;
        }
      }
      setPriceWarning(warning);

      return updated;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subtotal = items.reduce((acc, it) => acc + it.total, 0);
  const discountAmount = (subtotal * discountRate) / 100;
  const totalAmount = Math.max(0, subtotal - discountAmount);

  // Submit Invoice
  const handleDeleteInvoice = async (invoiceId: string, invoiceCode: string) => {
    if (!confirm(`هل تريد حذف الفاتورة ${invoiceCode}؟`)) return;

    const res = await deleteInvoice(invoiceId);
    if (res.success) {
      setInvoices((prev) => prev.filter((invoice) => invoice.id !== invoiceId));
      alert("تم حذف الفاتورة بنجاح");
    } else {
      alert("فشل في حذف الفاتورة: " + res.error);
    }
  };

  const handlePaymentSubmit = async () => {
    if (!paymentInvoice) return;

    const amount = Number(paymentAmount) || 0;
    if (amount <= 0) {
      alert("يرجى إدخال مبلغ دفعة أكبر من صفر");
      return;
    }

    const res = await addInvoicePayment({
      invoiceId: paymentInvoice.id,
      amount,
    });

    if (res.success) {
      setPaymentInvoice(null);
      setPaymentAmount(0);
      await loadData();
      alert("تم تسجيل دفعة جديدة بنجاح");
    } else {
      alert("فشل في تسجيل الدفعة: " + res.error);
    }
  };

  const handleSubmitInvoice = () => {
    if (!clientName.trim()) {
      alert("يرجى كتابة اسم العميل أولاً");
      return;
    }
    if (items.length === 0) {
      alert("يرجى إضافة بند واحد على الأقل إلى الفاتورة");
      return;
    }
    if (priceWarning) {
      const confirmOverride = confirm(
        `${priceWarning}\n\nهل ترغب في تجاوز الحد الأدنى باعتماد الإدارة والمتابعة؟`
      );
      if (!confirmOverride) return;
    }

    startTransition(async () => {
      const payload = {
        invoiceCode: isEditMode ? invoiceCode || `KHW-INV-${Date.now()}` : catalog?.nextCode || `KHW-INV-${Date.now()}`,
        customerId: selectedCustomerId || undefined,
        clientName,
        clientPhone: clientPhone || undefined,
        subtotal,
        discountRate,
        discountAmount,
        taxRate: 0,
        taxAmount: 0,
        totalAmount,
        paidAmount: Number(paidAmount) || 0,
        items,
      };

      const res = isEditMode && editingInvoiceId
        ? await updateInvoice({
            id: editingInvoiceId,
            ...payload,
          })
        : await createInvoice({
            invoiceCode: payload.invoiceCode,
            customerId: payload.customerId,
            clientName: payload.clientName,
            clientPhone: payload.clientPhone,
            subtotal: payload.subtotal,
            discountRate: payload.discountRate,
            discountAmount: payload.discountAmount,
            taxRate: payload.taxRate,
            taxAmount: payload.taxAmount,
            totalAmount: payload.totalAmount,
            paidAmount: payload.paidAmount,
            items: payload.items,
            createProductionTasks: createTasks,
            assignedEmployeeId: assignedEmployeeId || undefined,
            priority,
          });

      if (res.success && (res.invoiceId || isEditMode)) {
        setIsModalOpen(false);
        setIsEditMode(false);
        setEditingInvoiceId(null);
        if (isEditMode && editingInvoiceId) {
          router.push(`/invoices/${editingInvoiceId}`);
        } else if (res.invoiceId) {
          router.push(`/invoices/${res.invoiceId}`);
        }
      } else {
        alert("حدث خطأ أثناء حفظ الفاتورة: " + res.error);
      }
    });
  };

  // Filter Invoices List
  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter !== "ALL" && inv.status !== statusFilter) return false;
    if (
      searchQuery &&
      !inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !inv.invoiceCode.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-5 shadow-card-subtle border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2BA8A2] to-[#1E8C86] text-white flex items-center justify-center shadow-teal-glow">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#142826]">
              نظام الفواتير ونقاط البيع السريعة (POS)
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              إصدار فواتير المطبوعات، بيع القرطاسية بالخصم المخزني الفوري، وسندات القبض
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/customers"
            className="btn-pill px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Contact2 className="w-4 h-4 text-[#2BA8A2]" />
            <span>دليل العملاء</span>
          </Link>
          <button
            onClick={() => {
              setIsEditMode(false);
              setEditingInvoiceId(null);
              setInvoiceCode(catalog?.nextCode || `KHW-INV-${Date.now()}`);
              setIsModalOpen(true);
              setPaidAmount(0);
            }}
            className="btn-pill px-5 py-2.5 bg-gradient-to-r from-[#FFD23F] to-[#FFE47A] text-[#1E4D48] text-sm font-black shadow-gold-glow border border-[#E6B800]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            فاتورة جديدة (POS)
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="بحث برقم الفاتورة أو اسم العميل..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-4 py-2 bg-[#F4FAF9] rounded-full text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2BA8A2]/30"
          />
        </div>

        <div className="flex items-center gap-1.5 self-stretch sm:self-auto overflow-x-auto">
          {["ALL", "PAID", "PARTIAL", "UNPAID"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                statusFilter === st
                  ? "bg-[#2BA8A2] text-white shadow-teal-glow"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              {st === "ALL"
                ? "الكل"
                : st === "PAID"
                ? "خالصة"
                : st === "PARTIAL"
                ? "سداد جزئي"
                : "غير مسددة"}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-2xl p-5 shadow-card-subtle border border-gray-100">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold">
                <th className="py-3 px-3">كود الفاتورة</th>
                <th className="py-3 px-3">العميل</th>
                <th className="py-3 px-3">الهاتف</th>
                <th className="py-3 px-3">الإجمالي</th>
                <th className="py-3 px-3">المدفوع</th>
                <th className="py-3 px-3">المتبقي</th>
                <th className="py-3 px-3">الحالة</th>
                <th className="py-3 px-3">التاريخ</th>
                <th className="py-3 px-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => {
                  const remaining = inv.totalAmount - inv.paidAmount;
                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-[#F4FAF9] transition-colors cursor-pointer"
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest("select, button, a, input, textarea")) return;
                        router.push(`/invoices/${inv.id}`);
                      }}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-[#1E8C86]">
                        {inv.invoiceCode}
                      </td>
                      <td className="py-3 px-3 font-bold text-gray-800">
                        {inv.clientName}
                      </td>
                      <td className="py-3 px-3 text-gray-500 font-mono">
                        {inv.clientPhone || "-"}
                      </td>
                      <td className="py-3 px-3 font-black text-gray-900">
                        {formatNumber(inv.totalAmount)} ج.س
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-600">
                        {formatNumber(inv.paidAmount)} ج.س
                      </td>
                      <td className="py-3 px-3 font-bold text-rose-500">
                        {remaining > 0 ? `${formatNumber(remaining)} ج.س` : "0"}
                      </td>
                      <td className="py-3 px-3">
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
                      <td className="py-3 px-3 text-gray-400">
                        {new Date(inv.createdAt).toLocaleDateString("en-GB")}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <select
                            value=""
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const action = e.target.value;
                              if (!action) return;

                              if (action === "edit") {
                                void openEditInvoice(inv.id);
                              } else if (action === "delete") {
                                void handleDeleteInvoice(inv.id, inv.invoiceCode);
                              } else if (action === "payment") {
                                setPaymentInvoice(inv);
                                setPaymentAmount(Math.max(0, inv.totalAmount - inv.paidAmount));
                              }

                              e.target.value = "";
                            }}
                            className="rounded-xl border border-gray-200 bg-white px-2 py-1 text-[10px] font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#2BA8A2]/30"
                            aria-label={`إجراءات الفاتورة ${inv.invoiceCode}`}
                          >
                            <option value="">إجراءات</option>
                            <option value="payment">إضافة دفعة</option>
                            <option value="edit">تعديل</option>
                            <option value="delete">حذف</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    لا توجد فواتير تطابق معايير البحث.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-3">
          {filteredInvoices.map((inv) => (
            <div
              key={inv.id}
              className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-2.5 cursor-pointer"
              onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest("select, button, a, input, textarea")) return;
                router.push(`/invoices/${inv.id}`);
              }}
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
                <span className="text-gray-900 font-black">
                  {formatNumber(inv.totalAmount)} ج.س
                </span>
              </div>
              <div className="pt-2 flex items-center justify-between border-t border-gray-200 text-xs">
                <span className="text-gray-400 text-[10px]">
                  {new Date(inv.createdAt).toLocaleDateString("en-GB")}
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value=""
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const action = e.target.value;
                      if (!action) return;

                      if (action === "edit") {
                        void openEditInvoice(inv.id);
                      } else if (action === "delete") {
                        void handleDeleteInvoice(inv.id, inv.invoiceCode);
                      } else if (action === "payment") {
                        setPaymentInvoice(inv);
                        setPaymentAmount(Math.max(0, inv.totalAmount - inv.paidAmount));
                      }

                      e.target.value = "";
                    }}
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-[10px] font-bold text-gray-700"
                  >
                    <option value="">إجراءات</option>
                    <option value="payment">إضافة دفعة</option>
                    <option value="edit">تعديل</option>
                    <option value="delete">حذف</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {paymentInvoice && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border-4 border-[#2BA8A2]/30 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-sm text-[#142826]">إضافة دفعة للفاتورة</h3>
                <p className="text-[11px] font-bold text-gray-500">{paymentInvoice.invoiceCode}</p>
              </div>
              <button
                onClick={() => {
                  setPaymentInvoice(null);
                  setPaymentAmount(0);
                }}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-2 rounded-2xl bg-[#E8F6F5] p-4 border border-[#B7E4E1]">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>إجمالي الفاتورة</span>
                <span className="font-black text-[#142826]">{new Intl.NumberFormat("en-US").format(paymentInvoice.totalAmount)} ج.س</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>المدفوع سابقاً</span>
                <span className="font-black text-[#1E8C86]">{new Intl.NumberFormat("en-US").format(paymentInvoice.paidAmount)} ج.س</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>المتبقي</span>
                <span className="font-black text-[#D45233]">{new Intl.NumberFormat("en-US").format(Math.max(0, paymentInvoice.totalAmount - paymentInvoice.paidAmount))} ج.س</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">مبلغ الدفعة الجديدة</label>
              <input
                type="number"
                min="1"
                max={Math.max(0, paymentInvoice.totalAmount - paymentInvoice.paidAmount)}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Math.max(0, Number(e.target.value) || 0))}
                className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setPaymentInvoice(null);
                  setPaymentAmount(0);
                }}
                className="btn-pill px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={() => void handlePaymentSubmit()}
                disabled={paymentAmount <= 0}
                className="btn-pill px-6 py-2.5 bg-gradient-to-r from-[#2BA8A2] to-[#1E8C86] text-white text-xs font-black shadow-teal-glow disabled:opacity-50"
              >
                حفظ الدفعة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAST POS MODAL (Flip7 Dual-Tab Styling) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border-4 border-[#2BA8A2]/30 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-[#2BA8A2] to-[#1E8C86] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-6 h-6 text-[#FFD23F]" />
                <div>
                  <h2 className="text-lg sm:text-xl font-black">
                    نقطة البيع السريعة • إصدار فاتورة جديدة
                  </h2>
                  <span className="text-xs text-[#FFF8E7] font-mono">
                    الكود: {isEditMode ? invoiceCode : (catalog?.nextCode || "-")}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setIsEditMode(false);
                  setEditingInvoiceId(null);
                }}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Customer Info Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#EFF8F7] p-4 rounded-2xl border border-[#2BA8A2]/20">
                <div>
                  <label className="text-xs font-bold text-[#1E8C86] block mb-1">
                    اسم العميل أو الجهة *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="مثال: شركة النيلين / أ. محمد أحمد"
                    className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#1E8C86] block mb-1">
                    رقم الهاتف / واتساب
                  </label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="09XXXXXXXX"
                    className="w-full input-cream rounded-xl px-3 py-2 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#1E8C86] block mb-1">
                    عميل مسجل مسبقاً (اختياري)
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => {
                      setSelectedCustomerId(e.target.value);
                      const found = catalog?.customers?.find(
                        (c: any) => c.id === e.target.value
                      );
                      if (found) {
                        setClientName(found.name);
                        setClientPhone(found.phone);
                      }
                    }}
                    className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold cursor-pointer"
                  >
                    <option value="">(عميل نقدي جديد)</option>
                    {catalog?.customers?.map((cust: any) => (
                      <option key={cust.id} value={cust.id}>
                        {cust.name} {cust.companyName ? `(${cust.companyName})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dual-Tab Selector (Custom Print vs. Retail Stationery) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                  <button
                    onClick={() => setActiveTab("PRINT")}
                    className={`btn-pill px-4 py-2 text-xs font-black transition-all ${
                      activeTab === "PRINT"
                        ? "bg-[#2BA8A2] text-white shadow-teal-glow"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    🎨 1. مصفوفة خدمات المطبوعات المخصصة
                  </button>
                  <button
                    onClick={() => setActiveTab("RETAIL")}
                    className={`btn-pill px-4 py-2 text-xs font-black transition-all ${
                      activeTab === "RETAIL"
                        ? "bg-[#FFD23F] text-[#1E4D48] shadow-gold-glow"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    📦 2. مبيعات القرطاسية والمستلزمات الجاهزة
                  </button>
                </div>

                {/* Tab 1: Pricing Matrix */}
                {activeTab === "PRINT" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
                    {catalog?.pricingTiers?.map((tier: any) => (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => addPrintService(tier)}
                        className="p-2.5 rounded-xl bg-white border border-[#2BA8A2]/30 hover:border-[#2BA8A2] hover:bg-[#E8F6F5] text-right shadow-sm transition-all group"
                      >
                        <span className="text-[11px] font-bold text-[#142826] block line-clamp-1">
                          {tier.itemName}
                        </span>
                        <div className="flex items-center justify-between mt-1 text-[10px]">
                          <span className="text-gray-400">{tier.unit}</span>
                          <span className="font-black text-[#1E8C86]">
                            {formatNumber(tier.officialPrice)} ج.س
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Tab 2: Retail Products */}
                {activeTab === "RETAIL" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-48 overflow-y-auto p-1">
                    {catalog?.products?.map((prod: any) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => addRetailProduct(prod)}
                        className="p-2.5 rounded-xl bg-white border border-[#FFD23F]/40 hover:border-[#FFD23F] hover:bg-[#FFF8E7] text-right shadow-sm transition-all group"
                      >
                        <span className="text-[11px] font-bold text-[#142826] block line-clamp-1">
                          {prod.name}
                        </span>
                        <div className="flex items-center justify-between mt-1 text-[10px]">
                          <span className="text-gray-400">مخزون: {prod.stockQuantity}</span>
                          <span className="font-black text-[#D45233]">
                            {formatNumber(prod.sellingPrice)} ج.س
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Warning Alert Banner (Cashier Margin Control) */}
              {priceWarning && (
                <div className="p-3 rounded-xl bg-[#FDF0EC] border-2 border-[#EF6C4A] text-[#D45233] text-xs font-bold flex items-center gap-2 animate-bounce">
                  <AlertTriangle className="w-5 h-5 shrink-0 text-[#EF6C4A]" />
                  <span>{priceWarning}</span>
                </div>
              )}

              {/* Items in Cart Table */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#F4FAF9] border-b border-gray-200 text-[#1E8C86] font-bold">
                    <tr>
                      <th className="py-2.5 px-3">النوع</th>
                      <th className="py-2.5 px-3">الوصف والبيان</th>
                      <th className="py-2.5 px-3 w-20">الكمية</th>
                      <th className="py-2.5 px-3 w-28">سعر الوحدة</th>
                      <th className="py-2.5 px-3 w-28">الإجمالي</th>
                      <th className="py-2.5 px-3 w-10 text-center">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.length > 0 ? (
                      items.map((it, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/80">
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                it.itemType === "PRINT"
                                  ? "bg-[#E8F6F5] text-[#1E8C86]"
                                  : "bg-[#FFF8E7] text-[#D45233]"
                              }`}
                            >
                              {it.itemType === "PRINT" ? "مطبوعات" : "قرطاسية"}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={it.description}
                              onChange={(e) => {
                                const updated = [...items];
                                updated[idx].description = e.target.value;
                                setItems(updated);
                              }}
                              className="w-full bg-transparent font-bold focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="1"
                              value={it.quantity}
                              onChange={(e) =>
                                updateItem(idx, "quantity", parseInt(e.target.value) || 1)
                              }
                              className="w-16 input-cream rounded-lg px-2 py-1 text-center font-bold"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              value={it.unitPrice}
                              onChange={(e) =>
                                updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)
                              }
                              className={`w-24 input-cream rounded-lg px-2 py-1 text-center font-bold ${
                                it.minPriceFloor && it.unitPrice < it.minPriceFloor
                                  ? "border-[#EF6C4A] text-[#EF6C4A] bg-[#FDF0EC]"
                                  : ""
                              }`}
                            />
                          </td>
                          <td className="py-2 px-3 font-black text-gray-900">
                            {formatNumber(it.total)} ج.س
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeItem(idx)}
                              className="text-gray-400 hover:text-[#EF6C4A] transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400 font-medium">
                          سلة الفاتورة فارغة. اختر بنوداً من القوائم أعلاه.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Production Automation Options */}
              <div className="p-4 rounded-2xl bg-[#E8F6F5]/60 border border-[#2BA8A2]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#1E8C86]">
                  <input
                    type="checkbox"
                    checked={createTasks}
                    onChange={(e) => setCreateTasks(e.target.checked)}
                    className="w-4 h-4 accent-[#2BA8A2] rounded cursor-pointer"
                  />
                  <span>إنشاء مهام خط التشغيل آلياً (تصميم 🎨 ➔ طباعة 🖨️ ➔ تشطيب ✂️ ➔ تسليم 📦)</span>
                </label>

                <div className="flex items-center gap-3">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="input-cream rounded-xl px-3 py-1.5 text-xs font-bold"
                  >
                    <option value="NORMAL">أولوية عادية</option>
                    <option value="URGENT">🔥 طلب عاجل جداً</option>
                  </select>

                  <select
                    value={assignedEmployeeId}
                    onChange={(e) => setAssignedEmployeeId(e.target.value)}
                    className="input-cream rounded-xl px-3 py-1.5 text-xs font-bold"
                  >
                    <option value="">(تعيين فني لاحقاً)</option>
                    {catalog?.employees?.map((emp: any) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Financial Calculation Totals */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-200">
                <div>
                  <span className="text-xs text-gray-500 font-bold block mb-1">المجموع الجزئي:</span>
                  <span className="text-lg font-black text-gray-800">
                    {formatNumber(subtotal)} ج.س
                  </span>
                </div>

                <div>
                  <span className="text-xs text-gray-500 font-bold block mb-1">نسبة الخصم (%):</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountRate}
                    onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
                    className="w-24 input-cream rounded-xl px-3 py-1 text-xs font-bold"
                  />
                </div>

                <div>
                  <span className="text-xs text-[#2BA8A2] font-black block mb-1">المبلغ المطلوب:</span>
                  <span className="text-xl font-black text-[#1E8C86]">
                    {formatNumber(totalAmount)} ج.س
                  </span>
                </div>

                <div>
                  <span className="text-xs text-[#27AE60] font-black block mb-1">المدفوع نقداً الآن:</span>
                  <input
                    type="number"
                    min="0"
                    max={totalAmount}
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-full input-cream rounded-xl px-3 py-1 text-sm font-bold text-emerald-700"
                  />
                  <button
                    type="button"
                    onClick={() => setPaidAmount(totalAmount)}
                    className="text-[10px] text-[#2BA8A2] font-bold hover:underline mt-1 block"
                  >
                    سداد كامل المبلغ
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn-pill px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleSubmitInvoice}
                disabled={isPending}
                className="btn-pill px-8 py-3 bg-gradient-to-r from-[#2BA8A2] to-[#1E8C86] text-white text-sm font-black shadow-teal-glow hover:brightness-110"
              >
                <CheckCircle2 className="w-5 h-5" />
                حفظ وإصدار الفاتورة الفورية
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
