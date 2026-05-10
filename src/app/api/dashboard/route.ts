import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/dashboard — dashboard statistics
export async function GET(request: NextRequest) {
  try {
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

    // Chart period start
    const chartDays = parseInt(period, 10) === 30 ? 30 : 7;
    const chartStart = new Date(todayStart);
    chartStart.setDate(chartStart.getDate() - (chartDays - 1));

    // Run all queries in parallel
    const [
      salesToday,
      salesWeek,
      salesMonth,
      totalRevenue,
      totalProducts,
      lowStockRows,
      lowStockProductRows,
      recentSales,
      topProducts,
      totalExpenses,
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

      // Total revenue (all time)
      db.sale.aggregate({
        _sum: { finalAmount: true },
      }),

      // Total active products
      db.product.count({ where: { isActive: true } }),

      // Low stock products (stock <= minStock)
      // Prisma doesn't support field-to-field comparison, so use raw SQL
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
      const dayEnd = new Date(day);
      dayEnd.setDate(dayEnd.getDate() + 1);

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
        totalRevenue: totalRevenue._sum.finalAmount ?? 0,
        totalProducts,
        lowStockCount: Number((lowStockRows as Array<{ count: number }>)[0]?.count ?? 0),
        lowStockProducts: lowStockProductRows as Array<Record<string, unknown>>,
        recentSales,
        topSellingProducts,
        chartData,
        totalExpensesThisMonth: totalExpenses._sum.amount ?? 0,
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
