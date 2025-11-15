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

jest.mock('@/lib/tenant-context', () => ({
  getRequiredTenant: jest.fn(),
}))

import { GET } from '@/app/api/tenant/me/route'
import { getRequiredTenant } from '@/lib/tenant-context'

function createRequest(url: string) {
  return { url } as any
}

describe('/api/tenant/me', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 200 with session and tenant when getRequiredTenant succeeds', async () => {
    ;(getRequiredTenant as jest.Mock).mockResolvedValue({
      session: {
        user: {
          id: 'user-1',
          email: 'user@test.com',
          role: 'owner',
          tenantId: 'tenant-1',
          isSuperAdmin: false,
        },
        expires: '2099-01-01T00:00:00.000Z',
      },
      tenant: {
        id: 'tenant-1',
        name: 'Test Shop',
        subdomain: 'testshop',
        status: 'active',
      },
    })

    const res = await GET(createRequest('http://localhost/api/tenant/me'))

    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.session.user).toMatchObject({
      id: 'user-1',
      tenantId: 'tenant-1',
    })
    expect(body.tenant).toMatchObject({ id: 'tenant-1', name: 'Test Shop' })
  })

  it('returns 401 when getRequiredTenant throws AUTH_REQUIRED', async () => {
    ;(getRequiredTenant as jest.Mock).mockRejectedValue(new Error('AUTH_REQUIRED'))

    const res = await GET(createRequest('http://localhost/api/tenant/me'))

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.code).toBe('AUTH_REQUIRED')
  })

  it('returns 400 when getRequiredTenant throws a tenant-related error', async () => {
    ;(getRequiredTenant as jest.Mock).mockRejectedValue(new Error('TENANT_NOT_FOUND'))

    const res = await GET(createRequest('http://localhost/api/tenant/me'))

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.code).toBe('TENANT_NOT_FOUND')
  })

  it('returns 500 when getRequiredTenant throws an unknown error', async () => {
    ;(getRequiredTenant as jest.Mock).mockRejectedValue(new Error('SOMETHING_ELSE'))

    const res = await GET(createRequest('http://localhost/api/tenant/me'))

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.code).toBe('SOMETHING_ELSE')
  })
})
