'use client'

import { Suspense } from 'react'
import CheckoutPageContent from './CheckoutPageContent'

export const dynamic = 'force-dynamic'

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-green-600"></div>
        <p className="mt-4 text-slate-600">Carregando...</p>
      </div>
    </div>}>
      <CheckoutPageContent />
    </Suspense>
  )
}
