import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export type AdminTableColumn<T> = {
  id: string
  header: string
  className?: string
  cell: (row: T) => ReactNode
}

type AdminDataTableProps<T> = {
  columns: Array<AdminTableColumn<T>>
  rows: T[]
  emptyMessage?: string
  className?: string
  getRowKey: (row: T) => string
}

export function AdminDataTable<T>({
  columns,
  rows,
  emptyMessage = 'Aucune donnée.',
  className,
  getRowKey,
}: AdminDataTableProps<T>) {
  return (
    <div className={cn('overflow-x-auto rounded-xl border border-border', className)}>
      <table className="w-full min-w-[36rem] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30 text-left text-muted-foreground">
            {columns.map((column) => (
              <th key={column.id} className={cn('px-3 py-2.5 font-medium', column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-6 text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={getRowKey(row)} className="border-b border-border/60 last:border-0">
                {columns.map((column) => (
                  <td key={column.id} className={cn('px-3 py-2.5 align-top', column.className)}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
