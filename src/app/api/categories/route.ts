import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/categories — list all categories with product count
export async function GET() {
  try {
    const categories = await db.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    });

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    console.error("Error listing categories:", error);
    return NextResponse.json(
      { success: false, error: "خطا در دریافت دسته‌بندی‌ها" },
      { status: 500 }
    );
  }
}

// POST /api/categories — create category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, color } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "نام دسته‌بندی الزامی است" },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await db.category.findFirst({ where: { name: name.trim() } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "این نام دسته‌بندی قبلاً ثبت شده است" },
        { status: 400 }
      );
    }

    const category = await db.category.create({
      data: {
        name: name.trim(),
        description: description || null,
        color: color || "#6366f1",
      },
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { success: false, error: "خطا در ایجاد دسته‌بندی" },
      { status: 500 }
    );
  }
}
