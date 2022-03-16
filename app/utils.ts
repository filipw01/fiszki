const MS_IN_DAY = 24 * 60 * 60 * 1000

export const daysFromNow = (days: number) =>
  new Date(Date.now() + days * MS_IN_DAY).toISOString().slice(0, 10)
