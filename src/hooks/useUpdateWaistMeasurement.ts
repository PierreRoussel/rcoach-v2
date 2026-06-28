import { useCallback, useState } from 'react'

import {
  useResolvedUserMeasurements,
  useUpsertUserMeasurements,
} from '@/hooks/useUserMeasurements'
import { useInsertWaistEntry } from '@/hooks/useWaistEntries'
import {
  clampWaistCm,
  hasWaistChanged,
} from '@/lib/measurements/waist'
import type { NutritionSex } from '@/lib/nutrition/types'

export function useUpdateWaistMeasurement() {
  const { data: resolved, raw: storedMeasurements } = useResolvedUserMeasurements()
  const upsertMeasurements = useUpsertUserMeasurements()
  const insertWaistEntry = useInsertWaistEntry()
  const [error, setError] = useState<string | null>(null)

  const updateWaist = useCallback(
    async (waistCm: number) => {
      setError(null)

      const normalizedWaist = clampWaistCm(waistCm)

      if (
        !resolved ||
        resolved.sex == null ||
        resolved.age == null ||
        resolved.height_cm == null
      ) {
        setError('Complétez d’abord vos mensurations corporelles dans le profil.')
        return false
      }

      try {
        await upsertMeasurements.mutateAsync({
          sex: resolved.sex as NutritionSex,
          age: resolved.age,
          height_cm: resolved.height_cm,
          waist_cm: normalizedWaist,
        })

        if (
          hasWaistChanged(
            storedMeasurements?.waist_cm ?? resolved.waist_cm,
            normalizedWaist,
          )
        ) {
          await insertWaistEntry.mutateAsync({
            waist_cm: normalizedWaist,
            source: 'adjust',
          })
        }

        return true
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : 'Impossible de mettre à jour le tour de taille.',
        )
        return false
      }
    },
    [insertWaistEntry, resolved, storedMeasurements, upsertMeasurements],
  )

  return {
    updateWaist,
    currentWaistCm: resolved?.waist_cm ?? null,
    isPending: upsertMeasurements.isPending || insertWaistEntry.isPending,
    error,
    setError,
  }
}
