'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShiftData {
  id: string;
  cashierName: string;
  startingCash: number;
  cashSales: number;
  cardSales: number;
  mobileSales: number;
  creditSales: number;
  totalSales: number;
  cashSettlements?: number;
  cardSettlements?: number;
  mobileSettlements?: number;
  cashReturns?: number;
  expectedCash: number;
  actualCash?: number | null;
  cashDifference?: number | null;
}

interface ShiftSummaryProps {
  shift: ShiftData;
  showActualCash?: boolean;
}

export function ShiftSummary({ shift, showActualCash = false }: ShiftSummaryProps) {
  // Ensure ALL numeric fields are coerced to numbers (DB stores as strings)
  const safeStartingCash = Number(shift.startingCash) || 0;
  const safeCashSales = Number(shift.cashSales) || 0;
  const safeCardSales = Number(shift.cardSales) || 0;
  const safeMobileSales = Number(shift.mobileSales) || 0;
  const safeCreditSales = Number(shift.creditSales) || 0;
  const safeTotalSales = Number(shift.totalSales) || 0;
  const safeCashSettlements = Number(shift.cashSettlements) || 0;
  const safeCardSettlements = Number(shift.cardSettlements) || 0;
  const safeMobileSettlements = Number(shift.mobileSettlements) || 0;
  const safeCashReturns = Number(shift.cashReturns) || 0;
  const safeExpectedCash = Number(shift.expectedCash) || 0;
  const safeActualCash = shift.actualCash !== null ? Number(shift.actualCash) : null;
  const safeCashDifference = shift.cashDifference !== null ? Number(shift.cashDifference) : null;
  
  const totalSettlements = safeCashSettlements + safeCardSettlements + safeMobileSettlements;
  const isBalanced = safeActualCash !== null ? Math.abs(safeCashDifference || 0) < 0.01 : null;
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Sales Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Cash Sales</p>
              <p className="text-lg font-semibold">GH₵{safeCashSales.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Card Sales</p>
              <p className="text-lg font-semibold">GH₵{safeCardSales.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Mobile Money Sales</p>
              <p className="text-lg font-semibold">GH₵{safeMobileSales.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Credit Sales</p>
              <p className="text-lg font-semibold">GH₵{safeCreditSales.toFixed(2)}</p>
            </div>
          </div>
          <div className="pt-2 border-t">
            <div className="flex justify-between">
              <span className="font-medium">Total Sales (All Methods)</span>
              <span className="text-lg font-bold">GH₵{safeTotalSales.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Breakdown: Cash {safeCashSales.toFixed(2)} + Card {safeCardSales.toFixed(2)} + Mobile {safeMobileSales.toFixed(2)} + Credit {safeCreditSales.toFixed(2)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Settlement Collections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Cash</p>
              <p className="text-lg font-semibold">GH₵{safeCashSettlements.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Card</p>
              <p className="text-lg font-semibold">GH₵{safeCardSettlements.toFixed(2)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Mobile Money</p>
              <p className="text-lg font-semibold">GH₵{safeMobileSettlements.toFixed(2)}</p>
            </div>
          </div>
          <div className="pt-2 border-t">
            <div className="flex justify-between">
              <span className="font-medium">Total Settlements</span>
              <span className="text-lg font-bold">GH₵{totalSettlements.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Payments collected against customer credit balances</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Cash Reconciliation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Starting Cash</span>
            <span className="font-medium">+GH₵{safeStartingCash.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Cash Sales Today</span>
            <span className="font-medium">+GH₵{safeCashSales.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Settlement Collections</span>
            <span className="font-medium">+GH₵{safeCashSettlements.toFixed(2)}</span>
          </div>
          {safeCashReturns > 0 && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Cash Returned to Customers</span>
              <span className="font-medium text-destructive">-GH₵{safeCashReturns.toFixed(2)}</span>
            </div>
          )}
          <div className="py-2 border-t border-b bg-muted/50">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Expected Cash in Drawer</span>
              <span className="text-xl font-bold">GH₵{safeExpectedCash.toFixed(2)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Formula: {safeStartingCash.toFixed(2)} + {safeCashSales.toFixed(2)} + {safeCashSettlements.toFixed(2)} - {safeCashReturns.toFixed(2)}
            </p>
          </div>
          {showActualCash && safeActualCash !== null && (
            <>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Actual Cash Counted</span>
                <span className="font-medium">GH₵{safeActualCash.toFixed(2)}</span>
              </div>
              <div className={cn(
                "p-3 rounded-lg flex items-start gap-2",
                isBalanced 
                  ? "bg-green-50 border border-green-200" 
                  : "bg-red-50 border border-red-200"
              )}>
                {isBalanced ? (
                  <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div>
                  <p className={cn(
                    "font-medium text-sm",
                    isBalanced ? "text-green-900" : "text-red-900"
                  )}>
                    {isBalanced ? "Perfectly Balanced!" : "Variance Detected"}
                  </p>
                  <p className={cn(
                    "text-xs",
                    isBalanced ? "text-green-700" : "text-red-700"
                  )}>
                    Difference: {safeCashDifference && safeCashDifference > 0 ? '+' : ''}GH₵{(safeCashDifference || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Shift Cashier</span>
              <Badge variant="outline">{shift.cashierName}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Sales (All Methods)</span>
              <span className="font-bold text-primary">GH₵{safeTotalSales.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Expected Cash</span>
              <span className="font-bold text-primary">GH₵{safeExpectedCash.toFixed(2)}</span>
            </div>
            {safeCashReturns > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Returns (Cash Impact)</span>
                <span className="font-bold text-destructive">GH₵{safeCashReturns.toFixed(2)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
