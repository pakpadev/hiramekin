function pad(value: number): string {
  return value.toString().padStart(2, '0')
}

export function formatToday(date: Date = new Date()): string {
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(
    date.getDate(),
  )}`
}

export function formatTime(date: Date = new Date()): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function formatDateTime(date: Date = new Date()): string {
  return `${formatToday(date)} ${formatTime(date)}`
}
