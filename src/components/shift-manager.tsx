
'use client'
import { createContext, useState, useContext, useEffect, type ReactNode } from "react";
import { Button } from "./ui/button";
import { Clock } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import type { Shift, Sale } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { Separator } from "./ui/separator";
import { useSession } from "next-auth/react";

type ShiftContextType = {
    activeShift: Shift | null;
    startShift: (startingCash: number) => Promise<void>;
    closeShift: (actualCash: number) => Promise<void>;
    addSale: (sale: Sale) => Promise<void>;
};

export const ShiftContext = createContext<ShiftContextType | null>(null);

export function ShiftProvider({ children }: { children: ReactNode }) {
    const { toast } = useToast();
    const [activeShift, setActiveShift] = useState<Shift | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { data: session } = useSession();
    const currentUser = session?.user;
    
    // Load active shift on mount
    useEffect(() => {
        const loadActiveShift = async () => {
            if (!session?.user) {
                setIsLoading(false);
                return;
            }
            
            try {
                const response = await fetch('/api/shifts');
                if (response.ok) {
                    const shifts = await response.json();
                    // Find the most recent open shift for this user
                    const openShift = shifts.find((s: Shift) => 
                        s.status === 'open' && s.cashierId === session.user.id
                    );
                    if (openShift) {
                        setActiveShift(openShift);
                    }
                }
            } catch (error) {
                console.error('Error loading active shift:', error);
            } finally {
                setIsLoading(false);
            }
        };
        
        loadActiveShift();
    }, [session]);

    const addSale = async (sale: Sale) => {
        if (!activeShift) return;

        const updatedShift = { ...activeShift };
        updatedShift.totalSales += sale.totalAmount;
        switch(sale.paymentMethod) {
            case 'Cash': updatedShift.cashSales += sale.totalAmount; break;
            case 'Card': updatedShift.cardSales += sale.totalAmount; break;
            case 'Mobile': updatedShift.mobileSales += sale.totalAmount; break;
            case 'On Credit': updatedShift.creditSales += sale.totalAmount; break;
        }
        updatedShift.expectedCash = updatedShift.startingCash + updatedShift.cashSales;
        
        // Update in database
        try {
            await fetch('/api/shifts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: updatedShift.id,
                    cashSales: updatedShift.cashSales,
                    cardSales: updatedShift.cardSales,
                    mobileSales: updatedShift.mobileSales,
                    creditSales: updatedShift.creditSales,
                    totalSales: updatedShift.totalSales,
                    expectedCash: updatedShift.expectedCash
                })
            });
            setActiveShift(updatedShift);
        } catch (error) {
            console.error('Error updating shift:', error);
        }
    }

    const startShift = async (startingCash: number) => {
        if (!currentUser) {
            toast({ variant: 'destructive', title: "No User", description: "Cannot start a shift without a logged-in user."});
            return;
        }
        
        try {
            const response = await fetch('/api/shifts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startingCash })
            });
            
            if (!response.ok) {
                throw new Error('Failed to start shift');
            }
            
            const newShift = await response.json();
            setActiveShift(newShift);
            toast({ title: "Shift Started", description: `Your shift has begun with a cash float of GH₵${startingCash.toFixed(2)}.` });
        } catch (error) {
            console.error('Error starting shift:', error);
            toast({ variant: 'destructive', title: "Error", description: "Failed to start shift. Please try again." });
        }
    };

    const closeShift = async (actualCash: number) => {
        if (!activeShift) return;

        const cashDifference = actualCash - activeShift.expectedCash;
        
        try {
            const response = await fetch('/api/shifts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: activeShift.id,
                    status: 'closed',
                    endTime: new Date().toISOString(),
                    actualCash,
                    cashDifference,
                    cashSales: activeShift.cashSales,
                    cardSales: activeShift.cardSales,
                    mobileSales: activeShift.mobileSales,
                    creditSales: activeShift.creditSales,
                    totalSales: activeShift.totalSales,
                    expectedCash: activeShift.expectedCash
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to close shift');
            }
            
            setActiveShift(null);
            toast({ title: "Shift Closed", description: "Your shift has ended and the report has been generated." });
        } catch (error) {
            console.error('Error closing shift:', error);
            toast({ variant: 'destructive', title: "Error", description: "Failed to close shift. Please try again." });
        }
    };

    return (
        <ShiftContext.Provider value={{ activeShift, startShift, closeShift, addSale }}>
            {children}
        </ShiftContext.Provider>
    );
}


export function ShiftManager() {
    const { toast } = useToast();
    const context = useShiftContext();

    const [isStartShiftOpen, setIsStartShiftOpen] = useState(false);
    const [isCloseShiftOpen, setIsCloseShiftOpen] = useState(false);
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    
    const [startingCash, setStartingCash] = useState('');
    const [actualCash, setActualCash] = useState('');

    if (!context) {
        return null; // or a loading indicator
    }

    const { activeShift, startShift, closeShift } = context;

    const handleStartShift = () => {
        const cash = parseFloat(startingCash);
        if (isNaN(cash) || cash < 0) {
            toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid starting cash amount.' });
            return;
        }
        startShift(cash);
        setStartingCash('');
        setIsStartShiftOpen(false);
    }
    
    const handleCloseShift = () => {
        const cash = parseFloat(actualCash);
        if (isNaN(cash) || cash < 0) {
            toast({ variant: 'destructive', title: 'Invalid Amount', description: 'Please enter a valid actual cash amount.' });
            return;
        }
        closeShift(cash);
        setActualCash('');
        setIsCloseShiftOpen(false);
    }

    if (!activeShift) {
        return (
            <Dialog open={isStartShiftOpen} onOpenChange={setIsStartShiftOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                        <Clock className="mr-2 h-4 w-4" /> Start Shift
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Start New Shift</DialogTitle>
                        <DialogDescription>Enter your starting cash float to begin your shift.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label htmlFor="starting-cash">Starting Cash Float (GH₵)</Label>
                        <Input 
                            id="starting-cash"
                            type="number"
                            value={startingCash}
                            onChange={(e) => setStartingCash(e.target.value)}
                            placeholder="e.g., 200.00"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsStartShiftOpen(false)}>Cancel</Button>
                        <Button type="button" onClick={handleStartShift}>Start Shift</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }
    
    return (
        <Dialog open={isStatusOpen || isCloseShiftOpen} onOpenChange={(open) => {
            if (!open) {
                setIsStatusOpen(false);
                setIsCloseShiftOpen(false);
            }
        }}>
            <DialogTrigger asChild>
                <Button variant="secondary" size="sm" className="h-9" onClick={() => setIsStatusOpen(true)}>
                    <Clock className="mr-2 h-4 w-4 animate-pulse text-green-500" /> Shift Active
                </Button>
            </DialogTrigger>
            
            {/* Shift Status Dialog */}
            {isStatusOpen && !isCloseShiftOpen && (
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Active Shift Summary</DialogTitle>
                        <DialogDescription>
                            Your current shift started at {new Date(activeShift.startTime).toLocaleTimeString()}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <StatCard title="Starting Cash" value={`GH₵${activeShift.startingCash.toFixed(2)}`} />
                            <StatCard title="Total Sales" value={`GH₵${activeShift.totalSales.toFixed(2)}`} />
                        </div>
                        <div className="text-sm space-y-2">
                            <div className="flex justify-between"><span>Cash Sales:</span> <span>GH₵{activeShift.cashSales.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Card Sales:</span> <span>GH₵{activeShift.cardSales.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Mobile Sales:</span> <span>GH₵{activeShift.mobileSales.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>Credit Sales:</span> <span>GH₵{activeShift.creditSales.toFixed(2)}</span></div>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold">
                            <span>Expected Cash in Drawer:</span>
                            <span>GH₵{activeShift.expectedCash.toFixed(2)}</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsStatusOpen(false)}>Back to Work</Button>
                        <Button variant="destructive" onClick={() => { setIsStatusOpen(false); setIsCloseShiftOpen(true); }}>Close Shift</Button>
                    </DialogFooter>
                </DialogContent>
            )}

            {/* Close Shift Dialog */}
            {isCloseShiftOpen && (
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Close Shift & Reconcile</DialogTitle>
                        <DialogDescription>Count your cash and enter the final amount to close your shift.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <Card className="bg-muted/50">
                            <CardContent className="p-4">
                                <div className="flex justify-between font-bold text-lg">
                                    <span>Expected Cash in Drawer:</span>
                                    <span>GH₵{activeShift.expectedCash.toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Starting Float (GH₵{activeShift.startingCash.toFixed(2)}) + Cash Sales (GH₵{activeShift.cashSales.toFixed(2)})</p>
                            </CardContent>
                        </Card>
                        <div className="space-y-2">
                            <Label htmlFor="actual-cash">Actual Cash in Drawer (GH₵)</Label>
                            <Input
                                id="actual-cash"
                                type="number"
                                value={actualCash}
                                onChange={(e) => setActualCash(e.target.value)}
                                placeholder="Enter final counted amount"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCloseShiftOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleCloseShift} disabled={!actualCash}>End Shift & Generate Report</Button>
                    </DialogFooter>
                </DialogContent>
            )}
        </Dialog>
    );
}

const StatCard = ({ title, value }: { title: string; value: string; }) => (
    <div className="rounded-lg border bg-card text-card-foreground p-3">
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
);


// Hook to use the shift context
export const useShiftContext = () => {
    const context = useContext(ShiftContext);
    if (!context) {
        throw new Error("useShiftContext must be used within a ShiftProvider");
    }
    return context;
}
