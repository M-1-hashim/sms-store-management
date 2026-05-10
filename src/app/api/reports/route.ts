import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/reports — report data based on type query
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "sales";
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    switch (type) {
      case "sales":
        return await getSalesReport(from, to, page, limit);
      case "inventory":
        return await getInventoryReport();
      case "profit":
        return await getProfitReport(from, to);
      default:
        return NextResponse.json(
          { success: false, error: "نوع گزارش نامعتبر است. نوع‌های مجاز: sales, inventory, profit" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { success: false, error: "خطا در تولید گزارش" },
      { status: 500 }
    );
  }
}

async function getSalesReport(from: string | null, to: string | null, page: number, limit: number) {
  const where: Record<string, unknown> = {};
  if (from || to) {
    where.createdAt = {};
    if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
    if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
  }

  const [sales, total, aggregates] = await Promise.all([
    db.sale.findMany({
      where,
      include: {
        customer: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.sale.count({ where }),
    db.sale.aggregate({
      where,
      _sum: { finalAmount: true, discount: true, totalAmount: true },
      _count: true,
      _avg: { finalAmount: true },
    }),
  ]);

  // Sales by payment method
  const byPaymentMethod = await db.sale.groupBy({
    by: ["paymentMethod"],
    where,
    _count: true,
    _sum: { finalAmount: true },
  });

  // Sales by date
  const salesByDate = await db.sale.findMany({
    where,
    select: {
      createdAt: true,
      finalAmount: true,
      totalAmount: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const dailySales: Record<string, number> = {};
  for (const sale of salesByDate) {
    const dateKey = new Date(sale.createdAt).toISOString().split("T")[0];
    dailySales[dateKey] = (dailySales[dateKey] || 0) + sale.finalAmount;
  }

  return NextResponse.json({
    success: true,
    data: {
      sales,
      summary: {
        totalSales: aggregates._count,
        totalRevenue: aggregates._sum.finalAmount ?? 0,
        totalDiscount: aggregates._sum.discount ?? 0,
        totalGross: aggregates._sum.totalAmount ?? 0,
        averageSale: aggregates._avg.finalAmount ?? 0,
      },
      byPaymentMethod,
      dailySales,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
}

async function getInventoryReport() {
  const [products, totalValue, lowStockProducts] = await Promise.all([
    db.product.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    db.product.aggregate({
      where: { isActive: true },
      _sum: {
        stock: true,
        buyPrice: true,  // approximate total cost value
      },
    }),
    // Low stock: Prisma can't compare fields, use raw SQL with category join
    db.$queryRaw`
      SELECT p.id, p.name, p.sku, p.barcode, p."categoryId", p."buyPrice", p."sellPrice",
             p.stock, p."minStock", p.unit, p."isActive", p.description, p."createdAt", p."updatedAt",
             c.id as "catId", c.name as "catName", c.color as "catColor"
      FROM Product p
      LEFT JOIN Category c ON p."categoryId" = c.id
      WHERE p."isActive" = 1 AND p.stock <= p."minStock"
      ORDER BY p.stock ASC
    `,
  ]);

  // Calculate total inventory value (sell price * stock)
  let totalInventoryValue = 0;
  let totalCostValue = 0;
  for (const product of products) {
    totalInventoryValue += product.sellPrice * product.stock;
    totalCostValue += product.buyPrice * product.stock;
  }

  // Products by category
  const byCategory: Record<string, { count: number; totalStock: number; value: number }> = {};
  for (const product of products) {
    const catName = product.category?.name || "بدون دسته‌بندی";
    if (!byCategory[catName]) {
      byCategory[catName] = { count: 0, totalStock: 0, value: 0 };
    }
    byCategory[catName].count += 1;
    byCategory[catName].totalStock += product.stock;
    byCategory[catName].value += product.sellPrice * product.stock;
  }

  // Map low stock rows to proper format
  const lowStockFormatted = (lowStockProducts as Array<Record<string, unknown>>).map((row) => ({
    id: row.id,
    name: row.name,
    sku: row.sku,
    barcode: row.barcode,
    categoryId: row.categoryId,
    buyPrice: row.buyPrice,
    sellPrice: row.sellPrice,
    stock: row.stock,
    minStock: row.minStock,
    unit: row.unit,
    isActive: row.isActive,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    category: row.catId ? {
      id: row.catId,
      name: row.catName,
      color: row.catColor,
    } : null,
  }));

  return NextResponse.json({
    success: true,
    data: {
      products,
      summary: {
        totalProducts: products.length,
        totalStock: totalValue._sum.stock ?? 0,
        totalInventoryValue,
        totalCostValue,
        potentialProfit: totalInventoryValue - totalCostValue,
        lowStockCount: lowStockFormatted.length,
      },
      lowStockProducts: lowStockFormatted,
      byCategory,
    },
  });
}

async function getProfitReport(from: string | null, to: string | null) {
  const saleWhere: Record<string, unknown> = {};
  const expenseWhere: Record<string, unknown> = {};

  if (from || to) {
    if (from) {
      saleWhere.createdAt = { ...saleWhere.createdAt as Record<string, unknown>, gte: new Date(from) };
      expenseWhere.date = { ...expenseWhere.date as Record<string, unknown>, gte: new Date(from) };
    }
    if (to) {
      saleWhere.createdAt = { ...saleWhere.createdAt as Record<string, unknown>, lte: new Date(to) };
      expenseWhere.date = { ...expenseWhere.date as Record<string, unknown>, lte: new Date(to) };
    }
  }

  const [
    salesAggregate,
    expenseAggregate,
    saleItems,
    expenses,
  ] = await Promise.all([
    db.sale.aggregate({
      where: saleWhere,
      _sum: { finalAmount: true, discount: true },
      _count: true,
    }),
    db.expense.aggregate({
      where: expenseWhere,
      _sum: { amount: true },
      _count: true,
    }),
    // Get sale items with product costs to calculate COGS
    db.saleItem.findMany({
      where: {
        sale: saleWhere,
      },
      include: { product: true },
    }),
    // Get expenses list
    db.expense.findMany({
      where: expenseWhere,
      orderBy: { date: "desc" },
    }),
  ]);

  const totalRevenue = salesAggregate._sum.finalAmount ?? 0;
  const totalDiscount = salesAggregate._sum.discount ?? 0;
  const totalExpenses = expenseAggregate._sum.amount ?? 0;

  // Calculate COGS (Cost of Goods Sold)
  let totalCOGS = 0;
  for (const item of saleItems) {
    totalCOGS += item.product.buyPrice * item.quantity;
  }

  const grossProfit = totalRevenue - totalCOGS;
  const netProfit = grossProfit - totalExpenses;

  // Expense breakdown by category
  const expenseByCategory: Record<string, number> = {};
  for (const expense of expenses) {
    expenseByCategory[expense.category] = (expenseByCategory[expense.category] || 0) + expense.amount;
  }

  return NextResponse.json({
    success: true,
    data: {
      summary: {
        totalRevenue,
        totalDiscount,
        netRevenue: totalRevenue - totalDiscount,
        totalCOGS,
        grossProfit,
        totalExpenses,
        netProfit,
        profitMargin: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0",
        totalSalesCount: salesAggregate._count,
        totalExpenseCount: expenseAggregate._count,
      },
      expenses,
      expenseByCategory,
    },
  });
}
