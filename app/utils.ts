const MS_IN_DAY = 24 * 60 * 60 * 1000

export const daysFromNow = (days: number) =>
  new Date(Date.now() + days * MS_IN_DAY).toISOString().slice(0, 10)

export const seededShuffle = <T>(array: T[], seed = 1024) => {
  const arrayCopy = [...array]
  let currentIndex = arrayCopy.length,
    temporaryValue,
    randomIndex
  const random = () => {
    const x = Math.sin(seed++) * 10000
    return x - Math.floor(x)
  }
  // While there remain elements to shuffle...
  while (0 !== currentIndex) {
    // Pick a remaining element...
    randomIndex = Math.floor(random() * currentIndex)
    currentIndex -= 1
    // And swap it with the current element.
    temporaryValue = arrayCopy[currentIndex]
    arrayCopy[currentIndex] = arrayCopy[randomIndex]
    arrayCopy[randomIndex] = temporaryValue
  }
  return arrayCopy
}
