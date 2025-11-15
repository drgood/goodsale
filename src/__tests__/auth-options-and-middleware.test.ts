import { readFileSync } from 'fs'
import { resolve } from 'path'

// Mock the database module so importing authOptions does not initialize a real pg/Drizzle client.
jest.mock('@/db', () => ({
  db: {},
  users: {},
  superAdmins: {},
  tenants: {},
}))

describe('Auth Options and Middleware Configuration', () => {
  const { authOptions } = require('@/lib/auth') as typeof import('@/lib/auth')
  describe('authOptions cookies and pages', () => {
    it('does not configure session tokens for subdomain support in auth options', () => {
      // Removing custom cookies.sessionToken configuration ensures no explicit subdomain sharing.
      expect(authOptions.cookies?.sessionToken).toBeUndefined()
    })

    it('does not configure CSRF tokens for subdomain support in auth options', () => {
      // Removing custom cookies.csrfToken configuration ensures no explicit subdomain sharing.
      expect(authOptions.cookies?.csrfToken).toBeUndefined()
    })

    it("keeps the general sign-in page for auth options at '/login'", () => {
      expect(authOptions.pages?.signIn).toBe('/login')
    })
  })

  describe('middleware configuration', () => {
    let middlewareSource: string

    beforeAll(() => {
      const middlewarePath = resolve(process.cwd(), 'src/middleware.ts')
      middlewareSource = readFileSync(middlewarePath, 'utf-8')
    })

    it('no longer attempts to extract subdomains from the host in middleware', () => {
      // Ensure middleware no longer uses subdomain helpers or host-based subdomain parsing.
      expect(middlewareSource).not.toMatch(/extractSubdomain/)
      expect(middlewareSource).not.toMatch(/getCurrentSubdomain/)
      expect(middlewareSource).not.toMatch(/isSubdomainRequest/)
      expect(middlewareSource).not.toMatch(/buildSubdomainUrl/)
      expect(middlewareSource).not.toMatch(/buildTenantUrl/)
      expect(middlewareSource).not.toMatch(/getTenantPath/)
      expect(middlewareSource).not.toMatch(/subdomain/i)
    })

    it("configures unauthorized access to protected admin routes to redirect to '/admin/login'", () => {
      // Admin routes are matched as protected.
      expect(middlewareSource).toMatch(/matcher:[\s\S]*'\/admin\/:path\*'/)
      expect(middlewareSource).toMatch(/matcher:[\s\S]*'\/api\/admin\/:path\*'/)

      // withAuth pages.signIn is configured to '/admin/login',
      // which NextAuth uses as the redirect target for unauthorized access.
      expect(middlewareSource).toMatch(/pages:\s*{[\s\S]*signIn:\s*'\/admin\/login'/)
    })
  })
})
