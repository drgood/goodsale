
'use client'
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Sale } from "@/lib/types";
import { Receipt } from "lucide-react";
import { GoodSaleLogo } from "./goodsale-logo";

type ReceiptProps = {
  sale: Sale;
};

export function ReceiptComponent({ sale }: ReceiptProps) {
  const handlePrint = () => {
    const printContent = document.getElementById("receipt-content");
    if (printContent) {
      const originalContents = document.body.innerHTML;
      document.body.innerHTML = printContent.innerHTML;
      window.print();
      document.body.innerHTML = originalContents;
      // We reload to re-initialize the React app state that was lost
      window.location.reload(); 
    }
  };

  const getSubtotal = (sale: Sale) => {
    return sale.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }

  const getTax = (sale: Sale) => {
    const subtotal = getSubtotal(sale);
    const discountAmount = sale.discountAmount || 0;
    return (subtotal - discountAmount) * 0.08;
  }

  return (
    <div className="bg-background text-foreground">
      <div id="receipt-content" className="p-4 print:p-0">
        <div className="text-center mb-6">
          <GoodSaleLogo className="mb-2" />
          <p className="text-sm">GShop Electronics</p>
          <p className="text-xs text-muted-foreground">123 Market St, San Francisco, CA</p>
        </div>
        <div className="text-xs mb-4">
          <p>Sale ID: <span className="font-mono">{sale.id}</span></p>
          <p>Date: {new Date(sale.createdAt).toLocaleString()}</p>
          <p>Cashier: {sale.cashierName}</p>
        </div>
        <Separator className="my-2" />
        <div className="space-y-2 text-xs">
          {sale.items.map(item => (
            <div key={item.productId} className="flex">
              <div className="flex-1">
                <p className="font-medium">{item.productName}</p>
                <p className="text-muted-foreground">
                  {item.quantity} x @ GH₵{item.price.toFixed(2)}
                </p>
              </div>
              <p className="font-medium">GH₵{(item.quantity * item.price).toFixed(2)}</p>
            </div>
          ))}
        </div>
        <Separator className="my-2" />
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>GH₵{getSubtotal(sale).toFixed(2)}</span>
          </div>
          {sale.discountAmount && sale.discountAmount > 0 ? (
            <div className="flex justify-between">
              <span>Discount {sale.discountPercentage ? `(${sale.discountPercentage}%)` : ''}</span>
              <span>- GH₵{sale.discountAmount.toFixed(2)}</span>
            </div>
          ): null}
          <div className="flex justify-between">
            <span>Tax (8%)</span>
            <span>GH₵{getTax(sale).toFixed(2)}</span>
          </div>
        </div>
        <Separator className="my-2" />
        <div className="flex justify-between font-bold text-sm mb-4">
          <span>Total</span>
          <span>GH₵{sale.totalAmount.toFixed(2)}</span>
        </div>
        <Separator className="my-2 border-dashed" />
        <div className="text-center text-xs text-muted-foreground mt-4">
            <p>Thank you for shopping with us!</p>
        </div>
      </div>
      <Button onClick={handlePrint} className="w-full mt-4 print:hidden" variant="default">
        <Receipt className="mr-2 h-4 w-4" /> Print Receipt
      </Button>
    </div>
  );
}
