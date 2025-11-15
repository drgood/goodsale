import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock GoodSaleLogo to avoid importing lucide-react ESM bundle in Jest
jest.mock('@/components/goodsale-logo', () => ({
  GoodSaleLogo: (props: any) => <div {...props}>GoodSale</div>,
}))

// Mocks for Next.js navigation
const pushMock = jest.fn()
const refreshMock = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}))

// Mock toast hook
const toastMock = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: toastMock }),
}))

// Mock next-auth signIn
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}))

import { signIn } from 'next-auth/react'
import LoginPage from '@/app/(auth)/login/page'

function mockFetchOnce(impl: (input: RequestInfo | URL, init?: RequestInit) => Promise<any>) {
  ;(global as any).fetch = jest.fn(impl)
}

describe('Global /login page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global as any).fetch = jest.fn()
  })

  it('shows an error toast and does not redirect when credentials are invalid', async () => {
    ;(signIn as jest.Mock).mockResolvedValue({ error: 'Invalid credentials' })

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'user@test.com' },
    })
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'wrong' },
    })

    fireEvent.submit(screen.getByRole('button', { name: /log in/i }).closest('form') as HTMLFormElement)

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          title: 'Login Failed',
        })
      )
    })

    expect(pushMock).not.toHaveBeenCalled()
  })

  it('shows an error when session has no tenantId', async () => {
    ;(signIn as jest.Mock).mockResolvedValue({ error: undefined })

    mockFetchOnce(async (input: RequestInfo | URL) => {
      if (input === '/api/auth/session') {
        return {
          ok: true,
          json: async () => ({}),
        }
      }
      throw new Error('Unexpected fetch: ' + input)
    })

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'user@test.com' },
    })
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password' },
    })

    fireEvent.submit(screen.getByRole('button', { name: /log in/i }).closest('form') as HTMLFormElement)

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          description: 'Unable to determine tenant.',
        })
      )
    })

    expect(pushMock).not.toHaveBeenCalled()
  })

  it('shows an error when tenant fetch fails', async () => {
    ;(signIn as jest.Mock).mockResolvedValue({ error: undefined })

    mockFetchOnce(async (input: RequestInfo | URL) => {
      if (input === '/api/auth/session') {
        return {
          ok: true,
          json: async () => ({ user: { tenantId: 'tenant-1' } }),
        }
      }
      if (input === '/api/tenants/tenant-1') {
        return {
          ok: false,
          json: async () => ({}),
        }
      }
      throw new Error('Unexpected fetch: ' + input)
    })

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'user@test.com' },
    })
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password' },
    })

    fireEvent.submit(screen.getByRole('button', { name: /log in/i }).closest('form') as HTMLFormElement)

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          description: 'Unable to fetch tenant details.',
        })
      )
    })

    expect(pushMock).not.toHaveBeenCalled()
  })

  it('redirects to the tenant dashboard using a path-based URL when login succeeds', async () => {
    ;(signIn as jest.Mock).mockResolvedValue({ error: undefined })

    mockFetchOnce(async (input: RequestInfo | URL) => {
      if (input === '/api/auth/session') {
        return {
          ok: true,
          json: async () => ({ user: { tenantId: 'tenant-1' } }),
        }
      }
      if (input === '/api/tenants/tenant-1') {
        return {
          ok: true,
          json: async () => ({ subdomain: 'gshop' }),
        }
      }
      throw new Error('Unexpected fetch: ' + input)
    })

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'user@test.com' },
    })
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password' },
    })

    fireEvent.submit(screen.getByRole('button', { name: /log in/i }).closest('form') as HTMLFormElement)

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/gshop/dashboard')
      expect(refreshMock).toHaveBeenCalled()
    })
  })

  it('shows an error when tenant configuration is missing a subdomain', async () => {
    ;(signIn as jest.Mock).mockResolvedValue({ error: undefined })

    mockFetchOnce(async (input: RequestInfo | URL) => {
      if (input === '/api/auth/session') {
        return {
          ok: true,
          json: async () => ({ user: { tenantId: 'tenant-1' } }),
        }
      }
      if (input === '/api/tenants/tenant-1') {
        return {
          ok: true,
          json: async () => ({ /* subdomain missing */ }),
        }
      }
      throw new Error('Unexpected fetch: ' + input)
    })

    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: 'user@test.com' },
    })
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password' },
    })

    fireEvent.submit(screen.getByRole('button', { name: /log in/i }).closest('form') as HTMLFormElement)

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: 'destructive',
          description: 'Tenant configuration is missing a subdomain.',
        })
      )
    })

    expect(pushMock).not.toHaveBeenCalled()
  })
})
