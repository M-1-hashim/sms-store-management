import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { readFileSync, writeFileSync, unlinkSync, existsSync, mkdirSync, cpSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { db } from '@/lib/db'

const DB_PATH = join(process.cwd(), 'db', 'custom.db')
const BACKUP_DIR = join(process.cwd(), 'db', 'backups')

function ensureBackupDir() {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true })
  }
}

// GET /api/backup - List backups or download one
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const filename = searchParams.get('file')

  // Download a specific backup
  if (action === 'download' && filename) {
    try {
      const filePath = join(BACKUP_DIR, filename)
      if (!existsSync(filePath)) {
        return NextResponse.json(
          { success: false, error: 'فایل پشتیبان یافت نشد' },
          { status: 404 }
        )
      }

      const fileBuffer = readFileSync(filePath)
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    } catch (error) {
      console.error('Error downloading backup:', error)
      return NextResponse.json(
        { success: false, error: 'خطا در دانلود فایل پشتیبان' },
        { status: 500 }
      )
    }
  }

  // Delete a backup
  if (action === 'delete' && filename) {
    try {
      const filePath = join(BACKUP_DIR, filename)
      if (existsSync(filePath)) {
        unlinkSync(filePath)
      }
      return NextResponse.json({ success: true, message: 'پشتیبان حذف شد' })
    } catch (error) {
      console.error('Error deleting backup:', error)
      return NextResponse.json(
        { success: false, error: 'خطا در حذف فایل پشتیبان' },
        { status: 500 }
      )
    }
  }

  // List all backups
  try {
    ensureBackupDir()
    const files = readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith('.db'))
      .map((f) => {
        const stat = statSync(join(BACKUP_DIR, f))
        return {
          filename: f,
          size: (stat.size / 1024).toFixed(1) + ' KB',
          date: stat.mtime.toISOString(),
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({ success: true, data: files })
  } catch (error) {
    console.error('Error listing backups:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در دریافت لیست پشتیبان‌ها' },
      { status: 500 }
    )
  }
}

// POST /api/backup - Create backup or restore
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    ensureBackupDir()

    if (action === 'create') {
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, 19)
      const filename = `backup-${timestamp}.db`
      const backupPath = join(BACKUP_DIR, filename)

      // Use SQLite backup command via PRAGMA
      // First, close all connections to avoid locking issues
      try {
        if (existsSync(DB_PATH)) {
          cpSync(DB_PATH, backupPath)
          const stat = statSync(backupPath)
          return NextResponse.json({
            success: true,
            message: 'پشتیبان با موفقیت ایجاد شد',
            data: {
              filename,
              size: (stat.size / 1024).toFixed(1) + ' KB',
            },
          })
        } else {
          return NextResponse.json(
            { success: false, error: 'فایل دیتابیس یافت نشد' },
            { status: 404 }
          )
        }
      } catch (copyError) {
        console.error('Copy error:', copyError)
        return NextResponse.json(
          { success: false, error: 'خطا در کپی دیتابیس' },
          { status: 500 }
        )
      }
    }

    if (action === 'restore') {
      const { filename } = body
      if (!filename) {
        return NextResponse.json(
          { success: false, error: 'نام فایل مشخص نشده' },
          { status: 400 }
        )
      }

      const restorePath = join(BACKUP_DIR, filename)
      if (!existsSync(restorePath)) {
        return NextResponse.json(
          { success: false, error: 'فایل پشتیبان یافت نشد' },
          { status: 404 }
        )
      }

      // Create a backup of current DB before restoring
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, 19)
      const preRestoreBackup = join(BACKUP_DIR, `pre-restore-${timestamp}.db`)
      
      try {
        if (existsSync(DB_PATH)) {
          cpSync(DB_PATH, preRestoreBackup)
        }
        cpSync(restorePath, DB_PATH)
        
        return NextResponse.json({
          success: true,
          message: 'بازیابی با موفقیت انجام شد. لطفاً صفحه را رفرش کنید.',
        })
      } catch (restoreError) {
        console.error('Restore error:', restoreError)
        return NextResponse.json(
          { success: false, error: 'خطا در بازیابی دیتابیس' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { success: false, error: 'عملیات نامعتبر' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json(
      { success: false, error: 'خطا در عملیات پشتیبان‌گیری' },
      { status: 500 }
    )
  }
}
