import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/sales/[id] — get single sale with items
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const sale = await db.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: { product: true },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!sale) {
      return NextResponse.json(
        { success: false, error: "فاکتور یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: sale });
  } catch (error) {
    console.error("Error fetching sale:", error);
    return NextResponse.json(
      { success: false, error: "خطا در دریافت فاکتور" },
      { status: 500 }
    );
  }
}
