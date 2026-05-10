import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

// PUT /api/categories/[id] — update category
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, color } = body;

    const existing = await db.category.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "دسته‌بندی یافت نشد" },
        { status: 404 }
      );
    }

    // Check for duplicate name if changed
    if (name && name.trim() !== existing.name) {
      const duplicate = await db.category.findFirst({ where: { name: name.trim() } });
      if (duplicate) {
        return NextResponse.json(
          { success: false, error: "این نام دسته‌بندی قبلاً ثبت شده است" },
          { status: 400 }
        );
      }
    }

    const category = await db.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description || null }),
        ...(color !== undefined && { color }),
      },
    });

    return NextResponse.json({ success: true, data: category });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { success: false, error: "خطا در بروزرسانی دسته‌بندی" },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] — delete category (only if no products)
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await db.category.findUnique({
      where: { id },
      include: { products: { where: { isActive: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "دسته‌بندی یافت نشد" },
        { status: 404 }
      );
    }

    if (existing.products.length > 0) {
      return NextResponse.json(
        { success: false, error: "این دسته‌بندی دارای محصولات فعال است و قابل حذف نیست" },
        { status: 400 }
      );
    }

    await db.category.delete({ where: { id } });

    return NextResponse.json({ success: true, data: { id } });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { success: false, error: "خطا در حذف دسته‌بندی" },
      { status: 500 }
    );
  }
}
