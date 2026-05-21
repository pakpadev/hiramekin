import { evaluate } from 'mathjs'

const CALCULABLE_LINE_PATTERN = /\d.*[+\-*/()]|[+\-*/()].*\d/

export function isCalculableLine(line: string): boolean {
  const expression = stripResult(line).trim()

  return expression !== '' && CALCULABLE_LINE_PATTERN.test(expression)
}

export function evaluateLine(line: string): string | null {
  const expression = stripResult(line).trim()

  if (!isCalculableLine(expression)) return null

  try {
    const result = evaluate(expression)

    if (typeof result !== 'number' || !Number.isFinite(result)) {
      return null
    }

    return String(Number.parseFloat(result.toPrecision(12)))
  } catch {
    return null
  }
}

function stripResult(line: string): string {
  return line.split('=')[0]
}
