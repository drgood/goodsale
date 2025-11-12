'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import type { Sale } from '@/lib/types';

export default function AwaitingCollectionPage() {
    const { toast } = useToast();
    const { data: session } = useSession();
    const [awaitingCollectionSales, setAwaitingCollectionSales] = useState<Sale[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSales = async () => {
            if (!session?.user) return;
            try {
                setIsLoading(true);
                const response = await fetch('/api/awaiting-collection');
                if (response.ok) {
                    const data = await response.json();
                    setAwaitingCollectionSales(data);
                }
            } catch (error) {
                console.error('Error fetching awaiting collection sales:', error);
                toast({ variant: 'destructive', title: 'Error', description: 'Failed to load awaiting collection orders.' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchSales();
    }, [session, toast]);

    const handleMarkAsCompleted = async (saleId: string) => {
        try {
            const response = await fetch(`/api/awaiting-collection/${saleId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Completed' }),
            });
            if (!response.ok) throw new Error('Failed to update sale status');
            const sale = awaitingCollectionSales.find(s => s.id === saleId);
            setAwaitingCollectionSales(prev => prev.filter(s => s.id !== saleId));
            toast({ title: 'Order Completed', description: `Sale to ${sale?.customerName || 'customer'} has been marked as collected.` });
        } catch (error) {
            console.error('Error marking sale as completed:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not update the sale status.' });
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col gap-4">
                <PageHeader 
                    title="Awaiting Collection" 
                    description="Manage orders that have been paid for and are waiting for customer pickup." 
                />
                <Card>
                    <CardHeader>
                        <CardTitle>Pending Orders</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <PageHeader 
                title="Awaiting Collection" 
                description="Manage orders that have been paid for and are waiting for customer pickup." 
            />
            
            <Card>
                <CardHeader>
                    <CardTitle>Pending Orders</CardTitle>
                    <CardDescription>
                        {awaitingCollectionSales.length} order(s) are waiting to be collected by customers.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {awaitingCollectionSales.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-12 border-dashed border-2 rounded-lg">
                            <Package className="h-12 w-12 mb-4" />
                            <h3 className="text-lg font-semibold">All Orders Collected</h3>
                            <p>There are no pending orders awaiting collection at this time.</p>
                        </div>
                    ) : (
                        <Accordion type="single" collapsible className="w-full">
                            {awaitingCollectionSales.map(sale => (
                                <AccordionItem value={sale.id} key={sale.id}>
                                    <AccordionTrigger>
                                        <div className="flex justify-between w-full pr-4 items-center">
                                            <div>
                                                <p className="font-semibold">
                                                    {sale.customerName || "Walk-in Customer"}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(sale.createdAt).toLocaleString()} - {sale.itemCount} items
                                                </p>
                                            </div>
                                            <p className="font-bold text-lg">GH₵{sale.totalAmount.toFixed(2)}</p>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="p-4 bg-muted/50 rounded-md">
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                                {sale.items.map(item => (
                                                    <div key={item.productId} className="flex justify-between items-center text-sm">
                                                        <span>{item.productName}</span>
                                                        <span className="font-mono text-muted-foreground">x{item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <Button 
                                                className="w-full mt-4" 
                                                onClick={() => handleMarkAsCompleted(sale.id)}
                                            >
                                                <CheckCircle className="mr-2 h-4 w-4" />
                                                Mark as Collected
                                            </Button>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </CardContent>
                <CardFooter>
                    <div className="text-xs text-muted-foreground">
                        Showing <strong>{awaitingCollectionSales.length}</strong> pending order(s).
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
