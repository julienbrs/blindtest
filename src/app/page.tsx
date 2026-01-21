'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingScreen } from '@/components/ui/LoadingScreen'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/play')
  }, [router])

  return <LoadingScreen message="Chargement..." />
}
