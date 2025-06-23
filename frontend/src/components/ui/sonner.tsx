"use client"

import { useTheme } from "next-themes" // Changed to use next-themes
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme() // Use resolvedTheme from next-themes

  // Adapt theme logic for Sonner. Sonner expects 'light', 'dark', or 'system'.
  // resolvedTheme will be 'light' or 'dark'.
  // The original "sunset" theme is not standard in next-themes by default,
  // mapping it to 'light' as per previous logic.
  // For simplicity, directly use resolvedTheme if it's 'light' or 'dark'.
  const toastThemeProp = resolvedTheme === 'dark' ? 'dark' : 'light';

  return (
    <Sonner
      theme={toastThemeProp}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-zinc-950 group-[.toaster]:border-zinc-200 group-[.toaster]:shadow-lg dark:group-[.toaster]:bg-zinc-950 dark:group-[.toaster]:text-zinc-50 dark:group-[.toaster]:border-zinc-800",
          description: "group-[.toast]:text-zinc-500 dark:group-[.toast]:text-zinc-400",
          actionButton:
            "group-[.toast]:bg-zinc-900 group-[.toast]:text-zinc-50 dark:group-[.toast]:bg-zinc-50 dark:group-[.toast]:text-zinc-900",
          cancelButton:
            "group-[.toast]:bg-zinc-100 group-[.toast]:text-zinc-500 dark:group-[.toast]:bg-zinc-800 dark:group-[.toast]:text-zinc-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
