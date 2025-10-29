import { Laptop } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GoodSaleLogo(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center justify-center gap-2", props.className)} {...props}>
      <Laptop className="h-7 w-7 text-primary" />
      <h1 className="font-headline text-2xl font-bold tracking-tighter text-primary">GoodSale</h1>
    </div>
  );
}
