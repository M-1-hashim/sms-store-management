import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/products — list products with search, filter, sort, pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where: Record<string, unknown> = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const orderBy: Record<string, string> = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder === "asc" ? "asc" : "desc";
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: { category: true },
        orderBy,
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error listing products:", error);
    return NextResponse.json(
      { success: false, error: "خطا در دریافت محصولات" },
      { status: 500 }
    );
  }
}

// POST /api/products — create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, sku, barcode, categoryId, buyPrice, sellPrice, stock, minStock, unit, description } = body;

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "نام محصول الزامی است" },
        { status: 400 }
      );
    }

    // Generate SKU if not provided
    let finalSku = sku;
    if (!finalSku) {
      const count = await db.product.count();
      finalSku = `PRD-${String(count + 1).padStart(5, "0")}`;
    }

    // Check SKU uniqueness
    const existing = await db.product.findUnique({ where: { sku: finalSku } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "کد SKU تکراری است" },
        { status: 400 }
      );
    }

    if (sellPrice === undefined || sellPrice === null) {
      return NextResponse.json(
        { success: false, error: "قیمت فروش الزامی است" },
        { status: 400 }
      );
    }

    const product = await db.product.create({
      data: {
        name: name.trim(),
        sku: finalSku,
        barcode: barcode || null,
        categoryId: categoryId || null,
        buyPrice: buyPrice ?? 0,
        sellPrice: parseFloat(sellPrice),
        stock: stock ?? 0,
        minStock: minStock ?? 5,
        unit: unit || "عدد",
        description: description || null,
      },
      include: { category: true },
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { success: false, error: "خطا در ایجاد محصول" },
      { status: 500 }
    );
  }
}
