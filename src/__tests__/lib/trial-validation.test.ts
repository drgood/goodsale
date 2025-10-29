import { db, subscriptions } from '@/db'
import { isTrialValid, getTrialEndDate, getTrialDaysRemaining, getSubscriptionStatus } from '@/lib/trial-validation'
import { eq, and } from 'drizzle-orm'

// Mock the database module
jest.mock('@/db', () => ({
  db: {
    select: jest.fn(),
  },
  subscriptions: {},
}))

describe('Trial Validation Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('isTrialValid', () => {
    it('should return true when trial is active and end date is in the future', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 5)

      const mockSubscription = {
        id: 'sub-1',
        tenantId: 'tenant-1',
        status: 'trial',
        endDate: futureDate,
        planId: 'plan-1',
        billingPeriod: '1_month',
        startDate: new Date(),
        autoRenewal: false,
        amount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockSelect = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockSubscription]),
          }),
        }),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const result = await isTrialValid('tenant-1')
      expect(result).toBe(true)
    })

    it('should return false when trial end date has passed', async () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 5)

      const mockSubscription = {
        id: 'sub-1',
        tenantId: 'tenant-1',
        status: 'trial',
        endDate: pastDate,
      }

      const mockSelect = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockSubscription]),
          }),
        }),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const result = await isTrialValid('tenant-1')
      expect(result).toBe(false)
    })

    it('should return false when no subscription exists', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const result = await isTrialValid('tenant-1')
      expect(result).toBe(false)
    })

    it('should return false when database error occurs', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockRejectedValue(new Error('DB Error')),
          }),
        }),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const result = await isTrialValid('tenant-1')
      expect(result).toBe(false)
    })
  })

  describe('getTrialEndDate', () => {
    it('should return the end date when subscription exists', async () => {
      const expectedDate = new Date('2024-02-15')
      const mockSubscription = {
        id: 'sub-1',
        tenantId: 'tenant-1',
        status: 'trial',
        endDate: expectedDate,
      }

      const mockSelect = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockSubscription]),
          }),
        }),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const result = await getTrialEndDate('tenant-1')
      expect(result).toEqual(expectedDate)
    })

    it('should return null when no subscription exists', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const result = await getTrialEndDate('tenant-1')
      expect(result).toBeNull()
    })
  })

  describe('getTrialDaysRemaining', () => {
    it('should calculate days remaining correctly', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 5)

      const mockSubscription = {
        id: 'sub-1',
        tenantId: 'tenant-1',
        status: 'trial',
        endDate: futureDate,
      }

      const mockSelect = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockSubscription]),
          }),
        }),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const result = await getTrialDaysRemaining('tenant-1')
      expect(result).toBe(5)
    })

    it('should return 0 when trial has expired', async () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 2)

      const mockSubscription = {
        id: 'sub-1',
        tenantId: 'tenant-1',
        status: 'trial',
        endDate: pastDate,
      }

      const mockSelect = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockSubscription]),
          }),
        }),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const result = await getTrialDaysRemaining('tenant-1')
      expect(result).toBe(0)
    })

    it('should return null when no subscription exists', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const result = await getTrialDaysRemaining('tenant-1')
      expect(result).toBeNull()
    })
  })

  describe('getSubscriptionStatus', () => {
    it('should return trial status with days remaining', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)

      const mockSubscription = {
        id: 'sub-1',
        tenantId: 'tenant-1',
        status: 'trial',
        endDate: futureDate,
      }

      const mockSelect = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockSubscription]),
          }),
        }),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const result = await getSubscriptionStatus('tenant-1')
      expect(result.status).toBe('trial')
      expect(result.daysRemaining).toBe(7)
      expect(result.endDate).toEqual(futureDate)
    })

    it('should return expired status when trial has ended', async () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)

      const mockSubscription = {
        id: 'sub-1',
        tenantId: 'tenant-1',
        status: 'trial',
        endDate: pastDate,
      }

      const mockSelect = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockSubscription]),
          }),
        }),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const result = await getSubscriptionStatus('tenant-1')
      expect(result.status).toBe('expired')
    })

    it('should return active status for paid subscription', async () => {
      const futureDate = new Date()
      futureDate.setMonth(futureDate.getMonth() + 1)

      const mockSubscription = {
        id: 'sub-1',
        tenantId: 'tenant-1',
        status: 'active',
        endDate: futureDate,
      }

      const mockSelect = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockSubscription]),
          }),
        }),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const result = await getSubscriptionStatus('tenant-1')
      expect(result.status).toBe('active')
    })

    it('should return not_found when subscription does not exist', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      }

      ;(db.select as jest.Mock).mockReturnValue(mockSelect)

      const result = await getSubscriptionStatus('tenant-1')
      expect(result.status).toBe('not_found')
      expect(result.daysRemaining).toBeNull()
      expect(result.endDate).toBeNull()
    })
  })
})
