import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/expenses — list expenses with date range and category filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const where: Record<string, unknown> = {};

    if (from || to) {
      where.date = {};
      if (from) {
        (where.date as Record<string, unknown>).gte = new Date(from);
      }
      if (to) {
        (where.date as Record<string, unknown>).lte = new Date(to);
      }
    }

    if (category) {
      where.category = category;
    }

    const skip = (page - 1) * limit;

    const [expenses, total] = await Promise.all([
      db.expense.findMany({
        where,
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      db.expense.count({ where }),
    ]);

    // Calculate total expenses for the filtered period
    const totalAmount = await db.expense.aggregate({
      where,
      _sum: { amount: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        expenses,
        totalAmount: totalAmount._sum.amount ?? 0,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error listing expenses:", error);
    return NextResponse.json(
      { success: false, error: "خطا در دریافت هزینه‌ها" },
      { status: 500 }
    );
  }
}

// POST /api/expenses — create expense
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description, amount, category, date } = body;

    if (!description || !description.trim()) {
      return NextResponse.json(
        { success: false, error: "توضیحات هزینه الزامی است" },
        { status: 400 }
      );
    }

    if (!amount || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { success: false, error: "مبلغ هزینه باید بیشتر از صفر باشد" },
        { status: 400 }
      );
    }

    const expense = await db.expense.create({
      data: {
        description: description.trim(),
        amount: parseFloat(amount),
        category: category || "سایر",
        date: date ? new Date(date) : new Date(),
      },
    });

    return NextResponse.json({ success: true, data: expense }, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { success: false, error: "خطا در ثبت هزینه" },
      { status: 500 }
    );
  }
}
