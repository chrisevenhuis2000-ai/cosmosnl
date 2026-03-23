'use client'
import { useEffect } from 'react'
export default function EnRedirect() {
  useEffect(() => { window.location.replace('/') }, [])
  return null
}
