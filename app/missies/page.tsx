'use client'
import { useEffect } from 'react'
export default function MissiesRedirect() {
  useEffect(() => { window.location.replace('/?topic=Missies') }, [])
  return null
}
