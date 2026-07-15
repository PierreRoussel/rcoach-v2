import { Link } from '@tanstack/react-router'
import { CalendarClock, MoreVertical, Share2 } from 'lucide-react'
import { useState } from 'react'

import { TemplateShareDialog } from '@/components/workout/TemplateShareDialog'
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
  shareToken?: string | null
}

export function TemplateEditorMenu({
  templateId,
  title,
  shareToken = null,
}: TemplateEditorMenuProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 rounded-full"
            aria-label="Actions du modèle"
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => setShareDialogOpen(true)}>
            <Share2 className="size-4" />
            Partager le modèle
          </DropdownMenuItem>
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

      <TemplateShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        template={{ id: templateId, name: title, share_token: shareToken }}
      />
    </>
  )
}
