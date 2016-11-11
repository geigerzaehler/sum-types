export function caseof (target, cases) {
  for (const i in cases) {
    const patterns = cases[i].slice()
    const handler = patterns.pop()
    const matches = patterns.some((p) => p === target || p === otherwise)
    if (matches) {
      return handler(target)
    }
  }

  throw new Error('Unmatched case for ' + target)
}

export const otherwise = {}
