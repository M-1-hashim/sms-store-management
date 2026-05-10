import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/validate-auth";

// GET /api/sales — list sales with items, customer, product details
export async function GET(request: NextRequest) {
  try {
    const auth = await withAuth(request as any)
    if (!auth.valid) return auth.response

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const where: Record<string, unknown> = {};

    if (from || to) {
      where.createdAt = {};
      if (from) {
        (where.createdAt as Record<string, unknown>).gte = new Date(from);
      }
      if (to) {
        (where.createdAt as Record<string, unknown>).lte = new Date(to);
      }
    }

    const skip = (page - 1) * limit;

    const [sales, total] = await Promise.all([
      db.sale.findMany({
        where,
        include: {
          customer: true,
          items: {
            include: { product: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.sale.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        sales,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error listing sales:", error);
    return NextResponse.json(
      { success: false, error: "خطا در دریافت فاکتورها" },
      { status: 500 }
    );
  }
}

// POST /api/sales — create a sale with items in a transaction
export async function POST(request: NextRequest) {
  try {
    const auth = await withAuth(request as any)
    if (!auth.valid) return auth.response

    const body = await request.json();
    const { customerId, items, discount, paymentMethod, paidAmount, notes } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "لیست محصولات الزامی است" },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return NextResponse.json(
          { success: false, error: "محصول و تعداد الزامی است" },
          { status: 400 }
        );
      }
    }

    // Fetch all products and validate stock
    const productIds = items.map((i: { productId: string }) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return NextResponse.json(
          { success: false, error: `محصولی با شناسه ${item.productId} یافت نشد` },
          { status: 404 }
        );
      }
      if (!product.isActive) {
        return NextResponse.json(
          { success: false, error: `محصول ${product.name} غیرفعال است` },
          { status: 400 }
        );
      }
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { success: false, error: `موجودی ${product.name} کافی نیست (موجودی: ${product.stock})` },
          { status: 400 }
        );
      }
    }

    const discountAmount = parseFloat(discount) || 0;

    // Build sale items with calculated totals
    const saleItems = items.map((item: { productId: string; quantity: number; unitPrice?: number }) => {
      const product = productMap.get(item.productId)!;
      const unitPrice = item.unitPrice ?? product.sellPrice;
      const totalPrice = unitPrice * item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      };
    });

    const totalAmount = saleItems.reduce((sum, i) => sum + i.totalPrice, 0);
    const finalAmount = totalAmount - discountAmount;
    const parsedPaidAmount = paidAmount != null ? parseFloat(paidAmount) : finalAmount;
    const change = parsedPaidAmount - finalAmount;

    // Execute in a transaction (invoice number generation inside to avoid race conditions)
    const sale = await db.$transaction(async (tx) => {
      // Generate invoice number inside transaction to prevent duplicates
      const lastSale = await tx.sale.findFirst({
        orderBy: { createdAt: "desc" },
        select: { invoiceNumber: true },
      });

      let invoiceNum = 1;
      if (lastSale) {
        const match = lastSale.invoiceNumber.match(/INV-(\d+)/);
        if (match) {
          invoiceNum = parseInt(match[1], 10) + 1;
        }
      }
      const invoiceNumber = `INV-${String(invoiceNum).padStart(4, "0")}`;
      // Create the sale
      const newSale = await tx.sale.create({
        data: {
          invoiceNumber,
          customerId: customerId || null,
          totalAmount,
          discount: discountAmount,
          finalAmount,
          paymentMethod: paymentMethod || "نقدی",
          paidAmount: parsedPaidAmount,
          change: Math.max(0, change),
          notes: notes || null,
          items: {
            create: saleItems,
          },
        },
        include: {
          customer: true,
          items: { include: { product: true } },
        },
      });

      // Reduce stock for each product
      for (const item of saleItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Update customer balance if customer exists
      if (customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: { balance: { increment: finalAmount } },
        });
      }

      return newSale;
    });

    return NextResponse.json({ success: true, data: sale }, { status: 201 });
  } catch (error) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { success: false, error: "خطا در ثبت فاکتور" },
      { status: 500 }
    );
  }
}
