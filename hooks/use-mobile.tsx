"use client"

import { useState, useEffect } from "react"

function debounce(func: (...args: any[]) => void, wait: number) {
  let timeout: NodeJS.Timeout
  return (...args: any[]) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function useMobile(breakpoint: number = 768) {
  const [isMobile, setIsMobile] = useState(false)
  const [isPortrait, setIsPortrait] = useState(false)

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < breakpoint)
      setIsPortrait(window.innerHeight > window.innerWidth)
    }

    const debouncedCheckIfMobile = debounce(checkIfMobile, 100)
    checkIfMobile()
    window.addEventListener("resize", debouncedCheckIfMobile)
    return () => window.removeEventListener("resize", debouncedCheckIfMobile)
  }, [breakpoint])

  return { isMobile, isPortrait }
}