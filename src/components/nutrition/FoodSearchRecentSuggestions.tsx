import { History } from 'lucide-react'

type FoodSearchRecentSuggestionsProps = {
  queries: string[]
  onSelect: (query: string) => void
}

export function FoodSearchRecentSuggestions({
  queries,
  onSelect,
}: FoodSearchRecentSuggestionsProps) {
  if (queries.length === 0) {
    return null
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/70 bg-card">
      <p className="px-3 pt-2.5 text-xs font-medium text-muted-foreground">
        Recherches récentes
      </p>
      <ul className="divide-y divide-border/70">
        {queries.map((query) => (
          <li key={query}>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm text-foreground hover:bg-muted/50"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(query)}
            >
              <History className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span className="truncate">{query}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
