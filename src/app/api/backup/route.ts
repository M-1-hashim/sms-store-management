import { NextResponse } from 'next/server'
import { readFileSync, unlinkSync, existsSync, mkdirSync, cpSync, readdirSync, statSync } from 'fs'
import { join, dirname, resolve } from 'path'
import { writeFile, readFile } from 'fs/promises'
import { db } from '@/lib/db'
import { withAuth } from '@/lib/validate-auth'

// Resolve actual DB path by asking Prisma directly
let _resolvedDbPath: string | null = null

async function getDbPath(): Promise<string> {
  if (_resolvedDbPath) return _resolvedDbPath

  try {
    const result = await db.$queryRaw<Array<{ file: string }>>`
      SELECT file FROM pragma_database_list WHERE name='main'
    `
    if (result && result[0]?.file) {
      _resolvedDbPath = result[0].file
      return _resolvedDbPath
    }
  } catch {
    // Fallback below
  }

  // Fallback: resolve from DATABASE_URL
  const dbUrl = process.env.DATABASE_URL || ''
  const filePath = dbUrl.replace(/^file:/, '')
  if (filePath.startsWith('/') || /^[A-Za-z]:/.test(filePath)) {
    _resolvedDbPath = filePath
  } else {
    _resolvedDbPath = join(process.cwd(), filePath)
  }
  return _resolvedDbPath
}

async function getBackupDir(): Promise<string> {
  const dbPath = await getDbPath()
  return join(dirname(dbPath), 'backups')
}

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
}

function generateBackupFilename(prefix = 'backup') {
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, 19)
  return `${prefix}-${timestamp}.db`
}

// GET /api/backup - List, download, delete, auto-backup status
export async function GET(request: Request) {
  const auth = await withAuth(request as any)
  if (!auth.valid) return auth.response

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const filename = searchParams.get('file')
  const backupDir = await getBackupDir()

  // Download a specific backup
  if (action === 'download' && filename) {
    try {
      const safePath = resolve(backupDir, filename)
      if (!safePath.startsWith(backupDir)) {
        return NextResponse.json({ success: false, error: 'نام فایل نامعتبر' }, { status: 403 })
      }
      if (!existsSync(safePath)) {
        return NextResponse.json({ success: false, error: 'فایل پشتیبان یافت نشد' }, { status: 404 })
      }
      const fileBuffer = readFileSync(safePath)
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    } catch (error) {
      console.error('Error downloading backup:', error)
      return NextResponse.json({ success: false, error: 'خطا در دانلود فایل پشتیبان' }, { status: 500 })
    }
  }

  // Delete a backup
  if (action === 'delete' && filename) {
    try {
      const safePath = resolve(backupDir, filename)
      if (!safePath.startsWith(backupDir)) {
        return NextResponse.json({ success: false, error: 'نام فایل نامعتبر' }, { status: 403 })
      }
      if (existsSync(safePath)) unlinkSync(safePath)
      return NextResponse.json({ success: true, message: 'پشتیبان حذف شد' })
    } catch (error) {
      console.error('Error deleting backup:', error)
      return NextResponse.json({ success: false, error: 'خطا در حذف فایل پشتیبان' }, { status: 500 })
    }
  }

  // Auto-backup check & create
  if (action === 'auto') {
    try {
      const settings = await db.settings.findUnique({ where: { id: 'main' } })
      if (!settings || !settings.autoBackup) {
        return NextResponse.json({ success: true, data: { created: false, reason: 'auto_backup_disabled' } })
      }

      const lastBackup = settings.lastAutoBackup
      const now = new Date()
      const frequency = settings.backupFrequency

      let shouldBackup = false
      if (!lastBackup) {
        shouldBackup = true
      } else {
        const diffMs = now.getTime() - new Date(lastBackup).getTime()
        const diffHours = diffMs / (1000 * 60 * 60)
        const diffDays = diffMs / (1000 * 60 * 60 * 24)

        switch (frequency) {
          case 'hourly':
            shouldBackup = diffHours >= 1
            break
          case 'daily':
            shouldBackup = diffHours >= 24
            break
          case 'weekly':
            shouldBackup = diffDays >= 7
            break
          case 'monthly':
            shouldBackup = diffDays >= 30
            break
          default:
            shouldBackup = diffHours >= 24
        }
      }

      if (!shouldBackup) {
        return NextResponse.json({ success: true, data: { created: false, reason: 'not_due_yet' } })
      }

      // Create backup
      const dbPath = await getDbPath()
      ensureDir(backupDir)
      const backupFilename = generateBackupFilename('auto')
      const backupPath = join(backupDir, backupFilename)

      if (existsSync(dbPath)) {
        cpSync(dbPath, backupPath)

        await db.settings.update({
          where: { id: 'main' },
          data: { lastAutoBackup: now },
        })

        const keepCount = settings.backupKeepCount || 10
        await cleanupOldBackups(backupDir, keepCount)

        const stat = statSync(backupPath)
        return NextResponse.json({
          success: true,
          data: { created: true, filename: backupFilename, size: (stat.size / 1024).toFixed(1) + ' KB' },
        })
      }

      return NextResponse.json({ success: true, data: { created: false, reason: 'no_database' } })
    } catch (error) {
      console.error('Auto-backup error:', error)
      return NextResponse.json({ success: false, error: 'خطا در پشتیبان‌گیری خودکار' }, { status: 500 })
    }
  }

  // List all backups (default)
  try {
    ensureDir(backupDir)
    const files = readdirSync(backupDir)
      .filter((f) => f.endsWith('.db'))
      .map((f) => {
        const stat = statSync(join(backupDir, f))
        const isAuto = f.startsWith('auto-')
        return {
          filename: f,
          size: (stat.size / 1024).toFixed(1) + ' KB',
          date: stat.mtime.toISOString(),
          type: isAuto ? 'auto' : 'manual',
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json({ success: true, data: files })
  } catch (error) {
    console.error('Error listing backups:', error)
    return NextResponse.json({ success: false, error: 'خطا در دریافت لیست پشتیبان‌ها' }, { status: 500 })
  }
}

// POST /api/backup - Create backup, restore, or upload
export async function POST(request: Request) {
  const auth = await withAuth(request as any)
  if (!auth.valid) return auth.response

  const dbPath = await getDbPath()
  const backupDir = await getBackupDir()
  const contentType = request.headers.get('content-type') || ''

  // File upload (FormData) — restore from uploaded file
  if (contentType.includes('multipart/form-data')) {
    try {
      const formData = await request.formData()
      const file = formData.get('file') as File | null

      if (!file) {
        return NextResponse.json({ success: false, error: 'فایلی انتخاب نشده' }, { status: 400 })
      }

      if (!file.name.endsWith('.db') && !file.name.endsWith('.sqlite') && !file.name.endsWith('.sqlite3')) {
        return NextResponse.json(
          { success: false, error: 'لطفاً فقط فایل دیتابیس (.db, .sqlite) انتخاب کنید' },
          { status: 400 }
        )
      }

      if (file.size > 100 * 1024 * 1024) {
        return NextResponse.json({ success: false, error: 'حجم فایل نباید بیشتر از ۱۰۰ مگابایت باشد' }, { status: 400 })
      }

      ensureDir(backupDir)
      const uploadFilename = generateBackupFilename('uploaded')
      const uploadPath = join(backupDir, uploadFilename)
      const bytes = await file.arrayBuffer()
      await writeFile(uploadPath, Buffer.from(bytes))

      // Validate SQLite header magic bytes
      const uploadedBuffer = await readFile(uploadPath)
      const header = uploadedBuffer.slice(0, 16).toString('utf8')
      if (!header.startsWith('SQLite format 3')) {
        unlinkSync(uploadPath)
        return NextResponse.json(
          { success: false, error: 'فایل انتخاب شده یک دیتابیس SQLite معتبر نیست' },
          { status: 400 }
        )
      }

      // Create pre-restore backup of current DB
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const preRestorePath = join(backupDir, `pre-upload-${timestamp}.db`)

      if (existsSync(dbPath)) {
        cpSync(dbPath, preRestorePath)
      }

      cpSync(uploadPath, dbPath)

      return NextResponse.json({
        success: true,
        message: 'بازیابی از فایل آپلود شده با موفقیت انجام شد. لطفاً صفحه را رفرش کنید.',
      })
    } catch (error) {
      console.error('Upload restore error:', error)
      return NextResponse.json({ success: false, error: 'خطا در بازیابی فایل آپلود شده' }, { status: 500 })
    }
  }

  // JSON body — create or restore from existing backup
  try {
    const body = await request.json()
    const { action } = body

    ensureDir(backupDir)

    if (action === 'create') {
      const filename = generateBackupFilename('manual')
      const backupPath = join(backupDir, filename)

      try {
        if (existsSync(dbPath)) {
          cpSync(dbPath, backupPath)
          const stat = statSync(backupPath)
          return NextResponse.json({
            success: true,
            message: 'پشتیبان با موفقیت ایجاد شد',
            data: { filename, size: (stat.size / 1024).toFixed(1) + ' KB' },
          })
        } else {
          return NextResponse.json({ success: false, error: 'فایل دیتابیس یافت نشد' }, { status: 404 })
        }
      } catch (copyError) {
        console.error('Copy error:', copyError)
        return NextResponse.json({ success: false, error: 'خطا در کپی دیتابیس' }, { status: 500 })
      }
    }

    if (action === 'restore') {
      const { filename } = body
      if (!filename) {
        return NextResponse.json({ success: false, error: 'نام فایل مشخص نشده' }, { status: 400 })
      }

      const restorePath = resolve(backupDir, filename)
      if (!restorePath.startsWith(backupDir)) {
        return NextResponse.json({ success: false, error: 'نام فایل نامعتبر' }, { status: 403 })
      }
      if (!existsSync(restorePath)) {
        return NextResponse.json({ success: false, error: 'فایل پشتیبان یافت نشد' }, { status: 404 })
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const preRestoreBackup = join(backupDir, `pre-restore-${timestamp}.db`)

      try {
        if (existsSync(dbPath)) cpSync(dbPath, preRestoreBackup)
        cpSync(restorePath, dbPath)

        return NextResponse.json({ success: true, message: 'بازیابی با موفقیت انجام شد. لطفاً صفحه را رفرش کنید.' })
      } catch (restoreError) {
        console.error('Restore error:', restoreError)
        return NextResponse.json({ success: false, error: 'خطا در بازیابی دیتابیس' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: false, error: 'عملیات نامعتبر' }, { status: 400 })
  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json({ success: false, error: 'خطا در عملیات پشتیبان‌گیری' }, { status: 500 })
  }
}

// --- Helpers ---

async function cleanupOldBackups(backupDir: string, keepCount: number) {
  try {
    ensureDir(backupDir)
    const files = readdirSync(backupDir)
      .filter((f) => f.startsWith('auto-') && f.endsWith('.db'))
      .map((f) => ({
        filename: f,
        mtime: statSync(join(backupDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.mtime - a.mtime)

    const toDelete = files.slice(keepCount)
    for (const file of toDelete) {
      try {
        unlinkSync(join(backupDir, file.filename))
      } catch {
        // ignore individual delete errors
      }
    }
  } catch {
    // ignore cleanup errors
  }
}
