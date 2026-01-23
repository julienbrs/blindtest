'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { PageTransition } from '@/components/ui/PageTransition'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/play')
  }, [router])

  return (
    <PageTransition>
      <LoadingScreen message="Chargement..." />
    </PageTransition>
  )
}
