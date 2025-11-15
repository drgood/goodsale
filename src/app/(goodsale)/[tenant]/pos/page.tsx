
'use client'
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Product, Sale, Customer, Invoice } from "@/lib/types";
import { Search, X, Plus, Minus, CreditCard, Banknote, Smartphone, Receipt, Hand, Trash2, Play, UserPlus, CircleUserRound, Clock, RotateCcw, FileText, Package } from "lucide-react";
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription as DialogDescriptionComponent,
    DialogFooter,
} from "@/components/ui/dialog";
import { DialogTrigger } from '@radix-ui/react-dialog';
import { ReceiptComponent } from '@/components/receipt';
import { useParams } from 'next/navigation';
import { useShiftContext } from '@/components/shift-manager';
import { useSettlePayment } from '@/hooks/use-settle-payment';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { db, cacheProducts } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useSession } from 'next-auth/react';

type CartItem = {
  product: Product;
  quantity: number;
};

type HeldSale = {
    id: string;
    items: CartItem[];
    heldAt: Date;
    customer?: Customer;
}

type PaymentMethod = 'Cash' | 'Card' | 'Mobile' | 'On Credit';
type DiscountType = 'percentage' | 'amount';

export default function POSPage() {
  const { toast } = useToast();
  const params = useParams();
  const tenantId = params.tenant as string;
  const { data: session } = useSession();
  const currentUser = session?.user;
  const shiftContext = useShiftContext();
  const isOnline = useOnlineStatus();
  
  // Fetch customers from API
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/customers');
        if (response.ok) {
          const data = await response.json();
          setCustomers(data);
        }
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };
    fetchCustomers();
  }, []);

  // Fetch recent sales for returns
  useEffect(() => {
    const fetchRecentSales = async () => {
      try {
        const response = await fetch('/api/sales');
        if (response.ok) {
          const data = await response.json();
          // Get last 10 sales from today
          const today = new Date().toDateString();
          const todaysSales = data.filter((sale: Sale) => 
            new Date(sale.createdAt).toDateString() === today
          ).slice(0, 10);
          setRecentSales(todaysSales);
        }
      } catch (error) {
        console.error('Error fetching recent sales:', error);
      }
    };
    fetchRecentSales();
  }, []);
  
  // Local state for products
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [taxRate, setTaxRate] = useState<number>(0);

  useEffect(() => {
    fetchProducts();
    fetchSettings();
  }, []);

  // Refetch products when coming back to the tab so product image/price changes are reflected
  useEffect(() => {
    const handleFocus = () => {
      fetchProducts();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // If we regain connectivity, refresh products to get latest images and stock
  useEffect(() => {
    if (isOnline) {
      fetchProducts();
    }
  }, [isOnline]);

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        // Cache for offline use
        if (isOnline) {
          await cacheProducts(data);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setTaxRate(data.taxRate || 0);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  // POS state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [discountValue, setDiscountValue] = useState(0);
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [isDiscountPopoverOpen, setIsDiscountPopoverOpen] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
  const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isCustomerSelectOpen, setIsCustomerSelectOpen] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [isAddCustomerDialogOpen, setIsAddCustomerDialogOpen] = useState(false);
  const [isAwaitingCollection, setIsAwaitingCollection] = useState(false);

  // Invoice dialog state
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null);
  const [createdInvoiceNumber, setCreatedInvoiceNumber] = useState<string | null>(null);

  // Settle receivable dialog
  const [isSettleDialogOpen, setIsSettleDialogOpen] = useState(false);

  // Return modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedSaleForReturn, setSelectedSaleForReturn] = useState<Sale | null>(null);
  const [returnItems, setReturnItems] = useState<Set<string>>(new Set());
  const [returnReason, setReturnReason] = useState('');
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);

  // Settlement hook
  const { settlePayment, isLoading: isSettling } = useSettlePayment({
    onCustomerUpdate: (customer) => {
      setCustomers(customers.map(c => c.id === customer.id ? customer : c));
      // Update selectedCustomer if it's the same one
      if (selectedCustomer && selectedCustomer.id === customer.id) {
        setSelectedCustomer(customer);
      }
    },
    onSuccess: (response) => {
      // Use unified shift refresh mechanism
      if (shiftContext?.refreshActiveShift) {
        shiftContext.refreshActiveShift();
      }
    },
    onError: (error) => {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    },
  });

  // Role helpers
  const isCashier = (currentUser?.role || '').toLowerCase() === 'cashier';

  // Dexie hooks for offline data
  const localProducts = useLiveQuery(() => db.products.toArray(), []);

  // Sync logic effect
  useEffect(() => {
    const syncData = async () => {
      if (isOnline) {
        // Sync offline sales
        const offlineSales = await db.offlineSales.toArray();
        if (offlineSales.length > 0) {
          console.log(`Syncing ${offlineSales.length} offline sales.`);
          
          // Sync each sale to the API
          for (const sale of offlineSales) {
            try {
              await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sale)
              });
            } catch (error) {
              console.error('Error syncing offline sale:', error);
            }
          }
          
          await db.offlineSales.clear();
          toast({
            title: 'Data Synced',
            description: `${offlineSales.length} offline sale(s) have been successfully synced.`
          });
        }
      }
    };
    syncData();
  }, [isOnline, toast]);

  const displayProducts = isOnline ? products : (localProducts || []);

  const addToCart = useCallback((product: Product) => {
    if (product.stock === 0) {
      toast({
        variant: "destructive",
        title: "Out of Stock",
        description: `"${product.name}" is currently unavailable.`,
      });
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          toast({
            variant: "destructive",
            title: "Stock Limit Reached",
            description: `You cannot add more of "${product.name}".`,
          });
          return prevCart;
        }
        return prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  }, [toast]);

  const updateQuantity = useCallback((productId: string, amount: number) => {
    setCart(cart => {
      const itemToUpdate = cart.find(item => item.product.id === productId);
      if (!itemToUpdate) return cart;
  
      const newQuantity = itemToUpdate.quantity + amount;
  
      if (newQuantity > itemToUpdate.product.stock) {
        toast({
          variant: "destructive",
          title: "Stock Limit Reached",
          description: `Only ${itemToUpdate.product.stock} units of "${itemToUpdate.product.name}" are available.`,
        });
        return cart;
      }
  
      if (newQuantity <= 0) {
        return cart.filter(item => item.product.id !== productId);
      }
  
      return cart.map(item =>
        item.product.id === productId ? { ...item, quantity: newQuantity } : item
      );
    });
  }, [toast]);

  const removeFromCart = (productId: string) => {
    setCart(cart => cart.filter(item => item.product.id !== productId));
  };
  
  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0), [cart]);
  const totalCost = useMemo(() => cart.reduce((acc, item) => acc + item.product.costPrice * item.quantity, 0), [cart]);

  const discountAmount = useMemo(() => {
    return discountType === 'percentage'
      ? subtotal * (discountValue / 100)
      : discountValue;
  }, [subtotal, discountValue, discountType]);


  const discountedSubtotal = subtotal - discountAmount;
  const tax = discountedSubtotal * (taxRate / 100);
  const total = discountedSubtotal + tax;
  const totalProfit = discountedSubtotal - totalCost;

  const resetSale = () => {
    setCart([]);
    setPaymentMethod(null);
    setDiscountValue(0);
    setDiscountType('percentage');
    setSelectedCustomer(null);
    setIsAwaitingCollection(false);
  }

  const handleCompleteSale = async () => {
    if (cart.length === 0) {
      toast({
        variant: "destructive",
        title: "Empty Cart",
        description: "Please add items to the cart before completing the sale.",
      });
      return;
    }
    
    if (!paymentMethod) {
      toast({
        variant: "destructive",
        title: "Payment Method Required",
        description: "Please select a payment method.",
      });
      return;
    }
    
    if (!currentUser) {
      toast({
        variant: "destructive",
        title: "Not Logged In",
        description: "You must be logged in to complete a sale.",
      });
      return;
    }

    if (paymentMethod === 'On Credit' && !selectedCustomer) {
        toast({
            variant: "destructive",
            title: "Customer Required",
            description: "Please select a customer to complete a credit sale.",
          });
        return;
    }

    // Determine sale status based on payment method and awaiting collection flag
    let saleStatus: 'Paid' | 'Pending' | 'Awaiting Collection' | 'Completed';
    if (paymentMethod === 'On Credit') {
      saleStatus = 'Pending';
    } else if (isAwaitingCollection) {
      saleStatus = 'Awaiting Collection';
    } else {
      saleStatus = 'Paid';
    }

    const newSale: Sale = {
      id: `s-${isOnline ? 'online' : 'offline'}-${Date.now()}`,
      tenantId: tenantId,
      cashierId: currentUser.id,
      cashierName: currentUser.name,
      totalAmount: total,
      totalProfit: totalProfit,
      itemCount: cart.reduce((acc, item) => acc + item.quantity, 0),
      paymentMethod: paymentMethod,
      status: saleStatus,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      createdAt: new Date().toISOString(),
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        costPrice: item.product.costPrice,
      })),
      discountPercentage: discountType === 'percentage' ? discountValue : undefined,
      discountAmount: discountAmount,
      shiftId: shiftContext?.activeShift?.id || 'unknown',
    };
    
    if (!isOnline) {
      await db.offlineSales.add(newSale);
      toast({ title: 'Sale Saved Offline', description: 'This sale will be synced when you reconnect.' });
    } else {
        try {
          console.log('Creating sale:', newSale);
          // Save sale to database via API
          const response = await fetch('/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSale)
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Sale creation failed:', response.status, errorText);
            throw new Error(`Failed to create sale: ${response.status} - ${errorText}`);
          }

          const savedSale = await response.json();
          
          // Refresh products to get updated stock
          const productsRes = await fetch('/api/products');
          if (productsRes.ok) {
            const productsData = await productsRes.json();
            setProducts(productsData);
          }

          // Update customer data if customer is selected
          if (selectedCustomer) {
            const updatedTotalSpent = selectedCustomer.totalSpent + total;
            const updateData: { id: string; totalSpent: number; balance?: number } = { 
              id: selectedCustomer.id, 
              totalSpent: updatedTotalSpent
            };
            
            // If credit sale, also update balance
            if (paymentMethod === 'On Credit') {
              const updatedBalance = selectedCustomer.balance + total;
              updateData.balance = updatedBalance;
            }
            
            const customerUpdateResponse = await fetch('/api/customers', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updateData)
            });
            
            if (customerUpdateResponse.ok) {
              // Refresh customers list to show updated data
              const customersRes = await fetch('/api/customers');
              if (customersRes.ok) {
                const customersData = await customersRes.json();
                setCustomers(customersData);
                
                // Update selected customer with new data
                const updatedCustomer = customersData.find((c: Customer) => c.id === selectedCustomer.id);
                if (updatedCustomer) {
                  setSelectedCustomer(updatedCustomer);
                }
              }
            }
          }

          shiftContext?.addSale(newSale);
          toast({
            title: `Sale ${newSale.status}!`,
            description: `Total: GH₵${total.toFixed(2)}. Paid with ${paymentMethod}.`,
          });
        } catch (error) {
          console.error('Error creating sale:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          toast({
            variant: 'destructive',
            title: 'Error',
            description: errorMessage
          });
          return;
        }
    }

    setLastCompletedSale(newSale);
    setIsReceiptDialogOpen(true);
    resetSale();
  };
  
  const handleHoldSale = () => {
    if (cart.length === 0) return;

    const newHeldSale: HeldSale = {
        id: `held-${Date.now()}`,
        items: cart,
        heldAt: new Date(),
        customer: selectedCustomer || undefined,
    };

    setHeldSales([...heldSales, newHeldSale]);
    resetSale();

    toast({
        title: "Sale Held",
        description: "The current sale has been saved. You can resume it later.",
    });
  };

  const handleResumeSale = (saleId: string) => {
    const saleToResume = heldSales.find(s => s.id === saleId);
    if (saleToResume) {
        if (cart.length > 0) {
            toast({
                variant: 'destructive',
                title: "Current Sale Active",
                description: "Please hold or complete the current sale before resuming another.",
            });
            return;
        }
        setCart(saleToResume.items);
        setSelectedCustomer(saleToResume.customer || null);
        setHeldSales(heldSales.filter(s => s.id !== saleId));
        toast({
            title: "Sale Resumed",
            description: "The held sale has been loaded into your cart.",
        });
    }
  };

  const handleDeleteHeldSale = (saleId: string) => {
    setHeldSales(heldSales.filter(s => s.id !== saleId));
    toast({
        title: "Held Sale Removed",
        description: "The held sale has been deleted.",
    });
  };

  const handleSetDiscount = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newDiscountType = formData.get('discountType') as DiscountType;
    const value = parseFloat(formData.get(newDiscountType) as string);
    
    if (isNaN(value) || value < 0) {
        toast({ variant: "destructive", title: "Invalid Input", description: "Please enter a positive number." });
        return;
    }

    if (newDiscountType === 'percentage' && value > 100) {
        toast({ variant: "destructive", title: "Invalid Discount", description: "Percentage cannot exceed 100." });
        return;
    }
    
    if (newDiscountType === 'amount' && value > subtotal) {
        toast({ variant: "destructive", title: "Invalid Discount", description: "Discount amount cannot exceed subtotal." });
        return;
    }

    setDiscountType(newDiscountType);
    setDiscountValue(value);
    setIsDiscountPopoverOpen(false);
  }
  
  const filteredProducts = useMemo(() => {
    return displayProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [displayProducts, searchTerm]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => c.name.toLowerCase().includes(customerSearchTerm.toLowerCase()) || (c.email && c.email.toLowerCase().includes(customerSearchTerm.toLowerCase())));
  }, [customers, customerSearchTerm]);
  
  const handleIssueInvoice = async () => {
    if (cart.length === 0) {
      toast({ variant: 'destructive', title: 'Empty Cart', description: 'Add items before issuing an invoice.' });
      return;
    }
    if (!selectedCustomer) {
      toast({ variant: 'destructive', title: 'Customer Required', description: 'Select a customer to issue an invoice.' });
      return;
    }
    try {
      const items = cart.map(ci => ({
        productId: ci.product.id,
        productName: ci.product.name,
        sku: ci.product.sku,
        quantity: ci.quantity,
        unitPrice: ci.product.price,
      }));
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenantId,
          customerId: selectedCustomer.id,
          items,
          discountAmount: discountAmount,
          taxRate: taxRate,
          dueDate: dueDate.toISOString(),
          notes: '',
          createdBy: currentUser?.id || null,
        })
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Failed to create invoice');
      }
      const data = await res.json();
      const inv = data.invoice as Invoice;
      setCreatedInvoiceId(inv.id);
      setCreatedInvoiceNumber(inv.invoiceNumber);
      setIsInvoiceDialogOpen(true);
      toast({ title: 'Invoice Created', description: `Invoice ${inv.invoiceNumber} issued for GH₵${inv.totalAmount.toFixed(2)}.` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unable to create invoice';
      toast({ variant: 'destructive', title: 'Error', description: msg });
    }
  };
  
  // Handle return process
  const handleProcessReturn = async () => {
    if (!selectedSaleForReturn || returnItems.size === 0) {
      toast({ variant: 'destructive', title: 'Invalid Return', description: 'Please select items to return.' });
      return;
    }

    setIsProcessingReturn(true);
    try {
      // Build return items array
      const itemsToReturn = selectedSaleForReturn.items
        .filter(item => returnItems.has(item.productId))
        .map(item => ({
          saleItemId: null, // POS returns don't have sale item IDs
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.price,
          condition: 'good'
        }));

      const returnData = {
        saleId: selectedSaleForReturn.id,
        customerId: selectedSaleForReturn.customerId || null,
        reason: returnReason || 'POS return during shift',
        items: itemsToReturn,
        // NOTE: No refundMethod - will be chosen by manager during approval
        // NOTE: No createdDuringShift - all returns require approval now
      };

      const response = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to process return');
      }

      const result = await response.json();
      
      toast({
        title: 'Return Created',
        description: 'Return request created and pending approval. Manager will review and process on the Returns page.'
      });
      
      // All returns are now pending - no immediate shift updates

      // Reset modal state
      setIsReturnModalOpen(false);
      setSelectedSaleForReturn(null);
      setReturnItems(new Set());
      setReturnReason('');
      
    } catch (error) {
      console.error('Return processing error:', error);
      toast({
        variant: 'destructive',
        title: 'Return Failed',
        description: error instanceof Error ? error.message : 'Unable to process return'
      });
    } finally {
      setIsProcessingReturn(false);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsCustomerSelectOpen(false);
  };
  
  const handleAddCustomer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone })
      });

      if (!response.ok) {
        throw new Error('Failed to create customer');
      }

      const newCustomer = await response.json();
      
      // Refresh customers list
      const customersRes = await fetch('/api/customers');
      if (customersRes.ok) {
        const customersData = await customersRes.json();
        setCustomers(customersData);
      }
      
      setSelectedCustomer(newCustomer);
      setIsAddCustomerDialogOpen(false);
      event.currentTarget.reset();
      toast({ title: "Customer Added", description: `"${newCustomer.name}" has been added and selected for this sale.` });
    } catch (error) {
      console.error('Error adding customer:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to add customer.'
      });
    }
  };

  // Guards after all hooks are declared
  if (!tenantId) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Tenant Not Found</CardTitle>
            <CardDescription>
              We couldn't determine which shop this POS belongs to. Please access POS from your tenant dashboard.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Not Signed In</CardTitle>
            <CardDescription>
              You must be signed in to use the Point of Sale. Please log in and try again.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!shiftContext?.activeShift) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
            <CardTitle className="font-headline text-2xl mt-4">No Active Shift</CardTitle>
            <CardDescription>
              You must start a shift before you can access the Point of Sale.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please use the Shift Manager in the header to start your shift.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="h-[calc(100vh-8rem)] grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search products by name or SKU..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ScrollArea className="flex-1 rounded-lg border">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
                {filteredProducts.map((product) => (
                    <Card key={product.id} onClick={() => addToCart(product)} className="cursor-pointer hover:shadow-lg transition-shadow relative">
                    <CardContent className="p-0">
                        <Image
                        src={product.imageUrl || '/placeholder.png'}
                        alt={product.name}
                        width={200}
                        height={200}
                        className={cn("aspect-square object-cover w-full rounded-t-lg", product.stock === 0 && "grayscale opacity-50")}
                        data-ai-hint={product.imageHint}
                        />
                        {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-t-lg">
                            <p className="text-white font-bold">Out of Stock</p>
                        </div>
                        )}
                    </CardContent>
                    <div className="p-2 text-sm">
                        <p className="font-semibold truncate">{product.name}</p>
                        <p className="text-muted-foreground">GH₵{product.price.toFixed(2)}</p>
                    </div>
                    </Card>
                ))}
            </div>
          </ScrollArea>
        </div>

        <div className="flex flex-col gap-4">
            <Card className="flex flex-col flex-1">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle className="font-headline">Current Sale</CardTitle>
                        <Dialog open={isCustomerSelectOpen} onOpenChange={setIsCustomerSelectOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8">
                                    {selectedCustomer ? <><CircleUserRound className="mr-2 h-4 w-4" />{selectedCustomer.name.split(' ')[0]}</> : <><UserPlus className="mr-2 h-4 w-4" /> Customer</>}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Select a Customer</DialogTitle>
                                </DialogHeader>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                    placeholder="Search by name or email..." 
                                    className="pl-10"
                                    value={customerSearchTerm}
                                    onChange={(e) => setCustomerSearchTerm(e.target.value)}
                                    />
                                </div>
                                <ScrollArea className="h-72">
                                    <div className="space-y-2">
                                    {filteredCustomers.map(customer => (
                                        <div key={customer.id} onClick={() => handleSelectCustomer(customer)} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer">
                                            <Image src={customer.avatarUrl || '/placeholder.png'} alt={customer.name} width={40} height={40} className="rounded-full aspect-square object-cover" />
                                            <div>
                                                <p className="font-medium">{customer.name}</p>
                                                <p className="text-sm text-muted-foreground">{customer.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                    </div>
                                </ScrollArea>
                                <DialogFooter className="!justify-between mt-2">
                                    {selectedCustomer && (
                                        <Button variant="ghost" className="text-destructive" onClick={() => setSelectedCustomer(null)}>Clear Selected</Button>
                                    )}
                                     <Dialog open={isAddCustomerDialogOpen} onOpenChange={setIsAddCustomerDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button variant="outline"><UserPlus className="mr-2 h-4 w-4" /> Add New</Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle>Add New Customer</DialogTitle>
                                                <DialogDescriptionComponent>
                                                    Fill in the details below to add a new customer.
                                                </DialogDescriptionComponent>
                                            </DialogHeader>
                                            <form onSubmit={handleAddCustomer} className="grid gap-4 py-4">
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="pos-add-name" className="text-right">Name</Label>
                                                    <Input id="pos-add-name" name="name" className="col-span-3" required />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="pos-add-email" className="text-right">Email</Label>
                                                    <Input id="pos-add-email" name="email" type="email" className="col-span-3" required />
                                                </div>
                                                <div className="grid grid-cols-4 items-center gap-4">
                                                    <Label htmlFor="pos-add-phone" className="text-right">Phone</Label>
                                                    <Input id="pos-add-phone" name="phone" className="col-span-3" />
                                                </div>
                                                <DialogFooter>
                                                    <Button type="button" variant="outline" onClick={() => setIsAddCustomerDialogOpen(false)}>Cancel</Button>
                                                    <Button type="submit">Add and Select</Button>
                                                </DialogFooter>
                                            </form>
                                        </DialogContent>
                                    </Dialog>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                    {selectedCustomer && (
                        <p className="text-sm text-muted-foreground -mt-2">
                            Balance: <span className={cn(selectedCustomer.balance > 0 && "text-destructive font-medium")}>
                                GH₵{selectedCustomer.balance.toFixed(2)}
                            </span>
                        </p>
                    )}
                </CardHeader>
            <ScrollArea className="flex-1">
                <CardContent className="space-y-4">
                {cart.length === 0 ? (
                    <p className="text-center text-muted-foreground py-10">Your cart is empty.</p>
                ) : (
                    cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-4">
                        <Image src={item.product.imageUrl || '/placeholder.png'} alt={item.product.name} width={40} height={40} className="rounded-md aspect-square object-cover" data-ai-hint={item.product.imageHint} />
                        <div className="flex-1">
                        <p className="text-sm font-medium">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">GH₵{item.product.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, -1)}><Minus className="h-3 w-3" /></Button>
                            <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.product.id, 1)}><Plus className="h-3 w-3" /></Button>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFromCart(item.product.id)}><X className="h-4 w-4 text-destructive" /></Button>
                    </div>
                )))}
                </CardContent>
            </ScrollArea>
            <div className="flex w-full gap-2 p-4 pt-0">
                <Button className="w-full" variant="secondary" onClick={() => setIsSettleDialogOpen(true)}>
                    <CircleUserRound className="mr-2 h-4 w-4"/> Settle Receivable
                </Button>
                <Button className="w-full" variant="outline" onClick={() => setIsReturnModalOpen(true)}>
                    <RotateCcw className="mr-2 h-4 w-4"/> Quick Return
                </Button>
            </div>
            {cart.length > 0 && (
                <CardFooter className="flex-col !p-4 !mt-auto border-t">
                    <div className="w-full space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>GH₵{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <div className='flex items-center'>
                                <span>Discount</span>
                                {discountValue > 0 && discountType === 'percentage' && <span className="ml-2 text-xs text-muted-foreground">({discountValue}%)</span>}
                            </div>
                            <Popover open={isDiscountPopoverOpen} onOpenChange={setIsDiscountPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="link" size="sm" className="p-0 h-auto text-primary" disabled={cart.length === 0}>
                                        {discountAmount > 0 ? `-GH₵${discountAmount.toFixed(2)}` : 'Add Discount'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80" align="end">
                                    <Tabs defaultValue={discountType} className="w-full">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="percentage">Percentage</TabsTrigger>
                                            <TabsTrigger value="amount">Amount</TabsTrigger>
                                        </TabsList>
                                        <form onSubmit={handleSetDiscount}>
                                            <TabsContent value="percentage">
                                                <Card>
                                                    <CardHeader className="p-4">
                                                        <Label htmlFor="percentage-discount">Discount (%)</Label>
                                                    </CardHeader>
                                                    <CardContent className="p-4 pt-0">
                                                        <Input id="percentage-discount" name="percentage" type="number" defaultValue={discountType === 'percentage' ? discountValue || '' : ''} min="0" max="100" step="1" />
                                                        <input type="hidden" name="discountType" value="percentage" />
                                                    </CardContent>
                                                </Card>
                                            </TabsContent>
                                            <TabsContent value="amount">
                                                <Card>
                                                    <CardHeader className="p-4">
                                                        <Label htmlFor="amount-discount">Discount Amount (GH₵)</Label>
                                                    </CardHeader>
                                                    <CardContent className="p-4 pt-0">
                                                        <Input id="amount-discount" name="amount" type="number" defaultValue={discountType === 'amount' ? discountValue || '' : ''} min="0" step="0.01" />
                                                        <input type="hidden" name="discountType" value="amount" />
                                                    </CardContent>
                                                </Card>
                                            </TabsContent>
                                            <Button type="submit" className="w-full mt-4">Apply Discount</Button>
                                        </form>
                                    </Tabs>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex justify-between">
                            <span>Tax</span>
                            <span>GH₵{tax.toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total</span>
                            <span>GH₵{total.toFixed(2)}</span>
                        </div>
                    </div>
                    <Separator className="my-4"/>
                    <div className="grid grid-cols-2 gap-2 w-full">
                        <Button variant={paymentMethod === 'Cash' ? 'default' : 'secondary'} size="sm" onClick={() => setPaymentMethod('Cash')}><Banknote className="mr-2 h-4 w-4"/>Cash</Button>
                        <Button variant={paymentMethod === 'Card' ? 'default' : 'secondary'} size="sm" onClick={() => setPaymentMethod('Card')}><CreditCard className="mr-2 h-4 w-4"/>Card</Button>
                        <Button variant={paymentMethod === 'Mobile' ? 'default' : 'secondary'} size="sm" onClick={() => setPaymentMethod('Mobile')}><Smartphone className="mr-2 h-4 w-4"/>Mobile</Button>
                        {!isCashier && (
                          <Button variant={paymentMethod === 'On Credit' ? 'default' : 'secondary'} size="sm" onClick={() => setPaymentMethod('On Credit')} disabled={!selectedCustomer}><CircleUserRound className="mr-2 h-4 w-4"/>On Credit</Button>
                        )}
                    </div>
                    {paymentMethod && paymentMethod !== 'On Credit' && (
                      <Button 
                        variant={isAwaitingCollection ? 'default' : 'outline'} 
                        size="sm" 
                        className="w-full mt-2"
                        onClick={() => setIsAwaitingCollection(!isAwaitingCollection)}
                      >
                        <Package className="mr-2 h-4 w-4" />
                        Customer will collect later
                      </Button>
                    )}
                    <div className="flex w-full gap-2 mt-2">
                        <Button className="w-full" variant="outline" disabled={cart.length === 0} onClick={handleHoldSale}>
                            <Hand className="mr-2 h-4 w-4"/> Hold Sale
                        </Button>
                        <Button className="w-full" variant="default" disabled={cart.length === 0 || !paymentMethod} onClick={handleCompleteSale}>
                            <Receipt className="mr-2 h-4"/> Complete Sale
                        </Button>
                    </div>
                    <div className="flex w-full gap-2 mt-2">
                        <Button className="w-full" variant="secondary" disabled={cart.length === 0 || !selectedCustomer} onClick={handleIssueInvoice}>
                            <FileText className="mr-2 h-4 w-4"/> Issue Invoice
                        </Button>
                    </div>
                </CardFooter>
            )}
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Held Sales</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-32">
                        {heldSales.length === 0 ? (
                             <p className="text-center text-sm text-muted-foreground py-4">No sales on hold.</p>
                        ) : (
                            <div className="space-y-3">
                                {heldSales.map(sale => (
                                    <div key={sale.id} className="flex items-center justify-between p-2 rounded-md border">
                                        <div>
                                            <p className="text-sm font-medium">Held at {sale.heldAt.toLocaleTimeString()}</p>
                                            <p className="text-xs text-muted-foreground">{sale.items.length} item(s) {sale.customer ? `for ${sale.customer.name}` : ''}</p>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="outline" size="sm" onClick={() => handleResumeSale(sale.id)}><Play className="h-4 w-4 mr-1"/> Resume</Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteHeldSale(sale.id)}><Trash2 className="h-4 w-4"/></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
      </div>

      <Dialog open={isReceiptDialogOpen} onOpenChange={(open) => {
        setIsReceiptDialogOpen(open);
        if (!open) {
          setLastCompletedSale(null);
        }
      }}>
        {lastCompletedSale && (
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Sale {lastCompletedSale.status}</DialogTitle>
                    <DialogDescriptionComponent>
                        The sale was processed successfully. You can now print the receipt.
                    </DialogDescriptionComponent>
                </DialogHeader>
                <ReceiptComponent sale={lastCompletedSale} />
            </DialogContent>
        )}
      </Dialog>

      {/* Settle Receivable Dialog */}
      <Dialog open={isSettleDialogOpen} onOpenChange={setIsSettleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Settle Receivable</DialogTitle>
            <DialogDescriptionComponent>
              Record a payment against a customer's outstanding balance.
            </DialogDescriptionComponent>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget as HTMLFormElement;
              const formData = new FormData(form);
              const customerId = (formData.get('customerId') as string) || selectedCustomer?.id || '';
              const amount = parseFloat((formData.get('amount') as string) || '0');
              const method = String(formData.get('method') || '');
              const customer = customers.find(c => c.id === customerId);

              if (!customerId || !customer) {
                toast({ variant: 'destructive', title: 'Select a customer' });
                return;
              }
              if (!['Cash','Card','Mobile'].includes(method)) {
                toast({ variant: 'destructive', title: 'Select a payment method' });
                return;
              }
              if (isNaN(amount) || amount <= 0 || amount > customer.balance) {
                toast({ variant: 'destructive', title: 'Invalid amount', description: `Enter between 0.01 and GH₵${customer.balance.toFixed(2)}.` });
                return;
              }

              const result = await settlePayment({
                customerId,
                amount,
                method: method as 'Cash' | 'Card' | 'Mobile'
              });

              if (result) {
                toast({ title: 'Payment Recorded', description: `Payment of GH₵${amount.toFixed(2)} via ${method} saved.` });
                setIsSettleDialogOpen(false);
              }
            }}
          >
            <div className="py-2 space-y-3">
              {!selectedCustomer && (
                <div className="space-y-1">
                  <Label htmlFor="settle-customer">Customer</Label>
                  <select id="settle-customer" name="customerId" className="w-full border rounded-md h-9 px-3">
                    <option value="">Select customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — Balance GH₵{c.balance.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {selectedCustomer && (
                <div className="text-sm p-3 rounded-md bg-muted">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customer</span>
                    <span className="font-medium">{selectedCustomer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Balance</span>
                    <span className="font-bold text-destructive">GH₵{selectedCustomer.balance.toFixed(2)}</span>
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="settle-amount">Payment Amount</Label>
                <Input id="settle-amount" name="amount" type="number" step="0.01" min="0.01" placeholder="0.00" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="settle-method">Payment Method</Label>
                <select id="settle-method" name="method" className="w-full border rounded-md h-9 px-3">
                  <option value="">Select method</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Mobile">Mobile</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsSettleDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSettling}>Record Payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Return Dialog */}
      <Dialog open={isReturnModalOpen} onOpenChange={(open) => {
        setIsReturnModalOpen(open);
        if (!open) {
          setSelectedSaleForReturn(null);
          setReturnItems(new Set());
          setReturnReason('');
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Quick Return</DialogTitle>
            <DialogDescriptionComponent>
              Process a return for a recent sale. Store credit will be applied to the customer's account.
            </DialogDescriptionComponent>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            {!selectedSaleForReturn ? (
              // Step 1: Select Sale
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Select Sale to Return</Label>
                  <p className="text-xs text-muted-foreground mt-1">Choose from today's sales:</p>
                </div>
                <ScrollArea className="h-64">
                  {recentSales.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No recent sales found.</p>
                  ) : (
                    <div className="space-y-2">
                      {recentSales.map(sale => {
                        const saleTime = new Date(sale.createdAt).toLocaleTimeString();
                        return (
                          <div
                            key={sale.id}
                            onClick={() => setSelectedSaleForReturn(sale)}
                            className="p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-sm">Sale at {saleTime}</p>
                                <p className="text-xs text-muted-foreground">
                                  {sale.customerName || 'Walk-in Customer'} • {sale.itemCount} items
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {sale.items.map(item => `${item.quantity}x ${item.productName}`).join(', ')}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-sm">GH₵{sale.totalAmount.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground capitalize">{sale.paymentMethod}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            ) : (
              // Step 2: Select Items & Process
              <div className="space-y-4 flex-1 overflow-hidden">
                <div>
                  <Label className="text-sm font-medium">Return Items</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sale: {new Date(selectedSaleForReturn.createdAt).toLocaleTimeString()} • 
                    {selectedSaleForReturn.customerName || 'Walk-in'} • 
                    GH₵{selectedSaleForReturn.totalAmount.toFixed(2)}
                  </p>
                </div>
                
                <ScrollArea className="flex-1">
                  <div className="space-y-3">
                    {selectedSaleForReturn.items.map(item => {
                      const isSelected = returnItems.has(item.productId);
                      return (
                        <div key={item.productId} className="flex items-center space-x-3 p-2 border rounded">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              const newReturnItems = new Set(returnItems);
                              if (checked) {
                                newReturnItems.add(item.productId);
                              } else {
                                newReturnItems.delete(item.productId);
                              }
                              setReturnItems(newReturnItems);
                            }}
                          />
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.productName}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity}x @ GH₵{item.price.toFixed(2)} = GH₵{(item.quantity * item.price).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                
                <div className="space-y-2">
                  <Label htmlFor="return-reason" className="text-sm font-medium">Reason (Optional)</Label>
                  <Textarea
                    id="return-reason"
                    placeholder="Enter reason for return..."
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    rows={2}
                  />
                </div>
                
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span>Refund Method:</span>
                    <span className="font-medium">Store Credit (Safe for POS)</span>
                  </div>
                  {returnItems.size > 0 && (
                    <div className="flex justify-between text-sm mt-1">
                      <span>Items Selected:</span>
                      <span className="font-medium">{returnItems.size} of {selectedSaleForReturn.items.length}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter className="mt-4">
            {!selectedSaleForReturn ? (
              <Button variant="outline" onClick={() => setIsReturnModalOpen(false)}>Cancel</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setSelectedSaleForReturn(null)}>Back</Button>
                <Button 
                  onClick={handleProcessReturn} 
                  disabled={returnItems.size === 0 || isProcessingReturn}
                >
                  {isProcessingReturn ? 'Processing...' : `Process Return (${returnItems.size} items)`}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Invoice Preview Dialog */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Invoice {createdInvoiceNumber || ''}</DialogTitle>
            <DialogDescriptionComponent>
              Preview and print/download the invoice.
            </DialogDescriptionComponent>
          </DialogHeader>
          {createdInvoiceId ? (
            <div className="space-y-3">
              <div className="h-[60vh] border rounded overflow-hidden">
                <iframe title="Invoice Preview" src={`/api/invoices/download?invoiceId=${createdInvoiceId}&format=html`} className="w-full h-full" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => window.open(`/api/invoices/download?invoiceId=${createdInvoiceId}&format=html`, '_blank')?.focus?.()}>Download/Print</Button>
                <Button onClick={() => {
                  const w = window.open(`/api/invoices/download?invoiceId=${createdInvoiceId}&format=html`, '_blank');
                  if (w) {
                    const trigger = () => { try { w.print(); } catch {} };
                    w.addEventListener('load', trigger, { once: true } as any);
                  }
                }}>Print</Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
