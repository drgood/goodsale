import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db, tenants } from '@/db'
import { eq } from 'drizzle-orm'
import { logAuthIssue } from '@/lib/logging'

export type RequiredTenantResult = {
  session: Awaited<ReturnType<typeof getServerSession>> & { user: any }
  tenant: any
}

export async function getRequiredTenant(): Promise<RequiredTenantResult> {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    logAuthIssue('getRequiredTenant called without a valid session')
    throw new Error('AUTH_REQUIRED')
  }

  const user = session.user as any
  const tenantId = user.tenantId as string | undefined

  if (!tenantId) {
    logAuthIssue('getRequiredTenant: tenantId missing from session', {
      userId: user.id,
      role: user.role,
    })
    throw new Error('TENANT_ID_MISSING')
  }

  let tenant: any

  try {
    const [foundTenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1)

    tenant = foundTenant
  } catch (error) {
    logAuthIssue('getRequiredTenant: error while loading tenant', {
      error,
      tenantId,
    })
    throw new Error('TENANT_LOOKUP_FAILED')
  }

  if (!tenant) {
    logAuthIssue('getRequiredTenant: tenant not found for tenantId', {
      userId: user.id,
      tenantId,
    })
    throw new Error('TENANT_NOT_FOUND')
  }

  return {
    session: session as any,
    tenant,
  }
}
