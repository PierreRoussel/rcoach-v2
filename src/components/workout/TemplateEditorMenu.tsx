import { Link } from '@tanstack/react-router'
import { CalendarClock, MoreVertical } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { buildPlanningSearchParams } from '@/lib/schedule/planning-navigation'

type TemplateEditorMenuProps = {
  templateId: string
  title: string
}

export function TemplateEditorMenu({
  templateId,
  title,
}: TemplateEditorMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 rounded-full"
          aria-label="Actions de la séance"
        >
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link
            to="/app/planning"
            search={buildPlanningSearchParams({
              templateId,
              title,
              openScheduleForm: true,
            })}
          >
            <CalendarClock className="size-4" />
            Programmer une recurrence
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
