import { useCallback, useEffect, useMemo, useState } from 'react'
import { evaluateLine, isCalculableLine } from '@/services/calculator'

export function useCalc(content: string) {
  const [collapsedLines, setCollapsedLines] = useState<Set<number>>(
    () => new Set(),
  )
  const lines = useMemo(() => content.split('\n'), [content])

  useEffect(() => {
    setCollapsedLines(new Set())
  }, [content])

  const getLineResult = useCallback(
    (lineIndex: number): string | null => {
      const line = lines[lineIndex]

      if (!line || !isCalculableLine(line)) return null

      return evaluateLine(line)
    },
    [lines],
  )

  const toggleCollapse = useCallback((lineIndex: number) => {
    setCollapsedLines((current) => {
      const next = new Set(current)

      if (next.has(lineIndex)) {
        next.delete(lineIndex)
      } else {
        next.add(lineIndex)
      }

      return next
    })
  }, [])

  const isCollapsed = useCallback(
    (lineIndex: number): boolean => collapsedLines.has(lineIndex),
    [collapsedLines],
  )

  const getDisplayLine = useCallback(
    (lineIndex: number): string => {
      const line = lines[lineIndex] ?? ''
      const result = getLineResult(lineIndex)

      return result && isCollapsed(lineIndex) ? result : line
    },
    [getLineResult, isCollapsed, lines],
  )

  return {
    getLineResult,
    toggleCollapse,
    isCollapsed,
    getDisplayLine,
  }
}
