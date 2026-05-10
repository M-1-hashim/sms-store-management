import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/validate-auth";

type RouteParams = { params: Promise<{ id: string }> };

// PUT /api/suppliers/[id] — update supplier
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await withAuth(request as any)
    if (!auth.valid) return auth.response

    const { id } = await params;
    const body = await request.json();
    const { name, phone, email, address } = body;

    const existing = await db.supplier.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "تامین‌کننده یافت نشد" },
        { status: 404 }
      );
    }

    const supplier = await db.supplier.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone.trim() }),
        ...(email !== undefined && { email: email || null }),
        ...(address !== undefined && { address: address || null }),
      },
    });

    return NextResponse.json({ success: true, data: supplier });
  } catch (error) {
    console.error("Error updating supplier:", error);
    return NextResponse.json(
      { success: false, error: "خطا در بروزرسانی تامین‌کننده" },
      { status: 500 }
    );
  }
}

// DELETE /api/suppliers/[id] — delete supplier
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await withAuth(request as any)
    if (!auth.valid) return auth.response

    const { id } = await params;
    const existing = await db.supplier.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "تامین‌کننده یافت نشد" },
        { status: 404 }
      );
    }

    await db.supplier.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json(
      { success: false, error: "خطا در حذف تامین‌کننده" },
      { status: 500 }
    );
  }
}
