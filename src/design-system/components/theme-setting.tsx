import { Monitor, Moon, Sun } from 'lucide-react'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useTheme, type ColorModePreference } from '@/design-system/theme-provider'
import { themeSupportsColorModePreference } from '@/design-system/themes'

const options: {
  value: ColorModePreference
  label: string
  icon: typeof Sun
}[] = [
  { value: 'light', label: 'Clair', icon: Sun },
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'system', label: 'Systeme', icon: Monitor },
]

export function ThemeSetting() {
  const { themeId, colorModePreference, setColorModePreference } = useTheme()

  if (!themeSupportsColorModePreference(themeId)) {
    return null
  }

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={colorModePreference}
      onValueChange={(value) => {
        if (value) {
          setColorModePreference(value as ColorModePreference)
        }
      }}
      className="w-full rounded-xl"
    >
      {options.map(({ value, label, icon: Icon }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          aria-label={label}
          className="flex-1 gap-1.5 rounded-xl text-xs"
        >
          <Icon className="size-3.5" />
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
