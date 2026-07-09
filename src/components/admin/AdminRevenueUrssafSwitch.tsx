import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { AUTO_ENTREPRENEUR_BNC_URSSAF_RATE } from '@/lib/admin/revenue-urssaf'

type AdminRevenueUrssafSwitchProps = {
  showNetAfterUrssaf: boolean
  onShowNetAfterUrssafChange: (value: boolean) => void
}

export function AdminRevenueUrssafSwitch({
  showNetAfterUrssaf,
  onShowNetAfterUrssafChange,
}: AdminRevenueUrssafSwitchProps) {
  const ratePercent = Math.round(AUTO_ENTREPRENEUR_BNC_URSSAF_RATE * 100)

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/30 px-4 py-3">
      <Switch
        id="admin-revenue-urssaf"
        checked={showNetAfterUrssaf}
        onCheckedChange={onShowNetAfterUrssafChange}
      />
      <Label htmlFor="admin-revenue-urssaf" className="cursor-pointer text-sm leading-snug">
        <span className="font-semibold text-foreground">
          {showNetAfterUrssaf ? 'Net après URSSAF' : 'Chiffre d’affaires brut'}
        </span>
        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
          {showNetAfterUrssaf
            ? `Estimation auto-entrepreneur BNC : −${ratePercent} % de cotisations sociales sur le CA (hors impôt sur le revenu).`
            : 'Montants encaissés avant cotisations URSSAF.'}
        </span>
      </Label>
    </div>
  )
}
