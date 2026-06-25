import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { Barcode } from 'lucide-react'
import { useEffect, useState } from 'react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/design-system'
import { useFoodMutations } from '@/hooks/useFoodFavorites'
import { useMealLogMutations } from '@/hooks/useMealLogMutations'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { resolveOffDraftFromBarcode } from '@/lib/nutrition/off-product-lookup'
import { mapOffDraftToFoodInsert } from '@/lib/nutrition/open-food-facts'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { toDateKey } from '@/lib/nutrition/dates'
import type { MealType } from '@/lib/nutrition/types'
import { PortionPickerSheet } from '@/components/nutrition/PortionPickerSheet'
import type { Food } from '@/lib/nutrition/types'

const newFoodSearchSchema = z.object({
  date: z.string().optional(),
  mealType: z.enum(['breakfast', 'lunch', 'snack', 'dinner']).optional(),
  barcode: z.string().optional(),
  mode: z.enum(['manual', 'barcode']).optional(),
})

export const Route = createFileRoute('/app/diet/foods/new')({
  validateSearch: newFoodSearchSchema,
  component: NewFoodPage,
})

function NewFoodPage() {
  const navigate = useNavigate({ from: '/app/diet/foods/new' })
  const search = Route.useSearch()
  const date = search.date ?? toDateKey(new Date())
  const mealType = (search.mealType ?? 'breakfast') as MealType
  const [step, setStep] = useState(search.mode === 'manual' ? 1 : 0)
  const [barcode, setBarcode] = useState(search.barcode ?? '')
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [calories, setCalories] = useState('0')
  const [carbsG, setCarbsG] = useState('0')
  const [proteinG, setProteinG] = useState('0')
  const [fatG, setFatG] = useState('0')
  const [saltG, setSaltG] = useState('')
  const [sugarG, setSugarG] = useState('')
  const [saturatedFatG, setSaturatedFatG] = useState('')
  const [servingSizeG, setServingSizeG] = useState('100')
  const [servingLabel, setServingLabel] = useState('100 g')
  const [createdFood, setCreatedFood] = useState<Food | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const { createFood, lookupBarcode } = useFoodMutations()
  const { addEntry } = useMealLogMutations()
  const { requestScan, scanner } = useBarcodeScanner()
  const { nhost } = useAuth()

  useEffect(() => {
    if (!search.barcode) {
      return
    }

    void prefillFromBarcode(search.barcode)
  }, [search.barcode])

  async function prefillFromBarcode(code: string) {
    const draft = await resolveOffDraftFromBarcode(nhost, code)
    if (!draft) {
      setBarcode(code)
      setStep(1)
      return
    }

    setBarcode(draft.barcode)
    setName(draft.name)
    setBrand(draft.brand ?? '')
    setCalories(String(draft.calories))
    setCarbsG(String(draft.carbsG))
    setProteinG(String(draft.proteinG))
    setFatG(String(draft.fatG))
    setSaltG(draft.saltG != null ? String(draft.saltG) : '')
    setSugarG(draft.sugarG != null ? String(draft.sugarG) : '')
    setSaturatedFatG(draft.saturatedFatG != null ? String(draft.saturatedFatG) : '')
    setServingSizeG(String(draft.servingSizeG))
    setServingLabel(draft.servingLabel)
    setStep(1)
  }

  async function handleScan() {
    setMessage(null)

    try {
      const code = await requestScan()
      if (!code) {
        return
      }

      const existing = await lookupBarcode(code)
      if (existing) {
        setCreatedFood(existing)
        return
      }

      await prefillFromBarcode(code)
    } catch (scanError) {
      setMessage(scanError instanceof Error ? scanError.message : 'Scan impossible.')
    }
  }

  async function handleCreateFood() {
    setMessage(null)

    if (!name.trim()) {
      setMessage('Le nom est obligatoire.')
      return
    }

    const offDraft = barcode.trim()
      ? {
          barcode: barcode.trim(),
          offProductId: barcode.trim(),
          name: name.trim(),
          brand: brand.trim() || null,
          calories: Number(calories) || 0,
          carbsG: Number(carbsG) || 0,
          proteinG: Number(proteinG) || 0,
          fatG: Number(fatG) || 0,
          saltG: saltG ? Number(saltG) : null,
          sugarG: sugarG ? Number(sugarG) : null,
          saturatedFatG: saturatedFatG ? Number(saturatedFatG) : null,
          servingSizeG: Number(servingSizeG) || 100,
          servingLabel: servingLabel.trim() || '100 g',
        }
      : null

    try {
      const food = await createFood.mutateAsync(
        offDraft
          ? mapOffDraftToFoodInsert(offDraft)
          : {
              barcode: null,
              name: name.trim(),
              brand: brand.trim() || null,
              calories: Number(calories) || 0,
              carbs_g: Number(carbsG) || 0,
              protein_g: Number(proteinG) || 0,
              fat_g: Number(fatG) || 0,
              salt_g: saltG ? Number(saltG) : null,
              sugar_g: sugarG ? Number(sugarG) : null,
              saturated_fat_g: saturatedFatG ? Number(saturatedFatG) : null,
              serving_size_g: Number(servingSizeG) || 100,
              serving_label: servingLabel.trim() || '100 g',
              source: 'user',
            },
      )

      setCreatedFood(food)
    } catch (createError) {
      setMessage(createError instanceof Error ? createError.message : 'Création impossible.')
    }
  }

  return (
    <div className="space-y-4 pb-8">
      <PageHeader
        title="Nouvel aliment"
        description={step === 0 ? "Choisissez le mode d'ajout." : 'Renseignez les informations nutritionnelles.'}
      />

      {step === 0 ? (
        <div className="grid gap-3">
          <Button type="button" onClick={() => void handleScan()}>
            Scanner un code-barres
          </Button>
          <Button type="button" variant="outline" onClick={() => setStep(1)}>
            Ajouter manuellement
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" className="rounded-full" onClick={() => void handleScan()}>
              <Barcode className="size-4" />
              {barcode ? 'Rescanner' : 'Scanner le code-barres'}
            </Button>
            {barcode ? (
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                {barcode}
              </span>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brand">Marque</Label>
            <Input id="brand" value={brand} onChange={(event) => setBrand(event.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Calories / 100 g" value={calories} onChange={setCalories} />
            <Field label="Glucides / 100 g" value={carbsG} onChange={setCarbsG} />
            <Field label="Protéines / 100 g" value={proteinG} onChange={setProteinG} />
            <Field label="Lipides / 100 g" value={fatG} onChange={setFatG} />
            <Field label="Sel / 100 g" value={saltG} onChange={setSaltG} />
            <Field label="Sucre / 100 g" value={sugarG} onChange={setSugarG} />
            <Field label="Gras satures / 100 g" value={saturatedFatG} onChange={setSaturatedFatG} />
            <Field label="Portion (g)" value={servingSizeG} onChange={setServingSizeG} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="servingLabel">Libellé portion</Label>
            <Input
              id="servingLabel"
              value={servingLabel}
              onChange={(event) => setServingLabel(event.target.value)}
            />
          </div>
          <Button type="button" className="w-full" onClick={() => void handleCreateFood()} disabled={!name.trim()}>
            Enregistrer l'aliment
          </Button>
        </div>
      )}

      {message ? <p className="text-sm text-destructive">{message}</p> : null}

      <PortionPickerSheet
        open={Boolean(createdFood)}
        onOpenChange={(open) => {
          if (!open) {
            setCreatedFood(null)
          }
        }}
        food={createdFood}
        isSubmitting={addEntry.isPending}
        onConfirm={(portion) => {
          if (!createdFood) {
            return
          }

          void addEntry
            .mutateAsync({
              loggedDate: date,
              mealType,
              food: createdFood,
              portion,
            })
            .then((result) => {
              if (result.offline) {
                setMessage('Enregistré localement. Synchronisation à la reconnexion.')
              }
              void navigate({
                to: '/app/diet/meals/$mealType',
                params: { mealType },
                search: { date },
              })
            })
            .catch((error: Error) => setMessage(error.message))
        }}
      />

      {scanner}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} inputMode="decimal" />
    </div>
  )
}
