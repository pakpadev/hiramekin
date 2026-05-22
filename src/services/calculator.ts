import { evaluate } from 'mathjs'

const CALCULABLE_LINE_PATTERN = /\d.*[+\-*/()]|[+\-*/()].*\d/
const FULL_WIDTH_NUMBER_START = '０'.charCodeAt(0)

export function isCalculableLine(line: string): boolean {
  const expression = getExpression(line)

  return expression !== '' && CALCULABLE_LINE_PATTERN.test(expression)
}

export function evaluateLine(line: string): string | null {
  const expression = getExpression(line)

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
  return line.split(/[=＝]/)[0]
}

function getExpression(line: string): string {
  const expression = normalizeExpression(stripResult(line)).trim()
  const labelSeparator = expression.match(/[:：]/)

  if (!labelSeparator?.index) return expression

  const label = expression.slice(0, labelSeparator.index).trim()
  const value = expression.slice(labelSeparator.index + 1).trim()

  if (label && isCalculableExpression(value)) return value

  return expression
}

function isCalculableExpression(expression: string): boolean {
  return expression !== '' && CALCULABLE_LINE_PATTERN.test(expression)
}

function normalizeExpression(expression: string): string {
  return expression.replace(
    /[０-９＋－ー−＊／（）．＝×÷]/g,
    (character) => {
      if (character >= '０' && character <= '９') {
        return String(character.charCodeAt(0) - FULL_WIDTH_NUMBER_START)
      }

      const replacements: Record<string, string> = {
        '＋': '+',
        '－': '-',
        'ー': '-',
        '−': '-',
        '＊': '*',
        '／': '/',
        '（': '(',
        '）': ')',
        '．': '.',
        '＝': '=',
        '×': '*',
        '÷': '/',
      }

      return replacements[character] ?? character
    },
  )
}
