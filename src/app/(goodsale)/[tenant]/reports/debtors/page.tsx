
'use client'
import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { useShiftContext } from "@/components/shift-manager";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Customer, Sale } from "@/lib/types";
import { ArrowLeft, UserMinus, DollarSign, Ban, CircleDollarSign } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useSettlePayment } from "@/hooks/use-settle-payment";

export default function DebtorsReportPage() {
    const { toast } = useToast();
    const params = useParams();
    const tenantSubdomain = params.tenant as string;
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSettleOpen, setIsSettleOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const shiftContext = useShiftContext();
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
        const fetchData = async () => {
            try {
                const [customersRes, salesRes] = await Promise.all([
                    fetch('/api/customers'),
                    fetch('/api/sales')
                ]);
                
                if (customersRes.ok) {
                    const customersData = await customersRes.json();
                    setCustomers(customersData);
                }
                if (salesRes.ok) {
                    const salesData = await salesRes.json();
                    setSales(salesData);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const {
        debtors,
        totalOutstanding,
        oldestDebtDays,
    } = useMemo(() => {
        const debtors = customers.filter(c => c.balance > 0).sort((a,b) => b.balance - a.balance);

        const totalOutstanding = debtors.reduce((acc, c) => acc + c.balance, 0);

        // Find the oldest unpaid/pending credit sale
        let oldestDebtDays = 0;
        if (debtors.length > 0 && sales.length > 0) {
            const creditSales = sales.filter(s => 
                s.paymentMethod === 'On Credit' && 
                s.status === 'Pending' &&
                debtors.some(d => d.id === s.customerId)
            );
            
            if (creditSales.length > 0) {
                const oldestSale = creditSales.sort((a, b) => 
                    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                )[0];
                
                const today = new Date();
                const saleDate = new Date(oldestSale.createdAt);
                oldestDebtDays = Math.floor((today.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
            }
        }

        return { debtors, totalOutstanding, oldestDebtDays };
    }, [customers, sales]);

    const openSettleDialog = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsSettleOpen(true);
    };

    const handleSettlePayment = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedCustomer) return;

        const formData = new FormData(event.currentTarget);
        const amount = parseFloat(formData.get('amount') as string);
        const method = String(formData.get('method') || '');

        if (isNaN(amount) || amount <= 0 || amount > selectedCustomer.balance) {
            toast({
                variant: 'destructive',
                title: 'Invalid Amount',
                description: `Please enter an amount between 0.01 and GH₵${selectedCustomer.balance.toFixed(2)}.`
            });
            return;
        }
        if (!['Cash','Card','Mobile'].includes(method)) {
            toast({ variant: 'destructive', title: 'Select a payment method' });
            return;
        }

        const result = await settlePayment({
            customerId: selectedCustomer.id,
            amount,
            method: method as 'Cash' | 'Card' | 'Mobile'
        });

        if (result) {
            toast({
                title: 'Payment Recorded',
                description: `GH₵${amount.toFixed(2)} via ${method} has been recorded for ${selectedCustomer.name}.`
            });
            setIsSettleOpen(false);
            setSelectedCustomer(null);
        }
    };

    return (
        <div className="grid gap-6">
            <PageHeader title="Debtors Report" description="A list of all customers with an outstanding balance.">
                <Link href={`/${tenantSubdomain}/reports`}>
                    <Button variant="outline" size="sm" className="h-7 gap-1">
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Back to Reports</span>
                    </Button>
                </Link>
            </PageHeader>
            <div className="grid gap-4 md:grid-cols-3">
                <StatCard 
                    title="Total Outstanding" 
                    value={`GH₵${totalOutstanding.toLocaleString()}`} 
                    icon={DollarSign}
                    changeType={totalOutstanding > 0 ? 'decrease' : 'increase'}
                />
                <StatCard 
                    title="Total Debtors" 
                    value={debtors.length.toString()}
                    icon={UserMinus} 
                />
                <StatCard 
                    title="Oldest Debt" 
                    value={`${oldestDebtDays} days`} 
                    icon={Ban}
                    change={oldestDebtDays > 30 ? 'Action required' : ''}
                    changeType={oldestDebtDays > 30 ? 'decrease' : undefined}
                />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Customers with Balances</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Customer</TableHead>
                                <TableHead className="text-right">Outstanding Balance</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {debtors.map(customer => (
                                <TableRow key={customer.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Image src={customer.avatarUrl || '/placeholder.png'} alt={customer.name} width={40} height={40} className="rounded-full aspect-square object-cover" />
                                            <div>
                                                <div className="font-medium">{customer.name}</div>
                                                <div className="text-sm text-muted-foreground">{customer.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className={cn("text-right font-bold", customer.balance > 1000 ? "text-destructive" : "text-yellow-600")}>
                                        GH₵{customer.balance.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openSettleDialog(customer)}
                                        >
                                            <CircleDollarSign className="mr-2 h-4 w-4" />
                                            Settle
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {debtors.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center h-24">No customers have an outstanding balance.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter>
                    <div className="text-xs text-muted-foreground">
                        Showing <strong>{debtors.length}</strong> debtors.
                    </div>
                </CardFooter>
            </Card>

            {/* Settle Payment Dialog */}
            <Dialog open={isSettleOpen} onOpenChange={setIsSettleOpen}>
                {selectedCustomer && (
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Settle Payment</DialogTitle>
                            <DialogDescription>
                                Record a payment for {selectedCustomer.name}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSettlePayment}>
                            <div className="py-4 space-y-4">
                                <div className="p-4 rounded-lg bg-muted">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-muted-foreground">Customer:</span>
                                        <span className="text-sm font-medium">{selectedCustomer.name}</span>
                                    </div>
                                    <div className="flex justify-between mt-2">
                                        <span className="text-sm text-muted-foreground">Current Balance:</span>
                                        <span className="text-sm font-bold text-destructive">GH₵{selectedCustomer.balance.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Payment Amount</Label>
                                    <Input
                                        id="amount"
                                        name="amount"
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={selectedCustomer.balance}
                                        required
                                        placeholder="Enter amount"
                                    />
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
                                <Button type="button" variant="outline" onClick={() => setIsSettleOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit">Record Payment</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    )
}
