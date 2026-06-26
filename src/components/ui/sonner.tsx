
import { type ToasterProps, Toaster as Sonner } from "sonner";

import { useTheme } from "@/design-system";
import { cn } from "@/lib/utils";

const Toaster = ({ className, style, ...props }: ToasterProps) => {
  const { colorMode } = useTheme();

  return (
    <Sonner
      theme={colorMode === "dark" ? "dark" : "light"}
      className={cn("toaster group", className)}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
