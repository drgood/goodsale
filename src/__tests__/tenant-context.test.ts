jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
  },
  tenants: {},
}))

jest.mock('@/lib/logging', () => ({
  logAuthIssue: jest.fn(),
}))

import { getServerSession } from 'next-auth'
import { db } from '@/db'
import { getRequiredTenant } from '@/lib/tenant-context'

describe('getRequiredTenant', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('throws AUTH_REQUIRED when there is no session', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    await expect(getRequiredTenant()).rejects.toThrow('AUTH_REQUIRED')
  })

  it('throws TENANT_ID_MISSING when tenantId is missing from session', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@test.com',
        role: 'owner',
        // no tenantId
      },
      expires: '2099-01-01T00:00:00.000Z',
    })

    await expect(getRequiredTenant()).rejects.toThrow('TENANT_ID_MISSING')
  })

  it('throws TENANT_NOT_FOUND when no tenant exists for tenantId', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@test.com',
        role: 'owner',
        tenantId: 'tenant-missing',
      },
      expires: '2099-01-01T00:00:00.000Z',
    })

    ;(db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([]),
        }),
      }),
    })

    await expect(getRequiredTenant()).rejects.toThrow('TENANT_NOT_FOUND')
  })

  it('throws TENANT_LOOKUP_FAILED when tenant lookup throws', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@test.com',
        role: 'owner',
        tenantId: 'tenant-1',
      },
      expires: '2099-01-01T00:00:00.000Z',
    })

    ;(db.select as jest.Mock).mockImplementation(() => {
      throw new Error('DB error')
    })

    await expect(getRequiredTenant()).rejects.toThrow('TENANT_LOOKUP_FAILED')
  })

  it('returns session and tenant when tenant exists', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'user-1',
        email: 'user@test.com',
        role: 'owner',
        tenantId: 'tenant-1',
      },
      expires: '2099-01-01T00:00:00.000Z',
    })

    const mockTenant = {
      id: 'tenant-1',
      name: 'Test Shop',
      subdomain: 'testshop',
      status: 'active',
      plan: 'starter',
    }

    ;(db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([mockTenant]),
        }),
      }),
    })

    const result = await getRequiredTenant()

    expect(result.session.user).toMatchObject({
      id: 'user-1',
      email: 'user@test.com',
      role: 'owner',
      tenantId: 'tenant-1',
    })
    expect(result.tenant).toMatchObject(mockTenant)
  })
})
