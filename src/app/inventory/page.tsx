"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ArrowDownToLine,
  TrendingDown,
  Layers,
  Sparkles,
  CheckCircle2,
  X,
  CreditCard,
  MoveRight,
  MoveLeft,
  RefreshCw,
} from "lucide-react";
import {
  getCurrentUser,
  getInventory,
  getInventoryMovements,
  restockProduct,
  createProduct,
  issueProductStock,
  returnProductStock,
  adjustProductStock,
} from "./../actions";
import { getEffectivePermissions } from "@/lib/permissions";

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [allMovements, setAllMovements] = useState<any[]>([]);
  const [sessionUser, setSessionUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [movementFilter, setMovementFilter] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  // Modals
  const [restockItem, setRestockItem] = useState<any | null>(null);
  const [addedQty, setAddedQty] = useState(10);
  const [costPrice, setCostPrice] = useState(0);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [recordExpense, setRecordExpense] = useState(true);

  // Stock movement modal
  const [stockAction, setStockAction] = useState<"issue" | "return" | "adjust" | null>(null);
  const [stockTarget, setStockTarget] = useState<any | null>(null);
  const [stockQty, setStockQty] = useState(1);
  const [stockReason, setStockReason] = useState("");

  // New Product Modal
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [newSku, setNewSku] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("ورق وطباعة");
  const [newCustomCategory, setNewCustomCategory] = useState("");
  const [categoryMode, setCategoryMode] = useState<"existing" | "custom">("existing");
  const [newUnit, setNewUnit] = useState("باكت");
  const [newCost, setNewCost] = useState(0);
  const [newSelling, setNewSelling] = useState(0);
  const [newMinFloor, setNewMinFloor] = useState(0);
  const [newInitialStock, setNewInitialStock] = useState(0);
  const [newAlertMin, setNewAlertMin] = useState(5);

  const loadData = async () => {
    setLoading(true);
    const [inventoryRes, movementRes] = await Promise.all([
      getInventory(),
      getInventoryMovements(undefined, 50),
    ]);

    if (inventoryRes.success) {
      setProducts(inventoryRes.products || []);
      setSuppliers(inventoryRes.suppliers || []);
      setSettings(inventoryRes.settings || null);
      setMovements(inventoryRes.movements || []);
    }

    if (movementRes.success) {
      setAllMovements(movementRes.movements || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
    void getCurrentUser().then((user) => setSessionUser(user));
  }, []);

  const openRestock = (prod: any) => {
    setRestockItem(prod);
    setCostPrice(prod.costPrice);
    setAddedQty(10);
    setSelectedSupplierId(suppliers[0]?.id || "");
    setRecordExpense(true);
  };

  const handleConfirmRestock = () => {
    if (!restockItem) return;
    startTransition(async () => {
      const res = await restockProduct({
        productId: restockItem.id,
        addedQuantity: Number(addedQty) || 1,
        costPrice: Number(costPrice) || restockItem.costPrice,
        supplierId: selectedSupplierId || undefined,
        createExpenseRecord: recordExpense,
      });

      if (res.success) {
        setRestockItem(null);
        loadData();
      } else {
        const message = "error" in res ? res.error : "فشل في تحديث المخزون";
        alert("فشل في تحديث المخزون: " + message);
      }
    });
  };

  const openStockAction = (action: "issue" | "return" | "adjust", product: any) => {
    setStockAction(action);
    setStockTarget(product);
    setStockQty(1);
    setStockReason("");
  };

  const handleStockAction = () => {
    if (!stockTarget || !stockAction) return;

    startTransition(async () => {
      let res: any;
      if (stockAction === "issue") {
        res = await issueProductStock({
          productId: stockTarget.id,
          quantity: Number(stockQty) || 1,
          reason: stockReason || "صرف مخزون يدوي",
          referenceType: "MANUAL",
        });
      } else if (stockAction === "return") {
        res = await returnProductStock({
          productId: stockTarget.id,
          quantity: Number(stockQty) || 1,
          reason: stockReason || "إرجاع مخزون",
          referenceType: "MANUAL",
        });
      } else {
        res = await adjustProductStock({
          productId: stockTarget.id,
          quantityDelta: Number(stockQty) || 0,
          reason: stockReason || "تعديل مخزون يدوي",
          referenceType: "MANUAL",
        });
      }

      if (res.success) {
        setStockAction(null);
        setStockTarget(null);
        loadData();
      } else {
        alert("فشل في حركة المخزون: " + (res.error || "حدث خطأ غير متوقع"));
      }
    });
  };

  const handleCreateProduct = () => {
    if (!newName || !newSku) {
      alert("يرجى ملء اسم الصنف وكود SKU");
      return;
    }

    const finalCategory = categoryMode === "custom"
      ? (newCustomCategory || newCategory).trim()
      : newCategory.trim();

    if (!finalCategory) {
      alert("يرجى اختيار تصنيف أو إدخال تصنيف جديد");
      return;
    }

    startTransition(async () => {
      const res = await createProduct({
        sku: newSku,
        name: newName,
        category: finalCategory,
        unit: newUnit,
        costPrice: Number(newCost) || 0,
        sellingPrice: Number(newSelling) || 0,
        minNegotiablePrice: Number(newMinFloor) || 0,
        stockQuantity: Number(newInitialStock) || 0,
        minStockAlert: Number(newAlertMin) || 5,
      });

      if (res.success) {
        setIsNewProductOpen(false);
        loadData();
      } else {
        alert("فشل في إضافة المنتج: " + res.error);
      }
    });
  };

  // Calculations
  const totalStockValue = products.reduce(
    (acc, p) => acc + p.stockQuantity * p.costPrice,
    0
  );
  const lowStockCount = products.filter(
    (p) => p.stockQuantity <= p.minStockAlert
  ).length;

  const categories = Array.from(new Set(products.map((p) => p.category)));
  const categoryOptions = Array.from(
    new Set([
      ...categories,
      "ورق وطباعة",
      "أحبار",
      "تجليد",
      "مستلزمات مكتب",
      "ملصقات",
      "خدمات طباعة",
    ])
  );
  const canIssueStock = sessionUser ? (getEffectivePermissions(sessionUser).actions.stockIssue ?? false) : false;
  const canReturnStock = sessionUser ? (getEffectivePermissions(sessionUser).actions.stockReturn ?? false) : false;
  const canAdjustStock = sessionUser ? (getEffectivePermissions(sessionUser).actions.stockAdjust ?? false) : false;

  const filteredMovements = allMovements.filter((movement) => {
    if (movementFilter !== "ALL" && movement.type !== movementFilter) return false;
    return true;
  });

  const filteredProducts = products.filter((p) => {
    if (categoryFilter !== "ALL" && p.category !== categoryFilter) return false;
    if (
      searchQuery &&
      !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.sku.toLowerCase().includes(searchQuery.toLowerCase())
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
            <Package className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#142826]">
              إدارة مخزون الورق ومبيعات القرطاسية
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              متابعة كميات بكرات وبكتات الورق، الأحبار، مستلزمات التجليد، والتوريد
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setNewSku(`PRD-${Date.now().toString().slice(-4)}`);
            setIsNewProductOpen(true);
          }}
          className="btn-pill px-5 py-2.5 bg-gradient-to-r from-[#2BA8A2] to-[#1E8C86] text-white text-sm font-black shadow-teal-glow hover:brightness-110"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          إضافة صنف مخزني جديد
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-card-subtle border-r-4 border-r-[#2BA8A2] border border-gray-100">
          <span className="text-xs font-bold text-[#1E8C86] block mb-1">
            إجمالي عدد الأصناف المسجلة
          </span>
          <span className="text-2xl font-black text-[#142826]">{products.length} صنف</span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-card-subtle border-r-4 border-r-[#FFD23F] border border-gray-100">
          <span className="text-xs font-bold text-[#D45233] block mb-1">
            القيمة التقديرية للمخزون (بسعر التكلفة)
          </span>
          <span className="text-2xl font-black text-[#142826]">
            {new Intl.NumberFormat("en-US").format(totalStockValue)} ج.س
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-card-subtle border-r-4 border-r-[#EF6C4A] border border-gray-100">
          <span className="text-xs font-bold text-[#EF6C4A] block mb-1">
            أصناف أوشكت على النفاد
          </span>
          <span className="text-2xl font-black text-[#EF6C4A]">
            {lowStockCount} أصناف حرجة
          </span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="بحث باسم الصنف أو رمز SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-9 pl-4 py-2 bg-[#F4FAF9] rounded-full text-xs font-bold text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2BA8A2]/30"
          />
        </div>

        <div className="flex items-center gap-1.5 self-stretch sm:self-auto overflow-x-auto">
          <button
            onClick={() => setCategoryFilter("ALL")}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              categoryFilter === "ALL"
                ? "bg-[#2BA8A2] text-white shadow-teal-glow"
                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
            }`}
          >
            جميع التصنيفات
          </button>
          {categories.map((cat: any) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                categoryFilter === cat
                  ? "bg-[#2BA8A2] text-white shadow-teal-glow"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl p-5 shadow-card-subtle border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold">
                <th className="py-3 px-3">كود الصنف (SKU)</th>
                <th className="py-3 px-3">اسم الصنف والمواصفات</th>
                <th className="py-3 px-3">التصنيف</th>
                <th className="py-3 px-3">الوحدة</th>
                <th className="py-3 px-3">سعر التكلفة</th>
                <th className="py-3 px-3">سعر البيع</th>
                <th className="py-3 px-3">حد التفاوض</th>
                <th className="py-3 px-3">الكمية الحالية</th>
                <th className="py-3 px-3 text-center">الحركات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => {
                  const isLow = p.stockQuantity <= p.minStockAlert;
                  const isOut = p.stockQuantity <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-[#F4FAF9] transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-[#1E8C86]">
                        {p.sku}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-gray-900">{p.name}</td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium text-[11px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-gray-500">{p.unit}</td>
                      <td className="py-3.5 px-3 font-bold text-gray-700">
                        {new Intl.NumberFormat("en-US").format(p.costPrice)} ج.س
                      </td>
                      <td className="py-3.5 px-3 font-black text-[#1E8C86]">
                        {new Intl.NumberFormat("en-US").format(p.sellingPrice)} ج.س
                      </td>
                      <td className="py-3.5 px-3 font-medium text-amber-700">
                        {new Intl.NumberFormat("en-US").format(p.minNegotiablePrice)} ج.س
                      </td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-black ${
                            isOut
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : isLow
                              ? "bg-[#FFF8E7] text-[#D45233] border border-[#FFE47A]"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {p.stockQuantity} {p.unit}
                          {isOut ? " (نافد)" : isLow ? " (منخفض)" : ""}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          <button
                            onClick={() => openRestock(p)}
                            className="btn-pill px-2.5 py-1 bg-[#FFF8E7] hover:bg-[#FFE47A] text-[#1E4D48] text-[10px] font-bold border border-[#E2D9C3] shadow-sm"
                          >
                            <ArrowDownToLine className="w-3 h-3 text-[#D45233]" />
                            توريد
                          </button>
                          {canIssueStock && (
                            <button
                              onClick={() => openStockAction("issue", p)}
                              className="btn-pill px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold border border-rose-200"
                            >
                              <MoveRight className="w-3 h-3" />
                              صرف
                            </button>
                          )}
                          {canReturnStock && (
                            <button
                              onClick={() => openStockAction("return", p)}
                              className="btn-pill px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200"
                            >
                              <MoveLeft className="w-3 h-3" />
                              إرجاع
                            </button>
                          )}
                          {canAdjustStock && (
                            <button
                              onClick={() => openStockAction("adjust", p)}
                              className="btn-pill px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 text-[10px] font-bold border border-sky-200"
                            >
                              <RefreshCw className="w-3 h-3" />
                              تعديل
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    لا توجد أصناف تطابق معايير البحث.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-card-subtle border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#2BA8A2]" />
            <h2 className="text-sm font-black text-[#142826]">آخر الحركات في المخزون</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-400 font-bold">{movements.length} حركة</span>
            <select
              value={movementFilter}
              onChange={(e) => setMovementFilter(e.target.value)}
              className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-bold text-gray-600"
            >
              <option value="ALL">كل الأنواع</option>
              <option value="IN">توريد</option>
              <option value="OUT">صرف</option>
              <option value="RETURN">إرجاع</option>
              <option value="ADJUSTMENT">تعديل</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          {movements.length > 0 ? (
            movements.map((movement: any) => (
              <div key={movement.id} className="flex items-center justify-between gap-3 border border-gray-100 rounded-xl p-3 bg-gray-50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-black text-[#142826]">{movement.product?.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      movement.type === "IN" ? "bg-emerald-100 text-emerald-700" :
                      movement.type === "OUT" ? "bg-rose-100 text-rose-700" :
                      movement.type === "RETURN" ? "bg-amber-100 text-amber-700" :
                      "bg-sky-100 text-sky-700"
                    }`}>
                      {movement.type}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">{movement.reason}</p>
                </div>
                <div className="text-left">
                  <div className={`text-sm font-black ${
                    movement.quantity >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}>
                    {movement.quantity > 0 ? "+" : ""}{movement.quantity}
                  </div>
                  <div className="text-[10px] text-gray-400">
                    {movement.user?.fullName || "نظام"} · {new Date(movement.createdAt).toLocaleDateString("en-GB")}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-[12px] text-gray-400 py-6">لا توجد حركات مخزون حتى الآن.</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-card-subtle border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#1E8C86]" />
            <h2 className="text-sm font-black text-[#142826]">سجل الحركات التفصيلي</h2>
          </div>
          <span className="text-[11px] text-gray-400 font-bold">{filteredMovements.length} سجل</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 font-bold">
                <th className="py-3 px-3">الصنف</th>
                <th className="py-3 px-3">النوع</th>
                <th className="py-3 px-3">السبب</th>
                <th className="py-3 px-3">الكمية</th>
                <th className="py-3 px-3">الرصيد السابق</th>
                <th className="py-3 px-3">الرصيد الجديد</th>
                <th className="py-3 px-3">المستخدم</th>
                <th className="py-3 px-3">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredMovements.length > 0 ? (
                filteredMovements.map((movement: any) => (
                  <tr key={movement.id} className="hover:bg-[#F4FAF9] transition-colors">
                    <td className="py-3 px-3 font-bold text-[#142826]">{movement.product?.name || "-"}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        movement.type === "IN" ? "bg-emerald-100 text-emerald-700" :
                        movement.type === "OUT" ? "bg-rose-100 text-rose-700" :
                        movement.type === "RETURN" ? "bg-amber-100 text-amber-700" :
                        "bg-sky-100 text-sky-700"
                      }`}>
                        {movement.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-600">{movement.reason}</td>
                    <td className={`py-3 px-3 font-black ${movement.quantity >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {movement.quantity > 0 ? "+" : ""}{movement.quantity}
                    </td>
                    <td className="py-3 px-3 text-gray-700">{movement.previousStock}</td>
                    <td className="py-3 px-3 text-gray-700">{movement.newStock}</td>
                    <td className="py-3 px-3 text-gray-600">{movement.user?.fullName || "نظام"}</td>
                    <td className="py-3 px-3 text-gray-500">{new Date(movement.createdAt).toLocaleString("en-GB")}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-400">لا توجد حركات مطابقة للفلتر الحالي.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RESTOCK MODAL */}
      {restockItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border-4 border-[#2BA8A2]/30 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="w-5 h-5 text-[#2BA8A2]" />
                <h3 className="font-black text-sm text-[#142826]">
                  توريد وإضافة كميات للمخزون
                </h3>
              </div>
              <button
                onClick={() => setRestockItem(null)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-gray-400 font-bold block">الصنف:</span>
              <span className="text-sm font-black text-[#1E8C86]">
                {restockItem.name}
              </span>
              <span className="text-[11px] text-gray-500 block">
                الرصيد الحالي: {restockItem.stockQuantity} {restockItem.unit}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  الكمية المضافة *
                </label>
                <input
                  type="number"
                  min="1"
                  value={addedQty}
                  onChange={(e) => setAddedQty(parseInt(e.target.value) || 1)}
                  className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  سعر التكلفة الجديد (للوحدة)
                </label>
                <input
                  type="number"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                  className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                المورد (اختياري)
              </label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
              >
                <option value="">(شراء نقدي مباشر / بدون مورد مسجل)</option>
                {suppliers.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.supplyType})
                  </option>
                ))}
              </select>
            </div>

            <div className="p-3 rounded-xl bg-[#FFF8E7] border border-[#FFE47A]">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#1E4D48]">
                <input
                  type="checkbox"
                  checked={recordExpense}
                  onChange={(e) => setRecordExpense(e.target.checked)}
                  className="w-4 h-4 accent-[#2BA8A2] rounded"
                />
                <span>
                  تسجيل تكلفة التوريد ({new Intl.NumberFormat("en-US").format(addedQty * costPrice)} ج.س)
                  كمصروف تلقائياً
                </span>
              </label>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setRestockItem(null)}
                className="btn-pill px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleConfirmRestock}
                disabled={isPending}
                className="btn-pill px-6 py-2.5 bg-gradient-to-r from-[#2BA8A2] to-[#1E8C86] text-white text-xs font-black shadow-teal-glow"
              >
                تأكيد التوريد والتحديث
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STOCK MOVEMENT MODAL */}
      {stockAction && stockTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border-4 border-[#2BA8A2]/30 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                {stockAction === "issue" && <MoveRight className="w-5 h-5 text-rose-600" />}
                {stockAction === "return" && <MoveLeft className="w-5 h-5 text-emerald-600" />}
                {stockAction === "adjust" && <RefreshCw className="w-5 h-5 text-sky-600" />}
                <h3 className="font-black text-sm text-[#142826]">
                  {stockAction === "issue" ? "صرف من المخزون" : stockAction === "return" ? "إرجاع إلى المخزون" : "تعديل رصيد المخزون"}
                </h3>
              </div>
              <button
                onClick={() => {
                  setStockAction(null);
                  setStockTarget(null);
                }}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-gray-400 font-bold block">الصنف:</span>
              <span className="text-sm font-black text-[#1E8C86]">{stockTarget.name}</span>
              <span className="text-[11px] text-gray-500 block">الرصيد الحالي: {stockTarget.stockQuantity} {stockTarget.unit}</span>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                {stockAction === "adjust" ? "فرق الكمية (موجب/سالب)" : "الكمية"}
              </label>
              <input
                type="number"
                value={stockQty}
                onChange={(e) => setStockQty(parseInt(e.target.value) || 0)}
                className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">سبب الحركة</label>
              <input
                type="text"
                value={stockReason}
                onChange={(e) => setStockReason(e.target.value)}
                placeholder={stockAction === "issue" ? "صرف لمصنع / قسم / طلبية" : stockAction === "return" ? "إرجاع من العميل / قسم" : "تعديل رصيد / جرد / خسارة"}
                className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setStockAction(null);
                  setStockTarget(null);
                }}
                className="btn-pill px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleStockAction}
                disabled={isPending || stockQty === 0}
                className={`btn-pill px-6 py-2.5 text-white text-xs font-black shadow-teal-glow ${
                  stockAction === "issue" ? "bg-gradient-to-r from-rose-500 to-rose-600" :
                  stockAction === "return" ? "bg-gradient-to-r from-emerald-500 to-emerald-600" :
                  "bg-gradient-to-r from-sky-500 to-sky-600"
                }`}
              >
                {stockAction === "issue" ? "تأكيد الصرف" : stockAction === "return" ? "تأكيد الإرجاع" : "تأكيد التعديل"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW PRODUCT MODAL */}
      {isNewProductOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border-4 border-[#2BA8A2]/30 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-sm text-[#142826]">
                إضافة صنف مخزني وقرطاسية جديد
              </h3>
              <button
                onClick={() => setIsNewProductOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  كود الصنف (SKU) *
                </label>
                <input
                  type="text"
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value)}
                  className="w-full input-cream rounded-xl px-3 py-2 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  التصنيف
                </label>
                <select
                  value={categoryMode === "custom" ? "__custom__" : newCategory}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "__custom__") {
                      setCategoryMode("custom");
                      setNewCustomCategory("");
                      return;
                    }
                    setCategoryMode("existing");
                    setNewCategory(value);
                  }}
                  className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
                >
                  {categoryOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                  <option value="__custom__">+ إنشاء تصنيف جديد</option>
                </select>
                {categoryMode === "custom" && (
                  <input
                    type="text"
                    value={newCustomCategory}
                    onChange={(e) => setNewCustomCategory(e.target.value)}
                    placeholder="اكتب اسم التصنيف الجديد"
                    className="w-full mt-2 input-cream rounded-xl px-3 py-2 text-xs font-bold"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">
                اسم الصنف بالكامل *
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="مثال: ورق تصوير كوشيه 150 جرام A3"
                className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">الوحدة</label>
                <input
                  type="text"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  placeholder="باكت، حبة، علبة"
                  className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  الرصيد الأولي
                </label>
                <input
                  type="number"
                  min="0"
                  value={newInitialStock}
                  onChange={(e) => setNewInitialStock(parseInt(e.target.value) || 0)}
                  className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  حد التنبيه
                </label>
                <input
                  type="number"
                  min="1"
                  value={newAlertMin}
                  onChange={(e) => setNewAlertMin(parseInt(e.target.value) || 5)}
                  className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  سعر التكلفة
                </label>
                <input
                  type="number"
                  min="0"
                  value={newCost}
                  onChange={(e) => setNewCost(parseFloat(e.target.value) || 0)}
                  className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#1E8C86] block mb-1">
                  سعر البيع الرسمي
                </label>
                <input
                  type="number"
                  min="0"
                  value={newSelling}
                  onChange={(e) => setNewSelling(parseFloat(e.target.value) || 0)}
                  className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold text-[#1E8C86]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#D45233] block mb-1">
                  أدنى حد تفاوض
                </label>
                <input
                  type="number"
                  min="0"
                  value={newMinFloor}
                  onChange={(e) => setNewMinFloor(parseFloat(e.target.value) || 0)}
                  className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold text-[#D45233]"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsNewProductOpen(false)}
                className="btn-pill px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleCreateProduct}
                disabled={isPending}
                className="btn-pill px-6 py-2.5 bg-gradient-to-r from-[#2BA8A2] to-[#1E8C86] text-white text-xs font-black shadow-teal-glow"
              >
                حفظ الصنف في المخزون
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
