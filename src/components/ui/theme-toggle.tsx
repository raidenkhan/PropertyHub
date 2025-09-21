"use client"
import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="w-9 h-9 px-0">
        <div className="h-4 w-4" />
      </Button>
    )
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-9 h-9 px-0 hover:bg-accent transition-colors"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <Sun
        className={`h-4 w-4 rotate-0 scale-100 transition-all ${
          resolvedTheme === "dark" ? "-rotate-90 scale-0" : ""
        }`}
      />
      <Moon
        className={`absolute h-4 w-4 rotate-90 scale-0 transition-all ${
          resolvedTheme === "dark" ? "rotate-0 scale-100" : ""
        }`}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}