'use client'
import { useEffect } from 'react'
export default function EducatieRedirect() {
  useEffect(() => { window.location.replace('/?topic=Educatie') }, [])
  return null
}
