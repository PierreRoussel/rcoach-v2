import { useEffect, useState } from 'react'

import { Input } from '@/components/ui/input'
import { parseRestSecondsInput } from '@/lib/workout/parse-rest-seconds'
import { cn } from '@/lib/utils'

type RestSecondsInputProps = {
  id?: string
  value: number
  onCommit: (seconds: number) => void
  className?: string
  min?: number
}

export function RestSecondsInput({
  id,
  value,
  onCommit,
  className,
  min = 0,
}: RestSecondsInputProps) {
  const [draft, setDraft] = useState<string | null>(null)

  useEffect(() => {
    setDraft(null)
  }, [value])

  const displayValue = draft ?? String(value)

  function commit(raw: string) {
    const next = parseRestSecondsInput(raw)
    setDraft(null)
    onCommit(next)
  }

  return (
    <Input
      id={id}
      type="number"
      inputMode="numeric"
      min={min}
      value={displayValue}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={(event) => commit(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.currentTarget.blur()
        }
      }}
      className={cn(className)}
    />
  )
}
