import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { db, tenants } from '@/db'
import { eq } from 'drizzle-orm'
import { logAuthIssue } from '@/lib/logging'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    logAuthIssue('Session debug requested without valid session')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!(session.user as any).isSuperAdmin) {
    logAuthIssue('Session debug requested by non-superadmin user', {
      userId: (session.user as any).id,
      role: (session.user as any).role,
    })
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)

  let tenant: any = null
  let tenantError: string | null = null

  try {
    const tenantId = (session.user as any).tenantId as string | undefined

    if (!tenantId) {
      tenantError = 'Session has no tenantId'
      logAuthIssue(tenantError, { userId: (session.user as any).id })
    } else {
      const [foundTenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1)

      if (!foundTenant) {
        tenantError = 'No tenant found for tenantId from session'
        logAuthIssue(tenantError, { userId: (session.user as any).id, tenantId })
      } else {
        tenant = {
          id: (foundTenant as any).id,
          name: (foundTenant as any).name,
          subdomain: (foundTenant as any).subdomain,
          status: (foundTenant as any).status,
          plan: (foundTenant as any).plan,
        }
      }
    }
  } catch (error) {
    tenantError = 'Error while loading tenant for session debug'
    logAuthIssue(tenantError, {
      error,
      userId: (session.user as any).id,
    })
  }

  const safeSession = {
    user: {
      id: (session.user as any).id,
      email: session.user.email,
      role: (session.user as any).role,
      tenantId: (session.user as any).tenantId,
      isSuperAdmin: (session.user as any).isSuperAdmin,
    },
    expires: session.expires,
  }

  return NextResponse.json({
    session: safeSession,
    tenant,
    meta: {
      now: new Date().toISOString(),
      requestPath: url.pathname,
      tenantError,
    },
  })
}
