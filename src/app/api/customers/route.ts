import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/validate-auth";

// GET /api/customers — list customers with search and pagination
export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request as any)
    if (!auth.valid) return auth.response

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const skip = (page - 1) * limit;

    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.customer.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        customers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error listing customers:", error);
    return NextResponse.json(
      { success: false, error: "خطا در دریافت مشتریان" },
      { status: 500 }
    );
  }
}

// POST /api/customers — create customer
export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request as any)
    if (!auth.valid) return auth.response

    const body = await request.json();
    const { name, phone, email, address, balance, image } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "نام مشتری الزامی است" },
        { status: 400 }
      );
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { success: false, error: "شماره تلفن الزامی است" },
        { status: 400 }
      );
    }

    // Check phone uniqueness
    const existing = await db.customer.findUnique({ where: { phone: phone.trim() } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "این شماره تلفن قبلاً ثبت شده است" },
        { status: 400 }
      );
    }

    const customer = await db.customer.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: email || null,
        address: address || null,
        balance: balance ?? 0,
        image: image || null,
      },
    });

    return NextResponse.json({ success: true, data: customer }, { status: 201 });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { success: false, error: "خطا در ایجاد مشتری" },
      { status: 500 }
    );
  }
}
