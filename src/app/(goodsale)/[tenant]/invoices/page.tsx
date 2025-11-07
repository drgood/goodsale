'use client'

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToast } from '@/hooks/use-toast';
import { useShiftContext } from '@/components/shift-manager';
import type { Invoice, InvoiceItem, Product, Sale } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription as DialogDescriptionComponent } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, ArrowRightLeft } from 'lucide-react';

export default function InvoicesPage() {
  const params = useParams();
  const tenantId = params.tenant as string;
  const { data: session } = useSession();
  const currentUser = session?.user as any;
  const { toast } = useToast();
  const shiftContext = useShiftContext();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'Mobile' | 'On Credit' | ''>('');
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/invoices?tenantId=${tenantId}`);
        const data = await res.json();
        setInvoices(data.data || []);
      } catch (e) {
        console.error(e);
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load invoices' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tenantId, toast]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return invoices.filter(inv =>
      inv.invoiceNumber.toLowerCase().includes(q) ||
      (inv.customerName || '').toLowerCase().includes(q) ||
      inv.status.toLowerCase().includes(q)
    );
  }, [invoices, search]);

  const openPreview = (inv: Invoice) => {
    setSelected(inv);
    setIsPreviewOpen(true);
  };

  const openConvert = (inv: Invoice) => {
    setSelected(inv);
    setPaymentMethod('');
    setIsConvertOpen(true);
  };

  const handleConvert = async () => {
    if (!selected) return;
    if (!shiftContext?.activeShift) {
      toast({ variant: 'destructive', title: 'No Active Shift', description: 'Start a shift before converting to a sale.' });
      return;
    }
    if (!currentUser) {
      toast({ variant: 'destructive', title: 'Not Logged In' });
      return;
    }
    if (!paymentMethod) {
      toast({ variant: 'destructive', title: 'Select payment method' });
      return;
    }
    if (paymentMethod === 'On Credit' && !selected.customerId) {
      toast({ variant: 'destructive', title: 'Customer required', description: 'On Credit requires a customer on the invoice.' });
      return;
    }

    setConverting(true);
    try {
      // Fetch invoice items (JSON) via download route with format=json
      const invRes = await fetch(`/api/invoices/download?invoiceId=${selected.id}&format=json`);
      if (!invRes.ok) throw new Error('Failed to load invoice data');
      const invJson = await invRes.json();
      const inv: Invoice = invJson.invoice;

      // Fetch products to obtain costPrice for sale items
      const productsRes = await fetch('/api/products');
      const products: Product[] = productsRes.ok ? await productsRes.json() : [];
      const costById = new Map(products.map(p => [p.id, p.costPrice] as const));

      const items = (inv.items || []).map((it: InvoiceItem) => ({
        productId: it.productId || '',
        productName: it.productName,
        quantity: it.quantity,
        price: it.unitPrice,
        costPrice: typeof it.productId === 'string' && costById.has(it.productId) ? (costById.get(it.productId) as number) : 0,
      }));

      const sale: Sale = {
        id: `s-online-${Date.now()}`,
        tenantId: tenantId,
        cashierId: currentUser.id,
        cashierName: currentUser.name,
        totalAmount: inv.totalAmount,
        totalProfit: inv.totalAmount - items.reduce((acc, it) => acc + it.costPrice * it.quantity, 0),
        itemCount: items.reduce((acc, it) => acc + it.quantity, 0),
        paymentMethod: paymentMethod as any,
        status: paymentMethod === 'On Credit' ? 'Pending' : 'Paid',
        customerId: inv.customerId || undefined,
        customerName: inv.customerName || undefined,
        createdAt: new Date().toISOString(),
        items,
        discountPercentage: undefined,
        discountAmount: inv.discountAmount,
        shiftId: shiftContext.activeShift?.id || 'unknown',
        amountSettled: undefined,
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sale)
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || 'Failed to create sale from invoice');
      }

      // Mark invoice as Paid
      const patch = await fetch(`/api/invoices/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Paid' })
      });
      if (!patch.ok) {
        console.warn('Failed to update invoice status');
      }

      // Refresh list
      const refresh = await fetch(`/api/invoices?tenantId=${tenantId}`);
      const data = await refresh.json();
      setInvoices(data.data || []);

      // Update shift context summary
      shiftContext?.addSale?.(sale);

      toast({ title: 'Converted to Sale', description: `Invoice ${inv.invoiceNumber} converted with ${paymentMethod}.` });
      setIsConvertOpen(false);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Conversion failed', description: e instanceof Error ? e.message : 'Unknown error' });
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description="Manage and convert invoices to sales." />

      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle>All Invoices</CardTitle>
            <CardDescription>Search by number, customer, or status.</CardDescription>
          </div>
          <div className="w-64">
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6}>Loading...</TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground">No invoices found</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoiceNumber}</TableCell>
                      <TableCell>{inv.customerName || '—'}</TableCell>
                      <TableCell className="text-right">GH₵{inv.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={inv.status === 'Paid' ? 'default' : inv.status === 'Cancelled' ? 'destructive' : 'secondary'}>
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(inv.issueDate).toLocaleDateString()}</TableCell>
                      <TableCell className="space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openPreview(inv)}>
                          <FileText className="h-4 w-4 mr-1"/> View
                        </Button>
                        {inv.status !== 'Paid' && (
                          <Button size="sm" onClick={() => openConvert(inv)}>
                            <ArrowRightLeft className="h-4 w-4 mr-1"/> Convert
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Preview dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Invoice {selected?.invoiceNumber || ''}</DialogTitle>
            <DialogDescriptionComponent>Preview and print/download the invoice.</DialogDescriptionComponent>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <div className="h-[60vh] border rounded overflow-hidden">
                <iframe title="Invoice Preview" src={`/api/invoices/download?invoiceId=${selected.id}&format=html`} className="w-full h-full" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => window.open(`/api/invoices/download?invoiceId=${selected.id}&format=html`, '_blank')?.focus?.()}>Download/Print</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Convert dialog */}
      <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convert to Sale</DialogTitle>
            <DialogDescriptionComponent>Choose payment method and confirm conversion.</DialogDescriptionComponent>
          </DialogHeader>
          <div className="space-y-3">
            <div className="text-sm p-3 rounded bg-muted">
              <div className="flex justify-between"><span>Invoice</span><span className="font-medium">{selected?.invoiceNumber}</span></div>
              <div className="flex justify-between"><span>Total</span><span className="font-bold">GH₵{selected?.totalAmount.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Customer</span><span>{selected?.customerName || '—'}</span></div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="paymethod">Payment Method</Label>
              <select id="paymethod" className="w-full border rounded h-9 px-3" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}>
                <option value="">Select method</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Mobile">Mobile</option>
                <option value="On Credit" disabled={!selected?.customerId}>On Credit</option>
              </select>
            </div>
            {!shiftContext?.activeShift && (
              <p className="text-sm text-destructive">No active shift. Start a shift from the header before converting.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConvertOpen(false)}>Cancel</Button>
            <Button disabled={converting || !paymentMethod || !shiftContext?.activeShift} onClick={handleConvert}>{converting ? 'Converting...' : 'Convert'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
