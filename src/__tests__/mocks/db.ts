// Mock database for testing

export const mockDb = {
  select: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}

export const mockSubscriptions = {
  id: 'sub-1',
  tenantId: 'tenant-1',
  planId: 'plan-1',
  billingPeriod: '1_month',
  status: 'trial',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-15'),
  autoRenewal: false,
  amount: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockTenant = {
  id: 'tenant-1',
  name: 'Test Shop',
  subdomain: 'testshop',
  plan: 'plan-1',
  status: 'active',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockUser = {
  id: 'user-1',
  tenantId: 'tenant-1',
  name: 'Test User',
  email: 'test@example.com',
  password: 'hashed-password',
  role: 'owner',
  status: 'active',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

export const mockAuditLog = {
  id: 'log-1',
  userId: 'user-1',
  userName: 'Test User',
  action: 'TEST_ACTION',
  entity: 'test_entity',
  entityId: 'entity-1',
  details: {},
  createdAt: new Date('2024-01-01'),
}

// Helper to create mock query builders
export function createMockQueryBuilder<T>(data: T[]) {
  return {
    where: jest.fn(function (this: unknown) {
      return this
    }),
    limit: jest.fn(function (this: unknown) {
      return this
    }),
    offset: jest.fn(function (this: unknown) {
      return this
    }),
    orderBy: jest.fn(function (this: unknown) {
      return this
    }),
    then: jest.fn((callback) => {
      return callback(data)
    }),
  }
}
