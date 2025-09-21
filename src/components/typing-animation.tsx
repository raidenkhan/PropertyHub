"use client"
import { useState, useEffect } from "react"

interface TypingAnimationProps {
  text: string
  className?: string
  speed?: number
}

export function TypingAnimation({ text, className = "", speed = 100 }: TypingAnimationProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex])
        setCurrentIndex((prev) => prev + 1)
      }, speed)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, text, speed])

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 500)

    return () => clearInterval(cursorInterval)
  }, [])

  return (
    <span className={className}>
      {displayedText}
      <span
        className={`inline-block w-0.5 h-[1em] bg-current ml-1 ${showCursor ? "opacity-100" : "opacity-0"} transition-opacity`}
      >
        
      </span>
    </span>
  )
}
