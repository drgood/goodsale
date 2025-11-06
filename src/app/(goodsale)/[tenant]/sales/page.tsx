
'use client';
import { useState, useEffect, useMemo } from "react";
import { useShiftContext } from "@/components/shift-manager";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { 
    DropdownMenu, 
    DropdownMenuCheckboxItem, 
    DropdownMenuContent, 
    DropdownMenuLabel, 
    DropdownMenuSeparator, 
    DropdownMenuTrigger,
    DropdownMenuItem 
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { File, ListFilter, MoreHorizontal, Receipt, CircleDollarSign, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Sale, Customer } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast";
import { useSettlePayment } from "@/hooks/use-settle-payment";
import { Separator } from "@/components/ui/separator";
import { ReceiptComponent } from "@/components/receipt";
import { useParams } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type PaymentMethodFilter = 'Cash' | 'Card' | 'Mobile' | 'On Credit';

export default function SalesPage() {
  const { toast } = useToast();
  const params = useParams();
  const tenantSubdomain = params.tenant as string;
  const shiftContext = useShiftContext();

  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { settlePayment, isLoading: isSettling } = useSettlePayment({
    onCustomerUpdate: (customer) => {
      setCustomers(customers.map(c => c.id === customer.id ? customer : c));
    },
    onSalesUpdate: (updatedSales) => {
      setSales(sales.map(s => {
        const update = updatedSales.find(u => u.id === s.id);
        return update ? { ...s, amountSettled: update.amountSettled, status: update.status } : s;
      }));
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
    onSuccess: () => {
      if (shiftContext?.refreshActiveShift) {
        shiftContext.refreshActiveShift();
      }
    },
  });
  
  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [salesRes, customersRes] = await Promise.all([
          fetch('/api/sales'),
          fetch('/api/customers')
        ]);

        if (salesRes.ok) {
          const salesData = await salesRes.json();
          setSales(salesData);
        }
        if (customersRes.ok) {
          const customersData = await customersRes.json();
          setCustomers(customersData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load data' });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  const [filters, setFilters] = useState<PaymentMethodFilter[]>(['Cash', 'Card', 'Mobile', 'On Credit']);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [returnReason, setReturnReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('cash');
  const [isCreatingReturn, setIsCreatingReturn] = useState(false);

  const handleFilterChange = (method: PaymentMethodFilter) => {
    setFilters(prev => 
      prev.includes(method) 
        ? prev.filter(m => m !== method)
        : [...prev, method]
    );
  };

  const currentSales = sales.filter(sale => 
    filters.some(filter => filter.toLowerCase() === sale.paymentMethod.toLowerCase())
  );

  const handleExport = () => {
    const headers = ["id", "cashierName", "createdAt", "itemCount", "paymentMethod", "totalAmount", "discountAmount", "totalProfit"];
    const csvContent = "data:text/csv;charset=utf-t,"
        + headers.join(",") + "\n"
        + currentSales.map(s => [
            s.id,
            `"${s.cashierName}"`,
            s.createdAt,
            s.itemCount,
            s.paymentMethod,
            s.totalAmount,
            s.discountAmount || 0,
            s.totalProfit,
        ].join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `sales_export_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Export Successful", description: "Your sales data has been exported to CSV." });
  };

  const openSaleDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailsOpen(true);
  }

  const openReceipt = (sale: Sale) => {
    setSelectedSale(sale);
    setIsReceiptOpen(true);
  }
  
  const openSettleDialog = (sale: Sale) => {
    setSelectedSale(sale);
    setIsSettleOpen(true);
  }

  const openReturnModal = (sale: Sale) => {
    setSelectedSale(sale);
    setSelectedItems(new Set());
    setReturnReason('');
    setRefundMethod('cash');
    setIsReturnOpen(true);
  };

  const toggleItemSelection = (itemId: string) => {
    const updated = new Set(selectedItems);
    if (updated.has(itemId)) {
      updated.delete(itemId);
    } else {
      updated.add(itemId);
    }
    setSelectedItems(updated);
  };

  const calculateReturnAmount = () => {
    if (!selectedSale) return 0;
    return selectedSale.items
      .filter(item => selectedItems.has(item.productId))
      .reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const handleCreateReturn = async () => {
    if (!selectedSale || selectedItems.size === 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select at least one item to return' });
      return;
    }

    setIsCreatingReturn(true);
    try {
      const returnItems = selectedSale.items
        .filter(item => selectedItems.has(item.productId))
        .map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.price,
          condition: 'return'
        }));

      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId: selectedSale.id,
          customerId: selectedSale.customerId,
          reason: returnReason || null,
          items: returnItems,
          refundMethod
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create return');
      }

      // Refresh shift context to update return calculations
      if (shiftContext?.refreshActiveShift) {
        await shiftContext.refreshActiveShift();
      }
      
      toast({
        title: 'Return Created',
        description: `Return has been created and is pending approval.`
      });
      setIsReturnOpen(false);
      setSelectedItems(new Set());
      setReturnReason('');
    } catch (error) {
      console.error('Error creating return:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create return'
      });
    } finally {
      setIsCreatingReturn(false);
    }
  };

  const handleSettlePayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedSale || !selectedSale.customerId) return;

    const formData = new FormData(event.currentTarget);
    const amount = parseFloat(formData.get("amount") as string);
    const method = String(formData.get("method") || '');
    const customer = customers.find(c => c.id === selectedSale.customerId);

    if (!customer || isNaN(amount) || amount <= 0) {
      toast({ variant: 'destructive', title: 'Invalid amount' });
      return;
    }
    if (!['Cash','Card','Mobile'].includes(method)) {
      toast({ variant: 'destructive', title: 'Select a payment method' });
      return;
    }
    if (amount > customer.balance) {
      toast({ variant: 'destructive', title: 'Amount exceeds balance', description: `Customer balance is only GH₵${customer.balance.toFixed(2)}.` });
      return;
    }

    const result = await settlePayment({
      customerId: customer.id,
      amount,
      method: method as 'Cash' | 'Card' | 'Mobile',
      saleId: selectedSale.id
    });

    if (result) {
      toast({ title: 'Payment Recorded', description: `GH₵${amount.toFixed(2)} via ${method} recorded.`});
      setIsSettleOpen(false);
      setSelectedSale(null);
    }
  }

  const getSubtotal = (sale: Sale) => {
    return sale.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }

  const getTax = (sale: Sale) => {
    const subtotal = getSubtotal(sale);
    const discountAmount = sale.discountAmount || 0;
    return (subtotal - discountAmount) * 0.08;
  }

  if (isLoading) {
    return <div className="flex flex-col gap-4"><p>Loading...</p></div>;
  }

  const isFormDisabled = isLoading || isSettling;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Sales" description="Review your sales history.">
        <div className="flex items-center gap-2">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-7 gap-1">
                        <ListFilter className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Filter</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Filter by Payment</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked={filters.includes('Cash')} onSelect={(e) => e.preventDefault()} onCheckedChange={() => handleFilterChange('Cash')}>Cash</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={filters.includes('Card')} onSelect={(e) => e.preventDefault()} onCheckedChange={() => handleFilterChange('Card')}>Card</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={filters.includes('Mobile')} onSelect={(e) => e.preventDefault()} onCheckedChange={() => handleFilterChange('Mobile')}>Mobile</DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem checked={filters.includes('On Credit')} onSelect={(e) => e.preventDefault()} onCheckedChange={() => handleFilterChange('On Credit')}>On Credit</DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="outline" className="h-7 gap-1" onClick={handleExport}>
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
            </Button>
        </div>
      </PageHeader>
        <Card>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Sale ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden sm:table-cell">Payment</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>
                        <span className="sr-only">Actions</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                    {currentSales.map((sale) => (
                        <TableRow key={sale.id}>
                            <TableCell className="font-mono text-xs">{sale.id.substring(0, 12)}...</TableCell>
                            <TableCell className="font-medium">{sale.customerName || 'N/A'}</TableCell>
                            <TableCell>{new Date(sale.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell className="hidden sm:table-cell">
                                <Badge variant={sale.status.toLowerCase() === 'paid' ? 'default' : 'destructive'}>{sale.status}</Badge>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                                <Badge variant="outline">{sale.paymentMethod}</Badge>
                            </TableCell>
                            <TableCell className="text-right text-green-600">GH₵{sale.totalProfit.toFixed(2)}</TableCell>
                            <TableCell className="text-right">GH₵{sale.totalAmount.toFixed(2)}</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Toggle menu</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onSelect={() => openSaleDetails(sale)}>View Details</DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => openReceipt(sale)}>Print Receipt</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={() => openReturnModal(sale)}>
                                            <RotateCcw className="mr-2 h-4 w-4" />
                                            Create Return
                                        </DropdownMenuItem>
                                        {sale.paymentMethod === 'On Credit' && sale.status === 'Pending' && (
                                            <>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onSelect={() => openSettleDialog(sale)}>
                                                    <CircleDollarSign className="mr-2 h-4 w-4" />
                                                    Settle Payment
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            </CardContent>
            <CardFooter>
            <div className="text-xs text-muted-foreground">
                Showing <strong>{currentSales.length}</strong> of <strong>{sales.length}</strong> sales
            </div>
            </CardFooter>
        </Card>
        
        {/* Sale Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            {selectedSale && (
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Sale Details</DialogTitle>
                        <DialogDescription>
                            <span className="font-mono text-xs">{selectedSale.id}</span> - {new Date(selectedSale.createdAt).toLocaleString()}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            {selectedSale.items.map(item => (
                                <div key={item.productId} className="flex justify-between items-center text-sm">
                                    <div>
                                        <p className="font-medium">{item.productName}</p>
                                        <p className="text-muted-foreground">
                                            {item.quantity} x GH₵{item.price.toFixed(2)}
                                        </p>
                                    </div>
                                    <p>GH₵{(item.quantity * item.price).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                        <Separator />
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>GH₵{getSubtotal(selectedSale).toFixed(2)}</span>
                            </div>
                            {selectedSale.discountAmount && selectedSale.discountAmount > 0 ? (
                            <div className="flex justify-between">
                                    <span>Discount {selectedSale.discountPercentage ? `(${selectedSale.discountPercentage}%)` : ''}</span>
                                    <span className="text-destructive">- GH₵{selectedSale.discountAmount.toFixed(2)}</span>
                                </div>
                            ): null}
                            <div className="flex justify-between">
                                <span>Tax (8%)</span>
                                <span>GH₵{getTax(selectedSale).toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold text-base">
                                <span>Total</span>
                                <span>GH₵{selectedSale.totalAmount.toFixed(2)}</span>
                            </div>
                             <div className="flex justify-between font-bold text-base text-green-600">
                                <span>Gross Profit</span>
                                <span>GH₵{selectedSale.totalProfit.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-muted-foreground">
                                <span>Payment Method</span>
                                <span>{selectedSale.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Status</span>
                                <span>{selectedSale.status}</span>
                            </div>
                            {selectedSale.amountSettled && (
                                <div className="flex justify-between">
                                    <span>Amount Settled</span>
                                    <span>GH₵{selectedSale.amountSettled.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            )}
        </Dialog>
        
        {/* Receipt Dialog */}
        <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
            {selectedSale && (
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Print Receipt</DialogTitle>
                    </DialogHeader>
                    <ReceiptComponent sale={selectedSale} />
                </DialogContent>
            )}
        </Dialog>
        
        {/* Return Modal */}
        <Dialog open={isReturnOpen} onOpenChange={setIsReturnOpen}>
            {selectedSale && (
                <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create Return</DialogTitle>
                        <DialogDescription>
                            Sale: {selectedSale.id.substring(0, 12)}...
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Items Selection */}
                        <div className="space-y-3">
                            <Label className="font-semibold">Select Items to Return</Label>
                            <div className="border rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                                {selectedSale.items.map((item) => (
                                    <div key={item.productId} className="flex items-start gap-2">
                                        <Checkbox
                                            id={item.productId}
                                            checked={selectedItems.has(item.productId)}
                                            onCheckedChange={() => toggleItemSelection(item.productId)}
                                        />
                                        <label htmlFor={item.productId} className="flex-1 text-sm cursor-pointer">
                                            <p className="font-medium">{item.productName}</p>
                                            <p className="text-muted-foreground">
                                                {item.quantity} x GH₵{item.price.toFixed(2)} = GH₵{(item.quantity * item.price).toFixed(2)}
                                            </p>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Return Amount Summary */}
                        {selectedItems.size > 0 && (
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3">
                                <p className="text-sm text-muted-foreground">Return Amount</p>
                                <p className="text-lg font-semibold text-green-600">
                                    GH₵{calculateReturnAmount().toFixed(2)}
                                </p>
                            </div>
                        )}

                        {/* Reason */}
                        <div className="space-y-2">
                            <Label htmlFor="return-reason">Reason for Return</Label>
                            <Textarea
                                id="return-reason"
                                placeholder="e.g., Defective, Wrong size, Changed mind..."
                                value={returnReason}
                                onChange={(e) => setReturnReason(e.target.value)}
                                rows={2}
                            />
                        </div>

                        {/* Refund Method */}
                        <div className="space-y-2">
                            <Label htmlFor="refund-method">Refund Method</Label>
                            <Select value={refundMethod} onValueChange={setRefundMethod}>
                                <SelectTrigger id="refund-method">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="store_credit">Store Credit</SelectItem>
                                    <SelectItem value="card">Card</SelectItem>
                                    <SelectItem value="mobile">Mobile Money</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsReturnOpen(false)}
                            disabled={isCreatingReturn}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateReturn}
                            disabled={isCreatingReturn || selectedItems.size === 0}
                        >
                            {isCreatingReturn ? 'Creating...' : 'Create Return'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            )}
        </Dialog>
        
        {/* Settle Payment Dialog */}
        <Dialog open={isSettleOpen} onOpenChange={setIsSettleOpen}>
            {selectedSale && (
                <DialogContent className="sm:max-w-md">
                     <DialogHeader>
                        <DialogTitle>Settle Credit Payment</DialogTitle>
                        <DialogDescription>
                            Record a payment for sale <span className="font-mono text-xs">{selectedSale.id.substring(0, 12)}...</span>
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSettlePayment}>
                        <div className="py-4 space-y-4">
                            <div className="p-4 rounded-lg bg-muted">
                                <div className="flex justify-between">
                                    <span className="text-sm text-muted-foreground">Customer:</span>
                                    <span className="text-sm font-medium">{selectedSale.customerName}</span>
                                </div>
                                <div className="flex justify-between mt-2">
                                    <span className="text-sm text-muted-foreground">Amount Due:</span>
                                    <span className="text-sm font-bold">GH₵{(selectedSale.totalAmount - (selectedSale.amountSettled || 0)).toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="amount">Payment Amount</Label>
                                <Input id="amount" name="amount" type="number" step="0.01" min="0.01" max={(selectedSale.totalAmount - (selectedSale.amountSettled || 0))} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="method">Payment Method</Label>
                                <select id="method" name="method" className="w-full border rounded-md h-9 px-3">
                                    <option value="">Select method</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Card</option>
                                    <option value="Mobile">Mobile</option>
                                </select>
                            </div>
                        </div>
                         <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsSettleOpen(false)}>Cancel</Button>
                            <Button type="submit">Record Payment</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            )}
        </Dialog>
    </div>
  );
}
