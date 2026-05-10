import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

// PUT /api/customers/[id] — update customer
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, phone, email, address, balance, image } = body;

    const existing = await db.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "مشتری یافت نشد" },
        { status: 404 }
      );
    }

    // Check phone uniqueness if changed
    if (phone && phone.trim() !== existing.phone) {
      const phoneExists = await db.customer.findUnique({ where: { phone: phone.trim() } });
      if (phoneExists) {
        return NextResponse.json(
          { success: false, error: "این شماره تلفن قبلاً ثبت شده است" },
          { status: 400 }
        );
      }
    }

    const customer = await db.customer.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone.trim() }),
        ...(email !== undefined && { email: email || null }),
        ...(address !== undefined && { address: address || null }),
        ...(balance !== undefined && { balance: parseFloat(balance) }),
        ...(image !== undefined && { image: image || null }),
      },
    });

    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { success: false, error: "خطا در بروزرسانی مشتری" },
      { status: 500 }
    );
  }
}

// DELETE /api/customers/[id] — delete customer
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await db.customer.findUnique({
      where: { id },
      include: { sales: { take: 1 } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "مشتری یافت نشد" },
        { status: 404 }
      );
    }

    // Check if customer has sales
    if (existing.sales.length > 0) {
      return NextResponse.json(
        { success: false, error: "این مشتری دارای فاکتور است و قابل حذف نیست" },
        { status: 400 }
      );
    }

    await db.customer.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { success: false, error: "خطا در حذف مشتری" },
      { status: 500 }
    );
  }
}
