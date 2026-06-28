import { Ruler } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FormMessage } from '@/components/ui/form'
import {
  useUpsertUserMeasurements,
  useResolvedUserMeasurements,
} from '@/hooks/useUserMeasurements'
import { useInsertWaistEntry } from '@/hooks/useWaistEntries'
import type { NutritionSex } from '@/lib/nutrition/types'

const SEX_LABELS: Record<NutritionSex, string> = {
  male: 'Homme',
  female: 'Femme',
}

function formatMeasurement(value: number | null | undefined, unit: string) {
  if (value == null || !Number.isFinite(value)) {
    return '—'
  }

  return `${value} ${unit}`
}

export function UserMeasurementsSection() {
  const { data: resolved, raw: storedMeasurements, isLoading } =
    useResolvedUserMeasurements()
  const upsert = useUpsertUserMeasurements()
  const insertWaistEntry = useInsertWaistEntry()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [sex, setSex] = useState<NutritionSex>('male')
  const [age, setAge] = useState('')
  const [heightCm, setHeightCm] = useState('')
  const [waistCm, setWaistCm] = useState('')

  useEffect(() => {
    if (!resolved) {
      return
    }

    setSex(resolved.sex ?? 'male')
    setAge(resolved.age != null ? String(resolved.age) : '')
    setHeightCm(resolved.height_cm != null ? String(resolved.height_cm) : '')
    setWaistCm(resolved.waist_cm != null ? String(resolved.waist_cm) : '')
  }, [resolved])

  async function handleSave() {
    setError(null)
    setMessage(null)

    const parsedAge = Number.parseInt(age, 10)
    const parsedHeight = Number.parseFloat(heightCm.replace(',', '.'))
    const parsedWaist = Number.parseFloat(waistCm.replace(',', '.'))

    if (!Number.isFinite(parsedAge) || parsedAge <= 0) {
      setError('Indiquez un âge valide.')
      return
    }

    if (!Number.isFinite(parsedHeight) || parsedHeight <= 0) {
      setError('Indiquez une taille valide.')
      return
    }

    if (!Number.isFinite(parsedWaist) || parsedWaist <= 0) {
      setError('Indiquez un tour de taille valide.')
      return
    }

    const waistChanged =
      storedMeasurements?.waist_cm == null ||
      Math.abs(Number(storedMeasurements.waist_cm) - parsedWaist) >= 0.05

    try {
      await upsert.mutateAsync({
        sex,
        age: parsedAge,
        height_cm: parsedHeight,
        waist_cm: parsedWaist,
      })

      if (waistChanged) {
        await insertWaistEntry.mutateAsync({
          waist_cm: parsedWaist,
          source: 'manual',
        })
      }
      setMessage('Mensurations enregistrées.')
      setDialogOpen(false)
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Impossible de sauvegarder vos mensurations.',
      )
    }
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement des mensurations...</p>
  }

  const hasData =
    resolved?.sex != null ||
    resolved?.age != null ||
    resolved?.height_cm != null ||
    resolved?.waist_cm != null

  return (
    <>
      <Card className="rounded-2xl border-border">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="font-display font-black">Mensurations</CardTitle>
              <CardDescription>
                Âge, taille, sexe et tour de taille pour personnaliser vos estimations.
              </CardDescription>
            </div>
            <Ruler className="size-5 text-primary" aria-hidden />
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {hasData ? (
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Sexe</dt>
                <dd className="font-medium">
                  {resolved?.sex ? SEX_LABELS[resolved.sex] : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Âge</dt>
                <dd className="font-medium">
                  {resolved?.age != null ? `${resolved.age} ans` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Taille</dt>
                <dd className="font-medium">
                  {formatMeasurement(resolved?.height_cm, 'cm')}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Tour de taille</dt>
                <dd className="font-medium">
                  {formatMeasurement(resolved?.waist_cm, 'cm')}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              Renseignez vos mensurations pour affiner le calcul de vos besoins
              énergétiques.
            </p>
          )}

          {message ? <FormMessage>{message}</FormMessage> : null}

          <Button
            type="button"
            variant="soft"
            size="sm"
            className="rounded-full"
            onClick={() => {
              setError(null)
              setDialogOpen(true)
            }}
          >
            {hasData ? 'Modifier les mensurations' : 'Renseigner mes mensurations'}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display font-black">Mensurations</DialogTitle>
            <DialogDescription>
              Ces informations sont utilisées pour estimer vos besoins nutritionnels.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sexe</Label>
              <Select value={sex} onValueChange={(value) => setSex(value as NutritionSex)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Homme</SelectItem>
                  <SelectItem value="female">Femme</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="measurements-age">Âge</Label>
                <Input
                  id="measurements-age"
                  value={age}
                  onChange={(event) => setAge(event.target.value)}
                  inputMode="numeric"
                  placeholder="30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="measurements-height">Taille (cm)</Label>
                <Input
                  id="measurements-height"
                  value={heightCm}
                  onChange={(event) => setHeightCm(event.target.value)}
                  inputMode="decimal"
                  placeholder="175"
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="measurements-waist">Tour de taille (cm)</Label>
                <Input
                  id="measurements-waist"
                  value={waistCm}
                  onChange={(event) => setWaistCm(event.target.value)}
                  inputMode="decimal"
                  placeholder="80"
                />
              </div>
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={upsert.isPending || insertWaistEntry.isPending}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
