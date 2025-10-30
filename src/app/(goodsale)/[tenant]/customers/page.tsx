
'use client';
import { useState, useMemo, useEffect } from 'react';
import Image from "next/image";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { tenants } from "@/lib/data";
import { MoreHorizontal, PlusCircle, Search, UserMinus } from "lucide-react";
import type { Customer, Sale } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function CustomersPage() {
    const { toast } = useToast();
    const params = useParams();
    const tenantSubdomain = params.tenant as string;
    const tenant = tenants.find(t => t.subdomain === tenantSubdomain);

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
    const [customerToView, setCustomerToView] = useState<Customer | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSettleBalanceOpen, setIsSettleBalanceOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
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
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to load customers."
            });
        } finally {
            setIsLoading(false);
        }
    };

    const filteredCustomers = useMemo(() => {
        return customers.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase())));
    }, [customers, searchTerm]);

    const customerSales = useMemo(() => {
        if (!customerToView) return [];
        return sales.filter(s => s.customerId === customerToView.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [customerToView, sales]);

    const handleAddCustomer = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        
        try {
            const response = await fetch('/api/customers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone })
            });

            if (response.ok) {
                await fetchData();
                setIsAddCustomerDialogOpen(false);
                form.reset();
                toast({ title: "Customer Added", description: `"${name}" has been added.` });
            } else {
                throw new Error('Failed to create customer');
            }
        } catch (error) {
            console.error('Error adding customer:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to add customer."
            });
        }
    };

    const openEditDialog = (customer: Customer) => {
        setCustomerToEdit(customer);
        setIsEditDialogOpen(true);
    };
    
    const openDetailsDialog = (customer: Customer) => {
        setCustomerToView(customer);
        setIsDetailsDialogOpen(true);
    };

    const handleEditCustomer = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!customerToEdit) return;

        const formData = new FormData(event.currentTarget);
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        
        try {
            const response = await fetch('/api/customers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: customerToEdit.id, name, email, phone })
            });

            if (response.ok) {
                await fetchData();
                setIsEditDialogOpen(false);
                setCustomerToEdit(null);
                toast({ title: "Customer Updated", description: `"${name}"'s information has been updated.` });
            } else {
                throw new Error('Failed to update customer');
            }
        } catch (error) {
            console.error('Error updating customer:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to update customer."
            });
        }
    };

    const confirmDeleteCustomer = (customer: Customer) => {
        setCustomerToDelete(customer);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteCustomer = async () => {
        if (!customerToDelete) return;
        
        try {
            const response = await fetch('/api/customers', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: customerToDelete.id })
            });

            if (response.ok) {
                await fetchData();
                toast({
                    variant: 'destructive',
                    title: "Customer Deleted",
                    description: `"${customerToDelete.name}" has been removed.`
                });
                setIsDeleteDialogOpen(false);
                setCustomerToDelete(null);
            } else {
                throw new Error('Failed to delete customer');
            }
        } catch (error) {
            console.error('Error deleting customer:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to delete customer."
            });
        }
    };
    
    const handleSettleBalance = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!customerToView) return;

        const formData = new FormData(event.currentTarget);
        const amount = parseFloat(formData.get('amount') as string);
        
        if (isNaN(amount) || amount <= 0 || amount > customerToView.balance) {
            toast({
                variant: 'destructive',
                title: 'Invalid Amount',
                description: `Please enter an amount between 0.01 and ${customerToView.balance.toFixed(2)}.`
            });
            return;
        }

        const newBalance = customerToView.balance - amount;

        try {
            // Update customer balance in database
            const response = await fetch('/api/customers', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: customerToView.id,
                    balance: newBalance
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update customer balance');
            }

            // Update local state after successful database update
            const updatedCustomer = { ...customerToView, balance: newBalance };
            setCustomers(customers.map(c => c.id === customerToView.id ? updatedCustomer : c));
            setCustomerToView(updatedCustomer);

            toast({
                title: 'Payment Recorded',
                description: `GH₵${amount.toFixed(2)} has been credited to ${customerToView.name}'s balance.`
            });
            
            setIsSettleBalanceOpen(false);
            if (newBalance <= 0) {
                setIsDetailsDialogOpen(false);
            }
        } catch (error) {
            console.error('Error settling balance:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to record payment. Please try again.'
            });
        }
    }
    
  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading customers...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Customers" description="Manage your customer database.">
        <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search customers..." 
                className="pl-10" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Link href={`/${tenantSubdomain}/reports/debtors`}>
                <Button variant="outline" className="h-10 gap-1">
                    <UserMinus className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">View Debtors</span>
                </Button>
            </Link>
            <Dialog open={isAddCustomerDialogOpen} onOpenChange={setIsAddCustomerDialogOpen}>
                <DialogTrigger asChild>
                    <Button size="sm" className="h-10 gap-1">
                        <PlusCircle className="h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Customer</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                    <DialogTitle>Add New Customer</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to add a new customer.
                    </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleAddCustomer} className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Name</Label>
                            <Input id="name" name="name" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">Email</Label>
                            <Input id="email" name="email" type="email" className="col-span-3" required />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">Phone</Label>
                            <Input id="phone" name="phone" className="col-span-3" />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddCustomerDialogOpen(false)}>Cancel</Button>
                            <Button type="submit">Save Customer</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
      </PageHeader>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Avatar</span>
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Balance</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt={customer.name}
                      className="aspect-square rounded-full object-cover"
                      height="64"
                      src={customer.avatarUrl || '/placeholder.png'}
                      width="64"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                      <div>{customer.name}</div>
                      <div className="text-sm text-muted-foreground">{customer.email}</div>
                  </TableCell>
                  <TableCell className={cn("hidden md:table-cell font-medium", customer.balance > 0 && "text-destructive")}>
                    GH₵{customer.balance.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">GH₵{customer.totalSpent.toLocaleString()}</TableCell>
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
                        <DropdownMenuItem onSelect={() => openDetailsDialog(customer)}>View Details</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => openEditDialog(customer)}>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onSelect={() => confirmDeleteCustomer(customer)}>Delete</DropdownMenuItem>
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
            Showing <strong>1-{filteredCustomers.length}</strong> of <strong>{customers.length}</strong> customers
          </div>
        </CardFooter>
      </Card>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Edit Customer: {customerToEdit?.name}</DialogTitle>
                <DialogDescription>
                    Update the customer&apos;s information below.
                </DialogDescription>
            </DialogHeader>
            {customerToEdit && (
                <form onSubmit={handleEditCustomer} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-name" className="text-right">Name</Label>
                        <Input id="edit-name" name="name" defaultValue={customerToEdit.name} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-email" className="text-right">Email</Label>
                        <Input id="edit-email" name="email" type="email" defaultValue={customerToEdit.email || ''} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-phone" className="text-right">Phone</Label>
                        <Input id="edit-phone" name="phone" defaultValue={customerToEdit.phone || ''} className="col-span-3" />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                </form>
            )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the customer
                    &quot;{customerToDelete?.name}&quot;.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Details Dialog */}
        <Dialog open={isDetailsDialogOpen} onOpenChange={(open) => {
            if(!open) setCustomerToView(null);
            setIsDetailsDialogOpen(open);
        }}>
            {customerToView && (
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Customer Details</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className='flex items-center gap-4'>
                                <Image
                                    alt={customerToView.name}
                                    className="aspect-square rounded-full object-cover"
                                    height="80"
                                    src={customerToView.avatarUrl || '/placeholder.png'}
                                    width="80"
                                />
                                <div className='space-y-1'>
                                    <h3 className='text-xl font-semibold'>{customerToView.name}</h3>
                                    <p className='text-sm text-muted-foreground'>{customerToView.email}</p>
                                    {customerToView.phone && <p className='text-sm text-muted-foreground'>{customerToView.phone}</p>}
                                </div>
                            </div>
                            {customerToView.balance > 0 && (
                                <Dialog open={isSettleBalanceOpen} onOpenChange={setIsSettleBalanceOpen}>
                                    <DialogTrigger asChild>
                                        <Button>Settle Balance</Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Settle Customer Balance</DialogTitle>
                                            <DialogDescription>Record a payment for {customerToView.name}.</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleSettleBalance}>
                                            <div className="py-4 space-y-4">
                                                <div className="p-4 rounded-lg bg-muted">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm text-muted-foreground">Current Balance:</span>
                                                        <span className="text-lg font-bold text-destructive">GH₵{customerToView.balance.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="settle-amount">Payment Amount</Label>
                                                    <Input id="settle-amount" name="amount" type="number" step="0.01" min="0.01" max={customerToView.balance} required placeholder="Enter amount to settle" />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button type="button" variant="outline" onClick={() => setIsSettleBalanceOpen(false)}>Cancel</Button>
                                                <Button type="submit">Record Payment</Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                        <Separator />
                        <div className="grid grid-cols-3 gap-2 text-sm">
                            <div><div className="text-muted-foreground">Joined On</div><div>{new Date(customerToView.joinedAt).toLocaleDateString()}</div></div>
                            <div><div className="text-muted-foreground">Total Spent</div><div>GH₵{customerToView.totalSpent.toLocaleString()}</div></div>
                            <div>
                                <div className="text-muted-foreground font-medium">Outstanding Balance</div>
                                <div className={cn("font-semibold", customerToView.balance > 0 && "text-destructive")}>GH₵{customerToView.balance.toFixed(2)}</div>
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h4 className="font-medium mb-2">Purchase History</h4>
                            <ScrollArea className="h-64">
                                {customerSales.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Sale ID</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {customerSales.map(sale => (
                                                <TableRow key={sale.id}>
                                                    <TableCell className="font-mono text-xs">{sale.id.substring(0, 12)}...</TableCell>
                                                    <TableCell>{new Date(sale.createdAt).toLocaleDateString()}</TableCell>
                                                    <TableCell className="text-right">GH₵{sale.totalAmount.toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-8">This customer has no purchase history.</p>
                                )}
                            </ScrollArea>
                        </div>
                    </div>
                </DialogContent>
            )}
        </Dialog>

    </div>
  );
}
    

