import { db, subscriptions, tenants, users, auditLogs } from '@/db'
import { sendTrialNotifications } from '@/lib/trial-notifications'

jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
  },
  subscriptions: {},
  tenants: {},
  users: {},
  auditLogs: {},
}))

describe('Trial Notifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('sendTrialNotifications', () => {
    it('should send notifications for subscriptions expiring in 7, 3, and 1 days', async () => {
      const now = new Date()
      
      // Create dates for subscriptions expiring in 7, 3, and 1 days
      const expiring7Days = new Date(now)
      expiring7Days.setDate(expiring7Days.getDate() + 7)
      
      const expiring3Days = new Date(now)
      expiring3Days.setDate(expiring3Days.getDate() + 3)
      
      const expiring1Day = new Date(now)
      expiring1Day.setDate(expiring1Day.getDate() + 1)

      const mockSubscriptions7Days = [
        {
          id: 'sub-7',
          tenantId: 'tenant-7',
          planId: 'plan-1',
          status: 'trial',
          endDate: expiring7Days,
          billingPeriod: '1_month',
          startDate: new Date(),
          autoRenewal: false,
          amount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const mockSubscriptions3Days = [
        {
          id: 'sub-3',
          tenantId: 'tenant-3',
          planId: 'plan-1',
          status: 'trial',
          endDate: expiring3Days,
          billingPeriod: '1_month',
          startDate: new Date(),
          autoRenewal: false,
          amount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const mockSubscriptions1Day = [
        {
          id: 'sub-1',
          tenantId: 'tenant-1',
          planId: 'plan-1',
          status: 'trial',
          endDate: expiring1Day,
          billingPeriod: '1_month',
          startDate: new Date(),
          autoRenewal: false,
          amount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      const mockTenant = {
        id: 'tenant-1',
        name: 'Test Shop',
        subdomain: 'testshop',
        plan: 'plan-1',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockUser = {
        id: 'user-1',
        tenantId: 'tenant-1',
        name: 'Test Owner',
        email: 'owner@test.com',
        password: 'hashed',
        role: 'owner',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      // Mock all database calls
      ;(db.select as jest.Mock).mockReturnValue({
        from: jest.fn((table) => {
          if (table === subscriptions) {
            // First call gets subscriptions
            return {
              where: jest.fn()
                .mockReturnValueOnce({
                  // First call: 7 days
                  then: jest.fn((callback) => callback(mockSubscriptions7Days)),
                })
                .mockReturnValueOnce({
                  // Second call: 3 days
                  then: jest.fn((callback) => callback(mockSubscriptions3Days)),
                })
                .mockReturnValueOnce({
                  // Third call: 1 day
                  then: jest.fn((callback) => callback(mockSubscriptions1Day)),
                }),
            }
          } else if (table === tenants) {
            return {
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockTenant]),
              }),
            }
          } else if (table === users) {
            return {
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockUser]),
              }),
            }
          }
        }),
      })

      ;(db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          catch: jest.fn().mockResolvedValue({}),
        }),
      })

      const result = await sendTrialNotifications()

      expect(result.success).toBe(true)
      expect(result.notificationsSent).toBe(3)
      expect(result.errors.length).toBe(0)
    })

    it('should handle missing tenant gracefully', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      const mockSubscription = {
        id: 'sub-1',
        tenantId: 'tenant-missing',
        status: 'trial',
        endDate: futureDate,
      }

      ;(db.select as jest.Mock).mockReturnValue({
        from: jest.fn((table) => {
          if (table === subscriptions) {
            return {
              where: jest.fn().mockReturnValue({
                then: jest.fn((callback) => callback([mockSubscription])),
              }),
            }
          } else if (table === tenants) {
            return {
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]), // No tenant found
              }),
            }
          }
        }),
      })

      const result = await sendTrialNotifications()

      expect(result.success).toBe(true)
      expect(result.notificationsSent).toBe(0)
    })

    it('should handle missing owner gracefully', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      const mockSubscription = {
        id: 'sub-1',
        tenantId: 'tenant-1',
        status: 'trial',
        endDate: futureDate,
      }

      const mockTenant = {
        id: 'tenant-1',
        name: 'Test Shop',
        subdomain: 'testshop',
      }

      ;(db.select as jest.Mock).mockReturnValue({
        from: jest.fn((table) => {
          if (table === subscriptions) {
            return {
              where: jest.fn().mockReturnValue({
                then: jest.fn((callback) => callback([mockSubscription])),
              }),
            }
          } else if (table === tenants) {
            return {
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([mockTenant]),
              }),
            }
          } else if (table === users) {
            return {
              where: jest.fn().mockReturnValue({
                limit: jest.fn().mockResolvedValue([]), // No owner found
              }),
            }
          }
        }),
      })

      const result = await sendTrialNotifications()

      expect(result.success).toBe(true)
      expect(result.notificationsSent).toBe(0)
    })

    it('should return error object when database query fails', async () => {
      ;(db.select as jest.Mock).mockReturnValue({
        from: jest.fn((table) => {
          if (table === subscriptions) {
            return {
              where: jest.fn().mockReturnValue({
                then: jest.fn(() => {
                  throw new Error('Database connection error')
                }),
              }),
            }
          }
        }),
      })

      const result = await sendTrialNotifications()

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })
})
