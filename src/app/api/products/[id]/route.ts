import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/products/[id] — get single product
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const product = await db.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: "محصول یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { success: false, error: "خطا در دریافت محصول" },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] — update product
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, sku, barcode, categoryId, buyPrice, sellPrice, stock, minStock, unit, description, isActive } = body;

    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "محصول یافت نشد" },
        { status: 404 }
      );
    }

    // Check SKU uniqueness if changed
    if (sku && sku !== existing.sku) {
      const skuExists = await db.product.findUnique({ where: { sku } });
      if (skuExists) {
        return NextResponse.json(
          { success: false, error: "کد SKU تکراری است" },
          { status: 400 }
        );
      }
    }

    const product = await db.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(sku !== undefined && { sku }),
        ...(barcode !== undefined && { barcode: barcode || null }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
        ...(buyPrice !== undefined && { buyPrice: parseFloat(buyPrice) }),
        ...(sellPrice !== undefined && { sellPrice: parseFloat(sellPrice) }),
        ...(stock !== undefined && { stock: parseInt(stock, 10) }),
        ...(minStock !== undefined && { minStock: parseInt(minStock, 10) }),
        ...(unit !== undefined && { unit }),
        ...(description !== undefined && { description: description || null }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { category: true },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { success: false, error: "خطا در بروزرسانی محصول" },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] — soft delete product
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const existing = await db.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "محصول یافت نشد" },
        { status: 404 }
      );
    }

    const product = await db.product.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { success: false, error: "خطا در حذف محصول" },
      { status: 500 }
    );
  }
}
