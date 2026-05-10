'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Calculator, Delete, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Calculator Component ──────────────────────────────────────────────

export function AppCalculator() {
  const [open, setOpen] = useState(false)
  const [display, setDisplay] = useState('0')
  const [expression, setExpression] = useState('')
  const [hasResult, setHasResult] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const btnRef = useRef<HTMLButtonElement>(null)

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) setOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open])

  const inputDigit = useCallback((digit: string) => {
    if (hasResult) {
      setDisplay(digit)
      setExpression(digit)
      setHasResult(false)
      return
    }
    if (display === '0' && digit !== '.') {
      setDisplay(digit)
      setExpression((prev) => prev === '0' ? digit : prev + digit)
    } else {
      setDisplay((prev) => prev + digit)
      setExpression((prev) => prev + digit)
    }
  }, [display, hasResult])

  const inputOperator = useCallback((op: string) => {
    setHasResult(false)
    setDisplay('0')
    setExpression((prev) => {
      const last = prev[prev.length - 1]
      if (['+', '-', '×', '÷', '%'].includes(last)) {
        return prev.slice(0, -1) + op
      }
      return prev + op
    })
  }, [])

  const inputDot = useCallback(() => {
    if (hasResult) {
      setDisplay('0.')
      setExpression('0.')
      setHasResult(false)
      return
    }
    // Prevent multiple dots in current number
    const parts = expression.split(/[\+\-\×\÷\%]/)
    const currentNum = parts[parts.length - 1]
    if (currentNum.includes('.')) return

    setDisplay((prev) => prev + '.')
    setExpression((prev) => prev + '.')
  }, [display, hasResult, expression])

  const clear = useCallback(() => {
    setDisplay('0')
    setExpression('')
    setHasResult(false)
  }, [])

  const backspace = useCallback(() => {
    if (hasResult) {
      clear()
      return
    }
    if (expression.length <= 1) {
      setDisplay('0')
      setExpression('')
    } else {
      const newExpr = expression.slice(0, -1)
      setExpression(newExpr)
      // Update display with current number
      const parts = newExpr.split(/[\+\-\×\÷\%]/)
      setDisplay(parts[parts.length - 1] || '0')
    }
  }, [expression, hasResult, clear])

  // Safe math expression evaluator (recursive descent parser)
  const safeEval = (expr: string): number => {
    let pos = 0

    const skipSpaces = () => { while (pos < expr.length && expr[pos] === ' ') pos++ }
    
    const parseNumber = (): number => {
      skipSpaces()
      let start = pos
      let hasDot = false
      if (expr[pos] === '-') { pos++ } // negative prefix
      if (expr[pos] === '+') { pos++ }
      while (pos < expr.length && (expr[pos] >= '0' && expr[pos] <= '9' || expr[pos] === '.')) {
        if (expr[pos] === '.') {
          if (hasDot) break
          hasDot = true
        }
        pos++
      }
      if (pos === start || (pos === start + 1 && (expr[start] === '-' || expr[start] === '+'))) {
        throw new Error('Invalid number')
      }
      return parseFloat(expr.slice(start, pos))
    }

    const parseFactor = (): number => {
      skipSpaces()
      if (expr[pos] === '(') {
        pos++ // skip '('
        const result = parseExpr()
        skipSpaces()
        if (expr[pos] === ')') pos++ // skip ')'
        return result
      }
      if (expr[pos] === '-') {
        pos++
        return -parseFactor()
      }
      if (expr[pos] === '+') {
        pos++
        return parseFactor()
      }
      return parseNumber()
    }

    const parseTerm = (): number => {
      let left = parseFactor()
      while (pos < expr.length) {
        skipSpaces()
        const op = expr[pos]
        if (op === '*') {
          pos++
          left *= parseFactor()
        } else if (op === '/') {
          pos++
          const right = parseFactor()
          if (right === 0) throw new Error('Division by zero')
          left /= right
        } else break
      }
      return left
    }

    const parseExpr = (): number => {
      let left = parseTerm()
      while (pos < expr.length) {
        skipSpaces()
        const op = expr[pos]
        if (op === '+') {
          pos++
          left += parseTerm()
        } else if (op === '-') {
          pos++
          left -= parseTerm()
        } else if (op === '%') {
          pos++
          left = left / 100
        } else break
      }
      return left
    }

    const result = parseExpr()
    if (pos < expr.length) throw new Error('Unexpected character')
    return result
  }

  const calculate = useCallback(() => {
    try {
      // Replace display operators with parser operators
      let expr = expression
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/٪/g, '%')

      // Safety: only allow digits, operators, dots, parens, spaces
      if (!expr || !/^[\d\+\-\*\/\.\(\)\s%]+$/.test(expr)) {
        return
      }

      const result = safeEval(expr)

      if (isNaN(result) || !isFinite(result)) {
        setDisplay('خطا')
        return
      }

      // Format result
      const formatted = Number.isInteger(result)
        ? result.toLocaleString('fa-AF')
        : parseFloat(result.toFixed(8)).toLocaleString('fa-AF', { maximumFractionDigits: 8 })

      setHistory((prev) => [`${expression} = ${formatted}`, ...prev.slice(0, 9)])
      setDisplay(formatted)
      setExpression(String(result))
      setHasResult(true)
    } catch {
      setDisplay('خطا')
    }
  }, [expression])

  const toggleSign = useCallback(() => {
    if (display === '0') return
    if (hasResult) {
      const num = parseFloat(display.replace(/،/g, ''))
      const negated = -num
      const formatted = Number.isInteger(negated)
        ? negated.toLocaleString('fa-AF')
        : negated.toLocaleString('fa-AF', { maximumFractionDigits: 8 })
      setDisplay(formatted)
      setExpression(String(negated))
      return
    }
    // Toggle sign of last number in expression
    setExpression((prev) => {
      const match = prev.match(/(.*?)(-?\d+\.?\d*)$/)
      if (match) {
        const prefix = match[1]
        const num = match[2]
        const toggled = num.startsWith('-') ? num.slice(1) : '-' + num
        setDisplay(toggled)
        return prefix + toggled
      }
      return prev
    })
  }, [display, hasResult])

  const percent = useCallback(() => {
    if (display === '0') return
    const num = parseFloat(display.replace(/،/g, ''))
    const result = num / 100
    const formatted = parseFloat(result.toFixed(8)).toLocaleString('fa-AF', { maximumFractionDigits: 8 })
    setDisplay(formatted)
    setExpression(String(result))
    setHasResult(true)
  }, [display])

  // Keyboard support
  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') { e.preventDefault(); inputDigit(e.key) }
      else if (e.key === '.') { e.preventDefault(); inputDot() }
      else if (e.key === '+') { e.preventDefault(); inputOperator('+') }
      else if (e.key === '-') { e.preventDefault(); inputOperator('-') }
      else if (e.key === '*') { e.preventDefault(); inputOperator('×') }
      else if (e.key === '/') { e.preventDefault(); inputOperator('÷') }
      else if (e.key === '%') { e.preventDefault(); percent() }
      else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); calculate() }
      else if (e.key === 'Backspace') { e.preventDefault(); backspace() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, inputDigit, inputDot, inputOperator, percent, calculate, backspace, clear])

  // Calculator buttons layout
  const buttons = [
    { label: 'C', type: 'fn' as const, action: clear },
    { label: '±', type: 'fn' as const, action: toggleSign },
    { label: '٪', type: 'fn' as const, action: percent },
    { label: '÷', type: 'op' as const, action: () => inputOperator('÷') },
    { label: '۷', type: 'num' as const, action: () => inputDigit('7') },
    { label: '۸', type: 'num' as const, action: () => inputDigit('8') },
    { label: '۹', type: 'num' as const, action: () => inputDigit('9') },
    { label: '×', type: 'op' as const, action: () => inputOperator('×') },
    { label: '۴', type: 'num' as const, action: () => inputDigit('4') },
    { label: '۵', type: 'num' as const, action: () => inputDigit('5') },
    { label: '۶', type: 'num' as const, action: () => inputDigit('6') },
    { label: '−', type: 'op' as const, action: () => inputOperator('-') },
    { label: '۱', type: 'num' as const, action: () => inputDigit('1') },
    { label: '۲', type: 'num' as const, action: () => inputDigit('2') },
    { label: '۳', type: 'num' as const, action: () => inputDigit('3') },
    { label: '\u002B', type: 'op' as const, action: () => inputOperator('+') },
    { label: '۰', type: 'num' as const, action: () => inputDigit('0') },
    { label: '۰۰', type: 'num' as const, action: () => {
      if (!hasResult && display !== '0') {
        setDisplay((prev) => prev + '00')
        setExpression((prev) => prev + '00')
      }
    }},
    { label: '.', type: 'num' as const, action: inputDot },
    { label: '=', type: 'eq' as const, action: calculate },
  ]

  return (
    <>
      {/* Floating Calculator Button */}
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        className={cn(
          'fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl',
          open
            ? 'bg-destructive text-destructive-foreground'
            : 'bg-primary text-primary-foreground'
        )}
        title="ماشین حساب"
      >
        {open ? <X className="h-6 w-6" /> : <Calculator className="h-6 w-6" />}
      </button>

      {/* Calculator Panel */}
      {open && (
        <div className="fixed bottom-24 left-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <Card className="w-80 overflow-hidden shadow-2xl border-border">
            {/* Display */}
            <div className="bg-card p-4 space-y-1 border-b border-border">
              <div className="text-xs text-muted-foreground h-5 text-left font-mono truncate" dir="ltr">
                {expression || '\u00A0'}
              </div>
              <div
                className={cn(
                  'text-3xl font-bold text-left font-mono truncate',
                  display === 'خطا' ? 'text-destructive' : 'text-foreground'
                )}
                dir="ltr"
              >
                {display}
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="max-h-16 overflow-y-auto px-3 py-1.5 space-y-0.5 bg-muted/30">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const val = h.split(' = ')[1]?.replace(/،/g, '')
                      if (val && !isNaN(parseFloat(val))) {
                        setDisplay(val)
                        setExpression(val)
                        setHasResult(true)
                      }
                    }}
                    className="block w-full text-[10px] text-muted-foreground text-left font-mono truncate hover:text-foreground transition-colors"
                    dir="ltr"
                    title={h}
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}

            {/* Buttons */}
            <div className="grid grid-cols-4 gap-px bg-border p-px">
              {buttons.map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.action}
                  className={cn(
                    'flex items-center justify-center h-14 text-lg font-semibold transition-all active:scale-95',
                    btn.type === 'fn' && 'bg-muted text-foreground hover:bg-muted/80',
                    btn.type === 'num' && 'bg-card text-foreground hover:bg-muted/50',
                    btn.type === 'op' && 'bg-amber-500 text-white hover:bg-amber-600',
                    btn.type === 'eq' && 'bg-primary text-primary-foreground hover:bg-primary/90',
                  )}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Backspace Button */}
            <div className="flex">
              <button
                onClick={backspace}
                className="flex-1 flex items-center justify-center gap-2 h-10 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                <Delete className="h-4 w-4" />
                پاک کردن
              </button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
