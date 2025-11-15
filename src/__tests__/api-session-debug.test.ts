jest.mock('next/server', () => {
  class MockResponse {
    body: any
    status: number
    constructor(body: any, init?: { status?: number }) {
      this.body = body
      this.status = init?.status ?? 200
    }
    async json() {
      return this.body
    }
  }

  return {
    NextResponse: {
      json: (body: any, init?: { status?: number }) => new MockResponse(body, init),
    },
  }
})

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

import { GET } from '@/app/api/admin/session-debug/route'

function createRequest(url: string) {
  // The route only uses request.url, so a minimal object is sufficient for tests.
  return { url } as any
}

describe('/api/admin/session-debug', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when there is no session', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue(null)

    const res = await GET(createRequest('http://localhost/api/admin/session-debug'))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body).toEqual({ error: 'Unauthorized' })
  })

  it('returns 403 when user is not a super admin', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'user-1', email: 'user@test.com', role: 'owner', isSuperAdmin: false },
      expires: new Date().toISOString(),
    })

    const res = await GET(createRequest('http://localhost/api/admin/session-debug'))

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body).toEqual({ error: 'Forbidden' })
  })

  it('returns session and null tenant when tenantId is missing', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'super_admin',
        isSuperAdmin: true,
        // tenantId intentionally omitted
      },
      expires: '2099-01-01T00:00:00.000Z',
    })

    const res = await GET(createRequest('http://localhost/api/admin/session-debug'))

    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.session.user).toMatchObject({
      id: 'admin-1',
      email: 'admin@test.com',
      role: 'super_admin',
      isSuperAdmin: true,
      tenantId: undefined,
    })
    expect(body.tenant).toBeNull()
    expect(body.meta.tenantError).toBe('Session has no tenantId')
  })

  it('returns session and null tenant when tenant is not found', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'super_admin',
        isSuperAdmin: true,
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

    const res = await GET(createRequest('http://localhost/api/admin/session-debug'))

    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.tenant).toBeNull()
    expect(body.meta.tenantError).toBe('No tenant found for tenantId from session')
  })

  it('returns session and tenant when tenant is found', async () => {
    ;(getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: 'admin-1',
        email: 'admin@test.com',
        role: 'super_admin',
        isSuperAdmin: true,
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

    const res = await GET(createRequest('http://localhost/api/admin/session-debug'))

    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.session.user).toMatchObject({
      id: 'admin-1',
      email: 'admin@test.com',
      role: 'super_admin',
      isSuperAdmin: true,
      tenantId: 'tenant-1',
    })

    expect(body.tenant).toMatchObject({
      id: 'tenant-1',
      name: 'Test Shop',
      subdomain: 'testshop',
      status: 'active',
      plan: 'starter',
    })

    expect(body.meta.tenantError).toBeNull()
  })
})
