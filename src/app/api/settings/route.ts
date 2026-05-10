import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/settings - Fetch settings (create default if not exists)
export async function GET() {
  try {
    let settings = await db.settings.findUnique({
      where: { id: 'main' },
    })

    if (!settings) {
      settings = await db.settings.create({
        data: { id: 'main' },
      })
    }

    return NextResponse.json({ success: true, data: settings })
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
      return NextResponse.json({ success: true, data: settings })
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

    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در ذخیره تنظیمات' },
      { status: 500 }
    )
  }
}
