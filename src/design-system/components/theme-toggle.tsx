import { Moon, Sun } from 'lucide-react'

import { useTheme } from '@/design-system/theme-provider'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { colorMode, toggleColorMode } = useTheme()

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="rounded-xl"
      onClick={toggleColorMode}
      aria-label={
        colorMode === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'
      }
    >
      {colorMode === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
