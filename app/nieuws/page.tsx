'use client'
import { useEffect } from 'react'
export default function NieuwsRedirect() {
  useEffect(() => { window.location.replace('/#nieuws') }, [])
  return null
}
