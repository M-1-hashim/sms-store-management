'use client'

import { useEffect } from 'react'

export default function DownloadPage() {
  useEffect(() => {
    fetch('/api/download')
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'sms-project.zip'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      })
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center" dir="rtl">
      <div className="text-center space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
        <p className="text-sm text-muted-foreground">در حال آماده‌سازی فایل...</p>
      </div>
    </div>
  )
}
