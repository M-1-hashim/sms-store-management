'use client'

import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

const emptySubscribe = () => () => {}

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false)

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-8 w-8">
        <Sun className="h-4 w-4" />
      </Button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={isDark ? 'حالت روشن' : 'حالت تاریک'}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-all" />
      ) : (
        <Moon className="h-4 w-4 transition-all" />
      )}
    </Button>
  )
}
