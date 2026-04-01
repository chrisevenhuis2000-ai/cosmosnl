'use client'
import { useEffect } from 'react'
export default function HerschrijverRedirect() {
  useEffect(() => { window.location.replace('/') }, [])
  return null
}
