"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Settings,
  Printer,
  FileText,
  DollarSign,
  Save,
  CheckCircle2,
  Database,
  Building,
  Users,
  Activity,
  ListFilter,
  UserPlus,
  Trash2,
  ShieldCheck,
  Download,
  Upload,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { getSettings, updateShopSettings, savePricingTier, getRecentActivities, getUsers, saveUser, deleteUser, getCurrentUser } from "./../actions";
import {
  DEFAULT_PERMISSION_MATRIX,
  PAGE_PERMISSION_LABELS,
  ACTION_PERMISSION_LABELS,
  normalizePermissions,
} from "@/lib/permissions";

type SettingsTab = "shop" | "pricing" | "users" | "backup" | "activity";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [pricingTiers, setPricingTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<SettingsTab>("shop");
  const [activities, setActivities] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [backupUploading, setBackupUploading] = useState(false);
  const [backupMessage, setBackupMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [userForm, setUserForm] = useState({
    id: "",
    username: "",
    fullName: "",
    role: "CASHIER",
    isActive: true,
    password: "",
    phone: "",
    notes: "",
    permissions: normalizePermissions({}, "CASHIER"),
  });

  const tabs: Array<{ key: SettingsTab; label: string; icon: any }> = [
    { key: "shop", label: "معلومات المتجر", icon: Settings },
    { key: "pricing", label: "مصفوفة الأسعار", icon: DollarSign },
    { key: "users", label: "المستخدمين والصلاحيات", icon: Users },
    { key: "backup", label: "النسخ الاحتياطي", icon: Database },
    { key: "activity", label: "سجل النشاطات", icon: Activity },
  ];

  const [shopName, setShopName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [currency, setCurrency] = useState("ج.س");
  const [branchPrefix, setBranchPrefix] = useState("KHW");
  const [invoiceFooter, setInvoiceFooter] = useState("");
  const [defaultContractTerms, setDefaultContractTerms] = useState("");

  const [editingTier, setEditingTier] = useState<any | null>(null);

  const loadData = async () => {
    setLoading(true);
    const res = await getSettings();
    if (res.success) {
      setSettings(res.settings);
      setPricingTiers(res.pricingTiers || []);

      if (res.settings) {
        setShopName(res.settings.shopName || "");
        setLogoUrl(res.settings.logoUrl || "");
        setPhone(res.settings.phone || "");
        setEmail(res.settings.email || "");
        setAddress(res.settings.address || "");
        setCurrency(res.settings.currency || "ج.س");
        setBranchPrefix(res.settings.branchPrefix || "KHW");
        setInvoiceFooter(res.settings.invoiceFooter || "");
        setDefaultContractTerms(res.settings.defaultContractTerms || "");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();

    const params = new URLSearchParams(window.location.search);
    const tabFromUrl = params.get("tab") as SettingsTab | null;
    if (tabFromUrl && tabs.some((tab) => tab.key === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", activeTab);
    window.history.replaceState({}, "", url.toString());
  }, [activeTab]);

  const loadUsers = async () => {
    const res = await getUsers();
    if (res.success) {
      setUsers(res.users ?? []);
    }
  };

  useEffect(() => {
    const loadActivities = async () => {
      const res = await getRecentActivities(30);
      if (res.success) {
        setActivities(res.activities ?? []);
      }
    };

    const loadCurrentUser = async () => {
      const res = await getCurrentUser();
      if (res) {
        setCurrentUser(res);
      }
    };

    void loadActivities();
    void loadCurrentUser();
  }, []);

  useEffect(() => {
    if (activeTab === "users") {
      void loadUsers();
    } else if (activeTab === "activity") {
      void (async () => {
        const res = await getRecentActivities(50);
        if (res.success) {
          setActivities(res.activities ?? []);
        }
      })();
    }
  }, [activeTab]);

  const handleSaveSettings = () => {
    startTransition(async () => {
      const res = await updateShopSettings({
        shopName,
        logoUrl,
        phone,
        email,
        address,
        currency,
        branchPrefix,
        invoiceFooter,
        defaultContractTerms,
      });

      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert("فشل في حفظ الإعدادات: " + res.error);
      }
    });
  };

  const handleSaveTier = (tier: any) => {
    startTransition(async () => {
      const res = await savePricingTier(tier);
      if (res.success) {
        setEditingTier(null);
        loadData();
      } else {
        alert("فشل في تعديل السعر: " + res.error);
      }
    });
  };

  const updateUserPermissions = (group: "pages" | "actions", key: string, value: boolean) => {
    setUserForm((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [group]: {
          ...prev.permissions[group],
          [key]: value,
        },
      },
    }));
  };

  const handleSaveUser = () => {
    startTransition(async () => {
      if (!userForm.username.trim() || !userForm.fullName.trim()) {
        alert("يرجى إدخال اسم المستخدم والاسم الكامل");
        return;
      }

      const res = await saveUser({
        id: userForm.id || undefined,
        username: userForm.username,
        fullName: userForm.fullName,
        role: userForm.role,
        isActive: userForm.isActive,
        password: userForm.password || undefined,
        phone: userForm.phone || undefined,
        notes: userForm.notes || undefined,
        permissions: userForm.permissions,
      });

      if (res.success) {
        setUserForm({
          id: "",
          username: "",
          fullName: "",
          role: "CASHIER",
          isActive: true,
          password: "",
          phone: "",
          notes: "",
          permissions: normalizePermissions({}, "CASHIER"),
        });
        await loadUsers();
      } else {
        alert("فشل في حفظ المستخدم: " + res.error);
      }
    });
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
      return;
    }

    const res = await deleteUser(id);
    if (res.success) {
      await loadUsers();
    } else {
      alert("فشل في حذف المستخدم: " + res.error);
    }
  };

  const fillUserForm = (user: any) => {
    setUserForm({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      password: "",
      phone: user.phone || "",
      notes: user.notes || "",
      permissions: normalizePermissions(user.permissions ?? {}, user.role),
    });
  };

  const handleRestoreDatabase = async () => {
    if (!backupFile) {
      alert("يرجى اختيار ملف نسخة احتياطية (.db) أولاً");
      return;
    }

    if (
      !window.confirm(
        "تحذير هام جداً:\nسيتم استبدال قاعدة البيانات الحالية بالكامل بالملف المرفوع.\nسيقوم النظام بأخذ نسخة أمان تلقائية قبل الاستبدال.\nهل أنت متأكد من المتابعة والاستعادة الآن؟"
      )
    ) {
      return;
    }

    setBackupUploading(true);
    setBackupMessage(null);

    try {
      const formData = new FormData();
      formData.append("databaseFile", backupFile);

      const res = await fetch("/api/backup", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "فشل استيراد قاعدة البيانات");
      }

      setBackupMessage({
        type: "success",
        text: `تم استعادة قاعدة البيانات بنجاح! تم حفظ نسخة أمان احتياطية احتياطية: ${data.safetyBackup || ""}`,
      });
      setBackupFile(null);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setBackupMessage({
        type: "error",
        text: err.message || "حدث خطأ أثناء استعادة قاعدة البيانات",
      });
    } finally {
      setBackupUploading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl p-5 shadow-card-subtle border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#2BA8A2] to-[#1E8C86] text-white flex items-center justify-center shadow-teal-glow">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#142826]">
              إعدادات النظام
            </h1>
            <p className="text-xs text-gray-500 font-medium">
              إدارة المتجر، المستخدمين، الأسعار، وسجل النشاطات
            </p>
          </div>
        </div>

        <a
          href="/api/backup"
          download
          className="btn-pill px-4 py-2.5 bg-[#FFF8E7] hover:bg-[#FFE47A] text-[#1E4D48] text-xs font-black border border-[#E2D9C3] shadow-sm flex items-center gap-2"
        >
          <Database className="w-4 h-4 text-[#2BA8A2]" />
          تحميل نسخة احتياطية للقاعدة (SQLite)
        </a>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-2 shadow-card-subtle">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black transition-all ${
                  active
                    ? "bg-gradient-to-r from-[#2BA8A2] to-[#1E8C86] text-white shadow-teal-glow"
                    : "bg-gray-50 text-gray-700 hover:bg-[#E8F6F5] hover:text-[#1E8C86]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-[#E8F8EE] border border-emerald-300 text-emerald-800 text-xs font-black flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          تم حفظ وتحديث إعدادات المطبعة بنجاح!
        </div>
      )}

      {activeTab === "shop" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-card-subtle border border-gray-100 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-dashed border-gray-200">
                <Building className="w-5 h-5 text-[#2BA8A2]" />
                <h3 className="font-black text-sm text-[#142826]">
                  بيانات وهوية المطبعة (الترويسة الرسمية)
                </h3>
              </div>

              <div className="p-4 rounded-2xl bg-[#F4FAF9] border border-[#2BA8A2]/20 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-[#2BA8A2] bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative group">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="شعار المطبعة" className="w-full h-full object-contain p-1" />
                  ) : (
                    <div className="text-center p-2">
                      <Printer className="w-8 h-8 text-[#2BA8A2] mx-auto mb-1 opacity-60" />
                      <span className="text-[9px] text-gray-400 font-bold block">لا يوجد شعار</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2 w-full text-right">
                  <label className="text-xs font-bold text-gray-700 block">
                    شعار المطبعة (يظهر في ترويسة الفواتير والعقود والتقارير)
                  </label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      placeholder="أدخل رابط الشعار URL أو ارفع صورة..."
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="flex-1 input-cream rounded-xl px-3 py-2 text-xs font-mono"
                      dir="ltr"
                    />
                    <label className="btn-pill px-3 py-2 bg-[#2BA8A2] hover:bg-[#1E8C86] text-white text-xs font-bold cursor-pointer shrink-0 text-center shadow-teal-glow">
                      <span>رفع صورة</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setLogoUrl(event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl("")}
                        className="btn-pill px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold shrink-0"
                      >
                        حذف الشعار
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">اسم المطبعة الرسمي</label>
                  <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">بادئة كود الفواتير</label>
                  <input type="text" value={branchPrefix} onChange={(e) => setBranchPrefix(e.target.value)} className="w-full input-cream rounded-xl px-3 py-2 text-xs font-mono font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">رقم الهاتف الرئيسي</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full input-cream rounded-xl px-3 py-2 text-xs font-mono font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">رمز العملة</label>
                  <input type="text" value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold" />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">العنوان والمقر</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold" />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">نص تذييل الفاتورة</label>
                <textarea rows={2} value={invoiceFooter} onChange={(e) => setInvoiceFooter(e.target.value)} className="w-full input-cream rounded-xl p-3 text-xs font-medium" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-card-subtle border border-gray-100 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-dashed border-gray-200">
                  <FileText className="w-5 h-5 text-[#2BA8A2]" />
                  <h3 className="font-black text-sm text-[#142826]">الشروط والبنود الافتراضية للعقود</h3>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">نصوص البنود القانونية والالتزامات المتبادلة</label>
                  <textarea rows={9} value={defaultContractTerms} onChange={(e) => setDefaultContractTerms(e.target.value)} className="w-full input-cream rounded-xl p-3 text-xs leading-relaxed font-medium" />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button type="button" onClick={handleSaveSettings} disabled={isPending} className="btn-pill px-6 py-2.5 bg-gradient-to-r from-[#2BA8A2] to-[#1E8C86] text-white text-xs font-black shadow-teal-glow hover:brightness-110">
                  <Save className="w-4 h-4" />
                  حفظ وتطبيق إعدادات المطبعة
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "pricing" && (
        <div className="bg-white rounded-2xl p-6 shadow-card-subtle border border-gray-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-dashed border-gray-200">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#E6B800]" />
              <div>
                <h3 className="font-black text-sm text-[#142826]">مصفوفة تسعير خدمات المطبوعات</h3>
                <p className="text-[11px] text-gray-500 font-medium">تحديد السعر الرسمي، وسعر الجملة، والحد الأدنى المسموح للتفاوض</p>
              </div>
            </div>

            <button
              onClick={() => setEditingTier({ itemName: "", unit: "1000 نسخة", baseCost: 0, officialPrice: 0, minNegotiablePrice: 0, wholesalePrice: 0 })}
              className="btn-pill px-4 py-2 bg-[#FFF8E7] text-[#1E4D48] text-xs font-bold border border-[#FFE47A] hover:bg-[#FFE47A]"
            >
              + إضافة خدمة تسعير
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold">
                  <th className="py-3 px-3">الخدمة / المطبوع</th>
                  <th className="py-3 px-3">الوحدة</th>
                  <th className="py-3 px-3">التكلفة التقديرية</th>
                  <th className="py-3 px-3">السعر الرسمي</th>
                  <th className="py-3 px-3">حد أدنى للتفاوض</th>
                  <th className="py-3 px-3">سعر الجملة</th>
                  <th className="py-3 px-3 text-center">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pricingTiers.map((tier) => (
                  <tr key={tier.id} className="hover:bg-[#F4FAF9] transition-colors">
                    <td className="py-3.5 px-3 font-bold text-gray-900">{tier.itemName}</td>
                    <td className="py-3.5 px-3 text-gray-500">{tier.unit}</td>
                    <td className="py-3.5 px-3 text-gray-600">{new Intl.NumberFormat("en-US").format(tier.baseCost || 0)} ج.س</td>
                    <td className="py-3.5 px-3 font-black text-[#1E8C86]">{new Intl.NumberFormat("en-US").format(tier.officialPrice || 0)} ج.س</td>
                    <td className="py-3.5 px-3 font-bold text-[#D45233]">{new Intl.NumberFormat("en-US").format(tier.minNegotiablePrice || 0)} ج.س</td>
                    <td className="py-3.5 px-3 font-bold text-amber-700">{new Intl.NumberFormat("en-US").format(tier.wholesalePrice || 0)} ج.س</td>
                    <td className="py-3.5 px-3 text-center">
                      <button onClick={() => setEditingTier(tier)} className="text-xs font-bold text-[#2BA8A2] hover:underline">تعديل</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-card-subtle border border-gray-100 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-dashed border-gray-200">
              <UserPlus className="w-5 h-5 text-[#2BA8A2]" />
              <div>
                <h3 className="font-black text-sm text-[#142826]">إدارة المستخدمين</h3>
                <p className="text-[11px] text-gray-500 font-medium">إضافة أو تعديل حسابات النظام</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">اسم المستخدم</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                  className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">الدور</label>
                  <select
                    value={userForm.role}
                    onChange={(e) =>
                      setUserForm((prev) => ({
                        ...prev,
                        role: e.target.value,
                        permissions: normalizePermissions({}, e.target.value),
                      }))
                    }
                    className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="SUPER_ADMIN">مدير عام</option>
                    <option value="ADMIN">إدارة</option>
                    <option value="CASHIER">كاشير</option>
                    <option value="DESIGNER">مصمم</option>
                    <option value="TECHNICIAN">فني</option>
                    <option value="ACCOUNTANT">محاسب</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">الحالة</label>
                  <select
                    value={String(userForm.isActive)}
                    onChange={(e) => setUserForm({ ...userForm, isActive: e.target.value === "true" })}
                    className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold"
                  >
                    <option value="true">نشط</option>
                    <option value="false">غير نشط</option>
                  </select>
                </div>
              </div>

              {currentUser && userForm.id === currentUser.id && (
                <div className="rounded-xl border border-[#FFD23F]/40 bg-[#FFF8E7] px-3 py-2 text-[10px] font-black text-[#1E4D48]">
                  هذا هو المستخدم الحالي — يتم تعديل صلاحيات حسابك مباشرة.
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">كلمة المرور {userForm.id ? "(اختيارية لتحديث الحساب)" : ""}</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full input-cream rounded-xl px-3 py-2 text-xs font-mono font-bold"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">الهاتف</label>
                <input
                  type="text"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                  className="w-full input-cream rounded-xl px-3 py-2 text-xs font-mono font-bold"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">ملاحظات</label>
                <textarea
                  rows={3}
                  value={userForm.notes}
                  onChange={(e) => setUserForm({ ...userForm, notes: e.target.value })}
                  className="w-full input-cream rounded-xl p-3 text-xs font-medium"
                />
              </div>

              <div className="space-y-3 rounded-2xl border border-[#2BA8A2]/15 bg-[#F4FAF9] p-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-[11px] font-black text-[#142826]">صلاحيات المستخدم</h4>
                  <button
                    type="button"
                    onClick={() =>
                      setUserForm((prev) => ({
                        ...prev,
                        permissions: normalizePermissions({}, prev.role),
                      }))
                    }
                    className="text-[10px] font-bold text-[#1E8C86] underline"
                  >
                    إعادة تعيين إلى الدور
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="mb-2 text-[10px] font-black text-gray-600">صلاحيات الصفحات</div>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(DEFAULT_PERMISSION_MATRIX.SUPER_ADMIN.pages).map((pageKey) => (
                        <label key={pageKey} className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 text-[10px] font-bold text-gray-700 border border-gray-200">
                          <input
                            type="checkbox"
                            checked={!!userForm.permissions.pages[pageKey]}
                            onChange={(e) => updateUserPermissions("pages", pageKey, e.target.checked)}
                            className="h-3.5 w-3.5 accent-[#2BA8A2]"
                          />
                          {PAGE_PERMISSION_LABELS[pageKey] ?? pageKey}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 pt-1">
                    <div className="text-[10px] font-black text-gray-700">صلاحيات الإجراءات والأزرار</div>
                    {Array.from(
                      new Set(
                        Object.values(ACTION_PERMISSION_LABELS).map((info) => info.category)
                      )
                    ).map((categoryName) => (
                      <div key={categoryName} className="rounded-xl border border-gray-200/80 bg-white/70 p-2.5">
                        <div className="mb-1.5 text-[10px] font-black text-[#1E8C86]">{categoryName}</div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {Object.entries(ACTION_PERMISSION_LABELS)
                            .filter(([_, info]) => info.category === categoryName)
                            .map(([actionKey, info]) => (
                              <label
                                key={actionKey}
                                className="flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 text-[10px] font-bold text-gray-700 border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  checked={!!userForm.permissions.actions[actionKey]}
                                  onChange={(e) => updateUserPermissions("actions", actionKey, e.target.checked)}
                                  className="h-3.5 w-3.5 accent-[#2BA8A2]"
                                />
                                <span>{info.label}</span>
                              </label>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUserForm({ id: "", username: "", fullName: "", role: "CASHIER", isActive: true, password: "", phone: "", notes: "", permissions: normalizePermissions({}, "CASHIER") })}
                  className="btn-pill px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold"
                >
                  مسح
                </button>
                <button
                  type="button"
                  onClick={handleSaveUser}
                  disabled={isPending}
                  className="btn-pill px-6 py-2.5 bg-gradient-to-r from-[#2BA8A2] to-[#1E8C86] text-white text-xs font-black shadow-teal-glow"
                >
                  <ShieldCheck className="w-4 h-4" />
                  حفظ المستخدم
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-card-subtle border border-gray-100">
            <div className="flex items-center gap-2 pb-3 border-b border-dashed border-gray-200 mb-4">
              <Users className="w-5 h-5 text-[#2BA8A2]" />
              <h3 className="font-black text-sm text-[#142826]">قائمة المستخدمين</h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-gray-100 text-gray-400 font-bold">
                    <th className="py-3 px-3">الاسم</th>
                    <th className="py-3 px-3">اسم المستخدم</th>
                    <th className="py-3 px-3">الدور</th>
                    <th className="py-3 px-3">الحالة</th>
                    <th className="py-3 px-3 text-center">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-500">لا توجد مستخدمين</td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className="hover:bg-[#F4FAF9] transition-colors">
                        <td className="py-3.5 px-3 font-bold text-gray-900">
                          {user.fullName}
                          {currentUser && user.id === currentUser.id && (
                            <span className="ml-2 rounded-full bg-[#FFF8E7] px-2 py-0.5 text-[9px] font-black text-[#D45233]">أنا</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-gray-600">{user.username}</td>
                        <td className="py-3.5 px-3 text-gray-600">{user.role}</td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-black ${user.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                            {user.isActive ? "نشط" : "غير نشط"}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button type="button" onClick={() => fillUserForm(user)} className="text-xs font-bold text-[#2BA8A2] hover:underline">تعديل</button>
                            <button type="button" onClick={() => void handleDeleteUser(user.id)} className="text-xs font-bold text-red-500 hover:underline inline-flex items-center gap-1">
                              <Trash2 className="w-3.5 h-3.5" /> حذف
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "backup" && (
        <div className="space-y-6">
          {backupMessage && (
            <div
              className={`rounded-2xl p-4 text-xs font-bold border flex items-center gap-3 ${
                backupMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
            >
              {backupMessage.type === "success" ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              )}
              <span>{backupMessage.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* بطاقة التصدير */}
            <div className="bg-white rounded-3xl p-6 shadow-card-subtle border border-gray-100 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#E8F6F5] text-[#1E8C86] flex items-center justify-center">
                  <Download className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#142826]">تصدير وتحميل نسخة احتياطية</h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1">
                    قم بتحميل ملف نسخة احتياطية كاملة ومباشرة من قاعدة بيانات النظام (SQLite .db). يمكنك حفظها على قرص خارجي أو سحابي واستعادتها في أي وقت.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <a
                  href="/api/backup"
                  download
                  className="btn-pill w-full justify-center px-5 py-3 bg-gradient-to-r from-[#2BA8A2] to-[#1E8C86] text-white text-xs font-black shadow-teal-glow inline-flex items-center gap-2"
                >
                  <Database className="w-4 h-4" />
                  تحميل ملف النسخة الاحتياطية الحالية (.db)
                </a>
              </div>
            </div>

            {/* بطاقة الاستيراد والاستعادة */}
            <div className="bg-white rounded-3xl p-6 shadow-card-subtle border border-gray-100 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FFF8E7] text-[#D45233] flex items-center justify-center">
                  <Upload className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#142826]">استيراد واستعادة قاعدة البيانات</h3>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed mt-1">
                    ارفع ملف قاعدة بيانات سابق بصيغة (.db). سيقوم النظام بالتحقق التلقائي من سلامة الملف وأخذ نسخة أمان قبل الاستبدال.
                  </p>
                </div>

                <div className="rounded-2xl border-2 border-dashed border-[#2BA8A2]/30 p-4 text-center bg-[#F4FAF9]/50">
                  <input
                    type="file"
                    accept=".db,.sqlite,.sqlite3"
                    id="db-file-upload"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setBackupFile(e.target.files[0]);
                      }
                    }}
                  />
                  <label htmlFor="db-file-upload" className="cursor-pointer block space-y-1">
                    <Database className="w-7 h-7 text-[#2BA8A2] mx-auto" />
                    <span className="text-xs font-black text-[#1E8C86] block">
                      {backupFile ? backupFile.name : "اضغط لاختيار ملف النسخة (.db)"}
                    </span>
                    <span className="text-[10px] text-gray-400 block font-medium">
                      {backupFile ? `${(backupFile.size / 1024).toFixed(1)} كيلوبايت` : "يدعم ملفات SQLite فقط"}
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleRestoreDatabase}
                  disabled={!backupFile || backupUploading}
                  className="btn-pill w-full justify-center px-5 py-3 bg-[#D45233] hover:bg-[#b84328] disabled:opacity-50 text-white text-xs font-black shadow-sm inline-flex items-center gap-2"
                >
                  {backupUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      جاري التحقق والاستعادة...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      تأكيد استعادة قاعدة البيانات
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <div className="bg-white rounded-2xl p-6 shadow-card-subtle border border-gray-100 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-dashed border-gray-200">
            <div className="flex items-center gap-2">
              <ListFilter className="w-5 h-5 text-[#2BA8A2]" />
              <div>
                <h3 className="font-black text-sm text-[#142826]">سجل النشاطات</h3>
                <p className="text-[11px] text-gray-500 font-medium">آخر العمليات والتغييرات التي تمت داخل النظام</p>
              </div>
            </div>
            <button
              onClick={() => {
                void (async () => {
                  const res = await getRecentActivities(50);
                  if (res.success) setActivities(res.activities ?? []);
                })();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-colors"
              title="تحديث السجل"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#2BA8A2]" />
              تحديث السجل
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-gray-100 text-gray-400 font-bold">
                  <th className="py-3 px-3">العنوان</th>
                  <th className="py-3 px-3">التفاصيل</th>
                  <th className="py-3 px-3">النوع</th>
                  <th className="py-3 px-3">المستخدم</th>
                  <th className="py-3 px-3">التاريخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">لا توجد نشاطات بعد</td>
                  </tr>
                ) : (
                  activities.map((activity) => (
                    <tr key={activity.id} className="hover:bg-[#F4FAF9] transition-colors">
                      <td className="py-3.5 px-3 font-bold text-gray-900">{activity.title}</td>
                      <td className="py-3.5 px-3 text-gray-600">{activity.details || "-"}</td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-black ${activity.type === "SUCCESS" ? "bg-emerald-100 text-emerald-700" : activity.type === "WARNING" ? "bg-yellow-100 text-yellow-700" : activity.type === "ERROR" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-700"}`}>
                          {activity.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-gray-600">{activity.user?.fullName || activity.user?.username || "-"}</td>
                      <td className="py-3.5 px-3 text-gray-500">
                        {new Intl.DateTimeFormat("ar-SA", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(activity.createdAt))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingTier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border-4 border-[#2BA8A2]/30 space-y-4 animate-in zoom-in-95">
            <h3 className="font-black text-sm text-[#142826] border-b pb-2">{editingTier.id ? "تعديل بنود مصفوفة التسعير" : "إضافة بند تسعير جديد"}</h3>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">اسم الخدمة أو المطبوع</label>
              <input type="text" value={editingTier.itemName} onChange={(e) => setEditingTier({ ...editingTier, itemName: e.target.value })} className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold" />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">الوحدة</label>
              <input type="text" value={editingTier.unit} onChange={(e) => setEditingTier({ ...editingTier, unit: e.target.value })} className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-[#1E8C86] block mb-1">السعر الرسمي</label>
                <input type="number" min="0" value={editingTier.officialPrice} onChange={(e) => setEditingTier({ ...editingTier, officialPrice: parseFloat(e.target.value) || 0 })} className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold text-[#1E8C86]" />
              </div>

              <div>
                <label className="text-xs font-bold text-[#D45233] block mb-1">الحد الأدنى للتفاوض</label>
                <input type="number" min="0" value={editingTier.minNegotiablePrice} onChange={(e) => setEditingTier({ ...editingTier, minNegotiablePrice: parseFloat(e.target.value) || 0 })} className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold text-[#D45233]" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">سعر الجملة</label>
                <input type="number" min="0" value={editingTier.wholesalePrice} onChange={(e) => setEditingTier({ ...editingTier, wholesalePrice: parseFloat(e.target.value) || 0 })} className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">التكلفة التقديرية</label>
                <input type="number" min="0" value={editingTier.baseCost} onChange={(e) => setEditingTier({ ...editingTier, baseCost: parseFloat(e.target.value) || 0 })} className="w-full input-cream rounded-xl px-3 py-2 text-xs font-bold" />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button type="button" onClick={() => setEditingTier(null)} className="btn-pill px-4 py-2 bg-gray-100 text-gray-600 text-xs font-bold">إلغاء</button>
              <button type="button" onClick={() => handleSaveTier(editingTier)} disabled={isPending} className="btn-pill px-6 py-2.5 bg-gradient-to-r from-[#2BA8A2] to-[#1E8C86] text-white text-xs font-black shadow-teal-glow">حفظ الخدمة</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
