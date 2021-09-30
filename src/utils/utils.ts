
export function getRandomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(arr.length * Math.random())]
}

const pluralization = {
  ' 21 рекомендаций': ' двадцать одна рекомендация',
  ' 1 рекомендаций': ' одна рекомендация',
  ' 2 рекомендаций': ' две рекомендации',
  ' 3 рекомендаций': ' три рекомендации',
  ' 4 рекомендаций': ' четыре рекомендации'
}

export const fixPluralization = (text: string) => {
  let newText: string = text
  const keys = Object.keys(pluralization)
  keys.forEach((key) => {
    if (text.toLowerCase().includes(key.toLowerCase())) {
      //@ts-ignore
      newText = text.replace(key, pluralization[key])
      //@ts-ignore
      newText = newText.replace(key.toLowerCase(), pluralization[key].toLowerCase())
    }
  })
  return newText
}