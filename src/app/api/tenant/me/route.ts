import { NextResponse } from 'next/server'

import { getRequiredTenant } from '@/lib/tenant-context'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const { session, tenant } = await getRequiredTenant()
    const url = new URL(request.url)

    return NextResponse.json({
      session: {
        user: {
          id: (session.user as any).id,
          email: session.user?.email,
          role: (session.user as any).role,
          tenantId: (session.user as any).tenantId,
          isSuperAdmin: (session.user as any).isSuperAdmin,
        },
        expires: session.expires,
      },
      tenant,
      meta: {
        now: new Date().toISOString(),
        requestPath: url.pathname,
      },
    })
  } catch (error: any) {
    const code = typeof error?.message === 'string' ? error.message : 'UNKNOWN_ERROR'

    switch (code) {
      case 'AUTH_REQUIRED':
        return NextResponse.json({ error: 'Unauthorized', code }, { status: 401 })
      case 'TENANT_ID_MISSING':
      case 'TENANT_NOT_FOUND':
      case 'TENANT_LOOKUP_FAILED':
        return NextResponse.json({ error: 'Tenant resolution failed', code }, { status: 400 })
      default:
        return NextResponse.json({ error: 'Unexpected error', code }, { status: 500 })
    }
  }
}
