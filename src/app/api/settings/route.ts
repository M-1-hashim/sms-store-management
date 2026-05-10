import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/validate-auth'

// Fields to never expose to the client
const SENSITIVE_FIELDS = ['passwordHash', 'sessionToken', 'sessionExpiry', 'failedAttempts', 'lockUntil'] as const

// GET /api/settings - Fetch settings (create default if not exists)
export async function GET(request: Request) {
  try {
    // Validate authentication
    const auth = await withAuth(request as any)
    if (!auth.valid) {
      return auth.response
    }

    let settings = await db.settings.findUnique({
      where: { id: 'main' },
    })

    if (!settings) {
      settings = await db.settings.create({
        data: { id: 'main' },
      })
    }

    // Remove sensitive fields from response
    const safeSettings = { ...settings }
    for (const field of SENSITIVE_FIELDS) {
      delete (safeSettings as any)[field]
    }

    return NextResponse.json({ success: true, data: safeSettings })
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت تنظیمات' },
      { status: 500 }
    )
  }
}

// PUT /api/settings - Update settings
export async function PUT(request: Request) {
  try {
    // Validate authentication
    const auth = await withAuth(request as any)
    if (!auth.valid) {
      return auth.response
    }

    const body = await request.json()

    const {
      storeName,
      storeNameEn,
      address,
      phone,
      email,
      logo,
      taxNumber,
      invoicePrefix,
      invoiceFooter,
      currency,
      itemsPerPage,
      autoBackup,
      backupFrequency,
      backupKeepCount,
    } = body

    // Ensure settings record exists
    const existing = await db.settings.findUnique({
      where: { id: 'main' },
    })

    if (!existing) {
      const settings = await db.settings.create({
        data: {
          id: 'main',
          storeName: storeName || 'فروشگاه من',
          storeNameEn: storeNameEn || 'My Store',
          address: address || '',
          phone: phone || '',
          email: email || '',
          logo: logo || null,
          taxNumber: taxNumber || '',
          invoicePrefix: invoicePrefix || 'INV',
          invoiceFooter: invoiceFooter || 'با تشکر از خرید شما',
          currency: currency || 'افغانی',
          itemsPerPage: itemsPerPage || 20,
          autoBackup: autoBackup ?? false,
          backupFrequency: backupFrequency || 'daily',
          backupKeepCount: backupKeepCount || 10,
        },
      })
      const safeSettings = { ...settings }
      for (const field of SENSITIVE_FIELDS) {
        delete (safeSettings as any)[field]
      }
      return NextResponse.json({ success: true, data: safeSettings })
    }

    // Update existing
    const settings = await db.settings.update({
      where: { id: 'main' },
      data: {
        ...(storeName !== undefined && { storeName }),
        ...(storeNameEn !== undefined && { storeNameEn }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(logo !== undefined && { logo }),
        ...(taxNumber !== undefined && { taxNumber }),
        ...(invoicePrefix !== undefined && { invoicePrefix }),
        ...(invoiceFooter !== undefined && { invoiceFooter }),
        ...(currency !== undefined && { currency }),
        ...(itemsPerPage !== undefined && { itemsPerPage }),
        ...(autoBackup !== undefined && { autoBackup }),
        ...(backupFrequency !== undefined && { backupFrequency }),
        ...(backupKeepCount !== undefined && { backupKeepCount }),
      },
    })

    const safeSettings = { ...settings }
    for (const field of SENSITIVE_FIELDS) {
      delete (safeSettings as any)[field]
    }

    return NextResponse.json({ success: true, data: safeSettings })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در ذخیره تنظیمات' },
      { status: 500 }
    )
  }
}
