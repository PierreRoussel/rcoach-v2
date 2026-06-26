import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { WorkoutPersonalRecordsList } from '@/components/workout/WorkoutPersonalRecordsList'
import type { PersonalRecordHit } from '@/lib/stats/workout-metrics'

type WorkoutRecordsDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  records: PersonalRecordHit[]
  workoutTitle: string
}

export function WorkoutRecordsDrawer({
  open,
  onOpenChange,
  records,
  workoutTitle,
}: WorkoutRecordsDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] overflow-y-auto rounded-t-2xl px-0">
        <DrawerHeader className="px-4 text-left">
          <DrawerTitle className="font-display font-black">
            {records.length > 1
              ? `${records.length} records personnels`
              : records.length === 1
                ? 'Record personnel'
                : 'Records personnels'}
          </DrawerTitle>
          <DrawerDescription>
            Performances batues par rapport a votre historique avant {workoutTitle}.
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-6">
          <WorkoutPersonalRecordsList records={records} />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
