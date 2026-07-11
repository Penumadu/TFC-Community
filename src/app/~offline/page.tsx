'use client'

import Link from 'next/link'
import { WifiOff, ArrowLeft, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function OfflinePage() {
  return (
    <main className="min-h-dvh bg-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center animate-fade-in">

        {/* Icon */}
        <div className="w-24 h-24 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-10 h-10 text-secondary" aria-hidden="true" />
        </div>

        {/* TFC Logo mark */}
        <div className="w-12 h-12 rounded-xl bg-gradient-teal flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-heading font-bold text-xl">T</span>
        </div>

        <h1 className="font-heading text-3xl font-bold text-text mb-3">
          You&apos;re Offline
        </h1>
        <p className="text-text-muted text-lg leading-relaxed mb-8">
          It looks like you&apos;ve lost your internet connection. Don&apos;t
          worry — your recently viewed directories and profiles are still
          available below.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <Button
            variant="primary"
            leftIcon={<RefreshCw className="w-4 h-4" />}
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
          <Link href="/">
            <Button
              variant="outline"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              fullWidth
            >
              Go Home
            </Button>
          </Link>
        </div>

        {/* Cached content notice */}
        <div className="bg-surface rounded-card border border-gray-100 p-5 text-left shadow-card">
          <h2 className="font-semibold text-text mb-2 text-sm">
            📦 Cached Content Available
          </h2>
          <ul className="text-sm text-text-muted space-y-1.5">
            <li>✓ Recently viewed tradesperson profiles</li>
            <li>✓ Venue listings you&apos;ve browsed</li>
            <li>✓ Your saved preferences</li>
          </ul>
          <p className="text-xs text-text-muted mt-3 border-t border-gray-100 pt-3">
            Any actions you take (reviews, requests) will be queued and
            automatically synced when you reconnect.
          </p>
        </div>
      </div>
    </main>
  )
}
