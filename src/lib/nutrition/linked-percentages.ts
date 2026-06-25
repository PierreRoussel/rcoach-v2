export function mealCaloriesFromPercent(dailyCalories: number, percent: number) {
  return Math.round((dailyCalories * percent) / 100)
}

export function adjustLinkedPercentages<T extends string>(
  current: Record<T, number>,
  changedKey: T,
  nextValue: number,
  minPerItem = 5,
): Record<T, number> {
  const keys = Object.keys(current) as T[]
  const others = keys.filter((key) => key !== changedKey)
  const maxForChanged = 100 - minPerItem * others.length
  const clamped = Math.max(minPerItem, Math.min(maxForChanged, Math.round(nextValue)))

  const result = { ...current, [changedKey]: clamped }
  const targetOthersTotal = 100 - clamped
  const previousOthersTotal = others.reduce((sum, key) => sum + current[key], 0)

  if (others.length === 0) {
    return result
  }

  if (previousOthersTotal <= 0) {
    distributeEvenly(result, others, targetOthersTotal, minPerItem)
    return balanceTo100(result, keys, minPerItem, changedKey)
  }

  const weighted = others.map((key) => {
    const exact = (current[key] / previousOthersTotal) * targetOthersTotal
    const floored = Math.floor(exact)
    return {
      key,
      exact,
      value: Math.max(minPerItem, floored),
      fraction: exact - floored,
    }
  })

  for (const item of weighted) {
    result[item.key] = item.value
  }

  return balanceTo100(result, keys, minPerItem, changedKey, weighted)
}

function distributeEvenly<T extends string>(
  result: Record<T, number>,
  keys: T[],
  targetTotal: number,
  minPerItem: number,
) {
  const base = Math.floor(targetTotal / keys.length)
  let remainder = targetTotal - base * keys.length

  for (const key of keys) {
    const bonus = remainder > 0 ? 1 : 0
    if (remainder > 0) {
      remainder -= 1
    }
    result[key] = Math.max(minPerItem, base + bonus)
  }
}

function balanceTo100<T extends string>(
  result: Record<T, number>,
  keys: T[],
  minPerItem: number,
  pinnedKey?: T,
  weighted?: Array<{ key: T; fraction: number }>,
) {
  const balanced = { ...result }
  let total = sumValues(balanced, keys)

  while (total !== 100) {
    const diff = 100 - total
    const candidates = keys
      .filter((key) => key !== pinnedKey)
      .filter((key) => (diff > 0 ? balanced[key] < 100 : balanced[key] > minPerItem))
      .sort((left, right) => {
        if (diff > 0) {
          const leftWeight = weighted?.find((item) => item.key === left)?.fraction ?? 0
          const rightWeight = weighted?.find((item) => item.key === right)?.fraction ?? 0
          return rightWeight - leftWeight
        }

        const leftWeight = weighted?.find((item) => item.key === left)?.fraction ?? 0
        const rightWeight = weighted?.find((item) => item.key === right)?.fraction ?? 0
        return leftWeight - rightWeight
      })

    if (candidates.length === 0) {
      break
    }

    const key = candidates[0]
    balanced[key] += diff > 0 ? 1 : -1
    total = sumValues(balanced, keys)
  }

  return balanced
}

function sumValues<T extends string>(values: Record<T, number>, keys: T[]) {
  return keys.reduce((sum, key) => sum + values[key], 0)
}
