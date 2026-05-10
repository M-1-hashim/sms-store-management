import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/validate-auth";

// GET /api/suppliers — list suppliers
export async function GET(request: Request) {
  try {
    const auth = await withAuth(request as any)
    if (!auth.valid) return auth.response

    const suppliers = await db.supplier.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: suppliers });
  } catch (error) {
    console.error("Error listing suppliers:", error);
    return NextResponse.json(
      { success: false, error: "خطا در دریافت تامین‌کنندگان" },
      { status: 500 }
    );
  }
}

// POST /api/suppliers — create supplier
export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request as any)
    if (!auth.valid) return auth.response

    const body = await request.json();
    const { name, phone, email, address } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "نام تامین‌کننده الزامی است" },
        { status: 400 }
      );
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { success: false, error: "شماره تلفن الزامی است" },
        { status: 400 }
      );
    }

    const supplier = await db.supplier.create({
      data: {
        name: name.trim(),
        phone: phone.trim(),
        email: email || null,
        address: address || null,
      },
    });

    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
  } catch (error) {
    console.error("Error creating supplier:", error);
    return NextResponse.json(
      { success: false, error: "خطا در ایجاد تامین‌کننده" },
      { status: 500 }
    );
  }
}
