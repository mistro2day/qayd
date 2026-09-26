"use server";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getEffectivePermissions, normalizePermissions } from "@/lib/permissions";

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function getActivityLogClient() {
  return (prisma as any)?.activityLog ?? null;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("qayd_session")?.value;

  if (!sessionToken) return null;

  try {
    // 1. Try finding by ID
    let user = await prisma.user.findUnique({
      where: { id: sessionToken },
    });

    // 2. If not found by ID (e.g. after database restore where cuid IDs differ), fallback to finding by username
    if (!user) {
      user = await prisma.user.findUnique({
        where: { username: sessionToken.toLowerCase() },
      });

      // If found by username, refresh cookie with new ID seamlessly
      if (user) {
        cookieStore.set("qayd_session", user.id, {
          httpOnly: true,
          sameSite: "lax",
          secure: false,
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        });
      }
    }

    return user;
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return null;
  }
}

export async function loginUser(data: { username: string; password: string }) {
  const username = data.username?.trim().toLowerCase();
  const password = data.password ?? "";

  if (!username || !password) {
    return { success: false, error: "يرجى إدخال اسم المستخدم وكلمة المرور" };
  }

  let user = await prisma.user.findUnique({ where: { username } });

  if (!user && username === "admin") {
    await prisma.user.upsert({
      where: { username: "admin" },
      update: {},
      create: {
        username: "admin",
        fullName: "admin",
        role: "SUPER_ADMIN",
        isActive: true,
        passwordHash: hashPassword("admin123"),
        phone: "966000000000",
        notes: "حساب إدارة رئيسي للنظام. الافتراضي: admin / admin123",
      },
    });

    user = await prisma.user.findUnique({ where: { username } });
  }

  if (!user || !user.isActive) {
    return { success: false, error: "اسم المستخدم غير موجود أو الحساب غير فعال" };
  }

  const expectedHash = user.passwordHash || "";
  if (expectedHash !== hashPassword(password)) {
    return { success: false, error: "كلمة المرور غير صحيحة" };
  }

  const cookieStore = await cookies();
  cookieStore.set("qayd_session", user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });



  return {
    success: true,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    },
  };
}

export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete("qayd_session");
  return { success: true };
}

export async function createActivityLog(data: {
  title: string;
  details?: string;
  type?: "INFO" | "SUCCESS" | "WARNING" | "ERROR";
  userId?: string;
}) {
  try {
    const activityLog = getActivityLogClient();
    if (!activityLog) {
      return { success: false, error: "ActivityLog client is not generated yet" };
    }

    const log = await activityLog.create({
      data: {
        title: data.title,
        details: data.details ?? null,
        type: data.type ?? "INFO",
        userId: data.userId ?? null,
      },
    });

    return { success: true, log };
  } catch (error: any) {
    console.error("ActivityLog create failed:", error);
    return { success: false, error: error.message };
  }
}

export async function getRecentActivities(limit = 5) {
  try {
    const activityLog = getActivityLogClient();
    if (!activityLog) {
      return { success: false, error: "ActivityLog client is not generated yet", activities: [] };
    }

    const activities = await activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit * 3,
      include: {
        user: {
          select: {
            fullName: true,
            username: true,
          },
        },
      },
    });

    const filteredActivities = activities.filter((activity: { title?: string | null }) => {
      const title = (activity.title ?? "").toLowerCase();
      return !title.includes("تسجيل دخول") && !title.includes("تسجيل خروج") && !title.includes("دخول ناجح");
    });

    return { success: true, activities: filteredActivities.slice(0, limit) };
  } catch (error: any) {
    console.error("Recent activities fetch failed:", error);
    return { success: false, error: error.message, activities: [] };
  }
}

// 1. Dashboard Metrics
export async function getDashboardData() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      invoices,
      tasks,
      products,
      expenses,
      settings,
    ] = await Promise.all([
      prisma.invoice.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { items: true },
      }),
      prisma.productionTask.findMany({
        orderBy: { createdAt: "desc" },
        include: { invoice: true, assignedTo: true },
      }),
      prisma.product.findMany({
        where: {
          stockQuantity: {
            lte: prisma.product.fields ? undefined : 15,
          },
        },
      }),
      prisma.expense.findMany({
        orderBy: { date: "desc" },
        take: 5,
      }),
      prisma.shopSettings.findUnique({
        where: { id: "default" },
      }),
    ]);

    // Financial KPIs
    const allInvoices = await prisma.invoice.findMany();
    const totalSales = allInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const totalCollected = allInvoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
    const totalUnpaid = totalSales - totalCollected;

    const allExpenses = await prisma.expense.findMany();
    const totalExpensesAmount = allExpenses.reduce((acc, exp) => acc + exp.amount, 0);

    // Production counts
    const designCount = tasks.filter((t) => t.stage === "DESIGN" && t.status !== "COMPLETED").length;
    const printingCount = tasks.filter((t) => t.stage === "PRINTING" && t.status !== "COMPLETED").length;
    const finishingCount = tasks.filter((t) => t.stage === "FINISHING" && t.status !== "COMPLETED").length;
    const deliveryCount = tasks.filter((t) => t.stage === "DELIVERY" && t.status !== "COMPLETED").length;

    // Urgent tasks
    const urgentTasks = tasks.filter(
      (t) => t.priority === "URGENT" && t.status !== "COMPLETED"
    );

    // Low stock items
    const lowStockItems = await prisma.product.findMany({
      where: {
        stockQuantity: {
          lte: 10,
        },
      },
      take: 6,
    });

    return {
      success: true,
      data: {
        kpis: {
          totalSales,
          totalCollected,
          totalUnpaid,
          totalExpenses: totalExpensesAmount,
          currency: settings?.currency || "ج.س",
        },
        pipeline: {
          design: designCount,
          printing: printingCount,
          finishing: finishingCount,
          delivery: deliveryCount,
          urgent: urgentTasks.length,
        },
        recentInvoices: invoices,
        urgentTasks,
        lowStockItems,
        shopSettings: settings,
      },
    };
  } catch (error: any) {
    console.error("Dashboard data fetch error:", error);
    return { success: false, error: error.message };
  }
}

// 2. Production Kanban Tasks
export async function getProductionTasks(filter?: { stage?: string; assignedToId?: string; priority?: string }) {
  try {
    const where: any = {};
    if (filter?.stage) where.stage = filter.stage;
    if (filter?.assignedToId) where.assignedToId = filter.assignedToId;
    if (filter?.priority) where.priority = filter.priority;

    const [tasks, employees] = await Promise.all([
      prisma.productionTask.findMany({
        where,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        include: {
          invoice: true,
          assignedTo: true,
        },
      }),
      prisma.employee.findMany({
        orderBy: { name: "asc" },
      }),
    ]);

    return { success: true, tasks, employees };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function advanceTaskStage(taskId: string) {
  try {
    const task = await prisma.productionTask.findUnique({ where: { id: taskId } });
    if (!task) throw new Error("Task not found");

    const stages = ["DESIGN", "PRINTING", "FINISHING", "DELIVERY"];
    const currentIndex = stages.indexOf(task.stage);

    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1];
      await prisma.productionTask.update({
        where: { id: taskId },
        data: {
          stage: nextStage,
          status: "IN_PROGRESS",
        },
      });
    } else {
      // Mark as completed
      await prisma.productionTask.update({
        where: { id: taskId },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });
    }

    const currentUser = await getCurrentUser();
    await createActivityLog({
      title: `تحديث أمر تشغيل (${task.title})`,
      details: currentIndex < stages.length - 1 ? `نقل للمرحلة التالية: ${stages[currentIndex + 1]}` : `اكتمل تنفيذ أمر التشغيل بنجاح`,
      type: "INFO",
      userId: currentUser?.id,
    });

    revalidatePath("/production");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTaskStage(taskId: string, stage: string) {
  try {
    const task = await prisma.productionTask.findUnique({ where: { id: taskId } });
    if (!task) throw new Error("Task not found");

    await prisma.productionTask.update({
      where: { id: taskId },
      data: {
        stage,
        status: "IN_PROGRESS",
        completedAt: null,
      },
    });

    revalidatePath("/production");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTaskStatus(taskId: string, status: string, assignedToId?: string) {
  try {
    const data: any = { status };
    if (status === "COMPLETED") data.completedAt = new Date();
    if (assignedToId !== undefined) data.assignedToId = assignedToId || null;

    await prisma.productionTask.update({
      where: { id: taskId },
      data,
    });

    revalidatePath("/production");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTaskDetails(data: {
  taskId: string;
  notes?: string;
  priority?: string;
  assignedToId?: string;
}) {
  try {
    const updateData: any = {};
    if (data.notes !== undefined) updateData.notes = data.notes || null;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId || null;

    const updatedTask = await prisma.productionTask.update({
      where: { id: data.taskId },
      data: updateData,
    });

    if (data.notes) {
      const currentUser = await getCurrentUser();
      await createActivityLog({
        title: `إضافة ملاحظة على أمر تشغيل (${updatedTask.title})`,
        details: `ملاحظة: ${data.notes.slice(0, 60)}...`,
        type: "INFO",
        userId: currentUser?.id,
      });
    }

    revalidatePath("/production");
    revalidatePath("/");
    return { success: true, task: updatedTask };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. Invoices & Fast POS
export async function getInvoices() {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
        tasks: true,
        customer: true,
      },
    });
    return { success: true, invoices };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInvoiceById(id: string) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
        tasks: {
          include: { assignedTo: true },
        },
        customer: true,
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    const settings = await prisma.shopSettings.findUnique({
      where: { id: "default" },
    });

    return { success: true, invoice, settings };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateInvoice(data: {
  id: string;
  invoiceCode: string;
  customerId?: string;
  clientName: string;
  clientPhone?: string;
  subtotal: number;
  discountRate: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  items: {
    productId?: string;
    itemType: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("يجب تسجيل الدخول أولاً");
    const permissions = getEffectivePermissions(currentUser);
    if (permissions.actions.editInvoice === false) {
      throw new Error("ليس لديك صلاحية تعديل الفواتير");
    }

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: data.id },
      include: { items: true },
    });

    if (!existingInvoice) throw new Error("الفاتورة غير موجودة");

    for (const oldItem of existingInvoice.items) {
      if (oldItem.productId && oldItem.itemType === "RETAIL") {
        const restoreResult = await returnProductStock({
          productId: oldItem.productId,
          quantity: oldItem.quantity,
          reason: `إلغاء/تعديل فاتورة ${data.invoiceCode}`,
          referenceType: "INVOICE",
          referenceId: data.id,
        });

        if (!restoreResult.success) {
          throw new Error(restoreResult.error || "فشل في استرجاع المخزون القديم");
        }
      }
    }

    const status =
      data.paidAmount >= data.totalAmount
        ? "PAID"
        : data.paidAmount > 0
        ? "PARTIAL"
        : "UNPAID";

    await prisma.invoice.update({
      where: { id: data.id },
      data: {
        invoiceCode: data.invoiceCode,
        customerId: data.customerId || null,
        clientName: data.clientName,
        clientPhone: data.clientPhone || null,
        subtotal: data.subtotal,
        discountRate: data.discountRate,
        discountAmount: data.discountAmount,
        taxRate: data.taxRate,
        taxAmount: data.taxAmount,
        totalAmount: data.totalAmount,
        paidAmount: data.paidAmount,
        status,
        items: {
          deleteMany: {},
          create: data.items.map((item) => ({
            productId: item.productId || null,
            itemType: item.itemType,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },
    });

    for (const item of data.items) {
      if (item.productId && item.itemType === "RETAIL") {
        const current = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!current) {
          throw new Error(`Product not found for invoice item: ${item.description}`);
        }

        if (current.stockQuantity < item.quantity) {
          throw new Error(`المخزون غير كافٍ لصنف ${current.name}. المتاح: ${current.stockQuantity}`);
        }

        const issueResult = await issueProductStock({
          productId: item.productId,
          quantity: item.quantity,
          reason: `تعديل فاتورة ${data.invoiceCode}`,
          referenceType: "INVOICE",
          referenceId: data.id,
        });

        if (!issueResult.success) {
          throw new Error(issueResult.error || "فشل في خصم المخزون بعد التعديل");
        }
      }
    }

    revalidatePath("/invoices");
    revalidatePath("/inventory");
    revalidatePath("/");

    return { success: true, invoiceId: data.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getPosCatalog() {
  try {
    const [products, pricingTiers, customers, employees, settings] = await Promise.all([
      prisma.product.findMany({ orderBy: { name: "asc" } }),
      prisma.pricingTier.findMany({ where: { isActive: true }, orderBy: { itemName: "asc" } }),
      prisma.customer.findMany({ orderBy: { name: "asc" } }),
      prisma.employee.findMany({ orderBy: { name: "asc" } }),
      prisma.shopSettings.findUnique({ where: { id: "default" } }),
    ]);

    // Generate next conflict-free invoice code
    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ""); // YYMMDD
    const prefix = settings?.branchPrefix || "KHW";
    const todayCount = await prisma.invoice.count({
      where: {
        invoiceCode: {
          contains: `-INV-${dateStr}-`,
        },
      },
    });
    const nextCode = `${prefix}-INV-${dateStr}-${String(todayCount + 1).padStart(3, "0")}`;

    return {
      success: true,
      products,
      pricingTiers,
      customers,
      employees,
      settings,
      nextCode,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function addInvoicePayment(data: {
  invoiceId: string;
  amount: number;
}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("يجب تسجيل الدخول أولاً");

    const permissions = getEffectivePermissions(currentUser);
    if (permissions.actions.editInvoice === false) {
      throw new Error("ليس لديك صلاحية إضافة دفعة على الفواتير");
    }

    const invoice = await prisma.invoice.findUnique({ where: { id: data.invoiceId } });
    if (!invoice) throw new Error("الفاتورة غير موجودة");

    const paymentAmount = Number(data.amount) || 0;
    if (paymentAmount <= 0) throw new Error("يجب إدخال مبلغ دفعة أكبر من صفر");

    const remaining = Math.max(0, invoice.totalAmount - invoice.paidAmount);
    const safeAmount = Math.min(paymentAmount, remaining);
    const newPaidAmount = invoice.paidAmount + safeAmount;
    const status = newPaidAmount >= invoice.totalAmount ? "PAID" : "PARTIAL";

    await prisma.$transaction(async (tx) => {
      await tx.invoice.update({
        where: { id: data.invoiceId },
        data: {
          paidAmount: newPaidAmount,
          status,
        },
      });

      await tx.invoicePayment.create({
        data: {
          invoiceId: data.invoiceId,
          amount: safeAmount,
          method: "CASH",
          note: "دفعة إضافية من شاشة الفواتير",
        },
      });
    });

    await createActivityLog({
      title: `سند قبض / دفعة فاتورة (${invoice.invoiceCode})`,
      details: `استلام مبلغ: ${safeAmount} ج.س (المتبقي: ${Math.max(0, invoice.totalAmount - newPaidAmount)})`,
      type: "SUCCESS",
      userId: currentUser?.id,
    });

    revalidatePath("/invoices");
    revalidatePath("/");
    return { success: true, invoiceId: data.invoiceId, amount: safeAmount };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteInvoice(invoiceId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) throw new Error("يجب تسجيل الدخول أولاً");

    const permissions = getEffectivePermissions(currentUser);
    if (permissions.actions.editInvoice === false) {
      throw new Error("ليس لديك صلاحية حذف الفواتير");
    }

    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) throw new Error("الفاتورة غير موجودة");

    await prisma.invoice.delete({ where: { id: invoiceId } });

    await createActivityLog({
      title: `حذف فاتورة (${invoice.invoiceCode})`,
      details: `تم حذف الفاتورة الخاصة بالعميل ${invoice.clientName} بقيمة: ${invoice.totalAmount} ج.س`,
      type: "WARNING",
      userId: currentUser?.id,
    });

    revalidatePath("/invoices");
    revalidatePath("/production");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createInvoice(data: {
  invoiceCode: string;
  customerId?: string;
  clientName: string;
  clientPhone?: string;
  subtotal: number;
  discountRate: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  items: {
    productId?: string;
    itemType: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  createProductionTasks?: boolean;
  assignedEmployeeId?: string;
  priority?: string;
}) {
  try {
    const status =
      data.paidAmount >= data.totalAmount
        ? "PAID"
        : data.paidAmount > 0
        ? "PARTIAL"
        : "UNPAID";

    const invoice = await prisma.invoice.create({
      data: {
        invoiceCode: data.invoiceCode,
        customerId: data.customerId || null,
        clientName: data.clientName,
        clientPhone: data.clientPhone || null,
        subtotal: data.subtotal,
        discountRate: data.discountRate,
        discountAmount: data.discountAmount,
        taxRate: data.taxRate,
        taxAmount: data.taxAmount,
        totalAmount: data.totalAmount,
        paidAmount: data.paidAmount,
        status,
        items: {
          create: data.items.map((item) => ({
            productId: item.productId || null,
            itemType: item.itemType,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
        },
      },
    });

    // Auto-deduct stock for retail items via a centralized stock movement audit trail
    for (const item of data.items) {
      if (item.productId && item.itemType === "RETAIL") {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!product) {
          throw new Error(`Product not found for invoice item: ${item.description}`);
        }

        if (product.stockQuantity < item.quantity) {
          throw new Error(`المخزون غير كافٍ لصنف ${product.name}. المتاح: ${product.stockQuantity}`);
        }

        const result = await issueProductStock({
          productId: item.productId,
          quantity: item.quantity,
          reason: `بيع مباشر - فاتورة ${data.invoiceCode}`,
          referenceType: "INVOICE",
          referenceId: invoice.id,
        });

        if (!result.success) {
          throw new Error(result.error || "Failed to deduct stock");
        }
      }
    }

    // Auto-create Production pipeline if custom print items exist
    const hasPrintItems = data.items.some((i) => i.itemType === "PRINT");
    if (hasPrintItems || data.createProductionTasks) {
      const defaultStages = [
        { stage: "DESIGN", title: `إعداد وتدقيق تصاميم طلبية ${invoice.invoiceCode}` },
        { stage: "PRINTING", title: `طباعة وتجهيز خامات ${invoice.invoiceCode}` },
        { stage: "FINISHING", title: `قص وسلوفان وتشطيب ${invoice.invoiceCode}` },
        { stage: "DELIVERY", title: `تغليف وتسليم العميل (${data.clientName})` },
      ];

      for (const s of defaultStages) {
        await prisma.productionTask.create({
          data: {
            invoiceId: invoice.id,
            title: s.title,
            stage: s.stage,
            status: s.stage === "DESIGN" ? "IN_PROGRESS" : "PENDING",
            priority: data.priority || "NORMAL",
            assignedToId: data.assignedEmployeeId || null,
          },
        });
      }
    }

    const currentUser = await getCurrentUser();
    await createActivityLog({
      title: `إصدار فاتورة جديدة (${invoice.invoiceCode})`,
      details: `للعميل: ${data.clientName} بإجمالي: ${data.totalAmount} ج.س (المدفوع: ${data.paidAmount})`,
      type: "SUCCESS",
      userId: currentUser?.id,
    });

    revalidatePath("/invoices");
    revalidatePath("/production");
    revalidatePath("/inventory");
    revalidatePath("/");

    return { success: true, invoiceId: invoice.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. Inventory & Stationery
export async function getInventoryMovements(productId?: string, limit = 20) {
  try {
    const movements = await prisma.inventoryMovement.findMany({
      where: productId ? { productId } : undefined,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        product: {
          select: { id: true, name: true, sku: true },
        },
        user: {
          select: { id: true, fullName: true, username: true },
        },
      },
    });

    return { success: true, movements };
  } catch (error: any) {
    return { success: false, error: error.message, movements: [] };
  }
}

export async function applyInventoryMovement(data: {
  productId: string;
  type: "IN" | "OUT" | "ADJUSTMENT" | "RETURN";
  quantity: number;
  reason: string;
  referenceType?: string;
  referenceId?: string;
  userId?: string;
}) {
  try {
    const quantity = Number(data.quantity) || 0;
    if (quantity === 0) {
      throw new Error("لا يمكن تسجيل حركة مخزون بصفر كميات");
    }

    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) throw new Error("Product not found");

    const previousStock = product.stockQuantity;
    const nextStock = previousStock + quantity;

    if (data.type === "OUT" && nextStock < 0) {
      throw new Error(`لا يوجد مخزون كافٍ لـ ${product.name}. الرصيد الحالي: ${previousStock}`);
    }

    const [updatedProduct, movement] = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: data.productId },
        data: {
          stockQuantity: nextStock,
        },
      });

      const record = await tx.inventoryMovement.create({
        data: {
          productId: data.productId,
          type: data.type,
          reason: data.reason,
          quantity,
          previousStock,
          newStock: updated.stockQuantity,
          referenceType: data.referenceType ?? null,
          referenceId: data.referenceId ?? null,
          userId: data.userId ?? null,
        },
      });

      return [updated, record] as const;
    });

    if (data.referenceType !== "INVOICE") {
      const typeLabel = data.type === "IN" ? "توريد" : data.type === "OUT" ? "صرف" : data.type === "RETURN" ? "إرجاع" : "تسوية";
      await createActivityLog({
        title: `حركة مخزون (${typeLabel}) - ${product.name}`,
        details: `${data.reason} (الكمية: ${Math.abs(quantity)})`,
        type: data.type === "IN" ? "SUCCESS" : data.type === "OUT" ? "WARNING" : "INFO",
        userId: data.userId,
      });
    }

    revalidatePath("/inventory");
    revalidatePath("/");

    return { success: true, product: updatedProduct, movement };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function issueProductStock(data: {
  productId: string;
  quantity: number;
  reason: string;
  referenceType?: string;
  referenceId?: string;
  userId?: string;
}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "يجب تسجيل الدخول أولاً" };
    }

    const permissions = getEffectivePermissions(currentUser);
    if (permissions.actions.stockIssue === false) {
      return { success: false, error: "ليس لديك صلاحية صرف المخزون" };
    }

    const qty = Math.abs(Number(data.quantity) || 0);
    if (qty <= 0) {
      return { success: false, error: "يجب إدخال كمية صادرة أكبر من صفر" };
    }

    return applyInventoryMovement({
      ...data,
      userId: data.userId ?? currentUser.id,
      type: "OUT",
      quantity: -qty,
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function returnProductStock(data: {
  productId: string;
  quantity: number;
  reason: string;
  referenceType?: string;
  referenceId?: string;
  userId?: string;
}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "يجب تسجيل الدخول أولاً" };
    }

    const permissions = getEffectivePermissions(currentUser);
    if (permissions.actions.stockReturn === false) {
      return { success: false, error: "ليس لديك صلاحية إرجاع المخزون" };
    }

    const qty = Math.abs(Number(data.quantity) || 0);
    if (qty <= 0) {
      return { success: false, error: "يجب إدخال كمية مرتجعة أكبر من صفر" };
    }

    return applyInventoryMovement({
      ...data,
      userId: data.userId ?? currentUser.id,
      type: "RETURN",
      quantity: qty,
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function adjustProductStock(data: {
  productId: string;
  quantityDelta: number;
  reason: string;
  referenceType?: string;
  referenceId?: string;
  userId?: string;
}) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: "يجب تسجيل الدخول أولاً" };
    }

    const permissions = getEffectivePermissions(currentUser);
    if (permissions.actions.stockAdjust === false) {
      return { success: false, error: "ليس لديك صلاحية تعديل المخزون" };
    }

    const delta = Number(data.quantityDelta) || 0;
    if (delta === 0) {
      return { success: false, error: "يجب إدخال فرق كميّة للتعديل" };
    }

    return applyInventoryMovement({
      productId: data.productId,
      type: "ADJUSTMENT",
      quantity: delta,
      reason: data.reason,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      userId: data.userId ?? currentUser.id,
    });
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInventory() {
  try {
    const [products, suppliers, settings, movements] = await Promise.all([
      prisma.product.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.supplier.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.shopSettings.findUnique({
        where: { id: "default" },
      }),
      prisma.inventoryMovement.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          user: { select: { id: true, fullName: true, username: true } },
        },
      }),
    ]);
    return { success: true, products, suppliers, settings, movements };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function restockProduct(data: {
  productId: string;
  addedQuantity: number;
  costPrice: number;
  supplierId?: string;
  createExpenseRecord?: boolean;
}) {
  try {
    const product = await prisma.product.findUnique({ where: { id: data.productId } });
    if (!product) throw new Error("Product not found");

    const result = await applyInventoryMovement({
      productId: data.productId,
      type: "IN",
      quantity: data.addedQuantity,
      reason: `توريد مخزون - ${product.name}`,
      referenceType: data.supplierId ? "SUPPLIER" : "DIRECT",
      referenceId: data.supplierId ?? undefined,
    });

    if (!result.success) {
      return result;
    }

    await prisma.product.update({
      where: { id: data.productId },
      data: {
        costPrice: data.costPrice,
      },
    });

    if (data.createExpenseRecord) {
      await prisma.expense.create({
        data: {
          category: "مشتريات بضاعة مكتبية",
          description: `شراء وتوريد ${data.addedQuantity} ${product.unit} من (${product.name})`,
          amount: data.addedQuantity * data.costPrice,
          supplierId: data.supplierId || null,
        },
      });
    }

    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createProduct(data: {
  sku: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  minNegotiablePrice: number;
  stockQuantity: number;
  minStockAlert: number;
}) {
  try {
    await prisma.product.create({ data });
    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. Contracts
export async function getContracts() {
  try {
    const [contracts, customers, settings] = await Promise.all([
      prisma.contract.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          customer: true,
          items: true,
        },
      }),
      prisma.customer.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.shopSettings.findUnique({
        where: { id: "default" },
      }),
    ]);

    const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    const prefix = settings?.branchPrefix || "KHW";
    const count = await prisma.contract.count({
      where: {
        contractCode: {
          contains: `-CNT-${dateStr}-`,
        },
      },
    });
    const nextCode = `${prefix}-CNT-${dateStr}-${String(count + 1).padStart(3, "0")}`;

    return { success: true, contracts, customers, settings, nextCode };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getContractById(id: string) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        customer: true,
        items: true,
      },
    });
    const settings = await prisma.shopSettings.findUnique({
      where: { id: "default" },
    });
    return { success: true, contract, settings };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createContract(data: {
  contractCode: string;
  customerId: string;
  title: string;
  startDate: string;
  endDate: string;
  billingCycle: string;
  totalValue: number;
  terms: string;
  notes?: string;
  items: {
    description: string;
    periodicQuantity: number;
    unitPrice: number;
    total: number;
  }[];
}) {
  try {
    const contract = await prisma.contract.create({
      data: {
        contractCode: data.contractCode,
        customerId: data.customerId,
        title: data.title,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        billingCycle: data.billingCycle,
        totalValue: data.totalValue,
        terms: data.terms,
        notes: data.notes || null,
        items: {
          create: data.items.map((it) => ({
            description: it.description,
            periodicQuantity: it.periodicQuantity,
            unitPrice: it.unitPrice,
            total: it.total,
          })),
        },
      },
    });

    const currentUser = await getCurrentUser();
    await createActivityLog({
      title: `إبرام عقد دوري جديد (${contract.contractCode})`,
      details: `${data.title} بقيمة إجمالية: ${data.totalValue} ج.س (دورة: ${data.billingCycle})`,
      type: "SUCCESS",
      userId: currentUser?.id,
    });

    revalidatePath("/contracts");
    return { success: true, contractId: contract.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 6. Settings & Pricing Matrix
export async function getSettings() {
  try {
    const [settings, pricingTiers, employees] = await Promise.all([
      prisma.shopSettings.findUnique({ where: { id: "default" } }),
      prisma.pricingTier.findMany({ orderBy: { itemName: "asc" } }),
      prisma.employee.findMany({ orderBy: { name: "asc" } }),
    ]);
    return { success: true, settings, pricingTiers, employees };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateShopSettings(data: any) {
  try {
    await prisma.shopSettings.upsert({
      where: { id: "default" },
      update: data,
      create: { ...data, id: "default" },
    });
    revalidatePath("/settings");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function savePricingTier(data: {
  id?: string;
  itemName: string;
  unit: string;
  baseCost: number;
  officialPrice: number;
  minNegotiablePrice: number;
  wholesalePrice: number;
  isActive?: boolean;
}) {
  try {
    if (data.id) {
      await prisma.pricingTier.update({
        where: { id: data.id },
        data: {
          itemName: data.itemName,
          unit: data.unit,
          baseCost: data.baseCost,
          officialPrice: data.officialPrice,
          minNegotiablePrice: data.minNegotiablePrice,
          wholesalePrice: data.wholesalePrice,
          isActive: data.isActive ?? true,
        },
      });
    } else {
      await prisma.pricingTier.create({
        data: {
          itemName: data.itemName,
          unit: data.unit,
          baseCost: data.baseCost,
          officialPrice: data.officialPrice,
          minNegotiablePrice: data.minNegotiablePrice,
          wholesalePrice: data.wholesalePrice,
          isActive: true,
        },
      });
    }
    revalidatePath("/settings");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 7. Users & Permissions Management
export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, users };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveUser(data: {
  id?: string;
  username: string;
  fullName: string;
  role: string;
  isActive?: boolean;
  password?: string;
  phone?: string;
  notes?: string;
  permissions?: Record<string, any> | null;
}) {
  try {
    const normalizedUsername = data.username.trim().toLowerCase();
    const baseData = {
      username: normalizedUsername,
      fullName: data.fullName,
      role: data.role,
      isActive: data.isActive ?? true,
      phone: data.phone || null,
      notes: data.notes || null,
      permissions: data.permissions ?? normalizePermissions({}, data.role),
    };

    if (data.id) {
      await prisma.user.update({
        where: { id: data.id },
        data: {
          ...baseData,
          ...(data.password ? { passwordHash: hashPassword(data.password) } : {}),
        },
      });
    } else {
      if (!data.password) {
        return { success: false, error: "يرجى إدخال كلمة المرور للمستخدم الجديد" };
      }

      await prisma.user.create({
        data: {
          ...baseData,
          passwordHash: hashPassword(data.password),
        },
      });
    }
    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 8. Employees & Staff Salaries
export async function getEmployeesAndSalaries() {
  try {
    const [employees, salaryTransactions, settings] = await Promise.all([
      prisma.employee.findMany({
        orderBy: { joinedAt: "desc" },
        include: {
          transactions: {
            orderBy: { paidAt: "desc" },
            take: 5,
          },
          _count: {
            select: { tasks: true, transactions: true },
          },
        },
      }),
      prisma.salaryTransaction.findMany({
        orderBy: { paidAt: "desc" },
        include: { employee: true },
        take: 30,
      }),
      prisma.shopSettings.findUnique({ where: { id: "default" } }),
    ]);

    const totalSalariesPaid = salaryTransactions.reduce((acc, curr) => acc + curr.amountPaid, 0);

    return {
      success: true,
      employees,
      salaryTransactions,
      totalSalariesPaid,
      currency: settings?.currency || "ج.س",
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function saveEmployee(data: {
  id?: string;
  name: string;
  jobTitle: string;
  payType: string;
  baseRate: number;
  phone?: string;
  status?: string;
}) {
  try {
    if (data.id) {
      await prisma.employee.update({
        where: { id: data.id },
        data: {
          name: data.name,
          jobTitle: data.jobTitle,
          payType: data.payType,
          baseRate: data.baseRate,
          phone: data.phone || null,
          status: data.status || "ACTIVE",
        },
      });
    } else {
      await prisma.employee.create({
        data: {
          name: data.name,
          jobTitle: data.jobTitle,
          payType: data.payType,
          baseRate: data.baseRate,
          phone: data.phone || null,
          status: data.status || "ACTIVE",
        },
      });
    }
    revalidatePath("/employees");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteEmployee(id: string) {
  try {
    await prisma.employee.delete({ where: { id } });
    revalidatePath("/employees");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function recordSalaryPayment(data: {
  employeeId: string;
  amountPaid: number;
  payPeriod: string;
  notes?: string;
}) {
  try {
    const employee = await prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!employee) throw new Error("الموظف غير موجود");

    // 1. Create Salary Transaction
    await prisma.salaryTransaction.create({
      data: {
        employeeId: data.employeeId,
        amountPaid: data.amountPaid,
        payPeriod: data.payPeriod,
        notes: data.notes || null,
      },
    });

    // 2. Also record in General Expenses for ledger consistency
    await prisma.expense.create({
      data: {
        category: "رواتب وأجور عاملين",
        description: `صرف مرتب ${data.payPeriod} للموظف (${employee.name} - ${employee.jobTitle})`,
        amount: data.amountPaid,
      },
    });

    revalidatePath("/employees");
    revalidatePath("/expenses");
    revalidatePath("/reports");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 9. Expenses & Outflows Management
export async function getExpenses() {
  try {
    const [expenses, suppliers, settings] = await Promise.all([
      prisma.expense.findMany({
        orderBy: { date: "desc" },
        include: { supplier: true },
      }),
      prisma.supplier.findMany({ orderBy: { name: "asc" } }),
      prisma.shopSettings.findUnique({ where: { id: "default" } }),
    ]);

    const totalExpenseAmount = expenses.reduce((acc, curr) => acc + curr.amount, 0);

    return {
      success: true,
      expenses,
      suppliers,
      totalExpenseAmount,
      currency: settings?.currency || "ج.س",
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function createExpense(data: {
  category: string;
  description: string;
  amount: number;
  supplierId?: string;
  date?: string;
}) {
  try {
    const expense = await prisma.expense.create({
      data: {
        category: data.category,
        description: data.description,
        amount: data.amount,
        supplierId: data.supplierId || null,
        date: data.date ? new Date(data.date) : new Date(),
      },
    });

    const currentUser = await getCurrentUser();
    await createActivityLog({
      title: `سند صرف مصروفات (${data.category})`,
      details: `${data.description} بمبلغ: ${data.amount} ج.س`,
      type: "WARNING",
      userId: currentUser?.id,
    });

    revalidatePath("/expenses");
    revalidatePath("/reports");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteExpense(id: string) {
  try {
    const expense = await prisma.expense.findUnique({ where: { id } });
    await prisma.expense.delete({ where: { id } });

    if (expense) {
      const currentUser = await getCurrentUser();
      await createActivityLog({
        title: `حذف سند مصروفات (${expense.category})`,
        details: `تم حذف المصروف: ${expense.description} بمبلغ: ${expense.amount} ج.س`,
        type: "WARNING",
        userId: currentUser?.id,
      });
    }

    revalidatePath("/expenses");
    revalidatePath("/reports");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 10. Financial & Operational Reports
export async function getReportsData(filters?: { startDate?: string; endDate?: string }) {
  try {
    const whereDate: any = {};
    if (filters?.startDate && filters?.endDate) {
      whereDate.gte = new Date(filters.startDate);
      whereDate.lte = new Date(filters.endDate);
    }

    const invoiceWhere = Object.keys(whereDate).length > 0 ? { createdAt: whereDate } : {};
    const expenseWhere = Object.keys(whereDate).length > 0 ? { date: whereDate } : {};
    const inventoryWhere = Object.keys(whereDate).length > 0 ? { createdAt: whereDate } : {};

    const [invoices, expenses, settings, products, employees, inventoryMovements] = await Promise.all([
      prisma.invoice.findMany({
        where: invoiceWhere,
        include: { items: true, customer: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.expense.findMany({
        where: expenseWhere,
        include: { supplier: true },
        orderBy: { date: "desc" },
      }),
      prisma.shopSettings.findUnique({ where: { id: "default" } }),
      prisma.product.findMany(),
      prisma.employee.findMany({ include: { transactions: true } }),
      prisma.inventoryMovement.findMany({
        where: inventoryWhere,
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          user: { select: { id: true, fullName: true, username: true } },
        },
      }),
    ]);

    // Financial Computations
    const totalSales = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const totalCollected = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
    const receivables = totalSales - totalCollected;
    const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
    const netProfit = totalCollected - totalExpenses; // Cash basis net profit

    // Category-wise expenses
    const expensesByCategory: Record<string, number> = {};
    expenses.forEach((e) => {
      expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
    });

    // Breakdown: Custom print sales vs Retail stock sales
    let printSalesTotal = 0;
    let retailSalesTotal = 0;
    invoices.forEach((inv) => {
      inv.items.forEach((item) => {
        if (item.itemType === "PRINT") {
          printSalesTotal += item.total;
        } else {
          retailSalesTotal += item.total;
        }
      });
    });

    // Top selling products / services
    const itemMap: Record<string, { name: string; count: number; total: number }> = {};
    invoices.forEach((inv) => {
      inv.items.forEach((item) => {
        if (!itemMap[item.description]) {
          itemMap[item.description] = { name: item.description, count: 0, total: 0 };
        }
        itemMap[item.description].count += item.quantity;
        itemMap[item.description].total += item.total;
      });
    });
    const topItems = Object.values(itemMap).sort((a, b) => b.total - a.total).slice(0, 8);

    // Inventory Valuation
    const inventoryValuation = products.reduce((acc, p) => acc + p.stockQuantity * p.costPrice, 0);
    const lowStockCount = products.filter((p) => p.stockQuantity <= p.minStockAlert).length;

    const totalSalariesPaid = employees.reduce((acc, employee) => {
      const empTotal = (employee.transactions || []).reduce((sum, tx) => sum + tx.amountPaid, 0);
      return acc + empTotal;
    }, 0);

    return {
      success: true,
      summary: {
        totalSales,
        totalCollected,
        receivables,
        totalExpenses,
        netProfit,
        printSalesTotal,
        retailSalesTotal,
        inventoryValuation,
        currency: settings?.currency || "ج.س",
      },
      expensesByCategory,
      topItems,
      invoices,
      expenses,
      inventoryMovements,
      employees,
      salarySummary: {
        totalSalariesPaid,
        employeeCount: employees.length,
      },
      inventorySummary: {
        totalProducts: products.length,
        lowStockCount,
        inventoryValuation,
        totalUnits: products.reduce((acc, p) => acc + p.stockQuantity, 0),
      },
      settings,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 12. Customers Management
export async function getCustomersList() {
  try {
    const [customers, settings] = await Promise.all([
      prisma.customer.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { invoices: true, contracts: true },
          },
          invoices: {
            select: {
              id: true,
              totalAmount: true,
              paidAmount: true,
            },
          },
        },
      }),
      prisma.shopSettings.findUnique({ where: { id: "default" } }),
    ]);

    const formatted = customers.map((c) => {
      const totalInvoiced = c.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalPaid = c.invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
      const outstandingBalance = totalInvoiced - totalPaid;
      return {
        ...c,
        totalInvoiced,
        totalPaid,
        outstandingBalance,
      };
    });

    return {
      success: true,
      customers: formatted,
      currency: settings?.currency || "ج.س",
    };
  } catch (error: any) {
    return { success: false, error: error.message, customers: [] };
  }
}

export async function saveCustomer(data: {
  id?: string;
  name: string;
  companyName?: string;
  phone: string;
  taxNumber?: string;
}) {
  try {
    const currentUser = await getCurrentUser();
    let customer;

    if (data.id) {
      customer = await prisma.customer.update({
        where: { id: data.id },
        data: {
          name: data.name,
          companyName: data.companyName || null,
          phone: data.phone,
          taxNumber: data.taxNumber || null,
        },
      });

      await createActivityLog({
        title: `تعديل بيانات العميل (${customer.name})`,
        details: `رقم الهاتف: ${customer.phone}`,
        type: "INFO",
        userId: currentUser?.id,
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          name: data.name,
          companyName: data.companyName || null,
          phone: data.phone,
          taxNumber: data.taxNumber || null,
        },
      });

      await createActivityLog({
        title: `إضافة عميل جديد (${customer.name})`,
        details: `رقم الهاتف: ${customer.phone}`,
        type: "SUCCESS",
        userId: currentUser?.id,
      });
    }

    revalidatePath("/customers");
    revalidatePath("/invoices");
    revalidatePath("/contracts");
    revalidatePath("/");
    return { success: true, customer };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCustomer(id: string) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { invoices: true, contracts: true },
        },
      },
    });

    if (!customer) {
      return { success: false, error: "العميل غير موجود" };
    }

    if (customer._count.invoices > 0 || customer._count.contracts > 0) {
      return {
        success: false,
        error: `لا يمكن حذف العميل لوجود (${customer._count.invoices}) فواتير و (${customer._count.contracts}) عقود مرتبطة به.`,
      };
    }

    await prisma.customer.delete({ where: { id } });

    const currentUser = await getCurrentUser();
    await createActivityLog({
      title: `حذف عميل (${customer.name})`,
      details: `تم حذف العميل بنجاح`,
      type: "WARNING",
      userId: currentUser?.id,
    });

    revalidatePath("/customers");
    revalidatePath("/invoices");
    revalidatePath("/contracts");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 13. Suppliers Management
export async function getSuppliersList() {
  try {
    const [suppliers, settings] = await Promise.all([
      prisma.supplier.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { expenses: true },
          },
          expenses: {
            select: {
              id: true,
              amount: true,
              date: true,
              description: true,
            },
          },
        },
      }),
      prisma.shopSettings.findUnique({ where: { id: "default" } }),
    ]);

    const formatted = suppliers.map((s) => {
      const totalSupplied = s.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      return {
        ...s,
        totalSupplied,
      };
    });

    return {
      success: true,
      suppliers: formatted,
      currency: settings?.currency || "ج.س",
    };
  } catch (error: any) {
    return { success: false, error: error.message, suppliers: [] };
  }
}

export async function saveSupplier(data: {
  id?: string;
  name: string;
  contactPerson?: string;
  phone: string;
  supplyType: string;
}) {
  try {
    const currentUser = await getCurrentUser();
    let supplier;

    if (data.id) {
      supplier = await prisma.supplier.update({
        where: { id: data.id },
        data: {
          name: data.name,
          contactPerson: data.contactPerson || null,
          phone: data.phone,
          supplyType: data.supplyType,
        },
      });

      await createActivityLog({
        title: `تعديل بيانات المورد (${supplier.name})`,
        details: `النوع: ${supplier.supplyType} - هاتف: ${supplier.phone}`,
        type: "INFO",
        userId: currentUser?.id,
      });
    } else {
      supplier = await prisma.supplier.create({
        data: {
          name: data.name,
          contactPerson: data.contactPerson || null,
          phone: data.phone,
          supplyType: data.supplyType,
        },
      });

      await createActivityLog({
        title: `إضافة مورد جديد (${supplier.name})`,
        details: `النوع: ${supplier.supplyType} - هاتف: ${supplier.phone}`,
        type: "SUCCESS",
        userId: currentUser?.id,
      });
    }

    revalidatePath("/suppliers");
    revalidatePath("/expenses");
    revalidatePath("/inventory");
    revalidatePath("/");
    return { success: true, supplier };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSupplier(id: string) {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        _count: {
          select: { expenses: true },
        },
      },
    });

    if (!supplier) {
      return { success: false, error: "المورد غير موجود" };
    }

    if (supplier._count.expenses > 0) {
      return {
        success: false,
        error: `لا يمكن حذف المورد لوجود (${supplier._count.expenses}) سندات مصروفات ومشتريات مسجلة باسمه.`,
      };
    }

    await prisma.supplier.delete({ where: { id } });

    const currentUser = await getCurrentUser();
    await createActivityLog({
      title: `حذف مورد (${supplier.name})`,
      details: `تم حذف المورد بنجاح`,
      type: "WARNING",
      userId: currentUser?.id,
    });

    revalidatePath("/suppliers");
    revalidatePath("/expenses");
    revalidatePath("/inventory");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


