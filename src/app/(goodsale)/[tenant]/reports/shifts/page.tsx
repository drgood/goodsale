
'use client';
import { useState, useEffect } from 'react';
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Shift } from "@/lib/types";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from '@/components/ui/separator';

export default function ShiftReportsPage() {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        const fetchShifts = async () => {
            try {
                const response = await fetch('/api/shifts');
                if (response.ok) {
                    const data = await response.json();
                    // Only show closed shifts
                    setShifts(data.filter((s: Shift) => s.status === 'closed'));
                }
            } catch (error) {
                console.error('Error fetching shifts:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchShifts();
    }, []);

    const openReportDetails = (shift: Shift) => {
        setSelectedShift(shift);
        setIsDetailsOpen(true);
    };

    return (
        <div className="flex flex-col gap-4">
            <PageHeader title="Shift Reports" description="Review end-of-day reports from all cashiers.">
                {/* Maybe add date filter here later */}
            </PageHeader>
            <Card>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cashier</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Total Sales</TableHead>
                                <TableHead className="text-right">Cash Difference</TableHead>
                                <TableHead>
                                    <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shifts.map((shift) => (
                                <TableRow key={shift.id}>
                                    <TableCell className="font-medium">{shift.cashierName}</TableCell>
                                    <TableCell>{new Date(shift.startTime).toLocaleDateString()}</TableCell>
                                    <TableCell className="text-right">GH₵{shift.totalSales.toFixed(2)}</TableCell>
                                    <TableCell className={cn("text-right font-medium",
                                        shift.cashDifference === 0 ? 'text-muted-foreground' :
                                        shift.cashDifference! > 0 ? 'text-green-600' : 'text-destructive'
                                    )}>
                                        {shift.cashDifference?.toFixed(2)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => openReportDetails(shift)}>View Details</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter>
                    <div className="text-xs text-muted-foreground">
                        Showing <strong>{shifts.length}</strong> of <strong>{shifts.length}</strong> shifts
                    </div>
                </CardFooter>
            </Card>

            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                {selectedShift && (
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Shift Report Details</DialogTitle>
                            <DialogDescription>
                                For {selectedShift.cashierName} on {new Date(selectedShift.startTime).toLocaleString()}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                             <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="text-muted-foreground">Shift Start</div>
                                <div>{new Date(selectedShift.startTime).toLocaleTimeString()}</div>
                                <div className="text-muted-foreground">Shift End</div>
                                <div>{selectedShift.endTime ? new Date(selectedShift.endTime).toLocaleTimeString() : 'N/A'}</div>
                            </div>
                            <Separator />
                             <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="text-muted-foreground">Total Sales</div>
                                <div className="font-bold">GH₵{selectedShift.totalSales.toFixed(2)}</div>
                                <div className="text-muted-foreground">Cash Sales</div>
                                <div>GH₵{selectedShift.cashSales.toFixed(2)}</div>
                                 <div className="text-muted-foreground">Card Sales</div>
                                <div>GH₵{selectedShift.cardSales.toFixed(2)}</div>
                                <div className="text-muted-foreground">Mobile Sales</div>
                                <div>GH₵{selectedShift.mobileSales.toFixed(2)}</div>
                                <div className="text-muted-foreground">Credit Sales</div>
                                <div>GH₵{selectedShift.creditSales.toFixed(2)}</div>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="text-muted-foreground">Starting Float</div>
                                <div>GH₵{selectedShift.startingCash.toFixed(2)}</div>
                                <div className="text-muted-foreground">Expected Cash</div>
                                <div>GH₵{selectedShift.expectedCash.toFixed(2)}</div>
                                <div className="text-muted-foreground">Actual Cash Counted</div>
                                <div>GH₵{selectedShift.actualCash ? selectedShift.actualCash.toFixed(2) : 'N/A'}</div>
                                 <div className="text-muted-foreground font-bold">Cash Difference</div>
                                <div className={cn("font-bold",
                                        selectedShift.cashDifference === 0 ? '' :
                                        (selectedShift.cashDifference || 0) > 0 ? 'text-green-600' : 'text-destructive'
                                    )}>GH₵{selectedShift.cashDifference ? selectedShift.cashDifference.toFixed(2) : 'N/A'}</div>
                            </div>
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
}
