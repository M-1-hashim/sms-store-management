import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

// DELETE /api/expenses/[id] — delete expense
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await db.expense.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "هزینه یافت نشد" },
        { status: 404 }
      );
    }

    await db.expense.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return NextResponse.json(
      { success: false, error: "خطا در حذف هزینه" },
      { status: 500 }
    );
  }
}
