import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { and, asc, desc, eq, isNull } from 'drizzle-orm';

export const runtime = 'nodejs';

// POST /api/receivables/payments
// Body: { customerId: string, amount: number, method: 'Cash'|'Card'|'Mobile', saleId?: string, idempotencyKey?: string }
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { customerId, amount, method, saleId, idempotencyKey } = body as {
      customerId: string;
      amount: number;
      method: 'Cash' | 'Card' | 'Mobile';
      saleId?: string;
      idempotencyKey?: string;
    };

    if (!customerId || !amount || amount <= 0 || !method) {
      return NextResponse.json({ error: 'customerId, positive amount and method are required' }, { status: 400 });
    }

    if (!['Cash','Card','Mobile'].includes(method)) {
      return NextResponse.json({ error: 'Invalid method' }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      // Idempotency check
      if (idempotencyKey) {
        const existing = await tx.select().from(schema.debtorHistory).where(eq(schema.debtorHistory.idempotencyKey, idempotencyKey)).limit(1);
        if (existing[0]) {
          return { reused: true, allocations: [], totalApplied: 0, customerBalance: null };
        }
      }

      // Load customer (and current balance)
      const customerRows = await tx.select().from(schema.customers).where(eq(schema.customers.id, customerId)).limit(1);
      if (!customerRows[0]) {
        throw new Error('Customer not found');
      }
      const customer = customerRows[0];
      const currentBalance = parseFloat(customer.balance || '0');

      let remaining = amount;
      const allocations: Array<{ saleId: string; allocated: number; newAmountSettled: number; newStatus: 'Paid'|'Pending' }> = [];

      async function applyToSale(targetSaleId: string) {
        if (remaining <= 0) return;
        const saleRows = await tx.select().from(schema.sales).where(eq(schema.sales.id, targetSaleId)).limit(1);
        const s = saleRows[0];
        if (!s) return;
        if (s.customerId !== customerId) return;
        const totalAmount = parseFloat(s.totalAmount);
        const amountSettled = parseFloat(s.amountSettled || '0');
        const saleRemaining = Math.max(0, totalAmount - amountSettled);
        if (saleRemaining <= 0) return;
        const alloc = Math.min(remaining, saleRemaining);
        const newAmountSettled = amountSettled + alloc;
        const newStatus: 'Paid'|'Pending' = newAmountSettled + 1e-9 >= totalAmount ? 'Paid' : 'Pending';

        await tx.update(schema.sales)
          .set({ amountSettled: newAmountSettled.toString(), status: newStatus })
          .where(eq(schema.sales.id, targetSaleId));

        // Ledger entry for this allocation
        const values = {
          customerId,
          saleId: targetSaleId,
          amount: alloc.toString(),
          type: 'payment',
          method,
          ...(idempotencyKey ? { idempotencyKey } : {}),
        } as const;
        await tx.insert(schema.debtorHistory).values(values);

        allocations.push({ saleId: targetSaleId, allocated: alloc, newAmountSettled, newStatus });
        remaining -= alloc;
      }

      // If targeting a specific sale first
      if (saleId) {
        await applyToSale(saleId);
      }

      // Allocate FIFO to other pending credit sales
      if (remaining > 0) {
        const pendingSales = await tx.select().from(schema.sales)
          .where(and(
            eq(schema.sales.customerId, customerId),
            eq(schema.sales.paymentMethod, 'On Credit'),
            eq(schema.sales.status, 'Pending')
          ))
          .orderBy(asc(schema.sales.createdAt));

        for (const s of pendingSales) {
          if (remaining <= 0) break;
          // skip if already allocated above
          if (saleId && s.id === saleId) continue;
          await applyToSale(s.id);
        }
      }

      const totalApplied = allocations.reduce((acc, a) => acc + a.allocated, 0);

      if (totalApplied <= 0) {
        return { reused: false, allocations, totalApplied, customerBalance: currentBalance };
      }

      // Update customer denormalized balance
      const newBalance = currentBalance - totalApplied;
      await tx.update(schema.customers)
        .set({ balance: newBalance.toString() })
        .where(eq(schema.customers.id, customerId));

      // Update collector shift settlements for current user (if active)
      const cashierId = session.user.id;
      const openShiftRows = await tx.select().from(schema.shifts)
        .where(and(eq(schema.shifts.cashierId, cashierId), eq(schema.shifts.status, 'open')))
        .orderBy(desc(schema.shifts.startTime))
        .limit(1);

      const collectorShift = openShiftRows[0];
      if (collectorShift) {
        const currentCashSettlements = parseFloat(collectorShift.cashSettlements || '0');
        const currentCardSettlements = parseFloat(collectorShift.cardSettlements || '0');
        const currentMobileSettlements = parseFloat(collectorShift.mobileSettlements || '0');
        const currentExpectedCash = parseFloat(collectorShift.expectedCash || '0');

        if (method === 'Cash') {
          await tx.update(schema.shifts)
            .set({
              cashSettlements: (currentCashSettlements + totalApplied).toString(),
              expectedCash: (currentExpectedCash + totalApplied).toString(),
            })
            .where(eq(schema.shifts.id, collectorShift.id));
        } else if (method === 'Card') {
          await tx.update(schema.shifts)
            .set({
              cardSettlements: (currentCardSettlements + totalApplied).toString(),
            })
            .where(eq(schema.shifts.id, collectorShift.id));
        } else if (method === 'Mobile') {
          await tx.update(schema.shifts)
            .set({
              mobileSettlements: (currentMobileSettlements + totalApplied).toString(),
            })
            .where(eq(schema.shifts.id, collectorShift.id));
        }
      }

      return { reused: false, allocations, totalApplied, customerBalance: newBalance };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error recording receivable payment:', error);
    return NextResponse.json(
      { error: 'Failed to record payment', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
