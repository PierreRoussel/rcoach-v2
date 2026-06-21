import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Upload } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FormMessage } from '@/components/ui/form'
import { PageHeader, Pill } from '@/design-system'
import { usePublicExercises } from '@/hooks/useProfile'
import {
  buildExerciseLookup,
  mapHevyWorkoutToInsertInput,
  parseHevyCsv,
} from '@/lib/hevy/import'
import { INSERT_WORKOUT } from '@/lib/graphql/operations'
import { graphqlRequest } from '@/lib/graphql/request'
import { useAuth } from '@/lib/nhost/AuthProvider'

export const Route = createFileRoute('/app/import')({
  component: ImportPage,
})

function ImportPage() {
  const { nhost } = useAuth()
  const { data: exercises } = usePublicExercises()
  const [fileName, setFileName] = useState<string | null>(null)
  const [progress, setProgress] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !exercises?.length) {
      return
    }

    setError(null)
    setProgress(null)
    setIsImporting(true)
    setFileName(file.name)

    try {
      const content = await file.text()
      const parsedWorkouts = parseHevyCsv(content)
      const lookup = buildExerciseLookup(exercises)
      let imported = 0
      let skipped = 0

      for (const [index, workout] of parsedWorkouts.entries()) {
        setProgress(
          `Import ${index + 1}/${parsedWorkouts.length} — ${workout.title}`,
        )

        const object = mapHevyWorkoutToInsertInput(workout, lookup)
        if (!object) {
          skipped += 1
          continue
        }

        await graphqlRequest(nhost, INSERT_WORKOUT, { object })
        imported += 1
      }

      setProgress(
        `Termine : ${imported} seance(s) importee(s), ${skipped} ignoree(s).`,
      )
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : 'Import impossible.',
      )
    } finally {
      setIsImporting(false)
      event.target.value = ''
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="Migration"
        title="Import Hevy"
        description="Importez un export CSV Hevy en rapprochant les exercices par nom exact."
      />

      <Card className="rounded-2xl border-border">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="font-display font-black">Fichier CSV</CardTitle>
              <CardDescription>
                Selectionnez votre export Hevy au format CSV.
              </CardDescription>
            </div>
            <Pill tone="primary">
              <Upload className="size-3" />
              Hevy
            </Pill>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-soft-purple/40 px-4 py-8 text-center transition-colors hover:bg-soft-purple/60">
            <Upload className="mb-2 size-6 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Choisir un fichier CSV
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              {isImporting ? 'Import en cours...' : 'Cliquez pour parcourir'}
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              disabled={isImporting || !exercises?.length}
              className="sr-only"
              onChange={(event) => void handleFileChange(event)}
            />
          </label>
          {fileName ? (
            <p className="font-data text-sm text-muted-foreground">
              Fichier : {fileName}
            </p>
          ) : null}
          {progress ? (
            <p className="text-sm text-secondary-foreground">{progress}</p>
          ) : null}
          {error ? <FormMessage>{error}</FormMessage> : null}
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            disabled={isImporting}
            onClick={() => {
              setFileName(null)
              setProgress(null)
              setError(null)
            }}
          >
            Reinitialiser
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
