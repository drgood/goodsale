'use client'

import { useEffect, useState } from 'react'

interface DebugResponse {
  session: any
  tenant: any
  meta: {
    now: string
    requestPath: string
    tenantError: string | null
  }
}

export default function AdminSessionDebugPage() {
  const [data, setData] = useState<DebugResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch('/api/admin/session-debug')

        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          if (!cancelled) {
            setError(body.error || `Request failed with status ${res.status}`)
          }
          return
        }

        const json = (await res.json()) as DebugResponse
        if (!cancelled) {
          setData(json)
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load session debug data')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="min-h-screen p-6 bg-background text-foreground">
      <h1 className="text-2xl font-bold mb-4">Admin Session Debug</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        This page shows the current session and resolved tenant as seen by the server. Accessible to super admins only.
      </p>

      {loading && <p>Loading...</p>}

      {error && (
        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Error: {error}
        </div>
      )}

      {data && (
        <pre className="mt-4 whitespace-pre-wrap rounded-md bg-muted p-4 text-xs overflow-x-auto">
{JSON.stringify(data, null, 2)}
        </pre>
      )}
    </main>
  )
}
