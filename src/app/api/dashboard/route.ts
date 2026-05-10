import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/validate-auth";

// Convert BigInt values to Number for JSON serialization
function serialize<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "bigint") return Number(obj) as unknown as T;
  if (Array.isArray(obj)) return obj.map(serialize) as unknown as T;
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const key in obj as Record<string, unknown>) {
      result[key] = serialize((obj as Record<string, unknown>)[key]);
    }
    return result as unknown as T;
  }
  return obj;
}

// GET /api/dashboard — dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request as any)
    if (!auth.valid) return auth.response

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "7"; // 7 or 30 days for chart

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Week start (Saturday in Persian calendar context, but using ISO Monday here)
    const weekStart = new Date(todayStart);
    const dayOfWeek = weekStart.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Monday as start
    weekStart.setDate(weekStart.getDate() - diff);

    // Month start
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Previous month
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Chart period start
    const chartDays = parseInt(period, 10) === 30 ? 30 : 7;
    const chartStart = new Date(todayStart);
    chartStart.setDate(chartStart.getDate() - (chartDays - 1));

    // Run all queries in parallel
    const [
      salesToday,
      salesWeek,
      salesMonth,
      prevMonthSales,
      totalRevenue,
      totalProducts,
      lowStockRows,
      lowStockProductRows,
      recentSales,
      topProducts,
      totalExpenses,
      totalCustomers,
      categoryRevenue,
    ] = await Promise.all([
      // Sales today
      db.sale.aggregate({
        where: { createdAt: { gte: todayStart } },
        _count: true,
        _sum: { finalAmount: true },
      }),

      // Sales this week
      db.sale.aggregate({
        where: { createdAt: { gte: weekStart } },
        _count: true,
        _sum: { finalAmount: true },
      }),

      // Sales this month
      db.sale.aggregate({
        where: { createdAt: { gte: monthStart } },
        _count: true,
        _sum: { finalAmount: true },
      }),

      // Previous month sales (for comparison)
      db.sale.aggregate({
        where: { createdAt: { gte: prevMonthStart, lte: prevMonthEnd } },
        _count: true,
        _sum: { finalAmount: true },
      }),

      // Total revenue (all time)
      db.sale.aggregate({
        _sum: { finalAmount: true },
      }),

      // Total active products
      db.product.count({ where: { isActive: true } }),

      // Low stock products (stock <= minStock)
      db.$queryRaw`SELECT COUNT(*) as count FROM Product WHERE isActive = 1 AND stock <= minStock`,

      // Low stock products details (up to 10)
      db.$queryRaw`
        SELECT p.* FROM Product p WHERE p.isActive = 1 AND p.stock <= p.minStock ORDER BY p.stock ASC LIMIT 10
      `,

      // Recent sales (last 10)
      db.sale.findMany({
        include: {
          customer: true,
          items: { include: { product: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),

      // Top selling products (by quantity sold)
      db.saleItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10,
      }),

      // Total expenses this month
      db.expense.aggregate({
        where: { date: { gte: monthStart } },
        _sum: { amount: true },
      }),

      // Total customers
      db.customer.count(),

      // Revenue by category
      db.$queryRaw`
        SELECT 
          c.id as categoryId,
          c.name as categoryName,
          c.color as categoryColor,
          COALESCE(SUM(si.totalPrice), 0) as totalRevenue,
          COUNT(DISTINCT si.saleId) as totalSales
        FROM Category c
        LEFT JOIN Product p ON p.categoryId = c.id
        LEFT JOIN SaleItem si ON si.productId = p.id
        GROUP BY c.id, c.name, c.color
        ORDER BY totalRevenue DESC
      `,
    ]);

    // Fetch product details for top products
    const topProductIds = topProducts.map((tp) => tp.productId);
    const topProductDetails = topProductIds.length > 0
      ? await db.product.findMany({
          where: { id: { in: topProductIds } },
        })
      : [];

    const topSellingProducts = topProducts.map((tp) => {
      const product = topProductDetails.find((p) => p.id === tp.productId);
      return {
        productId: tp.productId,
        productName: product?.name || "نامشخص",
        totalQuantity: tp._sum.quantity ?? 0,
        totalRevenue: tp._sum.totalPrice ?? 0,
      };
    });

    // Sales chart data
    const chartData: Array<{ date: string; sales: number; revenue: number }> = [];
    for (let i = 0; i < chartDays; i++) {
      const day = new Date(chartStart);
      day.setDate(day.getDate() + i);
      const dayLabel = day.toLocaleDateString("fa-IR", {
        month: "short",
        day: "numeric",
      });

      chartData.push({
        date: dayLabel,
        sales: 0,
        revenue: 0,
      });
    }

    // Fill chart data from actual sales
    const chartSales = await db.sale.findMany({
      where: { createdAt: { gte: chartStart } },
      select: { finalAmount: true, createdAt: true },
    });

    for (const sale of chartSales) {
      const saleDate = new Date(sale.createdAt);
      const diffDays = Math.floor(
        (saleDate.getTime() - chartStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays >= 0 && diffDays < chartDays) {
        chartData[diffDays].sales += 1;
        chartData[diffDays].revenue += sale.finalAmount;
      }
    }

    // Calculate growth percentage
    const prevRevenue = prevMonthSales._sum.finalAmount ?? 0;
    const currentRevenue = salesMonth._sum.finalAmount ?? 0;
    const growthPercent = prevRevenue > 0
      ? (((currentRevenue - prevRevenue) / prevRevenue) * 100).toFixed(1)
      : "0";

    const categoryRevenueData = (categoryRevenue as Array<Record<string, unknown>>).map((cat) => ({
      categoryId: String(cat.categoryId),
      categoryName: String(cat.categoryName),
      categoryColor: String(cat.categoryColor),
      totalRevenue: Number(cat.totalRevenue),
      totalSales: Number(cat.totalSales),
    }));

    return NextResponse.json({
      success: true,
      data: {
        salesToday: {
          count: salesToday._count,
          revenue: salesToday._sum.finalAmount ?? 0,
        },
        salesWeek: {
          count: salesWeek._count,
          revenue: salesWeek._sum.finalAmount ?? 0,
        },
        salesMonth: {
          count: salesMonth._count,
          revenue: salesMonth._sum.finalAmount ?? 0,
        },
        prevMonth: {
          count: prevMonthSales._count,
          revenue: prevRevenue,
        },
        growthPercent: Number(growthPercent),
        totalRevenue: totalRevenue._sum.finalAmount ?? 0,
        totalProducts,
        totalCustomers,
        lowStockCount: Number((lowStockRows as Array<{ count: number | bigint }>)[0]?.count ?? 0),
        lowStockProducts: serialize(lowStockProductRows) as Array<Record<string, unknown>>,
        recentSales,
        topSellingProducts,
        chartData,
        totalExpensesThisMonth: totalExpenses._sum.amount ?? 0,
        categoryRevenue: categoryRevenueData,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return NextResponse.json(
      { success: false, error: "خطا در دریافت اطلاعات داشبورد" },
      { status: 500 }
    );
  }
}
