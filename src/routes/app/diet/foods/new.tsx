import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Barcode } from 'lucide-react'
import { useEffect, useState } from 'react'
import { z } from 'zod'

import { FeedbackMessage } from '@/components/ui/feedback-message'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFoodMutations } from '@/hooks/useFoodFavorites'
import { useMealLogMutations } from '@/hooks/useMealLogMutations'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import {
  formatParsedNutrientForInput,
  parseNutritionLabelFr,
} from '@/lib/nutrition/label-scan/parse-nutrition-label-fr'
import { servingLabelForBasis } from '@/lib/nutrition/label-scan/detect-reference-basis'
import { recognizeLabelTextFromImage } from '@/lib/nutrition/label-scan/run-tesseract-ocr'
import { parsedLabelHasMacros } from '@/lib/nutrition/label-scan/types'
import type { ParsedNutritionLabel, ParsedNutritionFieldHintKey } from '@/lib/nutrition/label-scan/types'
import { resolveOffDraftFromBarcode } from '@/lib/nutrition/off-product-lookup'
import { findFoodByBarcodeInDatabase } from '@/lib/nutrition/barcode-lookup'
import { cacheFood } from '@/lib/nutrition/offline-food'
import { mapOffDraftToFoodInsert } from '@/lib/nutrition/open-food-facts'
import { useAuth } from '@/lib/nhost/AuthProvider'
import { toDateKey } from '@/lib/nutrition/dates'
import type { MealType } from '@/lib/nutrition/types'
import { PortionPickerSheet } from '@/components/nutrition/PortionPickerSheet'
import { LabelImagePrefillButton } from '@/components/nutrition/LabelImagePrefillButton'
import { FoodNutrientField } from '@/components/nutrition/FoodNutrientField'
import type { FoodNutrientInputValues } from '@/lib/nutrition/food-nutrient-warnings'
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
  const [feedback, setFeedback] = useState<{
    text: string
    variant: 'success' | 'error'
  } | null>(null)
  const [labelScanPending, setLabelScanPending] = useState(false)
  const [nutrientFieldHints, setNutrientFieldHints] = useState<
    Partial<Record<ParsedNutritionFieldHintKey, string>>
  >({})

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
    const existingFood = await findFoodByBarcodeInDatabase(nhost, code)
    if (existingFood) {
      await cacheFood(existingFood)
      setCreatedFood(existingFood)
      return
    }

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
    setNutrientFieldHints({})
    setStep(1)
  }

  function applyParsedNutrition(
    parsed: ParsedNutritionLabel,
    basis: ReturnType<typeof parseNutritionLabelFr>['basis'],
    fieldHints: Partial<Record<ParsedNutritionFieldHintKey, string>> = {},
  ) {
    if (parsed.calories != null) {
      setCalories(formatParsedNutrientForInput(parsed.calories))
    }
    if (parsed.carbsG != null) {
      setCarbsG(formatParsedNutrientForInput(parsed.carbsG))
    }
    if (parsed.proteinG != null) {
      setProteinG(formatParsedNutrientForInput(parsed.proteinG))
    }
    if (parsed.fatG != null) {
      setFatG(formatParsedNutrientForInput(parsed.fatG))
    }
    if (parsed.saltG != null) {
      setSaltG(formatParsedNutrientForInput(parsed.saltG))
    }
    if (parsed.sugarG != null) {
      setSugarG(formatParsedNutrientForInput(parsed.sugarG))
    }
    if (parsed.saturatedFatG != null) {
      setSaturatedFatG(formatParsedNutrientForInput(parsed.saturatedFatG))
    }

    setServingSizeG('100')
    setServingLabel(servingLabelForBasis(basis))
    setNutrientFieldHints(fieldHints)
  }

  function updateNutrientField(
    field: ParsedNutritionFieldHintKey,
    value: string,
    setter: (value: string) => void,
  ) {
    setter(value)
    setNutrientFieldHints((current) => {
      if (!current[field]) {
        return current
      }

      const next = { ...current }
      delete next[field]
      return next
    })
  }

  async function handleLabelImage(file: File) {
    setLabelScanPending(true)
    setFeedback(null)

    try {
      const text = await recognizeLabelTextFromImage(file)
      const result = parseNutritionLabelFr(text)

      if (!parsedLabelHasMacros(result.nutrients)) {
        setFeedback({
          text: 'Aucune valeur nutritionnelle détectée. Réessayez avec une photo plus nette du tableau.',
          variant: 'error',
        })
        return
      }

      applyParsedNutrition(result.nutrients, result.basis, result.fieldHints)
      setStep(1)

      const basisLabel = servingLabelForBasis(result.basis)
      const warningSuffix =
        result.warnings.length > 0 ? ` ${result.warnings.join(' ')}` : ''
      const confidenceHint =
        result.confidence === 'low'
          ? ' Confiance faible — contrôle recommandé.'
          : result.confidence === 'medium'
            ? ' Vérifiez les valeurs avant enregistrement.'
            : ''

      setFeedback({
        text: `Valeurs détectées pour ${basisLabel}.${confidenceHint}${warningSuffix}`,
        variant: result.confidence === 'low' ? 'error' : 'success',
      })
    } catch (labelError) {
      setFeedback({
        text:
          labelError instanceof Error
            ? labelError.message
            : "Lecture de l'image impossible.",
        variant: 'error',
      })
    } finally {
      setLabelScanPending(false)
    }
  }

  async function handleScan() {
    setFeedback(null)

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
      setFeedback({
        text: scanError instanceof Error ? scanError.message : 'Scan impossible.',
        variant: 'error',
      })
    }
  }

  async function handleCreateFood() {
    setFeedback(null)

    if (!name.trim()) {
      setFeedback({ text: 'Le nom est obligatoire.', variant: 'error' })
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
      setFeedback({
        text: createError instanceof Error ? createError.message : 'Création impossible.',
        variant: 'error',
      })
    }
  }

  const nutrientInputs: FoodNutrientInputValues = {
    calories,
    carbsG,
    proteinG,
    fatG,
    saltG,
    sugarG,
    saturatedFatG,
    servingSizeG,
  }
  const perServingLabel = servingLabel.trim() || '100 g'

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="size-9 shrink-0" asChild>
          <Link
            to="/app/diet/add"
            search={{ date, mealType }}
            aria-label="Retour à l'ajout d'aliment"
          >
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <div className="min-w-0 space-y-1">
          <h1 className="font-display text-2xl font-black text-foreground">Nouvel aliment</h1>
          <p className="text-sm text-muted-foreground">
            {step === 0 ? "Choisissez le mode d'ajout." : 'Renseignez les informations nutritionnelles.'}
          </p>
        </div>
      </div>

      {step === 0 ? (
        <div className="grid gap-3">
          <Button type="button" onClick={() => void handleScan()}>
            Scanner un code-barres
          </Button>
          <LabelImagePrefillButton
            className="w-full"
            pending={labelScanPending}
            onFileSelected={(file) => void handleLabelImage(file)}
          />
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
          <LabelImagePrefillButton
            className="w-full"
            pending={labelScanPending}
            onFileSelected={(file) => void handleLabelImage(file)}
          />
          <div className="grid grid-cols-2 gap-3">
            <FoodNutrientField
              field="calories"
              label={`Calories / ${perServingLabel}`}
              value={calories}
              allValues={nutrientInputs}
              hint={nutrientFieldHints.calories}
              onChange={(value) => updateNutrientField('calories', value, setCalories)}
            />
            <FoodNutrientField
              field="carbsG"
              label={`Glucides / ${perServingLabel}`}
              value={carbsG}
              allValues={nutrientInputs}
              onChange={(value) => updateNutrientField('carbsG', value, setCarbsG)}
            />
            <FoodNutrientField
              field="proteinG"
              label={`Protéines / ${perServingLabel}`}
              value={proteinG}
              allValues={nutrientInputs}
              onChange={(value) => updateNutrientField('proteinG', value, setProteinG)}
            />
            <FoodNutrientField
              field="fatG"
              label={`Lipides / ${perServingLabel}`}
              value={fatG}
              allValues={nutrientInputs}
              onChange={(value) => updateNutrientField('fatG', value, setFatG)}
            />
            <FoodNutrientField
              field="saltG"
              label={`Sel / ${perServingLabel}`}
              value={saltG}
              allValues={nutrientInputs}
              onChange={(value) => updateNutrientField('saltG', value, setSaltG)}
            />
            <FoodNutrientField
              field="sugarG"
              label={`Sucre / ${perServingLabel}`}
              value={sugarG}
              allValues={nutrientInputs}
              onChange={(value) => updateNutrientField('sugarG', value, setSugarG)}
            />
            <FoodNutrientField
              field="saturatedFatG"
              label={`Gras saturés / ${perServingLabel}`}
              value={saturatedFatG}
              allValues={nutrientInputs}
              onChange={(value) => updateNutrientField('saturatedFatG', value, setSaturatedFatG)}
            />
            <FoodNutrientField
              field="servingSizeG"
              label="Portion (g)"
              value={servingSizeG}
              allValues={nutrientInputs}
              onChange={setServingSizeG}
            />
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

      {feedback ? (
        <FeedbackMessage variant={feedback.variant}>{feedback.text}</FeedbackMessage>
      ) : null}

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
                setFeedback({
                  text: 'Enregistré localement. Synchronisation à la reconnexion.',
                  variant: 'success',
                })
              }
              void navigate({
                to: '/app/diet/meals/$mealType',
                params: { mealType },
                search: { date },
                replace: true,
              })
            })
            .catch((error: Error) =>
              setFeedback({ text: error.message, variant: 'error' }),
            )
        }}
      />

      {scanner}
    </div>
  )
}
