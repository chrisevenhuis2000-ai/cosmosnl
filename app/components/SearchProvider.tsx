'use client'

import SearchModal, { useSearchModal } from './SearchModal'

export default function SearchProvider() {
  const { open, setOpen } = useSearchModal()
  return <SearchModal open={open} onClose={() => setOpen(false)} />
}
