import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Qayd OS database...");

  // 1. Shop Settings
  await prisma.shopSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      shopName: "الخواض لخدمات الطباعة",
      systemName: "قَيْد",
      branchPrefix: "KHW",
      phone: "0912345678",
      email: "info@alkhawad-print.com",
      address: "السودان - الخرطوم / أم درمان - شارع العرضة",
      currency: "ج.س",
      defaultTaxRate: 0,
      invoiceFooter:
        "شكراً لتعاملكم مع الخواض لخدمات الطباعة. المطبوعات المعتمدة لا تُرد ولا تُستبدل. يرجى مراجعة البروفة بدقة قبل التوجيه للطباعة.",
      defaultContractTerms: `1. يلتزم الطرف الأول (الخواض لخدمات الطباعة) بتنفيذ وتسليم المطبوعات والبنود الموضحة وفق المواصفات المعتمدة.
2. يلتزم الطرف الثاني بدفع المستحقات المالية بحسب جدول الدفعات والشهور المحددة.
3. يحق للطرف الأول إيقاف العمل في حال تأخر السداد لأكثر من 7 أيام عمل.
4. أي تعديلات جوهرية على التصاميم المعتمدة بعد بدء مرحلة الطباعة يتحمل الطرف الثاني تكلفتها الفعلية.`,
    },
  });

  // 2. Pricing Matrix (خدمات الطباعة والتصاميم المخصصة)
  const pricingTiers = [
    {
      itemName: "كروت شخصية ديجيتال سليفان مط وجهين",
      unit: "1000 كرت",
      baseCost: 12000,
      officialPrice: 22000,
      minNegotiablePrice: 19000,
      wholesalePrice: 17000,
    },
    {
      itemName: "بروشور A4 وجهين كوشيه 150 جرام فاخر",
      unit: "1000 بروشور",
      baseCost: 35000,
      officialPrice: 58000,
      minNegotiablePrice: 50000,
      wholesalePrice: 46000,
    },
    {
      itemName: "بنر فليكس إعلاني خارجي عالي الكثافة مع حلقات",
      unit: "متر مربع",
      baseCost: 4000,
      officialPrice: 7500,
      minNegotiablePrice: 6500,
      wholesalePrice: 5800,
    },
    {
      itemName: "رول أب ستاند ألمنيوم ثقيل مع طباعة سلوفان",
      unit: "ستاند 85x200",
      baseCost: 18000,
      officialPrice: 32000,
      minNegotiablePrice: 28000,
      wholesalePrice: 25000,
    },
    {
      itemName: "طباعة وتجليد أطروحات ورسائل علمية كعب حراري هاردكفر",
      unit: "نسخة",
      baseCost: 3200,
      officialPrice: 6500,
      minNegotiablePrice: 5500,
      wholesalePrice: 4800,
    },
    {
      itemName: "فواتير وسندات قبض مكربنة 3 نسخ مرقمة ومخرومة",
      unit: "دفتر 50 مجموعة",
      baseCost: 2200,
      officialPrice: 4500,
      minNegotiablePrice: 3800,
      wholesalePrice: 3400,
    },
    {
      itemName: "أكياس ورقية دعائية طباعة كاملة فاخرة مع حبال",
      unit: "100 كيس",
      baseCost: 16000,
      officialPrice: 30000,
      minNegotiablePrice: 26000,
      wholesalePrice: 23000,
    },
    {
      itemName: "استيكر فينيل لاصق مقاوم للماء تقطيع كوتر ليزر",
      unit: "متر مربع",
      baseCost: 5200,
      officialPrice: 9500,
      minNegotiablePrice: 8200,
      wholesalePrice: 7400,
    },
  ];

  for (const tier of pricingTiers) {
    const existing = await prisma.pricingTier.findFirst({
      where: { itemName: tier.itemName },
    });
    if (!existing) {
      await prisma.pricingTier.create({ data: tier });
    }
  }

  // 3. Retail Stationery Products (مستلزمات وأدوات مكتبية)
  const products = [
    {
      sku: "PAP-A4-80",
      name: "ورق تصوير Double A وزن 80 جرام A4 أصلي",
      category: "ورق وطباعة",
      unit: "باكت 500 ورقة",
      costPrice: 4500,
      sellingPrice: 6000,
      minNegotiablePrice: 5600,
      stockQuantity: 140,
      minStockAlert: 20,
    },
    {
      sku: "BND-SP-12",
      name: "سلك زنبرك حلزوني أبيض 12 ملم للتجليد",
      category: "تجليد وتشطيب",
      unit: "علبة 100 حبة",
      costPrice: 2800,
      sellingPrice: 4200,
      minNegotiablePrice: 3700,
      stockQuantity: 42,
      minStockAlert: 10,
    },
    {
      sku: "LAM-A4-125",
      name: "شرائح بلاستيك تغليف حراري A4 سمك 125 ميكرون",
      category: "تغليف حراري",
      unit: "باكت 100 شريحة",
      costPrice: 5200,
      sellingPrice: 7500,
      minNegotiablePrice: 6800,
      stockQuantity: 28,
      minStockAlert: 8,
    },
    {
      sku: "INK-EPS-664",
      name: "حبر طابعة إبسون Epson T664 أسود أصلي 70ml",
      category: "أحبار",
      unit: "عبوة",
      costPrice: 3600,
      sellingPrice: 5400,
      minNegotiablePrice: 4900,
      stockQuantity: 16,
      minStockAlert: 5,
    },
    {
      sku: "COV-HC-A4",
      name: "غلاف شهادات فاخر مذهب هاردكفر كحلي/مارون A4",
      category: "أغلفة ومستلزمات",
      unit: "حبة",
      costPrice: 1200,
      sellingPrice: 2200,
      minNegotiablePrice: 1800,
      stockQuantity: 95,
      minStockAlert: 25,
    },
    {
      sku: "PAP-GL-230",
      name: "ورق كوشيه لماع فوتو A4 وزن 230 جرام",
      category: "ورق صور",
      unit: "باكت 50 ورقة",
      costPrice: 3900,
      sellingPrice: 5800,
      minNegotiablePrice: 5200,
      stockQuantity: 8,
      minStockAlert: 10,
    },
  ];

  for (const prod of products) {
    await prisma.product.upsert({
      where: { sku: prod.sku },
      update: {},
      create: prod,
    });
  }

  // 4. Super Admin User (for login)
  const superAdminUser = {
    username: "admin",
    fullName: "مدير خارق للنظام",
    role: "SUPER_ADMIN",
    isActive: true,
    passwordHash: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9",
    phone: "966000000000",
    notes: "حساب إدارة رئيسي للنظام. الافتراضي: admin / admin123",
  };

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      fullName: superAdminUser.fullName,
      role: superAdminUser.role,
      isActive: true,
      passwordHash: superAdminUser.passwordHash,
      phone: superAdminUser.phone,
      notes: superAdminUser.notes,
    },
    create: superAdminUser,
  });

  // 5. Employees
  const employeesData = [
    {
      name: "محمد عثمان الفكي",
      jobTitle: "مصمم جرافيك وإخراج فني",
      payType: "MONTHLY",
      baseRate: 250000,
    },
    {
      name: "عبد الرحيم الخواض",
      jobTitle: "مدير التشغيل وفني ديجيتال وأوفست",
      payType: "MONTHLY",
      baseRate: 320000,
    },
    {
      name: "طارق الفاتح",
      jobTitle: "فني قص وسلوفان وتجليد وتشطيب",
      payType: "WEEKLY",
      baseRate: 65000,
    },
    {
      name: "منى الجزولي",
      jobTitle: "مسؤولة مبيعات وكاشير وخدمة عملاء",
      payType: "MONTHLY",
      baseRate: 220000,
    },
  ];

  const createdEmployees = [];
  for (const emp of employeesData) {
    const existing = await prisma.employee.findFirst({
      where: { name: emp.name },
    });
    if (existing) {
      createdEmployees.push(existing);
    } else {
      const created = await prisma.employee.create({ data: emp });
      createdEmployees.push(created);
    }
  }

  // 5. Customers
  const customersData = [
    {
      name: "م. حسام الدين تاج السر",
      companyName: "شركة النيلين للخدمات والاستشارات الهندسية",
      phone: "0912112233",
      balance: 0,
    },
    {
      name: "أ. فاطمة محجوب",
      companyName: "مدارس الرواد النموذجية الخاصة",
      phone: "0923445566",
      balance: 45000,
    },
    {
      name: "د. سامي عبد الباقي",
      companyName: "منظمة إشراقة للتنمية المجتمعية",
      phone: "0909887766",
      balance: 0,
    },
    {
      name: "السيد عمر الفاضل",
      companyName: "سلسلة كافيهات ومطاعم أروما",
      phone: "0112334455",
      balance: 18000,
    },
  ];

  const createdCustomers = [];
  for (const cust of customersData) {
    const existing = await prisma.customer.findFirst({
      where: { phone: cust.phone },
    });
    if (existing) {
      createdCustomers.push(existing);
    } else {
      const created = await prisma.customer.create({ data: cust });
      createdCustomers.push(created);
    }
  }

  // 6. Suppliers
  const suppliersData = [
    {
      name: "شركة الرائد لتجارة الورق ومستلزمات المطابع",
      contactPerson: "المهندس أسامة",
      phone: "0918776655",
      supplyType: "ورق وخامات وبورد",
      balance: 0,
    },
    {
      name: "وكالة النجوم لأحبار وقطع غيار ماكينات التصوير",
      contactPerson: "أحمد النجوم",
      phone: "0922331100",
      supplyType: "أحبار ورؤوس طباعة وصيانة",
      balance: 0,
    },
  ];

  const createdSuppliers = [];
  for (const supp of suppliersData) {
    const existing = await prisma.supplier.findFirst({
      where: { name: supp.name },
    });
    if (existing) {
      createdSuppliers.push(existing);
    } else {
      const created = await prisma.supplier.create({ data: supp });
      createdSuppliers.push(created);
    }
  }

  // 7. Sample Invoices with Tasks & Items
  const invoice1Code = "KHW-INV-260925-001";
  const existingInv1 = await prisma.invoice.findUnique({
    where: { invoiceCode: invoice1Code },
  });

  if (!existingInv1) {
    const inv1 = await prisma.invoice.create({
      data: {
        invoiceCode: invoice1Code,
        customerId: createdCustomers[0]?.id,
        clientName: "شركة النيلين للخدمات والاستشارات الهندسية",
        clientPhone: "0912112233",
        subtotal: 54000,
        discountRate: 0,
        discountAmount: 0,
        taxRate: 0,
        taxAmount: 0,
        totalAmount: 54000,
        paidAmount: 54000,
        status: "PAID",
        items: {
          create: [
            {
              itemType: "PRINT",
              description: "كروت شخصية ديجيتال سليفان مط وجهين (طاقم المهندسين)",
              quantity: 2,
              unitPrice: 21000,
              total: 42000,
            },
            {
              itemType: "RETAIL",
              description: "ورق تصوير Double A وزن 80 جرام A4 أصلي",
              quantity: 2,
              unitPrice: 6000,
              total: 12000,
            },
          ],
        },
        tasks: {
          create: [
            {
              title: "تجهيز وتدقيق تصاميم كروت المهندسين",
              stage: "DESIGN",
              status: "COMPLETED",
              priority: "NORMAL",
              assignedToId: createdEmployees[0]?.id,
              completedAt: new Date(),
            },
            {
              title: "طباعة ديجيتال وسلوفان مط للكمية 2000 كرت",
              stage: "PRINTING",
              status: "COMPLETED",
              priority: "NORMAL",
              assignedToId: createdEmployees[1]?.id,
              completedAt: new Date(),
            },
            {
              title: "قص ليزري وتشطيب حواف العلب",
              stage: "FINISHING",
              status: "COMPLETED",
              priority: "NORMAL",
              assignedToId: createdEmployees[2]?.id,
              completedAt: new Date(),
            },
            {
              title: "تسليم الطلبية للمهندس حسام في مقر الشركة",
              stage: "DELIVERY",
              status: "COMPLETED",
              priority: "NORMAL",
              completedAt: new Date(),
            },
          ],
        },
      },
    });
  }

  const invoice2Code = "KHW-INV-260925-002";
  const existingInv2 = await prisma.invoice.findUnique({
    where: { invoiceCode: invoice2Code },
  });

  if (!existingInv2) {
    await prisma.invoice.create({
      data: {
        invoiceCode: invoice2Code,
        customerId: createdCustomers[1]?.id,
        clientName: "مدارس الرواد النموذجية الخاصة",
        clientPhone: "0923445566",
        subtotal: 95000,
        discountRate: 5,
        discountAmount: 4750,
        taxRate: 0,
        taxAmount: 0,
        totalAmount: 90250,
        paidAmount: 50000,
        status: "PARTIAL",
        items: {
          create: [
            {
              itemType: "PRINT",
              description: "بروشور A4 تعريفي ببدء العام الدراسي الجديد (كوشيه 150ج)",
              quantity: 1,
              unitPrice: 55000,
              total: 55000,
            },
            {
              itemType: "PRINT",
              description: "دفاتر استلام ورسوم ومقبوضات مرقمة 3 نسخ",
              quantity: 10,
              unitPrice: 4000,
              total: 40000,
            },
          ],
        },
        tasks: {
          create: [
            {
              title: "تعديل شعار الرواد وجدول الرسوم على البروشور",
              stage: "DESIGN",
              status: "COMPLETED",
              priority: "URGENT",
              assignedToId: createdEmployees[0]?.id,
              completedAt: new Date(),
            },
            {
              title: "سحب أوفست للبروشور وطباعة دفاتر المقبوضات",
              stage: "PRINTING",
              status: "IN_PROGRESS",
              priority: "URGENT",
              assignedToId: createdEmployees[1]?.id,
            },
            {
              title: "تجميع وتخريم وتكعيب دفاتر الرسوم 3 نسخ",
              stage: "FINISHING",
              status: "PENDING",
              priority: "NORMAL",
              assignedToId: createdEmployees[2]?.id,
            },
            {
              title: "تجهيز الطرود للتسليم لإدارة المدرسة",
              stage: "DELIVERY",
              status: "PENDING",
              priority: "NORMAL",
            },
          ],
        },
      },
    });
  }

  // 8. Sample Contract
  const contractCode = "KHW-CNT-260925-001";
  const existingContract = await prisma.contract.findUnique({
    where: { contractCode },
  });

  if (!existingContract && createdCustomers[3]) {
    await prisma.contract.create({
      data: {
        contractCode,
        customerId: createdCustomers[3].id,
        title: "عقد توريد مطبوعات دورية وأكياس ورقية لمطاعم أروما",
        startDate: new Date("2026-10-01"),
        endDate: new Date("2027-09-30"),
        billingCycle: "شهري",
        totalValue: 360000,
        status: "ACTIVE",
        terms: `1. يلتزم الطرف الأول (الخواض لخدمات الطباعة) بتجهيز 1500 كيس ورقي دعائي و 20 دفتر طلبات شهرياً.
2. يتم فحص الجودة ومطابقة الألوان بدقة وفق الهوية المعتمدة لسلسلة أروما.
3. الدفع في الأسبوع الأول من كل شهر ميلادي بصورة دورية منتظمة.`,
        items: {
          create: [
            {
              description: "أكياس ورقية مطبوعة مقاس وسط (شهري)",
              periodicQuantity: 15,
              unitPrice: 20000,
              total: 300000,
            },
            {
              description: "دفاتر كابتن أوردر 2 نسخة مكربن (شهري)",
              periodicQuantity: 20,
              unitPrice: 3000,
              total: 60000,
            },
          ],
        },
      },
    });
  }

  // 9. Sample Expenses
  await prisma.expense.createMany({
    data: [
      {
        category: "خامات/ورق",
        description: "شراء 20 كرتونة ورق تصوير Double A 80g للإنتاج",
        amount: 85000,
        supplierId: createdSuppliers[0]?.id,
      },
      {
        category: "أحبار",
        description: "تعبئة حبر أزرق وأسود لطابعة الفليكس الخارجية",
        amount: 28000,
        supplierId: createdSuppliers[1]?.id,
      },
      {
        category: "كهرباء/وقود مولدات",
        description: "وقود جازولين للمولد لتأمين استمرار سحب الأوفست",
        amount: 15000,
      },
    ],
  });

  console.log("Qayd OS database seeding completed successfully! ✨");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
