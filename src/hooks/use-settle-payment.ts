'use client';

import { useState } from 'react';
import type { Customer, Sale } from '@/lib/types';

interface SettlementAllocation {
  saleId: string;
  allocated: number;
  newAmountSettled: number;
  newStatus: 'Paid' | 'Pending';
}

interface SettlementResponse {
  reused: boolean;
  allocations: SettlementAllocation[];
  totalApplied: number;
  customerBalance: number | null;
}

interface UseSettlePaymentOptions {
  onCustomerUpdate?: (customer: Customer) => void;
  onSalesUpdate?: (sales: Sale[]) => void;
  onError?: (error: Error) => void;
  onSuccess?: (response: SettlementResponse) => void;
}

/**
 * Unified hook for settling customer payments across all pages (Debtors, Sales, POS).
 * Handles full allocation sync, updates customer balance and all affected sales.
 * 
 * @param options - Callbacks for handling updates to customers and sales
 * @returns Object with settlePayment function and loading state
 */
export function useSettlePayment(options?: UseSettlePaymentOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const settlePayment = async (params: {
    customerId: string;
    amount: number;
    method: 'Cash' | 'Card' | 'Mobile';
    saleId?: string;
    idempotencyKey?: string;
  }): Promise<SettlementResponse | null> => {
    const { customerId, amount, method, saleId, idempotencyKey } = params;

    // Validation
    if (!customerId || !amount || amount <= 0 || !method) {
      const err = new Error('customerId, positive amount, and method are required');
      setError(err);
      options?.onError?.(err);
      return null;
    }

    if (!['Cash', 'Card', 'Mobile'].includes(method)) {
      const err = new Error('Invalid payment method');
      setError(err);
      options?.onError?.(err);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/receivables/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          amount,
          method,
          ...(saleId ? { saleId } : {}),
          ...(idempotencyKey ? { idempotencyKey } : {}),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to record payment: ${response.status}`);
      }

      const data = (await response.json()) as SettlementResponse;

      // Update customer balance if provided
      if (data.customerBalance !== null && options?.onCustomerUpdate) {
        const updatedCustomer: Partial<Customer> = {
          balance: data.customerBalance,
        };
        options.onCustomerUpdate(updatedCustomer as Customer);
      }

      // Update all affected sales from allocations
      if (data.allocations.length > 0 && options?.onSalesUpdate) {
        options.onSalesUpdate(
          data.allocations.map((alloc) => ({
            id: alloc.saleId,
            amountSettled: alloc.newAmountSettled,
            status: alloc.newStatus,
          })) as Sale[]
        );
      }

      // Call success callback
      options?.onSuccess?.(data);

      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      options?.onError?.(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    settlePayment,
    isLoading,
    error,
  };
}
