export type PermissionMatrix = {
  pages: Record<string, boolean>;
  actions: Record<string, boolean>;
};

export const PAGE_PERMISSION_LABELS: Record<string, string> = {
  dashboard: "الرئيسية ولوحة المؤشرات",
  invoices: "الفواتير ونقاط البيع (POS)",
  production: "خط التشغيل والمطبعة (الكانبان)",
  inventory: "المخزون ومستلزمات الطباعة",
  contracts: "العقود والتعاقدات الدورية",
  expenses: "المصروفات وسندات الصرف",
  employees: "الموظفين والرواتب والمسحوبات",
  reports: "التقارير المالية والتحليلات",
  users: "إدارة المستخدمين والصلاحيات",
  settings: "إعدادات المتجر والأسعار والنظام",
};

export const ACTION_PERMISSION_LABELS: Record<string, { label: string; category: string }> = {
  // الفواتير
  newInvoice: { label: "إصدار فاتورة جديدة", category: "الفواتير و POS" },
  editInvoice: { label: "تعديل الفاتورة", category: "الفواتير و POS" },
  deleteInvoice: { label: "حذف وإلغاء الفاتورة", category: "الفواتير و POS" },
  addPayment: { label: "إضافة دفعة وسند قبض", category: "الفواتير و POS" },
  printInvoice: { label: "طباعة الفاتورة وأمر الشغل", category: "الفواتير و POS" },

  // التشغيل والإنتاج
  advanceTask: { label: "تقديم مرحلة التشغيل (التالي)", category: "خط الإنتاج والتشغيل" },
  assignTask: { label: "تعيين مهمة إنتاج لموظف", category: "خط الإنتاج والتشغيل" },
  changeTaskPriority: { label: "تغيير الأولوية (عاجل/عادي)", category: "خط الإنتاج والتشغيل" },

  // المخزون
  createProduct: { label: "إضافة صنف وقرطاسية جديدة", category: "المخزون والمستلزمات" },
  restockProduct: { label: "توريد وزيادة كمية المخزون", category: "المخزون والمستلزمات" },
  stockIssue: { label: "صرف يدوي من المخزون", category: "المخزون والمستلزمات" },
  stockReturn: { label: "إرجاع صنف إلى المخزون", category: "المخزون والمستلزمات" },
  stockAdjust: { label: "تسوية وجرد كميات المخزون", category: "المخزون والمستلزمات" },
  viewStockLog: { label: "عرض سجل حركات المخزون", category: "المخزون والمستلزمات" },

  // العقود
  createContract: { label: "إنشاء عقد دوري جديد", category: "العقود" },
  printContract: { label: "طباعة وثيقة العقد الرسمية", category: "العقود" },

  // المصروفات
  createExpense: { label: "تسجيل سند مصروفات جديد", category: "المصروفات" },
  deleteExpense: { label: "حذف سند المصروفات", category: "المصروفات" },
  manageSuppliers: { label: "إضافة وإدارة الموردين", category: "المصروفات" },

  // الموظفين
  createEmployee: { label: "إضافة وتعديل بيانات موظف", category: "الموظفين والرواتب" },
  paySalary: { label: "صرف وسداد راتب أو سلفة", category: "الموظفين والرواتب" },

  // الإعدادات والنظام
  changeSettings: { label: "تعديل هوية المتجر والبيانات الأساسية", category: "الإعدادات والنظام" },
  editPricingMatrix: { label: "تعديل مصفوفة أسعار الطباعة والحدود الدنيا", category: "الإعدادات والنظام" },
  backupDatabase: { label: "تصدير وتحميل نسخة احتياطية من قاعدة البيانات", category: "الإعدادات والنظام" },
  restoreDatabase: { label: "استيراد واستعادة نسخة احتياطية للقاعدة", category: "الإعدادات والنظام" },
  manageUsers: { label: "إدارة المستخدمين وتوزيع الصلاحيات", category: "الإعدادات والنظام" },
  exportReports: { label: "تصدير وطباعة التقارير المالية", category: "التقارير" },
};

export const DEFAULT_PERMISSION_MATRIX: Record<string, PermissionMatrix> = {
  SUPER_ADMIN: {
    pages: {
      dashboard: true,
      invoices: true,
      production: true,
      inventory: true,
      contracts: true,
      expenses: true,
      employees: true,
      reports: true,
      users: true,
      settings: true,
    },
    actions: {
      newInvoice: true,
      editInvoice: true,
      deleteInvoice: true,
      addPayment: true,
      printInvoice: true,
      advanceTask: true,
      assignTask: true,
      changeTaskPriority: true,
      createProduct: true,
      restockProduct: true,
      stockIssue: true,
      stockReturn: true,
      stockAdjust: true,
      viewStockLog: true,
      createContract: true,
      printContract: true,
      createExpense: true,
      deleteExpense: true,
      manageSuppliers: true,
      createEmployee: true,
      paySalary: true,
      changeSettings: true,
      editPricingMatrix: true,
      backupDatabase: true,
      restoreDatabase: true,
      manageUsers: true,
      exportReports: true,
    },
  },
  ADMIN: {
    pages: {
      dashboard: true,
      invoices: true,
      production: true,
      inventory: true,
      contracts: true,
      expenses: true,
      employees: true,
      reports: true,
      users: true,
      settings: true,
    },
    actions: {
      newInvoice: true,
      editInvoice: true,
      deleteInvoice: true,
      addPayment: true,
      printInvoice: true,
      advanceTask: true,
      assignTask: true,
      changeTaskPriority: true,
      createProduct: true,
      restockProduct: true,
      stockIssue: true,
      stockReturn: true,
      stockAdjust: true,
      viewStockLog: true,
      createContract: true,
      printContract: true,
      createExpense: true,
      deleteExpense: true,
      manageSuppliers: true,
      createEmployee: true,
      paySalary: true,
      changeSettings: true,
      editPricingMatrix: true,
      backupDatabase: true,
      restoreDatabase: false,
      manageUsers: true,
      exportReports: true,
    },
  },
  CASHIER: {
    pages: {
      dashboard: true,
      invoices: true,
      production: false,
      inventory: false,
      contracts: false,
      expenses: false,
      employees: false,
      reports: true,
      users: false,
      settings: false,
    },
    actions: {
      newInvoice: true,
      editInvoice: false,
      deleteInvoice: false,
      addPayment: true,
      printInvoice: true,
      advanceTask: false,
      assignTask: false,
      changeTaskPriority: false,
      createProduct: false,
      restockProduct: false,
      stockIssue: false,
      stockReturn: false,
      stockAdjust: false,
      viewStockLog: false,
      createContract: false,
      printContract: false,
      createExpense: false,
      deleteExpense: false,
      manageSuppliers: false,
      createEmployee: false,
      paySalary: false,
      changeSettings: false,
      editPricingMatrix: false,
      backupDatabase: false,
      restoreDatabase: false,
      manageUsers: false,
      exportReports: false,
    },
  },
  ACCOUNTANT: {
    pages: {
      dashboard: true,
      invoices: true,
      production: false,
      inventory: true,
      contracts: true,
      expenses: true,
      employees: true,
      reports: true,
      users: false,
      settings: false,
    },
    actions: {
      newInvoice: false,
      editInvoice: false,
      deleteInvoice: false,
      addPayment: true,
      printInvoice: true,
      advanceTask: false,
      assignTask: false,
      changeTaskPriority: false,
      createProduct: false,
      restockProduct: true,
      stockIssue: false,
      stockReturn: false,
      stockAdjust: false,
      viewStockLog: true,
      createContract: true,
      printContract: true,
      createExpense: true,
      deleteExpense: true,
      manageSuppliers: true,
      createEmployee: false,
      paySalary: true,
      changeSettings: false,
      editPricingMatrix: false,
      backupDatabase: true,
      restoreDatabase: false,
      manageUsers: false,
      exportReports: true,
    },
  },
  DESIGNER: {
    pages: {
      dashboard: true,
      invoices: false,
      production: true,
      inventory: false,
      contracts: false,
      expenses: false,
      employees: false,
      reports: false,
      users: false,
      settings: false,
    },
    actions: {
      newInvoice: false,
      editInvoice: false,
      deleteInvoice: false,
      addPayment: false,
      printInvoice: true,
      advanceTask: true,
      assignTask: false,
      changeTaskPriority: false,
      createProduct: false,
      restockProduct: false,
      stockIssue: false,
      stockReturn: false,
      stockAdjust: false,
      viewStockLog: false,
      createContract: false,
      printContract: false,
      createExpense: false,
      deleteExpense: false,
      manageSuppliers: false,
      createEmployee: false,
      paySalary: false,
      changeSettings: false,
      editPricingMatrix: false,
      backupDatabase: false,
      restoreDatabase: false,
      manageUsers: false,
      exportReports: false,
    },
  },
  TECHNICIAN: {
    pages: {
      dashboard: true,
      invoices: false,
      production: true,
      inventory: true,
      contracts: false,
      expenses: false,
      employees: false,
      reports: false,
      users: false,
      settings: false,
    },
    actions: {
      newInvoice: false,
      editInvoice: false,
      deleteInvoice: false,
      addPayment: false,
      printInvoice: true,
      advanceTask: true,
      assignTask: false,
      changeTaskPriority: false,
      createProduct: false,
      restockProduct: false,
      stockIssue: true,
      stockReturn: true,
      stockAdjust: true,
      viewStockLog: true,
      createContract: false,
      printContract: false,
      createExpense: false,
      deleteExpense: false,
      manageSuppliers: false,
      createEmployee: false,
      paySalary: false,
      changeSettings: false,
      editPricingMatrix: false,
      backupDatabase: false,
      restoreDatabase: false,
      manageUsers: false,
      exportReports: false,
    },
  },
};

export function normalizePermissions(rawPermissions?: Record<string, any> | null | unknown, role?: string): PermissionMatrix {
  const base = DEFAULT_PERMISSION_MATRIX[role ?? "SUPER_ADMIN"] ?? DEFAULT_PERMISSION_MATRIX.SUPER_ADMIN;
  const safeRaw = rawPermissions && typeof rawPermissions === "object" && !Array.isArray(rawPermissions)
    ? (rawPermissions as Record<string, any>)
    : {};

  return {
    pages: { ...base.pages, ...(safeRaw.pages ?? {}) },
    actions: { ...base.actions, ...(safeRaw.actions ?? {}) },
  };
}

export function getEffectivePermissions(
  user: { role?: string; permissions?: Record<string, any> | string | null | unknown } | null,
): PermissionMatrix {
  const role = user?.role ?? "SUPER_ADMIN";
  let rawPermissions: unknown = user?.permissions ?? {};

  if (typeof rawPermissions === "string") {
    try {
      rawPermissions = JSON.parse(rawPermissions || "{}") || {};
    } catch {
      rawPermissions = {};
    }
  }

  return normalizePermissions(rawPermissions, role);
}

export function canAccessPage(user: { role?: string; permissions?: Record<string, any> | string | null | unknown } | null, pageKey: string) {
  return getEffectivePermissions(user).pages[pageKey] !== false;
}

export function canAccessAction(user: { role?: string; permissions?: Record<string, any> | string | null | unknown } | null, actionKey: string) {
  return getEffectivePermissions(user).actions[actionKey] !== false;
}
