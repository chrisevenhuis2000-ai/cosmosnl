'use client'
import { useEffect } from 'react'
export default function NieuwsbriefRedirect() {
  useEffect(() => { window.location.replace('/#nieuwsbrief') }, [])
  return null
}
