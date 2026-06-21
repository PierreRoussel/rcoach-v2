import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FormMessage } from '@/components/ui/form'
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
      <Card>
        <CardHeader>
          <CardTitle>Import Hevy</CardTitle>
          <CardDescription>
            Importez un export CSV Hevy. Les exercices sont rapproches de la
            bibliotheque publique par nom exact.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={isImporting || !exercises?.length}
            onChange={(event) => void handleFileChange(event)}
          />
          {fileName ? (
            <p className="text-sm text-muted-foreground">Fichier : {fileName}</p>
          ) : null}
          {progress ? (
            <p className="text-sm text-green-700">{progress}</p>
          ) : null}
          {error ? <FormMessage>{error}</FormMessage> : null}
          <Button
            type="button"
            variant="outline"
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
