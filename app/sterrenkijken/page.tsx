'use client'
import { useEffect } from 'react'
export default function SterrenkijkenRedirect() {
  useEffect(() => { window.location.replace('/?topic=Sterrenkijken') }, [])
  return null
}
